'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Inbox, Check, X, Play, CheckCheck } from 'lucide-react'
import {
  acceptServiceRequest, completeServiceRequest, rejectServiceRequest,
} from '@/server/actions/admin'
import type { SolicitacaoItem, SolStatus } from './data'

const statusMeta: Record<SolStatus, { label: string; bg: string; color: string }> = {
  OPEN:        { label: 'Em aberto',    bg: 'oklch(0.7 0.15 70 / 0.14)',   color: 'oklch(0.5 0.13 70)' },
  IN_PROGRESS: { label: 'Em andamento', bg: 'oklch(0.55 0.1 220 / 0.12)',  color: 'oklch(0.4 0.1 220)' },
  COMPLETED:   { label: 'Concluída',    bg: 'oklch(0.48 0.13 144 / 0.1)',  color: 'var(--color-frutificar-green)' },
  CANCELED:    { label: 'Cancelada',    bg: 'oklch(0.6 0.1 27 / 0.12)',    color: 'oklch(0.45 0.1 27)' },
}

const filters = ['Todas', 'Em aberto', 'Em andamento', 'Concluídas', 'Canceladas'] as const
type Filter = (typeof filters)[number]
const filterToStatus: Record<Exclude<Filter, 'Todas'>, SolStatus> = {
  'Em aberto': 'OPEN', 'Em andamento': 'IN_PROGRESS', 'Concluídas': 'COMPLETED', 'Canceladas': 'CANCELED',
}

export function SolicitacoesView({ initial, preview }: { initial: SolicitacaoItem[]; preview: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState<SolicitacaoItem[]>(initial)
  useEffect(() => { setItems(initial) }, [initial])

  const [filter, setFilter] = useState<Filter>('Todas')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const openCount = items.filter((i) => i.status === 'OPEN').length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (filter !== 'Todas' && i.status !== filterToStatus[filter]) return false
      if (q && !i.user.toLowerCase().includes(q) && !i.type.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, filter, query])

  async function act(id: string, next: SolStatus, fn: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status: next } : i)))
    if (!preview) {
      setBusy(id)
      const res = await fn(id)
      setBusy(null)
      if (!res.ok) toast.error(res.error ?? 'Erro')
      else router.refresh()
    } else {
      toast.success('Atualizado (demo)')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Solicitações</h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{items.length} no total · {openCount} em aberto</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-xs" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
          <Search size={14} style={{ color: 'oklch(0.58 0.03 144)' }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por aluno, tipo…"
            className="text-sm bg-transparent outline-none w-full placeholder:text-[oklch(0.65_0.02_144)]" style={{ color: 'var(--color-frutificar-deep)' }} />
        </div>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={f === filter ? { background: 'var(--color-frutificar-forest)', color: 'white' } : { background: 'white', color: 'oklch(0.52 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <Inbox size={22} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>Nenhuma solicitação {filter !== 'Todas' ? 'neste filtro' : 'ainda'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((i) => {
            const st = statusMeta[i.status]
            const isBusy = busy === i.id
            return (
              <div key={i.id} className="rounded-2xl bg-white p-5 flex flex-col sm:flex-row sm:items-start gap-4" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ background: 'var(--color-frutificar-forest)' }}>
                  {i.user.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{i.type}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{i.user} · {i.email} · {i.date}</p>
                  <p className="text-sm mt-2" style={{ color: 'oklch(0.4 0.04 144)', lineHeight: 1.5 }}>{i.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {i.status === 'OPEN' && (
                    <>
                      <button disabled={isBusy} onClick={() => act(i.id, 'IN_PROGRESS', acceptServiceRequest)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: 'var(--color-frutificar-green)' }}>
                        <Play size={13} /> Aceitar
                      </button>
                      <button disabled={isBusy} onClick={() => act(i.id, 'CANCELED', rejectServiceRequest)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] disabled:opacity-50" style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.3)' }}>
                        <X size={13} /> Recusar
                      </button>
                    </>
                  )}
                  {i.status === 'IN_PROGRESS' && (
                    <>
                      <button disabled={isBusy} onClick={() => act(i.id, 'COMPLETED', completeServiceRequest)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: 'var(--color-frutificar-green)' }}>
                        <CheckCheck size={13} /> Concluir
                      </button>
                      <button disabled={isBusy} onClick={() => act(i.id, 'CANCELED', rejectServiceRequest)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] disabled:opacity-50" style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.3)' }}>
                        <X size={13} /> Cancelar
                      </button>
                    </>
                  )}
                  {(i.status === 'COMPLETED' || i.status === 'CANCELED') && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1" style={{ color: 'oklch(0.6 0.03 144)' }}>
                      <Check size={13} /> Finalizada
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
