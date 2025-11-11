import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createExemptionRequest } from '@/lib/exemption-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, year, month, requestedAmount, equivalentMonths, purpose, targetExpenses } = body

    // 一般ユーザーは自分のみ申請可能
    if (session.user.role !== 'MASTER' && session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!userId || !year || !month || !requestedAmount || !equivalentMonths || !purpose || !targetExpenses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const exemptionRequest = await createExemptionRequest(
      userId,
      year,
      month,
      requestedAmount,
      equivalentMonths,
      purpose,
      targetExpenses
    )

    if (!exemptionRequest) {
      return NextResponse.json({ error: 'Failed to create exemption request' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Exemption request created successfully',
      request: exemptionRequest
    })
  } catch (error) {
    console.error('Error creating exemption request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

