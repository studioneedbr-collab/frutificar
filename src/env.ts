import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET deve ter ao menos 32 caracteres'),
  NEXTAUTH_URL: z.string().url().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY inválida').optional(),

  // YouTube
  YOUTUBE_API_KEY: z.string().optional(),

  // Payment gateway
  GATEWAY_API_KEY: z.string().optional(),
  GATEWAY_WEBHOOK_SECRET: z.string().optional(),

  // Email (Brevo transacional)
  RESEND_API_KEY: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email('EMAIL_FROM deve ser um e-mail válido').optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  ADMIN_NOTIFICATION_EMAIL: z
    .string()
    .email('ADMIN_NOTIFICATION_EMAIL deve ser um e-mail válido')
    .optional(),

  // AWS
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Supabase Storage (upload de arquivos: materiais, áudios de podcast, etc.)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),

  // Tutoria — link do grupo de WhatsApp (opcional)
  WHATSAPP_TUTORIA_URL: z.string().url().optional(),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(`\n❌ Variáveis de ambiente inválidas:\n${formatted}\n`)
  }
  return parsed.data
}

export const env = validateEnv()
