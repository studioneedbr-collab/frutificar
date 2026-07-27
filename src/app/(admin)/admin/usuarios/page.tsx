// Server Component: busca usuários reais (Supabase). A interatividade fica em
// UsuariosView (client). O layout admin não tem auth(); buscamos direto —
// as Server Actions exigem ADMIN.
export const dynamic = 'force-dynamic'

import { listUsers } from '@/server/repositories/users.repository'
import { type User } from './data'
import { UsuariosView } from './usuarios-view'

function capitalizePlan(name: string): string {
  const lower = name.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export default async function AdminUsuariosPage() {
  // Lê do banco; em caso de erro, renderiza lista vazia (nunca mock).
  try {
    const rows = await listUsers()
    const users: User[] = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      plan: u.subscription?.plan?.name ? capitalizePlan(u.subscription.plan.name) : '—',
      status: u.suspendedAt ? 'Suspenso' : 'Ativo',
      role: u.role,
      joined: u.createdAt.toLocaleDateString('pt-BR'),
    }))

    return <UsuariosView initialUsers={users} />
  } catch (err) {
    // NUNCA mostrar usuários fake de demonstração ao admin (levaria a
    // decisões sobre dados inexistentes). Loga o erro e renderiza lista vazia.
    console.error('[admin/usuarios] falha ao carregar usuários:', err)
    return <UsuariosView initialUsers={[]} />
  }
}
