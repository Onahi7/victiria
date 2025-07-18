"use client"

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { type PAGE_TYPES } from '@/lib/seo/config'

interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  canonicalUrl?: string
  noindex?: boolean
  nofollow?: boolean
  structuredData?: any
}

interface UseSEOOptions {
  pageType: PAGE_TYPES
  id?: string
  dynamicData?: Record<string, any>
  customConfig?: SEOConfig
}

export function useSEO({ pageType, id, dynamicData, customConfig }: UseSEOOptions) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [seoData, setSeoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: pathname,
          type: pageType,
        })

        if (id) {
          params.append('id', id)
        }

        const response = await fetch(`/api/seo?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setSeoData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching SEO data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSEOData()
  }, [pathname, pageType, id])

  const updateSEO = async (newSeoData: SEOConfig) => {
    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: pathname,
          type: pageType,
          seoData: newSeoData,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Refresh SEO data after update
      const params = new URLSearchParams({
        page: pathname,
        type: pageType,
      })

      if (id) {
        params.append('id', id)
      }

      const updatedResponse = await fetch(`/api/seo?${params.toString()}`)
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json()
        setSeoData(updatedData)
      }

      return { success: true }
    } catch (err) {
      console.error('Error updating SEO data:', err)
      return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  const trackPageView = async (additionalData?: Record<string, any>) => {
    try {
      const trackingData = {
        pageUrl: pathname,
        pageTitle: customConfig?.title || seoData?.title || document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString(),
        pageType,
        ...dynamicData,
        ...additionalData,
      }

      await fetch('/api/seo/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      })
    } catch (err) {
      console.error('Error tracking page view:', err)
    }
  }

  const generateMetaTags = () => {
    if (!seoData && !customConfig) return []

    const config = { ...seoData, ...customConfig }
    const metaTags = []

    // Basic meta tags
    if (config.title) {
      metaTags.push({ name: 'title', content: config.title })
    }
    if (config.description) {
      metaTags.push({ name: 'description', content: config.description })
    }
    if (config.keywords) {
      metaTags.push({ name: 'keywords', content: config.keywords.join(', ') })
    }

    // Open Graph tags
    if (config.title) {
      metaTags.push({ property: 'og:title', content: config.title })
    }
    if (config.description) {
      metaTags.push({ property: 'og:description', content: config.description })
    }
    if (config.image) {
      metaTags.push({ property: 'og:image', content: config.image })
    }
    if (config.canonicalUrl) {
      metaTags.push({ property: 'og:url', content: config.canonicalUrl })
    }

    // Twitter Card tags
    metaTags.push({ name: 'twitter:card', content: 'summary_large_image' })
    if (config.title) {
      metaTags.push({ name: 'twitter:title', content: config.title })
    }
    if (config.description) {
      metaTags.push({ name: 'twitter:description', content: config.description })
    }
    if (config.image) {
      metaTags.push({ name: 'twitter:image', content: config.image })
    }

    // Robots tag
    const robotsContent = []
    if (config.noindex) robotsContent.push('noindex')
    if (config.nofollow) robotsContent.push('nofollow')
    if (robotsContent.length === 0) robotsContent.push('index', 'follow')
    metaTags.push({ name: 'robots', content: robotsContent.join(', ') })

    return metaTags
  }

  const getStructuredData = () => {
    if (!seoData?.structuredData && !customConfig?.structuredData) return null
    return customConfig?.structuredData || seoData?.structuredData
  }

  return {
    seoData: { ...seoData, ...customConfig },
    loading,
    error,
    updateSEO,
    trackPageView,
    generateMetaTags,
    getStructuredData,
  }
}
