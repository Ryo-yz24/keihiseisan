import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  maxRequests: 5 // 5回まで
})

export async function POST(request: NextRequest) {
  const { success } = limiter.check(request)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  return NextResponse.json({ message: 'Login endpoint' })
}