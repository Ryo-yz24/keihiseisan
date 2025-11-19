// 管理画面は認証が必要なため完全に動的
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }
  
  if (session.user.role !== 'MASTER') {
    redirect('/dashboard')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard user={session.user} />
    </div>
  )
}
