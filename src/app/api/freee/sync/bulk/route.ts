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

// 複数の経費をfreeeに一括同期
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
    const { expenseIds } = body

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
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

    // アクセストークンを復号化
    let accessToken = decryptToken(integration.accessToken)

    // トークンの有効期限をチェック
    if (new Date() >= integration.tokenExpiresAt) {
      const refreshToken = decryptToken(integration.refreshToken)
      const newTokens = await refreshAccessToken(refreshToken)

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

    // 経費データを取得
    const expenses = await prisma.expense.findMany({
      where: {
        id: { in: expenseIds },
        status: 'APPROVED', // 承認済みのみ
      },
      include: {
        user: true,
        freeeSync: true,
      },
    })

    const results = []
    const errors = []

    // 各経費を順次同期
    for (const expense of expenses) {
      try {
        // 既に同期済みの場合はスキップ
        if (expense.freeeSync && expense.freeeSync.status === 'SYNCED') {
          results.push({
            expenseId: expense.id,
            status: 'SKIPPED',
            message: '既に同期済みです',
          })
          continue
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
          errors.push({
            expenseId: expense.id,
            error: `カテゴリ「${expense.category}」のマッピングが設定されていません`,
          })

          await prisma.freeeSync.upsert({
            where: { expenseId: expense.id },
            create: {
              integrationId: integration.id,
              expenseId: expense.id,
              status: 'FAILED',
              errorMessage: `カテゴリ「${expense.category}」のマッピングが設定されていません`,
            },
            update: {
              status: 'FAILED',
              errorMessage: `カテゴリ「${expense.category}」のマッピングが設定されていません`,
            },
          })

          continue
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

        const result = await createDeal(
          accessToken,
          integration.companyId,
          dealData
        )

        // 同期ログを作成・更新
        const syncData = {
          integrationId: integration.id,
          expenseId: expense.id,
          freeDealId: result.deal.id,
          status: 'SYNCED' as const,
          syncedAt: new Date(),
        }

        await prisma.freeeSync.upsert({
          where: { expenseId: expense.id },
          create: syncData,
          update: syncData,
        })

        results.push({
          expenseId: expense.id,
          status: 'SYNCED',
          freeDealId: result.deal.id,
        })
      } catch (error: any) {
        console.error(`Error syncing expense ${expense.id}:`, error)
        errors.push({
          expenseId: expense.id,
          error: error.message || 'Unknown error',
        })

        // 同期エラーをログに記録
        try {
          await prisma.freeeSync.upsert({
            where: { expenseId: expense.id },
            create: {
              integrationId: integration.id,
              expenseId: expense.id,
              status: 'FAILED',
              errorMessage: error.message || 'Unknown error',
            },
            update: {
              status: 'FAILED',
              errorMessage: error.message || 'Unknown error',
            },
          })
        } catch (logError) {
          console.error('Error logging sync failure:', logError)
        }
      }
    }

    // 最終同期日時を更新
    await prisma.freeeIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: `${results.length}件の経費を同期しました`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error bulk syncing to freee:', error)
    return NextResponse.json(
      { error: error.message || 'freeeへの一括同期に失敗しました' },
      { status: 500 }
    )
  }
}
