import { dbQuery } from '@/lib/db/client'

interface RateLimitEntry {
  count: number
  firstRequest: number
  resetAt: number
}

const WINDOW_MS = 24 * 60 * 60 * 1000  // 24 hours
const MAX_REQUESTS = 20

// In-memory store — fast, resets on redeploy
const memoryStore = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterMs: number
  retryAfterFormatted: string
}

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export async function checkRateLimit(
  ip: string
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `rate:${ip}`

  // Try DB first for cross-instance consistency
  const dbEntry = await getRateLimitFromDb(ip)
  if (dbEntry) {
    // Sync DB state into memory
    memoryStore.set(key, dbEntry)
  }

  // Try memory store first
  let entry = memoryStore.get(key)

  if (entry && Date.now() > entry.resetAt) {
    memoryStore.delete(key)
    entry = undefined
  }

  if (!entry || now > entry.resetAt) {
    // No entry or expired — create fresh
    entry = {
      count: 1,
      firstRequest: now,
      resetAt: now + WINDOW_MS,
    }
    memoryStore.set(key, entry)

    // Also sync to DB asynchronously
    syncToDb(ip, entry).catch(err =>
      console.error('[RateLimit] DB sync failed:', err?.message)
    )

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: entry.resetAt,
      retryAfterMs: 0,
      retryAfterFormatted: '',
    }
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterMs = entry.resetAt - now
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterMs,
      retryAfterFormatted: formatTimeRemaining(retryAfterMs),
    }
  }

  // Increment count
  entry.count += 1
  memoryStore.set(key, entry)

  // Sync to DB asynchronously
  syncToDb(ip, entry).catch(err =>
    console.error('[RateLimit] DB sync failed:', err?.message)
  )

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
    retryAfterMs: 0,
    retryAfterFormatted: '',
  }
}

async function syncToDb(
  ip: string,
  entry: RateLimitEntry
): Promise<void> {
  try {
    await dbQuery(
      `INSERT INTO rate_limits 
       (ip_address, request_count, first_request_at, reset_at)
       VALUES ($1, $2, to_timestamp($3 / 1000.0), to_timestamp($4 / 1000.0))
       ON CONFLICT (ip_address) 
       DO UPDATE SET
         request_count = $2,
         reset_at = to_timestamp($4 / 1000.0),
         updated_at = NOW()`,
      [ip, entry.count, entry.firstRequest, entry.resetAt]
    )
  } catch (err) {
    // DB failure is non-fatal — memory store still works
    console.error('[RateLimit] DB sync error:', err)
  }
}

export async function getRateLimitFromDb(
  ip: string
): Promise<RateLimitEntry | null> {
  try {
    const rows = await dbQuery(
      `SELECT request_count, 
        EXTRACT(EPOCH FROM first_request_at) * 1000 AS first_request,
        EXTRACT(EPOCH FROM reset_at) * 1000 AS reset_at
       FROM rate_limits
       WHERE ip_address = $1
         AND reset_at > NOW()`,
      [ip]
    )

    if (!rows.length) return null

    return {
      count: rows[0].request_count,
      firstRequest: Number(rows[0].first_request),
      resetAt: Number(rows[0].reset_at),
    }
  } catch (err) {
    console.error('[RateLimit] DB read error:', err)
    return null
  }
}
