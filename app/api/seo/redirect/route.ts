import { NextRequest, NextResponse } from 'next/server'
import { seoService } from '@/lib/seo/service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromUrl = searchParams.get('from')

    if (!fromUrl) {
      return NextResponse.json({ error: 'Missing from URL parameter' }, { status: 400 })
    }

    const redirect = await seoService.getRedirect(fromUrl)
    
    if (redirect) {
      return NextResponse.json({
        toUrl: redirect.toUrl,
        statusCode: redirect.statusCode,
      })
    }

    return NextResponse.json({ toUrl: null })
  } catch (error) {
    console.error('Error checking redirect:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
