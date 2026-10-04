import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Retrieve session cookie
  const sessionCookie = request.cookies.get('upishield_session')?.value
  let session: { authenticated?: boolean; role?: string; userRole?: string; email?: string; token?: string } | null = null

  if (sessionCookie) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie))
    } catch {
      session = null
    }
  }

  const isManualLogout = request.cookies.get('upishield_manual_logout')?.value === 'true'

  // Protected Admin Routes (/admin/*)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // If not authenticated or not admin, redirect to Admin Login
    if (!session || !session.authenticated || session.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // Protected User Dashboard Routes (/dashboard/*)
  if (pathname.startsWith('/dashboard')) {
    // If not authenticated, redirect to User Login
    if (!session || !session.authenticated) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/admin/login',
  ],
}
