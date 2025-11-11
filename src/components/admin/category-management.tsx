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

  useEffect(() => {
    // TODO: APIからカテゴリデータを取得
    // 現在はモックデータ
    setTimeout(() => {
      setCategories([
        {
          id: '1',
          name: '交通費',
          displayOrder: 1,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          expenseCount: 15
        },
        {
          id: '2',
          name: '飲食費（接待）',
          displayOrder: 2,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          expenseCount: 8
        },
        {
          id: '3',
          name: '消耗品費',
          displayOrder: 3,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          expenseCount: 12
        },
        {
          id: '4',
          name: '通信費',
          displayOrder: 4,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          expenseCount: 5
        },
        {
          id: '5',
          name: '水道光熱費',
          displayOrder: 5,
          isActive: false,
          createdAt: '2024-01-01T00:00:00Z',
          expenseCount: 0
        },
        {
          id: '6',
          name: '広告宣伝費',
          displayOrder: 6,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          expenseCount: 3
        },
        {
          id: '7',
          name: 'その他（未分類）',
          displayOrder: 7,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          expenseCount: 2
        }
      ])
      setLoading(false)
    }, 1000)
  }, [masterUserId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCreateCategory = () => {
    setShowCreateModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('このカテゴリを削除しますか？関連する経費データに影響する可能性があります。')) {
      // TODO: カテゴリ削除APIを呼び出し
      console.log('カテゴリ削除:', categoryId)
    }
  }

  const handleToggleActive = (categoryId: string, currentStatus: boolean) => {
    // TODO: ステータス変更APIを呼び出し
    console.log('ステータス変更:', categoryId, !currentStatus)
  }

  const handleMoveUp = (categoryId: string) => {
    // TODO: 表示順序変更APIを呼び出し
    console.log('上に移動:', categoryId)
  }

  const handleMoveDown = (categoryId: string) => {
    // TODO: 表示順序変更APIを呼び出し
    console.log('下に移動:', categoryId)
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
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

      {/* 作成・編集モーダル（プレースホルダー） */}
      {(showCreateModal || editingCategory) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowCreateModal(false)
              setEditingCategory(null)
            }}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingCategory ? 'カテゴリを編集' : 'カテゴリを追加'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  カテゴリ管理機能は開発中です。
                </p>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCategory(null)
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



