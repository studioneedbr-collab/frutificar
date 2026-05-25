# Frutificar Digital

Plataforma educacional e de gestão para produtores rurais. Cursos em vídeo, chat com IA agrícola, diagnóstico de solo, visitas técnicas e gestão de propriedades.

## Stack

Next.js 16 · TypeScript · PostgreSQL · Prisma 7 · NextAuth v5 · shadcn/ui · OpenAI GPT-4o-mini

## Documentação

- [Setup e instalação](docs/SETUP.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Padrões de código](docs/PATTERNS.md)

## Desenvolvimento rápido

```bash
npm install
cp .env.example .env.local  # configure variáveis
docker compose up -d         # sobe o banco
./node_modules/.bin/prisma migrate dev
./node_modules/.bin/prisma db seed
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

**Login de teste:** `aluno@teste.com` / `aluno123`
**Admin:** `admin@frutificar.com` / `admin123`

## Estrutura

```
src/app/(app)/      # Rotas autenticadas
src/app/(admin)/    # Painel admin
src/app/(public)/   # Rotas públicas
src/app/api/        # API routes (auth, chat)
src/server/         # Actions, Services, Repositories
src/components/     # UI components
```

## Planos

| Plano | Acesso |
|-------|--------|
| ESSENCIAL | Cursos gratuitos, dashboard |
| PREMIUM | Cursos premium, lives, podcasts |
| GOLD | Tudo + chat IA, diagnóstico solo, visitas técnicas |
