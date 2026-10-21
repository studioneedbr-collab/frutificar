import 'server-only'

import { baseUrl, escapeHtml, renderEmail, sendBrevoEmail } from '@/lib/email'

/**
 * Alertas de erro por e-mail para o admin (ADMIN_NOTIFICATION_EMAIL via Brevo).
 *
 * - Sempre loga no console (aparece nos logs da Vercel).
 * - Só envia e-mail em produção; em dev apenas loga.
 * - Limites (memória, por instância): 1 e-mail por contexto a cada 15 min e
 *   no máximo 20 e-mails por hora no total — evita inundar a caixa de entrada.
 * - Nunca lança: falhar ao avisar não pode derrubar a requisição original.
 * - Nunca envia segredos, tokens, senhas, CPF, dados de cartão, stack trace ou
 *   corpo de requisição.
 */

type ExtraValue = string | number | boolean | null | undefined

const PER_CONTEXT_WINDOW_MS = 15 * 60_000
const GLOBAL_WINDOW_MS = 60 * 60_000
const GLOBAL_MAX_PER_WINDOW = 20
const MAX_MESSAGE_LENGTH = 500
const MAX_EXTRA_VALUE_LENGTH = 200
const MAX_EXTRA_ENTRIES = 15

const SENSITIVE_KEY = /(token|senha|password|secret|cpf|authorization|api[_-]?key)/i

const lastSentByContext = new Map<string, number>()
let globalSends: number[] = []

/** Remove credenciais que possam aparecer dentro de mensagens de erro. */
function redact(text: string): string {
  return (
    text
      // credenciais em URLs de conexão: postgres://user:senha@host → postgres://***@host
      .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, '$1***@')
      // "Bearer xxx"
      .replace(/bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer ***')
      // chaves no formato sk-..., $aact_..., xkeysib-...
      .replace(/\b(sk-[A-Za-z0-9_-]{8,}|\$aact_[A-Za-z0-9_$-]+|xkeysib-[A-Za-z0-9-]+)/g, '***')
      // CPF (com ou sem pontuação)
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '***')
      // sequências longas de dígitos (cartão)
      .replace(/\b\d{13,19}\b/g, '***')
  )
}

function errorMessage(err: unknown): string {
  let msg: string
  if (err instanceof Error) {
    msg = `${err.name}: ${err.message}`
    const digest = (err as { digest?: unknown }).digest
    if (typeof digest === 'string' && digest) msg += ` (digest ${digest})`
  } else if (typeof err === 'string') {
    msg = err
  } else {
    try {
      msg = JSON.stringify(err) ?? String(err)
    } catch {
      msg = String(err)
    }
  }
  msg = redact(msg)
  return msg.length > MAX_MESSAGE_LENGTH ? `${msg.slice(0, MAX_MESSAGE_LENGTH)}…` : msg
}

/** Reserva uma vaga de envio (respeitando os limites). Retorna false se estourou. */
function takeSlot(context: string, now: number): boolean {
  const last = lastSentByContext.get(context)
  if (last !== undefined && now - last < PER_CONTEXT_WINDOW_MS) return false

  globalSends = globalSends.filter((t) => now - t < GLOBAL_WINDOW_MS)
  if (globalSends.length >= GLOBAL_MAX_PER_WINDOW) return false

  globalSends.push(now)
  lastSentByContext.set(context, now)

  // Higiene: evita que o Map cresça sem limite em instâncias longas.
  if (lastSentByContext.size > 500) {
    for (const [k, t] of lastSentByContext) {
      if (now - t >= PER_CONTEXT_WINDOW_MS) lastSentByContext.delete(k)
    }
  }
  return true
}

export async function reportError(
  context: string,
  err: unknown,
  extra?: Record<string, string | number | boolean | null | undefined>,
): Promise<void> {
  try {
    console.error('[alerta]', context, err)
  } catch {
    // console indisponível — ignora
  }

  try {
    if (process.env.NODE_ENV !== 'production') return

    const to = process.env.ADMIN_NOTIFICATION_EMAIL
    if (!to) return

    const now = Date.now()
    const ctx = (context || 'sem contexto').slice(0, 120)
    if (!takeSlot(ctx, now)) return

    const when = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(now))

    const details = [
      { label: 'Contexto', value: escapeHtml(ctx) },
      { label: 'Ambiente', value: escapeHtml(process.env.VERCEL_ENV ?? 'desconhecido') },
      { label: 'Horário', value: escapeHtml(`${when} (Brasília)`) },
    ]

    if (extra) {
      const entries = Object.entries(extra as Record<string, ExtraValue>)
        .filter(([k, v]) => !SENSITIVE_KEY.test(k) && v !== undefined)
        .slice(0, MAX_EXTRA_ENTRIES)
      for (const [k, v] of entries) {
        const raw = redact(String(v))
        const value = raw.length > MAX_EXTRA_VALUE_LENGTH ? `${raw.slice(0, MAX_EXTRA_VALUE_LENGTH)}…` : raw
        details.push({ label: escapeHtml(k.slice(0, 40)), value: escapeHtml(value) })
      }
    }

    const htmlContent = renderEmail({
      preheader: `Erro em ${ctx}`,
      eyebrow: 'Alerta da plataforma',
      heading: 'Ocorreu um erro no servidor',
      paragraphs: [
        'Um erro foi registrado na plataforma Frutificar Digital. Mensagem:',
        `<code style="font-family:Menlo,Consolas,monospace;font-size:13px;word-break:break-word;">${escapeHtml(errorMessage(err))}</code>`,
        `Veja os logs completos no painel da Vercel. Site: ${escapeHtml(baseUrl())}`,
      ],
      details,
      note: 'Avisos repetidos do mesmo contexto são agrupados (no máximo 1 e-mail a cada 15 minutos).',
    })

    await sendBrevoEmail({
      to: [{ email: to }],
      subject: `⚠️ Erro na plataforma: ${ctx}`,
      htmlContent,
    })
  } catch (alertErr) {
    try {
      console.error('[alerta] falha ao enviar o alerta:', alertErr)
    } catch {
      // ignora
    }
  }
}
