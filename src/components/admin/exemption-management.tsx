'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExemptionRequest } from '@/lib/exemption-utils'
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'

interface ExemptionManagementProps {
  masterUserId: string
}

export function ExemptionManagement({ masterUserId }: ExemptionManagementProps) {
  const [requests, setRequests] = useState<ExemptionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    fetchRequests()
  }, [selectedStatus])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const status = selectedStatus === 'all' ? undefined : selectedStatus
      const response = await fetch(`/api/exemption/requests?masterUserId=${masterUserId}&status=${status || ''}`)
      
      if (!response.ok) {
        throw new Error('上限解放申請の取得に失敗しました')
      }

      const data = await response.json()
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch('/api/exemption/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId })
      })

      if (!response.ok) {
        throw new Error('承認に失敗しました')
      }

      setSuccess('上限解放申請を承認しました')
      await fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const handleReject = async (requestId: string, reason: string) => {
    try {
      const response = await fetch('/api/exemption/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, reason })
      })

      if (!response.ok) {
        throw new Error('却下に失敗しました')
      }

      setSuccess('上限解放申請を却下しました')
      await fetchRequests()
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

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ]
    return months[month - 1] || `${month}月`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '承認待ち'
      case 'APPROVED':
        return '承認済み'
      case 'REJECTED':
        return '却下'
      case 'CANCELLED':
        return 'キャンセル'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'APPROVED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">上限解放管理</h1>
          <p className="text-gray-600">上限解放申請の承認・却下管理</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="PENDING">承認待ち</option>
            <option value="APPROVED">承認済み</option>
            <option value="REJECTED">却下</option>
          </select>
          <Button
            onClick={fetchRequests}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>更新</span>
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

      {/* 申請一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>上限解放申請一覧</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              申請がありません
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {request.year}年{getMonthName(request.month)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">申請金額</div>
                          <div className="font-medium">{formatCurrency(request.requestedAmount)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">月数相当</div>
                          <div className="font-medium">{request.equivalentMonths}ヶ月</div>
                        </div>
                        <div>
                          <div className="text-gray-500">申請日</div>
                          <div className="font-medium">
                            {new Date(request.createdAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="text-sm text-gray-500">目的・理由</div>
                          <div className="text-sm text-gray-900">{request.purpose}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">計上する経費</div>
                          <div className="text-sm text-gray-900">{request.targetExpenses}</div>
                        </div>
                      </div>

                      {request.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="text-sm text-red-800">
                            <div className="font-medium">却下理由</div>
                            <div>{request.rejectionReason}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          承認
                        </Button>
                        <Button
                          onClick={() => {
                            const reason = prompt('却下理由を入力してください:')
                            if (reason) handleReject(request.id, reason)
                          }}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          却下
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
