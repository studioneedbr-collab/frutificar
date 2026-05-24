# Padrões de Arquitetura — Frutificar Digital

## Action → Service → Repository

Todo acesso a dados segue este fluxo obrigatório:

```
Page / Component
       ↓
  Server Action  (src/server/actions/*.ts)
       ↓
    Service      (src/server/services/*.ts)
       ↓
  Repository     (src/server/repositories/*.ts)
       ↓
    Prisma        (src/lib/prisma.ts)
```

**Regra de ouro:** Nenhuma página ou componente importa o Prisma diretamente.

---

## Camadas

### Repository
- Única responsabilidade: falar com o Prisma
- Sem regras de negócio
- Funções nomeadas descritivamente: `findAllPublished`, `findBySlug`, `create`, `softDelete`
- Retorna tipos Prisma diretamente

### Service
- Contém regras de negócio
- Pode orquestrar múltiplos repositórios
- Exemplo: `canUserAccessCourse` consulta subscription + courseAccess
- Exemplo: `markLessonComplete` atualiza progresso E emite certificado se terminou

### Server Action
- Ponto de entrada do cliente (RSC, form actions, client components)
- Sempre começa com `'use server'` no topo do arquivo
- Sempre valida sessão primeiro
- Sempre valida input com Zod
- Sempre retorna `ActionResult<T>`
- Nunca expõe erros internos ao cliente

---

## Exemplo Completo: createCourse

### 1. Repository (`src/server/repositories/courses.repository.ts`)

```typescript
export async function createCourse(data: Prisma.CourseCreateInput) {
  return prisma.course.create({ data })
}
```

### 2. Service (`src/server/services/courses.service.ts`)

```typescript
export { createCourse } from '@/server/repositories/courses.repository'
// (neste caso sem lógica adicional — Service re-exporta o Repository)
// Lógica entraria aqui: validar slug único de negócio, enviar notificação, etc.
```

### 3. Server Action (`src/server/actions/courses.ts`)

```typescript
'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-types'
import * as coursesService from '@/server/services/courses.service'

const createCourseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  type: z.enum(['PRINCIPAL', 'MINICOURSE']),
  coverImage: z.string().url().optional(),
})

export async function createCourse(input: unknown): Promise<ActionResult<{ id: string }>> {
  // 1. Verificar sessão e autorização
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  // 2. Validar input com Zod
  const parsed = createCourseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }
  }

  // 3. Chamar service
  try {
    const course = await coursesService.createCourse({ ...parsed.data, published: false })
    return { ok: true, data: { id: course.id } }
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'Slug já em uso.' }
    }
    return { ok: false, error: 'Erro interno.' }
  }
}
```

### 4. Usando na página (Server Component)

```typescript
// src/app/(admin)/admin/cursos/novo/page.tsx
import { createCourse } from '@/server/actions/courses'

export default function NovoCursoPage() {
  return <CursoForm action={createCourse} />
}
```

### 5. Usando num Client Component

```typescript
'use client'
import { createCourse } from '@/server/actions/courses'

async function handleSubmit(data: FormData) {
  const result = await createCourse(Object.fromEntries(data))
  if (!result.ok) {
    toast.error(result.error)
    return
  }
  toast.success('Curso criado!')
  router.push(`/admin/cursos/${result.data.id}`)
}
```

---

## ActionResult

```typescript
// src/lib/action-types.ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }
```

**Nunca** lance exceções do Server Action ao cliente. Sempre capture e retorne `{ ok: false, error: '...' }`.

---

## Regras adicionais

1. **Sem Prisma em páginas** — use Repository ou Service
2. **Sem lógica de negócio em Actions** — só validação + chamada ao Service
3. **Sem lógica de acesso a dados em Services** — delegue ao Repository
4. **Zod obrigatório em Actions** — valide todo input externo
5. **Sessão verificada em toda Action** — antes de qualquer operação
