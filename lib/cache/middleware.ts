import { NextRequest, NextResponse } from 'next/server'
import CacheService, { CACHE_CONFIG } from './redis'
import { auth } from '@/lib/auth'

export interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: NextRequest) => string
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean
  varyBy?: string[] // Headers to vary cache by
  private?: boolean // Whether cache is user-specific
}

/**
 * API Route Caching Middleware
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async function cachedHandler(req: NextRequest): Promise<NextResponse> {
    const {
      ttl = CACHE_CONFIG.TTL.MEDIUM,
      keyGenerator,
      shouldCache,
      varyBy = [],
      private: isPrivate = false
    } = options

    // Generate cache key
    let cacheKey: string
    if (keyGenerator) {
      cacheKey = keyGenerator(req)
    } else {
      cacheKey = await generateDefaultCacheKey(req, varyBy, isPrivate)
    }

    // Skip caching for certain conditions
    if (req.method !== 'GET' || req.headers.get('cache-control') === 'no-cache') {
      return handler(req)
    }

    try {
      // Try to get from cache
      const cached = await CacheService.get<{
        status: number
        headers: Record<string, string>
        body: any
      }>(cacheKey)

      if (cached) {
        // Return cached response
        return new NextResponse(JSON.stringify(cached.body), {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        })
      }

      // Execute original handler
      const response = await handler(req)
      
      // Check if we should cache this response
      if (shouldCache && !shouldCache(req, response)) {
        return response
      }

      // Cache successful responses
      if (response.status >= 200 && response.status < 300) {
        const responseBody = await response.text()
        let parsedBody: any

        try {
          parsedBody = JSON.parse(responseBody)
        } catch {
          parsedBody = responseBody
        }

        const cacheData = {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody
        }

        // Store in cache
        await CacheService.set(cacheKey, cacheData, ttl)

        // Return response with cache headers
        return new NextResponse(responseBody, {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey
          }
        })
      }

      return response

    } catch (error) {
      console.error('Cache middleware error:', error)
      return handler(req)
    }
  }
}

/**
 * Generate default cache key
 */
async function generateDefaultCacheKey(
  req: NextRequest,
  varyBy: string[] = [],
  isPrivate: boolean = false
): Promise<string> {
  const url = new URL(req.url)
  let key = `api:${url.pathname}:${url.search}`

  // Add user ID for private cache
  if (isPrivate) {
    try {
      const session = await auth()
      if (session?.user?.id) {
        key = `user:${session.user.id}:${key}`
      }
    } catch {
      // If we can't get session, treat as public
    }
  }

  // Add varying headers
  for (const header of varyBy) {
    const value = req.headers.get(header)
    if (value) {
      key += `:${header}:${value}`
    }
  }

  return key
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidation {
  
  /**
   * Invalidate cache for a specific resource
   */
  static async invalidateResource(resourceType: string, resourceId: string | number) {
    const patterns = [
      `*${resourceType}:${resourceId}*`,
      `*${resourceType}s*`, // Plural resource lists
      `user:*:*${resourceType}*` // User-specific caches
    ]

    for (const pattern of patterns) {
      await CacheService.delPattern(pattern)
    }
  }

  /**
   * Invalidate user-specific cache
   */
  static async invalidateUserCache(userId: string | number) {
    await CacheService.delPattern(`user:${userId}:*`)
  }

  /**
   * Invalidate all caches for a specific API endpoint
   */
  static async invalidateEndpoint(endpoint: string) {
    await CacheService.delPattern(`*api:${endpoint}*`)
  }

  /**
   * Invalidate recommendation caches
   */
  static async invalidateRecommendations(userId?: string | number) {
    if (userId) {
      await CacheService.delPattern(`*rec:*${userId}*`)
    } else {
      await CacheService.delPattern(`*rec:*`)
    }
  }

  /**
   * Invalidate search caches
   */
  static async invalidateSearch() {
    await CacheService.delPattern(`*search:*`)
  }

  /**
   * Invalidate analytics caches
   */
  static async invalidateAnalytics() {
    await CacheService.delPattern(`*analytics:*`)
  }
}

/**
 * Specific cache strategies for different endpoints
 */
export const CacheStrategies = {
  
  // Books and catalog data (changes rarely)
  BOOKS: {
    ttl: CACHE_CONFIG.TTL.LONG,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      return `${CACHE_CONFIG.KEYS.BOOK}list:${url.search}`
    }
  },

  // User-specific data
  USER_DATA: {
    ttl: CACHE_CONFIG.TTL.MEDIUM,
    private: true,
    varyBy: ['authorization']
  },

  // Recommendations (user-specific, medium duration)
  RECOMMENDATIONS: {
    ttl: CACHE_CONFIG.TTL.LONG,
    private: true,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      return `${CACHE_CONFIG.KEYS.RECOMMENDATION}${url.pathname}:${url.search}`
    }
  },

  // Search results (vary by query)
  SEARCH: {
    ttl: CACHE_CONFIG.TTL.MEDIUM,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      return `${CACHE_CONFIG.KEYS.SEARCH}${url.search}`
    }
  },

  // Analytics data (longer cache)
  ANALYTICS: {
    ttl: CACHE_CONFIG.TTL.DAILY,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const date = new Date().toDateString()
      return `${CACHE_CONFIG.KEYS.ANALYTICS}${url.pathname}:${date}`
    }
  },

  // Reviews and ratings
  REVIEWS: {
    ttl: CACHE_CONFIG.TTL.LONG,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      return `${CACHE_CONFIG.KEYS.REVIEWS}${url.search}`
    }
  }
}

/**
 * Rate limiting with cache
 */
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 3600 // 1 hour
): Promise<{
  success: boolean
  remaining: number
  resetTime: number
}> {
  const key = `rate_limit:${identifier}`
  
  try {
    const current = await CacheService.incr(key, window)
    const remaining = Math.max(0, limit - current)
    const resetTime = Math.floor(Date.now() / 1000) + window

    return {
      success: current <= limit,
      remaining,
      resetTime
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    return {
      success: true,
      remaining: limit,
      resetTime: Math.floor(Date.now() / 1000) + window
    }
  }
}
