import { AdminSidebar } from '@/components/layout/admin-sidebar'

// DEV PREVIEW — auth desabilitada temporariamente para visualização sem banco
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 overflow-hidden md:ml-56">
        <header
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'oklch(0.92 0.01 144)', background: 'white' }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: 'oklch(0.45 0.05 144)' }}
          >
            Painel Administrativo
          </p>
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
        </header>
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: 'oklch(0.975 0.005 144)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
