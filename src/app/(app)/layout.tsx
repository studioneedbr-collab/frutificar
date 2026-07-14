import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { EmailVerificationBanner } from '@/components/shared/email-verification-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Modo demo (sem banco): não exige login — renderiza com um aluno fictício
  // para que o botão "Entrar como aluno (sem banco)" funcione.
  const session = PREVIEW_MODE ? null : await auth()
  if (!PREVIEW_MODE && !session) {
    redirect('/login')
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
