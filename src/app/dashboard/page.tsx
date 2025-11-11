export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getExpenseStats } from '@/lib/expense-utils'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }
  
  // 実際のデータを取得
  const stats = await getExpenseStats(
    session.user.id,
    session.user.role,
    session.user.masterUserId
  )
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent
        user={session.user}
        stats={stats}
      />
    </div>
  )
}
