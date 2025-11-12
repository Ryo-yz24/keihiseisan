'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Eye, AlertCircle, X, Image as ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PendingExpense {
  id: string
  userId: string
  amount: number
  taxRate: number
  taxAmount: number
  amountWithoutTax: number
  vendor: string
  purpose: string
  category: string
  expenseDate: string
  status: string
  user: {
    id: string
    name: string
    email: string
  }
  images?: Array<{
    id: string
    filePath: string
    fileName: string
  }>
  createdAt: string
}

interface PendingExpensesProps {
  masterUserId: string
}

export function PendingExpenses({ masterUserId }: PendingExpensesProps) {
  const [expenses, setExpenses] = useState<PendingExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<PendingExpense | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [masterUserId])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/expenses?status=PENDING')

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

  const handleViewDetail = (expense: PendingExpense) => {
    setSelectedExpense(expense)
    setIsDetailOpen(true)
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
      setIsRejectDialogOpen(false)
      setIsDetailOpen(false)
      await fetchExpenses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const openRejectDialog = (expense: PendingExpense) => {
    setSelectedExpense(expense)
    setIsRejectDialogOpen(true)
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
    <div id="pending-expenses" className="bg-white shadow rounded-lg">
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

        {/* Success Message */}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

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
                      onClick={() => handleViewDetail(expense)}
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
                      onClick={() => openRejectDialog(expense)}
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

      {/* 詳細モーダル */}
      {selectedExpense && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>経費詳細</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">金額</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedExpense.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">カテゴリ</label>
                  <p className="mt-1 text-gray-900">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">支払先</label>
                  <p className="mt-1 text-gray-900">{selectedExpense.vendor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">利用日</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedExpense.expenseDate)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">利用目的</label>
                  <p className="mt-1 text-gray-900">{selectedExpense.purpose}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">申請者</label>
                  <p className="mt-1 text-gray-900">{selectedExpense.user.name}</p>
                  <p className="text-sm text-gray-500">{selectedExpense.user.email}</p>
                </div>
              </div>

              {/* 税額詳細 */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">税額詳細</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">税抜金額:</span>
                    <span className="text-gray-900">{formatCurrency(selectedExpense.amountWithoutTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">消費税 ({(selectedExpense.taxRate * 100).toFixed(0)}%):</span>
                    <span className="text-gray-900">{formatCurrency(selectedExpense.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">税込合計:</span>
                    <span className="text-gray-900">{formatCurrency(selectedExpense.amount)}</span>
                  </div>
                </div>
              </div>

              {/* 領収書画像 */}
              {selectedExpense.images && selectedExpense.images.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    領収書画像
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedExpense.images.map((image) => (
                      <div key={image.id} className="border rounded-lg overflow-hidden">
                        <img
                          src={image.filePath}
                          alt={image.fileName}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex justify-end space-x-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  閉じる
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDetailOpen(false)
                    openRejectDialog(selectedExpense)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  却下
                </Button>
                <Button
                  onClick={() => handleApprove(selectedExpense.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  承認
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 却下理由入力ダイアログ */}
      {selectedExpense && (
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>経費を却下</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                この経費申請を却下します。却下理由を入力してください。
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  却下理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                  placeholder="却下理由を入力してください"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(false)
                    setRejectReason('')
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedExpense.id)}
                  disabled={!rejectReason.trim()}
                >
                  却下する
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}



