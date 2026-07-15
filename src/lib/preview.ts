// Flag de preview (modo demo sem banco). Espelha o PREVIEW_MODE do middleware (src/proxy.ts).
// true  → telas usam dados mock e não chamam o banco/Server Actions.
// false → telas leem/gravam no Supabase via repositories + Server Actions.
// Real é o padrão (produção). O modo demo/mock é OPT-IN: só liga com
// PREVIEW_MODE="true" explícito. Assim nenhum ambiente com banco cai em mock
// silenciosamente (o que fazia "não gravar / não apagar nada").
export const PREVIEW_MODE = process.env.PREVIEW_MODE === 'true'
