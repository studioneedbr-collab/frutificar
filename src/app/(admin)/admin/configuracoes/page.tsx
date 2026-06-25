import { Save, Shield, Bell, Globe, Database, Mail } from 'lucide-react'

const sections = [
  {
    icon: Globe, label: 'Plataforma',
    fields: [
      { label: 'Nome da plataforma', value: 'Frutificar Digital', type: 'text' },
      { label: 'URL base', value: 'https://frutificar.com.br', type: 'text' },
      { label: 'Suporte e-mail', value: 'suporte@frutificar.com.br', type: 'email' },
      { label: 'Limite de chat (msg/hora)', value: '30', type: 'number' },
    ],
  },
  {
    icon: Shield, label: 'Segurança',
    fields: [
      { label: 'Sessão JWT expira em', value: '30 dias', type: 'text' },
      { label: 'Tentativas de login', value: '5', type: 'number' },
      { label: 'Bcrypt cost factor', value: '12', type: 'number' },
    ],
  },
  {
    icon: Bell, label: 'Notificações',
    fields: [
      { label: 'Provedor de e-mail', value: 'Resend', type: 'text' },
      { label: 'E-mail remetente', value: 'noreply@frutificar.com.br', type: 'email' },
    ],
  },
  {
    icon: Database, label: 'Armazenamento',
    fields: [
      { label: 'Bucket S3', value: 'frutificar-prod', type: 'text' },
      { label: 'Região AWS', value: 'us-east-1', type: 'text' },
    ],
  },
  {
    icon: Mail, label: 'Integrações',
    fields: [
      { label: 'Gateway de pagamento', value: 'Asaas', type: 'text' },
      { label: 'Modelo IA (chat)', value: 'gpt-4o-mini', type: 'text' },
      { label: 'YouTube Data API', value: 'Configurada ✓', type: 'text' },
    ],
  },
]

export default function AdminConfiguracoesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Configurações</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Configurações globais da plataforma</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Save size={15} /> Salvar alterações
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((sec) => {
          const Icon = sec.icon
          return (
            <div key={sec.label} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.005 144)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                  <Icon size={15} style={{ color: 'var(--color-frutificar-green)' }} />
                </div>
                <h2 className="font-bold text-[14px]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>
                  {sec.label}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {sec.fields.map((f) => (
                  <div key={f.label} className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                    <label className="text-sm font-medium" style={{ color: 'oklch(0.42 0.04 144)' }}>{f.label}</label>
                    <input
                      type={f.type}
                      defaultValue={f.value}
                      className="px-3 py-2 rounded-lg text-sm border w-full"
                      style={{
                        borderColor: 'oklch(0.88 0.03 144)',
                        background: 'oklch(0.98 0.005 144)',
                        color: 'var(--color-frutificar-deep)',
                        outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
