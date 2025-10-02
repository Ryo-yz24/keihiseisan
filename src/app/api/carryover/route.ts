import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCarryoverInfo } from '@/lib/carryover-utils'

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

    const carryoverInfo = await getCarryoverInfo(userId!, year, month)

    if (!carryoverInfo) {
      return NextResponse.json({ error: 'Carryover info not found' }, { status: 404 })
    }

    return NextResponse.json(carryoverInfo)
  } catch (error) {
    console.error('Error fetching carryover info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
