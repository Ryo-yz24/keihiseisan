'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { AdminHeader } from './admin-header'
import { AdminSidebar } from './admin-sidebar'
import { UserManagement } from './user-management'
import { ExpenseLimits } from './expense-limits'
import { CategoryManagement } from './category-management'
import { AuditLogs } from './audit-logs'
import { SystemSettings } from './system-settings'
import { ExemptionManagement } from './exemption-management'
import { ChildAccountManagement } from './child-account-management'
import { ExpenseApproval } from './expense-approval'
import { AnnualSummaryReport } from './annual-summary-report'

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
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
