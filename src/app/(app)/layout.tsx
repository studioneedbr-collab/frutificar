import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

// DEV PREVIEW — auth e banco desabilitados temporariamente para visualização
const MOCK_SESSION = {
  user: { id: 'preview', name: 'Douglas Vargas', email: 'admin@frutificar.com', role: 'ADMIN' as const, plan: 'GOLD' as const },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userPlan = MOCK_SESSION.user.plan

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userPlan={userPlan} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header userPlan={userPlan} userName={MOCK_SESSION.user.name} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
