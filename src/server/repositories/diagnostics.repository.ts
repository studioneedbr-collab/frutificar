import { prisma } from '@/lib/prisma'
import { AnalysisStatus } from '@prisma/client'

export async function listSoilAnalysesByUser(userId: string) {
  return prisma.soilAnalysis.findMany({
    where: { plot: { property: { userId } } },
    select: {
      id: true,
      plotId: true,
      ph: true,
      nutrients: true,
      summary: true,
      status: true,
      analysisType: true,
      analyzedAt: true,
      plot: { select: { name: true, propertyId: true } },
    },
    orderBy: { analyzedAt: 'desc' },
  })
}

export async function listPlotsByUser(userId: string) {
  return prisma.plot.findMany({
    where: { property: { userId } },
    select: { id: true, name: true, status: true },
    orderBy: { name: 'asc' },
  })
}

export async function createSoilAnalysis(
  plotId: string,
  data: {
    ph: number
    nutrients: object
    analyzedAt: Date
    status?: AnalysisStatus
    analysisType?: string
    summary?: string
  },
) {
  return prisma.soilAnalysis.create({
    data: {
      plotId,
      ph: data.ph,
      nutrients: data.nutrients,
      analyzedAt: data.analyzedAt,
      status: data.status ?? AnalysisStatus.PENDING,
      analysisType: data.analysisType ?? 'Completa',
      summary: data.summary,
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
