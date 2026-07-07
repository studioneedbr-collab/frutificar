import { prisma } from '@/lib/prisma'
import { PlanName } from '@prisma/client'

export async function listResources() {
  return prisma.downloadableResource.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function createResource(data: {
  title: string
  description?: string
  fileUrl?: string
  category: string
  requiredPlan?: PlanName
}) {
  return prisma.downloadableResource.create({
    data: {
      title: data.title,
      description: data.description ?? '',
      fileUrl: data.fileUrl ?? '',
      category: data.category,
      requiredPlan: data.requiredPlan ?? PlanName.PREMIUM,
    },
  })
}

export async function updateResource(
  id: string,
  data: Partial<{
    title: string
    description: string
    fileUrl: string
    category: string
    requiredPlan: PlanName
  }>,
) {
  return prisma.downloadableResource.update({
    where: { id },
    data,
  })
}

export async function deleteResource(id: string) {
  return prisma.downloadableResource.delete({ where: { id } })
}
