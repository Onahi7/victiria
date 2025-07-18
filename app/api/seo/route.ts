import { NextRequest, NextResponse } from 'next/server'
import { SEOService } from '@/lib/seo/service'
import { PAGE_TYPES } from '@/lib/seo/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const type = searchParams.get('type') as PAGE_TYPES
    const id = searchParams.get('id') // For dynamic pages like book/:id

    if (!page || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: page and type' },
        { status: 400 }
      )
    }

    const seoService = new SEOService()
    const seoData = await seoService.getPageSEO(page, type, id)

    return NextResponse.json(seoData)
  } catch (error) {
    console.error('Error in SEO API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, type, seoData } = body

    if (!page || !type || !seoData) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const seoService = new SEOService()
    await seoService.upsertSEOSettings(page, type, seoData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating SEO data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')

    if (!page) {
      return NextResponse.json(
        { error: 'Missing required parameter: page' },
        { status: 400 }
      )
    }

    const seoService = new SEOService()
    await seoService.deleteSEOSettings(page)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting SEO data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
