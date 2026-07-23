// Server Component: busca o usuário real (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em PerfilView (client).
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PerfilView } from './perfil-view'

const MOCK_NAME = 'Douglas Vargas'
const MOCK_EMAIL = 'douglas@fazendasantaclara.com.br'

export default async function PerfilPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <PerfilView initialName={MOCK_NAME} initialEmail={MOCK_EMAIL} preview />
  }

  // Modo real: sem sessão → login (nunca dados fake).
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
      preview={false}
    />
  )
}
