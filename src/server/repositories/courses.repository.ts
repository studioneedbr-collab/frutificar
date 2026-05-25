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

// Get user's lesson progress for a course
export async function getUserCourseProgress(userId: string, courseId: string) {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId } },
    select: { id: true },
  })
  const lessonIds = lessons.map((l) => l.id)

  const completed = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds }, completed: true },
    select: { lessonId: true },
  })

  return {
    total: lessonIds.length,
    completed: completed.length,
    completedIds: new Set(completed.map((p) => p.lessonId)),
    percentage: lessonIds.length > 0 ? Math.round((completed.length / lessonIds.length) * 100) : 0,
  }
}

// Get user's lesson progress for multiple courses (batched)
export async function getUserCoursesProgress(
  userId: string,
  courseIds: string[]
): Promise<Record<string, { total: number; completed: number; completedIds: Set<string>; percentage: number }>> {
  if (courseIds.length === 0) return {}

  const [lessons, completedProgress] = await Promise.all([
    prisma.lesson.findMany({
      where: { module: { courseId: { in: courseIds } } },
      select: { id: true, module: { select: { courseId: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: {
        userId,
        completed: true,
        lesson: { module: { courseId: { in: courseIds } } },
      },
      select: { lessonId: true },
    }),
  ])

  const completedSet = new Set(completedProgress.map((p) => p.lessonId))

  // Group lessons by courseId
  const lessonsByCourse = lessons.reduce<Record<string, string[]>>((acc, l) => {
    const cid = l.module.courseId
    if (!acc[cid]) acc[cid] = []
    acc[cid].push(l.id)
    return acc
  }, {})

  return Object.fromEntries(
    courseIds.map((courseId) => {
      const courseLessons = lessonsByCourse[courseId] ?? []
      const completedCount = courseLessons.filter((id) => completedSet.has(id)).length
      return [
        courseId,
        {
          total: courseLessons.length,
          completed: completedCount,
          completedIds: new Set(courseLessons.filter((id) => completedSet.has(id))),
          percentage:
            courseLessons.length > 0
              ? Math.round((completedCount / courseLessons.length) * 100)
              : 0,
        },
      ]
    })
  )
}

// Get enrollment
export async function getUserEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findFirst({ where: { userId, courseId } })
}

// Enroll user in course
export async function enrollUser(userId: string, courseId: string) {
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  })
}

// Get user's certificates
export async function getUserCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    include: { course: { select: { title: true, slug: true } } },
    orderBy: { issuedAt: 'desc' },
  })
}
