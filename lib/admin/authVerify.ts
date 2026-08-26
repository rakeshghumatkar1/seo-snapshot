import {
  findAdminSessionByHash,
  type SessionLookupReason,
} from '@/lib/admin/adminSessions'

export type AuthResult = {
  ok: boolean
  reason: SessionLookupReason
  sessionId?: string
}

/** SHA-256 hex — works in Node and Edge via Web Crypto. */
export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Detect legacy base64(ADMIN_SECRET:timestamp) cookies. Edge-safe. */
export function isLegacyAdminSessionToken(token: string): boolean {
  if (!token || /[-_]/.test(token)) return false
  try {
    const decoded =
      typeof atob === 'function'
        ? atob(token)
        : Buffer.from(token, 'base64').toString('utf-8')
    return /^.+:\d+$/.test(decoded)
  } catch {
    return false
  }
}

/**
 * Authenticate an opaque cookie token against admin_sessions.
 * Safe for Edge middleware (no Node crypto).
 */
export async function authenticateSessionToken(
  token: string | undefined | null
): Promise<AuthResult> {
  if (!token?.trim()) {
    return { ok: false, reason: 'missing_cookie' }
  }

  if (isLegacyAdminSessionToken(token)) {
    console.warn('[Auth] legacy_session_rejected')
    return { ok: false, reason: 'malformed_token' }
  }

  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) {
    return { ok: false, reason: 'malformed_token' }
  }

  const tokenHash = await sha256Hex(token)
  const { row, reason } = await findAdminSessionByHash(tokenHash)
  if (reason !== 'ok' || !row) {
    console.warn('[Auth] session_denied', { reason })
    return { ok: false, reason }
  }

  return { ok: true, reason: 'ok', sessionId: row.id }
}
