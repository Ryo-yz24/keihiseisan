import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// カテゴリは頻繁に変更されないため、revalidateを設定
export const revalidate = 60 // 60秒ごとに再検証

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let masterUserId = session.user.id

    // 子アカウントの場合、マスターユーザーIDを取得
    if (session.user.role === 'CHILD') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { masterUserId: true },
      })

      if (user && user.masterUserId) {
        masterUserId = user.masterUserId
      }
    }

    // 管理画面用：すべてのカテゴリを取得（無効も含む）
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true'

    const categories = await prisma.category.findMany({
      where: {
        masterUserId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    // Cache-Controlヘッダーを追加
    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // MASTERロールのみがカテゴリを作成可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'カテゴリ名を入力してください' },
        { status: 400 }
      )
    }

    // 最大の表示順序を取得
    const maxOrderCategory = await prisma.category.findFirst({
      where: { masterUserId: session.user.id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })

    const nextOrder = maxOrderCategory ? maxOrderCategory.displayOrder + 1 : 1

    // カテゴリを作成
    const category = await prisma.category.create({
      data: {
        masterUserId: session.user.id,
        name: name.trim(),
        displayOrder: nextOrder,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'カテゴリを作成しました',
      category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
