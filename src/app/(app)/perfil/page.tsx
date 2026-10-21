// Server Component: busca o usuário real (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em PerfilView (client).
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PerfilView } from './perfil-view'

// Só para o modo demo (PREVIEW_MODE).
const MOCK_NAME = 'Douglas Vargas'
const MOCK_EMAIL = 'douglas@fazendasantaclara.com.br'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export default async function PerfilPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <PerfilView initialName={MOCK_NAME} initialEmail={MOCK_EMAIL} preview />
  }

  // Modo real: exige sessão.
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let user: { name: string | null; email: string | null; createdAt: Date | null } | null
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, createdAt: true },
    })
  } catch (err) {
    console.error('[perfil] erro ao carregar do banco:', err)
    // Usa o que a sessão já tem — nunca dados fictícios.
    user = { name: session.user.name ?? null, email: session.user.email ?? null, createdAt: null }
  }
  if (!user) redirect('/login')

  const memberSince = user.createdAt
    ? `Membro desde ${MESES[user.createdAt.getMonth()]}/${user.createdAt.getFullYear()}`
    : ''

  return (
    <PerfilView
      initialName={user.name ?? ''}
      initialEmail={user.email ?? ''}
      initialPlan={session.user.plan ?? null}
      memberSince={memberSince}
      preview={false}
    />
  )
}
