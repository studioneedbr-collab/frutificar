import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role, PlanName } from '@prisma/client'
import { subscriptionGrantsAccess } from '@/lib/subscription-access'
import { rateLimit, ipFromRequest } from '@/lib/rate-limit'

const SESSION_REFRESH_MS = 2 * 60 * 1000

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
      async authorize(credentials, request) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : null
        const password = typeof credentials?.password === 'string' ? credentials.password : null
        if (!email || !password || password.length > 200) return null

        // Força bruta: 10 tentativas por e-mail e 30 por IP a cada 15 min.
        const ip = request ? ipFromRequest(request) : 'unknown'
        if (!rateLimit(`login:email:${email}`, 10, 15 * 60_000) || !rateLimit(`login:ip:${ip}`, 30, 15 * 60_000)) {
          console.warn('[auth] limite de tentativas de login atingido', { ip })
          return null
        }

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
        // Só atualiza no sign-in. Após verificar o e-mail, o banner persiste até
        // o próximo login — comportamento aceitável para verificação "soft".
        token.emailVerified = user.emailVerified
      }
      // Conta e plano revalidados no banco a cada SESSION_REFRESH_MS: suspensão,
      // exclusão, troca de perfil (admin) e mudança de assinatura valem sem
      // precisar sair e entrar de novo. Sem plano (aguardando pagamento no
      // checkout) revalida a cada requisição, para liberar assim que pagar.
      const userId = token.id as string | undefined
      const checkedAt = token.planCheckedAt as number | undefined
      const stale = !token.plan || !checkedAt || Date.now() - checkedAt > SESSION_REFRESH_MS
      if (userId && (user || stale)) {
        try {
          const current = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              role: true,
              deletedAt: true,
              suspendedAt: true,
              emailVerified: true,
              subscription: {
                select: { status: true, currentPeriodEnd: true, gatewaySubscriptionId: true, plan: { select: { name: true } } },
              },
            },
          })
          // Conta excluída ou suspensa: encerra a sessão na hora.
          if (!current || current.deletedAt || current.suspendedAt) return null
          token.role = current.role
          token.emailVerified = current.emailVerified != null
          const subscription = current.subscription
          token.plan = subscriptionGrantsAccess(subscription) ? subscription!.plan.name : null
          token.planUntil =
            subscription && token.plan && !subscription.gatewaySubscriptionId
              ? subscription.currentPeriodEnd.getTime()
              : null
          token.planCheckedAt = Date.now()
        } catch (err) {
          // Falha no banco não derruba a sessão: mantém o último valor conhecido.
          console.error('[auth] falha ao revalidar sessão:', err)
        }
      }
      // Período com acesso vencido entre duas revalidações.
      const planUntil = token.planUntil as number | null | undefined
      if (planUntil && Date.now() > planUntil) token.plan = null
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
