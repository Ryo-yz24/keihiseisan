import { NextRequest } from 'next/server'

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (request: NextRequest): { success: boolean; limit: number; remaining: number; resetTime: number } => {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      const now = Date.now()
      const windowMs = options.windowMs
      const maxRequests = options.maxRequests

      const key = `${ip}:${Math.floor(now / windowMs)}`
      const current = rateLimitMap.get(key)

      if (!current || now > current.resetTime) {
        rateLimitMap.set(key, {
          count: 1,
          resetTime: now + windowMs
        })
        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - 1,
          resetTime: now + windowMs
        }
      }

      if (current.count >= maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime: current.resetTime
        }
      }

      current.count++
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - current.count,
        resetTime: current.resetTime
      }
    }
  }
}