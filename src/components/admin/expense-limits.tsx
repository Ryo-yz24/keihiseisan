'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ExpenseLimit {
  id: string
  targetUserId?: string
  targetUserName?: string
  limitType: 'MONTHLY' | 'YEARLY'
  limitAmount: number
  year: number
  month?: number
  createdAt: string
  isActive: boolean
}

interface ExpenseLimitsProps {
  masterUserId: string
}

export function ExpenseLimits({ masterUserId }: ExpenseLimitsProps) {
  const [limits, setLimits] = useState<ExpenseLimit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLimit, setEditingLimit] = useState<ExpenseLimit | null>(null)

  useEffect(() => {
    // TODO: APIから限度額データを取得
    // 現在はモックデータ
    setTimeout(() => {
      setLimits([
        {
          id: '1',
          limitType: 'MONTHLY',
          limitAmount: 100000,
          year: 2024,
          month: 1,
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true
        },
        {
          id: '2',
          targetUserId: 'user1',
          targetUserName: '田中太郎',
          limitType: 'MONTHLY',
          limitAmount: 50000,
          year: 2024,
          month: 1,
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true
        },
        {
          id: '3',
          limitType: 'YEARLY',
          limitAmount: 1200000,
          year: 2024,
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true
        }
      ])
      setLoading(false)
    }, 1000)
  }, [masterUserId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLimitTypeText = (type: string, month?: number) => {
    if (type === 'MONTHLY') {
      return `月次 (${month}月)`
    }
    return '年次'
  }

  const handleCreateLimit = () => {
    setShowCreateModal(true)
  }

  const handleEditLimit = (limit: ExpenseLimit) => {
    setEditingLimit(limit)
  }

  const handleDeleteLimit = (limitId: string) => {
    if (confirm('この限度額設定を削除しますか？')) {
      // TODO: 限度額削除APIを呼び出し
      console.log('限度額削除:', limitId)
    }
  }

  const handleToggleActive = (limitId: string, currentStatus: boolean) => {
    // TODO: ステータス変更APIを呼び出し
    console.log('ステータス変更:', limitId, !currentStatus)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">限度額設定</h1>
          <p className="mt-1 text-sm text-gray-500">
            経費限度額の設定・管理を行います
          </p>
        </div>
        <button
          onClick={handleCreateLimit}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          限度額を設定
        </button>
      </div>

      {/* 限度額一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              限度額設定一覧 ({limits.length}件)
            </h3>
          </div>

          {limits.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">限度額設定がありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                限度額を設定して経費管理を開始しましょう。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {limits.map((limit) => (
                <div key={limit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          limit.isActive ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {limit.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(limit.limitAmount)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            limit.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {limit.isActive ? '有効' : '無効'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {getLimitTypeText(limit.limitType, limit.month)}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">{limit.year}年</span>
                          </div>
                          {limit.targetUserName && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {limit.targetUserName}
                            </div>
                          )}
                          {!limit.targetUserName && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              全体
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          設定日: {formatDate(limit.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(limit.id, limit.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          limit.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {limit.isActive ? '無効化' : '有効化'}
                      </button>
                      
                      <button
                        onClick={() => handleEditLimit(limit)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLimit(limit.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 作成・編集モーダル（プレースホルダー） */}
      {(showCreateModal || editingLimit) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowCreateModal(false)
              setEditingLimit(null)
            }}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingLimit ? '限度額を編集' : '限度額を設定'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  限度額設定機能は開発中です。
                </p>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingLimit(null)
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


