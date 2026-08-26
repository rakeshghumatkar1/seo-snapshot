import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import {
  COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SESSION_TOUCH_THRESHOLD_HOURS,
} from '@/lib/admin/sessionConstants'
import {
  cleanupExpiredAdminSessions,
  insertAdminSession,
  revokeAdminSessionByHash,
  touchAdminSession,
} from '@/lib/admin/adminSessions'
import {
  authenticateSessionToken,
  isLegacyAdminSessionToken,
  sha256Hex,
  type AuthResult,
} from '@/lib/admin/authVerify'

export { COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/admin/sessionConstants'
export {
  authenticateSessionToken,
  isLegacyAdminSessionToken,
  sha256Hex,
  type AuthResult,
} from '@/lib/admin/authVerify'

export function getAdminSessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  }
}

export function verifyAdminPassword(password: string): boolean {
  if (!process.env.ADMIN_PASSWORD?.trim()) {
    console.error('[Auth] ADMIN_PASSWORD is not configured')
    return false
  }
  return password === process.env.ADMIN_PASSWORD
}

/** Opaque random session token (256-bit). Cookie stores plaintext; DB stores hash. */
export function generateOpaqueSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies()
  const session = cookieStore.get(COOKIE_NAME)
  const result = await authenticateSessionToken(session?.value)
  return result.ok
}

export async function createAdminSession(): Promise<string> {
  await cleanupExpiredAdminSessions().catch(() => {})
  const token = generateOpaqueSessionToken()
  const tokenHash = await sha256Hex(token)
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
  const row = await insertAdminSession({ tokenHash, expiresAt })
  if (!row) {
    throw new Error('Failed to create admin session')
  }
  return token
}

export async function revokeCurrentAdminSession(): Promise<void> {
  const cookieStore = cookies()
  const session = cookieStore.get(COOKIE_NAME)
  if (!session?.value) return
  if (isLegacyAdminSessionToken(session.value)) return
  const tokenHash = await sha256Hex(session.value)
  await revokeAdminSessionByHash(tokenHash)
}

/**
 * Sliding refresh: extend expires_at when last_seen is stale.
 */
export async function refreshAdminSessionFromToken(
  token: string | undefined | null
): Promise<{ ok: boolean; reason: AuthResult['reason']; shouldRefreshCookie: boolean }> {
  const auth = await authenticateSessionToken(token)
  if (!auth.ok || !auth.sessionId) {
    return { ok: false, reason: auth.reason, shouldRefreshCookie: false }
  }

  const touched = await touchAdminSession(auth.sessionId, {
    thresholdHours: SESSION_TOUCH_THRESHOLD_HOURS,
    extendSeconds: SESSION_MAX_AGE_SECONDS,
  })

  return {
    ok: true,
    reason: 'ok',
    shouldRefreshCookie: touched.extended,
  }
}

/** @deprecated Legacy insecure token — removed. */
export function generateSessionToken(): string {
  throw new Error('Legacy generateSessionToken removed — use createAdminSession()')
}

/** @deprecated Legacy verify — always false. */
export function verifySessionToken(_token: string): boolean {
  return false
}
