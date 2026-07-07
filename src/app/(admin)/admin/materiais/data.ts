// Tipo de linha da tabela de materiais (admin) + mock usado no modo preview (sem banco).
// A página server mapeia os dados reais (listResources) para este mesmo formato.
// No banco: `type` ↔ category (texto livre) e `plan` ↔ requiredPlan (PlanName).
// `downloads`, `size` e `date` são campos apenas de exibição (defaults).

export type MaterialType = 'PDF' | 'SPREADSHEET' | 'DOC'
export type MaterialPlan = 'GOLD' | 'PREMIUM' | 'ESSENCIAL'

export type Material = {
  id: string
  title: string
  type: MaterialType
  plan: MaterialPlan
  downloads: number
  size: string
  date: string
}

export const mockMaterials: Material[] = [
  { id: '1', title: 'Planilha de Controle de Pragas — Cafeeiro', type: 'SPREADSHEET', plan: 'PREMIUM',   downloads: 523,  size: '1.2 MB', date: '01 jun 2026' },
  { id: '2', title: 'Guia de Adubação para Culturas Tropicais',  type: 'PDF',         plan: 'ESSENCIAL', downloads: 1240, size: '3.8 MB', date: '15 mai 2026' },
  { id: '3', title: 'Modelo de Contrato de Parceria Rural',      type: 'DOC',         plan: 'PREMIUM',   downloads: 312,  size: '0.8 MB', date: '10 mai 2026' },
  { id: '4', title: 'Planilha de Fluxo de Caixa Agrícola',       type: 'SPREADSHEET', plan: 'GOLD',      downloads: 198,  size: '2.1 MB', date: '05 mai 2026' },
  { id: '5', title: 'Manual de Boas Práticas — Cafeicultura',    type: 'PDF',         plan: 'ESSENCIAL', downloads: 891,  size: '5.4 MB', date: '28 abr 2026' },
  { id: '6', title: 'Formulário de Análise de Solo',             type: 'DOC',         plan: 'PREMIUM',   downloads: 156,  size: '0.5 MB', date: '20 abr 2026' },
]
