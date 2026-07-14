'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as courses from '@/server/repositories/courses.repository'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

function revalidateCourses() {
  revalidatePath('/admin/cursos')
  revalidatePath('/cursos')
  revalidatePath('/minicursos')
}

// Extrai o ID de 11 caracteres de um link/registro do YouTube (ou string vazia).
function extractYouTubeId(input: string): string {
  const s = input.trim()
  if (!s) return ''
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = s.match(p)
    if (m) return m[1]
  }
  return ''
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60) || 'curso'
}

// ─── Curso ────────────────────────────────────────────────
const courseSchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  type: z.enum(['PRINCIPAL', 'MINICOURSE']),
  instructor: z.string().optional(),
  description: z.string().optional(),
})

export async function createCourseAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  const parsed = courseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  try {
    const baseSlug = slugify(parsed.data.title)
    // garante slug único
    const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`
    const course = await courses.createCourse({
      title: parsed.data.title,
      slug,
      description: parsed.data.description || parsed.data.title,
      type: parsed.data.type,
      published: false,
    } as Prisma.CourseCreateInput)
    revalidateCourses()
    return { ok: true, data: { id: course.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar curso.' }
  }
}

export async function updateCourseAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  const parsed = courseSchema.partial().safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  try {
    await courses.updateCourse(id, {
      title: parsed.data.title,
      type: parsed.data.type,
      description: parsed.data.description,
    })
    revalidateCourses()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar curso.' }
  }
}

export async function togglePublishedAction(id: string, published: boolean): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  try {
    await courses.setCoursePublished(id, published)
    revalidateCourses()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao alterar publicação.' }
  }
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  try {
    await courses.softDeleteCourse(id)
    revalidateCourses()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover curso.' }
  }
}

// ─── Módulo ───────────────────────────────────────────────
export async function createModuleAction(courseId: string, title: string): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  if (!title.trim()) return { ok: false, error: 'Informe o título do módulo.' }
  try {
    const m = await courses.createModule(courseId, title.trim())
    revalidateCourses()
    return { ok: true, data: { id: m.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar módulo.' }
  }
}

export async function updateModuleAction(id: string, title: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  if (!title.trim()) return { ok: false, error: 'Informe o título do módulo.' }
  try {
    await courses.updateModule(id, title.trim())
    revalidateCourses()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao renomear módulo.' }
  }
}

export async function deleteModuleAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  try {
    await courses.deleteModule(id)
    revalidateCourses()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover módulo.' }
  }
}

// ─── Aula ─────────────────────────────────────────────────
const lessonSchema = z.object({
  title: z.string().min(2, 'Título da aula muito curto'),
  videoUrl: z.string().optional(),   // link do YouTube (ou ID)
  minutes: z.coerce.number().min(0).max(1000).optional(),
  description: z.string().optional(),
})

export async function createLessonAction(moduleId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  const parsed = lessonSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const videoId = parsed.data.videoUrl ? extractYouTubeId(parsed.data.videoUrl) : ''
  if (parsed.data.videoUrl && parsed.data.videoUrl.trim() && !videoId) {
    return { ok: false, error: 'Link do YouTube inválido. Cole a URL do vídeo ou o ID.' }
  }
  try {
    const lesson = await courses.createLesson(moduleId, {
      title: parsed.data.title,
      youtubeVideoId: videoId || null,
      durationSec: parsed.data.minutes ? Math.round(parsed.data.minutes * 60) : null,
      description: parsed.data.description || null,
    })
    revalidateCourses()
    return { ok: true, data: { id: lesson.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar aula.' }
  }
}

export async function updateLessonAction(id: string, input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  const parsed = lessonSchema.partial().safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  let videoId: string | null | undefined = undefined
  if (parsed.data.videoUrl !== undefined) {
    const raw = parsed.data.videoUrl.trim()
    videoId = raw ? extractYouTubeId(raw) : null
    if (raw && !videoId) return { ok: false, error: 'Link do YouTube inválido.' }
  }
  try {
    await courses.updateLesson(id, {
      title: parsed.data.title,
      youtubeVideoId: videoId,
      durationSec: parsed.data.minutes !== undefined ? Math.round((parsed.data.minutes ?? 0) * 60) : undefined,
      description: parsed.data.description,
    })
    revalidateCourses()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar aula.' }
  }
}

export async function deleteLessonAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  try {
    await courses.deleteLesson(id)
    revalidateCourses()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover aula.' }
  }
}
