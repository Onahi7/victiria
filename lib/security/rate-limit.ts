import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/cache/middleware'
import CacheService from '@/lib/cache/redis'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message?: string
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// Default rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Global API rate limit
  GLOBAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests, please try again later'
  },

  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later'
  },

  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 searches per minute
    message: 'Search rate limit exceeded'
  },

  // Payment endpoints
  PAYMENT: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 payment attempts per minute
    message: 'Payment rate limit exceeded'
  },

  // Order creation
  ORDER: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 orders per minute
    message: 'Order creation rate limit exceeded'
  },

  // Review submission
  REVIEW: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 reviews per minute
    message: 'Review submission rate limit exceeded'
  },

  // Contact/feedback
  CONTACT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 contact submissions per hour
    message: 'Contact form rate limit exceeded'
  },

  // Password reset
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Password reset rate limit exceeded'
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async function rateLimitedHandler(req: NextRequest): Promise<NextResponse> {
    try {
      // Generate identifier for rate limiting
      const identifier = config.keyGenerator 
        ? config.keyGenerator(req)
        : getDefaultIdentifier(req)

      // Check rate limit
      const result = await rateLimit(
        identifier,
        config.max,
        Math.floor(config.windowMs / 1000)
      )

      // Add rate limit headers
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', config.max.toString())
      headers.set('X-RateLimit-Remaining', result.remaining.toString())
      headers.set('X-RateLimit-Reset', result.resetTime.toString())

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            error: config.message || 'Rate limit exceeded',
            retryAfter: result.resetTime - Math.floor(Date.now() / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': (result.resetTime - Math.floor(Date.now() / 1000)).toString(),
              ...Object.fromEntries(headers.entries())
            }
          }
        )
      }

      // Execute handler
      const response = await handler(req)

      // Add rate limit headers to successful response
      for (const [key, value] of headers.entries()) {
        response.headers.set(key, value)
      }

      return response

    } catch (error) {
      console.error('Rate limiting error:', error)
      // If rate limiting fails, allow the request through
      return handler(req)
    }
  }
}

/**
 * Get default rate limit identifier
 */
function getDefaultIdentifier(req: NextRequest): string {
  // Try to get IP address
  const ip = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            req.headers.get('cf-connecting-ip') ||
            'unknown'

  // Clean IP (take first one if multiple)
  const cleanIp = ip.split(',')[0].trim()

  return `ip:${cleanIp}`
}

/**
 * User-specific rate limiting
 */
export function getUserRateLimitIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  
  // Fall back to IP-based limiting
  return getDefaultIdentifier(req)
}

/**
 * Endpoint-specific rate limiting
 */
export function getEndpointRateLimitIdentifier(req: NextRequest, endpoint: string): string {
  const baseIdentifier = getDefaultIdentifier(req)
  return `${baseIdentifier}:${endpoint}`
}

/**
 * Advanced rate limiting with burst protection
 */
export class AdvancedRateLimit {
  private readonly windowMs: number
  private readonly max: number
  private readonly burstMax: number
  private readonly burstWindowMs: number

  constructor(config: {
    windowMs: number
    max: number
    burstMax?: number
    burstWindowMs?: number
  }) {
    this.windowMs = config.windowMs
    this.max = config.max
    this.burstMax = config.burstMax || config.max * 2
    this.burstWindowMs = config.burstWindowMs || Math.floor(config.windowMs / 10)
  }

  async checkLimit(identifier: string): Promise<{
    success: boolean
    remaining: number
    resetTime: number
    burstRemaining: number
  }> {
    const now = Date.now()
    const windowKey = `rate_limit:${identifier}:${Math.floor(now / this.windowMs)}`
    const burstKey = `rate_limit_burst:${identifier}:${Math.floor(now / this.burstWindowMs)}`

    try {
      // Check both normal and burst limits
      const [windowCount, burstCount] = await Promise.all([
        CacheService.incr(windowKey, Math.floor(this.windowMs / 1000)),
        CacheService.incr(burstKey, Math.floor(this.burstWindowMs / 1000))
      ])

      const windowRemaining = Math.max(0, this.max - windowCount)
      const burstRemaining = Math.max(0, this.burstMax - burstCount)
      
      const success = windowCount <= this.max && burstCount <= this.burstMax

      return {
        success,
        remaining: windowRemaining,
        resetTime: Math.floor((now + this.windowMs) / 1000),
        burstRemaining
      }
    } catch (error) {
      console.error('Advanced rate limit error:', error)
      return {
        success: true,
        remaining: this.max,
        resetTime: Math.floor((now + this.windowMs) / 1000),
        burstRemaining: this.burstMax
      }
    }
  }
}

/**
 * Rate limiting for different user tiers
 */
export function getTierBasedRateLimit(userTier: 'free' | 'premium' | 'admin'): RateLimitConfig {
  const baseLimits = {
    free: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // 100 requests per 15 minutes
    },
    premium: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500 // 500 requests per 15 minutes
    },
    admin: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 2000 // 2000 requests per 15 minutes
    }
  }

  return {
    ...baseLimits[userTier],
    message: `Rate limit exceeded for ${userTier} tier`
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimit {
  private readonly windowMs: number
  private readonly max: number

  constructor(windowMs: number, max: number) {
    this.windowMs = windowMs
    this.max = max
  }

  async checkLimit(identifier: string): Promise<{
    success: boolean
    remaining: number
    resetTime: number
  }> {
    const now = Date.now()
    const windowStart = now - this.windowMs
    const key = `sliding_rate_limit:${identifier}`

    try {
      // Get current request timestamps
      const requests = await CacheService.getList<number>(key) || []
      
      // Filter out old requests
      const validRequests = requests.filter(timestamp => timestamp > windowStart)
      
      // Add current request
      validRequests.push(now)
      
      // Store updated list
      await CacheService.setList(key, validRequests, Math.floor(this.windowMs / 1000))

      const success = validRequests.length <= this.max
      const remaining = Math.max(0, this.max - validRequests.length)

      return {
        success,
        remaining,
        resetTime: Math.floor((now + this.windowMs) / 1000)
      }
    } catch (error) {
      console.error('Sliding window rate limit error:', error)
      return {
        success: true,
        remaining: this.max,
        resetTime: Math.floor((now + this.windowMs) / 1000)
      }
    }
  }
}

/**
 * Rate limit status checker
 */
export async function getRateLimitStatus(identifier: string, windowMs: number): Promise<{
  current: number
  resetTime: number
  isLimited: boolean
}> {
  try {
    const windowKey = `rate_limit:${identifier}:${Math.floor(Date.now() / windowMs)}`
    const current = await CacheService.get<number>(windowKey) || 0
    const resetTime = Math.floor((Date.now() + windowMs) / 1000)

    return {
      current,
      resetTime,
      isLimited: false // Would need to check against specific limits
    }
  } catch (error) {
    console.error('Rate limit status error:', error)
    return {
      current: 0,
      resetTime: Math.floor((Date.now() + windowMs) / 1000),
      isLimited: false
    }
  }
}

/**
 * Clear rate limit for a specific identifier
 */
export async function clearRateLimit(identifier: string): Promise<boolean> {
  try {
    await CacheService.delPattern(`*rate_limit*:${identifier}*`)
    return true
  } catch (error) {
    console.error('Clear rate limit error:', error)
    return false
  }
}
