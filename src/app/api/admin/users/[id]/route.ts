import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ユーザー情報の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // 認証チェック
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // マスターアカウントのみ許可
    if (session.user.role !== 'MASTER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { name, email } = body

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '名前を入力してください' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    // 更新対象のユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック: 自分自身または自分の子アカウントのみ編集可能
    const canEdit =
      targetUser.id === session.user.id || // 自分自身
      targetUser.masterUserId === session.user.id // 自分の子アカウント

    if (!canEdit) {
      return NextResponse.json(
        { error: 'このユーザーを編集する権限がありません' },
        { status: 403 }
      )
    }

    // メールアドレスの重複チェック（自分以外）
    if (email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        )
      }
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}
