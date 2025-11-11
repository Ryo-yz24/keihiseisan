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

    // MASTERロールのみが順序変更可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { direction } = body  // 'up' or 'down'
    const categoryId = params.id

    // カテゴリの存在確認と権限チェック
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'カテゴリが見つかりません' },
        { status: 404 }
      )
    }

    if (category.masterUserId !== session.user.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    // 交換対象のカテゴリを探す
    const targetCategory = await prisma.category.findFirst({
      where: {
        masterUserId: session.user.id,
        displayOrder: direction === 'up' ? {
          lt: category.displayOrder
        } : {
          gt: category.displayOrder
        }
      },
      orderBy: {
        displayOrder: direction === 'up' ? 'desc' : 'asc'
      }
    })

    if (!targetCategory) {
      return NextResponse.json(
        { error: 'これ以上移動できません' },
        { status: 400 }
      )
    }

    // 表示順序を交換
    const currentOrder = category.displayOrder
    const targetOrder = targetCategory.displayOrder

    await prisma.$transaction([
      prisma.category.update({
        where: { id: categoryId },
        data: { displayOrder: targetOrder }
      }),
      prisma.category.update({
        where: { id: targetCategory.id },
        data: { displayOrder: currentOrder }
      })
    ])

    return NextResponse.json({
      success: true,
      message: '順序を変更しました'
    })
  } catch (error) {
    console.error('Error reordering category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
