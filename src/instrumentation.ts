import type { Instrumentation } from 'next'

/**
 * Instrumentação do Next.js (src/instrumentation.ts — com pasta src/ o arquivo
 * fica aqui, não na raiz). `onRequestError` é chamado pelo servidor sempre que
 * uma requisição falha sem tratamento (Server Components, Route Handlers,
 * Server Actions e proxy) — aqui viramos isso em alerta por e-mail ao admin.
 */

// Erros de "controle de fluxo" do Next (redirect(), notFound(), forbidden(),
// bailout de renderização…) não são falhas reais — são identificados pelo digest.
const EXPECTED_DIGEST_PREFIXES = [
  'NEXT_REDIRECT',
  'NEXT_HTTP_ERROR_FALLBACK',
  'NEXT_NOT_FOUND',
  'BAILOUT_TO_CLIENT_SIDE_RENDERING',
  'DYNAMIC_SERVER_USAGE',
]

function isExpectedNextError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('digest' in err)) return false
  const digest = (err as { digest?: unknown }).digest
  return typeof digest === 'string' && EXPECTED_DIGEST_PREFIXES.some((p) => digest.startsWith(p))
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  try {
    if (isExpectedNextError(err)) return
    // O envio de e-mail usa APIs do Node; no runtime edge apenas logamos.
    if (process.env.NEXT_RUNTIME !== 'nodejs') {
      console.error('[alerta]', request.method, context.routePath, err)
      return
    }

    // routePath é o padrão da rota (ex.: /app/blog/[slug]); sem query string.
    const routePath = context.routePath || request.path.split('?')[0]
    const { reportError } = await import('@/lib/alerts')
    await reportError(`${request.method} ${routePath}`, err, {
      routeType: context.routeType,
      renderSource: context.renderSource,
    })
  } catch {
    // Nunca deixa a instrumentação quebrar a resposta.
  }
}
