'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Download,
  Shield,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  tableName: string
  recordId: string
  oldValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

interface AuditLogsProps {
  masterUserId: string
}

export function AuditLogs({ masterUserId }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterTable, setFilterTable] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    // TODO: APIから監査ログデータを取得
    // 現在はモックデータ
    setTimeout(() => {
      setLogs([
        {
          id: '1',
          userId: 'user1',
          userName: '田中太郎',
          action: 'LOGIN',
          tableName: 'users',
          recordId: 'user1',
          newValue: { email: 'tanaka@example.com', loginAt: '2024-01-15T10:30:00Z' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          userId: 'user1',
          userName: '田中太郎',
          action: 'CREATE',
          tableName: 'expenses',
          recordId: 'expense1',
          newValue: { amount: 15000, vendor: '株式会社サンプル', category: '飲食費（接待）' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: '2024-01-15T10:25:00Z'
        },
        {
          id: '3',
          userId: 'master1',
          userName: '管理者',
          action: 'APPROVE',
          tableName: 'expenses',
          recordId: 'expense1',
          oldValue: { status: 'PENDING' },
          newValue: { status: 'APPROVED', approvedAt: '2024-01-15T11:00:00Z' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          createdAt: '2024-01-15T11:00:00Z'
        },
        {
          id: '4',
          userId: 'master1',
          userName: '管理者',
          action: 'UPDATE',
          tableName: 'users',
          recordId: 'user2',
          oldValue: { canViewOthers: false },
          newValue: { canViewOthers: true },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          createdAt: '2024-01-15T09:30:00Z'
        },
        {
          id: '5',
          userId: 'user2',
          userName: '佐藤花子',
          action: 'DELETE',
          tableName: 'expenses',
          recordId: 'expense2',
          oldValue: { amount: 8500, vendor: '交通費', status: 'DRAFT' },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          createdAt: '2024-01-14T16:45:00Z'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [masterUserId])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'LOGOUT':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'CREATE':
        return <Plus className="h-4 w-4 text-blue-600" />
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-yellow-600" />
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />
      case 'APPROVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECT':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'APPROVE':
        return 'bg-green-100 text-green-800'
      case 'LOGOUT':
      case 'DELETE':
      case 'REJECT':
        return 'bg-red-100 text-red-800'
      case 'CREATE':
        return 'bg-blue-100 text-blue-800'
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.tableName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = !filterAction || log.action === filterAction
    const matchesTable = !filterTable || log.tableName === filterTable
    return matchesSearch && matchesAction && matchesTable
  })

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const handleExport = () => {
    // TODO: CSV/Excelエクスポート機能を実装
    console.log('エクスポート:', filteredLogs)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">監査ログ</h1>
          <p className="mt-1 text-sm text-gray-500">
            システム利用ログの確認・監査を行います
          </p>
        </div>
        <button
          onClick={handleExport}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Download className="h-4 w-4 mr-2" />
          エクスポート
        </button>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              検索
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ユーザー名、アクション、テーブル名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アクション
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="">すべて</option>
              <option value="LOGIN">ログイン</option>
              <option value="LOGOUT">ログアウト</option>
              <option value="CREATE">作成</option>
              <option value="UPDATE">更新</option>
              <option value="DELETE">削除</option>
              <option value="APPROVE">承認</option>
              <option value="REJECT">却下</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              テーブル
            </label>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="">すべて</option>
              <option value="users">ユーザー</option>
              <option value="expenses">経費</option>
              <option value="categories">カテゴリ</option>
              <option value="expense_limits">限度額</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <Filter className="h-4 w-4 mr-2" />
              フィルター適用
            </button>
          </div>
        </div>
      </div>

      {/* ログ一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              監査ログ一覧 ({filteredLogs.length}件)
            </h3>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ログが見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                検索条件を変更してお試しください。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-gray-500">
                          {log.tableName}
                        </span>
                        <span className="text-xs text-gray-400">
                          ID: {log.recordId}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {log.userName}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(log.createdAt)}
                        </div>
                        {log.ipAddress && (
                          <div className="text-xs text-gray-500">
                            IP: {log.ipAddress}
                          </div>
                        )}
                      </div>
                      
                      {(log.oldValue || log.newValue) && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <div className="text-xs text-gray-500 mb-1">変更内容:</div>
                          {log.oldValue && (
                            <div className="text-xs text-red-600 mb-1">
                              <strong>変更前:</strong> {JSON.stringify(log.oldValue, null, 2)}
                            </div>
                          )}
                          {log.newValue && (
                            <div className="text-xs text-green-600">
                              <strong>変更後:</strong> {JSON.stringify(log.newValue, null, 2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} 件を表示
                （全 {filteredLogs.length} 件）
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  前へ
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


