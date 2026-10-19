// Ping diário (Vercel Cron) no banco: o Supabase no plano grátis pausa o
// projeto após 7 dias sem atividade — com o site inteiro fora do ar.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Com CRON_SECRET definido, a Vercel envia "Authorization: Bearer <segredo>".
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, at: new Date().toISOString() })
  } catch (err) {
    console.error('[cron/keepalive] banco indisponível:', err)
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
