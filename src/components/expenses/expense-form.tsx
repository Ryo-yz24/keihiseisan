'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, DollarSign, Building2, FileText, Tag, Upload, X, Save, ArrowLeft } from 'lucide-react'

const expenseSchema = z.object({
  expenseDate: z.string().min(1, '日付を選択してください'),
  amount: z.string().min(1, '金額を入力してください').refine((val) => !isNaN(Number(val)) && Number(val) > 0, '有効な金額を入力してください'),
  taxRate: z.string().min(1, '税率を選択してください'),
  vendor: z.string().min(1, '取引先を入力してください'),
  purpose: z.string().min(1, '目的を入力してください'),
  category: z.string().min(1, 'カテゴリを選択してください'),
  images: z.array(z.instanceof(File)).optional()
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: 'MASTER' | 'CHILD'
    masterUserId?: string | null
    canViewOthers: boolean
  }
  categories: Array<{
    id: string
    name: string
    displayOrder: number
    isActive: boolean
  }>
  editingExpense?: {
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
  } | null
  onSave: (data: ExpenseFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ExpenseForm({ user, categories, editingExpense, onSave, onCancel, isLoading = false }: ExpenseFormProps) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: editingExpense ? {
      expenseDate: editingExpense.expenseDate.toISOString().split('T')[0],
      amount: editingExpense.amount.toString(),
      taxRate: editingExpense.taxRate.toString(),
      vendor: editingExpense.vendor,
      purpose: editingExpense.purpose,
      category: editingExpense.category
    } : {
      expenseDate: new Date().toISOString().split('T')[0],
      taxRate: '0.10'
    }
  })

  const watchedAmount = watch('amount')
  const watchedTaxRate = watch('taxRate')

  const calculateTax = () => {
    const amount = parseFloat(watchedAmount || '0')
    const taxRate = parseFloat(watchedTaxRate || '0')
    const taxAmount = amount * taxRate
    const amountWithoutTax = amount - taxAmount
    return { taxAmount, amountWithoutTax }
  }

  const { taxAmount, amountWithoutTax } = calculateTax()

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return

    const newImages = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB制限
    )

    setUploadedImages(prev => [...prev, ...newImages])
    setValue('images', [...uploadedImages, ...newImages])
  }

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
    setValue('images', newImages)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files)
    }
  }

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await onSave(data)
    } catch (error) {
      console.error('保存エラー:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {editingExpense ? '経費を編集' : '新しい経費を申請'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {editingExpense ? '経費の詳細を編集してください' : '経費の詳細を入力してください'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 日付 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('expenseDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.expenseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expenseDate.message}</p>
              )}
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                金額（税込） <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  {...register('amount')}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">¥</span>
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* 税率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                税率 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('taxRate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="0.00">0%</option>
                <option value="0.08">8%</option>
                <option value="0.10">10%</option>
              </select>
              {errors.taxRate && (
                <p className="mt-1 text-sm text-red-600">{errors.taxRate.message}</p>
              )}
            </div>

            {/* 税額計算結果 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">税額計算</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>税込金額:</span>
                  <span className="font-medium">¥{watchedAmount || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>税額:</span>
                  <span className="font-medium">¥{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>税抜金額:</span>
                  <span className="font-medium">¥{amountWithoutTax.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 取引先 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                取引先 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('vendor')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="株式会社サンプル"
              />
              {errors.vendor && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor.message}</p>
              )}
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">カテゴリを選択してください</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* 目的 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              目的・詳細 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('purpose')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="経費の目的や詳細を入力してください"
            />
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
            )}
          </div>

          {/* 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-2" />
              領収書・画像（任意）
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">
                    クリックして画像を選択
                  </span>
                  <span className="text-sm text-gray-500">またはドラッグ&ドロップ</span>
                </div>
                <p className="text-xs text-gray-500">
                  最大5MB、JPG/PNG/PDF形式
                </p>
              </label>
            </div>

            {/* アップロード済み画像 */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">アップロード済み画像</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 truncate px-2">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting || isLoading ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}