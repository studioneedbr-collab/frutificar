import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, PlanName } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const essencialFeatures = {
  cursos: true, modulosBasicos: true, chatIA: false, downloadMateriais: false,
  visitaTecnica: false, gestaoPropriedade: true, maxPropriedades: 1, podcast: true,
  lives: false, suportePrioritario: false, certificados: false, minicursos: false,
}
const premiumFeatures = {
  cursos: true, modulosBasicos: true, chatIA: true, downloadMateriais: true,
  visitaTecnica: false, gestaoPropriedade: true, maxPropriedades: 3, podcast: true,
  lives: true, suportePrioritario: false, certificados: true, minicursos: true,
}
const goldFeatures = {
  cursos: true, modulosBasicos: true, chatIA: true, downloadMateriais: true,
  visitaTecnica: true, gestaoPropriedade: true, maxPropriedades: 10, podcast: true,
  lives: true, suportePrioritario: true, certificados: true, minicursos: true,
}

async function main() {
  await prisma.plan.upsert({
    where: { name: PlanName.ESSENCIAL }, update: { priceMonthly: 47, features: essencialFeatures },
    create: { name: PlanName.ESSENCIAL, priceMonthly: 47, features: essencialFeatures, maxProperties: 1 },
  })
  await prisma.plan.upsert({
    where: { name: PlanName.PREMIUM }, update: { priceMonthly: 97, features: premiumFeatures },
    create: { name: PlanName.PREMIUM, priceMonthly: 97, features: premiumFeatures, maxProperties: 3 },
  })
  await prisma.plan.upsert({
    where: { name: PlanName.GOLD }, update: { priceMonthly: 197, features: goldFeatures },
    create: { name: PlanName.GOLD, priceMonthly: 197, features: goldFeatures, maxProperties: 10 },
  })
  console.log('Planos seedados: Essencial R$47 · Premium R$97 · Gold R$197')
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
