'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, FlaskConical } from 'lucide-react'
import type { FinanceMonth, FinanceSummary } from '@/server/repositories/finance.repository'

/* ── Formatação ─────────────────────────────────────────── */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
})
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo',
})
const monthShortFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
const monthLongFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function keyToDate(key: string): Date {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 15))
}
/** "out" (ou "jan 26" na virada do ano / 1ª barra). */
function monthTick(key: string, withYear: boolean): string {
  const d = keyToDate(key)
  const m = monthShortFmt.format(d).replace('.', '')
  return withYear ? `${m} ${String(d.getUTCFullYear()).slice(2)}` : m
}
const monthLong = (key: string) => (key ? monthLongFmt.format(keyToDate(key)) : 'mês atual')

const planLabel: Record<string, string> = { GOLD: 'Gold', PREMIUM: 'Premium', ESSENCIAL: 'Essencial' }

/* ── Estilos compartilhados (mesmo visual das outras telas do admin) ── */

const card = { background: 'white', border: '1px solid oklch(0.91 0.01 144)' } as const
const headingStyle = { fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' } as const
const mutedText = 'oklch(0.58 0.03 144)'
const softText = 'oklch(0.52 0.04 144)'
const hairline = 'oklch(0.93 0.005 144)'
const barColor = 'var(--color-frutificar-green)'

/* ── View ───────────────────────────────────────────────── */

export function FinanceiroView({
  summary, preview, loadError,
}: {
  summary: FinanceSummary
  preview: boolean
  loadError: boolean
}) {
  const s = summary
  const month = monthLong(s.currentMonth)

  const kpis: { label: string; value: string; hint: string }[] = [
    {
      label: 'MRR',
      value: brl.format(s.mrr),
      hint: 'Receita recorrente mensal das assinaturas pagas (anual ÷ 12, cupom permanente aplicado).',
    },
    {
      label: 'Receita do mês',
      value: brl.format(s.monthRevenue),
      hint: `Pagamentos confirmados em ${month} (fuso de Brasília).`,
    },
    {
      label: 'Assinaturas pagas',
      value: String(s.activeCount),
      hint: 'Assinaturas com status Ativa.',
    },
    {
      label: 'Aguardando pagamento',
      value: String(s.pendingCount),
      hint: 'Checkout iniciado, primeiro pagamento ainda não confirmado.',
    },
    {
      label: 'Inadimplentes',
      value: String(s.pastDueCount),
      hint: s.pastDueOpenAmount > 0
        ? `${brl.format(s.pastDueOpenAmount)} em cobranças em aberto.`
        : 'Nenhuma cobrança em aberto.',
    },
    {
      label: 'Cancelamentos no mês',
      value: String(s.canceledThisMonth),
      hint: `Assinaturas canceladas em ${month}.`,
    },
    {
      label: 'Churn do mês',
      value: s.churnRate === null ? '—' : pct.format(s.churnRate),
      hint: `Canceladas no mês ÷ pagantes no início do mês (${s.churnCanceled} de ${s.churnBase}). Base estimada: assinaturas criadas antes do dia 1 que hoje estão ativas ou inadimplentes, ou que foram canceladas neste mês.`,
    },
    {
      label: 'Ticket médio',
      value: s.ticketAverage === null ? '—' : brl.format(s.ticketAverage),
      hint: `Receita do mês ÷ nº de pagamentos do mês (${s.monthPaymentsCount}).`,
    },
  ]

  const planTotalMrr = s.activeByPlan.reduce((sum, r) => sum + r.mrr, 0)
  const methodTotal = s.revenueByMethod.reduce((sum, r) => sum + r.total, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ ...headingStyle, letterSpacing: '-0.03em' }}>Financeiro</h1>
        <p className="text-sm mt-1" style={{ color: softText }}>Receita, assinaturas e pagamentos</p>
      </div>

      {preview && (
        <div role="note" className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'oklch(0.96 0.04 85)', border: '1px solid oklch(0.85 0.08 85)', color: 'oklch(0.4 0.08 70)' }}>
          <FlaskConical size={16} className="mt-0.5 shrink-0" />
          <span><strong>Dados de demonstração.</strong> Modo preview ativo — todos os números desta página são fictícios.</span>
        </div>
      )}
      {loadError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'oklch(0.97 0.02 27)', border: '1px solid oklch(0.85 0.06 27)', color: 'oklch(0.45 0.12 27)' }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>Não foi possível carregar os dados financeiros agora. Os valores abaixo estão zerados.</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl p-5 flex flex-col" style={card}>
            <span className="text-xs font-semibold mb-3" style={{ color: mutedText }}>{k.label}</span>
            <p className="text-2xl font-bold" style={{ ...headingStyle, letterSpacing: '-0.04em' }}>{k.value}</p>
            <p className="text-[11px] mt-2 leading-snug" style={{ color: 'oklch(0.6 0.02 144)' }}>{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Receita por mês */}
      <section className="rounded-2xl p-5" style={card} aria-labelledby="fin-chart-title">
        <div className="mb-4">
          <h2 id="fin-chart-title" className="font-bold" style={headingStyle}>Receita por mês</h2>
          <p className="text-xs mt-0.5" style={{ color: mutedText }}>Pagamentos confirmados nos últimos 12 meses</p>
        </div>
        <RevenueChart months={s.revenueByMonth} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Por plano */}
        <section className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: hairline }}>
            <h2 className="font-bold" style={headingStyle}>Assinaturas ativas por plano</h2>
            <p className="text-xs mt-0.5" style={{ color: mutedText }}>Quantidade e participação no MRR</p>
          </div>
          {s.activeByPlan.length === 0 ? (
            <Empty>Nenhuma assinatura paga no momento.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold tracking-wide uppercase" style={{ color: 'oklch(0.6 0.03 144)' }}>
                  <th scope="col" className="text-left font-bold px-5 py-2.5">Plano</th>
                  <th scope="col" className="text-right font-bold px-3 py-2.5">Ativas</th>
                  <th scope="col" className="text-right font-bold px-3 py-2.5">MRR</th>
                  <th scope="col" className="text-left font-bold px-5 py-2.5 w-[34%]">Participação</th>
                </tr>
              </thead>
              <tbody>
                {s.activeByPlan.map((r) => {
                  const share = planTotalMrr > 0 ? r.mrr / planTotalMrr : 0
                  return (
                    <tr key={r.plan} style={{ borderTop: `1px solid ${hairline}` }}>
                      <th scope="row" className="text-left font-semibold px-5 py-3" style={{ color: 'var(--color-frutificar-deep)' }}>
                        {planLabel[r.plan] ?? r.plan}
                      </th>
                      <td className="text-right px-3 py-3 tabular-nums" style={{ color: softText }}>{r.count}</td>
                      <td className="text-right px-3 py-3 tabular-nums font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{brl.format(r.mrr)}</td>
                      <td className="px-5 py-3"><ShareBar share={share} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Por forma de pagamento */}
        <section className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: hairline }}>
            <h2 className="font-bold" style={headingStyle}>Receita do mês por forma de pagamento</h2>
            <p className="text-xs mt-0.5 first-letter:uppercase" style={{ color: mutedText }}>{month}</p>
          </div>
          {s.revenueByMethod.length === 0 ? (
            <Empty>Nenhum pagamento confirmado neste mês.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold tracking-wide uppercase" style={{ color: 'oklch(0.6 0.03 144)' }}>
                  <th scope="col" className="text-left font-bold px-5 py-2.5">Forma</th>
                  <th scope="col" className="text-right font-bold px-3 py-2.5">Pagamentos</th>
                  <th scope="col" className="text-right font-bold px-3 py-2.5">Receita</th>
                  <th scope="col" className="text-left font-bold px-5 py-2.5 w-[34%]">Participação</th>
                </tr>
              </thead>
              <tbody>
                {s.revenueByMethod.map((r) => (
                  <tr key={r.method} style={{ borderTop: `1px solid ${hairline}` }}>
                    <th scope="row" className="text-left font-semibold px-5 py-3" style={{ color: 'var(--color-frutificar-deep)' }}>{r.method}</th>
                    <td className="text-right px-3 py-3 tabular-nums" style={{ color: softText }}>{r.count}</td>
                    <td className="text-right px-3 py-3 tabular-nums font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{brl.format(r.total)}</td>
                    <td className="px-5 py-3"><ShareBar share={methodTotal > 0 ? r.total / methodTotal : 0} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Últimos pagamentos */}
      <section className="rounded-2xl overflow-hidden" style={card}>
        <div className="px-5 py-4 border-b" style={{ borderColor: hairline }}>
          <h2 className="font-bold" style={headingStyle}>Últimos pagamentos</h2>
          <p className="text-xs mt-0.5" style={{ color: mutedText }}>Os 20 pagamentos confirmados mais recentes</p>
        </div>
        {s.recentPayments.length === 0 ? (
          <Empty>Nenhum pagamento confirmado ainda.</Empty>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold tracking-wide uppercase" style={{ color: 'oklch(0.6 0.03 144)' }}>
                    <th scope="col" className="text-left font-bold px-5 py-2.5">Data</th>
                    <th scope="col" className="text-left font-bold px-3 py-2.5">Aluno</th>
                    <th scope="col" className="text-left font-bold px-3 py-2.5">Plano</th>
                    <th scope="col" className="text-left font-bold px-3 py-2.5">Forma</th>
                    <th scope="col" className="text-right font-bold px-5 py-2.5">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[oklch(0.985_0_0)] transition-colors" style={{ borderTop: `1px solid ${hairline}` }}>
                      <td className="px-5 py-3 text-xs tabular-nums whitespace-nowrap" style={{ color: 'oklch(0.62 0.02 144)' }}>{dateFmt.format(new Date(p.paidAt)).replace('.', '')}</td>
                      <td className="px-3 py-3 font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{p.student}</td>
                      <td className="px-3 py-3" style={{ color: softText }}>{p.plan ? planLabel[p.plan] ?? p.plan : '—'}</td>
                      <td className="px-3 py-3" style={{ color: softText }}>{p.method}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums" style={{ color: 'var(--color-frutificar-deep)' }}>{brl.format(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="md:hidden divide-y" style={{ borderColor: hairline }}>
              {s.recentPayments.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{p.student}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.6 0.02 144)' }}>
                      {dateFmt.format(new Date(p.paidAt)).replace('.', '')} · {p.plan ? planLabel[p.plan] ?? p.plan : '—'} · {p.method}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: 'var(--color-frutificar-deep)' }}>{brl.format(p.amount)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

/* ── Peças ──────────────────────────────────────────────── */

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>{children}</div>
}

/** Barra de participação (0–1) com o percentual em texto ao lado — a cor nunca carrega o valor sozinha. */
function ShareBar({ share }: { share: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'oklch(0.95 0.008 144)' }} aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${Math.round(share * 100)}%`, background: barColor }} />
      </div>
      <span className="text-xs tabular-nums w-12 text-right" style={{ color: softText }}>{pct.format(share)}</span>
    </div>
  )
}

/** Passo "redondo" (1, 2, 2,5, 5 × 10ⁿ) para os ticks do eixo Y. */
function niceStep(raw: number): number {
  if (raw <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(raw))
  const f = raw / pow
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * pow
}

/** Barra com topo arredondado (4px) e base reta no eixo. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, h, w / 2)
  const b = y + h
  return `M${x},${b}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${b}Z`
}

const CHART_H = 240
const M = { top: 20, right: 8, bottom: 28, left: 64 }

function RevenueChart({ months }: { months: FinanceMonth[] }) {
  const titleId = useId()
  const descId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  // Mede a largura real para o texto do SVG não escalar (fica legível no celular).
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width)
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const total12 = months.reduce((sum, m) => sum + m.total, 0)
  if (months.length === 0 || total12 === 0) {
    return <Empty>Nenhum pagamento confirmado nos últimos 12 meses.</Empty>
  }

  const max = Math.max(...months.map((m) => m.total))
  const step = niceStep(max / 4)
  const top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)

  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = CHART_H - M.top - M.bottom
  const band = plotW / months.length
  const barW = Math.min(24, Math.max(4, band * 0.6))
  const y = (v: number) => M.top + plotH - (v / top) * plotH
  const lastIdx = months.length - 1
  // Em telas estreitas, mostra o rótulo do mês em barras alternadas.
  const labelEvery = band < 34 ? 2 : 1
  // Rótulo do mês atual alinhado à direita quando não cabe centralizado (evita corte).
  const lastLabelEnd = band / 2 + M.right < 32

  const activeMonth = active === null ? null : months[active]
  const tooltipLeft = active === null ? 0 : M.left + band * active + band / 2

  const description = months
    .map((m) => `${monthLong(m.key)}: ${brl.format(m.total)}`)
    .join('; ')

  return (
    <div>
      <div ref={wrapRef} className="relative w-full">
        <svg
          width={width}
          height={CHART_H}
          role="group"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="block max-w-full overflow-visible"
          style={{ fontFamily: 'inherit' }}
        >
          <title id={titleId}>Receita por mês (últimos 12 meses)</title>
          <desc id={descId}>{description}</desc>

          {/* Grade e eixo Y */}
          {ticks.map((t) => (
            <g key={t} aria-hidden>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)}
                stroke={t === 0 ? 'oklch(0.82 0.01 144)' : 'oklch(0.94 0.005 144)'} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11}
                fill="oklch(0.6 0.02 144)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {brlCompact.format(t)}
              </text>
            </g>
          ))}

          {/* Barras */}
          {months.map((m, i) => {
            const cx = M.left + band * i + band / 2
            const h = Math.max(0, y(0) - y(m.total))
            const isActive = active === i
            const dim = active !== null && !isActive
            const showTick = i % labelEvery === (lastIdx % labelEvery) || i === 0
            return (
              <g
                key={m.key}
                tabIndex={0}
                role="img"
                aria-label={`${monthLong(m.key)}: ${brl.format(m.total)}, ${m.count} pagamento${m.count === 1 ? '' : 's'}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none focus-visible:[&>rect:first-child]:stroke-[var(--color-frutificar-green)]"
              >
                {/* Alvo de hover/foco: a faixa inteira, maior que a barra. */}
                <rect x={M.left + band * i} y={M.top} width={band} height={plotH}
                  fill={isActive ? 'oklch(0.97 0.01 144)' : 'transparent'} strokeWidth={1.5} rx={6} />
                {h > 0 && (
                  <path d={barPath(cx - barW / 2, y(m.total), barW, h)} fill={barColor}
                    opacity={dim ? 0.45 : 1} style={{ transition: 'opacity 120ms' }} />
                )}
                {showTick && (
                  <text x={cx} y={CHART_H - 8} textAnchor="middle" fontSize={11}
                    fill={i === lastIdx ? 'oklch(0.36 0.06 144)' : 'oklch(0.6 0.02 144)'}
                    fontWeight={i === lastIdx ? 600 : 400}>
                    {monthTick(m.key, i === 0 || m.key.endsWith('-01'))}
                  </text>
                )}
              </g>
            )
          })}

          {/* Rótulo direto só no mês atual (seletivo). */}
          {active === null && months[lastIdx].total > 0 && (
            <text
              x={M.left + band * lastIdx + band / 2 + (lastLabelEnd ? barW / 2 : 0)}
              y={y(months[lastIdx].total) - 6}
              textAnchor={lastLabelEnd ? 'end' : 'middle'} fontSize={11} fontWeight={600}
              fill="oklch(0.3 0.06 144)" aria-hidden>
              {brlCompact.format(months[lastIdx].total)}
            </text>
          )}
        </svg>

        {/* Tooltip (hover/foco) */}
        {activeMonth && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 rounded-lg px-3 py-2 text-xs shadow-md whitespace-nowrap"
            style={{
              left: Math.min(Math.max(tooltipLeft, 70), width - 70),
              top: Math.max(0, y(activeMonth.total) - 58),
              transform: 'translateX(-50%)',
              background: 'var(--color-frutificar-deep)',
              color: 'white',
            }}
          >
            <p className="font-semibold first-letter:uppercase">{monthLong(activeMonth.key)}</p>
            <p className="tabular-nums">{brl.format(activeMonth.total)} · {activeMonth.count} pagamento{activeMonth.count === 1 ? '' : 's'}</p>
          </div>
        )}
      </div>

      {/* Tabela equivalente (acessibilidade / conferência) */}
      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-semibold select-none" style={{ color: softText }}>
          Ver dados em tabela
        </summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold tracking-wide uppercase" style={{ color: 'oklch(0.6 0.03 144)' }}>
              <th scope="col" className="text-left font-bold py-2">Mês</th>
              <th scope="col" className="text-right font-bold py-2">Pagamentos</th>
              <th scope="col" className="text-right font-bold py-2">Receita</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.key} style={{ borderTop: `1px solid ${hairline}` }}>
                <th scope="row" className="text-left font-medium py-2 first-letter:uppercase" style={{ color: 'var(--color-frutificar-deep)' }}>{monthLong(m.key)}</th>
                <td className="text-right py-2 tabular-nums" style={{ color: softText }}>{m.count}</td>
                <td className="text-right py-2 tabular-nums font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{brl.format(m.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
