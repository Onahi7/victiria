import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Check for SEO redirects first
    try {
      const redirectResponse = await fetch(`${req.nextUrl.origin}/api/seo/redirect?from=${encodeURIComponent(pathname)}`, {
        method: 'GET',
      })
      
      if (redirectResponse.ok) {
        const redirectData = await redirectResponse.json()
        if (redirectData.toUrl) {
          return NextResponse.redirect(new URL(redirectData.toUrl, req.url), redirectData.statusCode || 301)
        }
      }
    } catch (error) {
      // Continue with normal processing if redirect check fails
      console.error('Error checking redirects:', error)
    }

    // Admin dashboard protection
    if (pathname.startsWith('/dashboard')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Customer account protection (includes author dashboard)
    if (pathname.startsWith('/account')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Community access (requires any authenticated user)
    if (pathname.startsWith('/community')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // API Route protections
    if (pathname.startsWith('/api/')) {
      // Admin-only API routes
      const adminApiRoutes = [
        '/api/admin/',
        '/api/analytics',
        '/api/users/admin',
        '/api/books/admin',
        '/api/orders/admin'
      ]
      
      if (adminApiRoutes.some(route => pathname.startsWith(route))) {
        if (!token || token.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Admin access required' },
            { status: 403 }
          )
        }
      }

      // User-protected API routes (require authentication)
      const protectedApiRoutes = [
        '/api/account/',
        '/api/wishlist',
        '/api/reviews',
        '/api/reading-progress',
        '/api/orders',
        '/api/publishing/',
        '/api/courses/enroll',
        '/api/events/register',
        '/api/users/profile',
        '/api/users/preferences',
        '/api/dashboard'
      ]

      if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
        if (!token) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          )
        }
      }

      // Author-specific API routes
      const authorApiRoutes = [
        '/api/publishing/submissions',
        '/api/publishing/dashboard',
        '/api/publishing/revenues',
        '/api/publishing/payouts'
      ]

      if (authorApiRoutes.some(route => pathname.startsWith(route))) {
        if (!token) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          )
        }
        if (token.role !== 'author' && token.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Author access required' },
            { status: 403 }
          )
        }
      }
    }

    // Track page views for SEO analytics (only for main pages)
    if (pathname.match(/^\/(?:books|blog|academy|about|contact|publishing|services)/)) {
      // This runs in the background, don't await it
      trackPageView(req)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/', '/books', '/services', '/academy', '/publishing', '/about',
          '/api/health', '/api/books', '/api/categories', '/api/search',
          '/api/events', '/api/courses', '/api/blog', '/api/auth', '/api/seo'
        ]
        
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Auth routes
        if (pathname.startsWith('/auth')) {
          return true
        }

        // API webhook routes (don't require user auth but may have other verification)
        if (pathname.startsWith('/api/webhooks/')) {
          return true
        }

        // Protected routes require authentication
        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/account') || 
            pathname.startsWith('/community') ||
            pathname.startsWith('/api/')) {
          return !!token
        }

        return true
      }
    }
  }
)

// Background function to track page views
async function trackPageView(req: any) {
  try {
    const userAgent = req.headers.get('user-agent') || ''
    const referrer = req.headers.get('referer') || ''
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIP || req.ip || ''
    
    // Simple device detection
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop'
    
    // Simple browser detection
    let browserName = 'unknown'
    if (userAgent.includes('Chrome')) browserName = 'chrome'
    else if (userAgent.includes('Firefox')) browserName = 'firefox'
    else if (userAgent.includes('Safari')) browserName = 'safari'
    else if (userAgent.includes('Edge')) browserName = 'edge'
    
    // Simple OS detection
    let osName = 'unknown'
    if (userAgent.includes('Windows')) osName = 'windows'
    else if (userAgent.includes('Mac')) osName = 'macos'
    else if (userAgent.includes('Linux')) osName = 'linux'
    else if (userAgent.includes('Android')) osName = 'android'
    else if (userAgent.includes('iOS')) osName = 'ios'

    fetch(`${req.nextUrl.origin}/api/seo/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageUrl: req.nextUrl.pathname,
        pageTitle: '', // This would be set from the client side
        referrer,
        userAgent,
        ipAddress,
        deviceType,
        browserName,
        osName,
        timestamp: new Date().toISOString(),
      }),
    }).catch(error => {
      // Silently fail analytics tracking
      console.error('Error tracking page view:', error)
    })
  } catch (error) {
    // Silently fail analytics tracking
    console.error('Error tracking page view:', error)
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*', 
    '/community/:path*',
    '/auth/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public|sitemap.xml|robots.txt).*)',
  ]
}
