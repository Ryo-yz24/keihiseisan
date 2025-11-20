import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    // 連携を削除（CASCADE設定により関連する同期ログも削除される）
    await prisma.freeeIntegration.delete({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      success: true,
      message: 'freee連携を解除しました',
    })
  } catch (error: any) {
    // レコードが存在しない場合のエラーハンドリング
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'freee連携が見つかりません' },
        { status: 404 }
      )
    }

    console.error('Error disconnecting freee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
