'use client'

import { UserRole } from '@prisma/client'
import Link from 'next/link'
import {
  Plus,
  List,
  FileText,
  Search,
  Filter,
  Download,
  Upload,
  Home
} from 'lucide-react'

interface ExpenseHeaderProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
    masterUserId?: string | null
    canViewOthers: boolean
  }
  activeTab: 'list' | 'create' | 'edit'
  onTabChange: (tab: 'list' | 'create' | 'edit') => void
  onCreateExpense: () => void
}

export function ExpenseHeader({ user, activeTab, onTabChange, onCreateExpense }: ExpenseHeaderProps) {
  const tabs = [
    { id: 'list' as const, name: '経費一覧', icon: List },
    { id: 'create' as const, name: '新規申請', icon: Plus },
    { id: 'edit' as const, name: '編集', icon: FileText }
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左側: タイトルとタブ */}
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                経費管理
              </h1>
              <p className="text-sm text-gray-500">
                {user.role === 'MASTER' ? '経費申請の管理・承認' : '経費申請の作成・管理'}
              </p>
            </div>
            
            {/* タブナビゲーション */}
            <nav className="hidden md:flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 右側: アクションボタン */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Home className="h-4 w-4 mr-2" />
              ホーム
            </Link>

            {activeTab === 'list' && (
              <>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Search className="h-4 w-4 mr-2" />
                  検索
                </button>

                <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Filter className="h-4 w-4 mr-2" />
                  フィルター
                </button>

                <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Download className="h-4 w-4 mr-2" />
                  エクスポート
                </button>
              </>
            )}

            {activeTab === 'list' && (
              <button
                onClick={onCreateExpense}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                新規申請
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}



