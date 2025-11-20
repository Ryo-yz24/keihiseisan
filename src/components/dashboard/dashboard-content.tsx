'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ExpenseStats } from '@/lib/expense-utils'
import { DashboardHeader } from './dashboard-header'
import { StatsCards } from './stats-cards'
import { ExpenseChart } from './expense-chart'
import { PendingExpenses } from './pending-expenses'
import { LimitUsageCard } from './limit-usage-card'
import { ExemptionInfoCard } from './exemption-info-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// 大きなコンポーネントを動的にインポート
const ExpenseManagement = dynamic(() => import('@/components/expenses/expense-management').then(mod => ({ default: mod.ExpenseManagement })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>,
  ssr: false
})

const AnnualSummaryReport = dynamic(() => import('@/components/admin/annual-summary-report').then(mod => ({ default: mod.AnnualSummaryReport })), {
  loading: () => <div className="text-center py-8 text-gray-500">読み込み中...</div>,
  ssr: false
})

const ExemptionRequestForm = dynamic(() => import('@/components/forms/exemption-request-form').then(mod => ({ default: mod.ExemptionRequestForm })), {
  loading: () => <div className="text-center py-4 text-gray-500">読み込み中...</div>,
  ssr: false
})

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
  const [showExemptionDialog, setShowExemptionDialog] = useState(false)

  // URLハッシュによるスクロール処理
  useEffect(() => {
    const hash = window.location.hash.slice(1) // '#pending-expenses' → 'pending-expenses'
    if (hash) {
      // DOM構築完了後にスクロール
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [])

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
              
              {/* 上限解放情報カード（子アカウントのみ） */}
              {user.role === 'CHILD' && stats.exemptionInfo && (
                <div id="exemption-info" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ExemptionInfoCard
                    exemptionInfo={stats.exemptionInfo}
                    year={new Date().getFullYear()}
                    month={new Date().getMonth() + 1}
                    onRequestExemption={() => setShowExemptionDialog(true)}
                  />
                </div>
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
            <div>
              <ExpenseManagement userId={user.id} userRole={user.role} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              {user.role === 'MASTER' ? (
                <AnnualSummaryReport />
              ) : (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      レポート
                    </h3>
                    <p className="text-gray-500">
                      レポート機能はマスターアカウント専用です。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 上限解放申請ダイアログ */}
      <Dialog open={showExemptionDialog} onOpenChange={setShowExemptionDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>上限解放申請</DialogTitle>
          </DialogHeader>
          <ExemptionRequestForm
            userId={user.id}
            year={new Date().getFullYear()}
            month={new Date().getMonth() + 1}
            onSuccess={() => {
              setShowExemptionDialog(false)
              window.location.reload()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

