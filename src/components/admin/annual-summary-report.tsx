'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Tag,
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  FileDown
} from 'lucide-react'
import { generateExpenseListPDF, downloadPDF } from '@/lib/pdf'

interface AnnualSummaryData {
  year: number
  summary: {
    totalAmount: number
    totalCount: number
    averageAmount: number
    maxExpense: {
      id: string
      amount: number
      vendor: string
      category: string
      date: string
    } | null
    minExpense: {
      id: string
      amount: number
      vendor: string
      category: string
      date: string
    } | null
  }
  monthlyData: Array<{
    month: number
    monthName: string
    total: number
    count: number
    average: number
  }>
  categoryData: Array<{
    category: string
    total: number
    count: number
    percentage: number
  }>
  userData: Array<{
    userId: string
    name: string
    total: number
    count: number
    average: number
  }>
}

export function AnnualSummaryReport() {
  const [data, setData] = useState<AnnualSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return year.toString()
  })

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/reports/annual-summary?year=${selectedYear}`)

      if (!response.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
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

  const handleExportPDF = async () => {
    if (!data) return

    try {
      // APIから詳細な経費データを取得
      const response = await fetch(`/api/expenses?year=${selectedYear}&status=APPROVED`)
      if (!response.ok) {
        throw new Error('経費データの取得に失敗しました')
      }

      const { expenses } = await response.json()

      // PDFを生成
      const pdf = generateExpenseListPDF(
        expenses,
        `Annual Summary Report - ${selectedYear}`
      )

      // PDFをダウンロード
      downloadPDF(pdf, `annual-summary-${selectedYear}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDFエクスポートに失敗しました')
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">年次サマリーレポート</h2>
          <p className="text-gray-600">年間の経費データを総合的に分析</p>
        </div>
        <div className="flex space-x-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} variant="outline" className="inline-flex items-center">
            <FileDown className="h-4 w-4 mr-2" />
            PDFエクスポート
          </Button>
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">年間合計</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 truncate">
                  {formatCurrency(data.summary.totalAmount)}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">申請件数</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {data.summary.totalCount}件
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">平均金額</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 truncate">
                  {formatCurrency(data.summary.averageAmount)}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600">最高額</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 truncate">
                  {data.summary.maxExpense ? formatCurrency(data.summary.maxExpense.amount) : '-'}
                </p>
              </div>
              <div className="flex-shrink-0 p-3 bg-red-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最高額・最低額の詳細 */}
      {(data.summary.maxExpense || data.summary.minExpense) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.summary.maxExpense && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  <span>最高額の経費</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">金額:</span>
                    <span className="font-semibold">{formatCurrency(data.summary.maxExpense.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">支払先:</span>
                    <span className="font-medium">{data.summary.maxExpense.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">カテゴリ:</span>
                    <span className="font-medium">{data.summary.maxExpense.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">日付:</span>
                    <span className="font-medium">{formatDate(data.summary.maxExpense.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.summary.minExpense && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <span>最低額の経費</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">金額:</span>
                    <span className="font-semibold">{formatCurrency(data.summary.minExpense.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">支払先:</span>
                    <span className="font-medium">{data.summary.minExpense.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">カテゴリ:</span>
                    <span className="font-medium">{data.summary.minExpense.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">日付:</span>
                    <span className="font-medium">{formatDate(data.summary.minExpense.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 月別データ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>月別集計</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.monthlyData.map(month => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-900 w-12">{month.monthName}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((month.total / data.summary.totalAmount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-gray-900 text-right">
                    {formatCurrency(month.total)} / {month.count}件
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別データ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>カテゴリ別集計</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.categoryData.map(category => (
              <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4 flex-1">
                  <span className="font-medium text-gray-900 min-w-32">{category.category}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <span className="text-sm text-gray-600">{category.count}件</span>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {category.percentage.toFixed(1)}%
                  </span>
                  <span className="font-semibold text-gray-900 w-32 text-right">
                    {formatCurrency(category.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ユーザー別データ */}
      {data.userData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>ユーザー別集計</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.userData.map(user => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <span className="font-medium text-gray-900 min-w-48">{user.name}</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min((user.total / data.summary.totalAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className="text-sm text-gray-600">{user.count}件</span>
                    <span className="text-sm text-gray-600 w-32 text-right">
                      平均: {formatCurrency(user.average)}
                    </span>
                    <span className="font-semibold text-gray-900 w-32 text-right">
                      {formatCurrency(user.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
