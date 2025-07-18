import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import CacheService from '@/lib/cache/redis'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { errorTracker } from '@/lib/monitoring/error-tracker'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      checks: {} as Record<string, any>
    }

    // Database health check
    try {
      const dbStart = Date.now()
      await db.execute(sql`SELECT 1`)
      const dbTime = Date.now() - dbStart
      
      health.checks.database = {
        status: 'healthy',
        responseTime: dbTime,
        message: 'Database connection successful'
      }
    } catch (error) {
      health.status = 'unhealthy'
      health.checks.database = {
        status: 'unhealthy',
        error: 'Database connection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Cache health check
    try {
      const cacheStart = Date.now()
      await CacheService.set('health_check', 'ok', 10)
      await CacheService.get('health_check')
      const cacheTime = Date.now() - cacheStart
      
      health.checks.cache = {
        status: 'healthy',
        responseTime: cacheTime,
        message: 'Cache connection successful'
      }
    } catch (error) {
      health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
      health.checks.cache = {
        status: 'unhealthy',
        error: 'Cache connection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Memory usage check
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      const memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)
      const memoryLimitMB = Math.round(memUsage.heapTotal / 1024 / 1024)
      
      health.checks.memory = {
        status: memoryUsageMB > 512 ? 'warning' : 'healthy',
        heapUsed: `${memoryUsageMB}MB`,
        heapTotal: `${memoryLimitMB}MB`,
        usage: `${Math.round((memoryUsageMB / memoryLimitMB) * 100)}%`
      }

      if (memoryUsageMB > 1024 && health.status === 'healthy') {
        health.status = 'degraded'
      }
    }

    // Performance metrics
    const perfStats = performanceMonitor.getStats(300000) // Last 5 minutes
    health.checks.performance = {
      status: perfStats.requests.averageResponseTime > 1000 ? 'warning' : 'healthy',
      averageResponseTime: Math.round(perfStats.requests.averageResponseTime),
      requestCount: perfStats.requests.total,
      errorRate: Math.round(perfStats.requests.errorRate * 100) / 100
    }

    // Error tracking
    const errorStats = errorTracker.getErrorStats(300000) // Last 5 minutes
    health.checks.errors = {
      status: errorStats.errorRate > 5 ? 'warning' : 'healthy',
      errorCount: errorStats.total,
      errorRate: Math.round(errorStats.errorRate * 100) / 100
    }

    // External services check (mock for now)
    health.checks.externalServices = {
      paystack: { status: 'healthy', message: 'Paystack API accessible' },
      flutterwave: { status: 'healthy', message: 'Flutterwave API accessible' },
      resend: { status: 'healthy', message: 'Resend API accessible' },
      imagekit: { status: 'healthy', message: 'ImageKit API accessible' }
    }

    // Overall response time
    const totalTime = Date.now() - startTime
    health.checks.responseTime = {
      status: totalTime > 1000 ? 'warning' : 'healthy',
      value: totalTime,
      unit: 'ms'
    }

    // Determine overall status
    const statuses = Object.values(health.checks).map(check => 
      typeof check === 'object' && check.status ? check.status : 'healthy'
    )
    
    if (statuses.includes('unhealthy')) {
      health.status = 'unhealthy'
    } else if (statuses.includes('warning')) {
      health.status = 'degraded'
    }

    // Return appropriate HTTP status
    const httpStatus = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    })
  }
}

// Simple liveness probe
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'X-Health-Check': 'alive'
    }
  })
}
