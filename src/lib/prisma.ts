import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// 開発環境でホットリロード時に接続が増えないようにする
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
