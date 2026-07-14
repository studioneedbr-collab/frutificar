'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Users, BookOpen, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Circle, Inbox, MapPin, Sprout,
  Check, X, ShieldAlert,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  acceptVisit, rejectVisit, acceptServiceRequest, rejectServiceRequest,
} from '@/server/actions/admin'
import type { Solicitation } from './data'

const stats = [
  {
    label: 'Alunos ativos',
    value: '1.284',
    change: '+12%',
    up: true,
    icon: Users,
    color: 'oklch(0.48 0.13 144)',
    bg: 'oklch(0.48 0.13 144 / 0.08)',
  },
  {
    label: 'Assinaturas ativas',
    value: '947',
    change: '+8%',
    up: true,
    icon: CreditCard,
    color: 'oklch(0.62 0.12 55)',
    bg: 'oklch(0.62 0.12 55 / 0.08)',
  },
  {
    label: 'Cursos publicados',
    value: '23',
    change: '+2 este mês',
    up: true,
    icon: BookOpen,
    color: 'oklch(0.55 0.1 220)',
    bg: 'oklch(0.55 0.1 220 / 0.08)',
  },
  {
    label: 'Receita mensal',
    value: 'R$ 38.420',
    change: '-3%',
    up: false,
    icon: TrendingUp,
    color: 'oklch(0.78 0.17 75)',
    bg: 'oklch(0.78 0.17 75 / 0.08)',
  },
]

export type DashboardUser = { name: string; email: string; plan: string; status: string; joined: string }
export type DashboardCourse = { title: string; lessons: number; enrolled: number; published: boolean }
export type DashboardMetrics = {
  activeStudents: number
  activeSubscriptions: number
  publishedCourses: number
  monthlyRevenue: number
}

const defaultRecentUsers: DashboardUser[] = [
  { name: 'João Carlos Silva', email: 'joao@exemplo.com', plan: 'GOLD', status: 'ACTIVE', joined: '12 jun 2026' },
  { name: 'Maria Aparecida Costa', email: 'maria@exemplo.com', plan: 'PREMIUM', status: 'ACTIVE', joined: '11 jun 2026' },
  { name: 'Pedro Henrique Souza', email: 'pedro@exemplo.com', plan: 'ESSENCIAL', status: 'ACTIVE', joined: '10 jun 2026' },
  { name: 'Ana Beatriz Lima', email: 'ana@exemplo.com', plan: 'GOLD', status: 'PAST_DUE', joined: '09 jun 2026' },
  { name: 'Carlos Eduardo Rocha', email: 'carlos@exemplo.com', plan: 'PREMIUM', status: 'ACTIVE', joined: '08 jun 2026' },
  { name: 'Fernanda Oliveira', email: 'fernanda@exemplo.com', plan: 'ESSENCIAL', status: 'CANCELED', joined: '07 jun 2026' },
]

const defaultRecentCourses: DashboardCourse[] = [
  { title: 'Manejo do Cafeeiro: Do Plantio à Colheita', lessons: 18, enrolled: 312, published: true },
  { title: 'Análise de Solo para Produtores Rurais', lessons: 12, enrolled: 198, published: true },
  { title: 'Gestão Financeira da Propriedade Rural', lessons: 9, enrolled: 87, published: false },
  { title: 'Irrigação Inteligente com Sensores IoT', lessons: 6, enrolled: 0, published: false },
]

const planColors: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}

const statusColors: Record<string, { dot: string; text: string; label: string }> = {
  ACTIVE:    { dot: 'oklch(0.55 0.14 144)', text: 'oklch(0.38 0.1 144)', label: 'Ativo' },
  PAST_DUE:  { dot: 'oklch(0.7 0.15 55)', text: 'oklch(0.5 0.12 55)', label: 'Inadimplente' },
  CANCELED:  { dot: 'oklch(0.6 0.1 27)', text: 'oklch(0.45 0.1 27)', label: 'Cancelado' },
}

// Visual da solicitação derivado do tipo (visita vs serviço), mantendo o pill idêntico.
function solicitationVisual(kind: Solicitation['kind']) {
  if (kind === 'visit') {
    return { icon: MapPin, color: 'oklch(0.48 0.13 144)', bg: 'oklch(0.48 0.13 144 / 0.1)' }
  }
  return { icon: Sprout, color: 'oklch(0.62 0.12 55)', bg: 'oklch(0.62 0.12 55 / 0.1)' }
}

export function AdminDashboardView({
  initialSolicitations, preview, metrics, recentUsers = defaultRecentUsers, recentCourses = defaultRecentCourses,
}: {
  initialSolicitations: Solicitation[]
  preview: boolean
  metrics?: DashboardMetrics
  recentUsers?: DashboardUser[]
  recentCourses?: DashboardCourse[]
}) {
  const router = useRouter()
  const [requests, setRequests] = useState<Solicitation[]>(initialSolicitations)
  const [rejectTarget, setRejectTarget] = useState<Solicitation | null>(null)

  // Em modo real, os valores dos 4 cards vêm das métricas do banco (sem % de tendência).
  const metricOverrides = metrics
    ? [
        { value: metrics.activeStudents.toLocaleString('pt-BR'), change: '' },
        { value: metrics.activeSubscriptions.toLocaleString('pt-BR'), change: '' },
        { value: String(metrics.publishedCourses), change: '' },
        { value: `R$ ${metrics.monthlyRevenue.toLocaleString('pt-BR')}`, change: '' },
      ]
    : null

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setRequests(initialSolicitations) }, [initialSolicitations])

  async function handleAccept(req: Solicitation) {
    setRequests((cur) => cur.filter((r) => r.id !== req.id))
    toast.success('Solicitação aceita', { description: `${req.type} de ${req.user}` })

    if (!preview) {
      const res = req.kind === 'visit'
        ? await acceptVisit(req.id)
        : await acceptServiceRequest(req.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return
    const req = rejectTarget
    setRequests((cur) => cur.filter((r) => r.id !== req.id))
    setRejectTarget(null)
    toast.info('Solicitação recusada')

    if (!preview) {
      const res = req.kind === 'visit'
        ? await rejectVisit(req.id)
        : await rejectServiceRequest(req.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1
          className="text-2xl font-bold leading-tight"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-frutificar-deep)',
            letterSpacing: '-0.03em',
          }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>
          Visão geral da plataforma — junho 2026
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          const value = metricOverrides ? metricOverrides[i].value : s.value
          const change = metricOverrides ? metricOverrides[i].change : s.change
          return (
            <div
              key={s.label}
              className="rounded-2xl p-5"
              style={{ background: 'white', border: '1px solid oklch(0.92 0.01 144)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: s.bg }}
                >
                  <Icon size={18} style={{ color: s.color }} strokeWidth={2} />
                </div>
                {change && (
                  <span
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: s.up ? 'oklch(0.48 0.13 144)' : 'oklch(0.52 0.18 27)' }}
                  >
                    {s.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {change}
                  </span>
                )}
              </div>
              <p
                className="text-2xl font-bold leading-none mb-1"
                style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.04em' }}
              >
                {value}
              </p>
              <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>
                {s.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Solicitações recentes */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid oklch(0.92 0.01 144)', background: 'white' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.01 144)' }}>
          <div>
            <h2
              className="font-bold text-[15px] flex items-center gap-2"
              style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              <Inbox size={16} style={{ color: 'var(--color-frutificar-green)' }} />
              Solicitações recentes
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.62 0.14 55)' }}>
                ({requests.length} {requests.length === 1 ? 'pendente' : 'pendentes'})
              </span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>
              Pedidos recebidos de produtores aguardando atendimento
            </p>
          </div>
          <button
            onClick={() => toast.info('Abrindo lista completa...')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
          >
            Ver todos
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-12">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}
            >
              <Check size={22} style={{ color: 'var(--color-frutificar-green)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>
              Tudo em dia
            </p>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.58 0.03 144)' }}>
              Nenhuma solicitação pendente
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'oklch(0.95 0.005 144)' }}>
            {requests.map((req) => {
              const visual = solicitationVisual(req.kind)
              const Icon = visual.icon
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[oklch(0.985_0_0)] transition-colors"
                >
                  {/* Ícone do tipo */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: visual.bg }}
                  >
                    <Icon size={18} style={{ color: visual.color }} strokeWidth={2} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>
                      {req.type}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'oklch(0.5 0.04 144)' }}>
                      <span className="font-semibold">{req.user}</span> · {req.detail}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.62 0.02 144)' }}>
                      {req.when}
                    </p>
                  </div>
                  {/* Pendente */}
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1.5 flex-shrink-0"
                    style={{ background: 'oklch(0.78 0.17 75 / 0.12)', color: 'oklch(0.55 0.12 65)' }}
                  >
                    <Circle size={6} fill="oklch(0.7 0.15 65)" style={{ color: 'oklch(0.7 0.15 65)' }} />
                    Pendente
                  </span>
                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 4px 14px oklch(0.48 0.13 144 / 0.25)' }}
                    >
                      <Check size={14} /> <span className="hidden sm:inline">Aceitar</span>
                    </button>
                    <button
                      onClick={() => setRejectTarget(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-[oklch(0.6_0.18_27_/_0.06)]"
                      style={{ color: 'oklch(0.55 0.18 27)', border: '1px solid oklch(0.6 0.18 27 / 0.3)' }}
                    >
                      <X size={14} /> <span className="hidden sm:inline">Recusar</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Usuários recentes */}
        <div
          className="xl:col-span-2 rounded-2xl overflow-hidden"
          style={{ border: '1px solid oklch(0.92 0.01 144)', background: 'white' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.01 144)' }}>
            <div>
              <h2
                className="font-bold text-[15px]"
                style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Usuários recentes
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>Últimos cadastros na plataforma</p>
            </div>
            <button
              onClick={() => toast.info('Abrindo lista completa...')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
            >
              Ver todos
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'oklch(0.95 0.005 144)' }}>
            {recentUsers.length === 0 && (
              <div className="px-6 py-8 text-center text-sm" style={{ color: 'oklch(0.58 0.03 144)' }}>
                Nenhum usuário cadastrado ainda.
              </div>
            )}
            {recentUsers.map((u) => {
              const plan = planColors[u.plan] ?? { bg: 'oklch(0.94 0.01 144)', text: 'oklch(0.5 0.03 144)' }
              const status = statusColors[u.status] ?? { dot: 'oklch(0.6 0.02 144)', text: 'oklch(0.52 0.04 144)', label: u.status || '—' }
              return (
                <div key={u.email} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[oklch(0.985_0_0)] transition-colors">
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ background: 'var(--color-frutificar-forest)' }}
                  >
                    {u.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>
                      {u.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'oklch(0.58 0.03 144)' }}>
                      {u.email}
                    </p>
                  </div>
                  {/* Plano */}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline"
                    style={{ background: plan.bg, color: plan.text }}
                  >
                    {u.plan}
                  </span>
                  {/* Status */}
                  <span className="flex items-center gap-1.5 text-[11px] font-medium hidden md:flex" style={{ color: status.text }}>
                    <Circle size={6} fill={status.dot} style={{ color: status.dot }} />
                    {status.label}
                  </span>
                  {/* Data */}
                  <span className="text-[11px] hidden lg:block" style={{ color: 'oklch(0.62 0.02 144)' }}>
                    {u.joined}
                  </span>
                  <button
                    onClick={() => toast.info('Ações do usuário', { description: u.name })}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    style={{ color: 'oklch(0.65 0.02 144)' }}
                    aria-label="Ações do usuário"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cursos */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid oklch(0.92 0.01 144)', background: 'white' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.01 144)' }}>
            <h2
              className="font-bold text-[15px]"
              style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Cursos
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>Status dos cursos</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'oklch(0.95 0.005 144)' }}>
            {recentCourses.length === 0 && (
              <div className="px-5 py-8 text-center text-sm" style={{ color: 'oklch(0.58 0.03 144)' }}>
                Nenhum curso cadastrado ainda.
              </div>
            )}
            {recentCourses.map((c) => (
              <div key={c.title} className="px-5 py-4 hover:bg-[oklch(0.985_0_0)] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>
                    {c.title}
                  </p>
                  <span
                    className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={
                      c.published
                        ? { background: 'oklch(0.48 0.13 144 / 0.1)', color: 'oklch(0.38 0.1 144)' }
                        : { background: 'oklch(0.92 0.02 144)', color: 'oklch(0.55 0.03 144)' }
                    }
                  >
                    {c.published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>
                    {c.lessons} aulas
                  </span>
                  <span className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>
                    {c.enrolled} alunos
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t" style={{ borderColor: 'oklch(0.93 0.01 144)' }}>
            <button
              onClick={() => toast.info('Abrindo gestão de cursos...')}
              className="w-full text-xs font-semibold py-2 rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
            >
              Gerenciar cursos
            </button>
          </div>
        </div>
      </div>

      {/* Confirmar recusa */}
      <Dialog open={rejectTarget !== null} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 27 / 0.1)' }}>
              <ShieldAlert size={20} style={{ color: 'oklch(0.6 0.18 27)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              Recusar solicitação?
            </DialogTitle>
            <DialogDescription>
              {rejectTarget && (
                <>A solicitação de <strong>{rejectTarget.type}</strong> de <strong>{rejectTarget.user}</strong> será removida da lista. Esta ação não pode ser desfeita.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button
              onClick={() => setRejectTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}
            >
              Voltar
            </button>
            <button
              onClick={confirmReject}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_27_/_0.06)]"
              style={{ color: 'oklch(0.6 0.18 27)', border: '1px solid oklch(0.6 0.18 27 / 0.35)' }}
            >
              Confirmar recusa
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
