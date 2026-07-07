import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Cria (ou atualiza) o usuário ADMIN do painel. Idempotente — pode rodar de novo.
// Uso: ./node_modules/.bin/tsx prisma/create-admin.ts
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@frutificardigital.com'
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'Frutificar@2026'
const ADMIN_NAME = 'Administrador Frutificar'

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', passwordHash, emailVerified: new Date(), deletedAt: null },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
    select: { id: true, email: true, role: true },
  })

  // Dá ao admin uma assinatura GOLD ativa para navegar por todo o app de aluno também.
  const gold = await prisma.plan.findUnique({ where: { name: 'GOLD' }, select: { id: true } })
  if (gold) {
    const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: { planId: gold.id, status: 'ACTIVE', currentPeriodEnd: periodEnd },
      create: { userId: user.id, planId: gold.id, status: 'ACTIVE', currentPeriodEnd: periodEnd },
    })
  }

  console.log(`Admin pronto: ${user.email} (role=${user.role})`)
  console.log(`Senha: ${ADMIN_PASSWORD}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
