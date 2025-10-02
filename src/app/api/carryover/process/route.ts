import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processMonthlyCarryover, processAllUsersCarryover } from '@/lib/carryover-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者のみ実行可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, year, month, processAll } = body

    if (processAll) {
      // 全ユーザーの繰越処理
      await processAllUsersCarryover(year, month)
      return NextResponse.json({ 
        message: 'All users carryover processed successfully',
        processed: true 
      })
    } else {
      // 特定ユーザーの繰越処理
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }

      const result = await processMonthlyCarryover(userId, year, month)
      
      if (!result) {
        return NextResponse.json({ error: 'Carryover processing failed' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Carryover processed successfully',
        processed: true 
      })
    }
  } catch (error) {
    console.error('Error processing carryover:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
