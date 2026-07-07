'use client'

import { uploadFileAction } from '@/server/actions/uploads'

// Helper de client: monta o FormData e chama a Server Action de upload.
// `prefix` vira a "pasta" no bucket (ex.: 'materiais', 'podcasts').
export async function uploadFile(
  file: File,
  prefix: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('prefix', prefix)
  const res = await uploadFileAction(fd)
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true, url: res.data.url }
}

// Formata bytes para exibição amigável (ex.: "3.8 MB").
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
