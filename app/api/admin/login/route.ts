import { NextRequest, NextResponse } from 'next/server'
import {
  verifyAdminPassword,
  createAdminSession,
  COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getAdminSessionCookieOptions,
} from '@/lib/admin/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    if (!verifyAdminPassword(password)) {
      await new Promise((r) => setTimeout(r, 1000))
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    let token: string
    try {
      token = await createAdminSession()
    } catch (err: any) {
      console.error('[Auth] Session creation failed:', err?.message)
      return NextResponse.json(
        { error: 'Server misconfiguration — admin access unavailable' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(
      COOKIE_NAME,
      token,
      getAdminSessionCookieOptions(SESSION_MAX_AGE_SECONDS)
    )
    return response
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
