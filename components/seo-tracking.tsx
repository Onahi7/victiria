"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface SEOTrackingProps {
  pageTitle?: string
  userId?: string
  sessionId?: string
  additionalData?: Record<string, any>
}

export default function SEOTracking({ 
  pageTitle, 
  userId, 
  sessionId, 
  additionalData 
}: SEOTrackingProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        const trackingData = {
          pageUrl: pathname,
          pageTitle: pageTitle || document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          sessionId: sessionId || generateSessionId(),
          userId: userId || null,
          timestamp: new Date().toISOString(),
          ...additionalData,
        }

        await fetch('/api/seo/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackingData),
        })
      } catch (error) {
        console.error('Error tracking page view:', error)
      }
    }

    // Track after a small delay to ensure page is loaded
    const timer = setTimeout(trackPageView, 1000)
    
    return () => clearTimeout(timer)
  }, [pathname, pageTitle, userId, sessionId, additionalData])

  return null
}

function generateSessionId() {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('seo-session-id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('seo-session-id', sessionId)
    }
    return sessionId
  }
  return null
}
