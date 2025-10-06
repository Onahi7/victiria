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
      browser: body.browser,
      os: body.os,
      timeOnPage: body.timeOnPage,
      scrollDepth: body.scrollDepth,
      sessionId: body.sessionId,
      userId: body.userId,
      city: body.city,
      country: body.country,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      utmTerm: body.utmTerm,
      utmContent: body.utmContent,
    }

    await seoService.trackPageView(trackingData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking page view:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
