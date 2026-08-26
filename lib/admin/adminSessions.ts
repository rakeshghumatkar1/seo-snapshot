import { dbQuery } from '@/lib/db/client'
import { SESSION_MAX_AGE_SECONDS } from '@/lib/admin/sessionConstants'

let schemaPromise: Promise<void> | null = null

export async function ensureAdminSessionsSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          token_hash TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ NULL
        )
      `)
      await dbQuery(`
        CREATE INDEX IF NOT EXISTS idx_admin_sessions_active_expires
        ON admin_sessions (expires_at)
        WHERE revoked_at IS NULL
      `)
    })().catch((err) => {
      schemaPromise = null
      throw err
    })
  }
  return schemaPromise
}

export type SessionLookupReason =
  | 'ok'
  | 'missing_cookie'
  | 'malformed_token'
  | 'session_not_found'
  | 'revoked'
  | 'expired'
  | 'db_error'

export type SessionRow = {
  id: string
  token_hash: string
  created_at: string
  last_seen_at: string
  expires_at: string
  revoked_at: string | null
}

export async function insertAdminSession(input: {
  tokenHash: string
  expiresAt: Date
}): Promise<SessionRow | null> {
  await ensureAdminSessionsSchema()
  const rows = await dbQuery(
    `INSERT INTO admin_sessions (token_hash, expires_at, last_seen_at)
     VALUES ($1, $2, NOW())
     RETURNING id, token_hash, created_at, last_seen_at, expires_at, revoked_at`,
    [input.tokenHash, input.expiresAt.toISOString()]
  )
  return (rows[0] as SessionRow) || null
}

export async function findAdminSessionByHash(
  tokenHash: string
): Promise<{ row: SessionRow | null; reason: SessionLookupReason }> {
  try {
    await ensureAdminSessionsSchema()
    const rows = await dbQuery(
      `SELECT id, token_hash, created_at, last_seen_at, expires_at, revoked_at
       FROM admin_sessions
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    )
    const row = (rows[0] as SessionRow) || null
    if (!row) return { row: null, reason: 'session_not_found' }
    if (row.revoked_at) return { row, reason: 'revoked' }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return { row, reason: 'expired' }
    }
    return { row, reason: 'ok' }
  } catch (err: any) {
    console.error('[AdminSession] lookup failed:', err?.message || err)
    return { row: null, reason: 'db_error' }
  }
}

/** Touch/extend session only if last_seen_at is older than thresholdHours. */
export async function touchAdminSession(
  sessionId: string,
  options?: { thresholdHours?: number; extendSeconds?: number }
): Promise<{ extended: boolean }> {
  await ensureAdminSessionsSchema()
  const thresholdHours = options?.thresholdHours ?? 12
  const extendSeconds = options?.extendSeconds ?? SESSION_MAX_AGE_SECONDS
  const rows = await dbQuery(
    `UPDATE admin_sessions
     SET last_seen_at = NOW(),
         expires_at = NOW() + ($2::int * INTERVAL '1 second')
     WHERE id = $1::uuid
       AND revoked_at IS NULL
       AND expires_at > NOW()
       AND last_seen_at < NOW() - ($3::int * INTERVAL '1 hour')
     RETURNING id`,
    [sessionId, extendSeconds, thresholdHours]
  )
  return { extended: rows.length > 0 }
}

export async function revokeAdminSessionByHash(tokenHash: string): Promise<boolean> {
  await ensureAdminSessionsSchema()
  const rows = await dbQuery(
    `UPDATE admin_sessions
     SET revoked_at = NOW()
     WHERE token_hash = $1
       AND revoked_at IS NULL
     RETURNING id`,
    [tokenHash]
  )
  return rows.length > 0
}

export async function cleanupExpiredAdminSessions(): Promise<void> {
  await ensureAdminSessionsSchema()
  await dbQuery(
    `DELETE FROM admin_sessions
     WHERE expires_at < NOW() - INTERVAL '7 days'
        OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days')`
  )
}
