'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface ExemptionInfo {
  originalLimit: number
  exemptionAmount: number
  finalLimit: number
  usedAmount: number
  availableAmount: number
}

interface ExemptionInfoCardProps {
  userId: string
  year: number
  month: number
  onRequestExemption?: () => void
}

export function ExemptionInfoCard({ 
  userId, 
  year, 
  month, 
  onRequestExemption 
}: ExemptionInfoCardProps) {
  const [exemptionInfo, setExemptionInfo] = useState<ExemptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExemptionInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/exemption/limit?userId=${userId}&year=${year}&month=${month}`)
        
        if (!response.ok) {
          throw new Error('上限解放情報の取得に失敗しました')
        }

        const data = await response.json()
        setExemptionInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchExemptionInfo()
  }, [userId, year, month])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getUsagePercentage = () => {
    if (!exemptionInfo || exemptionInfo.finalLimit === 0) return 0
    return (exemptionInfo.usedAmount / exemptionInfo.finalLimit) * 100
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ]
    return months[month - 1] || `${month}月`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">上限解放情報</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">上限解放情報</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!exemptionInfo) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">上限解放情報</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">上限解放情報がありません</div>
        </CardContent>
      </Card>
    )
  }

  const usagePercentage = getUsagePercentage()
  const hasExemption = exemptionInfo.exemptionAmount > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">上限解放情報</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 利用可能金額 */}
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(exemptionInfo.availableAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              利用可能金額（{year}年{getMonthName(month)}）
            </p>
          </div>

          {/* 使用状況バー */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>使用状況</span>
              <span className={getUsageColor(usagePercentage)}>
                {isNaN(usagePercentage) || !isFinite(usagePercentage)
                  ? '0.0'
                  : usagePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usagePercentage >= 90 ? 'bg-red-500' :
                  usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">基本限度額</div>
              <div className="font-medium">
                {formatCurrency(exemptionInfo.originalLimit)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">使用済み</div>
              <div className="font-medium">
                {formatCurrency(exemptionInfo.usedAmount)}
              </div>
            </div>
            {hasExemption && (
              <>
                <div>
                  <div className="text-muted-foreground">解放金額</div>
                  <div className="font-medium text-green-600">
                    +{formatCurrency(exemptionInfo.exemptionAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">最終限度額</div>
                  <div className="font-medium">
                    {formatCurrency(exemptionInfo.finalLimit)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 上限解放がある場合の表示 */}
          {hasExemption && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <div className="text-sm text-green-800">
                  <div className="font-medium">上限解放が適用されています</div>
                  <div className="text-xs">
                    基本限度額に{formatCurrency(exemptionInfo.exemptionAmount)}が加算されています
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 上限解放申請ボタン */}
          {!hasExemption && onRequestExemption && (
            <div className="pt-2">
              <Button
                onClick={onRequestExemption}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>上限解放を申請</span>
              </Button>
            </div>
          )}

          {/* 注意事項 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <Clock className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-medium">上限解放について</div>
                <div className="text-xs mt-1">
                  上限解放は管理者の承認が必要です。申請後、承認されるまでお待ちください。
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

