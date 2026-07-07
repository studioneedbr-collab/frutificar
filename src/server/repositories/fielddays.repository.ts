import { prisma } from '@/lib/prisma'

export async function listFieldDays() {
  return prisma.fieldDay.findMany({
    orderBy: { date: 'desc' },
  })
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
