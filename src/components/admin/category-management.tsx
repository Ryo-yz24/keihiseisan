'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  GripVertical,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface Category {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  expenseCount?: number
}

interface CategoryManagementProps {
  masterUserId: string
}

export function CategoryManagement({ masterUserId }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [masterUserId])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCreateCategory = () => {
    setNewCategoryName('')
    setShowCreateModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setNewCategoryName(category.name)
    setEditingCategory(category)
  }

  const handleSubmitCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('カテゴリ名を入力してください')
      return
    }

    setSubmitting(true)
    try {
      if (editingCategory) {
        // 更新
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName })
        })

        if (response.ok) {
          await fetchCategories()
          setEditingCategory(null)
          setNewCategoryName('')
        } else {
          const data = await response.json()
          alert(data.error || 'カテゴリの更新に失敗しました')
        }
      } else {
        // 新規作成
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName })
        })

        if (response.ok) {
          await fetchCategories()
          setShowCreateModal(false)
          setNewCategoryName('')
        } else {
          const data = await response.json()
          alert(data.error || 'カテゴリの作成に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error submitting category:', error)
      alert('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('このカテゴリを削除しますか？関連する経費データに影響する可能性があります。')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || 'カテゴリの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('エラーが発生しました')
    }
  }

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        alert('ステータスの変更に失敗しました')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('エラーが発生しました')
    }
  }

  const handleMoveUp = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'up' })
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || '移動に失敗しました')
      }
    } catch (error) {
      console.error('Error moving up:', error)
      alert('エラーが発生しました')
    }
  }

  const handleMoveDown = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: 'down' })
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || '移動に失敗しました')
      }
    } catch (error) {
      console.error('Error moving down:', error)
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">カテゴリ管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            経費カテゴリの設定・管理を行います
          </p>
        </div>
        <button
          onClick={handleCreateCategory}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          カテゴリを追加
        </button>
      </div>

      {/* カテゴリ一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              カテゴリ一覧 ({categories.length}件)
            </h3>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">カテゴリがありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                カテゴリを追加して経費管理を開始しましょう。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* ドラッグハンドル */}
                      <div className="flex-shrink-0">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* 表示順序 */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                          {category.displayOrder}
                        </span>
                      </div>

                      {/* カテゴリ情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {category.name}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            category.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {category.isActive ? '有効' : '無効'}
                          </span>
                          {category.expenseCount && category.expenseCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {category.expenseCount}件の経費
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          作成日: {formatDate(category.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* 移動ボタン */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveUp(category.id)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="上に移動"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveDown(category.id)}
                          disabled={index === categories.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="下に移動"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* アクションボタン */}
                      <button
                        onClick={() => handleToggleActive(category.id, category.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          category.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {category.isActive ? '無効化' : '有効化'}
                      </button>
                      
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
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

      {/* 作成・編集モーダル */}
      {(showCreateModal || editingCategory) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              if (!submitting) {
                setShowCreateModal(false)
                setEditingCategory(null)
                setNewCategoryName('')
              }
            }}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingCategory ? 'カテゴリを編集' : 'カテゴリを追加'}
                </h3>
                <div className="mb-4">
                  <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ名
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="例：交通費、飲食費など"
                    disabled={submitting}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !submitting) {
                        handleSubmitCategory()
                      }
                    }}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (!submitting) {
                        setShowCreateModal(false)
                        setEditingCategory(null)
                        setNewCategoryName('')
                      }
                    }}
                    disabled={submitting}
                    className="flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmitCategory}
                    disabled={submitting || !newCategoryName.trim()}
                    className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '保存中...' : (editingCategory ? '更新' : '作成')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



