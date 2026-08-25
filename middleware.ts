import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/admin/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/api/admin/stats') ||
    pathname.startsWith('/api/admin/data') ||
    pathname.startsWith('/api/admin/leads') ||
    pathname.startsWith('/api/admin/export')
  ) {
    const session = req.cookies.get('admin_session')

    if (!session?.value || !verifySessionToken(session.value)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
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
    '/api/admin/export',
  ],
}
