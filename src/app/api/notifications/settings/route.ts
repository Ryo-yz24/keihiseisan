import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 通知設定のデフォルト値
const DEFAULT_SETTINGS = {
  expenseApproval: true,
  expenseRejection: true,
  limitExceeded: true,
  exemptionApproval: true,
  exemptionRejection: true,
  systemAnnouncements: true,
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 現在はデフォルト設定を返す（将来的にはDBから取得）
    return NextResponse.json(DEFAULT_SETTINGS)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // バリデーション
    const validKeys = Object.keys(DEFAULT_SETTINGS)
    const isValid = Object.keys(body).every(key => validKeys.includes(key))

    if (!isValid) {
      return NextResponse.json(
        { error: '無効な設定項目が含まれています' },
        { status: 400 }
      )
    }

    // 現在は設定を受け取るだけ（将来的にはDBに保存）

    return NextResponse.json({
      message: '通知設定を保存しました',
      settings: body
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
