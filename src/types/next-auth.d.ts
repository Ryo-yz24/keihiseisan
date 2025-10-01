import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: 'MASTER' | 'CHILD'
      masterUserId?: string | null
      canViewOthers: boolean
    }
  }

  interface User {
    role: 'MASTER' | 'CHILD'
    masterUserId?: string | null
    canViewOthers: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'MASTER' | 'CHILD'
    masterUserId?: string | null
    canViewOthers: boolean
  }
}

