// Tipos + dados mock da tela de Diagnóstico (compartilhados entre o server page e a view client).

export type HistoricoItem = {
  id?: string
  talhao: string
  data: string
  status: string
}

export type TalhaoOption = { value: string; label: string }

/* status: 'ok' (adequado), 'attention' (atenção), 'low' (baixo) */
export const params = [
  { label: 'pH (água)', value: '5,8', pct: 72, status: 'ok', tag: 'Ideal' },
  { label: 'Matéria Orgânica', value: '2,4 dag/kg', pct: 58, status: 'attention', tag: 'Atenção' },
  { label: 'Fósforo (P)', value: '8 mg/dm³', pct: 30, status: 'low', tag: 'Baixo' },
  { label: 'Potássio (K)', value: '0,28 cmolc/dm³', pct: 64, status: 'ok', tag: 'Adequado' },
  { label: 'Cálcio (Ca)', value: '2,1 cmolc/dm³', pct: 55, status: 'attention', tag: 'Atenção' },
  { label: 'Magnésio (Mg)', value: '0,9 cmolc/dm³', pct: 68, status: 'ok', tag: 'Adequado' },
  { label: 'Saturação por Bases (V%)', value: '48%', pct: 48, status: 'low', tag: 'Baixo' },
]

export const recommendations = [
  'Calagem: aplicar 1,8 t/ha de calcário dolomítico para elevar a saturação por bases a 60%.',
  'Adubação NPK 20-05-20 em cobertura, parcelada em duas aplicações ao longo da safra.',
  'Gesso agrícola: 600 kg/ha para melhorar o ambiente radicular em profundidade.',
  'Reavaliar a análise de solo em 6 meses para confirmar a correção do pH e do fósforo.',
]

const mockTalhoes = ['Talhão A1', 'Talhão A2', 'Talhão B1', 'Várzea']

export const mockTalhaoOptions: TalhaoOption[] = mockTalhoes.map((t) => ({ value: t, label: t }))

export const initialHistorico: HistoricoItem[] = [
  { talhao: 'Talhão A1', data: '24 jun 2026', status: 'Concluído' },
  { talhao: 'Talhão A2', data: '18 jun 2026', status: 'Concluído' },
  { talhao: 'Várzea', data: '11 jun 2026', status: 'Em análise' },
  { talhao: 'Talhão B1', data: '02 jun 2026', status: 'Concluído' },
]
