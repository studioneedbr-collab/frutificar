// Upload de arquivos para o Supabase Storage via API REST (sem SDK — usa fetch nativo).
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

// Tipos que, servidos inline de um bucket público, permitem XSS armazenado
// (SVG com <script>, HTML, XML). Bloqueados independentemente do caller.
const BLOCKED_MIME = new Set([
  'image/svg+xml',
  'text/html',
  'application/xhtml+xml',
  'application/xml',
  'text/xml',
])

// Sobe um arquivo e devolve a URL pública. `prefix` organiza em pastas (ex.: "materiais").
export async function uploadToStorage(
  file: File,
  opts: { prefix?: string; bucket?: string } = {},
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

  const declaredType = (file.type || '').toLowerCase()
  if (BLOCKED_MIME.has(declaredType)) {
    return { ok: false, error: 'Tipo de arquivo não permitido.' }
  }
  // Nunca deixa o navegador interpretar o arquivo como SVG/HTML/XML pela extensão.
  const contentType =
    declaredType && !declaredType.startsWith('text/') ? declaredType : 'application/octet-stream'

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'arquivo'
  const folder = opts.prefix ? `${opts.prefix.replace(/\/+$/, '')}/` : ''
  const path = `${folder}${Date.now()}-${safeName}`

  const res = await fetch(`${base}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: file,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { ok: false, error: `Falha no upload (${res.status}). ${detail.slice(0, 180)}` }
  }

  return { ok: true, url: `${base}/storage/v1/object/public/${bucket}/${encodeURI(path)}` }
}
