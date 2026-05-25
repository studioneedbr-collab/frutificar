# Setup — Frutificar Digital

## Pré-requisitos

- Node.js 20+
- Docker Desktop (para o banco de dados)
- Git

## Passo a passo

### 1. Clone o repositório

```bash
git clone <repo-url>
cd frutificar-digital
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha:
- `NEXTAUTH_SECRET`: gere com `openssl rand -base64 32`
- `DATABASE_URL`: padrão `postgresql://postgres:postgres@localhost:5432/frutificar_dev`
- `OPENAI_API_KEY`: opcional para desenvolvimento (sem ela, o chat retorna erro 500)

### 4. Suba o banco de dados

```bash
docker compose up -d
```

Aguarde o container iniciar (~10s), então verifique:
```bash
docker compose ps
```

### 5. Execute as migrations

```bash
./node_modules/.bin/prisma migrate dev
```

### 6. Execute o seed

```bash
./node_modules/.bin/prisma db seed
```

Isso cria:
- 3 planos (ESSENCIAL, PREMIUM, GOLD)
- 1 admin: `admin@frutificar.com` / `admin123`
- 1 aluno GOLD: `aluno@teste.com` / `aluno123`
- 1 curso de demonstração com 6 aulas

### 7. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura de pastas

```
src/
  app/
    (app)/        # Rotas autenticadas
    (admin)/      # Painel admin
    (public)/     # Rotas públicas
    api/          # API routes
  components/
    chat/         # Componentes do módulo Chat IA
    courses/      # Componentes do módulo de cursos
    layout/       # Sidebar, header
    shared/       # Componentes reutilizáveis
    ui/           # shadcn/ui
  hooks/          # React hooks (client)
  lib/            # Utilitários e configurações
  server/
    actions/      # Server Actions
    repositories/ # Acesso ao banco
    services/     # Lógica de negócio
  types/          # TypeScript declarations
prisma/
  schema.prisma   # Schema do banco
  seed.ts         # Dados iniciais
docs/
  PATTERNS.md     # Padrão Action→Service→Repository
  ARCHITECTURE.md # Arquitetura do sistema
  SETUP.md        # Este arquivo
```
