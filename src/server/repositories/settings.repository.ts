import { prisma } from '@/lib/prisma'

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function saveSettings(entries: Record<string, string>) {
  const keys = Object.keys(entries)
  await prisma.$transaction(
    keys.map((key) =>
      prisma.appSetting.upsert({
        where: { key },
        update: { value: entries[key] },
        create: { key, value: entries[key] },
      }),
    ),
  )
}
