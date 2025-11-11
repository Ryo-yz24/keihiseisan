import { prisma } from './prisma'
import { ExpenseStatus, LimitType, ExemptionRequestStatus } from '@prisma/client'

export interface ExemptionRequest {
  id: string
  userId: string
  year: number
  month: number
  requestedAmount: number
  equivalentMonths: number
  purpose: string
  targetExpenses: string
  status: ExemptionRequestStatus
  rejectionReason?: string
  approvedBy?: string
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ExemptionHistory {
  id: string
  userId: string
  year: number
  month: number
  originalLimit: number
  exemptionAmount: number
  finalLimit: number
  usedAmount: number
  requestId?: string
  createdAt: Date
}

/**
 * 上限解放申請を作成
 */
export async function createExemptionRequest(
  userId: string,
  year: number,
  month: number,
  requestedAmount: number,
  equivalentMonths: number,
  purpose: string,
  targetExpenses: string
): Promise<ExemptionRequest | null> {
  try {
    const request = await prisma.limitExemptionRequest.create({
      data: {
        userId,
        year,
        month,
        requestedAmount,
        equivalentMonths,
        purpose,
        targetExpenses,
        status: ExemptionRequestStatus.PENDING
      }
    })

    return {
      id: request.id,
      userId: request.userId,
      year: request.year,
      month: request.month,
      requestedAmount: Number(request.requestedAmount),
      equivalentMonths: request.equivalentMonths,
      purpose: request.purpose,
      targetExpenses: request.targetExpenses,
      status: request.status,
      rejectionReason: request.rejectionReason || undefined,
      approvedBy: request.approvedBy || undefined,
      approvedAt: request.approvedAt || undefined,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    }
  } catch (error) {
    console.error('Error creating exemption request:', error)
    return null
  }
}

/**
 * 上限解放申請を承認
 */
export async function approveExemptionRequest(
  requestId: string,
  approverId: string
): Promise<boolean> {
  try {
    const request = await prisma.limitExemptionRequest.findUnique({
      where: { id: requestId }
    })

    if (!request || request.status !== ExemptionRequestStatus.PENDING) {
      return false
    }

    // 申請を承認
    await prisma.limitExemptionRequest.update({
      where: { id: requestId },
      data: {
        status: ExemptionRequestStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date()
      }
    })

    // 上限解放履歴を作成
    const originalLimit = await getCurrentMonthLimit(request.userId, request.year, request.month)
    const finalLimit = originalLimit + Number(request.requestedAmount)

    await prisma.limitExemptionHistory.create({
      data: {
        userId: request.userId,
        year: request.year,
        month: request.month,
        originalLimit: originalLimit,
        exemptionAmount: Number(request.requestedAmount),
        finalLimit: finalLimit,
        usedAmount: 0, // 承認時点では使用済みは0
        requestId: requestId
      }
    })

    return true
  } catch (error) {
    console.error('Error approving exemption request:', error)
    return false
  }
}

/**
 * 上限解放申請を却下
 */
export async function rejectExemptionRequest(
  requestId: string,
  rejectionReason: string
): Promise<boolean> {
  try {
    await prisma.limitExemptionRequest.update({
      where: { id: requestId },
      data: {
        status: ExemptionRequestStatus.REJECTED,
        rejectionReason: rejectionReason
      }
    })

    return true
  } catch (error) {
    console.error('Error rejecting exemption request:', error)
    return false
  }
}

/**
 * ユーザーの上限解放申請一覧を取得
 */
export async function getUserExemptionRequests(
  userId: string,
  year?: number,
  month?: number
): Promise<ExemptionRequest[]> {
  try {
    const where: any = { userId }
    
    if (year) where.year = year
    if (month) where.month = month

    const requests = await prisma.limitExemptionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return requests.map((request: any) => ({
      id: request.id,
      userId: request.userId,
      year: request.year,
      month: request.month,
      requestedAmount: Number(request.requestedAmount),
      equivalentMonths: request.equivalentMonths,
      purpose: request.purpose,
      targetExpenses: request.targetExpenses,
      status: request.status,
      rejectionReason: request.rejectionReason || undefined,
      approvedBy: request.approvedBy || undefined,
      approvedAt: request.approvedAt || undefined,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    }))
  } catch (error) {
    console.error('Error getting user exemption requests:', error)
    return []
  }
}

/**
 * 管理者用：全ユーザーの上限解放申請一覧を取得
 */
export async function getAllExemptionRequests(
  masterUserId: string,
  status?: ExemptionRequestStatus
): Promise<ExemptionRequest[]> {
  try {
    const where: any = {
      user: {
        masterUserId: masterUserId
      }
    }
    
    if (status) where.status = status

    const requests = await prisma.limitExemptionRequest.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return requests.map((request: any) => ({
      id: request.id,
      userId: request.userId,
      year: request.year,
      month: request.month,
      requestedAmount: Number(request.requestedAmount),
      equivalentMonths: request.equivalentMonths,
      purpose: request.purpose,
      targetExpenses: request.targetExpenses,
      status: request.status,
      rejectionReason: request.rejectionReason || undefined,
      approvedBy: request.approvedBy || undefined,
      approvedAt: request.approvedAt || undefined,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    }))
  } catch (error) {
    console.error('Error getting all exemption requests:', error)
    return []
  }
}

/**
 * 現在の月次限度額を取得
 */
async function getCurrentMonthLimit(
  userId: string,
  year: number,
  month: number
): Promise<number> {
  try {
    const limit = await prisma.expenseLimit.findFirst({
      where: {
        targetUserId: userId,
        limitType: LimitType.MONTHLY,
        year: year,
        month: month
      }
    })

    return limit ? Number(limit.limitAmount) : 0
  } catch (error) {
    console.error('Error getting current month limit:', error)
    return 0
  }
}

/**
 * ユーザーの現在の利用可能限度額を取得（上限解放を含む）
 */
export async function getCurrentAvailableLimit(
  userId: string,
  year: number,
  month: number
): Promise<{
  originalLimit: number
  exemptionAmount: number
  finalLimit: number
  usedAmount: number
  availableAmount: number
}> {
  try {
    // 元の月次限度額
    const originalLimit = await getCurrentMonthLimit(userId, year, month)

    // 承認済みの上限解放金額
    const exemptionHistory = await prisma.limitExemptionHistory.findFirst({
      where: {
        userId: userId,
        year: year,
        month: month
      },
      orderBy: { createdAt: 'desc' }
    })

    const exemptionAmount = exemptionHistory ? Number(exemptionHistory.exemptionAmount) : 0
    const finalLimit = originalLimit + exemptionAmount

    // 使用済み金額
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

    const usedAmount = await prisma.expense.aggregate({
      where: {
        userId: userId,
        status: ExpenseStatus.APPROVED,
        expenseDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      }
    })

    const usedAmountValue = Number(usedAmount._sum.amount || 0)
    const availableAmount = finalLimit - usedAmountValue

    return {
      originalLimit,
      exemptionAmount,
      finalLimit,
      usedAmount: usedAmountValue,
      availableAmount: Math.max(0, availableAmount)
    }
  } catch (error) {
    console.error('Error getting current available limit:', error)
    return {
      originalLimit: 0,
      exemptionAmount: 0,
      finalLimit: 0,
      usedAmount: 0,
      availableAmount: 0
    }
  }
}
