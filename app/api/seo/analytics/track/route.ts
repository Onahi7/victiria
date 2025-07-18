import { NextRequest, NextResponse } from 'next/server'
import { seoService } from '@/lib/seo/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const trackingData = {
      pageUrl: body.pageUrl,
      pageTitle: body.pageTitle,
      referrer: body.referrer,
      userAgent: body.userAgent,
      ipAddress: body.ipAddress,
      deviceType: body.deviceType,
      browserName: body.browserName,
      osName: body.osName,
      screenResolution: body.screenResolution,
      visitDuration: body.visitDuration,
      sessionId: body.sessionId,
      userId: body.userId,
      searchQuery: body.searchQuery,
      city: body.city,
      country: body.country,
    }

    await seoService.trackPageView(trackingData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking page view:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
