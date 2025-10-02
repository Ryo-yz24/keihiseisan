import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCarryoverHistory } from '@/lib/carryover-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const masterUserId = searchParams.get('masterUserId')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const limit = parseInt(searchParams.get('limit') || '12')

    // 管理者のみ実行可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!masterUserId) {
      return NextResponse.json({ error: 'Master user ID is required' }, { status: 400 })
    }

    const carryoverHistory = await getCarryoverHistory(masterUserId, year, limit)

    return NextResponse.json(carryoverHistory)
  } catch (error) {
    console.error('Error fetching carryover history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
