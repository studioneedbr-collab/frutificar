// Server Component: busca materiais reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em MateriaisView (client).
// O layout admin não tem auth(); buscamos direto — as Server Actions exigem ADMIN.
// No banco: category (texto livre) ↔ `type` e requiredPlan ↔ `plan`.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listResources } from '@/server/repositories/materials.repository'
import { mockMaterials, type Material, type MaterialType, type MaterialPlan } from './data'
import { MateriaisView } from './materiais-view'

function toType(category: string): MaterialType {
  const c = category.toUpperCase()
  if (c === 'PDF' || c === 'SPREADSHEET' || c === 'DOC') return c
  return 'DOC'
}

function toPlan(requiredPlan: string): MaterialPlan {
  const p = requiredPlan.toUpperCase()
  if (p === 'GOLD' || p === 'PREMIUM' || p === 'ESSENCIAL') return p
  return 'PREMIUM'
}

export default async function AdminMateriaisPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <MateriaisView initialMaterials={mockMaterials} preview />
  }

  // Modo real: lê do banco; em caso de erro, cai no mock para não quebrar.
  try {
    const rows = await listResources()
    const materials: Material[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: toType(r.category),
      plan: toPlan(r.requiredPlan),
      downloads: 0,
      size: '— MB',
      date: r.createdAt.toLocaleDateString('pt-BR'),
    }))

    return <MateriaisView initialMaterials={materials} preview={false} />
  } catch (err) {
    console.error('[admin/materiais] falha ao carregar materiais:', err)
    return <MateriaisView initialMaterials={[]} preview={false} />
  }
}
