const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateMasterPassword() {
  try {
    console.log('master@example.comのパスワードを更新します...\n')

    // パスワードハッシュ
    const hashedPassword = '$2a$10$EVPC816kwpZcJTDP.1a/quX2vSAGrUciD8g/nS7Zh62t.OXmDclnu'

    // master@example.comのユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: 'master@example.com' }
    })

    if (!user) {
      console.log('❌ master@example.comのユーザーが見つかりません')
      return
    }

    // パスワードを更新
    await prisma.user.update({
      where: { email: 'master@example.com' },
      data: { password: hashedPassword }
    })

    console.log('✅ パスワードを更新しました')
    console.log('メールアドレス: master@example.com')
    console.log('新しいパスワード: xJ6wfpzM')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateMasterPassword()
