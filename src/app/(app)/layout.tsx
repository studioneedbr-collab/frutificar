import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { getSetting } from '@/server/repositories/settings.repository'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { EmailVerificationBanner } from '@/components/shared/email-verification-banner'

function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'oklch(0.975 0.005 144)' }}>
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">🌱</div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>Em manutenção</h1>
        <p className="mt-2 text-sm" style={{ color: 'oklch(0.5 0.04 144)' }}>
          Estamos fazendo melhorias na plataforma e voltamos já já. Obrigado pela paciência!
        </p>
      </div>
    </div>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Modo demo (sem banco): não exige login — renderiza com um aluno fictício
  // para que o botão "Entrar como aluno (sem banco)" funcione.
  const session = PREVIEW_MODE ? null : await auth()
  if (!PREVIEW_MODE && !session) {
    redirect('/login')
  }

  // Modo de manutenção (admin /configuracoes): bloqueia produtores, admin passa.
  if (!PREVIEW_MODE && session && session.user.role !== 'ADMIN') {
    try {
      if ((await getSetting('maintenance_mode')) === 'true') return <MaintenanceScreen />
    } catch { /* sem settings — segue normal */ }
  }

  const userPlan = session?.user.plan ?? 'GOLD'
  const userName = session?.user.name ?? 'Aluno Demo'
  // Em preview não há e-mail a verificar; fora dele, respeita a sessão.
  const emailVerified = PREVIEW_MODE ? true : session?.user.emailVerified

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userPlan={userPlan} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header userPlan={userPlan} userName={userName} />
        {!emailVerified && <EmailVerificationBanner />}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
