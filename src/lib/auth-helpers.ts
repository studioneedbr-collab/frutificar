import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, email: true, name: true, role: true },
  })
}
