import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // 一時的にPrismaAdapterを無効化
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 一時的にシンプルな認証（パスワードハッシュなし）
        if (credentials.email === 'admin@example.com' && credentials.password === 'password123') {
          return {
            id: '1',
            email: 'admin@example.com',
            name: '管理者',
            role: 'MASTER' as const,
            masterUserId: null,
            canViewOthers: true
          }
        }
        
        if (credentials.email === 'user@example.com' && credentials.password === 'password123') {
          return {
            id: '2',
            email: 'user@example.com',
            name: '一般ユーザー',
            role: 'CHILD' as const,
            masterUserId: '1',
            canViewOthers: false
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8時間（セキュリティ強化）
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8時間
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.masterUserId = user.masterUserId
        token.canViewOthers = user.canViewOthers
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as 'MASTER' | 'CHILD'
        session.user.masterUserId = token.masterUserId as string | undefined
        session.user.canViewOthers = token.canViewOthers as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === 'development',
  // セキュリティ強化
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: env.NODE_ENV === 'production'
      }
    }
  }
}

