import type { Role, PlanName } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      plan: PlanName | null
      emailVerified: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    emailVerified: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    plan: PlanName | null
    emailVerified: boolean
  }
}
