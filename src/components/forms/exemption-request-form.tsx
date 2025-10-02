'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Send } from 'lucide-react'

const exemptionRequestSchema = z.object({
  requestedAmount: z.number()
    .min(1, '申請金額は1円以上である必要があります')
    .max(1000000, '申請金額は1,000,000円以下である必要があります'),
  equivalentMonths: z.number()
    .min(1, '月数は1ヶ月以上である必要があります')
    .max(12, '月数は12ヶ月以下である必要があります'),
  purpose: z.string()
    .min(10, '目的は10文字以上で入力してください')
    .max(500, '目的は500文字以下で入力してください'),
  targetExpenses: z.string()
    .min(10, '計上する経費の内容は10文字以上で入力してください')
    .max(1000, '計上する経費の内容は1000文字以下で入力してください')
})

type ExemptionRequestForm = z.infer<typeof exemptionRequestSchema>

interface ExemptionRequestFormProps {
  userId: string
  year: number
  month: number
  onSuccess?: () => void
}

export function ExemptionRequestForm({ 
  userId, 
  year, 
  month, 
  onSuccess 
}: ExemptionRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ExemptionRequestForm>({
    resolver: zodResolver(exemptionRequestSchema)
  })

  const onSubmit = async (data: ExemptionRequestForm) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/exemption/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          year,
          month,
          ...data
        })
      })

      if (!response.ok) {
        throw new Error('申請の送信に失敗しました')
      }

      setMessage({
        type: 'success',
        text: '上限解放申請を送信しました。管理者の承認をお待ちください。'
      })
      
      reset()
      onSuccess?.()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'エラーが発生しました'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ]
    return months[month - 1] || `${month}月`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>上限解放申請</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          {year}年{getMonthName(month)}の上限解放を申請します
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 申請解放限度額 */}
          <div>
            <label htmlFor="requestedAmount" className="block text-sm font-medium text-gray-700 mb-2">
              申請解放限度額 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register('requestedAmount', { valueAsNumber: true })}
                type="number"
                id="requestedAmount"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="100000"
                min="1"
                max="1000000"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">円</span>
              </div>
            </div>
            {errors.requestedAmount && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.requestedAmount.message}
              </p>
            )}
          </div>

          {/* 何月分相当 */}
          <div>
            <label htmlFor="equivalentMonths" className="block text-sm font-medium text-gray-700 mb-2">
              何月分相当 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register('equivalentMonths', { valueAsNumber: true })}
                type="number"
                id="equivalentMonths"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="2"
                min="1"
                max="12"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">ヶ月</span>
              </div>
            </div>
            {errors.equivalentMonths && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.equivalentMonths.message}
              </p>
            )}
          </div>

          {/* 上限解放の目的・理由 */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              上限解放の目的・理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('purpose')}
              id="purpose"
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="例：プロジェクトの打ち合わせが集中するため、交通費の上限を一時的に引き上げたい"
            />
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.purpose.message}
              </p>
            )}
          </div>

          {/* 計上する経費の内容 */}
          <div>
            <label htmlFor="targetExpenses" className="block text-sm font-medium text-gray-700 mb-2">
              計上する経費の内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('targetExpenses')}
              id="targetExpenses"
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="例：電車代、タクシー代、会議室レンタル代、資料印刷代など"
            />
            {errors.targetExpenses && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.targetExpenses.message}
              </p>
            )}
          </div>

          {/* メッセージ */}
          {message && (
            <div className={`rounded-md p-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <div className="ml-3">
                  <p className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              リセット
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>送信中...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>申請を送信</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
