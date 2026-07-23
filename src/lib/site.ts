// URL pública do site, usada em metadata (SEO/OpenGraph), robots.txt e sitemap.
// Defina NEXT_PUBLIC_SITE_URL na Vercel com o domínio real de produção.
// Fallback: domínio institucional atual.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://frutificar.com.br'
