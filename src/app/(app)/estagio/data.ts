// Tipos + mock da página de Estágio Supervisionado (Gold, voltado a estudantes).
// A candidatura grava como ServiceRequest (serviceType "Estágio — <área>").

export type EstagioItem = {
  id: string
  area: string
  description: string
  status: string
  data: string
}

export const ESTAGIO_PREFIX = 'Estágio'

export const areaOptions = [
  { value: 'Produção e manejo de café', label: 'Produção e manejo de café' },
  { value: 'Fertilidade e nutrição do solo', label: 'Fertilidade e nutrição do solo' },
  { value: 'Controle de pragas e doenças', label: 'Controle de pragas e doenças' },
  { value: 'Gestão da propriedade rural', label: 'Gestão da propriedade rural' },
  { value: 'Pós-colheita e qualidade', label: 'Pós-colheita e qualidade' },
  { value: 'Outra área', label: 'Outra área' },
]

export const mockEstagios: EstagioItem[] = [
  { id: '1', area: 'Produção e manejo de café', description: 'Tenho interesse em acompanhar a implantação de lavoura.', status: 'Em análise', data: '10 jul 2026' },
]
