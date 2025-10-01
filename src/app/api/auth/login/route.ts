import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // レート制限チェック
  const limitResult = rateLimit(ip, 5, 15 * 60 * 1000) // 15分で5回まで
  
  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limitResult.resetTime! - Date.now()) / 1000).toString()
        }
      }
    )
  }

  // 実際のログイン処理はNextAuthが処理
  return NextResponse.json({ message: 'Login endpoint' })
}
