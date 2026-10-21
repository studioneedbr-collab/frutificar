// E-mails de cobrança para o aluno (pagamento confirmado, fatura vencida,
// upgrade de plano). Nunca lançam erro: falha no envio só é logada.
import 'server-only'
import { baseUrl, escapeHtml, renderEmail, sendBrevoEmail } from '@/lib/email'

type Who = { email: string; name: string }

const first = (name: string) => escapeHtml(name.trim().split(' ')[0] || name)

async function send(to: Who, subject: string, html: string): Promise<void> {
  try {
    await sendBrevoEmail({ to: [{ email: to.email, name: to.name }], subject, htmlContent: html })
  } catch (err) {
    console.error('[billing-emails] falha ao enviar', subject, err)
  }
}

export async function sendPaymentConfirmedEmail(
  to: Who,
  info: { plan: string; value: string; method: string; nextCharge: string; cycle: 'MONTHLY' | 'YEARLY' },
): Promise<void> {
  await send(
    to,
    'Pagamento confirmado — Frutificar Digital',
    renderEmail({
      preheader: `Recebemos seu pagamento de ${info.value}. Seu acesso está liberado.`,
      eyebrow: 'Pagamento confirmado',
      heading: `Tudo certo, ${first(to.name)}!`,
      paragraphs: ['Recebemos seu pagamento e seu acesso à plataforma está liberado. 🌱'],
      details: [
        { label: 'Plano', value: `${escapeHtml(info.plan)} (${info.cycle === 'YEARLY' ? 'anual' : 'mensal'})` },
        { label: 'Valor', value: escapeHtml(info.value) },
        { label: 'Forma', value: escapeHtml(info.method) },
        { label: 'Próxima cobrança', value: escapeHtml(info.nextCharge) },
      ],
      cta: { label: 'Acessar a plataforma', url: `${baseUrl()}/dashboard` },
      note: 'O recibo fica disponível em Perfil → Assinatura.',
    }),
  )
}

export async function sendPaymentOverdueEmail(
  to: Who,
  info: { value: string; invoiceUrl: string | null },
): Promise<void> {
  const payUrl = info.invoiceUrl?.startsWith('https://') ? info.invoiceUrl : `${baseUrl()}/checkout`
  await send(
    to,
    'Sua mensalidade venceu — Frutificar Digital',
    renderEmail({
      preheader: 'Pague a fatura para voltar a acessar a plataforma.',
      eyebrow: 'Fatura em aberto',
      heading: `${first(to.name)}, sua mensalidade venceu`,
      paragraphs: [
        `Não identificamos o pagamento de ${escapeHtml(info.value)}. O acesso à plataforma fica pausado até a confirmação.`,
        'Assim que o pagamento cair, o acesso volta automaticamente — sem precisar falar com ninguém.',
      ],
      cta: { label: 'Pagar agora', url: payUrl },
      altLink: payUrl,
      note: 'Se você já pagou, desconsidere: a confirmação pode levar alguns minutos (boleto: até 3 dias úteis).',
    }),
  )
}

export async function sendPlanUpgradedEmail(to: Who, info: { plan: string; value: string }): Promise<void> {
  await send(
    to,
    `Seu plano agora é ${info.plan} — Frutificar Digital`,
    renderEmail({
      preheader: `Upgrade confirmado para o plano ${info.plan}.`,
      eyebrow: 'Upgrade confirmado',
      heading: `Bem-vindo ao ${escapeHtml(info.plan)}, ${first(to.name)}!`,
      paragraphs: [
        'O pagamento da diferença foi confirmado e os novos recursos já estão liberados na sua conta.',
        `A partir da próxima cobrança, a mensalidade passa a ser ${escapeHtml(info.value)}.`,
      ],
      cta: { label: 'Explorar os novos recursos', url: `${baseUrl()}/dashboard` },
    }),
  )
}
