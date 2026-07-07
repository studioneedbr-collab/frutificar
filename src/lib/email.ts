import 'server-only'

/**
 * Envio de e-mails transacionais via Brevo (API HTTP v3, endpoint /smtp/email).
 *
 * Enquanto BREVO_API_KEY estiver vazio ou for "placeholder", nenhum e-mail é
 * enviado de verdade — apenas logamos no console (modo stub) para não quebrar o
 * preview/dev sem credenciais. Assim que a chave real existir, os envios ocorrem.
 *
 * O HTML dos templates segue as práticas de e-mail transacional: layout 100% em
 * tabelas, estilos inline, largura máxima de 600px, preheader oculto e botão
 * "bulletproof" com fallback VML para o Outlook (Windows).
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

function baseUrl(): string {
  return process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'http://localhost:3000'
}

function fromSender() {
  return {
    email: process.env.EMAIL_FROM ?? 'frutificardigital@gmail.com',
    name: process.env.EMAIL_FROM_NAME ?? 'Frutificar Digital',
  }
}

type Recipient = { email: string; name?: string }

/**
 * Dispara um e-mail transacional pelo Brevo. Nunca lança: em caso de falha,
 * apenas loga e retorna false — o chamador decide se isso é crítico.
 */
async function sendBrevoEmail(params: {
  to: Recipient[]
  subject: string
  htmlContent: string
}): Promise<boolean> {
  const key = process.env.BREVO_API_KEY

  if (!key || key === 'placeholder') {
    console.info(
      `[email:stub] (BREVO_API_KEY ausente) "${params.subject}" → ${params.to
        .map((r) => r.email)
        .join(', ')}`,
    )
    return false
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': key,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: fromSender(),
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[email] Brevo respondeu ${res.status}: ${detail}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[email] falha ao chamar o Brevo:', err)
    return false
  }
}

// ─── Paleta da marca ──────────────────────────────────────────
const C = {
  night: '#0e2a1c',
  deep: '#123626',
  forest: '#184c33',
  green: '#1f7a4d',
  earth: '#c9962f',
  ink: '#2d3b34',
  muted: '#7c8a82',
  line: '#e9e4d6',
  parchment: '#f4f1e8',
  card: '#faf8f1',
  white: '#ffffff',
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji'"

type Detail = { label: string; value: string }

type EmailParts = {
  preheader: string
  eyebrow: string
  heading: string
  /** Parágrafos de corpo. Cada item é uma linha (HTML permitido). */
  paragraphs: string[]
  cta?: { label: string; url: string }
  /** Cartão de dados (ex.: nome/e-mail do novo aluno). */
  details?: Detail[]
  /** Link alternativo mostrado abaixo do botão (ex.: copiar e colar URL). */
  altLink?: string
  /** Nota discreta no rodapé do conteúdo (ex.: "expira em 1h"). */
  note?: string
}

/** Botão "bulletproof" — renderiza corretamente inclusive no Outlook (VML). */
function button(label: string, url: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 4px;">
    <tr><td align="center" bgcolor="${C.green}" style="border-radius:12px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${url}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="25%" strokecolor="${C.green}" fillcolor="${C.green}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:${FONT};font-size:15px;font-weight:bold;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}"
         style="display:inline-block;background:${C.green};color:#ffffff;text-decoration:none;
                font-family:${FONT};font-size:15px;font-weight:700;line-height:20px;
                padding:14px 34px;border-radius:12px;box-shadow:0 2px 0 rgba(14,42,28,0.18);">
        ${label}
      </a>
      <!--<![endif]-->
    </td></tr>
  </table>`
}

function detailsCard(details: Detail[]): string {
  const rows = details
    .map(
      (d) => `
      <tr>
        <td style="padding:9px 0;font-family:${FONT};font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:${C.muted};white-space:nowrap;vertical-align:top;">${d.label}</td>
        <td style="padding:9px 0 9px 18px;font-family:${FONT};font-size:15px;font-weight:600;color:${C.ink};">${d.value}</td>
      </tr>`,
    )
    .join('')
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="margin:22px 0 8px;background:${C.card};border:1px solid ${C.line};border-radius:14px;">
    <tr><td style="padding:6px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td></tr>
  </table>`
}

/** Monta o HTML completo de um e-mail a partir das partes. */
function renderEmail(p: EmailParts): string {
  const paragraphs = p.paragraphs
    .map(
      (t) =>
        `<p style="margin:0 0 14px;font-family:${FONT};font-size:15.5px;line-height:1.68;color:${C.ink};">${t}</p>`,
    )
    .join('')

  const cta = p.cta ? button(p.cta.label, p.cta.url) : ''

  const altLink = p.altLink
    ? `<p style="margin:14px 0 0;font-family:${FONT};font-size:12.5px;line-height:1.6;color:${C.muted};">
         Se o botão não funcionar, copie e cole este endereço no navegador:<br>
         <a href="${p.altLink}" style="color:${C.green};word-break:break-all;">${p.altLink}</a>
       </p>`
    : ''

  const note = p.note
    ? `<p style="margin:18px 0 0;font-family:${FONT};font-size:12.5px;line-height:1.6;color:${C.muted};">${p.note}</p>`
    : ''

  const details = p.details ? detailsCard(p.details) : ''

  return `<!doctype html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <title>${p.heading}</title>
  <!--[if mso]><style>table,td,div,p,a{font-family:Arial,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.parchment};">
  <!-- preheader (texto de pré-visualização, oculto) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.parchment};">
    ${p.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.parchment};">
    <tr><td align="center" style="padding:36px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

        <!-- Cabeçalho / marca -->
        <tr><td style="padding:0 4px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,${C.forest},${C.green});text-align:center;line-height:30px;font-size:16px;">🌱</span>
              </td>
              <td style="vertical-align:middle;padding-left:10px;">
                <span style="font-family:${FONT};font-size:17px;font-weight:800;letter-spacing:-0.01em;color:${C.deep};">Frutificar Digital</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Card principal -->
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="background:${C.white};border:1px solid ${C.line};border-radius:20px;overflow:hidden;">

            <!-- faixa superior com gradiente -->
            <tr><td style="height:6px;background:linear-gradient(90deg,${C.night} 0%,${C.forest} 45%,${C.green} 75%,${C.earth} 100%);font-size:0;line-height:0;">&nbsp;</td></tr>

            <tr><td style="padding:38px 40px 40px;">
              <p style="margin:0 0 14px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${C.earth};">${p.eyebrow}</p>
              <h1 style="margin:0 0 20px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:${C.deep};">${p.heading}</h1>
              ${paragraphs}
              ${details}
              ${cta}
              ${altLink}
              ${note}
            </td></tr>
          </table>
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="padding:24px 24px 8px;text-align:center;">
          <p style="margin:0 0 6px;font-family:${FONT};font-size:12.5px;color:${C.muted};">
            Você recebeu este e-mail porque tem uma conta na Frutificar Digital.
          </p>
          <p style="margin:0;font-family:${FONT};font-size:12px;color:${C.muted};">
            © 2026 Frutificar Digital · <a href="${baseUrl()}" style="color:${C.forest};text-decoration:none;">frutificar.com.br</a><br>
            Este é um e-mail automático, não é necessário respondê-lo.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

// ─── E-mails ──────────────────────────────────────────────────

/** Verificação de e-mail — enviado ao aluno logo após o cadastro. */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = `${baseUrl()}/verificar-email?token=${token}`
  const sent = await sendBrevoEmail({
    to: [{ email }],
    subject: 'Confirme seu e-mail — Frutificar Digital',
    htmlContent: renderEmail({
      preheader: 'Falta um passo: confirme seu e-mail para ativar sua conta.',
      eyebrow: 'Bem-vindo à Frutificar',
      heading: 'Confirme seu e-mail',
      paragraphs: [
        'Que bom ter você por aqui! 🌱 Para ativar sua conta e liberar o acesso à plataforma, confirme seu endereço de e-mail no botão abaixo.',
      ],
      cta: { label: 'Confirmar meu e-mail', url: link },
      altLink: link,
      note: 'Por segurança, este link expira em 24 horas. Se você não criou esta conta, pode ignorar este e-mail.',
    }),
  })
  if (!sent) console.info(`[email:stub] Verificação para ${email}: ${link}`)
}

/** Boas-vindas — enviado após o aluno confirmar o e-mail. */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const primeiroNome = name.split(' ')[0] || name
  await sendBrevoEmail({
    to: [{ email, name }],
    subject: 'Sua conta está pronta! Bem-vindo(a) à Frutificar 🌱',
    htmlContent: renderEmail({
      preheader: 'Sua conta foi confirmada. Comece a explorar os cursos e ferramentas.',
      eyebrow: 'Conta confirmada',
      heading: `Olá, ${primeiroNome}!`,
      paragraphs: [
        'Sua conta está confirmada e pronta para uso. 🎉',
        'A partir de agora você tem acesso aos <strong>cursos com especialistas</strong>, à <strong>assistente de IA agrícola</strong> e às ferramentas de <strong>gestão da sua propriedade rural</strong>.',
        'Bons cultivos! 🌾',
      ],
      cta: { label: 'Acessar a plataforma', url: `${baseUrl()}/dashboard` },
    }),
  })
}

/** Aviso ao admin da Frutificar sobre um novo cadastro. */
export async function sendAdminNewUserNotification(user: { name: string; email: string }): Promise<void> {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!to) {
    console.info('[email] ADMIN_NOTIFICATION_EMAIL não configurado — aviso de novo cadastro não enviado.')
    return
  }
  await sendBrevoEmail({
    to: [{ email: to }],
    subject: `🌱 Novo cadastro: ${user.name}`,
    htmlContent: renderEmail({
      preheader: `${user.name} (${user.email}) acabou de criar uma conta.`,
      eyebrow: 'Notificação interna',
      heading: 'Novo aluno cadastrado',
      paragraphs: ['Um novo usuário acabou de criar uma conta na plataforma:'],
      details: [
        { label: 'Nome', value: user.name },
        { label: 'E-mail', value: user.email },
      ],
      cta: { label: 'Abrir painel de usuários', url: `${baseUrl()}/admin/usuarios` },
    }),
  })
}

/** Recuperação de senha — enviado quando o aluno solicita redefinição. */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${baseUrl()}/redefinir-senha?token=${token}`
  const sent = await sendBrevoEmail({
    to: [{ email }],
    subject: 'Redefinição de senha — Frutificar Digital',
    htmlContent: renderEmail({
      preheader: 'Recebemos um pedido para redefinir a senha da sua conta.',
      eyebrow: 'Recuperar acesso',
      heading: 'Redefinir sua senha',
      paragraphs: [
        'Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.',
      ],
      cta: { label: 'Redefinir senha', url: link },
      altLink: link,
      note: 'Este link expira em 1 hora. Se você não solicitou a troca de senha, ignore este e-mail — sua senha atual continua valendo.',
    }),
  })
  if (!sent) console.info(`[email:stub] Reset de senha para ${email}: ${link}`)
}
