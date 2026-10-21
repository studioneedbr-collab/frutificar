// Upload de arquivos para o Supabase Storage via API REST (sem SDK — usa fetch nativo).
import 'server-only'
import { randomBytes } from 'crypto'

// Só roda no servidor (importado por Server Actions). As credenciais ficam em env:
//   SUPABASE_URL                → derivada do DATABASE_URL se ausente
//   SUPABASE_SERVICE_ROLE_KEY   → chave "service_role" do projeto (Settings → API)
//   SUPABASE_STORAGE_BUCKET     → nome do bucket público (default: "uploads")

// Deriva a URL base do Supabase a partir de SUPABASE_URL ou do ref no DATABASE_URL.
function resolveSupabaseUrl(): string | null {
  const explicit = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (explicit) return explicit.replace(/\/+$/, '')

  const db = process.env.DATABASE_URL ?? ''
  // Ex.: postgresql://postgres.<ref>:senha@aws-1-sa-east-1.pooler.supabase.com:6543/...
  const match = db.match(/postgres\.([a-z0-9]+):/i)
  if (match) return `https://${match[1]}.supabase.co`

  return null
}

function serviceKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || key === 'placeholder') return null
  return key
}

// true quando há URL + chave válida para realmente subir arquivos.
export function storageConfigured(): boolean {
  return Boolean(resolveSupabaseUrl() && serviceKey())
}

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export type FileKind = 'image' | 'pdf' | 'audio' | 'video' | 'office'

// Pastas permitidas no bucket (o cliente nunca escolhe um caminho livre).
const FOLDERS = ['materiais', 'podcasts', 'cursos', 'lives', 'dias-de-campo', 'servicos', 'laudos', 'propriedade', 'geral'] as const
export type UploadFolder = (typeof FOLDERS)[number]
export function toUploadFolder(v: unknown): UploadFolder {
  return (FOLDERS as readonly string[]).includes(String(v)) ? (v as UploadFolder) : 'geral'
}

const OFFICE_EXT: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

/**
 * Identifica o tipo REAL do arquivo pelos primeiros bytes (assinatura) — o
 * content-type enviado pelo navegador é ignorado, pois pode ser forjado
 * (ex.: HTML/SVG disfarçado de imagem servido pelo bucket público).
 */
export function sniffFile(head: Uint8Array, name: string): { kind: FileKind; mime: string; ext: string } | null {
  const b = (i: number) => head[i]
  const ascii = (from: number, len: number) => String.fromCharCode(...head.slice(from, from + len))
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' }
  if (ascii(1, 3) === 'PNG') return { kind: 'image', mime: 'image/png', ext: 'png' }
  if (ascii(0, 4) === 'GIF8') return { kind: 'image', mime: 'image/gif', ext: 'gif' }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return { kind: 'image', mime: 'image/webp', ext: 'webp' }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE') return { kind: 'audio', mime: 'audio/wav', ext: 'wav' }
  if (ascii(0, 5) === '%PDF-') return { kind: 'pdf', mime: 'application/pdf', ext: 'pdf' }
  if (ascii(0, 3) === 'ID3' || (b(0) === 0xff && (b(1) & 0xe0) === 0xe0)) return { kind: 'audio', mime: 'audio/mpeg', ext: 'mp3' }
  if (ascii(0, 4) === 'OggS') return { kind: 'audio', mime: 'audio/ogg', ext: 'ogg' }
  if (ascii(4, 4) === 'ftyp') {
    const brand = ascii(8, 4)
    if (brand.startsWith('M4A')) return { kind: 'audio', mime: 'audio/mp4', ext: 'm4a' }
    return { kind: 'video', mime: 'video/mp4', ext: 'mp4' }
  }
  if (b(0) === 0x50 && b(1) === 0x4b && b(2) === 0x03 && b(3) === 0x04) {
    const ext = name.toLowerCase().split('.').pop() ?? ''
    if (OFFICE_EXT[ext]) return { kind: 'office', mime: OFFICE_EXT[ext], ext }
  }
  return null
}

const KIND_LABEL: Record<FileKind, string> = {
  image: 'imagem (JPG, PNG, WEBP, GIF)',
  pdf: 'PDF',
  audio: 'áudio (MP3, M4A, WAV, OGG)',
  video: 'vídeo (MP4)',
  office: 'Word/Excel/PowerPoint (DOCX, XLSX, PPTX)',
}

// Sobe um arquivo e devolve a URL pública. Só aceita os tipos em `allow`,
// conferidos pelo conteúdo; o nome no bucket é aleatório (não adivinhável).
export async function uploadToStorage(
  file: File,
  opts: { folder: UploadFolder; allow: FileKind[]; bucket?: string },
): Promise<UploadResult> {
  const base = resolveSupabaseUrl()
  const key = serviceKey()
  const bucket = opts.bucket || process.env.SUPABASE_STORAGE_BUCKET || 'uploads'

  if (!base || !key) {
    return {
      ok: false,
      error:
        'Upload não configurado: defina SUPABASE_SERVICE_ROLE_KEY (e crie o bucket no Supabase Storage).',
    }
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const type = sniffFile(head, file.name)
  if (!type || !opts.allow.includes(type.kind)) {
    return { ok: false, error: `Formato não permitido. Envie ${opts.allow.map((k) => KIND_LABEL[k]).join(' ou ')}.` }
  }

  const path = `${opts.folder}/${Date.now()}-${randomBytes(12).toString('hex')}.${type.ext}`

  const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': type.mime,
      'x-upsert': 'false',
    },
    body: file,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('[storage] falha no upload', res.status, detail.slice(0, 300))
    return { ok: false, error: `Falha no upload (${res.status}). Tente novamente.` }
  }

  return { ok: true, url: `${base}/storage/v1/object/public/${bucket}/${path}` }
}
