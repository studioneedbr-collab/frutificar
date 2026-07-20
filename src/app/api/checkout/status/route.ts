import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ active: false }, { status: 401 })
  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  })
  return Response.json({ active: sub?.status === 'ACTIVE' })
}
