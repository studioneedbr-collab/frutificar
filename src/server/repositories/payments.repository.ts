import { prisma } from '@/lib/prisma'

export async function listPaymentsByUser(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { paidAt: 'desc' },
  })
}

export async function createPayment(
  userId: string,
  data: { amount: number; description?: string; method?: string; subscriptionId?: string },
) {
  return prisma.payment.create({
    data: {
      userId,
      amount: data.amount,
      status: 'PAID',
      ...(data.method !== undefined ? { method: data.method } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.subscriptionId !== undefined ? { subscriptionId: data.subscriptionId } : {}),
    },
  })
}
