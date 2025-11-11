import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// GET: 限度額一覧の取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 限度額一覧を取得（作成日時の降順）
    const limits = await prisma.expenseLimit.findMany({
      where: {
        masterUserId: session.user.id,
      },
      include: {
        masterUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // targetUserIdがある場合は、そのユーザー情報も取得
    const limitsWithTargetUser = await Promise.all(
      limits.map(async (limit) => {
        if (limit.targetUserId) {
          const targetUser = await prisma.user.findUnique({
            where: { id: limit.targetUserId },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })
          return { ...limit, targetUser }
        }
        return limit
      })
    )

    return NextResponse.json({
      success: true,
      limits: limitsWithTargetUser,
    })
  } catch (error) {
    console.error('Error fetching expense limits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 限度額の作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetUserId, limitType, limitAmount, year, month } = await request.json()

    // バリデーション
    if (!limitType || !limitAmount || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (limitType !== 'MONTHLY' && limitType !== 'YEARLY') {
      return NextResponse.json({ error: 'Invalid limit type' }, { status: 400 })
    }

    // 月次の場合は月が必須
    if (limitType === 'MONTHLY' && !month) {
      return NextResponse.json({ error: 'Month is required for monthly limits' }, { status: 400 })
    }

    // 金額のバリデーション
    const amount = parseFloat(limitAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid limit amount' }, { status: 400 })
    }

    // targetUserIdが指定されている場合、そのユーザーが子アカウントであることを確認
    if (targetUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      })

      if (!targetUser || targetUser.masterUserId !== session.user.id) {
        return NextResponse.json({ error: 'Invalid target user' }, { status: 400 })
      }
    }

    // 同じ条件の限度額が既に存在するかチェック
    const existingLimit = await prisma.expenseLimit.findFirst({
      where: {
        masterUserId: session.user.id,
        targetUserId: targetUserId || null,
        limitType,
        year: parseInt(year),
        month: month ? parseInt(month) : null,
      },
    })

    if (existingLimit) {
      return NextResponse.json({ 
        error: 'この条件の限度額は既に設定されています。編集してください。' 
      }, { status: 400 })
    }

    // 限度額を作成
    const newLimit = await prisma.expenseLimit.create({
      data: {
        masterUserId: session.user.id,
        targetUserId: targetUserId || null,
        limitType,
        limitAmount: amount,
        year: parseInt(year),
        month: month ? parseInt(month) : null,
      },
      include: {
        masterUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // 監査ログを記録
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'expense_limits',
      recordId: newLimit.id,
      newValue: {
        limitType: newLimit.limitType,
        limitAmount: newLimit.limitAmount.toString(),
        year: newLimit.year,
        month: newLimit.month,
        targetUserId: newLimit.targetUserId,
      },
      request,
    })

    return NextResponse.json({
      success: true,
      limit: newLimit,
    })
  } catch (error) {
    console.error('Error creating expense limit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
