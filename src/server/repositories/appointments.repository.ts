import { prisma } from '@/lib/prisma'
import type { VisitStatus, ServiceStatus } from '@prisma/client'

export async function listVisitsByUser(userId: string) {
  return prisma.technicalVisit.findMany({
    where: { userId },
    include: { property: { select: { name: true } } },
    orderBy: { requestedDate: 'desc' },
  })
}

export async function listServiceRequestsByUser(userId: string) {
  return prisma.serviceRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createTechnicalVisit(
  userId: string,
  data: { reason: string; requestedDate: Date; propertyId?: string; notes?: string },
) {
  return prisma.technicalVisit.create({
    data: {
      userId,
      reason: data.reason,
      requestedDate: data.requestedDate,
      propertyId: data.propertyId,
      notes: data.notes,
    },
  })
}

export async function createServiceRequest(
  userId: string,
  data: { serviceType: string; description: string },
) {
  return prisma.serviceRequest.create({
    data: {
      userId,
      serviceType: data.serviceType,
      description: data.description,
    },
  })
}

export async function getVisit(id: string) {
  return prisma.technicalVisit.findUnique({ where: { id } })
}

export async function getServiceRequest(id: string) {
  return prisma.serviceRequest.findUnique({ where: { id } })
}

export async function updateVisitStatus(id: string, status: VisitStatus) {
  return prisma.technicalVisit.update({ where: { id }, data: { status } })
}

export async function updateServiceStatus(id: string, status: ServiceStatus) {
  return prisma.serviceRequest.update({ where: { id }, data: { status } })
}
