import { NextRequest, NextResponse } from 'next/server'
import { SEOService } from '@/lib/seo/service'

export async function GET(request: NextRequest) {
  try {
    const seoService = new SEOService()
    const sitemap = await seoService.generateSitemap()

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body

    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs must be an array' },
        { status: 400 }
      )
    }

    const seoService = new SEOService()
    await seoService.updateSitemap(urls)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating sitemap:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
