import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// カテゴリ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // MASTERロールのみが更新可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, isActive, displayOrder } = body
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

    // 更新データの準備
    const updateData: any = {}
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim()
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }
    if (displayOrder !== undefined) {
      updateData.displayOrder = displayOrder
    }

    // カテゴリを更新
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'カテゴリを更新しました',
      category: updatedCategory
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// カテゴリ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // MASTERロールのみが削除可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

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

    // このカテゴリを使用している経費の数を確認
    const expenseCount = await prisma.expense.count({
      where: { categoryId }
    })

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: `このカテゴリは${expenseCount}件の経費で使用されているため削除できません` },
        { status: 400 }
      )
    }

    // カテゴリを削除
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'カテゴリを削除しました'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
