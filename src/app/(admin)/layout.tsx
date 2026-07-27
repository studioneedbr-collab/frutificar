import { redirect } from 'next/navigation'
import { AdminSidebar, AdminMobileTrigger } from '@/components/layout/admin-sidebar'
import { auth } from '@/lib/auth'

// Exige uma sessão com role ADMIN.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')
  if (session.user.role !== 'ADMIN') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 md:ml-56">
        <header
          className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'oklch(0.92 0.01 144)', background: 'white' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <AdminMobileTrigger />
            <p
              className="text-sm font-semibold truncate"
              style={{ color: 'oklch(0.45 0.05 144)' }}
            >
              Painel Administrativo
            </p>
          </div>
        </header>
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6"
          style={{ background: 'oklch(0.975 0.005 144)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
