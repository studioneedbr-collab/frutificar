// Limpeza do Storage: encontra arquivos que nenhum registro do banco usa mais
// ("órfãos") e os apaga — libera espaço no Supabase.
//
// Regras de segurança:
//  - Um arquivo só é órfão se o caminho dele NÃO aparece em nenhuma coluna de
//    texto/JSON do banco (varredura genérica + campos conhecidos).
//  - Arquivos modificados nas últimas 24h nunca entram (upload pode estar em
//    andamento, com o registro ainda não salvo).
//  - deleteOrphans() recalcula tudo antes de apagar: só some o que continua
//    órfão agora — a lista vinda do navegador nunca é confiada às cegas.
import 'server-only'
import { prisma } from '@/lib/prisma'
import {
  listStorageObjects,
  deleteStorageObject,
  publicBucketName,
  privateBucketName,
  type StorageObject,
} from '@/lib/storage'

const RECENT_MS = 24 * 60 * 60 * 1000

export type BucketUsage = {
  bucket: string
  label: string
  files: number
  bytes: number
}

export type OrphanFile = {
  bucket: string
  path: string
  size: number
  updatedAt: string | null
}

export type StorageReport = {
  buckets: BucketUsage[]
  orphans: OrphanFile[]
  orphanBytes: number
  /** Arquivos sem uso, mas recentes demais (< 24h) para apagar. */
  recentSkipped: number
}

// ─── Referências no banco ─────────────────────────────────

/**
 * Campos conhecidos que guardam arquivos do Storage (checados pelo TypeScript):
 * Material.fileUrl, DownloadableResource.fileUrl, PodcastEpisode.audioUrl/embedUrl,
 * Podcast.coverImage, Course.coverImage, Certificate.certificateUrl,
 * PropertyDocument.fileUrl, SoilAnalysis.nutrients.fileUrl (JSON) e AppSetting.value.
 */
async function knownReferences(): Promise<string[]> {
  const [materials, resources, episodes, podcasts, courses, certificates, docs, analyses, settings] =
    await Promise.all([
      prisma.material.findMany({ select: { fileUrl: true } }),
      prisma.downloadableResource.findMany({ select: { fileUrl: true } }),
      prisma.podcastEpisode.findMany({ select: { audioUrl: true, embedUrl: true } }),
      prisma.podcast.findMany({ select: { coverImage: true } }),
      prisma.course.findMany({ select: { coverImage: true } }),
      prisma.certificate.findMany({ select: { certificateUrl: true } }),
      prisma.propertyDocument.findMany({ where: { fileUrl: { not: null } }, select: { fileUrl: true } }),
      prisma.soilAnalysis.findMany({ select: { nutrients: true } }),
      prisma.appSetting.findMany({ select: { value: true } }),
    ])

  const refs: (string | null | undefined)[] = [
    ...materials.map((m) => m.fileUrl),
    ...resources.map((r) => r.fileUrl),
    ...episodes.flatMap((e) => [e.audioUrl, e.embedUrl]),
    ...podcasts.map((p) => p.coverImage),
    ...courses.map((c) => c.coverImage),
    ...certificates.map((c) => c.certificateUrl),
    ...docs.map((d) => d.fileUrl),
    ...analyses.map((a) => {
      const n = a.nutrients as { fileUrl?: unknown } | null
      return n && typeof n === 'object' && typeof n.fileUrl === 'string' ? n.fileUrl : null
    }),
    ...settings.map((s) => s.value),
  ]
  return refs.filter((v): v is string => typeof v === 'string' && v.length > 0)
}

const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`

/**
 * Varredura genérica: toda coluna de texto/JSON/array de todas as tabelas do
 * schema atual. Pega também campos novos ou textos livres (ex.: descrição com
 * link de arquivo) que não estejam na lista acima. Só volta valores que citam
 * o Storage, para não trazer o banco inteiro para a memória.
 */
async function scannedReferences(): Promise<string[]> {
  const columns = await prisma.$queryRawUnsafe<{ table_name: string; column_name: string }[]>(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND data_type IN ('text', 'character varying', 'json', 'jsonb', 'ARRAY')
        AND table_name NOT LIKE '\\_prisma%'`,
  )
  if (columns.length === 0) return []

  const parts = columns.map((c) => {
    const col = `${quoteIdent(c.column_name)}::text`
    return `SELECT ${col} AS v FROM ${quoteIdent(c.table_name)} WHERE ${col} ILIKE '%storage%'`
  })
  const rows = await prisma.$queryRawUnsafe<{ v: string | null }[]>(parts.join('\nUNION ALL\n'))
  return rows.map((r) => r.v).filter((v): v is string => typeof v === 'string' && v.length > 0)
}

// Texto único com todas as referências (decodificado também, p/ URLs com %20 etc.).
async function referenceCorpus(): Promise<string> {
  const [known, scanned] = await Promise.all([knownReferences(), scannedReferences()])
  const all = [...known, ...scanned]
  const decoded = all.map((v) => {
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  })
  return [...all, ...decoded].join('\n')
}

// ─── Relatório ─────────────────────────────────────────────

function isRecent(o: StorageObject, now: number): boolean {
  if (!o.updatedAt) return true // sem data → trata como recente (não apaga)
  const t = new Date(o.updatedAt).getTime()
  return Number.isNaN(t) || now - t < RECENT_MS
}

/** Lista os arquivos dos dois buckets e separa os que ninguém usa. */
export async function findOrphans(): Promise<StorageReport> {
  const buckets = [
    { bucket: publicBucketName(), label: 'Público (materiais, podcasts, capas)' },
    { bucket: privateBucketName(), label: 'Privado (documentos e laudos)' },
  ].filter((b, i, arr) => arr.findIndex((x) => x.bucket === b.bucket) === i)

  // Lista o Storage ANTES de ler o banco: um arquivo que acabou de subir e já
  // foi salvo no banco nunca aparece como órfão.
  const listed = await Promise.all(buckets.map((b) => listStorageObjects(b.bucket)))
  const corpus = await referenceCorpus()
  const now = Date.now()

  const usage: BucketUsage[] = []
  const orphans: OrphanFile[] = []
  let recentSkipped = 0

  buckets.forEach((b, i) => {
    const objects = listed[i]
    usage.push({
      bucket: b.bucket,
      label: b.label,
      files: objects.length,
      bytes: objects.reduce((sum, o) => sum + o.size, 0),
    })
    for (const o of objects) {
      if (corpus.includes(o.path)) continue
      if (isRecent(o, now)) {
        recentSkipped++
        continue
      }
      orphans.push({ bucket: b.bucket, path: o.path, size: o.size, updatedAt: o.updatedAt })
    }
  })

  orphans.sort((a, b) => b.size - a.size)
  return {
    buckets: usage,
    orphans,
    orphanBytes: orphans.reduce((sum, o) => sum + o.size, 0),
    recentSkipped,
  }
}

/**
 * Apaga os arquivos pedidos — mas só os que AINDA são órfãos (recalcula agora).
 * Devolve quantos foram apagados e quanto espaço foi liberado.
 */
export async function deleteOrphans(
  targets: { bucket: string; path: string }[],
): Promise<{ deleted: number; bytes: number; skipped: number }> {
  const report = await findOrphans()
  const current = new Map(report.orphans.map((o) => [`${o.bucket}/${o.path}`, o]))

  let deleted = 0
  let bytes = 0
  let skipped = 0
  const seen = new Set<string>()

  for (const t of targets) {
    const key = `${t.bucket}/${t.path}`
    if (seen.has(key)) continue
    seen.add(key)
    const orphan = current.get(key)
    if (!orphan) {
      skipped++
      continue
    }
    if (await deleteStorageObject(orphan.bucket, orphan.path)) {
      deleted++
      bytes += orphan.size
    } else {
      skipped++
    }
  }
  return { deleted, bytes, skipped }
}
