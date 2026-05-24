'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, MessageCircle, Radio, Leaf,
  Mic2, Calendar, Wrench, BarChart3, MapPin, Sun, User, Menu, X,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { PlanName } from '@prisma/client'

const menuItems = [
  { href: '/dashboard',     label: 'Dashboard',       icon: LayoutDashboard, plan: null },
  { href: '/cursos',        label: 'Cursos',           icon: BookOpen,        plan: 'ESSENCIAL' as PlanName },
  { href: '/chat',          label: 'Chat IA',          icon: MessageCircle,   plan: 'PREMIUM' as PlanName },
  { href: '/lives',         label: 'Lives',            icon: Radio,           plan: 'ESSENCIAL' as PlanName },
  { href: '/diagnostico',   label: 'Diagnóstico',      icon: Leaf,            plan: 'PREMIUM' as PlanName },
  { href: '/podcasts',      label: 'Podcasts',         icon: Mic2,            plan: 'ESSENCIAL' as PlanName },
  { href: '/agendamentos',  label: 'Agendamentos',     icon: Calendar,        plan: null },
  { href: '/servicos',      label: 'Serviços',         icon: Wrench,          plan: null },
  { href: '/gestao',        label: 'Gestão',           icon: BarChart3,       plan: 'PREMIUM' as PlanName },
  { href: '/propriedades',  label: 'Propriedades',     icon: MapPin,          plan: null },
  { href: '/dias-de-campo', label: 'Dias de Campo',    icon: Sun,             plan: 'GOLD' as PlanName },
  { href: '/perfil',        label: 'Perfil',           icon: User,            plan: null },
]

const planBadgeColors: Record<string, string> = {
  ESSENCIAL: 'bg-blue-500/20 text-blue-200',
  PREMIUM:   'bg-yellow-500/20 text-yellow-200',
  GOLD:      'bg-amber-400/20 text-amber-200',
}

interface SidebarProps {
  userPlan?: PlanName | null
}

function SidebarContent({ userPlan, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div
      className="flex flex-col h-full w-64"
      style={{ background: 'var(--color-frutificar-deep)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <span
          className="text-white font-bold text-xl"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          🌱 Frutificar
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10',
              )}
              style={
                isActive
                  ? { background: 'var(--color-frutificar-forest)' }
                  : undefined
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.plan && (
                <span
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase',
                    planBadgeColors[item.plan] ?? 'bg-white/10 text-white/60',
                  )}
                >
                  {item.plan === 'ESSENCIAL' ? 'ESS' : item.plan}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan indicator */}
      {userPlan && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wide">Seu plano</p>
          <p className="text-sm font-semibold text-white mt-0.5">{userPlan}</p>
        </div>
      )}
    </div>
  )
}

export function Sidebar({ userPlan }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — fixed left */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30">
        <SidebarContent userPlan={userPlan} />
      </aside>
      {/* Spacer so main content doesn't hide behind fixed sidebar */}
      <div className="hidden md:block w-64 shrink-0" />
    </>
  )
}

export function MobileSidebarTrigger({ userPlan }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Base UI v1: SheetTrigger uses render prop instead of asChild */}
      <SheetTrigger
        render={
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Abrir menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 border-0" style={{ background: 'var(--color-frutificar-deep)' }}>
        <SidebarContent userPlan={userPlan} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
