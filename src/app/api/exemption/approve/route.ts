import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { approveExemptionRequest } from '@/lib/exemption-utils'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // 申請を取得して権限チェック
    const exemptionRequest = await prisma.limitExemptionRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    })

    if (!exemptionRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // マスターユーザーが自分自身の申請を承認する場合、または配下ユーザーの申請を承認する場合を許可
    const isSelfApproval = exemptionRequest.userId === session.user.id
    const isChildUserRequest = exemptionRequest.user.masterUserId === session.user.id

    if (!isSelfApproval && !isChildUserRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await approveExemptionRequest(requestId, session.user.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 })
    }

    // 監査ログを記録
    await createAuditLog({
      userId: session.user.id,
      action: 'APPROVE',
      tableName: 'limit_exemption_requests',
      recordId: requestId,
      newValue: { status: 'APPROVED', approvedBy: session.user.id },
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving exemption request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
