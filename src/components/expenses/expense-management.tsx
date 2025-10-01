'use client'

import { useState } from 'react'
import { ExpenseHeader } from './expense-header'
import { ExpenseList } from './expense-list'
import { ExpenseForm } from './expense-form'
import { ExpenseFilters } from './expense-filters'

interface Expense {
  id: string
  expenseDate: Date
  amount: number
  taxRate: number
  taxAmount: number
  amountWithoutTax: number
  vendor: string
  purpose: string
  category: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
  approvedAt?: Date | null
  approvedBy?: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
  approver?: {
    id: string
    name: string | null
  } | null
}

interface Category {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
}

interface ExpenseManagementProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: 'MASTER' | 'CHILD'
    masterUserId?: string | null
    canViewOthers: boolean
  }
  initialExpenses: Expense[]
  categories: Category[]
}

type ExpenseTab = 'list' | 'create' | 'edit'

export function ExpenseManagement({ user, initialExpenses = [], categories = [] }: ExpenseManagementProps) {
  const [activeTab, setActiveTab] = useState<ExpenseTab>('list')
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    search: ''
  })

  const handleCreateExpense = () => {
    setActiveTab('create')
    setEditingExpense(null)
  }

  const handleEditExpense = (expenseId: string) => {
    setActiveTab('edit')
    setEditingExpense(expenseId)
  }

  const handleBackToList = () => {
    setActiveTab('list')
    setEditingExpense(null)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('この経費を削除しますか？この操作は取り消せません。')) {
      // TODO: 削除APIを呼び出し
      console.log('削除:', expenseId)
    }
  }

  const handleViewExpense = (expenseId: string) => {
    // TODO: 詳細表示モーダルを開く
    console.log('詳細表示:', expenseId)
  }

  const handleApproveExpense = async (expenseId: string) => {
    if (confirm('この経費を承認しますか？')) {
      // TODO: 承認APIを呼び出し
      console.log('承認:', expenseId)
    }
  }

  const handleRejectExpense = async (expenseId: string) => {
    const reason = prompt('却下理由を入力してください:')
    if (reason) {
      // TODO: 却下APIを呼び出し
      console.log('却下:', expenseId, reason)
    }
  }

  const handleSaveExpense = async (data: any) => {
    try {
      // TODO: 保存APIを呼び出し
      console.log('保存:', data)
      handleBackToList()
    } catch (error) {
      console.error('保存エラー:', error)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <div className="space-y-6">
            <ExpenseFilters 
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
            />
            <ExpenseList 
              expenses={initialExpenses}
              user={user}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              onView={handleViewExpense}
              onApprove={user.role === 'MASTER' ? handleApproveExpense : undefined}
              onReject={user.role === 'MASTER' ? handleRejectExpense : undefined}
            />
          </div>
        )
      case 'create':
        return (
          <ExpenseForm
            user={user}
            categories={categories}
            onSave={handleSaveExpense}
            onCancel={handleBackToList}
          />
        )
      case 'edit':
        const editingExpenseData = initialExpenses.find(exp => exp.id === editingExpense)
        return (
          <ExpenseForm
            user={user}
            categories={categories}
            editingExpense={editingExpenseData || null}
            onSave={handleSaveExpense}
            onCancel={handleBackToList}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExpenseHeader 
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateExpense={handleCreateExpense}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  )
}