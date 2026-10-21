'use client'

import { useEffect, useRef, useState } from 'react'
import type { PlanName, SubscriptionStatus } from '@prisma/client'
import { Check, Copy, CreditCard, ExternalLink, FileText, Loader2, LogOut, QrCode, ShieldCheck } from 'lucide-react'
import { FrutificarLogo } from '@/components/shared/logo'
import { createCheckout, checkCheckoutStatus, quoteCheckoutAction, type CheckoutQuote } from '@/server/actions/checkout'
import { logoutAction } from '@/server/actions/auth'
import type { OpenCharge } from '@/server/services/billing.service'

export type CheckoutPlan = { name: PlanName; price: number; yearly: number; features: string[] }
type Cycle = 'MONTHLY' | 'YEARLY'
type Method = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

const planLabel: Record<PlanName, string> = { ESSENCIAL: 'Essencial', PREMIUM: 'Premium', GOLD: 'Gold' }

const methods: { value: Method; label: string; hint: string; icon: typeof QrCode }[] = [
  { value: 'PIX', label: 'Pix', hint: 'Liberação na hora', icon: QrCode },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito', hint: 'Renova sozinho todo mês', icon: CreditCard },
  { value: 'BOLETO', label: 'Boleto', hint: 'Compensa em até 3 dias úteis', icon: FileText },
]

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function maskCpfCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

const statusNote: Partial<Record<SubscriptionStatus, string>> = {
  PAST_DUE: 'Sua mensalidade está em aberto. Pague para voltar a acessar a plataforma.',
  CANCELED: 'Sua assinatura foi cancelada. Escolha um plano para voltar a acessar.',
}

export function CheckoutView({
  userName, plans, initialPlan, needsCpf, status, initialCharge,
}: {
  userName: string
  plans: CheckoutPlan[]
  initialPlan: PlanName
  needsCpf: boolean
  status: SubscriptionStatus
  initialCharge: OpenCharge | null
}) {
  const [plan, setPlan] = useState<PlanName>(initialPlan)
  const [cycle, setCycle] = useState<Cycle>('MONTHLY')
  const [couponInput, setCouponInput] = useState('')
  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [method, setMethod] = useState<Method>(
    initialCharge && initialCharge.billingType !== 'UNDEFINED' ? (initialCharge.billingType as Method) : 'PIX',
  )
  const [cpf, setCpf] = useState('')
  const [charge, setCharge] = useState<OpenCharge | null>(initialCharge)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(false)
  const polling = useRef(false)

  const selected = plans.find((p) => p.name === plan)
  const fullPrice = selected ? (cycle === 'YEARLY' ? selected.yearly : selected.price) : 0
  const today = quote ? quote.first : fullPrice
  const per = cycle === 'YEARLY' ? '/ano' : '/mês'

  // Plano ou ciclo mudou: o cupom precisa ser recalculado.
  function choosePlan(p: PlanName) { setPlan(p); setQuote(null); setCouponError(null) }
  function chooseCycle(c: Cycle) { setCycle(c); setQuote(null); setCouponError(null) }

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await quoteCheckoutAction({ plan, cycle, couponCode: code })
      if (res.ok && res.data.coupon) setQuote(res.data)
      else { setQuote(null); setCouponError(res.ok ? 'Cupom inválido.' : res.error) }
    } catch {
      setCouponError('Não foi possível validar o cupom agora.')
    } finally {
      setCouponLoading(false)
    }
  }
  const firstName = userName.split(' ')[0]

  // Enquanto há cobrança na tela, consulta o status a cada 5s.
  useEffect(() => {
    if (!charge || paid) return
    const id = setInterval(async () => {
      if (polling.current) return
      polling.current = true
      try {
        const res = await checkCheckoutStatus()
        if (res.ok && res.data.active) {
          setPaid(true)
          // Navegação completa (não SPA) de propósito: a sessão é recarregada
          // já com o plano ativo antes de entrar na plataforma.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          setTimeout(() => window.location.assign('/dashboard'), 1500)
        }
      } finally {
        polling.current = false
      }
    }, 5000)
    return () => clearInterval(id)
  }, [charge, paid])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (needsCpf && cpf.replace(/\D/g, '').length < 11) {
      setError('Informe seu CPF ou CNPJ.')
      return
    }
    setLoading(true)
    try {
      const res = await createCheckout({
        plan, method, cycle,
        cpfCnpj: needsCpf ? cpf : undefined,
        couponCode: quote?.coupon?.code,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setCharge(res.data)
      if (res.data.billingType !== 'PIX' && res.data.invoiceUrl) {
        window.open(res.data.invoiceUrl, '_blank', 'noopener')
      }
    } catch {
      setError('Não foi possível gerar o pagamento. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function copyPix() {
    if (!charge?.pix) return
    try {
      await navigator.clipboard.writeText(charge.pix.payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* navegador sem permissão de clipboard */ }
  }

  const cardStyle = { background: 'white', border: '1px solid oklch(0.9 0.02 144)' }
  const heading = { fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-parchment)' }}>
      <header className="flex items-center justify-between px-4 sm:px-8 py-5 max-w-5xl mx-auto">
        <FrutificarLogo size={24} />
        <form action={logoutAction}>
          <button type="submit" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70"
            style={{ color: 'var(--color-frutificar-forest)' }}>
            <LogOut size={14} /> Sair
          </button>
        </form>
      </header>

      <main className="px-4 sm:px-8 pb-16 max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--color-earth)' }}>
            Ativar assinatura
          </p>
          <h1 className="text-[1.9rem] sm:text-[2.2rem] font-extrabold leading-tight" style={heading}>
            {firstName ? `${firstName}, falta só o pagamento.` : 'Falta só o pagamento.'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'oklch(0.48 0.04 144)' }}>
            {statusNote[status] ?? 'Escolha seu plano e a forma de pagamento. O acesso é liberado assim que o pagamento for confirmado.'}
          </p>
        </div>

        {paid ? (
          <div className="rounded-2xl p-8 text-center" style={cardStyle}>
            <div className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.48 0.13 144 / 0.12)' }}>
              <Check size={26} style={{ color: 'var(--color-frutificar-green)' }} />
            </div>
            <h2 className="text-xl font-bold" style={heading}>Pagamento confirmado!</h2>
            <p className="mt-1 text-sm" style={{ color: 'oklch(0.48 0.04 144)' }}>Entrando na plataforma…</p>
          </div>
        ) : charge ? (
          <ChargePanel
            charge={charge}
            copied={copied}
            onCopy={copyPix}
            onChange={() => { setCharge(null); setError(null) }}
            cardStyle={cardStyle}
            heading={heading}
          />
        ) : (
          <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
            <div className="space-y-6">
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="text-sm font-bold" style={heading}>1. Plano</h2>
                  <div role="radiogroup" aria-label="Ciclo de cobrança" className="inline-flex rounded-lg p-1" style={{ background: 'oklch(0.94 0.015 144)' }}>
                    {(['MONTHLY', 'YEARLY'] as const).map((c) => (
                      <button key={c} type="button" role="radio" aria-checked={cycle === c} onClick={() => chooseCycle(c)}
                        className="px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
                        style={cycle === c ? { background: 'white', color: 'var(--color-frutificar-deep)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)' } : { color: 'oklch(0.45 0.04 144)' }}>
                        {c === 'MONTHLY' ? 'Mensal' : 'Anual'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {plans.map((p) => {
                    const active = p.name === plan
                    return (
                      <button type="button" key={p.name} onClick={() => choosePlan(p.name)}
                        className="text-left rounded-xl p-4 transition-shadow"
                        style={{
                          background: 'white',
                          border: active ? '2px solid var(--color-frutificar-green)' : '1px solid oklch(0.9 0.02 144)',
                          boxShadow: active ? '0 8px 24px oklch(0.48 0.13 144 / 0.15)' : 'none',
                        }}>
                        <span className="block text-sm font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>{planLabel[p.name]}</span>
                        <span className="block mt-1 text-lg font-extrabold tabular-nums" style={heading}>
                          {brl(cycle === 'YEARLY' ? p.yearly : p.price)}<span className="text-xs font-medium" style={{ color: 'oklch(0.55 0.03 144)' }}>{per}</span>
                        </span>
                        {cycle === 'YEARLY' && p.price * 12 > p.yearly && (
                          <span className="block mt-0.5 text-[11px] font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>
                            economize {brl(p.price * 12 - p.yearly)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {selected && selected.features.length > 0 && (
                  <ul className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {selected.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px]" style={{ color: 'oklch(0.4 0.04 144)' }}>
                        <Check size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--color-frutificar-green)' }} />{f}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="text-sm font-bold mb-3" style={heading}>2. Forma de pagamento</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {methods.map((m) => {
                    const active = m.value === method
                    const Icon = m.icon
                    return (
                      <button type="button" key={m.value} onClick={() => setMethod(m.value)}
                        className="text-left rounded-xl p-4"
                        style={{
                          background: 'white',
                          border: active ? '2px solid var(--color-frutificar-green)' : '1px solid oklch(0.9 0.02 144)',
                        }}>
                        <Icon size={18} style={{ color: active ? 'var(--color-frutificar-green)' : 'oklch(0.55 0.03 144)' }} />
                        <span className="block mt-2 text-sm font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>{m.label}</span>
                        <span className="block text-[12px]" style={{ color: 'oklch(0.55 0.03 144)' }}>{m.hint}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {needsCpf && (
                <section>
                  <label htmlFor="cpf" className="block text-sm font-bold mb-2" style={heading}>3. CPF ou CNPJ do pagador</label>
                  <input id="cpf" name="cpfCnpj" inputMode="numeric" autoComplete="off" value={cpf}
                    onChange={(e) => setCpf(maskCpfCnpj(e.target.value))} placeholder="000.000.000-00"
                    className="w-full sm:max-w-xs h-12 rounded-lg px-4 text-sm bg-white outline-none focus:ring-2"
                    style={{ border: '1px solid oklch(0.88 0.03 144)', color: 'var(--color-frutificar-deep)' }} />
                  <p className="mt-1.5 text-[12px]" style={{ color: 'oklch(0.55 0.03 144)' }}>Exigido para emitir a cobrança e a nota.</p>
                </section>
              )}
            </div>

            <aside className="rounded-2xl p-6 lg:sticky lg:top-6" style={cardStyle}>
              <h2 className="font-bold" style={heading}>Resumo</h2>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm" style={{ color: 'oklch(0.45 0.04 144)' }}>Plano {planLabel[plan]}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-frutificar-deep)' }}>{selected ? brl(fullPrice) : '—'}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm" style={{ color: 'oklch(0.45 0.04 144)' }}>Cobrança</span>
                <span className="text-sm" style={{ color: 'oklch(0.45 0.04 144)' }}>{cycle === 'YEARLY' ? 'Anual' : 'Mensal'}</span>
              </div>
              {quote?.coupon && (
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>Cupom {quote.coupon.code}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-frutificar-green)' }}>−{brl(quote.full - quote.first)}</span>
                </div>
              )}

              {/* Cupom */}
              <div className="mt-4">
                <label htmlFor="cupom" className="block text-[12px] font-semibold mb-1.5" style={{ color: 'oklch(0.45 0.04 144)' }}>Cupom de desconto</label>
                <div className="flex gap-2">
                  <input id="cupom" value={couponInput} autoComplete="off" maxLength={40}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void applyCoupon() } }}
                    placeholder="EX.: BEMVINDO10"
                    className="flex-1 min-w-0 h-10 rounded-lg px-3 text-sm bg-white outline-none focus:ring-2 uppercase"
                    style={{ border: '1px solid oklch(0.88 0.03 144)', color: 'var(--color-frutificar-deep)' }} />
                  <button type="button" onClick={() => void applyCoupon()} disabled={couponLoading || !couponInput.trim()}
                    className="shrink-0 h-10 px-3 rounded-lg text-sm font-bold disabled:opacity-50"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}>
                    {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p role="alert" className="mt-1.5 text-[12px] font-medium" style={{ color: 'oklch(0.5 0.18 27)' }}>{couponError}</p>}
              </div>
              <div className="my-4 h-px" style={{ background: 'oklch(0.92 0.01 144)' }} />
              <div className="flex items-baseline justify-between">
                <span className="font-bold" style={heading}>Hoje</span>
                <span className="text-xl font-extrabold tabular-nums" style={heading}>{selected ? brl(today) : '—'}</span>
              </div>
              {quote?.coupon && (
                <p className="mt-1 text-[12px]" style={{ color: 'oklch(0.52 0.03 144)' }}>
                  {quote.coupon.duration === 'FOREVER'
                    ? `Desconto em todas as cobranças: ${brl(quote.recurring)}${per}.`
                    : `Desconto só na 1ª cobrança; depois ${brl(quote.full)}${per}.`}
                </p>
              )}

              {error && (
                <div role="alert" className="mt-4 text-sm font-medium px-4 py-3 rounded-lg"
                  style={{ background: 'oklch(0.95 0.03 27)', color: 'oklch(0.45 0.2 27)', border: '1px solid oklch(0.88 0.06 27)' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !selected}
                className="mt-5 w-full h-12 rounded-lg text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Gerando pagamento…</> : 'Ir para o pagamento'}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: 'oklch(0.55 0.03 144)' }}>
                <ShieldCheck size={13} /> Pagamento seguro processado pelo Asaas
              </p>
            </aside>
          </form>
        )}
      </main>
    </div>
  )
}

function ChargePanel({
  charge, copied, onCopy, onChange, cardStyle, heading,
}: {
  charge: OpenCharge
  copied: boolean
  onCopy: () => void
  onChange: () => void
  cardStyle: React.CSSProperties
  heading: React.CSSProperties
}) {
  const isPix = charge.billingType === 'PIX'
  const overdue = charge.status === 'OVERDUE'
  const due = new Date(`${charge.dueDate}T12:00:00`).toLocaleDateString('pt-BR')

  return (
    <div className="rounded-2xl p-6 sm:p-8 max-w-xl" style={cardStyle}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold" style={heading}>
          {isPix ? 'Pague com Pix' : charge.billingType === 'BOLETO' ? 'Pague o boleto' : 'Pague com cartão'}
        </h2>
        <span className="text-lg font-extrabold tabular-nums" style={heading}>{brl(charge.value)}</span>
      </div>
      <p className="mt-1 text-[13px]" style={{ color: overdue ? 'oklch(0.5 0.15 40)' : 'oklch(0.52 0.03 144)' }}>
        {overdue ? `Vencida em ${due} — ainda pode ser paga.` : `Vencimento ${due}`}
      </p>

      {isPix && charge.pix ? (
        <div className="mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${charge.pix.image}`} alt="QR code Pix" width={220} height={220}
            className="mx-auto rounded-lg" style={{ border: '1px solid oklch(0.92 0.01 144)' }} />
          <p className="mt-4 text-[12px] font-semibold" style={{ color: 'oklch(0.45 0.04 144)' }}>Pix copia e cola</p>
          <div className="mt-1.5 flex gap-2">
            <input readOnly value={charge.pix.payload} onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 h-11 rounded-lg px-3 text-[12px] bg-white"
              style={{ border: '1px solid oklch(0.88 0.03 144)', color: 'oklch(0.4 0.04 144)' }} />
            <button type="button" onClick={onCopy}
              className="shrink-0 h-11 px-4 rounded-lg text-sm font-bold text-white inline-flex items-center gap-1.5"
              style={{ background: 'var(--color-frutificar-green)' }}>
              {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-sm" style={{ color: 'oklch(0.42 0.04 144)' }}>
            {charge.billingType === 'CREDIT_CARD'
              ? 'Os dados do cartão são digitados na página segura do Asaas. Nas próximas mensalidades a cobrança é automática.'
              : 'Abra a fatura para ver o boleto (ou pagar com Pix, se preferir).'}
          </p>
          {charge.invoiceUrl && (
            <a href={charge.invoiceUrl} target="_blank" rel="noopener noreferrer"
              className="mt-4 w-full h-12 rounded-lg text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 hover:opacity-90"
              style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
              {charge.billingType === 'CREDIT_CARD' ? 'Pagar com cartão' : 'Abrir boleto'} <ExternalLink size={15} />
            </a>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-[13px]" style={{ color: 'oklch(0.45 0.04 144)' }} aria-live="polite">
        <Loader2 size={14} className="animate-spin" /> Aguardando a confirmação do pagamento…
      </div>
      <p className="mt-1 text-[12px]" style={{ color: 'oklch(0.58 0.03 144)' }}>
        Pode deixar esta página aberta: entramos na plataforma automaticamente assim que o pagamento for confirmado.
      </p>

      <button type="button" onClick={onChange} className="mt-5 text-[13px] font-semibold underline underline-offset-2"
        style={{ color: 'var(--color-frutificar-forest)' }}>
        Trocar plano ou forma de pagamento
      </button>
    </div>
  )
}
