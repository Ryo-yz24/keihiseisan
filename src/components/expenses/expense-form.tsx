'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, Upload, X, Calendar, DollarSign } from 'lucide-react'

const expenseFormSchema = z.object({
  expenseDate: z.string().min(1, '日付を選択してください'),
  amount: z.string().min(1, '金額を入力してください'),
  taxRate: z.string().min(1, '税率を選択してください'),
  vendor: z.string().min(1, '支払先を入力してください'),
  purpose: z.string().min(1, '目的を入力してください'),
  category: z.string().min(1, 'カテゴリを選択してください'),
})

interface ExpenseFormProps {
  userId: string
  expense?: any
  onCancel?: () => void
  onSuccess?: () => void
}

export function ExpenseForm({ userId, expense, onCancel, onSuccess }: ExpenseFormProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isEditMode = !!expense

  const form = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      expenseDate: expense?.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      amount: expense?.amount?.toString() || '',
      taxRate: expense?.taxRate ? (expense.taxRate * 100).toString() : '10',
      vendor: expense?.vendor || '',
      purpose: expense?.purpose || '',
      category: expense?.category || '',
    },
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (expense) {
      // 編集モードの場合、フォームの値を更新
      form.reset({
        expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
        amount: expense.amount.toString(),
        taxRate: (expense.taxRate * 100).toString(),
        vendor: expense.vendor,
        purpose: expense.purpose,
        category: expense.category,
      })
      setExistingImages(expense.images || [])
    } else {
      // 新規作成モードの場合、フォームをクリア
      form.reset({
        expenseDate: new Date().toISOString().split('T')[0],
        amount: '',
        taxRate: '10',
        vendor: '',
        purpose: '',
        category: '',
      })
      setExistingImages([])
      setImages([])
    }
  }, [expense, form])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('カテゴリの取得に失敗しました')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const calculateTax = (amount: string, taxRate: string) => {
    const amountNum = parseFloat(amount) || 0
    const taxRateNum = parseFloat(taxRate) || 0
    const taxAmount = Math.floor(amountNum * (taxRateNum / 100))
    const amountWithoutTax = amountNum - taxAmount
    return { taxAmount, amountWithoutTax }
  }

  const amount = form.watch('amount')
  const taxRate = form.watch('taxRate')
  const { taxAmount, amountWithoutTax } = calculateTax(amount, taxRate)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId: string) => {
    if (!expense) return

    try {
      const response = await fetch(`/api/expenses/${expense.id}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('画像の削除に失敗しました')
      }

      setExistingImages(existingImages.filter(img => img.id !== imageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const onSubmit = async (data: any, isDraft: boolean) => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('expenseDate', data.expenseDate)
      formData.append('amount', data.amount)
      formData.append('taxRate', data.taxRate)
      formData.append('taxAmount', taxAmount.toString())
      formData.append('amountWithoutTax', amountWithoutTax.toString())
      formData.append('vendor', data.vendor)
      formData.append('purpose', data.purpose)
      formData.append('category', data.category)
      formData.append('status', isDraft ? 'DRAFT' : 'PENDING')

      images.forEach((image) => {
        formData.append('images', image)
      })

      const url = isEditMode ? `/api/expenses/${expense.id}` : '/api/expenses'
      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      if (!response.ok) {
        throw new Error(isEditMode ? '経費の更新に失敗しました' : '経費の申請に失敗しました')
      }

      setSuccess(
        isEditMode 
          ? '経費を更新しました' 
          : isDraft ? '下書きとして保存しました' : '経費を申請しました'
      )
      
      if (!isEditMode) {
        form.reset()
        setImages([])
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6" />
            <span>{isEditMode ? '経費編集' : '経費申請'}</span>
          </CardTitle>
          {isEditMode && (
            <span className="text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              編集モード
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
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

          <div className="space-y-2">
            <Label>日付 <span className="text-red-500">*</span></Label>
            <input
              {...form.register('expenseDate')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.formState.errors.expenseDate && (
              <p className="text-sm text-red-600">{String(form.formState.errors.expenseDate.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>カテゴリ <span className="text-red-500">*</span></Label>
              <span className="text-xs text-gray-500">({categories.length}件)</span>
            </div>
            <Select value={form.watch('category')} onValueChange={(value) => form.setValue('category', value)}>
              <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">{String(form.formState.errors.category.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>支払先 <span className="text-red-500">*</span></Label>
            <input
              {...form.register('vendor')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: Amazon、スターバックス"
            />
            {form.formState.errors.vendor && (
              <p className="text-sm text-red-600">{String(form.formState.errors.vendor.message)}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>金額（税込） <span className="text-red-500">*</span></Label>
              <input
                {...form.register('amount')}
                type="number"
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-600">{String(form.formState.errors.amount.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>税率 <span className="text-red-500">*</span></Label>
              <Select value={form.watch('taxRate')} onValueChange={(value) => form.setValue('taxRate', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="8">8%（軽減税率）</SelectItem>
                  <SelectItem value="0">0%（非課税）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>税額</Label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                ¥{taxAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <div className="flex justify-between">
                <span>税抜金額:</span>
                <span className="font-semibold">¥{amountWithoutTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>税額:</span>
                <span className="font-semibold">¥{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-blue-300">
                <span className="font-bold">合計（税込）:</span>
                <span className="font-bold text-lg">¥{(parseFloat(amount) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>目的・用途 <span className="text-red-500">*</span></Label>
            <textarea
              {...form.register('purpose')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="経費の目的や用途を詳しく記入してください"
            />
            {form.formState.errors.purpose && (
              <p className="text-sm text-red-600">{String(form.formState.errors.purpose.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>領収書画像・PDF</Label>

            {existingImages.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">既存のファイル</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative">
                      {image.fileName?.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-md border">
                          <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                            <p className="text-xs text-gray-600 mt-1">PDF</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={image.filePath}
                          alt={image.fileName}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                <span className="text-sm">ファイルを選択</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">{images.length}件選択中</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 px-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    {image.type === 'application/pdf' ? (
                      <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-md border">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                          <p className="text-xs text-gray-600 mt-1 truncate px-2">{image.name}</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`領収書 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            {isEditMode && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                キャンセル
              </Button>
            )}
            {!isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
                disabled={loading}
              >
                下書き保存
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (isEditMode ? '更新中...' : '申請中...') : (isEditMode ? '更新する' : '申請する')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
