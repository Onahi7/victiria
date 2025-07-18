import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { errorTracker } from '@/lib/monitoring/error-tracker'
import CacheService from '@/lib/cache/redis'
import { db } from '@/lib/db'
import { users, books, orders, paymentTransactions, reviews } from '@/lib/db/schema'
import { withErrorTracking } from '@/lib/monitoring/error-tracker'
import { withPerformanceTracking } from '@/lib/monitoring/performance'
import { count, gte, eq, sql } from 'drizzle-orm'

async function handler(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Only allow admin users to access monitoring data
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 403 }
    )
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const timeWindow = parseInt(url.searchParams.get('timeWindow') || '3600000') // Default 1 hour
    const includeDetails = url.searchParams.get('details') === 'true'

    try {
      // Get performance statistics
      const performanceStats = performanceMonitor.getStats(timeWindow)
      const performanceAlerts = performanceMonitor.getAlerts()

      // Get error statistics
      const errorStats = errorTracker.getErrorStats(timeWindow)
      const systemAlerts = errorTracker.getAlerts()
      const performanceInsights = errorTracker.getPerformanceInsights(timeWindow)

      // Get cache statistics
      const cacheStats = await CacheService.getStats()

      // Get database statistics
      const dbStats = await getDatabaseStats()

      // Get system health metrics
      const systemHealth = await getSystemHealth()

      // Combine all monitoring data
      const monitoringData = {
        timestamp: Date.now(),
        timeWindow,
        overview: {
          status: getOverallStatus(performanceStats, errorStats, systemHealth),
          totalRequests: performanceStats.requests.total,
          errorRate: errorStats.errorRate,
          averageResponseTime: performanceStats.requests.averageResponseTime,
          cacheHitRate: performanceStats.database.cacheHitRate,
          activeAlerts: performanceAlerts.length + systemAlerts.length
        },
        performance: {
          requests: performanceStats.requests,
          database: performanceStats.database,
          alerts: performanceAlerts
        },
        errors: {
          stats: errorStats,
          alerts: systemAlerts,
          insights: performanceInsights
        },
        cache: cacheStats,
        database: dbStats,
        system: systemHealth
      }

      // Add detailed data if requested
      if (includeDetails) {
        monitoringData.details = {
          recentErrors: errorTracker.exportErrors(timeWindow).slice(0, 50),
          slowestEndpoints: performanceStats.requests.slowestEndpoints,
          slowestQueries: performanceStats.database.slowestQueries
        }
      }

      return NextResponse.json(monitoringData)

    } catch (error) {
      console.error('Monitoring dashboard error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch monitoring data' },
        { status: 500 }
      )
    }
  }

  if (req.method === 'POST') {
    // Handle alert actions (resolve, acknowledge, etc.)
    try {
      const { action, alertId, alertType } = await req.json()

      if (action === 'resolve' && alertId) {
        if (alertType === 'system') {
          const resolved = errorTracker.resolveAlert(alertId)
          return NextResponse.json({ success: resolved })
        }
      }

      if (action === 'clear_cache') {
        await CacheService.flushAll()
        return NextResponse.json({ success: true, message: 'Cache cleared successfully' })
      }

      if (action === 'cleanup_logs') {
        errorTracker.cleanup(86400000) // Clean up logs older than 24 hours
        performanceMonitor.cleanup(86400000)
        return NextResponse.json({ success: true, message: 'Logs cleaned up successfully' })
      }

      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )

    } catch (error) {
      console.error('Monitoring action error:', error)
      return NextResponse.json(
        { error: 'Failed to execute action' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

async function getDatabaseStats() {
  try {
    const [
      userCountResult,
      bookCountResult,
      orderCountResult,
      recentOrdersResult,
      paymentCountResult,
      reviewCountResult
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(books),
      db.select({ count: count() }).from(orders),
      db.select({ count: count() }).from(orders).where(
        gte(orders.createdAt, sql`NOW() - INTERVAL '24 hours'`)
      ),
      db.select({ count: count() }).from(paymentTransactions).where(
        eq(paymentTransactions.status, 'successful')
      ),
      db.select({ count: count() }).from(reviews)
    ])

    return {
      tables: {
        users: userCountResult[0]?.count || 0,
        books: bookCountResult[0]?.count || 0,
        orders: orderCountResult[0]?.count || 0,
        payments: paymentCountResult[0]?.count || 0,
        reviews: reviewCountResult[0]?.count || 0
      },
      activity: {
        recentOrders: recentOrdersResult[0]?.count || 0,
        ordersToday: recentOrdersResult[0]?.count || 0
      },
      schema: []
    }
  } catch (error) {
    console.error('Database stats error:', error)
    return {
      tables: {},
      activity: {},
      schema: [],
      error: 'Failed to fetch database statistics'
    }
  }
}

async function getSystemHealth() {
  const health = {
    status: 'healthy',
    checks: {},
    timestamp: Date.now()
  }

  // Check database connectivity
  try {
    await db.execute(sql`SELECT 1`)
    health.checks.database = { status: 'healthy', responseTime: 0 }
  } catch (error) {
    health.checks.database = { status: 'unhealthy', error: 'Database connection failed' }
    health.status = 'unhealthy'
  }

  // Check cache connectivity
  try {
    await CacheService.set('health_check', 'ok', 10)
    await CacheService.get('health_check')
    health.checks.cache = { status: 'healthy' }
  } catch (error) {
    health.checks.cache = { status: 'unhealthy', error: 'Cache connection failed' }
    health.status = 'degraded'
  }

  // Check memory usage
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage()
    const memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    
    health.checks.memory = {
      status: memoryUsageMB > 512 ? 'warning' : 'healthy',
      heapUsed: memoryUsageMB,
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    }

    if (memoryUsageMB > 1024 && health.status === 'healthy') {
      health.status = 'degraded'
    }
  }

  // Check external services (mock for now)
  health.checks.paymentProviders = {
    paystack: { status: 'healthy' },
    flutterwave: { status: 'healthy' }
  }

  return health
}

function getOverallStatus(performanceStats: any, errorStats: any, systemHealth: any): string {
  if (systemHealth.status === 'unhealthy') return 'critical'
  if (errorStats.errorRate > 10) return 'critical'
  if (performanceStats.requests.averageResponseTime > 2000) return 'critical'
  
  if (systemHealth.status === 'degraded') return 'warning'
  if (errorStats.errorRate > 5) return 'warning'
  if (performanceStats.requests.averageResponseTime > 1000) return 'warning'
  
  return 'healthy'
}

export const GET = withErrorTracking(withPerformanceTracking(handler))
export const POST = withErrorTracking(withPerformanceTracking(handler))
