import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { EmailVerificationBanner } from '@/components/shared/email-verification-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const userPlan = session.user.plan

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userPlan={userPlan} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header userPlan={userPlan} userName={session.user.name ?? 'Usuário'} />
        {!session.user.emailVerified && <EmailVerificationBanner />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
