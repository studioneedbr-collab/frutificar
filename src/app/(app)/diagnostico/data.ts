// Tipos + dados mock da tela de Diagnóstico (compartilhados entre o server page e a view client).

export type HistoricoItem = {
  id?: string
  talhao: string
  data: string
  status: string
}

export type TalhaoOption = { value: string; label: string }

// Parâmetro de solo (lido pela IA ou mock). status: 'ok' | 'attention' | 'low'
export type SoilParam = {
  label: string
  value: string
  status: string
  tag: string
  pct: number
}

// Resultado de um diagnóstico concluído (o que a tela exibe no bloco "último diagnóstico").
export type DiagnosticResult = {
  id: string
  talhao: string
  data: string
  ph?: number
  params: SoilParam[]
  recommendations: string[]
  summary?: string
  fileUrl?: string | null
}

// Talhões padrão usados como fallback quando o aluno ainda não cadastrou nenhum talhão.
const fallbackTalhoes = ['Talhão A1', 'Talhão A2', 'Talhão B1', 'Várzea']

export const mockTalhaoOptions: TalhaoOption[] = fallbackTalhoes.map((t) => ({ value: t, label: t }))
