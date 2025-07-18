import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { seoService } from '@/lib/seo/service'
import { seoSchema } from '@/lib/seo/config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageType = searchParams.get('pageType')
    const pageSlug = searchParams.get('pageSlug')

    if (pageType) {
      const seoData = await seoService.getPageSEO(pageType as any, pageSlug || undefined)
      return NextResponse.json(seoData)
    }

    // Get all SEO settings
    const allSettings = await seoService.getAllSEOSettings()
    return NextResponse.json(allSettings)
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the SEO data
    const validatedData = seoSchema.parse(body)
    
    const id = await seoService.upsertSEOSettings(
      body.pageType,
      validatedData,
      body.pageSlug
    )

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error creating SEO settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the SEO data
    const validatedData = seoSchema.parse(body)
    
    await seoService.updateSEOSettings(
      body.id,
      validatedData
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
