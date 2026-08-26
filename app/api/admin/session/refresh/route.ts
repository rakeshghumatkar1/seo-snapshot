import { NextRequest, NextResponse } from 'next/server'
import {
  COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  authenticateSessionToken,
  getAdminSessionCookieOptions,
  refreshAdminSessionFromToken,
} from '@/lib/admin/auth'

export const runtime = 'nodejs'

/**
 * Lightweight session touch for Admin shell.
 * Extends DB expiry (and cookie) at most every ~12h of activity.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const auth = await authenticateSessionToken(token)
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized', reason: auth.reason }, { status: 401 })
  }

  const refreshed = await refreshAdminSessionFromToken(token)
  const response = NextResponse.json({
    success: true,
    extended: refreshed.shouldRefreshCookie,
  })

  // Always re-assert cookie maxAge on successful refresh call so browser expiry stays ~30d
  if (token) {
    response.cookies.set(
      COOKIE_NAME,
      token,
      getAdminSessionCookieOptions(SESSION_MAX_AGE_SECONDS)
    )
  }

  return response
}
