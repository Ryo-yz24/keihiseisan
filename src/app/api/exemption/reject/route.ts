import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rejectExemptionRequest } from '@/lib/exemption-utils'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, reason } = await request.json()

    if (!requestId || !reason) {
      return NextResponse.json({ error: 'Request ID and reason are required' }, { status: 400 })
    }

    // 申請を取得して権限チェック
    const exemptionRequest = await prisma.limitExemptionRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    })

    if (!exemptionRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // マスターユーザーが自分自身の申請を却下する場合、または配下ユーザーの申請を却下する場合を許可
    const isSelfRejection = exemptionRequest.userId === session.user.id
    const isChildUserRequest = exemptionRequest.user.masterUserId === session.user.id

    if (!isSelfRejection && !isChildUserRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await rejectExemptionRequest(requestId, reason)

    if (!success) {
      return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
    }

    // 監査ログを記録
    await createAuditLog({
      userId: session.user.id,
      action: 'REJECT',
      tableName: 'limit_exemption_requests',
      recordId: requestId,
      newValue: { status: 'REJECTED', rejectionReason: reason },
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error rejecting exemption request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
