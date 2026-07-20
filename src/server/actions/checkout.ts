'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/action-types'
import * as asaas from '@/lib/asaas'

async function currentSub() {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { user: true, plan: true },
  })
}

// PIX / Boleto: devolve os dados da 1ª cobrança da assinatura para exibir na tela.
export async function getCharge(billing: 'PIX' | 'BOLETO'): Promise<ActionResult<{
  pixQr?: { image: string; payload: string }; boleto?: { url: string; line: string }
}>> {
  const sub = await currentSub()
  if (!sub?.gatewaySubscriptionId) return { ok: false, error: 'Assinatura não encontrada.' }
  try {
    const { data } = await asaas.listSubscriptionPayments(sub.gatewaySubscriptionId)
    const charge = data[0]
    if (!charge) return { ok: false, error: 'Cobrança ainda não gerada. Tente novamente.' }
    if (billing === 'PIX') {
      const qr = await asaas.getPixQrCode(charge.id)
      return { ok: true, data: { pixQr: { image: qr.encodedImage, payload: qr.payload } } }
    }
    return { ok: true, data: { boleto: { url: charge.bankSlipUrl ?? '', line: charge.identificationField ?? '' } } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Cartão: recebe o token gerado e recria a assinatura como CREDIT_CARD.
export async function payWithCard(creditCardToken: string): Promise<ActionResult> {
  const sub = await currentSub()
  if (!sub?.gatewayCustomerId) return { ok: false, error: 'Assinatura não encontrada.' }
  try {
    if (sub.gatewaySubscriptionId) await asaas.cancelSubscription(sub.gatewaySubscriptionId)
    const newSub = await asaas.createSubscription({
      customer: sub.gatewayCustomerId, billingType: 'CREDIT_CARD',
      value: Number(sub.plan.priceMonthly),
      nextDueDate: new Date().toISOString().slice(0, 10),
      description: `Assinatura ${sub.plan.name}`, creditCardToken,
    })
    await prisma.subscription.update({
      where: { id: sub.id }, data: { gatewaySubscriptionId: newSub.id },
    })
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Tokeniza o cartão no servidor (o PAN vem do form, vai ao Asaas e é descartado).
export async function tokenizeCard(input: {
  number: string; holderName: string; expiryMonth: string; expiryYear: string; ccv: string
  postalCode: string; addressNumber: string
}): Promise<ActionResult<{ token: string }>> {
  const sub = await currentSub()
  if (!sub?.gatewayCustomerId || !sub.user.cpfCnpj) return { ok: false, error: 'Dados incompletos.' }
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'
  try {
    const { creditCardToken } = await asaas.tokenizeCard({
      customer: sub.gatewayCustomerId,
      creditCard: { holderName: input.holderName, number: input.number, expiryMonth: input.expiryMonth, expiryYear: input.expiryYear, ccv: input.ccv },
      creditCardHolderInfo: {
        name: input.holderName, email: sub.user.email, cpfCnpj: sub.user.cpfCnpj,
        postalCode: input.postalCode, addressNumber: input.addressNumber, phone: sub.user.phone ?? '',
      },
      remoteIp: ip,
    })
    return { ok: true, data: { token: creditCardToken } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
