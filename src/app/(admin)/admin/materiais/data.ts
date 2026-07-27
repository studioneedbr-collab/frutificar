// Tipo de linha da tabela de materiais (admin).
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
