import { ImageResponse } from 'next/og'

// Imagem de compartilhamento (Open Graph / Twitter) gerada dinamicamente.
// Next injeta as meta tags automaticamente por convenção de arquivo.
export const alt = 'Frutificar Digital — educação e gestão para a cafeicultura'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0b2a1a 0%, #14432a 55%, #1c5c38 100%)',
          color: '#f5f3ec',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 6, color: '#c9a24b', fontWeight: 700 }}>
          FRUTIFICAR DIGITAL
        </div>
        <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, marginTop: 24, lineHeight: 1.1, maxWidth: 900 }}>
          Do plantio à xícara, conhecimento de ponta para o cafeicultor.
        </div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 32, color: '#cddccb', maxWidth: 900 }}>
          Cursos · Técnico IA especialista · Diagnóstico de solo · Gestão da propriedade
        </div>
      </div>
    ),
    { ...size },
  )
}
