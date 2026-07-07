import { prisma } from '@/lib/prisma'
import { LiveStatus, PlanName } from '@prisma/client'

export async function listLives() {
  return prisma.live.findMany({
    orderBy: { scheduledAt: 'desc' },
  })
}

export async function createLive(data: {
  title: string
  youtubeVideoId?: string
  scheduledAt: Date
  status?: LiveStatus
  requiredPlan?: PlanName
}) {
  return prisma.live.create({
    data: {
      title: data.title,
      youtubeVideoId: data.youtubeVideoId ?? '',
      scheduledAt: data.scheduledAt,
      status: data.status ?? LiveStatus.SCHEDULED,
      requiredPlan: data.requiredPlan ?? PlanName.ESSENCIAL,
    },
  })
}

export async function updateLive(
  id: string,
  data: {
    title?: string
    youtubeVideoId?: string
    scheduledAt?: Date
    status?: LiveStatus
    requiredPlan?: PlanName
  },
) {
  return prisma.live.update({
    where: { id },
    data,
  })
}

export async function setLiveStatus(id: string, status: LiveStatus) {
  return prisma.live.update({
    where: { id },
    data: { status },
  })
}

export async function deleteLive(id: string) {
  return prisma.live.delete({
    where: { id },
  })
}
