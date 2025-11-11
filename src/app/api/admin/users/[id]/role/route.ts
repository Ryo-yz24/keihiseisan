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

    // MASTERロールのみがロール変更可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body
    const targetUserId = params.id

    // ロールのバリデーション
    if (role !== 'MASTER' && role !== 'CHILD') {
      return NextResponse.json(
        { error: '無効なロールです' },
        { status: 400 }
      )
    }

    // 自分自身のロールは変更不可
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: '自分自身のロールは変更できません' },
        { status: 400 }
      )
    }

    // 対象ユーザーの取得
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 最後のMASTERユーザーのロールは変更不可（システムロックアウト防止）
    if (targetUser.role === 'MASTER' && role === 'CHILD') {
      const masterCount = await prisma.user.count({
        where: { role: 'MASTER' }
      })

      if (masterCount <= 1) {
        return NextResponse.json(
          { error: '最後の管理者のロールは変更できません' },
          { status: 400 }
        )
      }
    }

    // ロールを更新
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      message: 'ロールを更新しました',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
