import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
