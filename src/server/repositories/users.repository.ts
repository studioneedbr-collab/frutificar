import { prisma } from '@/lib/prisma'
import type { PlanName, Role } from '@prisma/client'

export async function listUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      subscription: {
        select: {
          status: true,
          plan: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createUser(data: {
  name: string
  email: string
  role: Role
  passwordHash: string
}) {
  return prisma.user.create({ data })
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; role?: Role },
) {
  return prisma.user.update({ where: { id }, data })
}

export async function setUserSuspended(id: string, suspended: boolean) {
  return prisma.user.update({
    where: { id },
    data: { suspendedAt: suspended ? new Date() : null },
  })
}

export async function softDeleteUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, deletedAt: true },
  })
}

/**
 * Define (ou troca) o plano do aluno. Cria a assinatura se ainda não existir
 * — assinatura concedida pelo admin, ativa por 1 ano — ou atualiza o plano da
 * assinatura já existente sem mexer no status/vigência.
 */
export async function setUserPlan(userId: string, planName: PlanName) {
  const plan = await prisma.plan.findUnique({
    where: { name: planName },
    select: { id: true },
  })
  if (!plan) throw new Error(`Plano não encontrado: ${planName}`)

  const oneYearAhead = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  return prisma.subscription.upsert({
    where: { userId },
    update: { planId: plan.id },
    create: {
      userId,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodEnd: oneYearAhead,
    },
  })
}

export async function setUserPassword(id: string, passwordHash: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
  })
}
