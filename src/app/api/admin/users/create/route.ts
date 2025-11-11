import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // MASTERロールのみがユーザーを作成可能
    if (session.user.role !== 'MASTER') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, password } = body

    // バリデーション
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で設定してください' },
        { status: 400 }
      )
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10)

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'CHILD',  // 作成するユーザーは常にCHILD
        masterUserId: session.user.id,  // MASTERユーザーのIDを設定
        canViewOthers: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canViewOthers: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'ユーザーを作成しました',
      user
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
