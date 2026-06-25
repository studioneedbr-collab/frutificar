import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function generateCertificateIfEligible(userId: string, courseId: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({
      where: { userId, completed: true, lesson: { module: { courseId } } },
    }),
  ])

  if (totalLessons === 0 || completedLessons < totalLessons) return null

  const certificate = await prisma.certificate.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: {
      userId,
      courseId,
      certificateUrl: `/certificados/${userId}/${courseId}`,
      issuedAt: new Date(),
    },
  })

  revalidatePath('/perfil/certificados')
  return certificate
}
