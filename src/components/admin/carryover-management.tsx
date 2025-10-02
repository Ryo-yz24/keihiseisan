'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CarryoverInfo } from '@/lib/carryover-utils'
import { Calendar, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface CarryoverManagementProps {
  masterUserId: string
}

export function CarryoverManagement({ masterUserId }: CarryoverManagementProps) {
  const [carryoverHistory, setCarryoverHistory] = useState<CarryoverInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  useEffect(() => {
    fetchCarryoverHistory()
  }, [])

  const fetchCarryoverHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/carryover/history?masterUserId=${masterUserId}&year=${currentYear}`)
      
      if (!response.ok) {
        throw new Error('繰越履歴の取得に失敗しました')
      }

      const data = await response.json()
      setCarryoverHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const processCarryover = async (processAll: boolean = true) => {
    try {
      setProcessing(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/carryover/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processAll,
          year: currentYear,
          month: currentMonth
        })
      })

      if (!response.ok) {
        throw new Error('繰越処理に失敗しました')
      }

      setSuccess(processAll ? '全ユーザーの繰越処理が完了しました' : '繰越処理が完了しました')
      await fetchCarryoverHistory() // 履歴を更新
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setProcessing(false)
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

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ]
    return months[month - 1] || `${month}月`
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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">繰越管理</h1>
          <p className="text-gray-600">経費の月次繰越処理と履歴管理</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => processCarryover(true)}
            disabled={processing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
            <span>全ユーザー繰越処理</span>
          </Button>
          <Button
            onClick={fetchCarryoverHistory}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>履歴更新</span>
          </Button>
        </div>
      </div>

      {/* メッセージ */}
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

      {/* 繰越履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>繰越履歴 ({currentYear}年)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carryoverHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              繰越履歴がありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      月
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      当月限度額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用済み
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      繰越金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利用可能金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {carryoverHistory.map((item) => {
                    const usageRate = (item.usedAmount / item.availableAmount) * 100
                    return (
                      <tr key={`${item.year}-${item.month}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getMonthName(item.month)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.originalLimit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.usedAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.carryoverAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.availableAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  usageRate >= 90 ? 'bg-red-500' :
                                  usageRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usageRate, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm ${
                              usageRate >= 90 ? 'text-red-600' :
                              usageRate >= 70 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {usageRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">繰越ルール</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 繰越は1ヶ月のみ有効です（例：9月の余剰分は10月まで）</p>
            <p>• 繰越金額は翌月の利用可能金額に加算されます</p>
            <p>• 月次繰越処理は月初に実行することを推奨します</p>
            <p>• 繰越処理は管理者のみ実行可能です</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
