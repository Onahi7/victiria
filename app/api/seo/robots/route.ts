import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const robotsTxt = `
User-agent: *
Allow: /

# Sitemap
Sitemap: https://edifybooks.com/api/seo/sitemap

# Crawl delay
Crawl-delay: 1

# Disallow admin and private pages
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /account/
Disallow: /publishing/submissions/
Disallow: /404
Disallow: /500

# Allow important pages
Allow: /
Allow: /books/
Allow: /blog/
Allow: /academy/
Allow: /services/
Allow: /about/

# Cache control
Cache-Control: public, max-age=86400
`.trim()

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
