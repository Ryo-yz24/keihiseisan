export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/common/page-header'
import { ExpenseManagement } from '@/components/expenses/expense-management'

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="経費管理" subtitle="経費申請の作成・管理" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpenseManagement userId={session.user.id} userRole={session.user.role} />
      </div>
    </div>
  )
}
