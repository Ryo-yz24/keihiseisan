'use client'

import { useState, useEffect } from 'react'
import { Plus, User, Mail, Calendar, Trash2, Edit, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChildAccount {
  id: string
  email: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ChildAccountManagementProps {
  masterUserId: string
}

export function ChildAccountManagement({ masterUserId }: ChildAccountManagementProps) {
  const [childAccounts, setChildAccounts] = useState<ChildAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    childId: '',
    childName: '',
    password: ''
  })

  // 子アカウント一覧を取得
  const fetchChildAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/child-accounts')
      const data = await response.json()
      
      if (data.success) {
        setChildAccounts(data.childAccounts)
      } else {
        setError('子アカウントの取得に失敗しました')
      }
    } catch (error) {
      setError('子アカウントの取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 子アカウントを作成
  const createChildAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.childId || !formData.childName || !formData.password) {
      setError('すべての項目を入力してください')
      return
    }

    try {
      const response = await fetch('/api/admin/create-child-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setFormData({ childId: '', childName: '', password: '' })
        setShowCreateForm(false)
        fetchChildAccounts() // 一覧を更新
        setError(null)
      } else {
        setError(data.error || '子アカウントの作成に失敗しました')
      }
    } catch (error) {
      setError('子アカウントの作成中にエラーが発生しました')
    }
  }

  useEffect(() => {
    fetchChildAccounts()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">子アカウント管理</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          新規子アカウント作成
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 作成フォーム */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>新規子アカウント作成</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createChildAccount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="childId">子アカウントID（メールアドレス）</Label>
                  <Input
                    id="childId"
                    type="email"
                    value={formData.childId}
                    onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                    placeholder="child@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="childName">子アカウント名</Label>
                  <Input
                    id="childName"
                    type="text"
                    value={formData.childName}
                    onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                    placeholder="子アカウント名"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">初期パスワード</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="初期パスワード"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">作成</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 子アカウント一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>子アカウント一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {childAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              子アカウントがありません
            </div>
          ) : (
            <div className="space-y-4">
              {childAccounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{account.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {account.email}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          作成日: {formatDate(account.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        account.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {account.isActive ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </div>
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
