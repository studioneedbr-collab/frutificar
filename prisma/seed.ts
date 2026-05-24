import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  PrismaClient,
  Role,
  PlanName,
  SubscriptionStatus,
  CourseType,
} from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Plan features (based on Frutificar Digital platform context) ─────────────

const essencialFeatures = {
  cursos: true,
  modulosBasicos: true,
  chatIA: false,
  downloadMateriais: false,
  visitaTecnica: false,
  gestaoPropriedade: true,
  maxPropriedades: 1,
  podcast: true,
  lives: false,
  suportePrioritario: false,
  certificados: false,
  minicursos: false,
}

const premiumFeatures = {
  cursos: true,
  modulosBasicos: true,
  chatIA: true,
  downloadMateriais: true,
  visitaTecnica: false,
  gestaoPropriedade: true,
  maxPropriedades: 3,
  podcast: true,
  lives: true,
  suportePrioritario: false,
  certificados: true,
  minicursos: true,
}

const goldFeatures = {
  cursos: true,
  modulosBasicos: true,
  chatIA: true,
  downloadMateriais: true,
  visitaTecnica: true,
  gestaoPropriedade: true,
  maxPropriedades: 10,
  podcast: true,
  lives: true,
  suportePrioritario: true,
  certificados: true,
  minicursos: true,
}

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log('Iniciando seed...')

  // 1. Plans
  const planEssencial = await prisma.plan.upsert({
    where: { name: PlanName.ESSENCIAL },
    update: {},
    create: {
      name: PlanName.ESSENCIAL,
      priceMonthly: 0,
      features: essencialFeatures,
      maxProperties: 1,
    },
  })

  const planPremium = await prisma.plan.upsert({
    where: { name: PlanName.PREMIUM },
    update: {},
    create: {
      name: PlanName.PREMIUM,
      priceMonthly: 0,
      features: premiumFeatures,
      maxProperties: 3,
    },
  })

  const planGold = await prisma.plan.upsert({
    where: { name: PlanName.GOLD },
    update: {},
    create: {
      name: PlanName.GOLD,
      priceMonthly: 0,
      features: goldFeatures,
      maxProperties: 10,
    },
  })

  console.log(`Plans: ${planEssencial.name}, ${planPremium.name}, ${planGold.name}`)

  // 2. Users (passwords hashed with bcrypt cost 12)
  const adminPasswordHash = await bcrypt.hash('admin123', 12)
  const alunoPasswordHash = await bcrypt.hash('aluno123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@frutificar.com' },
    update: {},
    create: {
      email: 'admin@frutificar.com',
      name: 'Admin Frutificar',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  })

  const studentUser = await prisma.user.upsert({
    where: { email: 'aluno@teste.com' },
    update: {},
    create: {
      email: 'aluno@teste.com',
      name: 'Aluno Teste',
      passwordHash: alunoPasswordHash,
      role: Role.STUDENT,
    },
  })

  console.log(`Users: ${adminUser.email}, ${studentUser.email}`)

  // 3. Subscription for student (GOLD, ACTIVE, 1 year from now)
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  const subscription = await prisma.subscription.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      planId: planGold.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: oneYearFromNow,
    },
  })

  console.log(`Subscription: student -> GOLD (${subscription.status})`)

  // 4. Course
  const course = await prisma.course.upsert({
    where: { slug: 'cafe-arabica-curso-completo' },
    update: {},
    create: {
      title: 'Café Arábica — Curso Completo',
      slug: 'cafe-arabica-curso-completo',
      description: 'Curso completo sobre cultivo e manejo do café arábica de alta qualidade',
      type: CourseType.PRINCIPAL,
      published: true,
      instructorId: null,
    },
  })

  console.log(`Course: ${course.title}`)

  // 5. Modules and Lessons (deleteMany + createMany for idempotency)
  await prisma.$transaction(async (tx) => {
    // Delete existing modules (cascades to lessons)
    await tx.module.deleteMany({ where: { courseId: course.id } })

    // Module 1
    const module1 = await tx.module.create({
      data: {
        courseId: course.id,
        title: 'Módulo 1: Introdução ao Café Arábica',
        order: 1,
        lessons: {
          createMany: {
            data: [
              {
                title: 'História e origem do café',
                youtubeVideoId: 'dQw4w9WgXcQ',
                order: 1,
                durationSec: 212,
              },
              {
                title: 'Variedades do café arábica',
                youtubeVideoId: 'jNQXAC9IVRw',
                order: 2,
                durationSec: 19,
              },
              {
                title: 'Clima e altitude ideais',
                youtubeVideoId: 'sFSn3ycqb_0',
                order: 3,
                durationSec: 60,
              },
            ],
          },
        },
      },
    })

    // Module 2
    const module2 = await tx.module.create({
      data: {
        courseId: course.id,
        title: 'Módulo 2: Cultivo e Manejo',
        order: 2,
        lessons: {
          createMany: {
            data: [
              {
                title: 'Preparo do solo',
                youtubeVideoId: 'M7lc1UVf-VE',
                order: 1,
                durationSec: 600,
              },
              {
                title: 'Plantio e espaçamento',
                youtubeVideoId: '5qap5aO4i9A',
                order: 2,
                durationSec: 5765,
              },
              {
                title: 'Irrigação e adubação',
                youtubeVideoId: 'kJQP7kiw5Fk',
                order: 3,
                durationSec: 282,
              },
            ],
          },
        },
      },
    })

    console.log(`Modules: ${module1.title}, ${module2.title}`)
    console.log('Lessons: 6 total (3 per module)')
  })

  // 6. CourseAccess — link course to all 3 plans
  const plans = [planEssencial, planPremium, planGold]
  for (const plan of plans) {
    await prisma.courseAccess.upsert({
      where: { planId_courseId: { planId: plan.id, courseId: course.id } },
      update: {},
      create: { planId: plan.id, courseId: course.id },
    })
  }

  console.log('CourseAccess: curso vinculado a ESSENCIAL, PREMIUM e GOLD')
  console.log('Seed completo!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
