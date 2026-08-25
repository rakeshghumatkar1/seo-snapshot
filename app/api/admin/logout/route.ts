import { NextResponse } from 'next/server'
import {
  COOKIE_NAME,
  getAdminSessionCookieOptions,
} from '@/lib/admin/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  // Explicitly clear with matching path/attrs so the browser drops the persistent cookie
  response.cookies.set(COOKIE_NAME, '', {
    ...getAdminSessionCookieOptions(0),
    maxAge: 0,
  })
  return response
}
