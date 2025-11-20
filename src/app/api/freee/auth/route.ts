import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuthorizationUrl, isFreeeEnabled } from '@/lib/freee'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // freee API連携が有効かチェック
    if (!isFreeeEnabled()) {
      return NextResponse.json(
        { error: 'freee連携が設定されていません' },
        { status: 503 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // MASTERロールのみが連携可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません。freee連携はマスターアカウント専用です。' },
        { status: 403 }
      )
    }

    // CSRF対策用のstateパラメータを生成
    const state = randomBytes(32).toString('hex')

    // stateをセッションに保存（簡易実装：実際はRedisなどを使用推奨）
    const response = NextResponse.redirect(getAuthorizationUrl(state))

    // stateをCookieに保存（10分間有効）
    response.cookies.set('freee_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10分
      path: '/',
    })

    // ユーザーIDもCookieに保存
    response.cookies.set('freee_oauth_user_id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error initiating freee auth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
