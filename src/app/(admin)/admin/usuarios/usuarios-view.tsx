'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Circle, Pencil, Trash2, X, KeyRound, Mail, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'
import {
  createUserAction, updateUserAction, toggleUserSuspended, deleteUserAction,
  changeUserPlanAction, setTemporaryPasswordAction, sendPasswordResetAction,
} from '@/server/actions/admin-users'
import type { User } from './data'

type Role = 'STUDENT' | 'ADMIN' | 'INSTRUCTOR'
type Plan = 'ESSENCIAL' | 'PREMIUM' | 'GOLD'
type Status = 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

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

const filters = ['Todos', 'Ativos', 'Inadimplentes', 'Cancelados'] as const
type Filter = (typeof filters)[number]

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

const roleOptions = [
  { value: 'STUDENT', label: 'Aluno' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'INSTRUCTOR', label: 'Instrutor' },
]
const planOptions = [
  { value: 'ESSENCIAL', label: 'Essencial' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'GOLD', label: 'Gold' },
]

const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

function todayBR() {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function UsuariosView({
  initialUsers, preview,
}: {
  initialUsers: User[]
  preview: boolean
}) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setUsers(initialUsers) }, [initialUsers])

  const [filter, setFilter] = useState<Filter>('Todos')
  const [query, setQuery] = useState('')

  // Novo usuário
  const [createOpen, setCreateOpen] = useState(false)
  const [createRole, setCreateRole] = useState<Role>('STUDENT')
  const [createPlan, setCreatePlan] = useState<Plan>('ESSENCIAL')

  // Editar usuário
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<Role>('STUDENT')
  const [editPlan, setEditPlan] = useState<Plan>('ESSENCIAL')

  // Remover usuário
  const [removeTarget, setRemoveTarget] = useState<User | null>(null)

  // Redefinir senha
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetBusy, setResetBusy] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length

  const visibleUsers = users.filter((u) => {
    if (filter === 'Ativos' && u.status !== 'ACTIVE') return false
    if (filter === 'Inadimplentes' && u.status !== 'PAST_DUE') return false
    if (filter === 'Cancelados' && u.status !== 'CANCELED') return false
    const q = query.trim().toLowerCase()
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    return true
  })

  /* ── Ações (otimista + Server Action quando !preview) ── */
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    if (!name || !email) return

    const tmpId = `tmp-${Date.now()}`
    const user: User = {
      id: tmpId,
      name,
      email,
      plan: createPlan,
      status: 'ACTIVE',
      role: createRole,
      joined: todayBR(),
    }
    setUsers((cur) => [user, ...cur])
    setCreateOpen(false)
    toast.success('Usuário criado', { description: name })

    if (!preview) {
      const res = await createUserAction({ name, email, role: createRole })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const target = editTarget
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim() || target.name
    const email = String(data.get('email') ?? '').trim() || target.email

    const planChanged = editPlan !== target.plan

    setUsers((cur) =>
      cur.map((u) => (u.id === target.id ? { ...u, name, email, role: editRole, plan: editPlan } : u)),
    )
    setEditTarget(null)
    toast.success('Usuário atualizado', { description: name })

    if (!preview) {
      const res = await updateUserAction(target.id, { name, email, role: editRole })
      if (!res.ok) toast.error(res.error)
      // O plano fica na assinatura, não no User — grava separadamente.
      if (planChanged) {
        const planRes = await changeUserPlanAction(target.id, { plan: editPlan })
        if (!planRes.ok) toast.error(planRes.error)
      }
      router.refresh()
    }
  }

  async function toggleStatus(user: User) {
    const next: Status = user.status === 'ACTIVE' ? 'CANCELED' : 'ACTIVE'
    setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, status: next } : u)))
    toast.success(next === 'ACTIVE' ? 'Usuário ativado' : 'Usuário suspenso', { description: user.name })

    if (!preview) {
      const res = await toggleUserSuspended(user.id, next !== 'ACTIVE')
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  function openReset(user: User) {
    setTempPassword(null)
    setCopied(false)
    setResetTarget(user)
  }

  async function handleTempPassword() {
    if (!resetTarget) return
    if (preview) {
      setTempPassword('Exemplo123x') // demo: sem banco não grava
      toast.success('Senha temporária gerada (demo)')
      return
    }
    setResetBusy(true)
    const res = await setTemporaryPasswordAction(resetTarget.id)
    setResetBusy(false)
    if (res.ok) {
      setTempPassword(res.data.password)
      toast.success('Senha temporária definida', { description: resetTarget.name })
    } else {
      toast.error(res.error)
    }
  }

  async function handleSendReset() {
    if (!resetTarget) return
    if (preview) {
      toast.success('Link de redefinição enviado (demo)', { description: resetTarget.email })
      setResetTarget(null)
      return
    }
    setResetBusy(true)
    const res = await sendPasswordResetAction(resetTarget.id)
    setResetBusy(false)
    if (res.ok) {
      toast.success('Link enviado por e-mail', { description: resetTarget.email })
      setResetTarget(null)
    } else {
      toast.error(res.error)
    }
  }

  async function copyTempPassword() {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.')
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    const target = removeTarget
    setUsers((cur) => cur.filter((u) => u.id !== target.id))
    setRemoveTarget(null)
    toast.success('Usuário removido', { description: target.name })

    if (!preview) {
      const res = await deleteUserAction(target.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Usuários</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{users.length} usuários · {activeCount} ativos</p>
        </div>
        <button
          onClick={() => { setCreateRole('STUDENT'); setCreatePlan('ESSENCIAL'); setCreateOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo usuário
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-xs"
          style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
          <Search size={14} style={{ color: 'oklch(0.58 0.03 144)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuário..."
            className="text-sm bg-transparent outline-none w-full placeholder:text-[oklch(0.65_0.02_144)]"
            style={{ color: 'var(--color-frutificar-deep)' }}
          />
        </div>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={f === filter
              ? { background: 'var(--color-frutificar-forest)', color: 'white' }
              : { background: 'white', color: 'oklch(0.52 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
       <div className="overflow-x-auto">
        <div className="min-w-[820px]">
        <div className="grid gap-4 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.93 0.005 144)', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto' }}>
          <span>Usuário</span><span>Plano</span><span>Status</span><span>Função</span><span>Cadastro</span><span />
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {visibleUsers.map((u) => {
            const plan = planStyle[u.plan]; const status = statusStyle[u.status]; const role = roleStyle[u.role]
            return (
              <div key={u.id} className="grid gap-4 px-5 py-3.5 items-center hover:bg-[oklch(0.985_0_0)] transition-colors"
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
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full w-fit" style={{ background: plan?.bg, color: plan?.text }}>{u.plan}</span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: status?.text }}>
                  <Circle size={6} fill={status?.dot} style={{ color: status?.dot }} />{status?.label ?? u.status}
                </span>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-lg w-fit" style={{ background: role?.bg, color: role?.text }}>{role?.label ?? u.role}</span>
                <span className="text-xs" style={{ color: 'oklch(0.62 0.02 144)' }}>{u.joined}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditRole(u.role as Role); setEditPlan(u.plan as Plan); setEditTarget(u) }} title="Editar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => openReset(u)} title="Redefinir senha"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                    <KeyRound size={15} />
                  </button>
                  <button onClick={() => toggleStatus(u)} title={u.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                    style={{ color: 'var(--color-frutificar-green)' }}>
                    {u.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
                  </button>
                  <button onClick={() => setRemoveTarget(u)} title="Remover"
                    className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}

          {visibleUsers.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Nenhum usuário neste filtro.
            </div>
          )}
        </div>
        </div>
       </div>
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'oklch(0.93 0.005 144)' }}>
          <span className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>Mostrando {visibleUsers.length} de {users.length} usuários</span>
          <div className="flex items-center gap-1">
            {['1', '2', '3'].map((p) => (
              <button key={p} className="w-7 h-7 rounded-lg text-xs font-semibold"
                style={p === '1' ? { background: 'var(--color-frutificar-forest)', color: 'white' } : { color: 'oklch(0.52 0.04 144)' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo usuário */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo usuário
            </DialogTitle>
            <DialogDescription>Cadastre um novo usuário na plataforma.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome</label>
              <input name="name" required placeholder="Ex.: João Carlos Silva" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>E-mail</label>
              <input name="email" type="email" required placeholder="Ex.: joao@exemplo.com" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Função</label>
                <SelectField
                  id="create-role"
                  value={createRole}
                  onValueChange={(v) => setCreateRole(v as Role)}
                  options={roleOptions}
                  placeholder="Selecione"
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Plano</label>
                <SelectField
                  id="create-plan"
                  value={createPlan}
                  onValueChange={(v) => setCreatePlan(v as Plan)}
                  options={planOptions}
                  placeholder="Selecione"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setCreateOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                Criar usuário
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar usuário */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar usuário
            </DialogTitle>
            <DialogDescription>Atualize as informações deste usuário.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome</label>
                <input name="name" required defaultValue={editTarget.name} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>E-mail</label>
                <input name="email" type="email" required defaultValue={editTarget.email} className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Função</label>
                  <SelectField
                    id="edit-role"
                    value={editRole}
                    onValueChange={(v) => setEditRole(v as Role)}
                    options={roleOptions}
                    placeholder="Selecione"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Plano</label>
                  <SelectField
                    id="edit-plan"
                    value={editPlan}
                    onValueChange={(v) => setEditPlan(v as Plan)}
                    options={planOptions}
                    placeholder="Selecione"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                  style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                  Salvar alterações
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Remover usuário */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover usuário?</DialogTitle>
            <DialogDescription>
              O usuário <strong>{removeTarget?.name}</strong> será removido. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter usuário
            </button>
            <button onClick={handleRemove}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              <X size={14} /> Confirmar remoção
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redefinir senha */}
      <Dialog open={resetTarget !== null} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
              <KeyRound size={20} style={{ color: 'var(--color-frutificar-green)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Redefinir senha</DialogTitle>
            <DialogDescription>
              Escolha como redefinir a senha de <strong>{resetTarget?.name}</strong> ({resetTarget?.email}).
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'oklch(0.5 0.04 144)' }}>
                Senha temporária definida. Copie e envie ao aluno — peça que troque no primeiro acesso pelo perfil.
              </p>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'oklch(0.97 0.01 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                <code className="flex-1 text-base font-bold tracking-wide" style={{ color: 'var(--color-frutificar-deep)' }}>{tempPassword}</code>
                <button onClick={copyTempPassword}
                  className="p-2 rounded-lg transition-colors hover:bg-[oklch(0.48_0.13_144_/_0.1)]"
                  style={{ color: 'var(--color-frutificar-green)' }} title="Copiar">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <DialogFooter className="pt-1">
                <button onClick={() => setResetTarget(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                  Concluir
                </button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button onClick={handleTempPassword} disabled={resetBusy}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-[oklch(0.97_0.01_144)] disabled:opacity-50"
                style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
                <KeyRound size={18} style={{ color: 'var(--color-frutificar-green)' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>Gerar senha temporária</p>
                  <p className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>Define uma senha na hora para você repassar ao aluno.</p>
                </div>
              </button>
              <button onClick={handleSendReset} disabled={resetBusy}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-[oklch(0.97_0.01_144)] disabled:opacity-50"
                style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
                <Mail size={18} style={{ color: 'var(--color-frutificar-green)' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>Enviar link por e-mail</p>
                  <p className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>Manda o link de redefinição para o e-mail do aluno (expira em 1h).</p>
                </div>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
