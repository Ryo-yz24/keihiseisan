import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('=== AUTHORIZE DEBUG ===');
        console.log('credentials:', credentials);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password');
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        console.log('user found:', user ? 'YES' : 'NO');
        if (user) {
          console.log('user.id:', user.id);
          console.log('user.email:', user.email);
          console.log('user.role:', user.role);
          console.log('has password:', user.password ? 'YES' : 'NO');
        }

        if (!user || !user.password) {
          console.log('❌ User not found or no password');
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log('password valid:', isPasswordValid ? 'YES' : 'NO');

        if (!isPasswordValid) {
          console.log('❌ Invalid password');
          return null;
        }

        console.log('✅ Login successful');
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          masterUserId: user.masterUserId,
          canViewOthers: user.canViewOthers,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.masterUserId = user.masterUserId;
        token.canViewOthers = user.canViewOthers;
        console.log('JWT callback - setting token.id:', user.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'MASTER' | 'CHILD';
        session.user.masterUserId = token.masterUserId as string | null;
        session.user.canViewOthers = token.canViewOthers as boolean;
        console.log('Session callback - setting session.user.id:', token.id);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  debug: true,
};
