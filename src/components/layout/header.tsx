import { auth } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { MobileSidebarTrigger } from './sidebar'
import type { PlanName } from '@prisma/client'
import { logoutAction } from '@/server/actions/auth'
import { User, CreditCard, LogOut, ChevronRight } from 'lucide-react'

const planPill: Record<PlanName, { label: string; style: React.CSSProperties }> = {
  ESSENCIAL: {
    label: 'Essencial',
    style: {
      background: 'oklch(0.65 0.12 225 / 0.12)',
      color: 'oklch(0.48 0.12 225)',
      border: '1px solid oklch(0.65 0.12 225 / 0.3)',
    },
  },
  PREMIUM: {
    label: 'Premium',
    style: {
      background: 'oklch(0.62 0.12 55 / 0.12)',
      color: 'oklch(0.50 0.12 55)',
      border: '1px solid oklch(0.62 0.12 55 / 0.35)',
    },
  },
  GOLD: {
    label: 'Gold',
    style: {
      background: 'oklch(0.78 0.17 75 / 0.14)',
      color: 'oklch(0.55 0.14 75)',
      border: '1px solid oklch(0.78 0.17 75 / 0.4)',
    },
  },
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

interface HeaderProps {
  userPlan?: PlanName | null
  userName?: string | null
}

export async function Header({ userPlan, userName }: HeaderProps) {
  // DEV PREVIEW: fallback quando não há sessão (sem banco)
  let sessionUser: { name?: string | null; email?: string | null } = { name: userName, email: null }
  try {
    const session = await auth()
    if (session?.user) sessionUser = session.user
  } catch { /* sem banco — usa fallback */ }

  const firstName = (userName ?? sessionUser.name)?.split(' ')[0] ?? 'Usuário'
  const initials = getInitials(userName ?? sessionUser.name)
  const pill = userPlan ? planPill[userPlan] : null

  return (
    <header
      className="flex items-center justify-between px-5 md:px-7 py-3.5 border-b"
      style={{
        background: 'oklch(1 0 0 / 0.97)',
        backdropFilter: 'blur(8px)',
        borderColor: 'oklch(0.92 0.01 144)',
      }}
    >
      {/* Esquerda: hambúrguer mobile + saudação */}
      <div className="flex items-center gap-3">
        <MobileSidebarTrigger userPlan={userPlan} />
        <p
          className="text-sm hidden sm:block"
          style={{ color: 'oklch(0.5 0.04 144)' }}
        >
          Olá,{' '}
          <span
            className="font-semibold"
            style={{ color: 'var(--color-frutificar-deep)' }}
          >
            {firstName}
          </span>
        </p>
      </div>

      {/* Direita: plano + avatar */}
      <div className="flex items-center gap-3">
        {pill && (
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide hidden sm:inline-block"
            style={pill.style}
          >
            {pill.label}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="relative h-8 w-8 rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Menu do usuário"
              />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-white text-xs font-bold"
                style={{ background: 'var(--color-frutificar-forest)' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className="w-64 p-0 overflow-hidden rounded-2xl">
            {/* Cabeçalho com avatar + plano */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.24 0.09 144))' }}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback
                  className="text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(140deg, var(--color-frutificar-green), var(--color-frutificar-forest))' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                  {userName ?? sessionUser.name ?? 'Usuário'}
                </p>
                <p className="text-xs truncate" style={{ color: 'oklch(1 0 0 / 0.55)' }}>
                  {sessionUser.email ?? '—'}
                </p>
              </div>
              {pill && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={pill.style}
                >
                  {pill.label}
                </span>
              )}
            </div>

            <div className="p-1.5">
              <DropdownMenuItem className="rounded-lg p-0">
                <Link href="/perfil" className="flex items-center gap-3 w-full px-2.5 py-2 text-[13.5px] font-medium">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                    <User size={15} style={{ color: 'var(--color-frutificar-green)' }} />
                  </span>
                  <span className="flex-1">Meu perfil</span>
                  <ChevronRight size={14} className="opacity-40" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg p-0">
                <Link href="/perfil/assinatura" className="flex items-center gap-3 w-full px-2.5 py-2 text-[13.5px] font-medium">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'oklch(0.62 0.12 55 / 0.12)' }}>
                    <CreditCard size={15} style={{ color: 'var(--color-earth)' }} />
                  </span>
                  <span className="flex-1">Minha assinatura</span>
                  <ChevronRight size={14} className="opacity-40" />
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1.5" />

              <DropdownMenuItem className="rounded-lg p-0">
                <form action={logoutAction} className="w-full">
                  <button
                    type="submit"
                    className="flex items-center gap-3 w-full px-2.5 py-2 text-[13.5px] font-medium text-destructive"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
                      <LogOut size={15} />
                    </span>
                    Sair
                  </button>
                </form>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
