// Limite de tentativas (janela deslizante) em memória, por instância do servidor.
// Não é global entre instâncias serverless, mas já barra força bruta e abuso
// vindos de um mesmo IP/conta — que é o caso comum.
import 'server-only'
import { headers } from 'next/headers'

type Bucket = { hits: number[] }
const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) {
    if (!b.hits.length || now - b.hits[b.hits.length - 1] > windowMs) buckets.delete(key)
  }
}

/** true = permitido; false = estourou o limite. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(now, windowMs)
  const b = buckets.get(key) ?? { hits: [] }
  b.hits = b.hits.filter((t) => now - t < windowMs)
  if (b.hits.length >= limit) {
    buckets.set(key, b)
    return false
  }
  b.hits.push(now)
  buckets.set(key, b)
  return true
}

/** IP do cliente (Vercel envia x-forwarded-for / x-real-ip). */
export async function clientIp(): Promise<string> {
  try {
    const h = await headers()
    return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

export function ipFromRequest(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export const RATE_LIMIT_MESSAGE = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
