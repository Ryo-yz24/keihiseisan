import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ミドルウェアを無効化（PasswordGuardで制御）
  return NextResponse.next()
}

export const config = {
  matcher: [],
}