import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isFreeeEnabled } from '@/lib/freee'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    // freee APIが有効かチェック
    const enabled = isFreeeEnabled()

    if (!enabled) {
      return NextResponse.json(
        {
          enabled: false,
          connected: false,
          message: 'freee連携は設定されていません',
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    // 連携状態を取得
    const integration = await prisma.freeeIntegration.findUnique({
      where: { userId: session.user.id },
      select: {
        companyId: true,
        companyName: true,
        isActive: true,
        autoSync: true,
        lastSyncAt: true,
        tokenExpiresAt: true,
      },
    })

    return NextResponse.json(
      {
        enabled: true,
        connected: !!integration,
        integration: integration
          ? {
              companyId: integration.companyId,
              companyName: integration.companyName,
              isActive: integration.isActive,
              autoSync: integration.autoSync,
              lastSyncAt: integration.lastSyncAt,
              tokenExpiresAt: integration.tokenExpiresAt,
            }
          : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching freee status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
