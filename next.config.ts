import './src/env'
import type { NextConfig } from "next";

// Headers de segurança em todas as respostas.
const securityHeaders = [
  // Proíbe abrir o site dentro de iframe de outro domínio (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Uploads (laudos, documentos, materiais). A Vercel aceita no máximo
      // ~4,5 MB por requisição; o padrão do Next (1 MB) barrava quase tudo.
      bodySizeLimit: '4mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
};

export default nextConfig;
