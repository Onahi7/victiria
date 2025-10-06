import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Skip SEO redirects for now to avoid fetch issues in middleware
    // TODO: Implement direct database check for redirects if needed

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

    // Skip page view tracking in middleware to avoid issues
    // TODO: Implement client-side tracking instead

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
