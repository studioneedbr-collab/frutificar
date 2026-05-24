import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function findAllPublishedCourses() {
  return prisma.course.findMany({
    where: { published: true, deletedAt: null },
    select: {
      id: true, title: true, slug: true, description: true,
      coverImage: true, type: true,
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findCourseBySlug(slug: string) {
  return prisma.course.findFirst({
    where: { slug, published: true, deletedAt: null },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  })
}

export async function findCoursesByUserPlan(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { planId: true },
  })
  if (!subscription) return []

  const accessibleCourseIds = await prisma.courseAccess.findMany({
    where: { planId: subscription.planId },
    select: { courseId: true },
  })
  const ids = accessibleCourseIds.map((a) => a.courseId)

  return prisma.course.findMany({
    where: { id: { in: ids }, published: true, deletedAt: null },
    select: {
      id: true, title: true, slug: true, description: true,
      coverImage: true, type: true,
    },
  })
}

export async function createCourse(data: Prisma.CourseCreateInput) {
  return prisma.course.create({ data })
}

export async function updateCourse(id: string, data: Prisma.CourseUpdateInput) {
  return prisma.course.update({ where: { id }, data })
}

export async function softDeleteCourse(id: string) {
  return prisma.course.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
