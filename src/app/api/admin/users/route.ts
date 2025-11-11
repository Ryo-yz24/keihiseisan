import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // MASTERロールのみがユーザー一覧を取得可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    // すべてのユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canViewOthers: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // isActiveフィールドを追加（現在はすべてactive）
    const usersWithStatus = users.map(user => ({
      ...user,
      isActive: true,
      lastLoginAt: user.updatedAt.toISOString()
    }))

    return NextResponse.json({
      users: usersWithStatus
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
