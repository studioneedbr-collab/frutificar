import { prisma } from '@/lib/prisma'

export async function listServices() {
  return prisma.service.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })
}

export async function listActiveServices() {
  return prisma.service.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })
}

export async function createService(data: { name: string; description: string; type: string; price: number; active: boolean }) {
  return prisma.service.create({ data })
}

export async function updateService(
  id: string,
  data: Partial<{ name: string; description: string; type: string; price: number; active: boolean }>,
) {
  return prisma.service.update({ where: { id }, data })
}

export async function deleteService(id: string) {
  return prisma.service.delete({ where: { id } })
}
