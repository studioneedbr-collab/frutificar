import { prisma } from '@/lib/prisma'

export async function canUserAccessCourse(userId: string, courseId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { planId: true, status: true },
  })
  if (!subscription || subscription.status !== 'ACTIVE') return false

  const access = await prisma.courseAccess.findFirst({
    where: { planId: subscription.planId, courseId },
  })
  return access !== null
}

export async function markLessonComplete(userId: string, lessonId: string) {
  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed: true, completedAt: new Date() },
    create: { userId, lessonId, completed: true, completedAt: new Date() },
  })

  // Check if course is complete → issue certificate
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  })
  if (!lesson) return progress

  const courseId = lesson.module.courseId

  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({
      where: { module: { courseId } },
    }),
    prisma.lessonProgress.count({
      where: { userId, completed: true, lesson: { module: { courseId } } },
    }),
  ])

  if (totalLessons > 0 && completedLessons >= totalLessons) {
    await prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: {
        userId,
        courseId,
        certificateUrl: `/certificados/${userId}/${courseId}`,
        issuedAt: new Date(),
      },
    })
  }

  return progress
}

export {
  findAllPublishedCourses,
  findCourseBySlug,
  findCoursesByUserPlan,
  createCourse,
  updateCourse,
  softDeleteCourse,
} from '@/server/repositories/courses.repository'
