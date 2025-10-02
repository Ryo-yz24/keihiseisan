import { prisma } from './prisma'
import { ExpenseStatus, LimitType } from '@prisma/client'

export interface CarryoverInfo {
  userId: string
  year: number
  month: number
  originalLimit: number
  usedAmount: number
  carryoverAmount: number
  availableAmount: number // 利用可能金額（繰越 + 当月限度額）
}

/**
 * 指定月の経費繰越情報を取得
 */
export async function getCarryoverInfo(
  userId: string,
  year: number,
  month: number
): Promise<CarryoverInfo | null> {
  try {
    // 当月の限度額を取得
    const currentLimit = await prisma.expenseLimit.findFirst({
      where: {
        masterUserId: userId,
        limitType: LimitType.MONTHLY,
        year: year,
        month: month
      }
    })

    if (!currentLimit) {
      return null
    }

    // 当月の使用済み金額を計算
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
    const originalLimitValue = Number(currentLimit.limitAmount)

    // 前月の繰越情報を取得
    const previousMonth = month === 1 ? 12 : month - 1
    const previousYear = month === 1 ? year - 1 : year

    const previousCarryover = await prisma.expenseCarryover.findUnique({
      where: {
        userId_year_month: {
          userId: userId,
          year: previousYear,
          month: previousMonth
        }
      }
    })

    const carryoverAmount = previousCarryover ? Number(previousCarryover.carryoverAmount) : 0
    const availableAmount = originalLimitValue + carryoverAmount

    return {
      userId,
      year,
      month,
      originalLimit: originalLimitValue,
      usedAmount: usedAmountValue,
      carryoverAmount,
      availableAmount
    }
  } catch (error) {
    console.error('Error getting carryover info:', error)
    return null
  }
}

/**
 * 月次繰越処理を実行
 */
export async function processMonthlyCarryover(
  userId: string,
  year: number,
  month: number
): Promise<boolean> {
  try {
    const carryoverInfo = await getCarryoverInfo(userId, year, month)
    
    if (!carryoverInfo) {
      return false
    }

    // 繰越金額を計算（限度額を超えた分は繰越しない）
    const carryoverAmount = Math.max(0, carryoverInfo.originalLimit - carryoverInfo.usedAmount)

    // 繰越情報を保存または更新
    await prisma.expenseCarryover.upsert({
      where: {
        userId_year_month: {
          userId: userId,
          year: year,
          month: month
        }
      },
      update: {
        originalLimit: carryoverInfo.originalLimit,
        usedAmount: carryoverInfo.usedAmount,
        carryoverAmount: carryoverAmount,
        isProcessed: true,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        year: year,
        month: month,
        originalLimit: carryoverInfo.originalLimit,
        usedAmount: carryoverInfo.usedAmount,
        carryoverAmount: carryoverAmount,
        isProcessed: true
      }
    })

    return true
  } catch (error) {
    console.error('Error processing monthly carryover:', error)
    return false
  }
}

/**
 * 全ユーザーの月次繰越処理を実行（バッチ処理用）
 */
export async function processAllUsersCarryover(year: number, month: number): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'CHILD',
        deletedAt: null
      }
    })

    for (const user of users) {
      await processMonthlyCarryover(user.id, year, month)
    }
  } catch (error) {
    console.error('Error processing all users carryover:', error)
  }
}

/**
 * 繰越履歴を取得
 */
export async function getCarryoverHistory(
  userId: string,
  year: number,
  limit: number = 12
): Promise<CarryoverInfo[]> {
  try {
    const carryovers = await prisma.expenseCarryover.findMany({
      where: {
        userId: userId,
        year: year
      },
      orderBy: [
        { month: 'asc' }
      ],
      take: limit
    })

    return carryovers.map(carryover => ({
      userId: carryover.userId,
      year: carryover.year,
      month: carryover.month,
      originalLimit: Number(carryover.originalLimit),
      usedAmount: Number(carryover.usedAmount),
      carryoverAmount: Number(carryover.carryoverAmount),
      availableAmount: Number(carryover.originalLimit) + Number(carryover.carryoverAmount)
    }))
  } catch (error) {
    console.error('Error getting carryover history:', error)
    return []
  }
}
