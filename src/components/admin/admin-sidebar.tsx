'use client'

import { X, Users, DollarSign, Tag, RefreshCw, Shield, Settings } from 'lucide-react'

type AdminTab = 'users' | 'limits' | 'categories' | 'exemption' | 'audit' | 'settings'

interface AdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ activeTab, onTabChange, isOpen, onClose }: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'users' as const,
      name: 'ユーザー管理',
      icon: Users,
      description: '子アカウントの管理・招待'
    },
    {
      id: 'limits' as const,
      name: '限度額設定',
      icon: DollarSign,
      description: '経費限度額の設定・管理'
    },
    {
      id: 'categories' as const,
      name: 'カテゴリ管理',
      icon: Tag,
      description: '経費カテゴリの設定'
    },
    {
      id: 'exemption' as const,
      name: '上限解放管理',
      icon: RefreshCw,
      description: '上限解放申請の承認・管理'
    },
    {
      id: 'audit' as const,
      name: '監査ログ',
      icon: Shield,
      description: 'システム利用ログの確認'
    },
    {
      id: 'settings' as const,
      name: 'システム設定',
      icon: Settings,
      description: 'システム全体の設定'
    }
  ]

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">管理メニュー</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* メニューアイテム */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id)
                    onClose()
                  }}
                  className={`
                    w-full flex items-start p-3 rounded-lg text-left transition-colors duration-200
                    ${isActive 
                      ? 'bg-red-50 border border-red-200 text-red-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${isActive ? 'text-red-900' : 'text-gray-900'}`}>
                      {item.name}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-red-600' : 'text-gray-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* フッター */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex">
                <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-yellow-800">
                    管理者権限
                  </p>
                  <p className="text-xs text-yellow-700">
                    すべての操作が記録されます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


