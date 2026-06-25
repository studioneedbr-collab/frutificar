import { prisma } from '@/lib/prisma'

export async function listPropertiesByUser(userId: string) {
  return prisma.property.findMany({
    where: { userId },
    include: {
      plots: { orderBy: { name: 'asc' } },
      _count: { select: { plots: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getProperty(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: { plots: true },
  })
}

export async function createProperty(
  userId: string,
  data: { name: string; totalAreaHa: number; location?: string },
) {
  return prisma.property.create({
    data: {
      userId,
      name: data.name,
      totalAreaHa: data.totalAreaHa,
      location: data.location,
    },
  })
}

export async function deleteProperty(id: string) {
  return prisma.property.delete({ where: { id } })
}

export async function createPlot(
  propertyId: string,
  data: { name: string; areaHa: number; status: string },
) {
  return prisma.plot.create({
    data: {
      propertyId,
      name: data.name,
      areaHa: data.areaHa,
      status: data.status,
    },
  })
}

export async function deletePlot(id: string) {
  return prisma.plot.delete({ where: { id } })
}

export async function getPlot(id: string) {
  return prisma.plot.findUnique({
    where: { id },
    include: { property: true },
  })
}
