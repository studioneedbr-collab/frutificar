// Tipos + mock da central de downloads da Gestão (planilhas e materiais).
// A página server lê DownloadableResource (o que o admin cadastra em Materiais).

export type Download = {
  id: string
  title: string
  description: string
  category: string
  plan: string
  url: string
}

export const mockDownloads: Download[] = [
  { id: '1', title: 'Planilha de Fluxo de Caixa Agrícola', description: 'Controle de entradas e saídas da safra, com resumo mensal automático.', category: 'SPREADSHEET', plan: 'PREMIUM', url: '' },
  { id: '2', title: 'Modelo de Contrato de Parceria Rural', description: 'Documento base para formalizar parcerias de produção.', category: 'DOC', plan: 'PREMIUM', url: '' },
  { id: '3', title: 'Guia de Custos de Produção por Hectare', description: 'Referência de custos para planejar a lavoura de café.', category: 'PDF', plan: 'GOLD', url: '' },
  { id: '4', title: 'Planilha de Controle de Estoque de Insumos', description: 'Acompanhe fertilizantes, defensivos e demais insumos.', category: 'SPREADSHEET', plan: 'PREMIUM', url: '' },
]
