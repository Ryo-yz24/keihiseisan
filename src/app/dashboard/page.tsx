import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getExpenseStats } from '@/lib/expense-utils'
import { PasswordGuard } from '@/components/password-guard'

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
    <PasswordGuard>
      <div className="min-h-screen bg-gray-50">
        <DashboardContent
          user={session.user}
          stats={stats}
        />
      </div>
    </PasswordGuard>
  )
}
