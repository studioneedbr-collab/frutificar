// Leitura de laudo de solo com IA (GPT-4o visão). Recebe a imagem/PDF do laudo em
// data URL (base64) e devolve os parâmetros extraídos + plano de correção/adubação
// para cafeicultura. Só roda no servidor (usado por Server Action).

import { openai } from '@/lib/openai'

export type AiSoilParam = {
  label: string
  value: string
  status: 'ok' | 'attention' | 'low'
  tag: string
  pct: number
}

export type AiSoilResult = {
  legivel: boolean
  ph: number
  params: AiSoilParam[]
  recommendations: string[]
  summary: string
}

const SYSTEM_PROMPT = `Você é um agrônomo especialista em fertilidade do solo para cafeicultura (café arábica e conilon). Recebe a imagem ou o PDF de um laudo de análise de solo e deve interpretá-lo.

Sua tarefa: extrair os principais parâmetros do laudo e gerar um plano prático de correção e adubação para café.

Responda SOMENTE com um JSON válido (sem markdown, sem comentários), exatamente neste formato:
{
  "legivel": boolean,           // false se a imagem NÃO for um laudo de solo legível
  "ph": number,                 // pH em água (ex.: 5.8); 0 se não houver
  "params": [                   // parâmetros lidos do laudo
    {
      "label": string,          // ex.: "pH (água)", "Fósforo (P)", "Potássio (K)", "Cálcio (Ca)", "Magnésio (Mg)", "Matéria Orgânica", "Saturação por Bases (V%)"
      "value": string,          // valor com unidade, como no laudo (ex.: "8 mg/dm³")
      "status": "ok" | "attention" | "low",  // adequação para café
      "tag": string,            // rótulo curto: "Ideal", "Adequado", "Atenção" ou "Baixo"
      "pct": number             // 0-100: quão adequado está (100 = ideal para café)
    }
  ],
  "recommendations": [string],  // recomendações objetivas com doses quando possível (t/ha, kg/ha)
  "summary": string             // 1-2 frases resumindo o estado do solo
}

Regras:
- Interprete faixas típicas para CAFÉ (ex.: V% ideal ~60%, pH água 5,5-6,0, P adequado > 15 mg/dm³ em resina).
- Se algum parâmetro não constar no laudo, apenas não o inclua.
- Se a imagem estiver ilegível ou não for um laudo de solo, retorne {"legivel": false, "ph": 0, "params": [], "recommendations": [], "summary": ""}.`

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } }

/**
 * Lê um laudo de solo (imagem ou PDF) com a IA e devolve o resultado estruturado.
 * `dataUrl` deve ser um data URL base64 (ex.: "data:image/jpeg;base64,...").
 * Lança em caso de falha (chave ausente, IA indisponível ou JSON inválido).
 */
export async function analyzeSoilReportWithAI(params: {
  dataUrl: string
  mime: string
  filename: string
  analysisType?: string
  observacoes?: string
}): Promise<AiSoilResult> {
  const { dataUrl, mime, filename, analysisType, observacoes } = params

  const filePart: ContentPart = IMAGE_MIMES.includes(mime)
    ? { type: 'image_url', image_url: { url: dataUrl } }
    : { type: 'file', file: { filename, file_data: dataUrl } }

  const contextLines = [
    `Tipo de análise: ${analysisType || 'Completa'}.`,
    observacoes ? `Observações do produtor: ${observacoes}` : '',
    'Interprete o laudo anexado e devolva o JSON no formato especificado.',
  ].filter(Boolean)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        // O SDK aceita partes de conteúdo multimodais; o cast evita divergência de tipos entre versões.
        content: [{ type: 'text', text: contextLines.join('\n') }, filePart] as never,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as Partial<AiSoilResult>

  return {
    legivel: parsed.legivel !== false,
    ph: typeof parsed.ph === 'number' ? parsed.ph : 0,
    params: Array.isArray(parsed.params) ? parsed.params : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
  }
}
