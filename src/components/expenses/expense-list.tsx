'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  DollarSign,
  Building2,
  Tag,
  User
} from 'lucide-react'

interface Expense {
  id: string
  expenseDate: Date
  amount: number
  taxRate: number
  taxAmount: number
  amountWithoutTax: number
  vendor: string
  purpose: string
  category: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  approvedAt?: Date | null
  approvedBy?: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
  approver?: {
    id: string
    name: string | null
  } | null
}

interface ExpenseListProps {
  expenses: Expense[]
  user: {
    id: string
    email: string
    name?: string | null
    role: 'MASTER' | 'CHILD'
    masterUserId?: string | null
    canViewOthers: boolean
  }
  onEdit: (expenseId: string) => void
  onDelete: (expenseId: string) => void
  onView: (expenseId: string) => void
  onApprove?: (expenseId: string) => void
  onReject?: (expenseId: string) => void
  isLoading?: boolean
}

export function ExpenseList({ 
  expenses, 
  user, 
  onEdit, 
  onDelete, 
  onView, 
  onApprove, 
  onReject,
  isLoading = false 
}: ExpenseListProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '承認済み'
      case 'REJECTED':
        return '却下'
      case 'PENDING':
        return '承認待ち'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <DollarSign className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">経費がありません</h3>
        <p className="text-gray-500">新しい経費を申請してください。</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {expense.vendor}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                    {getStatusIcon(expense.status)}
                    <span className="ml-1">{getStatusText(expense.status)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {format(new Date(expense.expenseDate), 'yyyy年M月d日', { locale: ja })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="w-4 h-4 mr-2 text-gray-400" />
                    {expense.category}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                    {expense.vendor}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {expense.purpose}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      申請日: {format(new Date(expense.createdAt), 'yyyy/M/d H:mm', { locale: ja })}
                    </span>
                    {expense.approvedAt && (
                      <span>
                        承認日: {format(new Date(expense.approvedAt), 'yyyy/M/d H:mm', { locale: ja })}
                      </span>
                    )}
                    {expense.approver && (
                      <span>
                        承認者: {expense.approver.name}
                      </span>
                    )}
                  </div>
                </div>

                {expense.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">却下理由</p>
                        <p className="text-sm text-red-700 mt-1">{expense.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onView(expense.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="詳細を見る"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {(expense.status === 'PENDING' || expense.status === 'REJECTED') && (
                  <button
                    onClick={() => onEdit(expense.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="編集"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                {user.role === 'MASTER' && expense.status === 'PENDING' && onApprove && (
                  <button
                    onClick={() => onApprove(expense.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="承認"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}

                {user.role === 'MASTER' && expense.status === 'PENDING' && onReject && (
                  <button
                    onClick={() => onReject(expense.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="却下"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}

                {(expense.status === 'PENDING' || expense.status === 'REJECTED') && (
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}