// Server Component: central de downloads da Gestão. Lê DownloadableResource (o que o
// admin publica em Materiais) e mostra o que o plano do aluno permite baixar.
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { PLAN_HIERARCHY } from '@/lib/constants'
import { listResources } from '@/server/repositories/materials.repository'
import type { PlanName } from '@prisma/client'
import { mockDownloads, type Download } from './data'
import { GestaoView } from './gestao-view'

export default async function GestaoPage() {
  if (PREVIEW_MODE) {
    return <GestaoView downloads={mockDownloads} />
  }

  try {
    const session = await auth()
    const userPlan = (session?.user?.plan ?? 'ESSENCIAL') as PlanName
    const userRank = PLAN_HIERARCHY[userPlan]

    const rows = await listResources()
    const downloads: Download[] = rows
      .filter((r) => PLAN_HIERARCHY[r.requiredPlan] <= userRank)
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        plan: r.requiredPlan,
        url: r.fileUrl,
      }))

    return <GestaoView downloads={downloads} />
  } catch {
    return <GestaoView downloads={mockDownloads} />
  }
}
