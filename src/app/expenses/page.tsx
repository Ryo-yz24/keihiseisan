import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ExpenseManagement } from '@/components/expenses/expense-management'
import { prisma } from '@/lib/prisma'

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  // 一時的にモックデータを使用（データベース接続が完了するまで）
  let expenses: any[] = []
  let categories: any[] = []

  try {
    // 経費データを取得
    expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.role === 'MASTER' && session.user.masterUserId
          ? { in: await prisma.user.findMany({
              where: { masterUserId: session.user.id },
              select: { id: true }
            }).then(users => users.map(u => u.id)) }
          : session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // カテゴリデータを取得
    const masterUserId = session.user.role === 'MASTER' 
      ? session.user.id 
      : session.user.masterUserId

    if (masterUserId) {
      categories = await prisma.category.findMany({
        where: {
          masterUserId: masterUserId,
          isActive: true
        },
        orderBy: {
          displayOrder: 'asc'
        }
      })
    }
  } catch (error) {
    console.log('データベース接続エラー、モックデータを使用します:', error)
    
    // モックデータ
    expenses = [
      {
        id: '1',
        expenseDate: new Date('2024-01-15'),
        amount: 15000,
        taxRate: 0.10,
        taxAmount: 1364,
        amountWithoutTax: 13636,
        vendor: '株式会社サンプル',
        purpose: '会議費',
        category: '飲食費（接待）',
        status: 'PENDING',
        rejectionReason: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        userId: session.user.id,
        approvedAt: null,
        approvedBy: null,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        approver: null
      },
      {
        id: '2',
        expenseDate: new Date('2024-01-14'),
        amount: 8500,
        taxRate: 0.10,
        taxAmount: 773,
        amountWithoutTax: 7727,
        vendor: '交通費',
        purpose: '出張費',
        category: '交通費',
        status: 'APPROVED',
        rejectionReason: null,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-15'),
        userId: session.user.id,
        approvedAt: new Date('2024-01-15'),
        approvedBy: 'admin',
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        approver: {
          id: 'admin',
          name: '管理者'
        }
      }
    ]

    categories = [
      { id: '1', name: '交通費', displayOrder: 1, isActive: true },
      { id: '2', name: '飲食費（接待）', displayOrder: 2, isActive: true },
      { id: '3', name: '消耗品費', displayOrder: 3, isActive: true },
      { id: '4', name: '通信費', displayOrder: 4, isActive: true },
      { id: '5', name: '水道光熱費', displayOrder: 5, isActive: true },
      { id: '6', name: '広告宣伝費', displayOrder: 6, isActive: true },
      { id: '7', name: 'その他（未分類）', displayOrder: 7, isActive: true }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExpenseManagement 
        user={session.user} 
        initialExpenses={expenses}
        categories={categories}
      />
    </div>
  )
}
