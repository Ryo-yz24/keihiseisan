import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 子アカウント一覧を取得
    const childAccounts = await prisma.user.findMany({
      where: {
        masterUserId: session.user.id,
        role: 'CHILD'
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      childAccounts
    })

  } catch (error) {
    console.error('Error fetching child accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
