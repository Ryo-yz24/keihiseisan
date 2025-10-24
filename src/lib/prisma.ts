// デプロイ用：Prisma接続を無効化
// import { PrismaClient } from '@prisma/client'

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ダミーのPrismaクライアント
export const prisma = {
  user: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: '1', email: 'test@example.com' }),
    update: () => Promise.resolve({ id: '1', email: 'test@example.com' }),
  },
  expense: {
    findMany: () => Promise.resolve([]),
    aggregate: () => Promise.resolve({ _sum: { amount: 0 } }),
    groupBy: () => Promise.resolve([]),
  },
  expenseLimit: {
    findFirst: () => Promise.resolve(null),
  },
  auditLog: {
    create: () => Promise.resolve({ id: '1' }),
  },
} as any

