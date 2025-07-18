"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { type PAGE_TYPES } from '@/lib/seo/config'

interface SEOMetadataProps {
  pageType: PAGE_TYPES
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  canonicalUrl?: string
  dynamicData?: Record<string, any>
  noindex?: boolean
  nofollow?: boolean
}

export default function SEOMetadata({
  pageType,
  title,
  description,
  keywords,
  image,
  canonicalUrl,
  dynamicData,
  noindex = false,
  nofollow = false
}: SEOMetadataProps) {
  const pathname = usePathname()
  const [seoData, setSEOData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        const response = await fetch(`/api/seo?page=${encodeURIComponent(pathname)}&type=${pageType}`)
        if (response.ok) {
          const data = await response.json()
          setSEOData(data)
        }
      } catch (error) {
        console.error('Error fetching SEO data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSEOData()
  }, [pathname, pageType])

  useEffect(() => {
    if (loading || !seoData) return

    // Update document title
    const finalTitle = title || seoData.title || 'EdifyPub'
    document.title = finalTitle

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description || seoData.description || '')
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      const finalKeywords = keywords || seoData.keywords || []
      metaKeywords.setAttribute('content', finalKeywords.join(', '))
    }

    // Update Open Graph tags
    updateMetaTag('property', 'og:title', finalTitle)
    updateMetaTag('property', 'og:description', description || seoData.description || '')
    updateMetaTag('property', 'og:image', image || seoData.image || '/placeholder.jpg')
    updateMetaTag('property', 'og:url', canonicalUrl || `https://edifybooks.com${pathname}`)
    updateMetaTag('property', 'og:type', getOGType(pageType))
    updateMetaTag('property', 'og:site_name', 'EdifyPub')

    // Update Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image')
    updateMetaTag('name', 'twitter:title', finalTitle)
    updateMetaTag('name', 'twitter:description', description || seoData.description || '')
    updateMetaTag('name', 'twitter:image', image || seoData.image || '/placeholder.jpg')
    updateMetaTag('name', 'twitter:site', '@edifypub')

    // Update canonical URL
    updateCanonicalUrl(canonicalUrl || `https://edifybooks.com${pathname}`)

    // Update robots meta tag
    const robotsContent = []
    if (noindex) robotsContent.push('noindex')
    if (nofollow) robotsContent.push('nofollow')
    if (robotsContent.length === 0) robotsContent.push('index', 'follow')
    updateMetaTag('name', 'robots', robotsContent.join(', '))

    // Add structured data
    if (seoData.structuredData) {
      addStructuredData(seoData.structuredData)
    }

  }, [loading, seoData, title, description, keywords, image, canonicalUrl, pathname, pageType, noindex, nofollow])

  return null
}

function updateMetaTag(attribute: string, name: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function updateCanonicalUrl(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

function addStructuredData(data: any) {
  // Remove existing structured data
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
  existingScripts.forEach(script => {
    if (script.getAttribute('data-seo') === 'true') {
      script.remove()
    }
  })

  // Add new structured data
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.setAttribute('data-seo', 'true')
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

function getOGType(pageType: PAGE_TYPES): string {
  switch (pageType) {
    case 'BOOK':
      return 'book'
    case 'BLOG':
      return 'article'
    case 'COURSE':
      return 'website'
    case 'AUTHOR':
      return 'profile'
    case 'HOME':
      return 'website'
    default:
      return 'website'
  }
}
