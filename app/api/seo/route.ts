import { NextRequest, NextResponse } from 'next/server'
import { seoService } from '@/lib/seo/service'
import { PAGE_TYPES, type PageType } from '@/lib/seo/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const typeParam = searchParams.get('type')
    const id = searchParams.get('id') // For dynamic pages like book/:id

    if (!page || !typeParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: page and type' },
        { status: 400 }
      )
    }

    // Validate that type is a valid PageType
    const validTypes = Object.values(PAGE_TYPES)
    if (!validTypes.includes(typeParam as any)) {
      return NextResponse.json(
        { error: 'Invalid page type' },
        { status: 400 }
      )
    }

    const type = typeParam as PageType
    const seoData = await seoService.getPageSEO(type, page, id ? { id } : undefined)

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
