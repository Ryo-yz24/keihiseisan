'use client'

import { useState } from 'react'
import { ExpenseStats } from '@/lib/expense-utils'
import { DashboardHeader } from './dashboard-header'
import { StatsCards } from './stats-cards'
import { ExpenseChart } from './expense-chart'
import { PendingExpenses } from './pending-expenses'
import { LimitUsageCard } from './limit-usage-card'

interface DashboardContentProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: string
    masterUserId?: string | null
    canViewOthers: boolean
  }
  stats: ExpenseStats
}

export function DashboardContent({ user, stats }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'reports'>('overview')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: '概要', icon: '📊' },
                { id: 'expenses', name: '経費一覧', icon: '💰' },
                { id: 'reports', name: 'レポート', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 統計カード */}
              <StatsCards stats={stats} userRole={user.role} />
              
              {/* 限度額使用状況（マスターアカウントのみ） */}
              {user.role === 'MASTER' && stats.limitUsage && (
                <LimitUsageCard limitUsage={stats.limitUsage} />
              )}
              
              {/* グラフエリア */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExpenseChart 
                  data={stats.categoryBreakdown} 
                  title="カテゴリ別内訳（当月）"
                  type="pie"
                />
                <ExpenseChart 
                  data={stats.monthlyTrend} 
                  title="月別推移"
                  type="line"
                />
              </div>
              
              {/* 承認待ち一覧（マスターアカウントのみ） */}
              {user.role === 'MASTER' && (
                <PendingExpenses masterUserId={user.id} />
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  経費一覧
                </h3>
                <p className="text-gray-500">
                  経費一覧機能は開発中です。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  レポート
                </h3>
                <p className="text-gray-500">
                  レポート機能は開発中です。
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

