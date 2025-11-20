import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptToken, getAccountItems } from '@/lib/freee'

export const dynamic = 'force-dynamic'

// カテゴリマッピングの一覧を取得
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

    // freee連携設定を取得
    const integration = await prisma.freeeIntegration.findUnique({
      where: { userId: session.user.id },
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { error: 'freee連携が有効になっていません' },
        { status: 400 }
      )
    }

    // 既存のマッピングを取得
    const mappings = await prisma.freeeCategoryMapping.findMany({
      where: { userId: session.user.id },
      orderBy: { categoryName: 'asc' },
    })

    // freeeの勘定科目一覧を取得
    const accessToken = decryptToken(integration.accessToken)
    const accountItemsData = await getAccountItems(
      accessToken,
      integration.companyId
    )
    const accountItems = accountItemsData.account_items || []

    return NextResponse.json({
      success: true,
      mappings,
      accountItems,
    })
  } catch (error: any) {
    console.error('Error fetching category mappings:', error)
    return NextResponse.json(
      { error: error.message || 'マッピングの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// カテゴリマッピングを作成・更新
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
    const { categoryName, freeeAccountItemId, freeeAccountItemName } = body

    if (!categoryName || !freeeAccountItemId || !freeeAccountItemName) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    // freee連携設定を確認
    const integration = await prisma.freeeIntegration.findUnique({
      where: { userId: session.user.id },
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { error: 'freee連携が有効になっていません' },
        { status: 400 }
      )
    }

    // マッピングを作成・更新
    const mapping = await prisma.freeeCategoryMapping.upsert({
      where: {
        userId_categoryName: {
          userId: session.user.id,
          categoryName,
        },
      },
      create: {
        userId: session.user.id,
        categoryName,
        freeeAccountItemId,
        freeeAccountItemName,
      },
      update: {
        freeeAccountItemId,
        freeeAccountItemName,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'カテゴリマッピングを保存しました',
      mapping,
    })
  } catch (error: any) {
    console.error('Error saving category mapping:', error)
    return NextResponse.json(
      { error: error.message || 'マッピングの保存に失敗しました' },
      { status: 500 }
    )
  }
}

// カテゴリマッピングを削除
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const mappingId = searchParams.get('id')

    if (!mappingId) {
      return NextResponse.json(
        { error: 'マッピングIDが指定されていません' },
        { status: 400 }
      )
    }

    // マッピングを削除（所有者確認を含む）
    const mapping = await prisma.freeeCategoryMapping.findUnique({
      where: { id: mappingId },
    })

    if (!mapping) {
      return NextResponse.json(
        { error: 'マッピングが見つかりません' },
        { status: 404 }
      )
    }

    if (mapping.userId !== session.user.id) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    await prisma.freeeCategoryMapping.delete({
      where: { id: mappingId },
    })

    return NextResponse.json({
      success: true,
      message: 'カテゴリマッピングを削除しました',
    })
  } catch (error: any) {
    console.error('Error deleting category mapping:', error)
    return NextResponse.json(
      { error: error.message || 'マッピングの削除に失敗しました' },
      { status: 500 }
    )
  }
}
