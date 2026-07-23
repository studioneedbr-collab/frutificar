import { prisma } from '@/lib/prisma'

export async function listFieldDays() {
  return prisma.fieldDay.findMany({
    orderBy: { date: 'desc' },
  })
}

// Lista os dias de campo com a contagem de inscritos (para o admin).
export async function listFieldDaysWithCounts() {
  return prisma.fieldDay.findMany({
    orderBy: { date: 'desc' },
    include: { _count: { select: { registrations: true } } },
  })
}

// IDs dos dias de campo em que o aluno já registrou interesse.
export async function getUserRegistrationIds(userId: string): Promise<string[]> {
  const rows = await prisma.fieldDayRegistration.findMany({
    where: { userId },
    select: { fieldDayId: true },
  })
  return rows.map((r) => r.fieldDayId)
}

export async function registerInterest(userId: string, fieldDayId: string) {
  return prisma.fieldDayRegistration.upsert({
    where: { userId_fieldDayId: { userId, fieldDayId } },
    create: { userId, fieldDayId },
    update: {},
  })
}

export async function unregisterInterest(userId: string, fieldDayId: string) {
  return prisma.fieldDayRegistration.deleteMany({ where: { userId, fieldDayId } })
}

export async function createFieldDay(data: {
  title: string
  location: string
  date: Date
  instructor: string
  description: string
}) {
  return prisma.fieldDay.create({ data })
}

export async function updateFieldDay(
  id: string,
  data: Partial<{
    title: string
    location: string
    date: Date
    instructor: string
    description: string
  }>,
) {
  return prisma.fieldDay.update({ where: { id }, data })
}

export async function deleteFieldDay(id: string) {
  return prisma.fieldDay.delete({ where: { id } })
}
