# Design: Postgres Local + Prisma Schema Completo

**Data:** 2026-05-24
**Escopo:** Infraestrutura de banco de dados local (Postgres.app), instalação do Prisma, schema completo com todas as entidades da seção 3 do PDF, migração inicial e singleton do cliente.

**Referência:** `docs/Frutificar_Digital_Contexto_Agente.pdf` — seções 3 (modelagem), 8.4 (singleton Prisma)

---

## 1. Infraestrutura de banco (Postgres.app)

**Abordagem:** Postgres.app para dev local no Mac. Docker Desktop não está instalado — `docker-compose.yml` será criado apenas como referência para CI/CD futuro, não será executado agora.

**Passos:**
- Verificar se Postgres.app já está instalado em `/Applications/Postgres.app`
- Se não: usuário baixa de `https://postgresapp.com` e instala manualmente. O plano incluirá passo de pausa para instalação.
- Iniciar o servidor pelo app (porta 5432, user `postgres`, sem senha para conexão local)
- Criar banco `frutificar_dev` via `psql -U postgres -c "CREATE DATABASE frutificar_dev;"`
- Atualizar `DATABASE_URL` em `.env.local`: `postgresql://postgres@localhost:5432/frutificar_dev`

**docker-compose.yml** (criado para referência, não executado):
```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: frutificar_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

---

## 2. Instalação do Prisma

```bash
npm i prisma @prisma/client
npm i -D tsx
npx prisma init
```

`npx prisma init` gera:
- `prisma/schema.prisma` — será sobrescrito pelo schema completo
- `.env` — será ignorado (projeto usa `.env.local`; adicionar `.env` ao `.gitignore` se não estiver)

`src/lib/prisma.ts` — singleton (seção 8.4 do PDF):
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 3. Schema Prisma completo

### Convenções
- `id String @id @default(cuid())`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- Enums: `SCREAMING_SNAKE_CASE`
- `onDelete` explícito em todos os relacionamentos
- Campos JSON: tipo `Json` do Prisma (`ChatSession.messages`, `Plan.features`, `SoilAnalysis.nutrients`, `RecommendationRule.condition`)
- Soft delete opcional via `deletedAt DateTime?` em entidades críticas (User, Course)

### Enums

```prisma
enum Role {
  STUDENT
  ADMIN
  INSTRUCTOR
}

enum PlanName {
  ESSENCIAL
  PREMIUM
  GOLD
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
}

enum CourseType {
  PRINCIPAL
  MINICOURSE
}

enum MaterialType {
  PDF
  SPREADSHEET
  DOC
}

enum LiveStatus {
  SCHEDULED
  LIVE
  ENDED
}

enum VisitStatus {
  REQUESTED
  CONFIRMED
  COMPLETED
  CANCELED
}

enum ServiceStatus {
  OPEN
  IN_ANALYSIS
  IN_PROGRESS
  COMPLETED
  CANCELED
}
```

### Modelos — Usuários e acesso

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  passwordHash String
  role         Role      @default(STUDENT)
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  subscription   Subscription?
  enrollments    Enrollment[]
  lessonProgress LessonProgress[]
  certificates   Certificate[]
  chatSessions   ChatSession[]
  technicalVisits TechnicalVisit[]
  serviceRequests ServiceRequest[]
  properties     Property[]
  instructedCourses Course[] @relation("CourseInstructor")
}

model Plan {
  id           String    @id @default(cuid())
  name         PlanName  @unique
  priceMonthly Decimal   @db.Decimal(10, 2)
  features     Json
  maxProperties Int      @default(1)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  subscriptions Subscription[]
  courseAccess  CourseAccess[]
}

model Subscription {
  id                     String             @id @default(cuid())
  userId                 String             @unique
  planId                 String
  status                 SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd       DateTime
  gatewayCustomerId      String?
  gatewaySubscriptionId  String?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan Plan @relation(fields: [planId], references: [id], onDelete: Restrict)
}

model CourseAccess {
  id       String @id @default(cuid())
  planId   String
  courseId String

  plan   Plan   @relation(fields: [planId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([planId, courseId])
}
```

### Modelos — Conteúdo educacional

```prisma
model Course {
  id           String     @id @default(cuid())
  title        String
  slug         String     @unique
  description  String
  coverImage   String?
  type         CourseType @default(PRINCIPAL)
  instructorId String?
  published    Boolean    @default(false)
  deletedAt    DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  instructor   User?          @relation("CourseInstructor", fields: [instructorId], references: [id], onDelete: SetNull)
  modules      Module[]
  enrollments  Enrollment[]
  certificates Certificate[]
  courseAccess CourseAccess[]
  lives        Live[]
}

model Module {
  id        String   @id @default(cuid())
  courseId  String
  title     String
  order     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]
}

model Lesson {
  id             String   @id @default(cuid())
  moduleId       String
  title          String
  description    String?
  youtubeVideoId String?
  durationSec    Int?
  order          Int
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  module    Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  materials Material[]
  progress  LessonProgress[]
}

model Material {
  id        String       @id @default(cuid())
  lessonId  String
  title     String
  fileUrl   String
  type      MaterialType
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
}

model Enrollment {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  startedAt DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
}

model LessonProgress {
  id          String    @id @default(cuid())
  userId      String
  lessonId    String
  completed   Boolean   @default(false)
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
}

model Certificate {
  id             String   @id @default(cuid())
  userId         String
  courseId       String
  certificateUrl String
  issuedAt       DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
}
```

### Modelos — Comunicação

```prisma
model ChatSession {
  id            String   @id @default(cuid())
  userId        String
  messages      Json     @default("[]")
  lastMessageAt DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Live {
  id           String     @id @default(cuid())
  courseId     String?
  title        String
  youtubeVideoId String
  scheduledAt  DateTime
  status       LiveStatus @default(SCHEDULED)
  requiredPlan PlanName   @default(ESSENCIAL)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  course Course? @relation(fields: [courseId], references: [id], onDelete: SetNull)
}

model Podcast {
  id          String   @id @default(cuid())
  title       String
  description String
  coverImage  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  episodes PodcastEpisode[]
}

model PodcastEpisode {
  id          String   @id @default(cuid())
  podcastId   String
  title       String
  embedUrl    String?
  audioUrl    String?
  publishedAt DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  podcast Podcast @relation(fields: [podcastId], references: [id], onDelete: Cascade)
}
```

### Modelos — Serviços e agendamentos

```prisma
model TechnicalVisit {
  id            String      @id @default(cuid())
  userId        String
  propertyId    String?
  reason        String
  requestedDate DateTime
  status        VisitStatus @default(REQUESTED)
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  property Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)
}

model ServiceRequest {
  id            String        @id @default(cuid())
  userId        String
  serviceType   String
  description   String
  status        ServiceStatus @default(OPEN)
  adminResponse String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model DownloadableResource {
  id           String   @id @default(cuid())
  title        String
  description  String
  fileUrl      String
  category     String
  requiredPlan PlanName @default(PREMIUM)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model FieldDay {
  id          String   @id @default(cuid())
  title       String
  location    String
  date        DateTime
  instructor  String
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Modelos — Gestão da propriedade rural

```prisma
model Property {
  id           String   @id @default(cuid())
  userId       String
  name         String
  totalAreaHa  Decimal  @db.Decimal(10, 2)
  location     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plots          Plot[]
  technicalVisits TechnicalVisit[]
}

model Plot {
  id         String   @id @default(cuid())
  propertyId String
  name       String
  areaHa     Decimal  @db.Decimal(10, 2)
  status     String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  property        Property         @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  soilAnalyses    SoilAnalysis[]
  activities      Activity[]
  recommendations Recommendation[]
}

model SoilAnalysis {
  id         String   @id @default(cuid())
  plotId     String
  ph         Decimal  @db.Decimal(4, 2)
  nutrients  Json
  analyzedAt DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  plot Plot @relation(fields: [plotId], references: [id], onDelete: Cascade)
}

model Activity {
  id          String   @id @default(cuid())
  plotId      String
  type        String
  description String
  performedAt DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  plot Plot @relation(fields: [plotId], references: [id], onDelete: Cascade)
}

model Recommendation {
  id                  String   @id @default(cuid())
  plotId              String
  content             String
  priority            String
  generatedFromRuleId String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  plot Plot                @relation(fields: [plotId], references: [id], onDelete: Cascade)
  rule RecommendationRule? @relation(fields: [generatedFromRuleId], references: [id], onDelete: SetNull)
}

model RecommendationRule {
  id                 String   @id @default(cuid())
  condition          Json
  recommendationText String
  active             Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  recommendations Recommendation[]
}
```

---

## 4. Migração e validação

```bash
npx prisma validate          # zero erros obrigatório
npx prisma migrate dev --name init
npx prisma studio            # confirmar que abre em http://localhost:5555
```

---

## 5. Fora do escopo

- Seeds de dados
- NextAuth integration com Prisma adapter
- Deploy do banco em produção
- Qualquer lógica de aplicação usando os modelos
