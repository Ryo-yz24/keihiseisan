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

    let masterUserId = session.user.id

    // 子アカウントの場合、マスターユーザーIDを取得
    if (session.user.role === 'CHILD') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { masterUserId: true },
      })
      
      if (user && user.masterUserId) {
        masterUserId = user.masterUserId
      }
    }

    const categories = await prisma.category.findMany({
      where: {
        masterUserId,
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json({ success: true, categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
