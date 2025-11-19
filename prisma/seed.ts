import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Seed実行時は直接接続を使用（Poolerのprepared statement問題を回避）
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash('password123', 10);

  // MASTERユーザーを作成
  const masterUser = await prisma.user.upsert({
    where: { email: 'master@example.com' },
    update: {},
    create: {
      email: 'master@example.com',
      name: 'Master User',
      password: hashedPassword,
      role: 'MASTER',
    },
  });

  console.log('✅ Master user created:', masterUser.email);

  // 一般ユーザーを作成
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'CHILD',
      masterUserId: masterUser.id,
    },
  });

  console.log('✅ Test user created:', testUser.email);

  // デフォルトカテゴリを作成
  const defaultCategories = [
    { name: '交通費', displayOrder: 1 },
    { name: '宿泊費', displayOrder: 2 },
    { name: '飲食費', displayOrder: 3 },
    { name: '通信費', displayOrder: 4 },
    { name: '消耗品費', displayOrder: 5 },
    { name: '書籍費', displayOrder: 6 },
    { name: '会議費', displayOrder: 7 },
    { name: 'その他', displayOrder: 8 },
  ];

  for (const category of defaultCategories) {
    // 既存のカテゴリをチェック（グローバルカテゴリシステム）
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name,
      },
    });

    if (!existingCategory) {
      const createdCategory = await prisma.category.create({
        data: {
          name: category.name,
          displayOrder: category.displayOrder,
          isActive: true,
        },
      });
      console.log(`✅ Category created: ${createdCategory.name}`);
    } else {
      console.log(`⏭️  Category already exists: ${existingCategory.name}`);
    }
  }

  // 月次上限を作成（例: 月額10万円）
  const existingLimit = await prisma.expenseLimit.findFirst({
    where: {
      masterUserId: masterUser.id,
      targetUserId: testUser.id,
      limitType: 'MONTHLY',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  });

  if (!existingLimit) {
    const monthlyLimit = await prisma.expenseLimit.create({
      data: {
        masterUserId: masterUser.id,
        targetUserId: testUser.id,
        limitType: 'MONTHLY',
        limitAmount: 100000,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      },
    });
    console.log('✅ Monthly limit created:', monthlyLimit.limitAmount.toString());
  } else {
    console.log('⏭️  Monthly limit already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
