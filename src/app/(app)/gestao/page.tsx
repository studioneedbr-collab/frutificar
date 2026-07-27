// Server Component: Gestão da Propriedade (licenças, documentos, histórico).
// Lê PropertyDocument por propriedade do aluno.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listPropertiesWithDocuments } from '@/server/repositories/properties.repository'
import { type GestaoProperty, type DocType } from './data'
import { GestaoView } from './gestao-view'

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

export default async function GestaoPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  try {
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

    return <GestaoView properties={properties} />
  } catch (err) {
    console.error('[app/gestao] falha ao carregar propriedades:', err)
    return <GestaoView properties={[]} />
  }
}
