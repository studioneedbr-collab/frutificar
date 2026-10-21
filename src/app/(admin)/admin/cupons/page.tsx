// Server Component: cupons de desconto (checkout). CRUD em CuponsView.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { prisma } from '@/lib/prisma'
import { CuponsView, type CouponRow } from './cupons-view'

const fmtDay = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })

const DEMO: CouponRow[] = [
  { id: 'd1', code: 'BEMVINDO10', discount: '10%', duration: 'ONCE', plans: [], uses: '3 / 100', expires: '31 dez 2026', active: true },
  { id: 'd2', code: 'PARCEIRO', discount: 'R$ 20,00', duration: 'FOREVER', plans: ['GOLD'], uses: '1', expires: '—', active: false },
]

export default async function AdminCuponsPage() {
  if (PREVIEW_MODE) return <CuponsView initial={DEMO} preview />

  let rows: CouponRow[] = []
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    rows = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discount: c.percentOff
        ? `${c.percentOff}%`
        : Number(c.amountOff ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      duration: c.duration,
      plans: c.plans,
      uses: c.maxRedemptions != null ? `${c.redemptions} / ${c.maxRedemptions}` : String(c.redemptions),
      expires: c.expiresAt ? fmtDay(c.expiresAt) : '—',
      active: c.active && (!c.expiresAt || c.expiresAt > new Date()),
    }))
  } catch (err) {
    console.error('[admin/cupons] erro ao carregar do banco:', err)
  }
  return <CuponsView initial={rows} preview={false} />
}
