'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, FileText, Calendar, DollarSign, Tag, Clock, CheckCircle, XCircle, Edit, RefreshCw, Trash2, X, ThumbsUp, ThumbsDown, MessageSquare, FileDown } from 'lucide-react'
import { generateExpensePDF, downloadPDF } from '@/lib/pdf'

interface Expense {
  id: string
  expenseDate: string
  amount: number
  vendor: string
  purpose: string
  category: string
  status: string
  createdAt: string
  rejectionReason?: string | null
  images: Array<{
    id: string
    filePath: string
    fileName: string
  }>
}

interface ExpenseListProps {
  userId: string
  userRole?: string
  onEdit?: (expense: Expense) => void
}

export function ExpenseList({ userId, userRole, onEdit }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

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

      const response = await fetch(`/api/expenses?${params.toString()}`)

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

  const handleDelete = async () => {
    if (!selectedExpense) return

    try {
      setDeleting(true)
      setError(null)

      const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      setSuccess('経費を削除しました')
      setDeleteDialogOpen(false)
      setSelectedExpense(null)
      await fetchExpenses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setDeleting(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedExpense) return

    try {
      setProcessing(true)
      setError(null)

      const response = await fetch(`/api/admin/expenses/${selectedExpense.id}/approve`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '承認に失敗しました')
      }

      setSuccess('経費を承認しました')
      setApproveDialogOpen(false)
      setSelectedExpense(null)
      await fetchExpenses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedExpense || !rejectionReason.trim()) {
      setError('却下理由を入力してください')
      return
    }

    try {
      setProcessing(true)
      setError(null)

      const response = await fetch(`/api/admin/expenses/${selectedExpense.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '却下に失敗しました')
      }

      setSuccess('経費を却下しました')
      setRejectDialogOpen(false)
      setSelectedExpense(null)
      setRejectionReason('')
      await fetchExpenses()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setProcessing(false)
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
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'REVISION': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Edit className="h-4 w-4" />
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'REJECTED': return <XCircle className="h-4 w-4" />
      case 'REVISION': return <Edit className="h-4 w-4" />
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

  const canEdit = (expense: Expense) => {
    return expense.status !== 'APPROVED'
  }

  const handleExportPDF = (expense: Expense) => {
    try {
      const pdf = generateExpensePDF({
        id: expense.id,
        expenseDate: expense.expenseDate,
        amount: expense.amount,
        vendor: expense.vendor,
        purpose: expense.purpose,
        category: expense.category,
        status: expense.status,
        createdAt: expense.createdAt,
      })
      downloadPDF(pdf, `expense-${expense.id}.pdf`)
    } catch (error) {
      console.error('PDF export failed:', error)
      setError('PDFエクスポートに失敗しました')
      setTimeout(() => setError(null), 3000)
    }
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
          <h2 className="text-2xl font-bold text-gray-900">経費一覧</h2>
          <p className="text-gray-600">申請した経費の一覧</p>
        </div>
        <div className="flex space-x-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="DRAFT">下書き</SelectItem>
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
            <span>経費申請履歴</span>
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
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                      </div>

                      <div className="mt-3">
                        <div className="text-sm text-gray-500">目的</div>
                        <div className="text-sm text-gray-900 line-clamp-2">{expense.purpose}</div>
                      </div>

                      {expense.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-red-800">却下理由</div>
                              <div className="text-sm text-red-700 mt-1">{expense.rejectionReason}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {userRole === 'MASTER' && expense.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedExpense(expense)
                              setApproveDialogOpen(true)
                            }}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            承認
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedExpense(expense)
                              setRejectDialogOpen(true)
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            却下
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF(expense)}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      {canEdit(expense) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit && onEdit(expense)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            編集
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedExpense(expense)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>経費の削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              この経費を削除してもよろしいですか？この操作は取り消せません。
            </p>
            {selectedExpense && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="text-sm">
                  <div><strong>支払先:</strong> {selectedExpense.vendor}</div>
                  <div><strong>金額:</strong> {formatCurrency(selectedExpense.amount)}</div>
                  <div><strong>日付:</strong> {formatDate(selectedExpense.expenseDate)}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedExpense(null)
              }}
              disabled={deleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '削除中...' : '削除する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>経費の承認</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              この経費を承認してもよろしいですか？
            </p>
            {selectedExpense && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="text-sm">
                  <div><strong>支払先:</strong> {selectedExpense.vendor}</div>
                  <div><strong>金額:</strong> {formatCurrency(selectedExpense.amount)}</div>
                  <div><strong>日付:</strong> {formatDate(selectedExpense.expenseDate)}</div>
                  <div><strong>目的:</strong> {selectedExpense.purpose}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveDialogOpen(false)
                setSelectedExpense(null)
              }}
              disabled={processing}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? '承認中...' : '承認する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>経費の却下</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedExpense && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm">
                  <div><strong>支払先:</strong> {selectedExpense.vendor}</div>
                  <div><strong>金額:</strong> {formatCurrency(selectedExpense.amount)}</div>
                  <div><strong>日付:</strong> {formatDate(selectedExpense.expenseDate)}</div>
                  <div><strong>目的:</strong> {selectedExpense.purpose}</div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">却下理由 <span className="text-red-500">*</span></Label>
              <Input
                id="rejection-reason"
                placeholder="却下理由を入力してください"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={processing}
              />
              <p className="text-xs text-gray-500">
                申請者に却下理由が通知されます
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setSelectedExpense(null)
                setRejectionReason('')
              }}
              disabled={processing}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? '却下中...' : '却下する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
