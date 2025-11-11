const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      name: 'テストユーザー',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
    },
  });
  
  console.log('✅ テストユーザーを作成しました:');
  console.log('メール: test@example.com');
  console.log('パスワード: password123');
  console.log('ユーザーID:', user.id);
  
  // 基本限度額も設定
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
