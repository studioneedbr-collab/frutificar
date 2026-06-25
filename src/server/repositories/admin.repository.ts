import { prisma } from '@/lib/prisma'
import { VisitStatus, ServiceStatus } from '@prisma/client'

// ─── Solicitações (visitas técnicas) ──────────────────────

export async function listPendingVisits() {
  return prisma.technicalVisit.findMany({
    where: { status: VisitStatus.REQUESTED },
    include: {
      user: { select: { name: true, email: true } },
      property: { select: { name: true } },
    },
    orderBy: { requestedDate: 'asc' },
  })
}

export async function setVisitStatus(id: string, status: VisitStatus) {
  return prisma.technicalVisit.update({
    where: { id },
    data: { status },
  })
}

// ─── Solicitações (pedidos de serviço) ────────────────────

export async function listOpenServiceRequests() {
  return prisma.serviceRequest.findMany({
    where: { status: ServiceStatus.OPEN },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function setServiceStatus(
  id: string,
  status: ServiceStatus,
  adminResponse?: string,
) {
  return prisma.serviceRequest.update({
    where: { id },
    data: { status, ...(adminResponse !== undefined ? { adminResponse } : {}) },
  })
}

// ─── Módulos de curso ─────────────────────────────────────

export async function addModule(courseId: string, title: string) {
  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const nextOrder = (last?.order ?? 0) + 1

  return prisma.module.create({
    data: { courseId, title, order: nextOrder },
  })
}

export async function removeModule(moduleId: string) {
  return prisma.module.delete({ where: { id: moduleId } })
}

export async function setCoursePublished(courseId: string, published: boolean) {
  return prisma.course.update({
    where: { id: courseId },
    data: { published },
  })
}

export async function listCourseModules(courseId: string) {
  return prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: { _count: { select: { lessons: true } } },
  })
}
