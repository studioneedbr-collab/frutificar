// Flag de preview (modo demo sem banco). Espelha o PREVIEW_MODE do middleware (src/proxy.ts).
// true  → telas usam dados mock e não chamam o banco/Server Actions.
// false → telas leem/gravam no Supabase via repositories + Server Actions.
export const PREVIEW_MODE = process.env.PREVIEW_MODE !== 'false'
