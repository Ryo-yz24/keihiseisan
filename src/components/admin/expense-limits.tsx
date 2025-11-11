'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle, DollarSign, Users } from 'lucide-react'

const limitFormSchema = z.object({
  targetUserId: z.string().optional(),
  limitType: z.enum(['MONTHLY', 'YEARLY']),
  limitAmount: z.string().min(1, '金額を入力してください'),
  year: z.string().min(1, '年を選択してください'),
  month: z.string().optional(),
}).refine((data) => {
  if (data.limitType === 'MONTHLY' && !data.month) {
    return false
  }
  return true
}, {
  message: '月次限度額の場合、月を選択してください',
  path: ['month'],
})

type LimitFormData = z.infer<typeof limitFormSchema>

interface ExpenseLimit {
  id: string
  masterUserId: string
  targetUserId: string | null
  limitType: 'MONTHLY' | 'YEARLY'
  limitAmount: number
  year: number
  month: number | null
  createdAt: string
  updatedAt: string
  targetUser?: {
    id: string
    name: string
    email: string
  }
}

interface ChildUser {
  id: string
  name: string
  email: string
}

interface ExpenseLimitsProps {
  masterUserId: string
}

export function ExpenseLimits({ masterUserId }: ExpenseLimitsProps) {
  const [limits, setLimits] = useState<ExpenseLimit[]>([])
  const [childUsers, setChildUsers] = useState<ChildUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLimit, setEditingLimit] = useState<ExpenseLimit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExpenseLimit | null>(null)

  const form = useForm<LimitFormData>({
    resolver: zodResolver(limitFormSchema),
    defaultValues: {
      targetUserId: undefined,
      limitType: 'MONTHLY',
      limitAmount: '',
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
    },
  })

  useEffect(() => {
    fetchLimits()
    fetchChildUsers()
  }, [])

  useEffect(() => {
    if (editingLimit) {
      form.reset({
        targetUserId: editingLimit.targetUserId || undefined,
        limitType: editingLimit.limitType,
        limitAmount: editingLimit.limitAmount.toString(),
        year: editingLimit.year.toString(),
        month: editingLimit.month?.toString() || '',
      })
    } else {
      form.reset({
        targetUserId: undefined,
        limitType: 'MONTHLY',
        limitAmount: '',
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString(),
      })
    }
  }, [editingLimit, form])

  const fetchLimits = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/limits`)
      
      if (!response.ok) {
        throw new Error('限度額の取得に失敗しました')
      }

      const data = await response.json()
      setLimits(data.limits || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchChildUsers = async () => {
    try {
      const response = await fetch(`/api/admin/child-accounts`)
      
      if (!response.ok) {
        throw new Error('子アカウントの取得に失敗しました')
      }

      const data = await response.json()
      setChildUsers(data.childAccounts || [])
    } catch (err) {
      console.error('Error fetching child users:', err)
    }
  }

  const onSubmit = async (data: LimitFormData) => {
    try {
      setError(null)
      
      const payload = {
        targetUserId: data.targetUserId === '__all__' ? null : (data.targetUserId || null),
        limitType: data.limitType,
        limitAmount: parseFloat(data.limitAmount),
        year: parseInt(data.year),
        month: data.month ? parseInt(data.month) : null,
      }

      let response
      if (editingLimit) {
        response = await fetch(`/api/admin/limits/${editingLimit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/admin/limits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '限度額の保存に失敗しました')
      }

      setSuccess(editingLimit ? '限度額を更新しました' : '限度額を作成しました')
      setIsDialogOpen(false)
      setEditingLimit(null)
      form.reset()
      await fetchLimits()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setError(null)
      const response = await fetch(`/api/admin/limits/${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('限度額の削除に失敗しました')
      setSuccess('限度額を削除しました')
      setDeleteTarget(null)
      await fetchLimits()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">読み込み中...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">限度額管理</h1>
          <p className="text-gray-600">経費の月次・年次限度額の設定</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLimit(null); form.reset() }} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>限度額を設定</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLimit ? '限度額を編集' : '限度額を設定'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>対象ユーザー</Label>
                <Select value={form.watch('targetUserId') || undefined} onValueChange={(value) => form.setValue('targetUserId', value)}>
                  <SelectTrigger><SelectValue placeholder="全体（デフォルト）" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全体（デフォルト）</SelectItem>
                    
                    {childUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>限度額タイプ</Label>
                <Select value={form.watch('limitType')} onValueChange={(value) => form.setValue('limitType', value as 'MONTHLY' | 'YEARLY')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">月次</SelectItem>
                    <SelectItem value="YEARLY">年次</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>限度額（円）</Label>
                <input {...form.register('limitAmount')} type="number" min="0" className="w-full px-3 py-2 border rounded-md" placeholder="100000" />
                {form.formState.errors.limitAmount && <p className="text-sm text-red-600">{form.formState.errors.limitAmount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>年</Label>
                <Select value={form.watch('year')} onValueChange={(value) => form.setValue('year', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map((year) => <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.watch('limitType') === 'MONTHLY' && (
                <div className="space-y-2">
                  <Label>月</Label>
                  <Select value={form.watch('month') || undefined} onValueChange={(value) => form.setValue('month', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map((month) => <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingLimit(null) }}>キャンセル</Button>
                <Button type="submit">{editingLimit ? '更新' : '作成'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex"><AlertCircle className="h-5 w-5 text-red-400" /><div className="ml-3"><p className="text-sm text-red-800">{error}</p></div></div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex"><CheckCircle className="h-5 w-5 text-green-400" /><div className="ml-3"><p className="text-sm text-green-800">{success}</p></div></div>
        </div>
      )}
      <Card>
        <CardHeader><CardTitle className="flex items-center space-x-2"><DollarSign className="h-5 w-5" /><span>設定済み限度額</span></CardTitle></CardHeader>
        <CardContent>
          {limits.length === 0 ? (
            <div className="text-center text-gray-500 py-8">限度額が設定されていません</div>
          ) : (
            <div className="space-y-4">
              {limits.map((limit) => (
                <div key={limit.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{limit.limitType === 'MONTHLY' ? '月次' : '年次'}</span>
                        <span className="flex items-center text-sm text-gray-600"><Users className="h-4 w-4 mr-1" />{limit.targetUserId ? (limit.targetUser?.name || '特定ユーザー') : '全体'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div><div className="text-gray-500">限度額</div><div className="text-lg font-semibold text-gray-900">{formatCurrency(limit.limitAmount)}</div></div>
                        <div><div className="text-gray-500">対象期間</div><div className="font-medium text-gray-900">{limit.year}年{limit.month && ` ${limit.month}月`}</div></div>
                        <div><div className="text-gray-500">作成日</div><div className="font-medium text-gray-900">{new Date(limit.createdAt).toLocaleDateString('ja-JP')}</div></div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button onClick={() => { setEditingLimit(limit); setIsDialogOpen(true) }} size="sm" variant="outline"><Pencil className="h-4 w-4" /><span>編集</span></Button>
                      <Button onClick={() => setDeleteTarget(limit)} size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>限度額を削除しますか？</AlertDialogTitle><AlertDialogDescription>この操作は取り消せません。本当に削除してもよろしいですか？</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteTarget(null)}>キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">削除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


