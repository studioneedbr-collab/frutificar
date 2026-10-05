import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role, PlanName } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Confia no host da requisição (necessário fora da Vercel / atrás de proxy /
  // em portas diferentes). Sem isso o Auth.js retorna UntrustedHost.
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : null
        const password = typeof credentials?.password === 'string' ? credentials.password : null
        if (!email || !password) return null

        // Case-insensitive: contas antigas podem ter sido gravadas com maiúsculas.
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          select: { id: true, email: true, name: true, passwordHash: true, role: true, deletedAt: true, suspendedAt: true, emailVerified: true },
        })

        // Conta excluída ou suspensa pelo admin não entra.
        if (!user || user.deletedAt || user.suspendedAt) return null
        if (!user.passwordHash) return null

        const passwordValid = await bcrypt.compare(password, user.passwordHash)
        if (!passwordValid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified != null }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        // Só atualiza no sign-in (como token.plan). Após verificar o e-mail, o
        // banner persiste até o próximo login/refresh do JWT — comportamento
        // aceitável para verificação "soft".
        token.emailVerified = user.emailVerified
        // Fetch plan and cache in JWT (refreshed on each sign-in)
        const subscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
          select: { status: true, plan: { select: { name: true } } },
        })
        token.plan = subscription?.status === 'ACTIVE' ? subscription.plan.name : null
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.plan = token.plan as PlanName | null
        ;(session.user as { emailVerified: boolean }).emailVerified = token.emailVerified as boolean
      }
      return session
    },
  },
})
