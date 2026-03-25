import { NextRequest, NextResponse } from 'next/server'
import {
  verifyAdminPassword,
  generateSessionToken,
  COOKIE_NAME,
} from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      )
    }

    if (!verifyAdminPassword(password)) {
      await new Promise(r => setTimeout(r, 1000))
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    const token = generateSessionToken()

    const response = NextResponse.json({ success: true })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
