// Tipos da Gestão da Propriedade (licenças ambientais, documentos e histórico).
// A página server lê PropertyDocument por propriedade do aluno.

export type DocType = 'LICENCA' | 'DOCUMENTO' | 'HISTORICO'

export type PropDoc = {
  id: string
  type: DocType
  title: string
  description: string | null
  fileUrl: string | null
  issuer: string | null
  issuedAt: string | null   // ISO
  expiresAt: string | null  // ISO
  createdAt: string         // ISO
}

export type GestaoProperty = {
  id: string
  name: string
  location: string
  docs: PropDoc[]
}
