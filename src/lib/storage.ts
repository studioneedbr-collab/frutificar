// Upload de arquivos para o Supabase Storage via API REST (sem SDK — usa fetch nativo).
import 'server-only'
import { randomBytes } from 'crypto'

// Só roda no servidor (importado por Server Actions). As credenciais ficam em env:
//   SUPABASE_URL                → derivada do DATABASE_URL se ausente
//   SUPABASE_SERVICE_ROLE_KEY   → chave "service_role" do projeto (Settings → API)
//   SUPABASE_STORAGE_BUCKET     → nome do bucket público (default: "uploads")
//   SUPABASE_PRIVATE_BUCKET     → bucket PRIVADO p/ documentos e laudos dos alunos
//                                 (default: "privado"; criado automaticamente)

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

export function publicBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || 'uploads'
}

export function privateBucketName(): string {
  return process.env.SUPABASE_PRIVATE_BUCKET || 'privado'
}

// Referência gravada no banco para arquivos privados (nunca vira link público):
//   storage-private://<pasta>/<arquivo>
export const PRIVATE_REF_PREFIX = 'storage-private://'

// Caminho no formato que nós mesmos geramos ("<pasta>/<arquivo>", sem "..").
const OBJECT_PATH_RE = /^[a-z0-9-]+\/[A-Za-z0-9._-]+$/i

export function isPrivateRef(v: string | null | undefined): boolean {
  return typeof v === 'string' && v.startsWith(PRIVATE_REF_PREFIX)
}

// "storage-private://pasta/arquivo" → "pasta/arquivo" (ou null se inválido).
export function privateRefPath(ref: string): string | null {
  if (!isPrivateRef(ref)) return null
  const path = ref.slice(PRIVATE_REF_PREFIX.length)
  return OBJECT_PATH_RE.test(path) ? path : null
}

function authHeaders(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}` }
}

// Cache em memória: o bucket privado só precisa ser conferido 1x por instância.
let privateBucketReady: Promise<boolean> | null = null

/**
 * Garante que o bucket privado existe (cria com public:false se faltar).
 * "Já existe" conta como sucesso. Em caso de falha, tenta de novo na próxima chamada.
 */
export function ensurePrivateBucket(): Promise<boolean> {
  if (privateBucketReady) return privateBucketReady
  const base = resolveSupabaseUrl()
  const key = serviceKey()
  if (!base || !key) return Promise.resolve(false)
  const bucket = privateBucketName()

  privateBucketReady = (async () => {
    try {
      const res = await fetch(`${base}/storage/v1/bucket`, {
        method: 'POST',
        headers: { ...authHeaders(key), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bucket, name: bucket, public: false }),
      })
      if (res.ok) return true
      const detail = await res.text().catch(() => '')
      // Supabase responde 400/409 com "already exists" quando o bucket já existe.
      if (res.status === 409 || /already exists|duplicate/i.test(detail)) return true
      console.error('[storage] falha ao criar bucket privado', res.status, detail.slice(0, 300))
      return false
    } catch (err) {
      console.error('[storage] falha ao criar bucket privado', err)
      return false
    }
  })()

  const pending = privateBucketReady
  pending.then((ok) => {
    if (!ok && privateBucketReady === pending) privateBucketReady = null
  })
  return pending
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

// Sobe um arquivo. Só aceita os tipos em `allow`, conferidos pelo conteúdo;
// o nome no bucket é aleatório (não adivinhável).
//  - visibility 'public' (padrão): bucket público, devolve a URL pública
//    (materiais, podcasts e demais uploads do admin).
//  - visibility 'private': bucket privado, devolve a referência
//    "storage-private://<pasta>/<arquivo>" — o arquivo só abre por link
//    assinado gerado em /api/arquivos (documentos e laudos dos alunos).
export async function uploadToStorage(
  file: File,
  opts: { folder: UploadFolder; allow: FileKind[]; bucket?: string; visibility?: 'public' | 'private' },
): Promise<UploadResult> {
  const base = resolveSupabaseUrl()
  const key = serviceKey()
  const isPrivate = opts.visibility === 'private'
  const bucket = isPrivate ? privateBucketName() : opts.bucket || publicBucketName()

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

  if (isPrivate && !(await ensurePrivateBucket())) {
    return { ok: false, error: 'Armazenamento privado indisponível. Tente novamente.' }
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

  if (isPrivate) return { ok: true, url: `${PRIVATE_REF_PREFIX}${path}` }
  return { ok: true, url: `${base}/storage/v1/object/public/${bucket}/${path}` }
}

/**
 * Gera um link assinado (temporário) para um arquivo privado
 * ("storage-private://..."). Devolve a URL completa ou null se falhar.
 */
export async function createSignedUrl(ref: string, expiresInSeconds = 120): Promise<string | null> {
  const base = resolveSupabaseUrl()
  const key = serviceKey()
  const path = privateRefPath(ref)
  if (!base || !key || !path) return null
  try {
    const res = await fetch(`${base}/storage/v1/object/sign/${privateBucketName()}/${path}`, {
      method: 'POST',
      headers: { ...authHeaders(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[storage] falha ao assinar link', res.status, path)
      return null
    }
    const data = (await res.json()) as { signedURL?: string; signedUrl?: string }
    const signed = data.signedURL ?? data.signedUrl
    if (!signed) return null
    if (/^https?:\/\//i.test(signed)) return signed
    // A API devolve o caminho relativo a /storage/v1 (ex.: "/object/sign/...?token=...").
    return `${base}/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`
  } catch (err) {
    console.error('[storage] falha ao assinar link', path, err)
    return null
  }
}

/**
 * Remove do Storage um arquivo enviado por nós — a partir da URL pública ou
 * da referência privada ("storage-private://..."). Ignora URLs externas
 * (YouTube, Drive…). Nunca lança erro: falha só é logada, para não travar a
 * exclusão do registro no banco.
 */
export async function deleteFromStorage(publicUrl: string | null | undefined): Promise<void> {
  const base = resolveSupabaseUrl()
  const key = serviceKey()
  if (!publicUrl || !base || !key) return
  let objectPath: string // "<bucket>/<pasta>/<arquivo>"
  if (isPrivateRef(publicUrl)) {
    const path = privateRefPath(publicUrl)
    if (!path) return
    objectPath = `${privateBucketName()}/${path}`
  } else {
    const prefix = `${base}/storage/v1/object/public/`
    if (!publicUrl.startsWith(prefix)) return
    objectPath = publicUrl.slice(prefix.length)
  }
  // Só caminhos no formato que nós mesmos geramos (sem "..").
  if (!/^[a-z0-9_-]+\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/i.test(objectPath)) return
  try {
    const res = await fetch(`${base}/storage/v1/object/${objectPath}`, {
      method: 'DELETE',
      headers: authHeaders(key),
    })
    if (!res.ok && res.status !== 404) console.error('[storage] falha ao apagar', res.status, objectPath)
  } catch (err) {
    console.error('[storage] falha ao apagar', objectPath, err)
  }
}

/**
 * Apaga um objeto pelo bucket + caminho (usado pela limpeza do admin).
 * Devolve true se apagou (ou já não existia).
 */
export async function deleteStorageObject(bucket: string, path: string): Promise<boolean> {
  const base = resolveSupabaseUrl()
  const key = serviceKey()
  if (!base || !key) return false
  if (!/^[a-z0-9_-]+$/i.test(bucket) || path.includes('..') || !/^[A-Za-z0-9._/-]+$/.test(path)) return false
  try {
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: authHeaders(key),
    })
    if (!res.ok && res.status !== 404) {
      console.error('[storage] falha ao apagar', res.status, bucket, path)
      return false
    }
    return true
  } catch (err) {
    console.error('[storage] falha ao apagar', bucket, path, err)
    return false
  }
}

export type StorageObject = { path: string; size: number; updatedAt: string | null }

type ListEntry = {
  name: string
  id: string | null
  updated_at?: string | null
  created_at?: string | null
  metadata?: { size?: number } | null
}

/**
 * Lista todos os arquivos de um bucket (percorre as pastas recursivamente).
 * Lança erro se o Storage não responder — quem chama decide o que mostrar.
 * Bucket inexistente → lista vazia.
 */
export async function listStorageObjects(bucket: string, prefix = ''): Promise<StorageObject[]> {
  const base = resolveSupabaseUrl()
  const key = serviceKey()
  if (!base || !key) throw new Error('Storage não configurado.')

  const out: StorageObject[] = []
  const LIMIT = 1000
  const queue: string[] = [prefix.replace(/^\/+|\/+$/g, '')]
  let guard = 0

  while (queue.length) {
    const folder = queue.shift() as string
    if (++guard > 5000) break // proteção contra laço infinito
    for (let offset = 0; ; offset += LIMIT) {
      const res = await fetch(`${base}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: { ...authHeaders(key), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: folder, limit: LIMIT, offset, sortBy: { column: 'name', order: 'asc' } }),
        cache: 'no-store',
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        if ((res.status === 400 || res.status === 404) && /not.?found/i.test(detail)) return out
        throw new Error(`Falha ao listar o bucket ${bucket} (${res.status}).`)
      }
      const items = (await res.json()) as ListEntry[]
      for (const it of items) {
        const full = folder ? `${folder}/${it.name}` : it.name
        if (it.id === null) {
          queue.push(full) // pasta
        } else if (it.name !== '.emptyFolderPlaceholder') {
          out.push({
            path: full,
            size: Number(it.metadata?.size ?? 0),
            updatedAt: it.updated_at ?? it.created_at ?? null,
          })
        }
      }
      if (items.length < LIMIT) break
    }
  }
  return out
}
