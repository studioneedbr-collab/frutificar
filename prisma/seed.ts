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
  LiveStatus,
  VisitStatus,
  ServiceStatus,
  AnalysisStatus,
  PaymentStatus,
} from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── Plan features ────────────────────────────────────────────────────────────

// Features exibidas em /planos — texto legível, alinhado ao spec do produto.
const essencialFeatures = [
  'Curso completo com 8 módulos',
  'Conteúdo progressivo e didático',
  'Chat inteligente para dúvidas rápidas',
  'Diagnóstico rápido por imagem',
  'Acesso à plataforma (App e Web)',
]
const premiumFeatures = [
  'Tudo do plano Essencial',
  'Minicursos especializados',
  'Suporte técnico com especialista (agendado)',
  'Gestão da propriedade rural',
  'Licenças ambientais e histórico da propriedade',
  'Organização e documentação da propriedade',
  'Podcast com conteúdos técnicos',
]
const goldFeatures = [
  'Tudo do plano Premium',
  'Acesso a todos os cursos',
  'Dia de campo presencial',
  'Estágio supervisionado',
  'Tutoria especializada',
  'Certificado de conclusão',
]

// ─── Currículo: curso principal (8 módulos) + minicursos ──────────────────────

const mainCourseModules: { title: string; lessons: string[] }[] = [
  { title: 'Módulo 1 — Introdução ao café',            lessons: ['História e origem do café', 'Espécies e variedades', 'Panorama do agronegócio do café'] },
  { title: 'Módulo 2 — Clima, Solo e Regiões',         lessons: ['Exigências climáticas', 'Tipos de solo e fertilidade', 'Principais regiões produtoras'] },
  { title: 'Módulo 3 — Implantação da lavoura',        lessons: ['Planejamento e espaçamento', 'Mudas e plantio', 'Formação da lavoura'] },
  { title: 'Módulo 4 — Manejo da cultura',             lessons: ['Adubação e nutrição', 'Podas e condução', 'Manejo de plantas daninhas'] },
  { title: 'Módulo 5 — Pragas e Doenças',              lessons: ['Bicho-mineiro e broca', 'Ferrugem e cercosporiose', 'Manejo integrado de pragas (MIP)'] },
  { title: 'Módulo 6 — Florada e Desenvolvimento',     lessons: ['Indução floral', 'Chumbinho e granação', 'Fatores que afetam a florada'] },
  { title: 'Módulo 7 — Colheita e Pós-colheita',       lessons: ['Ponto de colheita', 'Secagem e terreiro', 'Beneficiamento e armazenamento'] },
  { title: 'Módulo 8 — Comercialização e Qualidade',   lessons: ['Classificação e tipos', 'Cafés especiais', 'Precificação e mercado'] },
]

const miniCourses: { title: string; slug: string; description: string; lessons: string[] }[] = [
  { title: 'Nutrição',        slug: 'minicurso-nutricao',        description: 'Diagnóstico nutricional e adubação eficiente do cafeeiro.', lessons: ['Diagnóstico nutricional', 'Adubação de produção'] },
  { title: 'Pragas',          slug: 'minicurso-pragas',          description: 'Identificação e controle das principais pragas do café.',   lessons: ['Identificação de pragas', 'Controle biológico'] },
  { title: 'Comercialização', slug: 'minicurso-comercializacao', description: 'Formação de preço e canais de venda da saca de café.',      lessons: ['Formação de preço', 'Canais de venda'] },
  { title: 'Hones',           slug: 'minicurso-hones',           description: 'Minicurso complementar do programa Frutificar.',            lessons: ['Aula 1', 'Aula 2'] },
]

async function seedModules(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  courseId: string,
  modules: { title: string; lessons: string[] }[],
) {
  await tx.module.deleteMany({ where: { courseId } })
  for (let m = 0; m < modules.length; m++) {
    await tx.module.create({
      data: {
        courseId,
        title: modules[m].title,
        order: m + 1,
        lessons: {
          createMany: {
            data: modules[m].lessons.map((title, i) => ({
              title,
              order: i + 1,
              durationSec: 480 + i * 120,
            })),
          },
        },
      },
    })
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Iniciando seed...')

  // 1. Planos (preços reais da landing)
  const planEssencial = await prisma.plan.upsert({
    where: { name: PlanName.ESSENCIAL }, update: { priceMonthly: 47, features: essencialFeatures },
    create: { name: PlanName.ESSENCIAL, priceMonthly: 47, features: essencialFeatures, maxProperties: 1 },
  })
  const planPremium = await prisma.plan.upsert({
    where: { name: PlanName.PREMIUM }, update: { priceMonthly: 97, features: premiumFeatures },
    create: { name: PlanName.PREMIUM, priceMonthly: 97, features: premiumFeatures, maxProperties: 3 },
  })
  const planGold = await prisma.plan.upsert({
    where: { name: PlanName.GOLD }, update: { priceMonthly: 197, features: goldFeatures },
    create: { name: PlanName.GOLD, priceMonthly: 197, features: goldFeatures, maxProperties: 10 },
  })
  console.log(`Planos: Essencial R$47 · Premium R$97 · Gold R$197`)

  // 2. Usuários (admin + aluno Gold "Douglas Vargas")
  const adminPasswordHash = await bcrypt.hash('admin123', 12)
  const alunoPasswordHash = await bcrypt.hash('aluno123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@frutificar.com' }, update: {},
    create: { email: 'admin@frutificar.com', name: 'Admin Frutificar', passwordHash: adminPasswordHash, role: Role.ADMIN },
  })
  const studentUser = await prisma.user.upsert({
    where: { email: 'douglas@fazendasantaclara.com.br' },
    update: { name: 'Douglas Vargas' },
    create: { email: 'douglas@fazendasantaclara.com.br', name: 'Douglas Vargas', passwordHash: alunoPasswordHash, role: Role.STUDENT },
  })
  console.log(`Usuários: ${adminUser.email} (admin) · ${studentUser.email} (Gold)`)

  // 3. Assinatura Gold do aluno
  const nextBilling = new Date()
  nextBilling.setMonth(nextBilling.getMonth() + 1)
  const subscription = await prisma.subscription.upsert({
    where: { userId: studentUser.id }, update: { planId: planGold.id, status: SubscriptionStatus.ACTIVE, currentPeriodEnd: nextBilling },
    create: { userId: studentUser.id, planId: planGold.id, status: SubscriptionStatus.ACTIVE, currentPeriodEnd: nextBilling },
  })
  console.log('Assinatura: Douglas → GOLD (ACTIVE)')

  // 3b. Histórico de pagamentos (5 meses)
  await prisma.payment.deleteMany({ where: { userId: studentUser.id } })
  for (let i = 1; i <= 5; i++) {
    const paidAt = new Date(); paidAt.setMonth(paidAt.getMonth() - i)
    await prisma.payment.create({
      data: {
        userId: studentUser.id, subscriptionId: subscription.id, amount: 197,
        status: PaymentStatus.PAID, method: 'Cartão de crédito •••• 4242',
        description: 'Plano Gold — Mensal', paidAt,
      },
    })
  }
  console.log('Pagamentos: 5 registros (Gold, PAID)')

  // 4. Curso principal + 8 módulos
  const mainCourse = await prisma.course.upsert({
    where: { slug: 'cafeicultura-completa' }, update: { published: true },
    create: {
      title: 'Cafeicultura Completa: do plantio à xícara',
      slug: 'cafeicultura-completa',
      description: 'Curso completo de cafeicultura — do plantio à comercialização, com 8 módulos.',
      type: CourseType.PRINCIPAL, published: true,
    },
  })
  await prisma.$transaction((tx) => seedModules(tx, mainCourse.id, mainCourseModules))
  console.log(`Curso principal: ${mainCourse.title} (8 módulos)`)

  // 5. Minicursos
  for (const mc of miniCourses) {
    const course = await prisma.course.upsert({
      where: { slug: mc.slug }, update: { published: true },
      create: { title: mc.title, slug: mc.slug, description: mc.description, type: CourseType.MINICOURSE, published: true },
    })
    await prisma.$transaction((tx) => seedModules(tx, course.id, [{ title: mc.title, lessons: mc.lessons }]))
    // minicursos: Premium + Gold
    for (const plan of [planPremium, planGold]) {
      await prisma.courseAccess.upsert({
        where: { planId_courseId: { planId: plan.id, courseId: course.id } },
        update: {}, create: { planId: plan.id, courseId: course.id },
      })
    }
  }
  console.log(`Minicursos: ${miniCourses.map((c) => c.title).join(', ')}`)

  // 6. CourseAccess do curso principal — todos os planos
  for (const plan of [planEssencial, planPremium, planGold]) {
    await prisma.courseAccess.upsert({
      where: { planId_courseId: { planId: plan.id, courseId: mainCourse.id } },
      update: {}, create: { planId: plan.id, courseId: mainCourse.id },
    })
  }

  // 7. Matrícula + progresso do aluno no curso principal
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: studentUser.id, courseId: mainCourse.id } },
    update: {}, create: { userId: studentUser.id, courseId: mainCourse.id },
  })

  // 8. Propriedade Fazenda Santa Clara + talhões + análise de solo
  await prisma.property.deleteMany({ where: { userId: studentUser.id } })
  const santaClara = await prisma.property.create({
    data: {
      userId: studentUser.id, name: 'Fazenda Santa Clara', location: 'Patrocínio/MG', totalAreaHa: 84,
      cropName: 'Café arábica', altitudeM: 980,
      plots: {
        create: [
          { name: 'Talhão A1', areaHa: 24, status: 'Saudável', cropName: 'Café Catuaí' },
          { name: 'Talhão A2', areaHa: 18, status: 'Atenção',  cropName: 'Café Mundo Novo' },
          { name: 'Talhão B1', areaHa: 22, status: 'Saudável', cropName: 'Café Bourbon' },
          { name: 'Várzea',    areaHa: 20, status: 'Pousio',   cropName: 'Pousio' },
        ],
      },
    },
    include: { plots: true },
  })
  const talhaoA1 = santaClara.plots.find((p) => p.name === 'Talhão A1')!
  await prisma.soilAnalysis.create({
    data: {
      plotId: talhaoA1.id, ph: 5.8, analyzedAt: new Date(),
      status: AnalysisStatus.COMPLETED, analysisType: 'Completa',
      summary: 'pH adequado; fósforo baixo e magnésio a corrigir.',
      nutrients: { P: 18, K: 120, Ca: 2.4, Mg: 0.8, MO: 2.9, V: 58 },
    },
  })
  console.log(`Propriedade: ${santaClara.name} (4 talhões)`)

  // 9. Solicitações (caem no painel admin)
  await prisma.technicalVisit.deleteMany({ where: { userId: studentUser.id } })
  const visitDate = new Date(); visitDate.setDate(visitDate.getDate() + 7)
  await prisma.technicalVisit.create({
    data: { userId: studentUser.id, propertyId: santaClara.id, reason: 'Visita técnica — Talhão A2 (monitoramento de pragas)', requestedDate: visitDate, status: VisitStatus.REQUESTED },
  })
  await prisma.serviceRequest.deleteMany({ where: { userId: studentUser.id } })
  await prisma.serviceRequest.create({
    data: { userId: studentUser.id, serviceType: 'Análise foliar', description: 'Solicitação de análise foliar para o talhão B1.', status: ServiceStatus.OPEN },
  })
  console.log('Solicitações: 1 visita técnica + 1 serviço avulso')

  // 10. Lives
  await prisma.live.deleteMany({})
  const live1 = new Date(); live1.setDate(live1.getDate() + 2)
  const live2 = new Date(); live2.setDate(live2.getDate() + 4)
  await prisma.live.createMany({
    data: [
      { title: 'Manejo de pragas na entressafra do café', youtubeVideoId: 'TODO_LIVE_1', scheduledAt: live1, status: LiveStatus.SCHEDULED, requiredPlan: PlanName.PREMIUM },
      { title: 'Leitura de análise de solo na prática',    youtubeVideoId: 'TODO_LIVE_2', scheduledAt: live2, status: LiveStatus.SCHEDULED, requiredPlan: PlanName.GOLD },
    ],
  })
  console.log('Lives: 2 agendadas')

  // 11. Podcast + episódios
  await prisma.podcast.deleteMany({})
  await prisma.podcast.create({
    data: {
      title: 'Frutificar no Campo', description: 'Conversas sobre cafeicultura, solo e gestão rural.',
      episodes: {
        create: [
          { title: 'Café de qualidade: da colheita ao copo', publishedAt: new Date() },
          { title: 'Como precificar a saca de café',          publishedAt: new Date() },
          { title: 'Irrigação e fertirrigação no cafeeiro',   publishedAt: new Date() },
        ],
      },
    },
  })
  console.log('Podcast: 1 série · 3 episódios')

  // 12. Dias de Campo
  await prisma.fieldDay.deleteMany({})
  const fd1 = new Date(); fd1.setDate(fd1.getDate() + 17)
  await prisma.fieldDay.create({
    data: { title: 'Cafeicultura de Precisão a Campo', location: 'Fazenda Modelo, Patrocínio/MG', date: fd1, instructor: 'Helena Prado e Marcos Lima', description: 'Demonstrações práticas de manejo de precisão na lavoura cafeeira.' },
  })
  console.log('Dias de Campo: 1 evento')

  console.log('Seed completo!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
