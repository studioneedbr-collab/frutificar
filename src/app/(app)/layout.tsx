import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/prisma'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: { select: { name: true } } },
  })
  const userPlan = subscription?.plan?.name ?? null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userPlan={userPlan} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header userPlan={userPlan} userName={session.user.name} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
