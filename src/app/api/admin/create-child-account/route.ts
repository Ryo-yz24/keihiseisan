import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { childId, childName, password } = await request.json()

    if (!childId || !childName || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 子アカウントIDの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: childId }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Child account ID already exists' }, { status: 400 })
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12)

    // 子アカウントを作成
    const childUser = await prisma.user.create({
      data: {
        email: childId,
        name: childName,
        password: hashedPassword,
        role: 'CHILD',
        masterUserId: session.user.id,
        canViewOthers: false
      }
    })

    return NextResponse.json({
      success: true,
      childAccount: {
        id: childUser.id,
        email: childUser.email,
        name: childUser.name,
        createdAt: childUser.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating child account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
