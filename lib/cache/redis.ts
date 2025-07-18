// Mock cache implementation for development/build
// Replace this with your preferred Redis implementation when needed

// Cache configuration
export const CACHE_CONFIG = {
  // Cache TTL in seconds
  TTL: {
    SHORT: 300,      // 5 minutes
    MEDIUM: 1800,    // 30 minutes
    LONG: 3600,      // 1 hour
    DAILY: 86400,    // 24 hours
    WEEKLY: 604800,  // 7 days
  },
  
  // Cache key prefixes
  KEYS: {
    USER: 'user:',
    BOOK: 'book:',
    ORDER: 'order:',
    RECOMMENDATION: 'rec:',
    ANALYTICS: 'analytics:',
    SEARCH: 'search:',
    WISHLIST: 'wishlist:',
    REVIEWS: 'reviews:',
  }
}

// In-memory cache for development (replace with Redis in production)
const memoryCache = new Map<string, { data: any; expiry: number }>()

// Cache utility functions
export class CacheService {
  
  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Use memory cache in development
        const cached = memoryCache.get(key)
        if (cached && cached.expiry > Date.now()) {
          return cached.data as T
        }
        if (cached) {
          memoryCache.delete(key) // Remove expired
        }
        return null
      }
      
      // In production, you would use Redis here
      // For now, return null to allow build to succeed
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set cache data with TTL
   */
  static async set(key: string, data: any, ttl: number = CACHE_CONFIG.TTL.MEDIUM): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Use memory cache in development
        memoryCache.set(key, {
          data,
          expiry: Date.now() + (ttl * 1000)
        })
        return true
      }
      
      // In production, you would use Redis here
      // For now, return true to allow build to succeed
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  /**
   * Delete cached data
   */
  static async del(key: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        memoryCache.delete(key)
        return true
      }
      
      // In production, you would use Redis here
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  static async delPattern(pattern: string): Promise<number> {
    try {
      if (process.env.NODE_ENV === 'development') {
        let deleted = 0
        for (const key of memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            memoryCache.delete(key)
            deleted++
          }
        }
        return deleted
      }
      
      // In production, you would use Redis here
      return 0
    } catch (error) {
      console.error('Cache delete pattern error:', error)
      return 0
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        const cached = memoryCache.get(key)
        return cached !== undefined && cached.expiry > Date.now()
      }
      
      // In production, you would use Redis here
      return false
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Get remaining TTL for a key
   */
  static async ttl(key: string): Promise<number> {
    try {
      if (process.env.NODE_ENV === 'development') {
        const cached = memoryCache.get(key)
        if (cached) {
          const remaining = Math.max(0, cached.expiry - Date.now())
          return Math.floor(remaining / 1000)
        }
        return -1
      }
      
      // In production, you would use Redis here
      return -1
    } catch (error) {
      console.error('Cache TTL error:', error)
      return -1
    }
  }

  /**
   * Cache with automatic key generation
   */
  static async cacheFunction<T>(
    prefix: string,
    identifier: string,
    fn: () => Promise<T>,
    ttl: number = CACHE_CONFIG.TTL.MEDIUM
  ): Promise<T> {
    const key = `${prefix}${identifier}`
    
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn()
    await this.set(key, result, ttl)
    
    return result
  }

  /**
   * Increment counter in cache
   */
  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      if (process.env.NODE_ENV === 'development') {
        const cached = memoryCache.get(key)
        const newValue = cached ? (cached.data + 1) : 1
        memoryCache.set(key, {
          data: newValue,
          expiry: ttl ? Date.now() + (ttl * 1000) : Date.now() + (CACHE_CONFIG.TTL.MEDIUM * 1000)
        })
        return newValue
      }
      
      // In production, you would use Redis here
      return 1
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  /**
   * Cache list/array data
   */
  static async setList(key: string, items: any[], ttl: number = CACHE_CONFIG.TTL.MEDIUM): Promise<boolean> {
    return this.set(key, items, ttl)
  }

  /**
   * Get list from cache
   */
  static async getList<T>(key: string): Promise<T[]> {
    const cached = await this.get<T[]>(key)
    return cached || []
  }

  /**
   * Cache hash/object data
   */
  static async setHash(key: string, hash: Record<string, any>, ttl: number = CACHE_CONFIG.TTL.MEDIUM): Promise<boolean> {
    return this.set(key, hash, ttl)
  }

  /**
   * Get hash from cache
   */
  static async getHash<T>(key: string): Promise<Record<string, T> | null> {
    return await this.get<Record<string, T>>(key)
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    info: any;
    memoryUsage: any;
    keyCount: number;
  }> {
    try {
      if (process.env.NODE_ENV === 'development') {
        return {
          info: { mode: 'memory-cache' },
          memoryUsage: { total: memoryCache.size },
          keyCount: memoryCache.size
        }
      }
      
      // In production, you would return Redis stats here
      return {
        info: null,
        memoryUsage: null,
        keyCount: 0
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        info: null,
        memoryUsage: null,
        keyCount: 0
      }
    }
  }

  /**
   * Flush all cache data (use with caution)
   */
  static async flushAll(): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        memoryCache.clear()
        return true
      }
      
      // In production, you would flush Redis here
      return true
    } catch (error) {
      console.error('Cache flush error:', error)
      return false
    }
  }
}

// Export default instance
export default CacheService
