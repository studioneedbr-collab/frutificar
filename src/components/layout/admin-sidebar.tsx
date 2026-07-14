'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FrutificarLogo } from '@/components/shared/logo'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard, Users, CreditCard, BookOpen, Video,
  Mic2, Download, Calendar, Wrench, Sun, FileText,
  Settings, ChevronRight, Inbox, Menu,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Visão geral',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Pessoas',
    items: [
      { href: '/admin/usuarios',    label: 'Usuários',      icon: Users },
      { href: '/admin/assinaturas', label: 'Assinaturas',   icon: CreditCard },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/cursos',    label: 'Cursos',          icon: BookOpen },
      { href: '/admin/lives',     label: 'Lives',           icon: Video },
      { href: '/admin/podcasts',  label: 'Podcasts',        icon: Mic2 },
      { href: '/admin/materiais', label: 'Materiais',       icon: Download },
    ],
  },
  {
    label: 'Operação',
    items: [
      { href: '/admin/solicitacoes',  label: 'Solicitações',    icon: Inbox },
      { href: '/admin/agendamentos',  label: 'Agendamentos',    icon: Calendar },
      { href: '/admin/servicos',      label: 'Serviços',        icon: Wrench },
      { href: '/admin/dias-de-campo', label: 'Dias de Campo',   icon: Sun },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/planos',        label: 'Planos',          icon: FileText },
      { href: '/admin/configuracoes', label: 'Configurações',   icon: Settings },
    ],
  },
]

function AdminSidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full w-56" style={{ background: 'var(--color-frutificar-night)' }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'oklch(1 0 0 / 0.07)' }}>
        <FrutificarLogo white size={20} />
        <span
          className="block text-[10px] font-bold tracking-[0.2em] uppercase mt-1.5 ml-[calc(20px+10px)]"
          style={{ color: 'oklch(0.62 0.12 55)' }}
        >
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p
              className="px-2 mb-1 text-[9.5px] font-bold tracking-[0.18em] uppercase select-none"
              style={{ color: 'oklch(1 0 0 / 0.25)' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = 'exact' in item && item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all',
                      isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]',
                    )}
                    style={
                      isActive
                        ? {
                            background: 'oklch(1 0 0 / 0.08)',
                            boxShadow: 'inset 3px 0 0 var(--color-earth)',
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className="h-[14px] w-[14px] shrink-0"
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="flex-1 leading-none">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={11} className="opacity-40" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Voltar ao app */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'oklch(1 0 0 / 0.07)' }}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-all text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
        >
          <ChevronRight size={12} className="rotate-180" />
          Voltar ao app
        </Link>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return (
    <aside
      className="hidden md:flex flex-col h-screen fixed left-0 top-0 bottom-0 z-30"
      style={{ borderRight: '1px solid oklch(1 0 0 / 0.06)' }}
    >
      <AdminSidebarInner />
    </aside>
  )
}

export function AdminMobileTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
            aria-label="Abrir menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-56 border-0" style={{ background: 'var(--color-frutificar-night)' }}>
        <AdminSidebarInner onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
