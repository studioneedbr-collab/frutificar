'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/action-types'

async function requireAdmin() {
  const session = await auth()
  return session?.user?.role === 'ADMIN'
}

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Código com ao menos 3 caracteres.')
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, 'Use só letras, números, - e _ no código.'),
    kind: z.enum(['PERCENT', 'AMOUNT']),
    value: z.coerce.number().positive('Informe o desconto.'),
    duration: z.enum(['ONCE', 'FOREVER']),
    plans: z.array(z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD'])).default([]),
    maxRedemptions: z.coerce.number().int().positive().max(100000).nullable().optional(),
    expiresAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .refine((d) => d.kind !== 'PERCENT' || d.value <= 100, { message: 'Percentual máximo é 100%.', path: ['value'] })
  .refine((d) => d.kind !== 'AMOUNT' || d.value <= 10000, { message: 'Desconto máximo de R$ 10.000.', path: ['value'] })

export async function createCouponAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  const parsed = couponSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const d = parsed.data
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: d.code,
        percentOff: d.kind === 'PERCENT' ? Math.round(d.value) : null,
        amountOff: d.kind === 'AMOUNT' ? d.value : null,
        duration: d.duration,
        plans: d.plans,
        maxRedemptions: d.maxRedemptions ?? null,
        // Vale até o fim do dia escolhido (horário de Brasília).
        expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59-03:00`) : null,
      },
    })
    revalidatePath('/admin/cupons')
    return { ok: true, data: { id: coupon.id } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Já existe um cupom com esse código.' }
    }
    console.error('[createCouponAction]', err)
    return { ok: false, error: 'Erro ao criar cupom.' }
  }
}

export async function toggleCouponAction(id: string, active: boolean): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  if (typeof id !== 'string' || id.length > 64) return { ok: false, error: 'Cupom inválido.' }
  try {
    await prisma.coupon.update({ where: { id }, data: { active: Boolean(active) } })
    revalidatePath('/admin/cupons')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar cupom.' }
  }
}

/** Exclui se nunca foi usado; senão só desativa (mantém o histórico). */
export async function deleteCouponAction(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  if (typeof id !== 'string' || id.length > 64) return { ok: false, error: 'Cupom inválido.' }
  try {
    const used = await prisma.subscription.count({ where: { couponId: id } })
    const coupon = await prisma.coupon.findUnique({ where: { id }, select: { redemptions: true } })
    if (!coupon) return { ok: false, error: 'Cupom não encontrado.' }
    if (used > 0 || coupon.redemptions > 0) {
      await prisma.coupon.update({ where: { id }, data: { active: false } })
      revalidatePath('/admin/cupons')
      return { ok: true, data: { deleted: false } }
    }
    await prisma.coupon.delete({ where: { id } })
    revalidatePath('/admin/cupons')
    return { ok: true, data: { deleted: true } }
  } catch {
    return { ok: false, error: 'Erro ao excluir cupom.' }
  }
}
