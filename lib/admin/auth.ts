import { cookies } from 'next/headers'

export const COOKIE_NAME = 'admin_session'

/** Shared Admin session lifetime: 30 days (seconds). Cookie maxAge and token expiry both use this. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const SESSION_DURATION_MS = SESSION_MAX_AGE_SECONDS * 1000

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

export function generateSessionToken(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret?.trim()) {
    throw new Error('ADMIN_SECRET is not configured or is empty')
  }
  const timestamp = Date.now().toString()
  return Buffer.from(`${secret}:${timestamp}`).toString('base64')
}

export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [secret, timestamp] = decoded.split(':')

    if (secret !== process.env.ADMIN_SECRET) {
      return false
    }

    const age = Date.now() - Number(timestamp)
    return age >= 0 && age < SESSION_DURATION_MS
  } catch {
    return false
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies()
  const session = cookieStore.get(COOKIE_NAME)
  if (!session) return false
  return verifySessionToken(session.value)
}
