import { NextRequest, NextResponse } from 'next/server'

export interface SecurityConfig {
  enableCSP?: boolean
  enableHSTS?: boolean
  enableXFrameOptions?: boolean
  enableXContentTypeOptions?: boolean
  enableReferrerPolicy?: boolean
  enablePermissionsPolicy?: boolean
  customHeaders?: Record<string, string>
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async function securityHandler(req: NextRequest): Promise<NextResponse> {
    try {
      const response = await handler(req)
      
      // Apply security headers
      applySecurityHeaders(response, config)
      
      return response
    } catch (error) {
      // Even for errors, apply security headers
      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
      
      applySecurityHeaders(errorResponse, config)
      return errorResponse
    }
  }
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, config: SecurityConfig) {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableXFrameOptions = true,
    enableXContentTypeOptions = true,
    enableReferrerPolicy = true,
    enablePermissionsPolicy = true,
    customHeaders = {}
  } = config

  // Content Security Policy
  if (enableCSP) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.flutterwave.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.paystack.co https://api.flutterwave.com https://checkout.flutterwave.com",
      "frame-src 'self' https://js.paystack.co https://checkout.flutterwave.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', csp)
  }

  // Strict Transport Security
  if (enableHSTS) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // X-Frame-Options
  if (enableXFrameOptions) {
    response.headers.set('X-Frame-Options', 'DENY')
  }

  // X-Content-Type-Options
  if (enableXContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Referrer Policy
  if (enableReferrerPolicy) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  // Permissions Policy
  if (enablePermissionsPolicy) {
    const permissions = [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=(self)',
      'usb=()'
    ].join(', ')
    
    response.headers.set('Permissions-Policy', permissions)
  }

  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  // Remove potentially sensitive headers
  response.headers.delete('X-Powered-By')
  response.headers.delete('Server')

  // Custom headers
  Object.entries(customHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // API-specific headers
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CORSConfig = {}
) {
  return async function corsHandler(req: NextRequest): Promise<NextResponse> {
    const {
      origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders = ['X-Total-Count', 'X-Cache', 'X-Response-Time'],
      credentials = true,
      maxAge = 86400
    } = config

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin.toString(),
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Expose-Headers': exposedHeaders.join(', '),
          'Access-Control-Allow-Credentials': credentials.toString(),
          'Access-Control-Max-Age': maxAge.toString()
        }
      })
    }

    const response = await handler(req)

    // Add CORS headers to response
    if (Array.isArray(origin)) {
      const requestOrigin = req.headers.get('origin')
      if (requestOrigin && origin.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin)
      }
    } else if (typeof origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (origin === true) {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
    response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '))
    response.headers.set('Access-Control-Allow-Credentials', credentials.toString())

    return response
  }
}

/**
 * Input validation and sanitization
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000) // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.slice(0, 100).map(sanitizeInput) // Limit array size
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    Object.keys(input).slice(0, 50).forEach(key => { // Limit object keys
      if (typeof key === 'string' && key.length <= 100) {
        sanitized[key] = sanitizeInput(input[key])
      }
    })
    return sanitized
  }
  
  return input
}

/**
 * Request size validation
 */
export function withRequestSizeLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  maxSize: number = 1024 * 1024 // 1MB default
) {
  return async function sizeLimitHandler(req: NextRequest): Promise<NextResponse> {
    const contentLength = req.headers.get('content-length')
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return new NextResponse(
        JSON.stringify({
          error: 'Request too large',
          maxSize: `${Math.floor(maxSize / 1024)}KB`
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return handler(req)
  }
}

/**
 * API key validation
 */
export function withAPIKey(
  handler: (req: NextRequest) => Promise<NextResponse>,
  validKeys?: string[]
) {
  return async function apiKeyHandler(req: NextRequest): Promise<NextResponse> {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'API key required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // If specific keys are provided, validate against them
    if (validKeys && !validKeys.includes(apiKey)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid API key' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return handler(req)
  }
}

/**
 * Comprehensive security middleware
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    security?: SecurityConfig
    cors?: CORSConfig
    maxRequestSize?: number
    requireAPIKey?: boolean
    validAPIKeys?: string[]
  } = {}
) {
  let securedHandler = handler

  // Apply security headers
  securedHandler = withSecurityHeaders(securedHandler, options.security)

  // Apply CORS
  if (options.cors !== false) {
    securedHandler = withCORS(securedHandler, options.cors)
  }

  // Apply request size limit
  if (options.maxRequestSize) {
    securedHandler = withRequestSizeLimit(securedHandler, options.maxRequestSize)
  }

  // Apply API key validation
  if (options.requireAPIKey) {
    securedHandler = withAPIKey(securedHandler, options.validAPIKeys)
  }

  return securedHandler
}
