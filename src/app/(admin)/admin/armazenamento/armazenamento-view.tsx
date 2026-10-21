'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HardDrive, Trash2, X, Loader2, FileX2, ShieldCheck, Info, RefreshCw } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { deleteStorageOrphansAction } from '@/server/actions/admin-storage'
import type { StorageReport } from '@/server/services/storage-cleanup.service'

export type StorageState =
  | { kind: 'preview' }
  | { kind: 'unconfigured' }
  | { kind: 'error' }
  | { kind: 'ready'; report: StorageReport }

const deep = 'var(--color-frutificar-deep)'
const green = 'var(--color-frutificar-green)'
const red = 'oklch(0.6 0.18 25)'
const muted = 'oklch(0.52 0.04 144)'
const border = '1px solid oklch(0.91 0.01 144)'
const MAX_ROWS = 300 // a tabela mostra até 300 linhas (a limpeza apaga todos)

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: v < 10 ? 1 : 0 })} ${units[i]}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Header({ subtitle, onRefresh }: { subtitle: string; onRefresh?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: deep, letterSpacing: '-0.03em' }}>Armazenamento</h1>
        <p className="text-sm mt-1" style={{ color: muted }}>{subtitle}</p>
      </div>
      {onRefresh && (
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[oklch(0.96_0.01_144)] shrink-0"
          style={{ color: 'oklch(0.45 0.04 144)', border, background: 'white' }}>
          <RefreshCw size={15} /> Atualizar
        </button>
      )}
    </div>
  )
}

function Notice({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center" style={{ border }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
        <Icon size={20} style={{ color: green }} />
      </div>
      <h2 className="font-bold text-base" style={{ color: deep }}>{title}</h2>
      <div className="text-sm mt-1.5 max-w-lg mx-auto" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

export function ArmazenamentoView({ state }: { state: StorageState }) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (state.kind === 'preview') {
    return (
      <div className="space-y-6">
        <Header subtitle="Uso do Storage e limpeza de arquivos sem uso" />
        <Notice icon={Info} title="Indisponível no modo demonstração">
          Esta tela lê os arquivos do Supabase Storage e compara com o banco de dados para encontrar
          arquivos que nenhum registro usa mais. No modo demonstração (PREVIEW_MODE) não há banco
          nem Storage conectados, então não há nada para analisar.
        </Notice>
      </div>
    )
  }

  if (state.kind === 'unconfigured') {
    return (
      <div className="space-y-6">
        <Header subtitle="Uso do Storage e limpeza de arquivos sem uso" />
        <Notice icon={HardDrive} title="Storage não configurado">
          Defina <strong>SUPABASE_SERVICE_ROLE_KEY</strong> (e, se preciso, <strong>SUPABASE_URL</strong>) nas
          variáveis de ambiente para ver o uso de espaço e limpar arquivos sem uso.
        </Notice>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="space-y-6">
        <Header subtitle="Uso do Storage e limpeza de arquivos sem uso" onRefresh={() => router.refresh()} />
        <Notice icon={FileX2} title="Não foi possível analisar o Storage">
          Houve um erro ao listar os arquivos ou ler o banco. Nada foi apagado. Tente novamente em instantes.
        </Notice>
      </div>
    )
  }

  const { report } = state
  const totalBytes = report.buckets.reduce((s, b) => s + b.bytes, 0)
  const totalFiles = report.buckets.reduce((s, b) => s + b.files, 0)
  const rows = report.orphans.slice(0, MAX_ROWS)

  async function handleDelete() {
    setDeleting(true)
    const res = await deleteStorageOrphansAction(report.orphans.map((o) => ({ bucket: o.bucket, path: o.path })))
    setDeleting(false)
    setConfirmOpen(false)
    if (!res.ok) { toast.error(res.error); return }
    const { deleted, bytes, skipped } = res.data
    toast.success(`${deleted} ${deleted === 1 ? 'arquivo apagado' : 'arquivos apagados'}`, {
      description: `${fmtBytes(bytes)} liberados${skipped ? ` · ${skipped} mantido(s) por estarem em uso ou recentes` : ''}.`,
    })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Header subtitle={`${totalFiles} arquivos · ${fmtBytes(totalBytes)} em uso`} onRefresh={() => router.refresh()} />

      {/* Uso por bucket + órfãos */}
      <div className="grid gap-3 sm:grid-cols-3">
        {report.buckets.map((b) => (
          <div key={b.bucket} className="rounded-2xl bg-white p-5 flex items-start gap-4" style={{ border }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
              <HardDrive size={18} style={{ color: green }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: muted }}>{b.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: deep, fontFamily: 'var(--font-heading)' }}>{fmtBytes(b.bytes)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.6 0.03 144)' }}>{b.files} arquivos · bucket “{b.bucket}”</p>
            </div>
          </div>
        ))}
        <div className="rounded-2xl bg-white p-5 flex items-start gap-4" style={{ border }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: report.orphans.length ? 'oklch(0.6 0.18 25 / 0.1)' : 'oklch(0.48 0.13 144 / 0.1)' }}>
            <FileX2 size={18} style={{ color: report.orphans.length ? red : green }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: muted }}>Arquivos sem uso</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: deep, fontFamily: 'var(--font-heading)' }}>{fmtBytes(report.orphanBytes)}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'oklch(0.6 0.03 144)' }}>
              {report.orphans.length} arquivos{report.recentSkipped ? ` · ${report.recentSkipped} recentes ignorados` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de órfãos */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border }}>
        <div className="flex items-center justify-between gap-3 flex-wrap p-5" style={{ borderBottom: border }}>
          <div>
            <h2 className="font-bold text-sm" style={{ color: deep }}>Arquivos não usados</h2>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Nenhum registro do banco aponta para eles. Arquivos enviados nas últimas 24h nunca entram na lista.
            </p>
          </div>
          <button onClick={() => setConfirmOpen(true)} disabled={report.orphans.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: red }}>
            <Trash2 size={15} /> Apagar arquivos não usados
          </button>
        </div>

        {report.orphans.length === 0 ? (
          <div className="p-10 text-center text-sm flex flex-col items-center gap-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
            <ShieldCheck size={22} style={{ color: green }} />
            Tudo limpo — nenhum arquivo sem uso.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: 'oklch(0.6 0.03 144)', background: 'oklch(0.985 0.005 144)' }}>
                  <th className="px-5 py-2.5 font-semibold">Arquivo</th>
                  <th className="px-5 py-2.5 font-semibold">Bucket</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Tamanho</th>
                  <th className="px-5 py-2.5 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={`${o.bucket}/${o.path}`} style={{ borderTop: border }}>
                    <td className="px-5 py-2.5 font-mono text-xs break-all" style={{ color: deep }}>{o.path}</td>
                    <td className="px-5 py-2.5 text-xs" style={{ color: muted }}>{o.bucket}</td>
                    <td className="px-5 py-2.5 text-xs text-right whitespace-nowrap" style={{ color: deep }}>{fmtBytes(o.size)}</td>
                    <td className="px-5 py-2.5 text-xs whitespace-nowrap" style={{ color: muted }}>{fmtDate(o.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.orphans.length > rows.length && (
              <p className="px-5 py-3 text-xs" style={{ color: muted, borderTop: border }}>
                Mostrando os {rows.length} maiores de {report.orphans.length} arquivos. A limpeza apaga todos.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirmar limpeza */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !deleting && setConfirmOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}><Trash2 size={20} style={{ color: red }} /></div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: deep }}>Apagar arquivos não usados?</DialogTitle>
            <DialogDescription>
              <strong>{report.orphans.length} arquivos</strong> ({fmtBytes(report.orphanBytes)}) serão apagados do Storage.
              Antes de apagar, o sistema confere de novo se cada arquivo continua sem uso. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setConfirmOpen(false)} disabled={deleting} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 disabled:opacity-60" style={{ background: green, boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Manter</button>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5 disabled:opacity-60" style={{ color: red, border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} {deleting ? 'Apagando…' : 'Apagar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
