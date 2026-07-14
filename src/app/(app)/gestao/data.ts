// Tipos + mock da Gestão da Propriedade (licenças ambientais, documentos e histórico).
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

export const mockProperties: GestaoProperty[] = [
  {
    id: 'mock-1',
    name: 'Fazenda Santa Clara',
    location: 'Patrocínio/MG',
    docs: [
      { id: 'd1', type: 'LICENCA', title: 'Licença de Operação (LO)', description: 'Emitida pelo órgão ambiental estadual.', fileUrl: null, issuer: 'SEMAD/MG', issuedAt: '2024-03-10', expiresAt: '2026-03-10', createdAt: '2024-03-10' },
      { id: 'd2', type: 'LICENCA', title: 'Outorga de uso da água', description: null, fileUrl: null, issuer: 'IGAM', issuedAt: '2023-08-01', expiresAt: '2025-08-01', createdAt: '2023-08-01' },
      { id: 'd3', type: 'DOCUMENTO', title: 'CAR — Cadastro Ambiental Rural', description: 'Comprovante de inscrição.', fileUrl: null, issuer: null, issuedAt: null, expiresAt: null, createdAt: '2024-01-15' },
      { id: 'd4', type: 'HISTORICO', title: 'Renovação da adubação de cobertura', description: 'Aplicação de NPK 20-05-20 em todos os talhões.', fileUrl: null, issuer: null, issuedAt: '2026-05-20', expiresAt: null, createdAt: '2026-05-20' },
    ],
  },
]
