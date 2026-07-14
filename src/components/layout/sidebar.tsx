'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, MessageCircle, Radio,
  Leaf, Mic2, Calendar, Wrench, BarChart3, MapPin, Sun, User, Menu,
  GraduationCap,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { FrutificarLogo } from '@/components/shared/logo'
import type { PlanName } from '@prisma/client'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, plan: null },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/cursos',     label: 'Cursos',     icon: BookOpen,        plan: 'ESSENCIAL' as PlanName },
      { href: '/minicursos', label: 'Minicursos', icon: GraduationCap,   plan: 'PREMIUM' as PlanName },
      { href: '/lives',    label: 'Lives',     icon: Radio,           plan: 'PREMIUM' as PlanName },
      { href: '/podcasts', label: 'Podcasts',  icon: Mic2,            plan: 'PREMIUM' as PlanName },
      { href: '/chat',     label: 'Chat IA',   icon: MessageCircle,   plan: 'ESSENCIAL' as PlanName },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/diagnostico',   label: 'Diagnóstico',   icon: Leaf,      plan: 'ESSENCIAL' as PlanName },
      { href: '/gestao',        label: 'Gestão',        icon: BarChart3, plan: 'PREMIUM' as PlanName },
      { href: '/propriedades',  label: 'Propriedades',  icon: MapPin,    plan: null },
      { href: '/dias-de-campo', label: 'Dias de Campo', icon: Sun,       plan: 'GOLD' as PlanName },
    ],
  },
  {
    label: 'Suporte',
    items: [
      { href: '/agendamentos', label: 'Agendamentos', icon: Calendar,      plan: 'PREMIUM' as PlanName },
      { href: '/tutoring',     label: 'Tutoria',      icon: GraduationCap, plan: 'GOLD' as PlanName },
      { href: '/servicos',     label: 'Serviços',     icon: Wrench,        plan: 'PREMIUM' as PlanName },
      { href: '/perfil',       label: 'Perfil',       icon: User,          plan: null },
    ],
  },
]

const planDotColor: Record<PlanName, string> = {
  ESSENCIAL: 'oklch(0.65 0.12 225)',
  PREMIUM:   'oklch(0.62 0.12 55)',
  GOLD:      'oklch(0.78 0.17 75)',
}

const planLabel: Record<PlanName, string> = {
  ESSENCIAL: 'ESS',
  PREMIUM:   'PRO',
  GOLD:      'GOLD',
}

const planPillStyle: Record<PlanName, string> = {
  ESSENCIAL: 'oklch(0.65 0.12 225 / 0.15)',
  PREMIUM:   'oklch(0.62 0.12 55 / 0.18)',
  GOLD:      'oklch(0.78 0.17 75 / 0.18)',
}

const planDisplayName: Record<PlanName, string> = {
  ESSENCIAL: 'Essencial',
  PREMIUM:   'Premium',
  GOLD:      'Gold',
}

interface SidebarProps {
  userPlan?: PlanName | null
}

function SidebarContent({ userPlan, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div
      className="flex flex-col h-full w-64"
      style={{ background: 'var(--color-frutificar-night)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'oklch(1 0 0 / 0.07)' }}>
        <FrutificarLogo white size={22} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p
              className="px-2 mb-1.5 text-[10px] font-bold tracking-[0.18em] uppercase select-none"
              style={{ color: 'oklch(1 0 0 / 0.28)' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all relative',
                      isActive
                        ? 'text-white'
                        : 'text-white/55 hover:text-white/85 hover:bg-white/[0.06]',
                    )}
                    style={
                      isActive
                        ? {
                            background: 'oklch(1 0 0 / 0.09)',
                            boxShadow: 'inset 3px 0 0 var(--color-earth)',
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className="h-[15px] w-[15px] shrink-0"
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="flex-1 leading-none">{item.label}</span>
                    {item.plan && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide"
                        style={{
                          background: planPillStyle[item.plan],
                          color: planDotColor[item.plan],
                        }}
                      >
                        {planLabel[item.plan]}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Plano do usuário */}
      {userPlan && (
        <div className="px-3 py-4 border-t" style={{ borderColor: 'oklch(1 0 0 / 0.07)' }}>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'oklch(1 0 0 / 0.06)', border: '1px solid oklch(1 0 0 / 0.1)' }}
          >
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5"
              style={{ color: 'oklch(1 0 0 / 0.35)' }}>
              Seu plano
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: planDotColor[userPlan] }}
              />
              <span className="text-sm font-bold text-white">
                {planDisplayName[userPlan]}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function Sidebar({ userPlan }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30">
        <SidebarContent userPlan={userPlan} />
      </aside>
      <div className="hidden md:block w-64 shrink-0" />
    </>
  )
}

export function MobileSidebarTrigger({ userPlan }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Abrir menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-64 border-0"
        style={{ background: 'var(--color-frutificar-night)' }}
      >
        <SidebarContent userPlan={userPlan} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
