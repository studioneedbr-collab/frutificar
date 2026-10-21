'use server'

import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import * as settings from '@/server/repositories/settings.repository'

// Chaves aceitas (evita gravar lixo). Valores sensíveis (chaves de API, secrets)
// NÃO ficam aqui — esses seguem em variáveis de ambiente por segurança.
const ALLOWED_KEYS = new Set([
  'platform_name', 'base_url', 'support_email', 'chat_limit', 'maintenance_mode',
  'session_expiry', 'login_attempts', 'bcrypt_cost', 'two_factor',
  'email_provider', 'sender_email', 'notify_lives', 'notify_courses',
  's3_bucket', 'aws_region', 'gateway', 'ai_model', 'youtube_enabled',
])

// Validação por chave: valores que alimentam comportamento real (IA, limites).
const VALIDATORS: Record<string, (v: string) => boolean> = {
  ai_model: (v) => ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'].includes(v),
  chat_limit: (v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 200,
  maintenance_mode: (v) => v === 'true' || v === 'false',
  youtube_enabled: (v) => v === 'true' || v === 'false',
  support_email: (v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
  sender_email: (v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
  base_url: (v) => v === '' || /^https?:\/\//i.test(v),
}

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Dados inválidos.' }
  }

  const entries: Record<string, string> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(k)) continue
    const value = String(v).trim().slice(0, 500)
    const check = VALIDATORS[k]
    if (check && !check(value)) return { ok: false, error: `Valor inválido para "${k}".` }
    entries[k] = value
  }
  if (Object.keys(entries).length === 0) {
    return { ok: false, error: 'Nada para salvar.' }
  }

  try {
    await settings.saveSettings(entries)
    revalidatePath('/admin/configuracoes')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao salvar configurações.' }
  }
}
