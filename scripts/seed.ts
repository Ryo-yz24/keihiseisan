import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 データベースのシードを開始します...')

  // マスターアカウントの作成
  const masterUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '管理者',
      password: await bcrypt.hash('password123', 12),
      role: 'MASTER',
      canViewOthers: true
    }
  })

  console.log('✅ マスターアカウントを作成しました:', masterUser.email)

  // 子アカウントの作成
  const childUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: '一般ユーザー',
      password: await bcrypt.hash('password123', 12),
      role: 'CHILD',
      masterUserId: masterUser.id,
      canViewOthers: false
    }
  })

  console.log('✅ 子アカウントを作成しました:', childUser.email)

  // カテゴリの作成
  const categories = [
    { name: '交通費', displayOrder: 1 },
    { name: '飲食費（接待）', displayOrder: 2 },
    { name: '消耗品費', displayOrder: 3 },
    { name: '通信費', displayOrder: 4 },
    { name: '水道光熱費', displayOrder: 5 },
    { name: '広告宣伝費', displayOrder: 6 },
    { name: 'その他（未分類）', displayOrder: 7 }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { 
        id: `${masterUser.id}-${category.name}` // 一意のIDを生成
      },
      update: {},
      create: {
        id: `${masterUser.id}-${category.name}`,
        masterUserId: masterUser.id,
        name: category.name,
        displayOrder: category.displayOrder,
        isActive: true
      }
    })
  }

  console.log('✅ カテゴリを作成しました')

  // 限度額の設定
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const limitId = `${masterUser.id}-MONTHLY-${currentYear}-${currentMonth}`
  
  await prisma.expenseLimit.upsert({
    where: {
      id: limitId
    },
    update: {},
    create: {
      id: limitId,
      masterUserId: masterUser.id,
      limitType: 'MONTHLY',
      limitAmount: 100000,
      year: currentYear,
      month: currentMonth
    }
  })

  console.log('✅ 限度額を設定しました')

  // サンプル経費データの作成
  const sampleExpenses = [
    {
      userId: childUser.id,
      expenseDate: new Date('2024-01-15'),
      amount: 15000,
      taxRate: 0.10,
      taxAmount: 1364,
      amountWithoutTax: 13636,
      vendor: '株式会社サンプル',
      purpose: '会議費',
      category: '飲食費（接待）',
      status: 'PENDING' as const
    },
    {
      userId: childUser.id,
      expenseDate: new Date('2024-01-14'),
      amount: 8500,
      taxRate: 0.10,
      taxAmount: 773,
      amountWithoutTax: 7727,
      vendor: '交通費',
      purpose: '出張費',
      category: '交通費',
      status: 'APPROVED' as const,
      approvedAt: new Date('2024-01-15'),
      approvedBy: masterUser.id
    },
    {
      userId: childUser.id,
      expenseDate: new Date('2024-01-13'),
      amount: 3200,
      taxRate: 0.10,
      taxAmount: 291,
      amountWithoutTax: 2909,
      vendor: 'オフィス用品店',
      purpose: '文房具購入',
      category: '消耗品費',
      status: 'REJECTED' as const,
      rejectionReason: '領収書の記載が不十分です'
    }
  ]

  for (const expense of sampleExpenses) {
    await prisma.expense.create({
      data: expense
    })
  }

  console.log('✅ サンプル経費データを作成しました')

  console.log('🎉 データベースのシードが完了しました！')
}

main()
  .catch((e) => {
    console.error('❌ シード中にエラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
