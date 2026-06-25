import 'server-only'

/**
 * Envia o e-mail de verificação. Enquanto RESEND_API_KEY for placeholder/vazio,
 * apenas loga o link no console (não lança erro). Quando a chave real existir,
 * trocar o corpo por uma chamada ao Resend — a assinatura permanece igual.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const link = `${baseUrl}/verificar-email?token=${token}`
  const key = process.env.RESEND_API_KEY

  if (!key || key === 'placeholder') {
    console.info(`[email:stub] Verificação para ${email}: ${link}`)
    return
  }

  // TODO(resend): quando a chave real existir, enviar via Resend aqui.
  console.info(`[email] Verificação para ${email}: ${link}`)
}
