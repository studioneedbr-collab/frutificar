import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { PLAN_FEATURES, ROUTE_FEATURE_MAP, type Feature } from '@/lib/constants'
import type { PlanName } from '@prisma/client'

// Real é o padrão: auth + plan-gating ligados. O modo demo (sem banco) é OPT-IN
// via PREVIEW_MODE="true" — assim a produção nunca fica sem controle por engano.
const PREVIEW_MODE = process.env.PREVIEW_MODE === 'true'

// Inline pure helpers — no DB/Prisma dependency in middleware
function canAccessFeature(plan: PlanName | null | undefined, feature: Feature): boolean {
  if (!plan) return false
  const features = PLAN_FEATURES[plan] as readonly string[]
  return features.includes(feature)
}

function getRouteRequiredFeature(pathname: string): Feature | null {
  const base = '/' + pathname.split('/')[1]
  return (ROUTE_FEATURE_MAP[base] as Feature | undefined) ?? null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public routes — always allow
  const isPublicPath =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname === '/cadastro' ||
    pathname === '/esqueci-senha' ||
    pathname === '/redefinir-senha' ||
    pathname === '/verificar-email' ||
    pathname.startsWith('/planos') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')

  if (isPublicPath) return NextResponse.next()

  // DEV PREVIEW — libera tudo sem banco. Ative o controle real com PREVIEW_MODE=false.
  if (PREVIEW_MODE) return NextResponse.next()

  // Rotas não autenticadas → login
  if (!session?.user) {
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login'
    return NextResponse.redirect(new URL(loginPath, req.url))
  }

  // Área administrativa exige role ADMIN — usuário logado sem permissão vai ao dashboard.
  if (pathname.startsWith('/admin') && session.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Só entra quem pagou: aluno sem assinatura ativa vai para o checkout
  // (admin e instrutor não pagam). APIs respondem por conta própria.
  const userPlan = session.user.plan ?? null
  const isCheckout = pathname === '/checkout' || pathname.startsWith('/checkout/')
  if (session.user.role === 'STUDENT' && !userPlan && !isCheckout && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/checkout', req.url))
  }

  // App route plan check
  const requiredFeature = getRouteRequiredFeature(pathname)

  if (requiredFeature) {
    if (!userPlan) {
      // Sem assinatura ativa → checkout
      return NextResponse.redirect(new URL('/checkout', req.url))
    }

    if (!canAccessFeature(userPlan, requiredFeature)) {
      // Has subscription but plan doesn't cover this feature
      const url = new URL('/perfil/assinatura', req.url)
      url.searchParams.set('bloqueado', requiredFeature)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
