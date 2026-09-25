import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Retrieve session cookie
  const sessionCookie = request.cookies.get('upishield_session')?.value
  let session: { role?: string; email?: string; token?: string } | null = null

  if (sessionCookie) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie))
    } catch {
      // In case session cookie is just a raw token string or invalid JSON
      session = null
    }
  }

  // 1. Protect Admin Routes (/admin/*)
  // Exclude /admin/login from protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session || session.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // If already logged in as admin, redirect from /admin/login to /admin/dashboard
  if (pathname === '/admin/login' && session?.role === 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // 2. Protect User Dashboard Routes (/dashboard/*)
  if (pathname.startsWith('/dashboard')) {
    if (!session || (session.role !== 'user' && session.role !== 'admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // If already logged in as user, redirect from /login to /dashboard
  if (pathname === '/login' && session && session.role === 'user') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
  ],
}
