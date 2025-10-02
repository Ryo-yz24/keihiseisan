import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { PasswordGuard } from '@/components/password-guard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'MASTER') {
    redirect('/dashboard')
  }

  return (
    <PasswordGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminDashboard user={session.user} />
      </div>
    </PasswordGuard>
  )
}
