import { redirect } from 'next/navigation'
import { AdminSidebar, AdminMobileTrigger } from '@/components/layout/admin-sidebar'
import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'

// Em modo real (PREVIEW_MODE=false) exige uma sessão com role ADMIN.
// Em modo preview continua liberado para visualização sem banco.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!PREVIEW_MODE) {
    const session = await auth()
    if (!session?.user) redirect('/admin/login')
    if (session.user.role !== 'ADMIN') redirect('/login')
  }

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
          {PREVIEW_MODE && (
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: 'oklch(0.62 0.12 55 / 0.1)',
                color: 'oklch(0.48 0.12 55)',
                border: '1px solid oklch(0.62 0.12 55 / 0.25)',
              }}
            >
              Visualização · sem banco
            </span>
          )}
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
