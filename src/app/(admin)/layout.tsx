import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b bg-background">
          <div className="flex items-center gap-3">
            <span
              className="font-bold text-lg"
              style={{ fontFamily: 'var(--font-jakarta)', color: 'var(--color-frutificar-green)' }}
            >
              🌱 Frutificar
            </span>
            <span className="text-sm text-muted-foreground">/ Admin</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {session.user.name} · <span className="font-medium">{session.user.role}</span>
          </p>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
