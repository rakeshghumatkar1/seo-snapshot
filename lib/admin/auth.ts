import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000

export function verifyAdminPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD
}

export function generateSessionToken(): string {
  const secret = process.env.ADMIN_SECRET || ''
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
    return age < SESSION_DURATION
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

export { COOKIE_NAME }
