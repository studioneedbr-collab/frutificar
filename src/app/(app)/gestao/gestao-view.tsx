'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ShieldCheck, FileText, History, Plus, Download, Trash2, Paperclip, X,
  Building2, MapPin, CalendarClock, Loader2, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { createPropertyDocumentAction, deletePropertyDocumentAction } from '@/server/actions/property-docs'
import type { GestaoProperty, PropDoc, DocType } from './data'

const inputStyle: React.CSSProperties = { border: '1px solid oklch(0.91 0.01 144)', background: 'oklch(0.99 0.005 144)' }
const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'
const deep = 'var(--color-frutificar-deep)'
const green = 'var(--color-frutificar-green)'

const sections: { type: DocType; label: string; icon: typeof ShieldCheck; desc: string }[] = [
  { type: 'LICENCA', label: 'Licenças ambientais', icon: ShieldCheck, desc: 'LO, outorga de água, CAR e demais licenças com validade.' },
  { type: 'DOCUMENTO', label: 'Documentos', icon: FileText, desc: 'Escrituras, contratos, comprovantes e documentação da propriedade.' },
  { type: 'HISTORICO', label: 'Histórico', icon: History, desc: 'Registro de eventos e intervenções na propriedade ao longo do tempo.' },
]

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Status de validade de uma licença.
function licenseStatus(expiresAt: string | null): { label: string; bg: string; color: string; icon: typeof CheckCircle2 } | null {
  if (!expiresAt) return null
  const exp = new Date(expiresAt).getTime()
  if (isNaN(exp)) return null
  const days = Math.floor((exp - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: 'Vencida', bg: 'oklch(0.6 0.18 25 / 0.12)', color: 'oklch(0.5 0.18 25)', icon: AlertTriangle }
  if (days <= 30) return { label: `Vence em ${days}d`, bg: 'oklch(0.7 0.15 70 / 0.14)', color: 'oklch(0.5 0.13 70)', icon: CalendarClock }
  return { label: 'Válida', bg: 'oklch(0.48 0.13 144 / 0.1)', color: green, icon: CheckCircle2 }
}

let tmp = 0
const tmpId = () => `tmp-${++tmp}`

export function GestaoView({ properties, preview }: { properties: GestaoProperty[]; preview: boolean }) {
  const router = useRouter()
  const [props, setProps] = useState<GestaoProperty[]>(properties)
  useEffect(() => { setProps(properties) }, [properties])

  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? '')
  useEffect(() => {
    if (!props.find((p) => p.id === selectedId)) setSelectedId(props[0]?.id ?? '')
  }, [props, selectedId])

  const [addType, setAddType] = useState<DocType | null>(null)
  const [saving, setSaving] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const property = props.find((p) => p.id === selectedId) ?? null
  const docsBy = (type: DocType) => property?.docs.filter((d) => d.type === type) ?? []

  function patchProp(id: string, fn: (p: GestaoProperty) => GestaoProperty) {
    setProps((cur) => cur.map((p) => (p.id === id ? fn(p) : p)))
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!property || !addType) return
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('propertyId', property.id)
    fd.set('type', addType)
    const title = String(fd.get('title') ?? '').trim()
    if (!title) { toast.error('Informe um título.'); return }

    const optimistic: PropDoc = {
      id: tmpId(), type: addType, title,
      description: String(fd.get('description') ?? '').trim() || null,
      fileUrl: null,
      issuer: String(fd.get('issuer') ?? '').trim() || null,
      issuedAt: String(fd.get('issuedAt') ?? '') || null,
      expiresAt: String(fd.get('expiresAt') ?? '') || null,
      createdAt: new Date().toISOString(),
    }

    if (preview) {
      patchProp(property.id, (p) => ({ ...p, docs: [optimistic, ...p.docs] }))
      setAddType(null)
      toast.success('Adicionado (demo)')
      return
    }

    setSaving(true)
    const res = await createPropertyDocumentAction(fd)
    setSaving(false)
    if (!res.ok) { toast.error(res.error); return }
    patchProp(property.id, (p) => ({ ...p, docs: [{ ...optimistic, id: res.data.id }, ...p.docs] }))
    setAddType(null)
    toast.success('Salvo com sucesso')
    router.refresh()
  }

  async function handleRemove() {
    if (!removeId || !property) return
    const id = removeId
    patchProp(property.id, (p) => ({ ...p, docs: p.docs.filter((d) => d.id !== id) }))
    setRemoveId(null)
    if (!preview) {
      const res = await deletePropertyDocumentAction(id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  const addMeta = useMemo(() => sections.find((s) => s.type === addType) ?? null, [addType])

  // Sem propriedades → orienta a criar em /propriedades
  if (props.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Header />
        <div className="mt-6 rounded-2xl bg-white p-10 text-center" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <Building2 size={22} style={{ color: green }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: deep }}>Nenhuma propriedade ainda</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'oklch(0.58 0.03 144)' }}>Cadastre sua propriedade para gerenciar licenças, documentos e histórico.</p>
          <Link href="/propriedades" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: green }}>
            <Plus size={15} /> Cadastrar propriedade
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-4">
      <Header />

      {/* Seletor de propriedade */}
      {props.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {props.map((p) => {
            const active = p.id === selectedId
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                style={active ? { background: 'var(--color-frutificar-forest)', color: 'white' } : { background: 'white', color: 'oklch(0.52 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                <Building2 size={13} /> {p.name}
              </button>
            )
          })}
        </div>
      )}

      {property && (
        <p className="flex items-center gap-1.5 text-sm -mt-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
          <MapPin size={14} /> {property.name} · {property.location}
        </p>
      )}

      {/* Seções */}
      {sections.map((s) => {
        const Icon = s.icon
        const docs = docsBy(s.type)
        return (
          <section key={s.type} className="rounded-2xl bg-white p-5 md:p-6" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                  <Icon size={18} style={{ color: green }} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-[15px]" style={{ color: deep, fontFamily: 'var(--font-heading)' }}>{s.label}</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{s.desc}</p>
                </div>
              </div>
              <button onClick={() => setAddType(s.type)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition-opacity hover:opacity-85"
                style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: green }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {docs.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'oklch(0.6 0.03 144)' }}>Nada por aqui ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {docs.map((d) => {
                  const st = s.type === 'LICENCA' ? licenseStatus(d.expiresAt) : null
                  const StIcon = st?.icon
                  return (
                    <div key={d.id} className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm" style={{ color: deep }}>{d.title}</h3>
                          {st && StIcon && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                              <StIcon size={11} /> {st.label}
                            </span>
                          )}
                        </div>
                        {d.description && <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.5 }}>{d.description}</p>}
                        <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11px]" style={{ color: 'oklch(0.6 0.03 144)' }}>
                          {d.issuer && <span>Emissor: <strong style={{ color: 'oklch(0.5 0.04 144)' }}>{d.issuer}</strong></span>}
                          {d.issuedAt && <span>{s.type === 'HISTORICO' ? 'Data' : 'Emissão'}: {fmtDate(d.issuedAt)}</span>}
                          {d.expiresAt && <span>Validade: {fmtDate(d.expiresAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {d.fileUrl && (
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" title="Baixar arquivo"
                            className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.48_0.13_144_/_0.08)]" style={{ color: green }}>
                            <Download size={15} />
                          </a>
                        )}
                        <button onClick={() => setRemoveId(d.id)} title="Remover"
                          className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}

      {/* ═══ Adicionar item ═══ */}
      <Dialog open={addType !== null} onOpenChange={(o) => { if (!o && !saving) setAddType(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: deep }}>
              <Plus size={18} style={{ color: green }} /> {addMeta?.label}
            </DialogTitle>
            <DialogDescription>{property?.name}</DialogDescription>
          </DialogHeader>
          {addType && (
            <form onSubmit={handleAdd} className="space-y-3.5" key={addType}>
              <div>
                <label className={labelClass} style={{ color: deep }}>Título</label>
                <input name="title" required placeholder={addType === 'LICENCA' ? 'Ex.: Licença de Operação (LO)' : addType === 'HISTORICO' ? 'Ex.: Aplicação de calcário' : 'Ex.: Escritura da propriedade'} className={inputClass} style={inputStyle} />
              </div>

              {addType === 'LICENCA' && (
                <>
                  <div>
                    <label className={labelClass} style={{ color: deep }}>Órgão emissor</label>
                    <input name="issuer" placeholder="Ex.: SEMAD/MG, IGAM…" className={inputClass} style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} style={{ color: deep }}>Emissão</label>
                      <input name="issuedAt" type="date" className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelClass} style={{ color: deep }}>Validade</label>
                      <input name="expiresAt" type="date" className={inputClass} style={inputStyle} />
                    </div>
                  </div>
                </>
              )}

              {addType === 'HISTORICO' && (
                <div>
                  <label className={labelClass} style={{ color: deep }}>Data</label>
                  <input name="issuedAt" type="date" className={inputClass} style={inputStyle} />
                </div>
              )}

              {addType !== 'LICENCA' && (
                <div>
                  <label className={labelClass} style={{ color: deep }}>Descrição</label>
                  <textarea name="description" rows={3} placeholder="Detalhes…" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
                </div>
              )}

              {addType !== 'HISTORICO' && (
                <div>
                  <label className={labelClass} style={{ color: deep }}>Arquivo (opcional)</label>
                  <label className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-[oklch(0.97_0.008_144)]" style={inputStyle}>
                    <Paperclip size={15} style={{ color: 'var(--color-earth)', flexShrink: 0 }} />
                    <span id="fileLabel" className="truncate" style={{ color: 'oklch(0.6 0.04 144)' }}>PDF, imagem…</span>
                    <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*" className="hidden"
                      onChange={(e) => { const el = document.getElementById('fileLabel'); if (el) el.textContent = e.target.files?.[0]?.name ?? 'PDF, imagem…' }} />
                  </label>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button type="button" disabled={saving} onClick={() => setAddType(null)} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)] disabled:opacity-50" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-70" style={{ background: green, boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando…</> : 'Salvar'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Remover ═══ */}
      <Dialog open={removeId !== null} onOpenChange={(o) => !o && setRemoveId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: deep }}>Remover item?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveId(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: green, boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Manter</button>
            <button onClick={handleRemove} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5" style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}><X size={14} /> Remover</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Header() {
  return (
    <header>
      <p className="text-[11px] font-bold tracking-wide mb-1.5" style={{ color: 'var(--color-earth)', letterSpacing: '0.08em' }}>GESTÃO DA PROPRIEDADE</p>
      <h1 className="text-2xl md:text-3xl font-bold" style={{ color: deep, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Licenças, Documentos & Histórico</h1>
      <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>Organize as licenças ambientais, a documentação e o histórico da sua propriedade em um só lugar.</p>
    </header>
  )
}
