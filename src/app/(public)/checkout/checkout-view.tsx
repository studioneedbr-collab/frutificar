'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import {
  CreditCard, QrCode, FileText, Copy, Check, Loader2, ShieldCheck, Clock, ExternalLink,
} from 'lucide-react'
import { FrutificarLogo } from '@/components/shared/logo'
import { tokenizeCard, payWithCard, getCharge } from '@/server/actions/checkout'

/* ── Design tokens (mesmos do resto do app) ──────────────────────────── */
const T = {
  deep: 'oklch(0.24 0.09 144)',
  green: 'oklch(0.48 0.13 144)',
  forest: 'oklch(0.36 0.11 144)',
  bright: 'oklch(0.67 0.18 144)',
  earth: 'oklch(0.62 0.12 55)',
  night: 'oklch(0.16 0.07 152)',
  muted: 'oklch(0.55 0.04 144)',
  border: 'oklch(0.91 0.01 144)',
  lightBg: 'oklch(0.98 0.008 144)',
  parchment: 'oklch(0.97 0.015 80)',
  danger: 'oklch(0.45 0.2 27)',
  dangerBg: 'oklch(0.95 0.03 27)',
  dangerBorder: 'oklch(0.88 0.06 27)',
  heading: 'var(--font-heading)',
} as const

const INPUT_CLASS = 'w-full h-12 bg-white rounded-lg text-sm px-3.5 outline-none transition-colors focus:ring-2'
const INPUT_STYLE = {
  border: `1px solid ${T.border}`,
  color: T.deep,
} as const

type Tab = 'CARTAO' | 'PIX' | 'BOLETO'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

/* ── Hook: fica de olho no status real da assinatura (DB) e redireciona ──
   quando o webhook do Asaas ativa a assinatura. A sessão JWT só é atualizada
   no sign-in, então pollamos a verdade do banco via /api/checkout/status e,
   ao detectar ativação, forçamos um refresh do JWT com update() antes de
   navegar — senão o middleware ainda veria o plano antigo (null) e
   devolveria o usuário para o checkout. */
function useActivationPoll(active: boolean) {
  const { update } = useSession()
  useEffect(() => {
    if (!active) return
    let redirected = false
    const interval = setInterval(async () => {
      if (redirected) return
      try {
        const res = await fetch('/api/checkout/status', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (data?.active) {
          redirected = true
          clearInterval(interval)
          await update()
          window.location.href = '/dashboard'
        }
      } catch {
        // rede instável — tenta de novo no próximo tick
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [active, update])
}

/* ── Página ───────────────────────────────────────────────────────────── */
export function CheckoutView({
  planName,
  price,
  configured,
}: {
  planName: string
  price: number
  configured: boolean
}) {
  const [tab, setTab] = useState<Tab>('CARTAO')
  const [waitingConfirmation, setWaitingConfirmation] = useState(false)

  useActivationPoll(waitingConfirmation)

  const tabs: { id: Tab; label: string; icon: typeof CreditCard }[] = [
    { id: 'CARTAO', label: 'Cartão', icon: CreditCard },
    { id: 'PIX', label: 'PIX', icon: QrCode },
    { id: 'BOLETO', label: 'Boleto', icon: FileText },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.parchment }}>
      {/* Nav topo */}
      <div className="flex items-center justify-between px-5 sm:px-8 py-5">
        <FrutificarLogo size={22} />
        <div
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase"
          style={{ color: T.muted }}
        >
          <ShieldCheck size={14} strokeWidth={2.5} style={{ color: T.green }} />
          Pagamento seguro
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 pb-16 w-full">
        <div className="w-full max-w-md mx-auto">
          {/* Header do plano */}
          <div
            className="rounded-2xl p-6 mb-5 text-white relative overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse 90% 70% at 100% 0%, oklch(0.62 0.12 55 / 0.16) 0%, transparent 60%),
                linear-gradient(150deg, ${T.night} 0%, ${T.deep} 100%)
              `,
            }}
          >
            <p
              className="text-[11px] font-bold tracking-[0.2em] uppercase mb-2"
              style={{ color: T.earth }}
            >
              Plano selecionado
            </p>
            <div className="flex items-end justify-between gap-3">
              <h1
                style={{
                  fontFamily: T.heading,
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                {planName}
              </h1>
              <p className="text-right">
                <span style={{ fontFamily: T.heading, fontSize: '1.3rem', fontWeight: 800 }}>
                  {brl(price)}
                </span>
                <span className="block text-[11px]" style={{ color: 'oklch(0.8 0.04 144)' }}>
                  por mês
                </span>
              </p>
            </div>
          </div>

          {!configured ? (
            <NotConfiguredNotice />
          ) : (
            <>
              {/* Tab switcher */}
              <div
                className="grid grid-cols-3 gap-1 p-1 rounded-xl mb-5"
                style={{ background: 'oklch(0.94 0.015 144)' }}
                role="tablist"
                aria-label="Forma de pagamento"
              >
                {tabs.map(({ id, label, icon: Icon }) => {
                  const active = tab === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(id)}
                      className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-bold transition-all"
                      style={{
                        background: active ? '#fff' : 'transparent',
                        color: active ? T.forest : T.muted,
                        boxShadow: active ? '0 1px 3px oklch(0 0 0 / 0.08)' : 'none',
                      }}
                    >
                      <Icon size={15} strokeWidth={2.5} />
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: `1px solid ${T.border}` }}>
                <div style={{ display: tab === 'CARTAO' ? 'block' : 'none' }}>
                  <CardTab
                    price={price}
                    onProcessing={setWaitingConfirmation}
                    processing={waitingConfirmation}
                  />
                </div>
                <div style={{ display: tab === 'PIX' ? 'block' : 'none' }}>
                  <PixTab onGenerated={() => setWaitingConfirmation(true)} />
                </div>
                <div style={{ display: tab === 'BOLETO' ? 'block' : 'none' }}>
                  <BoletoTab onGenerated={() => setWaitingConfirmation(true)} />
                </div>
              </div>
            </>
          )}

          <p className="text-center text-[11px] mt-6" style={{ color: T.muted }}>
            © 2026 Frutificar Digital · pagamento processado via Asaas
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Aviso: gateway ainda não configurado ────────────────────────────── */
function NotConfiguredNotice() {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: '#fff', border: `1px solid ${T.border}` }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'oklch(0.62 0.12 55 / 0.12)' }}
      >
        <Clock size={26} style={{ color: T.earth }} />
      </div>
      <h2
        className="mb-2"
        style={{ fontFamily: T.heading, fontSize: '1.15rem', fontWeight: 800, color: T.deep }}
      >
        Pagamentos em configuração
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
        Em breve você poderá assinar diretamente por aqui. Volte logo — estamos quase lá!
      </p>
    </div>
  )
}

/* ── Cartão ───────────────────────────────────────────────────────────── */
function CardTab({
  price,
  onProcessing,
  processing,
}: {
  price: number
  onProcessing: (v: boolean) => void
  processing: boolean
}) {
  const [form, setForm] = useState({
    number: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    postalCode: '',
    addressNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function digits(v: string) {
    return v.replace(/\D/g, '')
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const tokenResult = await tokenizeCard({
      number: form.number,
      holderName: form.holderName,
      expiryMonth: form.expiryMonth,
      expiryYear: form.expiryYear,
      ccv: form.ccv,
      postalCode: form.postalCode,
      addressNumber: form.addressNumber,
    })

    if (!tokenResult.ok) {
      setLoading(false)
      setError(tokenResult.error)
      return
    }

    const payResult = await payWithCard(tokenResult.data.token)
    if (!payResult.ok) {
      setLoading(false)
      setError(payResult.error)
      return
    }

    setLoading(false)
    onProcessing(true)
  }

  if (processing) {
    return <ProcessingState label="Pagamento em processamento — aguarde a confirmação." />
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Formulário de pagamento com cartão">
      <Field label="Número do cartão" htmlFor="card-number">
        <input
          id="card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          value={form.number}
          onChange={(e) => set('number', digits(e.target.value))}
          required
          className={INPUT_CLASS}
          style={INPUT_STYLE}
        />
      </Field>

      <Field label="Nome impresso no cartão" htmlFor="card-holder">
        <input
          id="card-holder"
          autoComplete="cc-name"
          placeholder="Como está no cartão"
          value={form.holderName}
          onChange={(e) => set('holderName', e.target.value)}
          required
          className={INPUT_CLASS}
          style={INPUT_STYLE}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Mês" htmlFor="card-month">
          <input
            id="card-month"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder="MM"
            maxLength={2}
            value={form.expiryMonth}
            onChange={(e) => set('expiryMonth', digits(e.target.value))}
            required
            className={INPUT_CLASS}
          style={INPUT_STYLE}
          />
        </Field>
        <Field label="Ano" htmlFor="card-year">
          <input
            id="card-year"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder="AAAA"
            maxLength={4}
            value={form.expiryYear}
            onChange={(e) => set('expiryYear', digits(e.target.value))}
            required
            className={INPUT_CLASS}
          style={INPUT_STYLE}
          />
        </Field>
        <Field label="CCV" htmlFor="card-ccv">
          <input
            id="card-ccv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="000"
            maxLength={4}
            value={form.ccv}
            onChange={(e) => set('ccv', digits(e.target.value))}
            required
            className={INPUT_CLASS}
          style={INPUT_STYLE}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="CEP" htmlFor="card-cep">
          <input
            id="card-cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            maxLength={9}
            value={form.postalCode}
            onChange={(e) => set('postalCode', digits(e.target.value))}
            required
            className={INPUT_CLASS}
          style={INPUT_STYLE}
          />
        </Field>
        <Field label="Número" htmlFor="card-address-number">
          <input
            id="card-address-number"
            inputMode="numeric"
            placeholder="123"
            value={form.addressNumber}
            onChange={(e) => set('addressNumber', digits(e.target.value))}
            required
            className={INPUT_CLASS}
          style={INPUT_STYLE}
          />
        </Field>
      </div>

      {error && <ErrorBanner message={error} />}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 text-white font-bold text-[15px] rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{
          background: `linear-gradient(130deg, ${T.night} 0%, ${T.forest} 100%)`,
        }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Processando...' : `Pagar ${brl(price)}`}
      </button>
    </form>
  )
}

/* ── PIX ──────────────────────────────────────────────────────────────── */
function PixTab({ onGenerated }: { onGenerated: () => void }) {
  const [data, setData] = useState<{ image: string; payload: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fetchedRef = useRef(false)

  async function generate() {
    setLoading(true)
    setError(null)
    const result = await getCharge('PIX')
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (!result.data.pixQr) {
      setError('QR Code indisponível no momento. Tente novamente.')
      return
    }
    setData(result.data.pixQr)
    onGenerated()
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function copyPayload() {
    if (!data) return
    await navigator.clipboard.writeText(data.payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !data) {
    return <ProcessingState label="Gerando QR Code do PIX..." />
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error} />
        <button
          type="button"
          onClick={generate}
          className="w-full h-11 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: T.lightBg, color: T.forest, border: `1px solid ${T.border}` }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="rounded-xl p-3 mb-4"
        style={{ background: T.lightBg, border: `1px solid ${T.border}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${data.image}`}
          alt="QR Code para pagamento via PIX"
          width={220}
          height={220}
          className="rounded-lg"
        />
      </div>

      <p className="text-sm font-semibold mb-2" style={{ color: T.deep }}>
        Escaneie com o app do seu banco
      </p>
      <p className="text-xs mb-4" style={{ color: T.muted }}>
        Ou copie o código PIX (copia e cola) abaixo
      </p>

      <button
        type="button"
        onClick={copyPayload}
        aria-label="Copiar código PIX"
        className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 mb-4 text-left"
        style={{ background: T.lightBg, border: `1px solid ${T.border}` }}
      >
        <span
          className="text-xs truncate font-mono"
          style={{ color: T.muted }}
        >
          {data.payload}
        </span>
        {copied ? (
          <Check size={16} style={{ color: T.green }} className="shrink-0" />
        ) : (
          <Copy size={16} style={{ color: T.forest }} className="shrink-0" />
        )}
      </button>

      <div
        className="w-full rounded-lg px-4 py-3 text-xs flex items-start gap-2"
        style={{ background: 'oklch(0.36 0.11 144 / 0.08)', color: T.forest }}
      >
        <ShieldCheck size={15} className="shrink-0 mt-0.5" />
        Após pagar, seu acesso é liberado automaticamente.
      </div>
    </div>
  )
}

/* ── Boleto ───────────────────────────────────────────────────────────── */
function BoletoTab({ onGenerated }: { onGenerated: () => void }) {
  const [data, setData] = useState<{ url: string; line: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fetchedRef = useRef(false)

  async function generate() {
    setLoading(true)
    setError(null)
    const result = await getCharge('BOLETO')
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (!result.data.boleto) {
      setError('Boleto indisponível no momento. Tente novamente.')
      return
    }
    setData(result.data.boleto)
    onGenerated()
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function copyLine() {
    if (!data) return
    await navigator.clipboard.writeText(data.line)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !data) {
    return <ProcessingState label="Gerando boleto..." />
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error} />
        <button
          type="button"
          onClick={generate}
          className="w-full h-11 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: T.lightBg, color: T.forest, border: `1px solid ${T.border}` }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'oklch(0.36 0.11 144 / 0.1)' }}
      >
        <FileText size={26} style={{ color: T.forest }} />
      </div>

      <p className="text-sm font-semibold mb-1" style={{ color: T.deep }}>
        Boleto gerado com sucesso
      </p>
      <p className="text-xs mb-4" style={{ color: T.muted }}>
        Copie a linha digitável ou abra o PDF para pagar
      </p>

      <button
        type="button"
        onClick={copyLine}
        aria-label="Copiar linha digitável do boleto"
        className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 mb-3 text-left"
        style={{ background: T.lightBg, border: `1px solid ${T.border}` }}
      >
        <span className="text-xs truncate font-mono" style={{ color: T.muted }}>
          {data.line}
        </span>
        {copied ? (
          <Check size={16} style={{ color: T.green }} className="shrink-0" />
        ) : (
          <Copy size={16} style={{ color: T.forest }} className="shrink-0" />
        )}
      </button>

      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 h-12 text-white font-bold text-[15px] rounded-lg mb-4 transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(130deg, ${T.night} 0%, ${T.forest} 100%)` }}
        >
          <ExternalLink size={16} />
          Abrir boleto em PDF
        </a>
      )}

      <div
        className="w-full rounded-lg px-4 py-3 text-xs flex items-start gap-2"
        style={{ background: 'oklch(0.36 0.11 144 / 0.08)', color: T.forest }}
      >
        <ShieldCheck size={15} className="shrink-0 mt-0.5" />
        Após a compensação, seu acesso é liberado automaticamente (pode levar até 3 dias úteis).
      </div>
    </div>
  )
}

/* ── Subcomponentes utilitários ───────────────────────────────────────── */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold mb-1.5"
        style={{ color: 'oklch(0.32 0.05 144)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="text-sm font-medium px-4 py-3 rounded-lg"
      style={{ background: T.dangerBg, color: T.danger, border: `1px solid ${T.dangerBorder}` }}
      role="alert"
    >
      {message}
    </div>
  )
}

function ProcessingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'oklch(0.36 0.11 144 / 0.1)' }}
      >
        <Loader2 size={26} className="animate-spin" style={{ color: T.forest }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: T.deep }}>
        {label}
      </p>
    </div>
  )
}
