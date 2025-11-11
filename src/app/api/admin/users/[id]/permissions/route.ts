import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // MASTERロールのみが権限変更可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { canViewOthers } = body
    const targetUserId = params.id

    // バリデーション
    if (typeof canViewOthers !== 'boolean') {
      return NextResponse.json(
        { error: '無効な権限設定です' },
        { status: 400 }
      )
    }

    // 対象ユーザーの存在確認
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 権限を更新
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { canViewOthers },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canViewOthers: true
      }
    })

    return NextResponse.json({
      message: '権限を更新しました',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
