import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllExemptionRequests, getUserExemptionRequests } from '@/lib/exemption-utils'
import { ExemptionRequestStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const masterUserId = searchParams.get('masterUserId')
    const statusParam = searchParams.get('status')

    // マスターユーザーの場合は配下ユーザーの申請も含めて取得
    if (session.user.role === 'MASTER') {
      const status = statusParam && statusParam !== 'all' ? (statusParam as ExemptionRequestStatus) : undefined
      const requests = await getAllExemptionRequests(
        session.user.id,
        status
      )
      return NextResponse.json(requests)
    }

    // 一般ユーザーは自分の申請のみ取得
    const requests = await getUserExemptionRequests(session.user.id)
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching exemption requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
