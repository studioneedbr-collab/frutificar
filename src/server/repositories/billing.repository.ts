import { prisma } from '@/lib/prisma'
import type { SubscriptionStatus } from '@prisma/client'

export async function setBillingIdentity(userId: string, cpfCnpj: string, phone: string) {
  return prisma.user.update({ where: { id: userId }, data: { cpfCnpj, phone } })
}

export async function createPendingSubscription(params: {
  userId: string; planId: string; gatewayCustomerId: string; gatewaySubscriptionId: string; periodEnd: Date
}) {
  return prisma.subscription.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId, planId: params.planId, status: 'PENDING',
      currentPeriodEnd: params.periodEnd,
      gatewayCustomerId: params.gatewayCustomerId,
      gatewaySubscriptionId: params.gatewaySubscriptionId,
    },
    update: {
      planId: params.planId, status: 'PENDING',
      gatewayCustomerId: params.gatewayCustomerId,
      gatewaySubscriptionId: params.gatewaySubscriptionId,
    },
  })
}

export async function getSubscriptionByGatewaySub(gatewaySubscriptionId: string) {
  return prisma.subscription.findFirst({
    where: { gatewaySubscriptionId },
    include: { plan: { select: { priceMonthly: true } } },
  })
}

export async function recordPaymentAndActivate(params: {
  gatewayPaymentId: string; userId: string; subscriptionId: string
  amount: number; method: string; status: SubscriptionStatus; periodEnd?: Date
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({ where: { gatewayPaymentId: params.gatewayPaymentId } })
    // Idempotência: o Asaas dispara PAYMENT_CONFIRMED e PAYMENT_RECEIVED para o mesmo
    // pagamento. Se já processamos este gatewayPaymentId, não estende o período de novo.
    if (existing) return
    await tx.payment.create({
      data: {
        gatewayPaymentId: params.gatewayPaymentId, userId: params.userId,
        subscriptionId: params.subscriptionId, amount: params.amount,
        status: 'PAID', method: params.method,
      },
    })
    await tx.subscription.update({
      where: { id: params.subscriptionId },
      data: { status: params.status, ...(params.periodEnd ? { currentPeriodEnd: params.periodEnd } : {}) },
    })
    await tx.user.updateMany({
      where: { id: params.userId, emailVerified: null },
      data: { emailVerified: new Date() },
    })
  })
}

export async function markSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
  return prisma.subscription.update({ where: { id: subscriptionId }, data: { status } })
}
