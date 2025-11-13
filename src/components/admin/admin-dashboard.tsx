'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { AdminHeader } from './admin-header'
import { AdminSidebar } from './admin-sidebar'

// 大きなコンポーネントを動的インポート（パフォーマンス最適化）
const UserManagement = dynamic(() => import('./user-management').then(mod => ({ default: mod.UserManagement })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const ExpenseLimits = dynamic(() => import('./expense-limits').then(mod => ({ default: mod.ExpenseLimits })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const CategoryManagement = dynamic(() => import('./category-management').then(mod => ({ default: mod.CategoryManagement })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const AuditLogs = dynamic(() => import('./audit-logs').then(mod => ({ default: mod.AuditLogs })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const SystemSettings = dynamic(() => import('./system-settings').then(mod => ({ default: mod.SystemSettings })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const ExemptionManagement = dynamic(() => import('./exemption-management').then(mod => ({ default: mod.ExemptionManagement })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const ChildAccountManagement = dynamic(() => import('./child-account-management').then(mod => ({ default: mod.ChildAccountManagement })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const ExpenseApproval = dynamic(() => import('./expense-approval').then(mod => ({ default: mod.ExpenseApproval })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

const AnnualSummaryReport = dynamic(() => import('./annual-summary-report').then(mod => ({ default: mod.AnnualSummaryReport })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>
})

interface AdminDashboardProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
    masterUserId?: string | null
    canViewOthers: boolean
  }
}

type AdminTab = 'users' | 'limits' | 'categories' | 'exemption' | 'expense-approval' | 'child-accounts' | 'audit' | 'reports' | 'settings'

export function AdminDashboard({ user }: AdminDashboardProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URLクエリパラメータからタブを取得、なければ'users'をデフォルトに
  const tabFromUrl = searchParams?.get('tab') as AdminTab | null
  const [activeTab, setActiveTab] = useState<AdminTab>(tabFromUrl || 'users')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // URLのクエリパラメータが変更された時にタブを更新
  useEffect(() => {
    const tabParam = searchParams?.get('tab') as AdminTab | null
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement masterUserId={user.id} />
      case 'limits':
        return <ExpenseLimits masterUserId={user.id} />
      case 'categories':
        return <CategoryManagement masterUserId={user.id} />
      case 'exemption':
        return <ExemptionManagement masterUserId={user.id} />
      case 'expense-approval':
        return <ExpenseApproval masterUserId={user.id} />
      case 'child-accounts':
        return <ChildAccountManagement masterUserId={user.id} />
      case 'audit':
        return <AuditLogs masterUserId={user.id} />
      case 'reports':
        return <AnnualSummaryReport />
      case 'settings':
        return <SystemSettings masterUserId={user.id} />
      default:
        return <UserManagement masterUserId={user.id} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        user={user} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex">
        <AdminSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 lg:ml-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
