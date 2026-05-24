import { auth, signOut } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MobileSidebarTrigger } from './sidebar'
import { prisma } from '@/lib/prisma'
import type { PlanName } from '@prisma/client'

const planBadgeStyle: Record<PlanName, { variant: 'secondary' | 'outline' | 'default'; className?: string }> = {
  ESSENCIAL: { variant: 'secondary' },
  PREMIUM:   { variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
  GOLD:      { variant: 'default', className: 'bg-amber-400 text-amber-900 hover:bg-amber-400' },
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

export async function Header() {
  const session = await auth()
  if (!session?.user) return null

  const firstName = session.user.name?.split(' ')[0] ?? 'Usuário'
  const initials = getInitials(session.user.name)

  // Fetch plan from database
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: { select: { name: true } } },
  })
  const userPlan = subscription?.plan?.name ?? null
  const badgeStyle = userPlan ? planBadgeStyle[userPlan] : null

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-background border-b">
      {/* Left: mobile hamburger + greeting */}
      <div className="flex items-center gap-3">
        <MobileSidebarTrigger userPlan={userPlan} />
        <p className="text-sm font-medium hidden sm:block" style={{ color: 'var(--color-frutificar-green)' }}>
          Olá, <span className="font-semibold">{firstName}</span>!
        </p>
      </div>

      {/* Right: plan badge + avatar dropdown */}
      <div className="flex items-center gap-3">
        {badgeStyle && userPlan && (
          <Badge
            variant={badgeStyle.variant}
            className={badgeStyle.className}
          >
            {userPlan}
          </Badge>
        )}

        <DropdownMenu>
          {/* Base UI v1: use render prop instead of asChild */}
          <DropdownMenuTrigger
            render={
              <button
                className="relative h-9 w-9 rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Menu do usuário"
              />
            }
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className="text-white text-sm font-semibold"
                style={{ background: 'var(--color-frutificar-forest)' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/perfil" className="w-full">
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/login' })
                }}
                className="w-full"
              >
                <button type="submit" className="w-full text-left text-destructive text-sm">
                  Sair
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
