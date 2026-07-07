'use client'

import { useState } from 'react'
import { Save, Shield, Bell, Globe, Database, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { SelectField } from '@/components/ui/field-controls'

/* ── Toggle switch (padrão de perfil/page.tsx) ── */
function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-pressed={on}
      aria-label={label}
      onClick={onChange}
      className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
      style={{ background: on ? 'var(--color-frutificar-green)' : 'oklch(0.85 0.01 144)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)', boxShadow: '0 1px 3px oklch(0.16 0.07 152 / 0.3)' }}
      />
    </button>
  )
}

/* ── Opções de dropdowns ── */
const sessionOptions = [
  { value: '7 dias', label: '7 dias' },
  { value: '15 dias', label: '15 dias' },
  { value: '30 dias', label: '30 dias' },
  { value: '90 dias', label: '90 dias' },
]
const emailProviderOptions = [
  { value: 'Resend', label: 'Resend' },
  { value: 'SendGrid', label: 'SendGrid' },
  { value: 'Amazon SES', label: 'Amazon SES' },
  { value: 'Postmark', label: 'Postmark' },
]
const regionOptions = [
  { value: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
  { value: 'us-west-2', label: 'us-west-2 (Oregon)' },
  { value: 'sa-east-1', label: 'sa-east-1 (São Paulo)' },
  { value: 'eu-west-1', label: 'eu-west-1 (Irlanda)' },
]
const gatewayOptions = [
  { value: 'Asaas', label: 'Asaas' },
  { value: 'Stripe', label: 'Stripe' },
  { value: 'Mercado Pago', label: 'Mercado Pago' },
  { value: 'Pagar.me', label: 'Pagar.me' },
]
const aiModelOptions = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  { value: 'gpt-4o', label: 'gpt-4o' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
  { value: 'o4-mini', label: 'o4-mini' },
]

/* ── Estilos de input (padrão dos modais de cursos) ── */
const inputClass = 'px-3 py-2 rounded-lg text-sm border w-full outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const inputStyle: React.CSSProperties = {
  borderColor: 'oklch(0.88 0.03 144)',
  background: 'oklch(0.98 0.005 144)',
  color: 'var(--color-frutificar-deep)',
}

const cardStyle: React.CSSProperties = { background: 'white', border: '1px solid oklch(0.91 0.01 144)' }
const headerBorder: React.CSSProperties = { borderColor: 'oklch(0.93 0.005 144)' }
const iconBoxStyle: React.CSSProperties = { background: 'oklch(0.48 0.13 144 / 0.08)' }
const labelStyle: React.CSSProperties = { color: 'oklch(0.42 0.04 144)' }
const descStyle: React.CSSProperties = { color: 'oklch(0.58 0.03 144)' }
const saveBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)',
}

/* ── Linha de campo (label à esquerda, controle à direita) ── */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
      <label className="text-sm font-medium" style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

/* ── Linha de toggle (label + descrição à esquerda, switch à direita) ── */
function ToggleRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
      <div>
        <div className="text-sm font-medium" style={labelStyle}>{label}</div>
        <div className="text-xs mt-0.5" style={descStyle}>{desc}</div>
      </div>
      <div className="flex justify-start">
        <Toggle on={on} onChange={onChange} label={label} />
      </div>
    </div>
  )
}

/* ── Cabeçalho de seção ── */
function SectionCard({
  icon: Icon, label, children, onSave,
}: {
  icon: typeof Globe
  label: string
  children: React.ReactNode
  onSave: () => void
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={cardStyle}>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={headerBorder}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={iconBoxStyle}>
          <Icon size={15} style={{ color: 'var(--color-frutificar-green)' }} />
        </div>
        <h2 className="font-bold text-[14px]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>
          {label}
        </h2>
      </div>
      <div className="p-5 space-y-4">
        {children}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-85 transition-opacity"
            style={saveBtnStyle}
          >
            <Save size={13} /> Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminConfiguracoesPage() {
  /* Plataforma */
  const [platformName, setPlatformName] = useState('Frutificar Digital')
  const [baseUrl, setBaseUrl] = useState('https://frutificar.com.br')
  const [supportEmail, setSupportEmail] = useState('suporte@frutificar.com.br')
  const [chatLimit, setChatLimit] = useState('30')
  const [maintenance, setMaintenance] = useState(false)

  /* Segurança */
  const [sessionExpiry, setSessionExpiry] = useState('30 dias')
  const [loginAttempts, setLoginAttempts] = useState('5')
  const [bcryptCost, setBcryptCost] = useState('12')
  const [twoFactor, setTwoFactor] = useState(true)

  /* Notificações */
  const [emailProvider, setEmailProvider] = useState('Resend')
  const [senderEmail, setSenderEmail] = useState('noreply@frutificar.com.br')
  const [notifyLives, setNotifyLives] = useState(true)
  const [notifyCourses, setNotifyCourses] = useState(true)

  /* Armazenamento */
  const [s3Bucket, setS3Bucket] = useState('frutificar-prod')
  const [awsRegion, setAwsRegion] = useState('us-east-1')

  /* Integrações */
  const [gateway, setGateway] = useState('Asaas')
  const [aiModel, setAiModel] = useState('gpt-4o-mini')
  const [youtubeEnabled, setYoutubeEnabled] = useState(true)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Configurações</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Configurações globais da plataforma</p>
        </div>
        <button
          type="button"
          onClick={() => toast.success('Configurações salvas')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85"
          style={saveBtnStyle}
        >
          <Save size={15} /> Salvar alterações
        </button>
      </div>

      <div className="space-y-4">
        {/* ── Plataforma ── */}
        <SectionCard icon={Globe} label="Plataforma" onSave={() => toast.success('Configurações salvas')}>
          <Row label="Nome da plataforma">
            <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <Row label="URL base">
            <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <Row label="Suporte e-mail">
            <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <Row label="Limite de chat (msg/hora)">
            <input type="number" value={chatLimit} onChange={(e) => setChatLimit(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <ToggleRow
            label="Modo de manutenção"
            desc="Exibe uma página de manutenção para os produtores"
            on={maintenance}
            onChange={() => { setMaintenance((v) => { const next = !v; toast.success(next ? 'Modo de manutenção ativado' : 'Modo de manutenção desativado'); return next }) }}
          />
        </SectionCard>

        {/* ── Segurança ── */}
        <SectionCard icon={Shield} label="Segurança" onSave={() => toast.success('Configurações salvas')}>
          <Row label="Sessão JWT expira em">
            <SelectField id="session-expiry" value={sessionExpiry} onValueChange={setSessionExpiry} options={sessionOptions} placeholder="Selecione" />
          </Row>
          <Row label="Tentativas de login">
            <input type="number" value={loginAttempts} onChange={(e) => setLoginAttempts(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <Row label="Bcrypt cost factor">
            <input type="number" value={bcryptCost} onChange={(e) => setBcryptCost(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <ToggleRow
            label="Autenticação em dois fatores"
            desc="Exige 2FA para contas administrativas"
            on={twoFactor}
            onChange={() => { setTwoFactor((v) => { const next = !v; toast.success(next ? '2FA ativado' : '2FA desativado'); return next }) }}
          />
        </SectionCard>

        {/* ── Notificações ── */}
        <SectionCard icon={Bell} label="Notificações" onSave={() => toast.success('Configurações salvas')}>
          <Row label="Provedor de e-mail">
            <SelectField id="email-provider" value={emailProvider} onValueChange={setEmailProvider} options={emailProviderOptions} placeholder="Selecione" />
          </Row>
          <Row label="E-mail remetente">
            <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <ToggleRow
            label="Avisar sobre lives"
            desc="Dispara e-mail quando uma transmissão começar"
            on={notifyLives}
            onChange={() => setNotifyLives((v) => !v)}
          />
          <ToggleRow
            label="Avisar sobre novos cursos"
            desc="Dispara e-mail no lançamento de cursos e módulos"
            on={notifyCourses}
            onChange={() => setNotifyCourses((v) => !v)}
          />
        </SectionCard>

        {/* ── Armazenamento ── */}
        <SectionCard icon={Database} label="Armazenamento" onSave={() => toast.success('Configurações salvas')}>
          <Row label="Bucket S3">
            <input type="text" value={s3Bucket} onChange={(e) => setS3Bucket(e.target.value)} className={inputClass} style={inputStyle} />
          </Row>
          <Row label="Região AWS">
            <SelectField id="aws-region" value={awsRegion} onValueChange={setAwsRegion} options={regionOptions} placeholder="Selecione" />
          </Row>
        </SectionCard>

        {/* ── Integrações ── */}
        <SectionCard icon={Mail} label="Integrações" onSave={() => toast.success('Configurações salvas')}>
          <Row label="Gateway de pagamento">
            <SelectField id="gateway" value={gateway} onValueChange={setGateway} options={gatewayOptions} placeholder="Selecione" />
          </Row>
          <Row label="Modelo IA (chat)">
            <SelectField id="ai-model" value={aiModel} onValueChange={setAiModel} options={aiModelOptions} placeholder="Selecione" />
          </Row>
          <ToggleRow
            label="YouTube Data API"
            desc="Sincroniza vídeos e lives a partir do YouTube"
            on={youtubeEnabled}
            onChange={() => { setYoutubeEnabled((v) => { const next = !v; toast.success(next ? 'YouTube Data API ativada' : 'YouTube Data API desativada'); return next }) }}
          />
        </SectionCard>
      </div>
    </div>
  )
}
