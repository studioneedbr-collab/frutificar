import { MoreHorizontal, Plus, Search, Circle } from 'lucide-react'

const users = [
  { name: 'João Carlos Silva',     email: 'joao@exemplo.com',     plan: 'GOLD',      status: 'ACTIVE',   role: 'STUDENT',    joined: '12 jun 2026' },
  { name: 'Maria Aparecida Costa', email: 'maria@exemplo.com',    plan: 'PREMIUM',   status: 'ACTIVE',   role: 'STUDENT',    joined: '11 jun 2026' },
  { name: 'Pedro Henrique Souza',  email: 'pedro@exemplo.com',    plan: 'ESSENCIAL', status: 'ACTIVE',   role: 'STUDENT',    joined: '10 jun 2026' },
  { name: 'Ana Beatriz Lima',      email: 'ana@exemplo.com',      plan: 'GOLD',      status: 'PAST_DUE', role: 'STUDENT',    joined: '09 jun 2026' },
  { name: 'Carlos Eduardo Rocha',  email: 'carlos@exemplo.com',   plan: 'PREMIUM',   status: 'ACTIVE',   role: 'STUDENT',    joined: '08 jun 2026' },
  { name: 'Fernanda Oliveira',     email: 'fernanda@exemplo.com', plan: 'ESSENCIAL', status: 'CANCELED', role: 'STUDENT',    joined: '07 jun 2026' },
  { name: 'Roberto Santos Neto',   email: 'roberto@exemplo.com',  plan: 'GOLD',      status: 'ACTIVE',   role: 'STUDENT',    joined: '06 jun 2026' },
  { name: 'Luciana Ferreira',      email: 'luciana@exemplo.com',  plan: 'PREMIUM',   status: 'ACTIVE',   role: 'INSTRUCTOR', joined: '05 jun 2026' },
  { name: 'Douglas Vargas Garcia', email: 'admin@frutificar.com', plan: 'GOLD',      status: 'ACTIVE',   role: 'ADMIN',      joined: '01 jan 2026' },
  { name: 'Marcos Antônio Prado',  email: 'marcos@exemplo.com',   plan: 'ESSENCIAL', status: 'ACTIVE',   role: 'STUDENT',    joined: '04 jun 2026' },
]

const planStyle: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}
const statusStyle: Record<string, { dot: string; label: string; text: string }> = {
  ACTIVE:   { dot: 'oklch(0.55 0.14 144)', label: 'Ativo',        text: 'oklch(0.38 0.1 144)' },
  PAST_DUE: { dot: 'oklch(0.7 0.15 55)',   label: 'Inadimplente', text: 'oklch(0.5 0.12 55)' },
  CANCELED: { dot: 'oklch(0.6 0.1 27)',    label: 'Cancelado',    text: 'oklch(0.45 0.1 27)' },
}
const roleStyle: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN:      { bg: 'oklch(0.48 0.13 144 / 0.12)', text: 'oklch(0.36 0.1 144)',  label: 'Admin' },
  INSTRUCTOR: { bg: 'oklch(0.55 0.1 220 / 0.12)',  text: 'oklch(0.4 0.1 220)',   label: 'Instrutor' },
  STUDENT:    { bg: 'oklch(0.94 0.01 144)',         text: 'oklch(0.52 0.04 144)', label: 'Aluno' },
}

export default function AdminUsuariosPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Usuários</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{users.length} usuários cadastrados</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo usuário
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-xs"
          style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
          <Search size={14} style={{ color: 'oklch(0.58 0.03 144)' }} />
          <span className="text-sm" style={{ color: 'oklch(0.65 0.02 144)' }}>Buscar usuário...</span>
        </div>
        {['Todos', 'Ativos', 'Inadimplentes', 'Cancelados'].map((f) => (
          <button key={f} className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={f === 'Todos'
              ? { background: 'var(--color-frutificar-forest)', color: 'white' }
              : { background: 'white', color: 'oklch(0.52 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <div className="grid gap-4 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.93 0.005 144)', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto' }}>
          <span>Usuário</span><span>Plano</span><span>Status</span><span>Função</span><span>Cadastro</span><span />
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {users.map((u) => {
            const plan = planStyle[u.plan]; const status = statusStyle[u.status]; const role = roleStyle[u.role]
            return (
              <div key={u.email} className="grid gap-4 px-5 py-3.5 items-center hover:bg-[oklch(0.985_0_0)] transition-colors"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                    style={{ background: 'var(--color-frutificar-forest)' }}>
                    {u.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{u.name}</p>
                    <p className="text-xs truncate" style={{ color: 'oklch(0.58 0.03 144)' }}>{u.email}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full w-fit" style={{ background: plan.bg, color: plan.text }}>{u.plan}</span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: status.text }}>
                  <Circle size={6} fill={status.dot} style={{ color: status.dot }} />{status.label}
                </span>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-lg w-fit" style={{ background: role.bg, color: role.text }}>{role.label}</span>
                <span className="text-xs" style={{ color: 'oklch(0.62 0.02 144)' }}>{u.joined}</span>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'oklch(0.6 0.02 144)' }}>
                  <MoreHorizontal size={15} />
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'oklch(0.93 0.005 144)' }}>
          <span className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>Mostrando {users.length} de {users.length} usuários</span>
          <div className="flex items-center gap-1">
            {['1', '2', '3'].map((p) => (
              <button key={p} className="w-7 h-7 rounded-lg text-xs font-semibold"
                style={p === '1' ? { background: 'var(--color-frutificar-forest)', color: 'white' } : { color: 'oklch(0.52 0.04 144)' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
