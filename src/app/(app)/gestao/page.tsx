// Server Component: Gestão da Propriedade (licenças, documentos, histórico).
// Lê PropertyDocument por propriedade do aluno; em preview usa mock.
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { listPropertiesWithDocuments } from '@/server/repositories/properties.repository'
import { mockProperties, type GestaoProperty, type DocType } from './data'
import { GestaoView } from './gestao-view'

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

export default async function GestaoPage() {
  if (PREVIEW_MODE) {
    return <GestaoView properties={mockProperties} preview />
  }

  try {
    const session = await auth()
    if (!session?.user?.id) return <GestaoView properties={mockProperties} preview />

    const rows = await listPropertiesWithDocuments(session.user.id)
    const properties: GestaoProperty[] = rows.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location ?? '—',
      docs: p.documents.map((d) => ({
        id: d.id,
        type: d.type as DocType,
        title: d.title,
        description: d.description,
        fileUrl: d.fileUrl,
        issuer: d.issuer,
        issuedAt: iso(d.issuedAt),
        expiresAt: iso(d.expiresAt),
        createdAt: d.createdAt.toISOString(),
      })),
    }))

    return <GestaoView properties={properties} preview={false} />
  } catch {
    return <GestaoView properties={mockProperties} preview />
  }
}
