import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

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
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // マスターユーザーが自分自身の経費を却下する場合、または配下ユーザーの経費を却下する場合を許可
    const isSelfRejection = expense.userId === session.user.id
    const isChildUserExpense = expense.user.masterUserId === session.user.id

    if (!isSelfRejection && !isChildUserExpense) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 承認済み、申請中、修正依頼中の経費を却下可能（下書きと既に却下済みは不可）
    if (expense.status === 'DRAFT' || expense.status === 'REJECTED') {
      return NextResponse.json({
        error: expense.status === 'DRAFT' ? '下書きの経費は却下できません' : 'すでに却下されています'
      }, { status: 400 })
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    })

    // 監査ログを記録
    await createAuditLog({
      userId: session.user.id,
      action: 'REJECT',
      tableName: 'expenses',
      recordId: id,
      oldValue: { status: expense.status },
      newValue: { status: 'REJECTED', rejectionReason: reason },
      request,
    })

    // 却下時に申請者にメール通知
    try {
      if (expense.user.email) {
        await sendEmail('expense_rejected', {
          userEmail: expense.user.email,
          amount: expense.amount,
          category: expense.category,
          reason: reason,
        })
      }
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError)
    }

    return NextResponse.json({ success: true, expense: updatedExpense })
  } catch (error) {
    console.error('Error rejecting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
