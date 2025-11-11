import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

    // 年間の経費データを取得
    const expenses = await prisma.expense.findMany({
      where: {
        user: {
          OR: [
            { id: session.user.id },
            { masterUserId: session.user.id }
          ]
        },
        status: 'APPROVED',
        expenseDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31T23:59:59`)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        expenseDate: 'asc'
      }
    })

    // 月別集計
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthExpenses = expenses.filter(e => {
        const expenseMonth = new Date(e.expenseDate).getMonth() + 1
        return expenseMonth === month
      })

      const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const count = monthExpenses.length

      return {
        month,
        monthName: `${month}月`,
        total,
        count,
        average: count > 0 ? total / count : 0
      }
    })

    // カテゴリ別集計
    const categoryMap = new Map<string, { total: number; count: number }>()
    expenses.forEach(e => {
      const existing = categoryMap.get(e.category) || { total: 0, count: 0 }
      categoryMap.set(e.category, {
        total: existing.total + Number(e.amount),
        count: existing.count + 1
      })
    })

    const categoryData = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: (data.total / expenses.reduce((sum, e) => sum + Number(e.amount), 0)) * 100
    })).sort((a, b) => b.total - a.total)

    // ユーザー別集計
    const userMap = new Map<string, { name: string; total: number; count: number }>()
    expenses.forEach(e => {
      const existing = userMap.get(e.user.id) || { name: e.user.name || e.user.email, total: 0, count: 0 }
      userMap.set(e.user.id, {
        name: existing.name,
        total: existing.total + Number(e.amount),
        count: existing.count + 1
      })
    })

    const userData = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      name: data.name,
      total: data.total,
      count: data.count,
      average: data.total / data.count
    })).sort((a, b) => b.total - a.total)

    // 全体統計
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalCount = expenses.length
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0

    // 最高額と最低額
    const maxExpense = expenses.length > 0
      ? expenses.reduce((max, e) => Number(e.amount) > Number(max.amount) ? e : max)
      : null

    const minExpense = expenses.length > 0
      ? expenses.reduce((min, e) => Number(e.amount) < Number(min.amount) ? e : min)
      : null

    return NextResponse.json({
      year,
      summary: {
        totalAmount,
        totalCount,
        averageAmount,
        maxExpense: maxExpense ? {
          id: maxExpense.id,
          amount: Number(maxExpense.amount),
          vendor: maxExpense.vendor,
          category: maxExpense.category,
          date: maxExpense.expenseDate
        } : null,
        minExpense: minExpense ? {
          id: minExpense.id,
          amount: Number(minExpense.amount),
          vendor: minExpense.vendor,
          category: minExpense.category,
          date: minExpense.expenseDate
        } : null
      },
      monthlyData,
      categoryData,
      userData
    })
  } catch (error) {
    console.error('Error fetching annual summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
