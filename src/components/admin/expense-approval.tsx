'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  User,
  Home
} from 'lucide-react'
import Link from 'next/link'

interface Expense {
  id: string
  userId: string
  expenseDate: string
  amount: number
  taxRate: number
  taxAmount: number
  amountWithoutTax: number
  vendor: string
  purpose: string
  category: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  images: Array<{
    id: string
    filePath: string
    fileName: string
  }>
}

interface ExpenseApprovalProps {
  masterUserId: string
}

export function ExpenseApproval({ masterUserId }: ExpenseApprovalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [statusFilter])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/expenses?${params.toString()}`)

      if (!response.ok) {
        throw new Error('経費の取得に失敗しました')
      }

      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (expenseId: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/expenses/${expenseId}/approve`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('承認に失敗しました')
      }

      setSuccess('経費を承認しました')
      setIsDetailOpen(false)
      await fetchExpenses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const handleReject = async (expenseId: string) => {
    if (!rejectReason.trim()) {
      setError('却下理由を入力してください')
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/admin/expenses/${expenseId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (!response.ok) {
        throw new Error('却下に失敗しました')
      }

      setSuccess('経費を却下しました')
      setRejectReason('')
      setIsDetailOpen(false)
      await fetchExpenses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return '下書き'
      case 'PENDING': return '申請中'
      case 'APPROVED': return '承認済み'
      case 'REJECTED': return '却下'
      case 'REVISION': return '修正依頼'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'REJECTED': return <XCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">経費承認</h2>
          <p className="text-gray-600">経費申請の承認・却下</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="h-4 w-4 mr-2" />
            ホーム
          </Link>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="PENDING">申請中</SelectItem>
              <SelectItem value="APPROVED">承認済み</SelectItem>
              <SelectItem value="REJECTED">却下</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchExpenses} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>経費申請一覧</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              経費申請がありません
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedExpense(expense)
                    setIsDetailOpen(true)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(expense.status)}`}>
                          {getStatusIcon(expense.status)}
                          <span className="ml-1">{getStatusText(expense.status)}</span>
                        </span>
                        <span className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(expense.expenseDate)}
                        </span>
                        <span className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          {expense.user.name}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">金額</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">支払先</div>
                          <div className="font-medium text-gray-900">{expense.vendor}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">カテゴリ</div>
                          <div className="flex items-center text-gray-900">
                            <Tag className="h-4 w-4 mr-1" />
                            {expense.category}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">領収書</div>
                          <div className="flex items-center text-gray-900">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            {expense.images.length}枚
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-sm text-gray-500">目的</div>
                        <div className="text-sm text-gray-900 line-clamp-2">{expense.purpose}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>経費申請詳細</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">申請者</div>
                  <div className="font-medium">{selectedExpense.user.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">日付</div>
                  <div className="font-medium">{formatDate(selectedExpense.expenseDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">カテゴリ</div>
                  <div className="font-medium">{selectedExpense.category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">支払先</div>
                  <div className="font-medium">{selectedExpense.vendor}</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">税抜金額:</span>
                    <span className="font-semibold">{formatCurrency(selectedExpense.amountWithoutTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">税額:</span>
                    <span className="font-semibold">{formatCurrency(selectedExpense.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="font-bold">合計（税込）:</span>
                    <span className="font-bold text-lg">{formatCurrency(selectedExpense.amount)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">目的・用途</div>
                <div className="p-3 bg-gray-50 rounded-md text-sm">{selectedExpense.purpose}</div>
              </div>

              {selectedExpense.images.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">領収書画像</div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedExpense.images.map((image) => (
                      <img
                        key={image.id}
                        src={image.filePath}
                        alt={image.fileName}
                        className="w-full h-48 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedExpense.status === 'PENDING' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApprove(selectedExpense.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      承認する
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('却下理由を入力してください:')
                        if (reason) {
                          setRejectReason(reason)
                          handleReject(selectedExpense.id)
                        }
                      }}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      却下する
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
