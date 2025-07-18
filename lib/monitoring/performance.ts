import { NextRequest } from 'next/server'

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  metadata?: Record<string, any>
}

export interface RequestMetrics {
  method: string
  path: string
  statusCode: number
  duration: number
  userAgent?: string
  ip?: string
  userId?: string
  timestamp: number
}

export interface DatabaseMetrics {
  query: string
  duration: number
  rowCount?: number
  cached: boolean
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private requestMetrics: RequestMetrics[] = []
  private dbMetrics: DatabaseMetrics[] = []
  private readonly MAX_METRICS = 1000

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    }

    this.metrics.push(fullMetric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Record API request metrics
   */
  recordRequest(request: Omit<RequestMetrics, 'timestamp'>) {
    const fullRequest: RequestMetrics = {
      ...request,
      timestamp: Date.now()
    }

    this.requestMetrics.push(fullRequest)
    
    if (this.requestMetrics.length > this.MAX_METRICS) {
      this.requestMetrics = this.requestMetrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Record database query metrics
   */
  recordDbQuery(query: Omit<DatabaseMetrics, 'timestamp'>) {
    const fullQuery: DatabaseMetrics = {
      ...query,
      timestamp: Date.now()
    }

    this.dbMetrics.push(fullQuery)
    
    if (this.dbMetrics.length > this.MAX_METRICS) {
      this.dbMetrics = this.dbMetrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow: number = 3600000) { // Default 1 hour
    const cutoff = Date.now() - timeWindow
    
    const recentRequests = this.requestMetrics.filter(m => m.timestamp > cutoff)
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)
    const recentDbQueries = this.dbMetrics.filter(m => m.timestamp > cutoff)

    return {
      requests: this.analyzeRequests(recentRequests),
      performance: this.analyzeMetrics(recentMetrics),
      database: this.analyzeDbQueries(recentDbQueries),
      timeWindow,
      timestamp: Date.now()
    }
  }

  private analyzeRequests(requests: RequestMetrics[]) {
    if (requests.length === 0) {
      return {
        total: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        slowestEndpoints: [],
        statusCodes: {}
      }
    }

    const durations = requests.map(r => r.duration)
    const errors = requests.filter(r => r.statusCode >= 400)
    
    // Group by endpoint for slow endpoint analysis
    const endpointStats = requests.reduce((acc, req) => {
      const key = `${req.method} ${req.path}`
      if (!acc[key]) {
        acc[key] = { count: 0, totalDuration: 0, errors: 0 }
      }
      acc[key].count++
      acc[key].totalDuration += req.duration
      if (req.statusCode >= 400) acc[key].errors++
      return acc
    }, {} as Record<string, any>)

    const slowestEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]: [string, any]) => ({
        endpoint,
        averageResponseTime: stats.totalDuration / stats.count,
        requestCount: stats.count,
        errorRate: (stats.errors / stats.count) * 100
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 10)

    // Status code distribution
    const statusCodes = requests.reduce((acc, req) => {
      acc[req.statusCode] = (acc[req.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      total: requests.length,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      errorRate: (errors.length / requests.length) * 100,
      requestsPerMinute: (requests.length / 60),
      slowestEndpoints,
      statusCodes,
      p95ResponseTime: this.percentile(durations, 0.95),
      p99ResponseTime: this.percentile(durations, 0.99)
    }
  }

  private analyzeMetrics(metrics: PerformanceMetric[]) {
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    return Object.entries(grouped).map(([name, values]) => ({
      name,
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    }))
  }

  private analyzeDbQueries(queries: DatabaseMetrics[]) {
    if (queries.length === 0) {
      return {
        total: 0,
        averageDuration: 0,
        cacheHitRate: 0,
        slowestQueries: []
      }
    }

    const durations = queries.map(q => q.duration)
    const cached = queries.filter(q => q.cached)
    
    const slowestQueries = queries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(q => ({
        query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
        duration: q.duration,
        cached: q.cached,
        rowCount: q.rowCount
      }))

    return {
      total: queries.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      cacheHitRate: (cached.length / queries.length) * 100,
      slowestQueries,
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99)
    }
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Get alerts based on performance thresholds
   */
  getAlerts() {
    const stats = this.getStats()
    const alerts = []

    // High error rate
    if (stats.requests.errorRate > 5) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate is ${stats.requests.errorRate.toFixed(2)}%`,
        threshold: 5
      })
    }

    // Slow response times
    if (stats.requests.averageResponseTime > 1000) {
      alerts.push({
        type: 'slow_response',
        severity: 'medium',
        message: `Average response time is ${stats.requests.averageResponseTime.toFixed(0)}ms`,
        threshold: 1000
      })
    }

    // Slow database queries
    if (stats.database.averageDuration > 500) {
      alerts.push({
        type: 'slow_db',
        severity: 'medium',
        message: `Average DB query time is ${stats.database.averageDuration.toFixed(0)}ms`,
        threshold: 500
      })
    }

    // Low cache hit rate
    if (stats.database.cacheHitRate < 70 && stats.database.total > 10) {
      alerts.push({
        type: 'low_cache_hit',
        severity: 'low',
        message: `DB cache hit rate is ${stats.database.cacheHitRate.toFixed(1)}%`,
        threshold: 70
      })
    }

    return alerts
  }

  /**
   * Clear old metrics
   */
  cleanup(maxAge: number = 86400000) { // Default 24 hours
    const cutoff = Date.now() - maxAge
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff)
    this.dbMetrics = this.dbMetrics.filter(m => m.timestamp > cutoff)
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Middleware to automatically track request performance
 */
export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async function trackedHandler(req: NextRequest): Promise<Response> {
    const startTime = Date.now()
    
    try {
      const response = await handler(req)
      const duration = Date.now() - startTime
      
      // Extract user ID from session if available
      let userId: string | undefined
      try {
        // This would need to be implemented based on your auth system
        // const session = await getServerSession(authOptions)
        // userId = session?.user?.id
      } catch {
        // Ignore auth errors for performance tracking
      }

      // Record request metrics
      performanceMonitor.recordRequest({
        method: req.method,
        path: new URL(req.url).pathname,
        statusCode: response.status,
        duration,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.headers.get('x-forwarded-for') || 
            req.headers.get('x-real-ip') || 
            undefined,
        userId
      })

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      
      performanceMonitor.recordRequest({
        method: req.method,
        path: new URL(req.url).pathname,
        statusCode: 500,
        duration
      })
      
      throw error
    }
  }
}

/**
 * Database query performance tracking wrapper
 */
export function trackDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  cached: boolean = false
): Promise<T> {
  const startTime = Date.now()
  
  return queryFn().then(result => {
    const duration = Date.now() - startTime
    
    performanceMonitor.recordDbQuery({
      query: queryName,
      duration,
      cached,
      rowCount: Array.isArray(result) ? result.length : undefined
    })
    
    return result
  }).catch(error => {
    const duration = Date.now() - startTime
    
    performanceMonitor.recordDbQuery({
      query: queryName,
      duration,
      cached: false
    })
    
    throw error
  })
}

/**
 * Function execution time tracking
 */
export function trackFunction<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const startTime = Date.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.then(value => {
      performanceMonitor.recordMetric({
        name,
        value: Date.now() - startTime,
        unit: 'ms'
      })
      return value
    }).catch(error => {
      performanceMonitor.recordMetric({
        name: `${name}_error`,
        value: Date.now() - startTime,
        unit: 'ms'
      })
      throw error
    })
  } else {
    performanceMonitor.recordMetric({
      name,
      value: Date.now() - startTime,
      unit: 'ms'
    })
    return Promise.resolve(result)
  }
}

// Cleanup old metrics every hour
setInterval(() => {
  performanceMonitor.cleanup()
}, 3600000)
