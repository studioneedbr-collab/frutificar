'use client'

// Comprime fotos no navegador antes do upload: reduz para no máx. 1600px no
// lado maior e regrava em WebP (ou JPEG). Uma foto de celular de 4–8 MB cai
// para ~200–600 KB — economiza espaço no Storage e cabe no limite de envio.
// PDFs, áudios e GIFs passam intactos.

const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function compressImage(
  file: File,
  opts: { maxSide?: number; quality?: number } = {},
): Promise<File> {
  if (typeof window === 'undefined' || !COMPRESSIBLE.includes(file.type)) return file
  const maxSide = opts.maxSide ?? 1600
  const quality = opts.quality ?? 0.8

  try {
    // createImageBitmap respeita a orientação EXIF (foto não sai deitada).
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const toBlob = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
    // WebP é menor; Safari antigo devolve PNG quando não suporta → usa JPEG.
    let blob = await toBlob('image/webp')
    let type = 'image/webp'
    if (!blob || blob.type !== 'image/webp') {
      blob = await toBlob('image/jpeg')
      type = 'image/jpeg'
    }
    if (!blob || blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
    return new File([blob], `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}`, {
      type,
      lastModified: Date.now(),
    })
  } catch {
    // Formato que o navegador não decodifica (ex.: HEIC fora do Safari): envia o original.
    return file
  }
}
