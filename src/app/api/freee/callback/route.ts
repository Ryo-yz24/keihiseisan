import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  exchangeCodeForTokens,
  encryptToken,
  getCompanies,
  isFreeeEnabled,
} from '@/lib/freee'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!isFreeeEnabled()) {
      return NextResponse.redirect(
        new URL('/admin?freee_error=not_configured', request.url)
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // エラーチェック
    if (error) {
      console.error('freee OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/admin?freee_error=${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/admin?freee_error=missing_params', request.url)
      )
    }

    // stateの検証（CSRF対策）
    const savedState = request.cookies.get('freee_oauth_state')?.value
    const userId = request.cookies.get('freee_oauth_user_id')?.value

    if (!savedState || savedState !== state || !userId) {
      return NextResponse.redirect(
        new URL('/admin?freee_error=invalid_state', request.url)
      )
    }

    // 認証コードをトークンに交換
    const { accessToken, refreshToken, expiresIn } = await exchangeCodeForTokens(code)

    // 事業所情報を取得
    const companiesData = await getCompanies(accessToken)
    const companies = companiesData.companies || []

    if (companies.length === 0) {
      return NextResponse.redirect(
        new URL('/admin?freee_error=no_companies', request.url)
      )
    }

    // 最初の事業所を使用（複数ある場合は後で選択できるようにする）
    const company = companies[0]

    // トークンを暗号化
    const encryptedAccessToken = encryptToken(accessToken)
    const encryptedRefreshToken = encryptToken(refreshToken)

    // データベースに保存（既存のレコードがあれば更新）
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    await prisma.freeeIntegration.upsert({
      where: { userId },
      create: {
        userId,
        companyId: company.id,
        companyName: company.display_name || company.name,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        isActive: true,
      },
      update: {
        companyId: company.id,
        companyName: company.display_name || company.name,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        isActive: true,
      },
    })

    // Cookieをクリア
    const response = NextResponse.redirect(
      new URL('/admin?freee_success=true', request.url)
    )
    response.cookies.delete('freee_oauth_state')
    response.cookies.delete('freee_oauth_user_id')

    return response
  } catch (error) {
    console.error('Error in freee callback:', error)
    return NextResponse.redirect(
      new URL('/admin?freee_error=unknown', request.url)
    )
  }
}
