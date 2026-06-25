import { prisma } from '@/lib/prisma'

export async function listSoilAnalysesByUser(userId: string) {
  return prisma.soilAnalysis.findMany({
    where: { plot: { property: { userId } } },
    include: { plot: { select: { name: true, propertyId: true } } },
    orderBy: { analyzedAt: 'desc' },
  })
}

export async function createSoilAnalysis(
  plotId: string,
  data: { ph: number; nutrients: object; analyzedAt: Date },
) {
  return prisma.soilAnalysis.create({
    data: {
      plotId,
      ph: data.ph,
      nutrients: data.nutrients,
      analyzedAt: data.analyzedAt,
    },
  })
}

export async function getPlotOwnerUserId(plotId: string): Promise<string | null> {
  const plot = await prisma.plot.findUnique({
    where: { id: plotId },
    include: { property: { select: { userId: true } } },
  })
  return plot?.property.userId ?? null
}
