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

export async function listAllServiceRequests() {
  return prisma.serviceRequest.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
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

// ─── Dashboard (métricas + listas recentes) ───────────────

export async function getDashboardStats() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [activeStudents, activeSubscriptions, publishedCourses, revenue] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', deletedAt: null } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.course.count({ where: { published: true, deletedAt: null } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', paidAt: { gte: startOfMonth } },
    }),
  ])

  return {
    activeStudents,
    activeSubscriptions,
    publishedCourses,
    monthlyRevenue: revenue._sum.amount ? Number(revenue._sum.amount) : 0,
  }
}

export async function listRecentUsers(limit = 6) {
  return prisma.user.findMany({
    where: { deletedAt: null },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: { select: { status: true, plan: { select: { name: true } } } },
    },
  })
}

export async function listRecentCourses(limit = 4) {
  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      published: true,
      _count: { select: { enrollments: true } },
    },
  })

  // Conta as aulas por curso (lessons ficam sob modules — sem _count aninhado direto).
  return Promise.all(
    courses.map(async (c) => ({
      id: c.id,
      title: c.title,
      published: c.published,
      enrolled: c._count.enrollments,
      lessons: await prisma.lesson.count({ where: { module: { courseId: c.id } } }),
    })),
  )
}

// ─── Agendamentos (todas as visitas técnicas) ─────────────

export async function listAllVisits() {
  return prisma.technicalVisit.findMany({
    include: {
      user: { select: { name: true } },
      property: { select: { name: true } },
    },
    orderBy: { requestedDate: 'desc' },
  })
}

export async function assignVisit(
  id: string,
  data: { agronomist?: string; requestedDate?: Date },
) {
  return prisma.technicalVisit.update({
    where: { id },
    data: {
      ...(data.agronomist !== undefined ? { agronomist: data.agronomist } : {}),
      ...(data.requestedDate !== undefined ? { requestedDate: data.requestedDate } : {}),
    },
  })
}
