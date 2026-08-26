import { NextRequest, NextResponse } from 'next/server'
import { authenticateSessionToken } from '@/lib/admin/authVerify'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/api/admin/stats') ||
    pathname.startsWith('/api/admin/data') ||
    pathname.startsWith('/api/admin/leads') ||
    pathname.startsWith('/api/admin/ratings') ||
    pathname.startsWith('/api/admin/rate-limits') ||
    pathname.startsWith('/api/admin/export')
  ) {
    const session = req.cookies.get('admin_session')
    const auth = await authenticateSessionToken(session?.value)

    if (!auth.ok) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/api/admin/stats',
    '/api/admin/data',
    '/api/admin/leads',
    '/api/admin/ratings',
    '/api/admin/rate-limits',
    '/api/admin/export',
  ],
}
