import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { dbQuery } from '@/lib/db/client'
import { RATE_LIMIT_MAX_REQUESTS } from '@/lib/rateLimit'

function maskIp(ip: string): string {
  const value = String(ip || '').trim()
  if (!value) return '—'
  if (value.includes(':')) {
    const parts = value.split(':').filter(Boolean)
    if (parts.length <= 2) return value
    return `${parts.slice(0, 2).join(':')}:…:${parts[parts.length - 1]}`
  }
  const parts = value.split('.')
  if (parts.length === 4) return `•••.•••.•••.${parts[3]}`
  return value.slice(0, 3) + '…'
}

function statusForCount(count: number): 'normal' | 'near' | 'limited' {
  if (count >= RATE_LIMIT_MAX_REQUESTS) return 'limited'
  if (count >= Math.ceil(RATE_LIMIT_MAX_REQUESTS * 0.8)) return 'near'
  return 'normal'
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [todayRows, activeRows, limitedRows, listRows] = await Promise.all([
      dbQuery(
        `SELECT
           COALESCE(SUM(request_count), 0)::int AS requests,
           COUNT(DISTINCT ip_address)::int AS unique_ips
         FROM rate_limits
         WHERE reset_at > NOW()
           AND first_request_at > NOW() - INTERVAL '24 hours'`
      ),
      dbQuery(
        `SELECT COUNT(*)::int AS total
         FROM rate_limits
         WHERE reset_at > NOW()`
      ),
      dbQuery(
        `SELECT COUNT(*)::int AS total
         FROM rate_limits
         WHERE reset_at > NOW()
           AND request_count >= $1`,
        [RATE_LIMIT_MAX_REQUESTS]
      ),
      dbQuery(
        `SELECT
           ip_address,
           request_count,
           first_request_at,
           reset_at,
           updated_at
         FROM rate_limits
         WHERE reset_at > NOW()
         ORDER BY request_count DESC, updated_at DESC
         LIMIT 100`
      ),
    ])

    const rows = (listRows || []).map((row: any) => {
      const count = Number(row.request_count || 0)
      return {
        identifier: maskIp(String(row.ip_address || '')),
        requests: count,
        limit: RATE_LIMIT_MAX_REQUESTS,
        status: statusForCount(count),
        firstRequestAt: row.first_request_at,
        resetAt: row.reset_at,
        lastActivityAt: row.updated_at,
      }
    })

    return NextResponse.json({
      summary: {
        requestsToday: Number(todayRows[0]?.requests || 0),
        uniqueIpsToday: Number(todayRows[0]?.unique_ips || 0),
        activeWindows: Number(activeRows[0]?.total || 0),
        currentlyLimited: Number(limitedRows[0]?.total || 0),
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowHours: 24,
      },
      rows,
    })
  } catch (err) {
    console.error('[Admin/rate-limits GET]', err)
    return NextResponse.json({ error: 'Failed to fetch rate limits' }, { status: 500 })
  }
}
