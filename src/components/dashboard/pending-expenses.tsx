'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react'

interface PendingExpense {
  id: string
  amount: number
  vendor: string
  purpose: string
  category: string
  expenseDate: string
  user: {
    name: string
    email: string
  }
  createdAt: string
}

interface PendingExpensesProps {
  masterUserId: string
}

export function PendingExpenses({ masterUserId }: PendingExpensesProps) {
  const [expenses, setExpenses] = useState<PendingExpense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: APIからデータを取得
    // 現在はモックデータ
    setTimeout(() => {
      setExpenses([
        {
          id: '1',
          amount: 15000,
          vendor: '株式会社サンプル',
          purpose: '会議費',
          category: '飲食費（接待）',
          expenseDate: '2024-01-15',
          user: {
            name: '田中太郎',
            email: 'tanaka@example.com'
          },
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          amount: 8500,
          vendor: '交通費',
          purpose: '出張費',
          category: '交通費',
          expenseDate: '2024-01-14',
          user: {
            name: '佐藤花子',
            email: 'sato@example.com'
          },
          createdAt: '2024-01-14T16:45:00Z'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [masterUserId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleApprove = async (expenseId: string) => {
    // TODO: 承認APIを呼び出し
    console.log('承認:', expenseId)
  }

  const handleReject = async (expenseId: string) => {
    // TODO: 却下APIを呼び出し
    console.log('却下:', expenseId)
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            承認待ちの経費申請
          </h3>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            承認待ちの経費申請
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            {expenses.length}件
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">承認待ちの申請はありません</h3>
            <p className="mt-1 text-sm text-gray-500">新しい経費申請が提出されると、ここに表示されます。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">支払先:</span> {expense.vendor}</p>
                      <p><span className="font-medium">利用目的:</span> {expense.purpose}</p>
                      <p><span className="font-medium">利用日:</span> {formatDate(expense.expenseDate)}</p>
                      <p><span className="font-medium">申請者:</span> {expense.user.name} ({expense.user.email})</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => console.log('詳細表示:', expense.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      詳細
                    </button>
                    
                    <button
                      onClick={() => handleApprove(expense.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      承認
                    </button>
                    
                    <button
                      onClick={() => handleReject(expense.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      却下
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



