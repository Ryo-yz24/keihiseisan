import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {
      user: {
        masterUserId: session.user.id,
      },
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: true,
      },
    })

    return NextResponse.json({ success: true, expenses })
  } catch (error) {
    console.error('Error fetching expenses for admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
