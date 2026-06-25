'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Camera, Mail, Phone, MapPin, Sprout, User, Bell, Radio, BookOpen,
  Microscope, Calendar, KeyRound, Monitor, CreditCard, ArrowRight, Check,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

const modalInputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}

/* DEV PREVIEW — sem banco. Dados mock de um produtor Gold. */
const user = {
  name: 'Douglas Vargas',
  email: 'douglas@fazendasantaclara.com.br',
  phone: '(34) 99812-3344',
  city: 'Patrocínio/MG',
  property: 'Fazenda Santa Clara',
  cultura: 'Café arábica',
  plan: 'GOLD',
  since: 'Membro desde mar/2025',
  initials: 'DV',
}

const fields = [
  { label: 'Nome completo', icon: User, value: user.name, type: 'text' },
  { label: 'E-mail', icon: Mail, value: user.email, type: 'email' },
  { label: 'Telefone', icon: Phone, value: user.phone, type: 'tel' },
  { label: 'Cidade/UF', icon: MapPin, value: user.city, type: 'text' },
  { label: 'Nome da propriedade', icon: Sprout, value: user.property, type: 'text' },
  { label: 'Cultura principal', icon: Sprout, value: user.cultura, type: 'text' },
]

const notifications = [
  { key: 'lives', icon: Radio, label: 'Lives ao vivo', desc: 'Avisos quando uma transmissão começar', on: true },
  { key: 'cursos', icon: BookOpen, label: 'Novos cursos', desc: 'Lançamentos e módulos liberados', on: true },
  { key: 'diag', icon: Microscope, label: 'Resultados de diagnóstico', desc: 'Quando uma análise estiver pronta', on: true },
  { key: 'emails', icon: Mail, label: 'Novidades e e-mails', desc: 'Conteúdos e comunicados por e-mail', on: false },
  { key: 'lembretes', icon: Calendar, label: 'Lembretes de agendamento', desc: 'Visitas técnicas e dias de campo', on: true },
]

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

export default function PerfilPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notifications.map((n) => [n.key, n.on])),
  )

  const toggle = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  /* ── Foto de perfil ── */
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<string | null>(null)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(URL.createObjectURL(file))
    toast.success('Foto atualizada', { description: 'Sua nova foto de perfil foi aplicada.' })
    e.target.value = ''
  }

  /* ── Dados pessoais ── */
  function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    toast.success('Dados salvos', { description: 'Suas informações foram atualizadas.' })
  }

  /* ── Alterar senha ── */
  const [passwordOpen, setPasswordOpen] = useState(false)

  function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const nova = String(data.get('nova') ?? '')
    const confirmar = String(data.get('confirmar') ?? '')
    if (nova !== confirmar) {
      toast.error('As senhas não coincidem')
      return
    }
    setPasswordOpen(false)
    toast.success('Senha alterada', { description: 'Use a nova senha no próximo login.' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        .profile-input { outline: none; transition: border-color .2s, box-shadow .2s; }
        .profile-input:focus {
          border-color: var(--color-frutificar-green) !important;
          box-shadow: 0 0 0 3px oklch(0.48 0.13 144 / 0.12);
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim" style={{ animationDelay: '0.02s' }}>
        <div className="text-xs font-bold tracking-widest" style={{ color: 'var(--color-earth)' }}>CONTA</div>
        <h1
          className="text-2xl md:text-3xl font-bold mt-1"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Meu Perfil
        </h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>
          Gerencie seus dados, preferências e segurança.
        </p>
      </header>

      {/* ── Profile header card ── */}
      <section
        className="dash-anim rounded-2xl bg-white p-6"
        style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.08s' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden"
            style={{
              background: 'linear-gradient(140deg, var(--color-frutificar-green), var(--color-frutificar-forest))',
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 10px 28px oklch(0.48 0.13 144 / 0.35)',
            }}
          >
            {avatar ? (
              <img src={avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              user.initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              {user.name}
            </h2>
            <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
              <Mail size={13} /> {user.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: 'oklch(0.78 0.17 75 / 0.14)',
                  color: 'oklch(0.55 0.14 75)',
                  border: '1px solid oklch(0.78 0.17 75 / 0.4)',
                }}
              >
                <Sprout size={11} /> PLANO {user.plan}
              </span>
              <span className="text-xs" style={{ color: 'oklch(0.6 0.03 144)' }}>{user.since}</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shrink-0 transition-opacity hover:opacity-85"
            style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
          >
            <Camera size={15} /> Alterar foto
          </button>
        </div>
      </section>

      {/* ── Dados pessoais ── */}
      <section
        className="dash-anim rounded-2xl bg-white p-6"
        style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.14s' }}
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <User size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Dados pessoais
        </h2>

        <form onSubmit={handleSaveProfile}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label}>
                <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>
                  <Icon size={13} style={{ color: 'oklch(0.55 0.04 144)' }} /> {f.label}
                </label>
                <input
                  type={f.type}
                  defaultValue={f.value}
                  className="profile-input w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ border: '1px solid oklch(0.91 0.01 144)', color: 'var(--color-frutificar-deep)', background: 'oklch(0.99 0.005 144)' }}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
          >
            <Check size={16} /> Salvar alterações
          </button>
        </div>
        </form>
      </section>

      {/* ── Notificações ── */}
      <section
        className="dash-anim rounded-2xl bg-white p-6"
        style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.2s' }}
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Bell size={18} style={{ color: 'var(--color-earth)' }} /> Notificações
        </h2>

        <div className="space-y-1">
          {notifications.map((n, i) => {
            const Icon = n.icon
            return (
              <div
                key={n.key}
                className="flex items-center gap-3 py-3"
                style={i > 0 ? { borderTop: '1px solid oklch(0.94 0.008 144)' } : undefined}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                  <Icon size={17} style={{ color: 'var(--color-frutificar-green)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{n.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{n.desc}</div>
                </div>
                <Toggle on={!!prefs[n.key]} onChange={() => toggle(n.key)} label={n.label} />
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Segurança ── */}
      <section
        className="dash-anim rounded-2xl bg-white p-6"
        style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.26s' }}
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <KeyRound size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Segurança
        </h2>

        {/* Alterar senha */}
        <div className="flex items-center gap-3 py-4" style={{ borderTop: '1px solid oklch(0.94 0.008 144)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <KeyRound size={17} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>Alterar senha</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>Atualize sua senha de acesso</div>
          </div>
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl font-semibold text-sm shrink-0 transition-opacity hover:opacity-85"
            style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
          >
            Alterar
          </button>
        </div>

        {/* Sessões ativas */}
        <div className="flex items-center gap-3 py-4" style={{ borderTop: '1px solid oklch(0.94 0.008 144)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <Monitor size={17} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>Sessões ativas</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>1 dispositivo conectado</div>
          </div>
        </div>

        {/* Gerenciar assinatura */}
        <Link
          href="/perfil/assinatura"
          className="flex items-center gap-3 py-4 -mb-2 transition-opacity hover:opacity-80"
          style={{ borderTop: '1px solid oklch(0.94 0.008 144)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.78 0.17 75 / 0.16)' }}>
            <CreditCard size={17} style={{ color: 'oklch(0.55 0.14 75)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>Gerenciar assinatura</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>Plano {user.plan} · pagamento e faturas</div>
          </div>
          <ArrowRight size={16} style={{ color: 'oklch(0.7 0.02 144)' }} />
        </Link>
      </section>

      {/* ── Modal: Alterar senha ── */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <KeyRound size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Alterar senha
            </DialogTitle>
            <DialogDescription>Defina uma nova senha de acesso à sua conta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Senha atual</label>
              <input name="atual" type="password" placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={modalInputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Nova senha</label>
              <input name="nova" type="password" placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={modalInputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Confirmar nova senha</label>
              <input name="confirmar" type="password" placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={modalInputStyle} />
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setPasswordOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                Alterar senha
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
