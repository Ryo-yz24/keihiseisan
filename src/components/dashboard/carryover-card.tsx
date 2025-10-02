'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CarryoverInfo } from '@/lib/carryover-utils'
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react'

interface CarryoverCardProps {
  userId: string
  year: number
  month: number
}

export function CarryoverCard({ userId, year, month }: CarryoverCardProps) {
  const [carryoverInfo, setCarryoverInfo] = useState<CarryoverInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCarryoverInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/carryover?userId=${userId}&year=${year}&month=${month}`)
        
        if (!response.ok) {
          throw new Error('繰越情報の取得に失敗しました')
        }

        const data = await response.json()
        setCarryoverInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchCarryoverInfo()
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
    if (!carryoverInfo) return 0
    return (carryoverInfo.usedAmount / carryoverInfo.availableAmount) * 100
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">繰越情報</CardTitle>
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
          <CardTitle className="text-sm font-medium">繰越情報</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!carryoverInfo) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">繰越情報</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">繰越情報がありません</div>
        </CardContent>
      </Card>
    )
  }

  const usagePercentage = getUsagePercentage()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">繰越情報</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 利用可能金額 */}
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(carryoverInfo.availableAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              利用可能金額（繰越 + 当月限度額）
            </p>
          </div>

          {/* 使用状況バー */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>使用状況</span>
              <span className={getUsageColor(usagePercentage)}>
                {usagePercentage.toFixed(1)}%
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
              <div className="text-muted-foreground">当月限度額</div>
              <div className="font-medium">
                {formatCurrency(carryoverInfo.originalLimit)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">繰越金額</div>
              <div className="font-medium">
                {formatCurrency(carryoverInfo.carryoverAmount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">使用済み</div>
              <div className="font-medium">
                {formatCurrency(carryoverInfo.usedAmount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">残り</div>
              <div className="font-medium">
                {formatCurrency(carryoverInfo.availableAmount - carryoverInfo.usedAmount)}
              </div>
            </div>
          </div>

          {/* 繰越がある場合の注意事項 */}
          {carryoverInfo.carryoverAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                <div className="text-sm text-blue-800">
                  <div className="font-medium">繰越金額があります</div>
                  <div className="text-xs">
                    前月の未使用分が繰越されています（1ヶ月のみ有効）
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
