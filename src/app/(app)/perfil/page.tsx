// Server Component: busca o usuário real (Supabase). A interatividade fica em
// PerfilView (client).
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PerfilView } from './perfil-view'

export default async function PerfilPage() {
  // Sem sessão → login (nunca dados fake).
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })
  if (!user) {
    redirect('/login')
  }

  return (
    <PerfilView
      initialName={user.name ?? ''}
      initialEmail={user.email ?? ''}
    />
  )
}
