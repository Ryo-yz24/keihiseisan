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
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [masterUserId, searchTerm, filterAction, filterTable, currentPage])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (filterAction) params.append('action', filterAction)
      if (filterTable) params.append('table', filterTable)

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
      } else {
        console.error('Failed to fetch logs:', data.error)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

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
    // CSVエクスポート機能
    const csvHeaders = ['日時', 'ユーザー', 'アクション', 'テーブル', 'レコードID', 'IPアドレス', '変更前', '変更後']
    const csvRows = logs.map(log => [
      formatDate(log.createdAt),
      log.userName,
      log.action,
      log.tableName,
      log.recordId,
      log.ipAddress || '-',
      log.oldValue ? JSON.stringify(log.oldValue) : '-',
      log.newValue ? JSON.stringify(log.newValue) : '-'
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                <div key={log.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
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

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                      </div>

                      <div className="flex-shrink-0">
                        {expandedLogId === log.id ? (
                          <span className="text-xs text-gray-500">▼ 閉じる</span>
                        ) : (
                          <span className="text-xs text-gray-500">▶ 詳細</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedLogId === log.id && (log.oldValue || log.newValue) && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">変更内容:</div>
                        {log.oldValue && (
                          <div className="mb-2 p-2 bg-red-50 rounded border border-red-200">
                            <div className="text-xs font-medium text-red-700 mb-1">変更前:</div>
                            <pre className="text-xs text-red-600 whitespace-pre-wrap">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <div className="text-xs font-medium text-green-700 mb-1">変更後:</div>
                            <pre className="text-xs text-green-600 whitespace-pre-wrap">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.userAgent && (
                          <div className="mt-2 text-xs text-gray-500">
                            <strong>User-Agent:</strong> {log.userAgent}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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


