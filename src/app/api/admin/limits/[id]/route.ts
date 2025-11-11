import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// PATCH: 限度額の編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { targetUserId, limitType, limitAmount, year, month } = await request.json()

    const existingLimit = await prisma.expenseLimit.findUnique({
      where: { id },
    })

    if (!existingLimit) {
      return NextResponse.json({ error: 'Limit not found' }, { status: 404 })
    }

    if (existingLimit.masterUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!limitType || !limitAmount || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (limitType !== 'MONTHLY' && limitType !== 'YEARLY') {
      return NextResponse.json({ error: 'Invalid limit type' }, { status: 400 })
    }

    if (limitType === 'MONTHLY' && !month) {
      return NextResponse.json({ error: 'Month is required for monthly limits' }, { status: 400 })
    }

    const amount = parseFloat(limitAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid limit amount' }, { status: 400 })
    }

    if (targetUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      })

      if (!targetUser || targetUser.masterUserId !== session.user.id) {
        return NextResponse.json({ error: 'Invalid target user' }, { status: 400 })
      }
    }

    const duplicateLimit = await prisma.expenseLimit.findFirst({
      where: {
        masterUserId: session.user.id,
        targetUserId: targetUserId || null,
        limitType,
        year: parseInt(year),
        month: month ? parseInt(month) : null,
        NOT: {
          id: id,
        },
      },
    })

    if (duplicateLimit) {
      return NextResponse.json({ 
        error: 'この条件の限度額は既に設定されています。' 
      }, { status: 400 })
    }

    const updatedLimit = await prisma.expenseLimit.update({
      where: { id },
      data: {
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
      action: 'UPDATE',
      tableName: 'expense_limits',
      recordId: id,
      oldValue: {
        limitAmount: existingLimit.limitAmount.toString(),
        limitType: existingLimit.limitType,
      },
      newValue: {
        limitAmount: updatedLimit.limitAmount.toString(),
        limitType: updatedLimit.limitType,
      },
      request,
    })

    return NextResponse.json({
      success: true,
      limit: updatedLimit,
    })
  } catch (error) {
    console.error('Error updating expense limit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 限度額の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const existingLimit = await prisma.expenseLimit.findUnique({
      where: { id },
    })

    if (!existingLimit) {
      return NextResponse.json({ error: 'Limit not found' }, { status: 404 })
    }

    if (existingLimit.masterUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.expenseLimit.delete({
      where: { id },
    })

    // 監査ログを記録
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      tableName: 'expense_limits',
      recordId: id,
      oldValue: {
        limitAmount: existingLimit.limitAmount.toString(),
        limitType: existingLimit.limitType,
        year: existingLimit.year,
        month: existingLimit.month,
      },
      request,
    })

    return NextResponse.json({
      success: true,
      message: 'Limit deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting expense limit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
