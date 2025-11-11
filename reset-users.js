const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // 既存のユーザーをすべて削除
  await prisma.user.deleteMany({});
  console.log('✅ 既存のユーザーをすべて削除しました');

  // 正しいテストユーザーを作成
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      name: 'テストユーザー',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
    },
  });
  
  console.log('\n✅ テストユーザーを作成しました:');
  console.log('メール: test@example.com');
  console.log('パスワード: password123');
  console.log('ユーザーID:', user.id);
  console.log('役割:', user.role);
  
  // 基本限度額を設定
  const limit = await prisma.expenseLimit.create({
    data: {
      masterUserId: user.id,
      limitType: 'MONTHLY',
      limitAmount: 500000,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  });
  
  console.log('\n✅ 基本限度額を設定しました（月50万円）');
  console.log('限度額ID:', limit.id);
}

main()
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
