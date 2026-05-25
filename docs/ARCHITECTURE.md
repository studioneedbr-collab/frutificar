# Arquitetura — Frutificar Digital

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 (strict) |
| Banco de dados | PostgreSQL 16 (Docker) |
| ORM | Prisma 7 |
| Autenticação | NextAuth v5 (JWT) |
| UI | shadcn/ui + Tailwind CSS 4 |
| IA | OpenAI GPT-4o-mini |
| Validação | Zod v4 |

## Estrutura de rotas

```
/                    → Landing page
/login               → Autenticação
/cadastro            → Registro
/planos              → Planos e preços

/dashboard           → App home (autenticado)
/cursos              → Listagem de cursos
/cursos/[slug]       → Detalhes do curso
/cursos/[slug]/[id]  → Player da aula
/chat                → Chat com IA agrícola
/lives               → Lives agendadas
/podcasts            → Podcasts
/diagnostico         → Diagnóstico de solo
/agendamentos        → Visitas técnicas
/servicos            → Solicitações de serviço
/gestao              → Gestão rural
/propriedades        → Propriedades cadastradas
/dias-de-campo       → Dias de campo
/perfil              → Perfil do usuário
/perfil/assinatura   → Plano atual e upgrade
/perfil/certificados → Certificados conquistados

/admin               → Painel administrativo
```

## Fluxo de autenticação

```
Usuário → /login → NextAuth Credentials
                 → bcrypt.compare(senha, passwordHash)
                 → JWT com { id, role, plan }
                 → Session cookie
                 → proxy.ts verifica JWT em cada request
```

## Controle de acesso por plano

```
Request → proxy.ts
         → getRouteRequiredFeature(pathname)
         → session.user.plan (do JWT, sem DB)
         → canAccessFeature(plan, feature)
         → permite ou redireciona /perfil/assinatura
```

## Padrão de dados

```
Page (Server Component)
  → Repository (Prisma)

Page (Server Component, mutação)
  → Server Action
    → Zod validation
    → Service (regras de negócio)
      → Repository (Prisma)
    → ActionResult<T>
```

## Modelos principais

```
User ──────── Subscription ──── Plan
  │                              │
  ├── Enrollment ──── Course ───┤ CourseAccess
  ├── LessonProgress             │
  ├── Certificate                └── Module ── Lesson ── Material
  ├── ChatSession
  ├── TechnicalVisit ── Property ── Plot
  └── ServiceRequest               ├── SoilAnalysis
                                   ├── Activity
                                   └── Recommendation ── RecommendationRule
```

## Chat IA

```
POST /api/chat
  → auth() verifica sessão JWT
  → Zod valida { message, sessionId }
  → ChatSession.findFirst ou create
  → Rate limit: 30 msg/hora por sessão (contagem via ts nos messages JSON)
  → Persiste mensagem do usuário
  → OpenAI GPT-4o-mini stream (últimas 10 msgs como contexto)
  → ReadableStream → Response (text/plain streaming)
  → Persiste resposta do assistente após stream completo
  → Header X-Session-Id retorna o ID da sessão
```

## Decisões arquiteturais

**Por que JWT para plano?** Evita query ao banco em todo request. O plano é cacheado no JWT e atualizado no próximo login.

**Por que `proxy.ts` em vez de `middleware.ts`?** Next.js 16 renomeou o arquivo de middleware.

**Por que Prisma 7 com driver adapter?** O PrismaClient no v7 requer explicitamente um adapter de conexão em vez de configuração inline.

**Por que não Redis/cache externo?** MVP simplificado. Cache de plano no JWT é suficiente para o volume inicial.

**Por que não usar o Vercel AI SDK (`ai`)?** O `ai` package é ESM-only e a integração com Next.js 16 App Router já funciona com raw `ReadableStream` via OpenAI SDK diretamente, reduzindo dependências.
