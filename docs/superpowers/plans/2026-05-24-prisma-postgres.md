# Postgres + Prisma Schema Completo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Subir Postgres local via Postgres.app, instalar Prisma e criar o schema completo com todas as 17 entidades do Frutificar Digital, com migração inicial aplicada e cliente singleton pronto para uso.

**Architecture:** Postgres.app fornece o banco local na porta 5432. Prisma gerencia o schema e as migrations. O cliente Prisma é exposto via singleton em `src/lib/prisma.ts` para evitar múltiplas conexões em dev com hot reload do Next.js. Um `docker-compose.yml` é criado apenas como referência para CI/CD futuro, não é executado nesta etapa.

**Tech Stack:** PostgreSQL 16 (Postgres.app), Prisma 5, TypeScript 5, Next.js 16

**Spec de referência:** `docs/superpowers/specs/2026-05-24-prisma-postgres-design.md`

**Diretório do projeto:** `/Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/`

---

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Criar | `docker-compose.yml` | Referência de infra para CI/CD (não executado) |
| Criar | `prisma/schema.prisma` | Schema completo com todos os modelos |
| Criar | `src/lib/prisma.ts` | Singleton do Prisma Client |
| Modificar | `.env.local` | Atualizar DATABASE_URL para Postgres local |
| Modificar | `.gitignore` | Garantir que `.env` gerado pelo prisma init está ignorado |

---

## Task 1: Instalar Postgres.app e criar banco

**Files:** nenhum arquivo do projeto modificado nesta task — é setup de ambiente.

- [ ] **Step 1.1: Verificar se Postgres.app já está instalado**

```bash
ls /Applications/Postgres.app 2>/dev/null && echo "JÁ INSTALADO" || echo "PRECISA INSTALAR"
```

Se a saída for `JÁ INSTALADO`, pule para o Step 1.3.

- [ ] **Step 1.2: Instalar Postgres.app (se necessário)**

Abra o browser e acesse: `https://postgresapp.com`

Baixe a versão mais recente, arraste para `/Applications` e abra o app. Clique em "Initialize" para iniciar o servidor. Aguarde o servidor ficar com ícone verde.

Após instalar, adicione o `psql` ao PATH:

```bash
sudo mkdir -p /etc/paths.d && echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
```

Feche e reabra o terminal para o PATH ter efeito.

- [ ] **Step 1.3: Verificar que Postgres está rodando**

```bash
psql -U postgres -c "SELECT version();" 2>&1
```

Saída esperada: linha começando com `PostgreSQL 16.x` ou `PostgreSQL 17.x`.

Se retornar erro de conexão, abra o Postgres.app e certifique-se de que o servidor está com status verde (rodando).

- [ ] **Step 1.4: Criar o banco de dados**

```bash
psql -U postgres -c "CREATE DATABASE frutificar_dev;" 2>&1
```

Saída esperada: `CREATE DATABASE`

Se retornar `ERROR: database "frutificar_dev" already exists`, está tudo bem — continue.

- [ ] **Step 1.5: Confirmar que o banco existe**

```bash
psql -U postgres -c "\l" 2>&1 | grep frutificar_dev
```

Saída esperada: linha contendo `frutificar_dev`.

---

## Task 2: Instalar Prisma e inicializar

**Files:**
- Modify: `package.json` (dependências adicionadas)
- Create: `prisma/schema.prisma` (gerado pelo init — será sobrescrito na Task 4)
- Create: `.env` (gerado pelo init — deve ser ignorado pelo git)

- [ ] **Step 2.1: Instalar dependências**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npm i prisma @prisma/client && \
npm i -D tsx
```

Saída esperada: `added N packages` sem erros.

- [ ] **Step 2.2: Inicializar Prisma**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npx prisma init --datasource-provider postgresql
```

Saída esperada:
```
✔ Your Prisma schema was created at prisma/schema.prisma
  You can now open it in your favorite editor.
```

- [ ] **Step 2.3: Garantir que .env está no .gitignore**

```bash
grep -n "^\.env$" /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/.gitignore
```

Se não retornar nada, adicione:

```bash
echo ".env" >> /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/.gitignore
```

- [ ] **Step 2.4: Confirmar arquivos gerados**

```bash
ls /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/prisma/
```

Saída esperada: `schema.prisma`

- [ ] **Step 2.5: Commit das dependências**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
git add package.json package-lock.json prisma/ .gitignore && \
git commit -m "instala prisma e inicializa schema"
```

---

## Task 3: Criar docker-compose.yml de referência

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 3.1: Criar docker-compose.yml**

Crie o arquivo `/Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/docker-compose.yml` com o conteúdo:

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

- [ ] **Step 3.2: Commit**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
git add docker-compose.yml && \
git commit -m "adiciona docker-compose.yml de referência para CI/CD"
```

---

## Task 4: Escrever o schema Prisma completo

**Files:**
- Overwrite: `prisma/schema.prisma`

Esta é a task mais longa. Substitua **todo** o conteúdo de `prisma/schema.prisma` pelo schema abaixo. Não mantenha nada do arquivo gerado pelo `prisma init`.

- [ ] **Step 4.1: Escrever o schema.prisma completo**

Conteúdo de `/Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────

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

// ─── Usuários e acesso ────────────────────────────────────

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  passwordHash String
  role         Role      @default(STUDENT)
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  subscription      Subscription?
  enrollments       Enrollment[]
  lessonProgress    LessonProgress[]
  certificates      Certificate[]
  chatSessions      ChatSession[]
  technicalVisits   TechnicalVisit[]
  serviceRequests   ServiceRequest[]
  properties        Property[]
  instructedCourses Course[]         @relation("CourseInstructor")
}

model Plan {
  id            String   @id @default(cuid())
  name          PlanName @unique
  priceMonthly  Decimal  @db.Decimal(10, 2)
  features      Json
  maxProperties Int      @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  subscriptions Subscription[]
  courseAccess  CourseAccess[]
}

model Subscription {
  id                    String             @id @default(cuid())
  userId                String             @unique
  planId                String
  status                SubscriptionStatus @default(ACTIVE)
  currentPeriodEnd      DateTime
  gatewayCustomerId     String?
  gatewaySubscriptionId String?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

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

// ─── Conteúdo educacional ─────────────────────────────────

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

// ─── Comunicação ──────────────────────────────────────────

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
  id             String     @id @default(cuid())
  courseId       String?
  title          String
  youtubeVideoId String
  scheduledAt    DateTime
  status         LiveStatus @default(SCHEDULED)
  requiredPlan   PlanName   @default(ESSENCIAL)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

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

// ─── Serviços e agendamentos ──────────────────────────────

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

// ─── Gestão da propriedade rural ──────────────────────────

model Property {
  id          String   @id @default(cuid())
  userId      String
  name        String
  totalAreaHa Decimal  @db.Decimal(10, 2)
  location    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  plots           Plot[]
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

- [ ] **Step 4.2: Validar o schema**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npx prisma validate 2>&1
```

Saída esperada:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid 🚀
```

Se houver erros, leia a mensagem de erro e corrija o campo/modelo indicado antes de continuar.

- [ ] **Step 4.3: Commit do schema**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
git add prisma/schema.prisma && \
git commit -m "adiciona schema Prisma completo com todas as entidades"
```

---

## Task 5: Atualizar DATABASE_URL no .env.local

**Files:**
- Modify: `.env.local`

- [ ] **Step 5.1: Atualizar a variável DATABASE_URL**

Abra `.env.local` e substitua a linha `DATABASE_URL` por:

```
DATABASE_URL="postgresql://postgres@localhost:5432/frutificar_dev"
```

> Postgres.app no Mac usa autenticação trust por padrão — não é necessário senha para conexão local com o user `postgres`.

- [ ] **Step 5.2: Verificar que a variável está correta**

```bash
grep DATABASE_URL /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/.env.local
```

Saída esperada:
```
DATABASE_URL="postgresql://postgres@localhost:5432/frutificar_dev"
```

> `.env.local` não deve ser commitado (está no .gitignore). Não execute `git add .env.local`.

---

## Task 6: Criar src/lib/prisma.ts (singleton)

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 6.1: Criar o singleton do Prisma Client**

Conteúdo de `/Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 6.2: Remover o .gitkeep da pasta lib**

```bash
rm /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital/src/lib/.gitkeep
```

- [ ] **Step 6.3: Verificar que o TypeScript compila sem erros**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npx tsc --noEmit 2>&1
```

Saída esperada: sem erros.

> Se houver erro sobre `@prisma/client` não encontrado, rode `npx prisma generate` primeiro e repita.

- [ ] **Step 6.4: Commit**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
git add src/lib/prisma.ts && \
git commit -m "adiciona singleton do Prisma Client em src/lib/prisma.ts"
```

---

## Task 7: Rodar a migration inicial

**Files:**
- Create: `prisma/migrations/` (gerado automaticamente)

- [ ] **Step 7.1: Garantir que o Postgres está rodando**

```bash
psql -U postgres -c "SELECT 1;" 2>&1
```

Saída esperada: `?column? ---------- 1`

Se retornar erro, abra o Postgres.app e aguarde o status ficar verde.

- [ ] **Step 7.2: Rodar a migration**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npx prisma migrate dev --name init 2>&1
```

Saída esperada (trecho):
```
Applying migration `20260524000000_init`
Database migrations applied successfully.
✔ Generated Prisma Client
```

Se aparecer erro de conexão (`Can't reach database server`), verifique se o Postgres.app está rodando e a DATABASE_URL no `.env.local` está correta.

- [ ] **Step 7.3: Verificar as tabelas no banco**

```bash
psql -U postgres -d frutificar_dev -c "\dt" 2>&1
```

Saída esperada: lista com ~20 tabelas incluindo `User`, `Plan`, `Course`, `Module`, `Lesson`, etc.

- [ ] **Step 7.4: Commit das migrations geradas**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
git add prisma/migrations/ && \
git commit -m "adiciona migration inicial com todas as tabelas"
```

---

## Task 8: Validação final

- [ ] **Step 8.1: Rodar prisma validate**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npx prisma validate 2>&1
```

Saída esperada: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 8.2: Verificar build do Next.js**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npm run build 2>&1 | tail -15
```

Saída esperada: `✓ Compiled successfully` sem erros TypeScript.

- [ ] **Step 8.3: Abrir Prisma Studio**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
npx prisma studio 2>&1 &
sleep 3
echo "Prisma Studio deve estar em http://localhost:5555"
```

Abra `http://localhost:5555` no browser e confirme que os modelos aparecem no painel esquerdo (User, Plan, Course, etc.).

Encerre o studio com `Ctrl+C` ao terminar.

- [ ] **Step 8.4: Commit final**

```bash
cd /Users/cassiobispo/Downloads/FRUTIFICAR/frutificar-digital && \
git add . && \
git commit -m "feat: prompt 2 concluído — Postgres + Prisma schema completo + migration init"
```

---

## Checklist de entrega

- [ ] Postgres rodando em localhost:5432 com banco `frutificar_dev`
- [ ] `docker-compose.yml` criado (referência para CI/CD)
- [ ] `prisma`, `@prisma/client`, `tsx` instalados
- [ ] `prisma/schema.prisma` com todos os 9 enums e 21 modelos
- [ ] `npx prisma validate` retorna zero erros
- [ ] `npx prisma migrate dev --name init` aplicada com sucesso
- [ ] `src/lib/prisma.ts` singleton criado
- [ ] `DATABASE_URL` em `.env.local` apontando para `frutificar_dev`
- [ ] `npm run build` sem erros
- [ ] Prisma Studio abre em `http://localhost:5555`
