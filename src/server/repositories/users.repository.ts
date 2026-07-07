import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

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
