import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentAvailableLimit } from '@/lib/exemption-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // 管理者は全ユーザー、一般ユーザーは自分のみ
    if (session.user.role !== 'MASTER' && session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const limitInfo = await getCurrentAvailableLimit(userId, year, month)

    // デバッグ用ログ

    // レスポンスをサニタイズ（負の値やNaNを防ぐ）
    const sanitizedInfo = {
      originalLimit: Math.max(0, Number(limitInfo.originalLimit) || 0),
      exemptionAmount: Math.max(0, Number(limitInfo.exemptionAmount) || 0),
      finalLimit: Math.max(0, Number(limitInfo.finalLimit) || 0),
      usedAmount: Math.max(0, Number(limitInfo.usedAmount) || 0),
      availableAmount: Math.max(0, Number(limitInfo.availableAmount) || 0)
    }

    return NextResponse.json(sanitizedInfo)
  } catch (error) {
    console.error('Error fetching exemption limit info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

