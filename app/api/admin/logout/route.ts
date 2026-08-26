import { NextResponse } from 'next/server'
import {
  COOKIE_NAME,
  getAdminSessionCookieOptions,
  revokeCurrentAdminSession,
} from '@/lib/admin/auth'

export const runtime = 'nodejs'

export async function POST() {
  try {
    await revokeCurrentAdminSession()
  } catch (err: any) {
    console.error('[Auth] Logout revoke failed:', err?.message)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, '', {
    ...getAdminSessionCookieOptions(0),
    maxAge: 0,
  })
  return response
}
