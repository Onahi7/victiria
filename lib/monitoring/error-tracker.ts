import { NextRequest } from 'next/server'

export interface ErrorLog {
  id: string
  message: string
  stack?: string
  level: 'error' | 'warning' | 'info' | 'debug'
  timestamp: number
  userId?: string
  requestId?: string
  metadata?: Record<string, any>
  context?: {
    method?: string
    path?: string
    userAgent?: string
    ip?: string
    headers?: Record<string, string>
  }
}

export interface SystemAlert {
  id: string
  type: 'error_rate' | 'performance' | 'security' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  count: number
  firstSeen: number
  lastSeen: number
  resolved: boolean
}

class ErrorTracker {
  private errors: ErrorLog[] = []
  private alerts: SystemAlert[] = []
  private readonly MAX_ERRORS = 1000
  private readonly MAX_ALERTS = 100

  /**
   * Log an error with context
   */
  logError(
    error: Error | string,
    level: ErrorLog['level'] = 'error',
    metadata?: Record<string, any>,
    context?: ErrorLog['context']
  ): string {
    const id = this.generateId()
    const timestamp = Date.now()
    
    const errorLog: ErrorLog = {
      id,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      level,
      timestamp,
      metadata,
      context
    }

    this.errors.push(errorLog)
    
    // Keep only recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS)
    }

    // Check for alert conditions
    this.checkAlertConditions(errorLog)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${level.toUpperCase()}] ${errorLog.message}`, {
        id,
        metadata,
        context,
        stack: errorLog.stack
      })
    }

    return id
  }

  /**
   * Log request context error
   */
  logRequestError(
    error: Error | string,
    req: NextRequest,
    level: ErrorLog['level'] = 'error',
    metadata?: Record<string, any>
  ): string {
    const context = {
      method: req.method,
      path: new URL(req.url).pathname,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || 
          req.headers.get('x-real-ip') || 
          undefined,
      headers: Object.fromEntries(
        Array.from(req.headers.entries()).filter(([key]) => 
          !['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())
        )
      )
    }

    return this.logError(error, level, metadata, context)
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindow: number = 3600000) { // Default 1 hour
    const cutoff = Date.now() - timeWindow
    const recentErrors = this.errors.filter(e => e.timestamp > cutoff)

    if (recentErrors.length === 0) {
      return {
        total: 0,
        byLevel: {},
        byPath: {},
        recentErrors: [],
        errorRate: 0
      }
    }

    // Group by level
    const byLevel = recentErrors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by path
    const byPath = recentErrors.reduce((acc, error) => {
      const path = error.context?.path || 'unknown'
      acc[path] = (acc[path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get most recent errors
    const recentErrorsList = recentErrors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
      .map(error => ({
        id: error.id,
        message: error.message,
        level: error.level,
        timestamp: error.timestamp,
        path: error.context?.path,
        method: error.context?.method
      }))

    return {
      total: recentErrors.length,
      byLevel,
      byPath,
      recentErrors: recentErrorsList,
      errorRate: recentErrors.length / (timeWindow / 60000) // errors per minute
    }
  }

  /**
   * Get all active alerts
   */
  getAlerts(): SystemAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      return true
    }
    return false
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(errorLog: ErrorLog) {
    const now = Date.now()
    const oneHour = 3600000
    
    // High error rate alert
    const recentErrors = this.errors.filter(e => e.timestamp > now - oneHour)
    if (recentErrors.length > 50) { // More than 50 errors in an hour
      this.createOrUpdateAlert({
        type: 'error_rate',
        severity: 'high',
        message: `High error rate: ${recentErrors.length} errors in the last hour`,
        errorLog
      })
    }

    // Critical error alert
    if (errorLog.level === 'error' && errorLog.stack?.includes('ECONNREFUSED')) {
      this.createOrUpdateAlert({
        type: 'system',
        severity: 'critical',
        message: 'Database connection failed',
        errorLog
      })
    }

    // Payment error alert
    if (errorLog.context?.path?.includes('/api/payment') && errorLog.level === 'error') {
      this.createOrUpdateAlert({
        type: 'error_rate',
        severity: 'high',
        message: 'Payment processing error detected',
        errorLog
      })
    }

    // Security alert - multiple failed auth attempts
    if (errorLog.message.includes('authentication') || errorLog.message.includes('unauthorized')) {
      const authErrors = this.errors.filter(e => 
        e.timestamp > now - 900000 && // 15 minutes
        (e.message.includes('authentication') || e.message.includes('unauthorized'))
      )
      
      if (authErrors.length > 10) {
        this.createOrUpdateAlert({
          type: 'security',
          severity: 'medium',
          message: `Multiple authentication failures: ${authErrors.length} in 15 minutes`,
          errorLog
        })
      }
    }
  }

  /**
   * Create or update an alert
   */
  private createOrUpdateAlert(params: {
    type: SystemAlert['type']
    severity: SystemAlert['severity']
    message: string
    errorLog: ErrorLog
  }) {
    const { type, severity, message, errorLog } = params
    const now = Date.now()

    // Check if similar alert exists
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && 
      alert.message === message && 
      !alert.resolved
    )

    if (existingAlert) {
      existingAlert.count++
      existingAlert.lastSeen = now
    } else {
      const newAlert: SystemAlert = {
        id: this.generateId(),
        type,
        severity,
        message,
        count: 1,
        firstSeen: now,
        lastSeen: now,
        resolved: false
      }

      this.alerts.push(newAlert)
      
      if (this.alerts.length > this.MAX_ALERTS) {
        this.alerts = this.alerts.slice(-this.MAX_ALERTS)
      }
    }
  }

  /**
   * Get performance insights from errors
   */
  getPerformanceInsights(timeWindow: number = 86400000) { // 24 hours
    const cutoff = Date.now() - timeWindow
    const recentErrors = this.errors.filter(e => e.timestamp > cutoff)

    // Find patterns in errors
    const patterns = {
      slowQueries: recentErrors.filter(e => 
        e.message.includes('timeout') || 
        e.message.includes('slow')
      ).length,
      
      memoryIssues: recentErrors.filter(e => 
        e.message.includes('memory') || 
        e.message.includes('heap')
      ).length,
      
      networkIssues: recentErrors.filter(e => 
        e.message.includes('ECONNREFUSED') || 
        e.message.includes('ETIMEDOUT') ||
        e.message.includes('network')
      ).length,
      
      validationErrors: recentErrors.filter(e => 
        e.message.includes('validation') || 
        e.message.includes('invalid')
      ).length
    }

    return {
      totalErrors: recentErrors.length,
      patterns,
      recommendations: this.generateRecommendations(patterns)
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(patterns: Record<string, number>): string[] {
    const recommendations = []

    if (patterns.slowQueries > 10) {
      recommendations.push('Consider optimizing database queries or adding indexes')
    }

    if (patterns.memoryIssues > 5) {
      recommendations.push('Monitor memory usage and consider optimizing memory-intensive operations')
    }

    if (patterns.networkIssues > 15) {
      recommendations.push('Check network connectivity and consider implementing retry mechanisms')
    }

    if (patterns.validationErrors > 20) {
      recommendations.push('Review input validation and consider improving client-side validation')
    }

    return recommendations
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Export errors for external analysis
   */
  exportErrors(timeWindow?: number): ErrorLog[] {
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow
      return this.errors.filter(e => e.timestamp > cutoff)
    }
    return [...this.errors]
  }

  /**
   * Clear old errors and alerts
   */
  cleanup(maxAge: number = 86400000) { // 24 hours
    const cutoff = Date.now() - maxAge
    
    this.errors = this.errors.filter(e => e.timestamp > cutoff)
    this.alerts = this.alerts.filter(a => a.lastSeen > cutoff)
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker()

/**
 * Global error handler middleware
 */
export function withErrorTracking(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async function errorTrackedHandler(req: NextRequest): Promise<Response> {
    try {
      return await handler(req)
    } catch (error) {
      const errorId = errorTracker.logRequestError(
        error instanceof Error ? error : new Error(String(error)),
        req,
        'error',
        {
          timestamp: Date.now(),
          requestId: req.headers.get('x-request-id') || undefined
        }
      )

      // Return error response with tracking ID
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          errorId,
          timestamp: Date.now()
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Error-ID': errorId
          }
        }
      )
    }
  }
}

/**
 * Database error tracking wrapper
 */
export async function trackDbError<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    errorTracker.logError(
      error instanceof Error ? error : new Error(String(error)),
      'error',
      { operation, type: 'database' }
    )
    throw error
  }
}

// Cleanup old data every hour
setInterval(() => {
  errorTracker.cleanup()
}, 3600000)

export default errorTracker
