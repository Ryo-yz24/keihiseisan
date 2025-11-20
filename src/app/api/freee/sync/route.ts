import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  decryptToken,
  refreshAccessToken,
  encryptToken,
  createDeal,
  getTaxCode,
} from '@/lib/freee'

export const dynamic = 'force-dynamic'

// 個別の経費をfreeeに同期
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
    const { expenseId } = body

    if (!expenseId) {
      return NextResponse.json(
        { error: '経費IDが指定されていません' },
        { status: 400 }
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

    // 経費データを取得
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        user: true,
        freeeSync: true,
      },
    })

    if (!expense) {
      return NextResponse.json(
        { error: '経費が見つかりません' },
        { status: 404 }
      )
    }

    // 承認済みの経費のみ同期可能
    if (expense.status !== 'APPROVED') {
      return NextResponse.json(
        { error: '承認済みの経費のみ同期できます' },
        { status: 400 }
      )
    }

    // 既に同期済みの場合はスキップ
    if (expense.freeeSync && expense.freeeSync.status === 'SYNCED') {
      return NextResponse.json({
        success: true,
        message: 'この経費は既にfreeeに同期済みです',
        sync: expense.freeeSync,
      })
    }

    // カテゴリマッピングを取得
    const categoryMapping = await prisma.freeeCategoryMapping.findUnique({
      where: {
        userId_categoryName: {
          userId: session.user.id,
          categoryName: expense.category,
        },
      },
    })

    if (!categoryMapping) {
      return NextResponse.json(
        {
          error: `カテゴリ「${expense.category}」のマッピングが設定されていません`,
        },
        { status: 400 }
      )
    }

    // アクセストークンを復号化
    let accessToken = decryptToken(integration.accessToken)

    // トークンの有効期限をチェック
    if (new Date() >= integration.tokenExpiresAt) {
      // トークンを更新
      const refreshToken = decryptToken(integration.refreshToken)
      const newTokens = await refreshAccessToken(refreshToken)

      // 新しいトークンを暗号化して保存
      accessToken = newTokens.accessToken
      await prisma.freeeIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: encryptToken(newTokens.accessToken),
          refreshToken: encryptToken(newTokens.refreshToken),
          tokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
        },
      })
    }

    // freeeに取引を登録
    const dealData = {
      issue_date: expense.expenseDate.toISOString().split('T')[0],
      type: 'expense' as const,
      details: [
        {
          account_item_id: categoryMapping.freeeAccountItemId,
          tax_code: getTaxCode(Number(expense.taxRate) * 100),
          amount: Number(expense.amount),
          description: `${expense.vendor} - ${expense.purpose}`,
        },
      ],
    }

    const result = await createDeal(accessToken, integration.companyId, dealData)

    // 同期ログを作成・更新
    const syncData = {
      integrationId: integration.id,
      expenseId: expense.id,
      freeDealId: result.deal.id,
      status: 'SYNCED' as const,
      syncedAt: new Date(),
    }

    const sync = await prisma.freeeSync.upsert({
      where: { expenseId: expense.id },
      create: syncData,
      update: syncData,
    })

    // 最終同期日時を更新
    await prisma.freeeIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: 'freeeに同期しました',
      sync,
      deal: result.deal,
    })
  } catch (error: any) {
    console.error('Error syncing to freee:', error)

    // 同期エラーをログに記録
    const body = await request.json().catch(() => ({ expenseId: null }))
    if (body.expenseId) {
      try {
        const integration = await prisma.freeeIntegration.findUnique({
          where: { userId: (await getServerSession(authOptions))?.user.id },
        })

        if (integration) {
          await prisma.freeeSync.upsert({
            where: { expenseId: body.expenseId },
            create: {
              integrationId: integration.id,
              expenseId: body.expenseId,
              status: 'FAILED',
              errorMessage: error.message || 'Unknown error',
            },
            update: {
              status: 'FAILED',
              errorMessage: error.message || 'Unknown error',
            },
          })
        }
      } catch (logError) {
        console.error('Error logging sync failure:', logError)
      }
    }

    return NextResponse.json(
      { error: error.message || 'freeeへの同期に失敗しました' },
      { status: 500 }
    )
  }
}
