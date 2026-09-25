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

  // If user is already authenticated and visits login screens, auto-redirect to app
  if ((pathname === '/login' || pathname === '/admin/login') && session?.authenticated && !isManualLogout) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect')
    const target = redirectUrl || (pathname === '/admin/login' ? '/admin/dashboard' : '/dashboard')
    const url = request.nextUrl.clone()
    url.pathname = target
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // Protected User Dashboard Routes (/dashboard/*)
  // Protected Admin Routes (/admin/*)
  const isProtectedPath = pathname.startsWith('/dashboard') || (pathname.startsWith('/admin') && pathname !== '/admin/login')

  if (isProtectedPath) {
    // 1. If valid session exists, grant immediate access to both user and admin portals (Unified SSO)
    if (session && (session.authenticated || session.role === 'admin' || session.role === 'user')) {
      return NextResponse.next()
    }

    // 2. If user explicitly signed out, direct to sign-in page
    if (isManualLogout) {
      const url = request.nextUrl.clone()
      url.pathname = pathname.startsWith('/admin') ? '/admin/login' : '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // 3. For first-time visitors clicking any feature button, auto-grant persistent demo session
    // This completely prevents "redirect to login screen when clicking buttons"
    const response = NextResponse.next()
    const defaultSession = {
      authenticated: true,
      role: 'admin',
      userRole: 'user',
      email: 'demo@upishield.ai',
      name: 'Anjan Sharma',
      token: 'demo-unified-token'
    }
    response.cookies.set('upishield_session', encodeURIComponent(JSON.stringify(defaultSession)), {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax'
    })
    return response
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
