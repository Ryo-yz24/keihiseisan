import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// freee連携設定を更新
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { autoSync } = body

    if (typeof autoSync !== 'boolean') {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      )
    }

    // freee連携設定を更新
    const integration = await prisma.freeeIntegration.findUnique({
      where: { userId: session.user.id },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'freee連携が設定されていません' },
        { status: 404 }
      )
    }

    await prisma.freeeIntegration.update({
      where: { id: integration.id },
      data: { autoSync },
    })

    return NextResponse.json({
      success: true,
      message: '設定を更新しました',
    })
  } catch (error: any) {
    console.error('Error updating freee settings:', error)
    return NextResponse.json(
      { error: error.message || '設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
