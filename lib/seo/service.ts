import { db } from '@/lib/db'
import { seoSettings, seoRedirects, seoAnalytics, seoMetrics, seoKeywords, seoSitemaps } from '@/lib/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { defaultSEOConfig, interpolateTemplate, generateSEOTags, type SEOData, type PageType } from './config'

class SEOService {
  // Get SEO settings for a specific page
  async getPageSEO(pageType: PageType, pageSlug?: string, dynamicData?: Record<string, any>): Promise<SEOData | null> {
    try {
      let seoSetting
      
      // First try to get specific page SEO (e.g., for specific book, blog post)
      if (pageSlug) {
        seoSetting = await db
          .select()
          .from(seoSettings)
          .where(
            and(
              eq(seoSettings.pageType, pageType),
              eq(seoSettings.pageSlug, pageSlug),
              eq(seoSettings.isActive, true)
            )
          )
          .limit(1)
      }

      // If no specific page SEO, get general page type SEO
      if (!seoSetting || seoSetting.length === 0) {
        seoSetting = await db
          .select()
          .from(seoSettings)
          .where(
            and(
              eq(seoSettings.pageType, pageType),
              sql`${seoSettings.pageSlug} IS NULL`,
              eq(seoSettings.isActive, true)
            )
          )
          .limit(1)
      }

      if (seoSetting && seoSetting.length > 0) {
        const setting = seoSetting[0]
        
        // Interpolate dynamic data into templates
        const title = dynamicData ? interpolateTemplate(setting.title, dynamicData) : setting.title
        const description = dynamicData ? interpolateTemplate(setting.description, dynamicData) : setting.description
        const ogTitle = setting.ogTitle && dynamicData ? interpolateTemplate(setting.ogTitle, dynamicData) : setting.ogTitle
        const ogDescription = setting.ogDescription && dynamicData ? interpolateTemplate(setting.ogDescription, dynamicData) : setting.ogDescription

        return {
          title,
          description,
          keywords: setting.keywords ? JSON.parse(setting.keywords as string) : [],
          canonicalUrl: setting.canonicalUrl || undefined,
          ogTitle: setting.ogTitle || undefined,
          ogDescription: setting.ogDescription || undefined,
          ogImage: setting.ogImage || undefined,
          ogType: setting.ogType as any,
          twitterCard: setting.twitterCard as any,
          twitterSite: setting.twitterSite || undefined,
          twitterCreator: setting.twitterCreator || undefined,
          robotsIndex: setting.robotsIndex ?? true,
          robotsFollow: setting.robotsFollow ?? true,
          structuredData: setting.structuredData ? JSON.parse(setting.structuredData as string) : undefined,
          priority: parseFloat(setting.priority || '0.5'),
          changeFreq: setting.changeFreq as any,
          lastModified: setting.lastModified || undefined,
        }
      }

      // Fallback to default config
      const defaultConfig = defaultSEOConfig[pageType]
      if (defaultConfig && dynamicData) {
        return {
          title: interpolateTemplate(defaultConfig.title || '', dynamicData),
          description: interpolateTemplate(defaultConfig.description || '', dynamicData),
          keywords: defaultConfig.keywords || [],
          canonicalUrl: defaultConfig.canonicalUrl,
          ogTitle: defaultConfig.ogTitle,
          ogDescription: defaultConfig.ogDescription,
          ogImage: defaultConfig.ogImage,
          ogType: defaultConfig.ogType || 'website',
          twitterCard: defaultConfig.twitterCard || 'summary_large_image',
          twitterSite: defaultConfig.twitterSite,
          twitterCreator: defaultConfig.twitterCreator,
          robotsIndex: defaultConfig.robotsIndex ?? true,
          robotsFollow: defaultConfig.robotsFollow ?? true,
          structuredData: defaultConfig.structuredData,
          priority: defaultConfig.priority || 0.5,
          changeFreq: defaultConfig.changeFreq || 'monthly',
          lastModified: defaultConfig.lastModified,
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching SEO settings:', error)
      return null
    }
  }

  // Create or update SEO settings
  async upsertSEOSettings(pageType: PageType, seoData: Partial<SEOData>, pageSlug?: string) {
    try {
      const existingSettings = await db
        .select()
        .from(seoSettings)
        .where(
          and(
            eq(seoSettings.pageType, pageType),
            pageSlug ? eq(seoSettings.pageSlug, pageSlug) : sql`${seoSettings.pageSlug} IS NULL`
          )
        )
        .limit(1)

      const settingsData = {
        pageType,
        pageSlug: pageSlug || null,
        title: seoData.title || '',
        description: seoData.description || '',
        keywords: seoData.keywords || [],
        canonicalUrl: seoData.canonicalUrl || null,
        ogTitle: seoData.ogTitle || null,
        ogDescription: seoData.ogDescription || null,
        ogImage: seoData.ogImage || null,
        ogType: seoData.ogType || 'website',
        twitterCard: seoData.twitterCard || 'summary_large_image',
        twitterSite: seoData.twitterSite || null,
        twitterCreator: seoData.twitterCreator || null,
        robotsIndex: seoData.robotsIndex ?? true,
        robotsFollow: seoData.robotsFollow ?? true,
        structuredData: seoData.structuredData || null,
        priority: seoData.priority?.toString() || '0.5',
        changeFreq: seoData.changeFreq || 'monthly',
        lastModified: seoData.lastModified || null,
        updatedAt: new Date(),
      }

      if (existingSettings.length > 0) {
        await db
          .update(seoSettings)
          .set(settingsData)
          .where(eq(seoSettings.id, existingSettings[0].id))
        return existingSettings[0].id
      } else {
        const result = await db.insert(seoSettings).values(settingsData).returning({ id: seoSettings.id })
        return result[0].id
      }
    } catch (error) {
      console.error('Error upserting SEO settings:', error)
      throw error
    }
  }

  // Track page analytics
  async trackPageView(data: {
    pageUrl: string
    pageTitle?: string
    referrer?: string
    userAgent?: string
    ipAddress?: string
    country?: string
    city?: string
    sessionId?: string
    userId?: string
    deviceType?: string
    browser?: string
    os?: string
    timeOnPage?: number
    scrollDepth?: number
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmTerm?: string
    utmContent?: string
  }) {
    try {
      await db.insert(seoAnalytics).values({
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle || null,
        referrer: data.referrer || null,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
        country: data.country || null,
        city: data.city || null,
        sessionId: data.sessionId || null,
        userId: data.userId || null,
        deviceType: data.deviceType || null,
        browser: data.browser || null,
        os: data.os || null,
        timeOnPage: data.timeOnPage || 0,
        scrollDepth: data.scrollDepth || 0,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmTerm: data.utmTerm || null,
        utmContent: data.utmContent || null,
      })
    } catch (error) {
      console.error('Error tracking page view:', error)
    }
  }

  // Get redirect by from URL
  async getRedirect(fromUrl: string) {
    try {
      const redirect = await db
        .select()
        .from(seoRedirects)
        .where(
          and(
            eq(seoRedirects.fromUrl, fromUrl),
            eq(seoRedirects.isActive, true)
          )
        )
        .limit(1)

      if (redirect.length > 0) {
        // Update hit count
        await db
          .update(seoRedirects)
          .set({ hitCount: sql`${seoRedirects.hitCount} + 1` })
          .where(eq(seoRedirects.id, redirect[0].id))

        return redirect[0]
      }

      return null
    } catch (error) {
      console.error('Error getting redirect:', error)
      return null
    }
  }

  // Create redirect
  async createRedirect(fromUrl: string, toUrl: string, statusCode: string = '301') {
    try {
      const result = await db.insert(seoRedirects).values({
        fromUrl,
        toUrl,
        statusCode,
        isActive: true,
      }).returning({ id: seoRedirects.id })

      return result[0].id
    } catch (error) {
      console.error('Error creating redirect:', error)
      throw error
    }
  }

  // Update sitemap
  async updateSitemap(urls: Array<{
    url: string
    lastmod?: Date
    changefreq?: string
    priority?: number
    pageType: string
  }>) {
    try {
      // Clear existing sitemap
      await db.delete(seoSitemaps)

      // Insert new sitemap entries
      if (urls.length > 0) {
        await db.insert(seoSitemaps).values(
          urls.map(item => ({
            url: item.url,
            lastmod: item.lastmod || new Date(),
            changefreq: item.changefreq || 'monthly',
            priority: item.priority?.toString() || '0.5',
            pageType: item.pageType,
            isActive: true,
          }))
        )
      }
    } catch (error) {
      console.error('Error updating sitemap:', error)
      throw error
    }
  }

  // Get sitemap data
  async getSitemap() {
    try {
      return await db
        .select()
        .from(seoSitemaps)
        .where(eq(seoSitemaps.isActive, true))
        .orderBy(asc(seoSitemaps.priority))
    } catch (error) {
      console.error('Error getting sitemap:', error)
      return []
    }
  }

  // Get analytics data
  async getAnalytics(
    pageUrl?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ) {
    try {
      let query = db.select().from(seoAnalytics)

      const conditions: any[] = []
      if (pageUrl) {
        conditions.push(eq(seoAnalytics.pageUrl, pageUrl))
      }
      if (startDate) {
        conditions.push(sql`${seoAnalytics.createdAt} >= ${startDate}`)
      }
      if (endDate) {
        conditions.push(sql`${seoAnalytics.createdAt} <= ${endDate}`)
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
      }

      const result = await query
        .orderBy(desc(seoAnalytics.createdAt))
        .limit(limit)

      return result
    } catch (error) {
      console.error('Error getting analytics:', error)
      return []
    }
  }

  // Get popular pages
  async getPopularPages(limit: number = 10) {
    try {
      return await db
        .select({
          pageUrl: seoAnalytics.pageUrl,
          pageTitle: seoAnalytics.pageTitle,
          views: sql<number>`count(*)`,
        })
        .from(seoAnalytics)
        .groupBy(seoAnalytics.pageUrl, seoAnalytics.pageTitle)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)
    } catch (error) {
      console.error('Error getting popular pages:', error)
      return []
    }
  }

  // Generate meta tags for Next.js
  generateMetaTags(seoData: SEOData, baseUrl: string = 'https://edifybooks.com') {
    return generateSEOTags(seoData, baseUrl)
  }

  // Delete SEO settings
  async deleteSEOSettings(id: string) {
    try {
      await db
        .delete(seoSettings)
        .where(eq(seoSettings.id, parseInt(id)))
    } catch (error) {
      console.error('Error deleting SEO settings:', error)
      throw error
    }
  }
}

export const seoService = new SEOService()

// Export the class for type usage
export { SEOService }
