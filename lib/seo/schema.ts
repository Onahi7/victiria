import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, boolean, decimal, jsonb, index, varchar, serial, uuid, integer } from 'drizzle-orm/pg-core'

export const seoSettings = pgTable('seo_settings', {
  id: serial('id').primaryKey(),
  pageType: varchar('page_type', { length: 50 }).notNull(),
  pageSlug: varchar('page_slug', { length: 255 }), // for specific pages like book slugs
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  keywords: jsonb('keywords').$type<string[]>().default([]),
  canonicalUrl: text('canonical_url'),
  ogTitle: varchar('og_title', { length: 255 }),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  ogType: varchar('og_type', { length: 50 }).default('website'),
  twitterCard: varchar('twitter_card', { length: 50 }).default('summary_large_image'),
  twitterSite: varchar('twitter_site', { length: 100 }),
  twitterCreator: varchar('twitter_creator', { length: 100 }),
  robotsIndex: boolean('robots_index').default(true),
  robotsFollow: boolean('robots_follow').default(true),
  structuredData: jsonb('structured_data'),
  priority: decimal('priority', { precision: 3, scale: 2 }).default('0.5'),
  changeFreq: varchar('change_freq', { length: 20 }).default('monthly'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastModified: timestamp('last_modified'),
}, (table) => ({
  pageTypeIdx: index('seo_settings_page_type_idx').on(table.pageType),
  pageSlugIdx: index('seo_settings_page_slug_idx').on(table.pageSlug),
  isActiveIdx: index('seo_settings_is_active_idx').on(table.isActive),
}))

export const seoRedirects = pgTable('seo_redirects', {
  id: serial('id').primaryKey(),
  fromUrl: text('from_url').notNull().unique(),
  toUrl: text('to_url').notNull(),
  statusCode: varchar('status_code', { length: 3 }).default('301'),
  isActive: boolean('is_active').default(true),
  hitCount: serial('hit_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  fromUrlIdx: index('seo_redirects_from_url_idx').on(table.fromUrl),
  isActiveIdx: index('seo_redirects_is_active_idx').on(table.isActive),
}))

export const seoAnalytics = pgTable('seo_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageUrl: text('page_url').notNull(),
  pageTitle: text('page_title'),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 15 }),
  userId: uuid('user_id'),
  sessionId: text('session_id'),
  deviceType: varchar('device_type', { length: 50 }),
  browser: varchar('browser', { length: 100 }),
  os: varchar('os', { length: 100 }),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  bounceRate: boolean('bounce_rate').default(false),
  timeOnPage: integer('time_on_page'),
  scrollDepth: integer('scroll_depth'),
  conversionGoal: varchar('conversion_goal', { length: 255 }),
  isConversion: boolean('is_conversion').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pageUrlIdx: index('seo_analytics_page_url_idx').on(table.pageUrl),
  createdAtIdx: index('seo_analytics_created_at_idx').on(table.createdAt),
  userIdIdx: index('seo_analytics_user_id_idx').on(table.userId),
  sessionIdIdx: index('seo_analytics_session_id_idx').on(table.sessionId),
}))

export const seoMetrics = pgTable('seo_metrics', {
  id: serial('id').primaryKey(),
  pageUrl: text('page_url').notNull(),
  date: timestamp('date').notNull(),
  organicTraffic: serial('organic_traffic').default(0),
  clickThroughRate: decimal('click_through_rate', { precision: 5, scale: 2 }).default('0.00'),
  averagePosition: decimal('average_position', { precision: 5, scale: 2 }).default('0.00'),
  impressions: serial('impressions').default(0),
  clicks: serial('clicks').default(0),
  bounceRate: decimal('bounce_rate', { precision: 5, scale: 2 }).default('0.00'),
  avgSessionDuration: serial('avg_session_duration').default(0),
  pageLoadTime: decimal('page_load_time', { precision: 5, scale: 2 }).default('0.00'),
  mobileUsability: decimal('mobile_usability', { precision: 5, scale: 2 }).default('0.00'),
  coreWebVitals: jsonb('core_web_vitals').$type<{
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pageUrlIdx: index('seo_metrics_page_url_idx').on(table.pageUrl),
  dateIdx: index('seo_metrics_date_idx').on(table.date),
  organicTrafficIdx: index('seo_metrics_organic_traffic_idx').on(table.organicTraffic),
}))

export const seoKeywords = pgTable('seo_keywords', {
  id: serial('id').primaryKey(),
  keyword: varchar('keyword', { length: 255 }).notNull(),
  pageUrl: text('page_url').notNull(),
  position: serial('position').default(0),
  searchVolume: serial('search_volume').default(0),
  competition: decimal('competition', { precision: 3, scale: 2 }).default('0.00'),
  cpc: decimal('cpc', { precision: 10, scale: 2 }).default('0.00'),
  difficulty: decimal('difficulty', { precision: 3, scale: 2 }).default('0.00'),
  isTracked: boolean('is_tracked').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  keywordIdx: index('seo_keywords_keyword_idx').on(table.keyword),
  pageUrlIdx: index('seo_keywords_page_url_idx').on(table.pageUrl),
  positionIdx: index('seo_keywords_position_idx').on(table.position),
  isTrackedIdx: index('seo_keywords_is_tracked_idx').on(table.isTracked),
}))

export const seoSitemaps = pgTable('seo_sitemaps', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  lastmod: timestamp('lastmod'),
  changefreq: varchar('changefreq', { length: 20 }).default('monthly'),
  priority: decimal('priority', { precision: 3, scale: 2 }).default('0.5'),
  pageType: varchar('page_type', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  urlIdx: index('seo_sitemaps_url_idx').on(table.url),
  pageTypeIdx: index('seo_sitemaps_page_type_idx').on(table.pageType),
  isActiveIdx: index('seo_sitemaps_is_active_idx').on(table.isActive),
  lastmodIdx: index('seo_sitemaps_lastmod_idx').on(table.lastmod),
}))

export type SEOSetting = typeof seoSettings.$inferSelect
export type NewSEOSetting = typeof seoSettings.$inferInsert
export type SEORedirect = typeof seoRedirects.$inferSelect
export type NewSEORedirect = typeof seoRedirects.$inferInsert
export type SEOAnalytics = typeof seoAnalytics.$inferSelect
export type NewSEOAnalytics = typeof seoAnalytics.$inferInsert
export type SEOMetrics = typeof seoMetrics.$inferSelect
export type NewSEOMetrics = typeof seoMetrics.$inferInsert
export type SEOKeyword = typeof seoKeywords.$inferSelect
export type NewSEOKeyword = typeof seoKeywords.$inferInsert
export type SEOSitemap = typeof seoSitemaps.$inferSelect
export type NewSEOSitemap = typeof seoSitemaps.$inferInsert
