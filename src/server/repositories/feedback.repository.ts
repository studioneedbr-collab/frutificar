import { prisma } from '@/lib/prisma'

export async function createFeedback(data: {
  userId?: string | null
  userName: string
  userEmail: string
  rating?: number | null
  message: string
}) {
  return prisma.feedback.create({ data })
}

export async function listFeedbacks() {
  return prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } })
}
