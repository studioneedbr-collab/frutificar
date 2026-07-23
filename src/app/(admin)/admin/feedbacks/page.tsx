// Server Component: lista os feedbacks enviados pelos alunos. Read-only.
export const dynamic = 'force-dynamic'

import { Star, MessageSquareHeart } from 'lucide-react'
import { PREVIEW_MODE } from '@/lib/preview'
import { listFeedbacks } from '@/server/repositories/feedback.repository'

type Row = { id: string; userName: string; userEmail: string; rating: number | null; message: string; date: string }

const mockRows: Row[] = [
  { id: '1', userName: 'Maria Aparecida', userEmail: 'maria@exemplo.com', rating: 5, message: 'Os cursos são ótimos e o diagnóstico por foto me salvou na safra. Recomendo!', date: '14 jul 2026' },
  { id: '2', userName: 'Pedro Henrique', userEmail: 'pedro@exemplo.com', rating: 4, message: 'Muito bom, só senti falta de mais conteúdo sobre irrigação.', date: '12 jul 2026' },
]

function Stars({ n }: { n: number | null }) {
  if (!n) return <span className="text-xs" style={{ color: 'oklch(0.6 0.03 144)' }}>sem nota</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} style={{ color: i <= n ? 'var(--color-earth)' : 'oklch(0.85 0.02 144)' }} fill={i <= n ? 'var(--color-earth)' : 'none'} />
      ))}
    </span>
  )
}

export default async function AdminFeedbacksPage() {
  let rows: Row[] = mockRows
  if (!PREVIEW_MODE) {
    try {
      const data = await listFeedbacks()
      rows = data.map((f) => ({
        id: f.id, userName: f.userName, userEmail: f.userEmail, rating: f.rating,
        message: f.message,
        date: f.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      }))
    } catch (err) {
      console.error('[admin/feedbacks] falha ao carregar feedbacks:', err)
      rows = []
    }
  }

  const withRating = rows.filter((r) => r.rating != null)
  const avg = withRating.length ? (withRating.reduce((a, r) => a + (r.rating ?? 0), 0) / withRating.length).toFixed(1) : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Feedbacks</h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{rows.length} recebidos · nota média {avg}{avg !== '—' ? '/5' : ''}</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <MessageSquareHeart size={22} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>Nenhum feedback ainda</p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.58 0.03 144)' }}>Os feedbacks dos alunos aparecem aqui.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-5" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ background: 'var(--color-frutificar-forest)' }}>
                    {r.userName.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{r.userName}</p>
                    <p className="text-xs truncate" style={{ color: 'oklch(0.58 0.03 144)' }}>{r.userEmail}</p>
                  </div>
                </div>
                <span className="text-[11px] shrink-0" style={{ color: 'oklch(0.62 0.02 144)' }}>{r.date}</span>
              </div>
              <div className="mb-2"><Stars n={r.rating} /></div>
              <p className="text-sm" style={{ color: 'oklch(0.4 0.04 144)', lineHeight: 1.55 }}>{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
