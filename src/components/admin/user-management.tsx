'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  UserCog
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'MASTER' | 'CHILD'
  canViewOthers: boolean
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
}

interface UserManagementProps {
  masterUserId: string
}

export function UserManagement({ masterUserId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [masterUserId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleInviteUser = () => {
    setShowInviteModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('このユーザーを削除しますか？この操作は取り消せません。')) {
      // TODO: ユーザー削除APIを呼び出し
      console.log('ユーザー削除:', userId)
    }
  }

  const handleToggleViewPermission = async (userId: string, currentPermission: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canViewOthers: !currentPermission })
      })

      if (response.ok) {
        // ユーザー一覧を再取得
        await fetchUsers()
      } else {
        alert('権限の変更に失敗しました')
      }
    } catch (error) {
      console.error('Error toggling view permission:', error)
      alert('エラーが発生しました')
    }
  }

  const handleRoleChange = async (userId: string, currentRole: 'MASTER' | 'CHILD') => {
    const newRole = currentRole === 'MASTER' ? 'CHILD' : 'MASTER'
    const roleLabel = newRole === 'MASTER' ? '管理者' : '一般ユーザー'

    if (!confirm(`このユーザーのロールを「${roleLabel}」に変更しますか？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        alert('ロールを変更しました')
        await fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'ロールの変更に失敗しました')
      }
    } catch (error) {
      console.error('Error changing role:', error)
      alert('エラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            子アカウントの管理・招待・権限設定を行います
          </p>
        </div>
        <button
          onClick={handleInviteUser}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          ユーザーを招待
        </button>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ユーザー名またはメールアドレスで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <Filter className="h-4 w-4 mr-2" />
            フィルター
          </button>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              ユーザー一覧 ({filteredUsers.length}名)
            </h3>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ユーザーが見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? '検索条件を変更してお試しください。' : 'ユーザーを招待して開始しましょう。'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          user.isActive ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Shield className={`h-5 w-5 ${
                            user.isActive ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user.role === 'MASTER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role === 'MASTER' ? '管理者' : '一般'}
                          </span>
                          {user.canViewOthers && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <Eye className="h-3 w-3 mr-1" />
                              他ユーザー閲覧可
                            </span>
                          )}
                          {!user.isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              無効
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>作成日: {formatDate(user.createdAt)}</span>
                          {user.lastLoginAt && (
                            <span>最終ログイン: {formatDate(user.lastLoginAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className={`p-2 rounded-md ${
                          user.role === 'MASTER'
                            ? 'text-purple-600 hover:bg-purple-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title={user.role === 'MASTER' ? '一般ユーザーに変更' : '管理者に変更'}
                      >
                        <UserCog className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleToggleViewPermission(user.id, user.canViewOthers)}
                        className={`p-2 rounded-md ${
                          user.canViewOthers
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={user.canViewOthers ? '他ユーザー閲覧権限を無効化' : '他ユーザー閲覧権限を有効化'}
                      >
                        {user.canViewOthers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id)}
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

      {/* 招待モーダル（プレースホルダー） */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInviteModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ユーザーを招待</h3>
                <p className="text-sm text-gray-500 mb-4">
                  招待機能は開発中です。
                </p>
                <button
                  onClick={() => setShowInviteModal(false)}
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



