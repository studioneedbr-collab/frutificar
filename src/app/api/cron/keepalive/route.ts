// Ping diário (Vercel Cron) no banco: o Supabase no plano grátis pausa o
// projeto após 7 dias sem atividade — com o site inteiro fora do ar.
// Aproveita a execução diária para um health check: banco no ar e variáveis
// de ambiente críticas (pagamentos, e-mail, IA) configuradas.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reportError } from '@/lib/alerts'

export const dynamic = 'force-dynamic'

// Sem estas variáveis, pagamentos/e-mails/IA param silenciosamente.
const REQUIRED_ENV = ['ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN', 'BREVO_API_KEY', 'OPENAI_API_KEY'] as const

function missingEnvNames(): string[] {
  return REQUIRED_ENV.filter((name) => {
    const v = process.env[name]
    return !v || v.trim() === '' || v === 'placeholder'
  })
}

export async function GET(req: Request) {
  // Com CRON_SECRET definido, a Vercel envia "Authorization: Bearer <segredo>".
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Só os NOMES das variáveis ausentes vão no alerta — nunca os valores.
  const missing = missingEnvNames()
  if (missing.length > 0) {
    await reportError('configuração', new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`), {
      ausentes: missing.join(', '),
    })
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch (err) {
    await reportError('banco indisponível (cron keepalive)', err)
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
