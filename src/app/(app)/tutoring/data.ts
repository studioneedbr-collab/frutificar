// Tipos + mock da página de Tutoria (mentoria individual — exclusivo Gold).
// As solicitações são gravadas como ServiceRequest (serviceType iniciado por "Tutoria").

export type TutoriaRequest = {
  id: string
  tema: string
  description: string
  status: string // rótulo em PT
  data: string
}

export const TUTORIA_PREFIX = 'Tutoria'

export const temaOptions = [
  { value: 'Manejo e nutrição do solo', label: 'Manejo e nutrição do solo' },
  { value: 'Controle de pragas e doenças', label: 'Controle de pragas e doenças' },
  { value: 'Irrigação e manejo hídrico', label: 'Irrigação e manejo hídrico' },
  { value: 'Colheita e pós-colheita', label: 'Colheita e pós-colheita' },
  { value: 'Gestão e custos da lavoura', label: 'Gestão e custos da lavoura' },
  { value: 'Comercialização e preço', label: 'Comercialização e preço' },
  { value: 'Outro assunto', label: 'Outro assunto' },
]

export const mockTutorias: TutoriaRequest[] = [
  { id: '1', tema: 'Controle de pragas e doenças', description: 'Ferrugem persistente no talhão A2, mesmo após aplicação.', status: 'Em andamento', data: '02 jul 2026' },
  { id: '2', tema: 'Gestão e custos da lavoura', description: 'Montar planilha de custo por saca beneficiada.', status: 'Concluído', data: '20 jun 2026' },
]
