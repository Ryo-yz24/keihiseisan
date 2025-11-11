'use client'

import { useState } from 'react'
import { ExpenseForm } from './expense-form'
import { ExpenseList } from './expense-list'

interface ExpenseManagementProps {
  userId: string
  userRole?: string
}

export function ExpenseManagement({ userId, userRole }: ExpenseManagementProps) {
  const [editingExpense, setEditingExpense] = useState<any>(null)

  const handleEdit = (expense: any) => {
    setEditingExpense(expense)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingExpense(null)
  }

  const handleSuccess = () => {
    setEditingExpense(null)
  }

  return (
    <div className="space-y-8">
      <ExpenseForm 
        userId={userId} 
        expense={editingExpense}
        onCancel={handleCancelEdit}
        onSuccess={handleSuccess}
      />
      <ExpenseList
        userId={userId}
        userRole={userRole}
        onEdit={handleEdit}
      />
    </div>
  )
}
