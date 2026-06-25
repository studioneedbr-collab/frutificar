// Geração de PDF client-side (jsPDF). Usado nos botões "Baixar laudo / Ver relatório / Recibo".
// Funciona no preview (sem backend). Chamar apenas em event handlers do browser.
import { jsPDF } from 'jspdf'

// ── Paleta da marca (aprox. dos tokens oklch) ──
const C = {
  night: '#0a2614',
  deep: '#0e3d1f',
  green: '#2d7a3e',
  light: '#a5d6a7',
  earth: '#c47b3e',
  gold: '#caa13a',
  text: '#1f3528',
  muted: '#5a6b5f',
  line: '#e2e8e3',
  zebra: '#f4f7f3',
  white: '#ffffff',
}

const M = 48 // margem
const PAGE_W = 595.28

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function nowStamp() {
  return new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function protocolo() {
  const d = new Date()
  const base = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rnd = String(Math.floor(d.getTime() % 100000)).padStart(5, '0')
  return `FRT-${base}-${rnd}`
}

/** Cabeçalho de marca + título do documento. Retorna o Y onde o conteúdo deve começar. */
function header(doc: jsPDF, kicker: string, title: string) {
  doc.setFillColor(C.deep)
  doc.rect(0, 0, PAGE_W, 112, 'F')
  // faixa âmbar
  doc.setFillColor(C.earth)
  doc.rect(0, 112, PAGE_W, 4, 'F')

  // marca
  doc.setTextColor(C.light)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('FRUTIFICAR DIGITAL', M, 40)

  doc.setTextColor(C.white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(kicker.toUpperCase(), M, 56)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(title, M, 88)

  return 150
}

/** Rodapé com protocolo e data de geração. */
function footer(doc: jsPDF) {
  const y = 800
  doc.setDrawColor(C.line)
  doc.setLineWidth(1)
  doc.line(M, y, PAGE_W - M, y)
  doc.setTextColor(C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Documento gerado por Frutificar Digital em ${nowStamp()}`, M, y + 16)
  doc.text(`Protocolo ${protocolo()}`, PAGE_W - M, y + 16, { align: 'right' })
  doc.setTextColor(C.muted)
  doc.text('Educação, gestão e tecnologia para o produtor rural brasileiro.', M, y + 30)
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setTextColor(C.earth)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(text.toUpperCase(), M, y)
  doc.setDrawColor(C.line)
  doc.setLineWidth(1)
  doc.line(M, y + 6, PAGE_W - M, y + 6)
  return y + 24
}

/** Grade de pares label/valor em 2 colunas. */
function metaGrid(doc: jsPDF, pairs: [string, string][], y: number) {
  const colW = (PAGE_W - M * 2) / 2
  let cy = y
  for (let i = 0; i < pairs.length; i += 2) {
    const row = pairs.slice(i, i + 2)
    row.forEach(([label, value], col) => {
      const x = M + col * colW
      doc.setTextColor(C.muted)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.text(label.toUpperCase(), x, cy)
      doc.setTextColor(C.text)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(value, x, cy + 15)
    })
    cy += 40
  }
  return cy
}

function paragraph(doc: jsPDF, text: string, y: number) {
  doc.setTextColor(C.text)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  const lines = doc.splitTextToSize(text, PAGE_W - M * 2)
  doc.text(lines, M, y)
  return y + lines.length * 15 + 6
}

function bullets(doc: jsPDF, items: string[], y: number) {
  let cy = y
  items.forEach((it) => {
    doc.setFillColor(C.green)
    doc.circle(M + 3, cy - 3, 2.2, 'F')
    doc.setTextColor(C.text)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    const lines = doc.splitTextToSize(it, PAGE_W - M * 2 - 16)
    doc.text(lines, M + 14, cy)
    cy += lines.length * 15 + 6
  })
  return cy
}

// ─────────────────────────── Relatório de Visita Técnica ───────────────────────────

export type VisitaReport = {
  tipo?: string
  agronomo?: string
  propriedade: string
  data: string
  status?: string
  observacoes?: string
  recomendacoes?: string[]
}

export function gerarRelatorioVisita(v: VisitaReport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = header(doc, 'Relatório técnico', v.tipo ?? 'Visita Técnica')

  y = metaGrid(doc, [
    ['Propriedade', v.propriedade],
    ['Data', v.data],
    ['Responsável técnico', v.agronomo ?? 'Equipe agronômica Frutificar'],
    ['Status', v.status ?? 'Concluído'],
  ], y)

  y += 8
  y = sectionTitle(doc, 'Observações da visita', y)
  y = paragraph(
    doc,
    v.observacoes ??
      'Lavoura inspecionada em campo. Avaliadas condições gerais da cultura, presença de pragas e doenças, estado nutricional e manejo adotado. Sem ocorrências críticas no momento da visita.',
    y,
  )

  y += 10
  y = sectionTitle(doc, 'Recomendações', y)
  bullets(
    doc,
    v.recomendacoes ?? [
      'Manter o monitoramento semanal de pragas nos talhões avaliados.',
      'Realizar adubação de cobertura conforme análise de solo mais recente.',
      'Reavaliar o estande e a uniformidade da florada na próxima visita.',
    ],
    y,
  )

  footer(doc)
  doc.save(`relatorio-visita-${slug(v.propriedade)}.pdf`)
}

// ─────────────────────────── Laudo de Diagnóstico de Solo ───────────────────────────

export type LaudoSoloReport = {
  talhao: string
  data: string
  ph?: string
  parametros?: { nome: string; valor: string; status: string }[]
  recomendacoes?: string[]
}

const statusColor: Record<string, string> = {
  adequado: C.green, ideal: C.green, ok: C.green,
  atenção: C.earth, atencao: C.earth, médio: C.earth, medio: C.earth,
  baixo: '#c0392b', alto: '#c0392b',
}

export function gerarLaudoSolo(l: LaudoSoloReport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = header(doc, 'Análise com IA', 'Laudo de Solo')

  y = metaGrid(doc, [
    ['Talhão', l.talhao],
    ['Data da análise', l.data],
    ['pH (água)', l.ph ?? '5,8'],
    ['Método', 'Diagnóstico Frutificar IA'],
  ], y)

  y += 8
  y = sectionTitle(doc, 'Parâmetros do solo', y)

  const params = l.parametros ?? [
    { nome: 'Matéria orgânica', valor: '2,9%', status: 'Adequado' },
    { nome: 'Fósforo (P)', valor: '18 mg/dm³', status: 'Atenção' },
    { nome: 'Potássio (K)', valor: '120 mg/dm³', status: 'Adequado' },
    { nome: 'Cálcio (Ca)', valor: '2,4 cmolc/dm³', status: 'Adequado' },
    { nome: 'Magnésio (Mg)', valor: '0,8 cmolc/dm³', status: 'Baixo' },
    { nome: 'Saturação por bases (V%)', valor: '58%', status: 'Adequado' },
  ]

  // cabeçalho da tabela
  const tx = M
  const tw = PAGE_W - M * 2
  doc.setFillColor(C.zebra)
  doc.rect(tx, y - 12, tw, 22, 'F')
  doc.setTextColor(C.muted)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('PARÂMETRO', tx + 10, y + 3)
  doc.text('VALOR', tx + tw * 0.55, y + 3)
  doc.text('AVALIAÇÃO', tx + tw * 0.78, y + 3)
  y += 22

  params.forEach((p, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(C.zebra)
      doc.rect(tx, y - 12, tw, 22, 'F')
    }
    doc.setTextColor(C.text)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(p.nome, tx + 10, y + 3)
    doc.setFont('helvetica', 'bold')
    doc.text(p.valor, tx + tw * 0.55, y + 3)
    const col = statusColor[p.status.toLowerCase()] ?? C.muted
    doc.setTextColor(col)
    doc.text(p.status, tx + tw * 0.78, y + 3)
    y += 22
  })

  y += 16
  y = sectionTitle(doc, 'Recomendação da IA', y)
  bullets(
    doc,
    l.recomendacoes ?? [
      'Calagem: aplicar 1,8 t/ha de calcário dolomítico para elevar saturação por bases e corrigir o magnésio.',
      'Adubação de plantio com formulação NPK 20-05-20 conforme a produtividade esperada.',
      'Aplicação de gesso agrícola para melhorar o ambiente radicular em profundidade.',
      'Reavaliar o solo em 6 meses para acompanhar a correção.',
    ],
    y,
  )

  footer(doc)
  doc.save(`laudo-solo-${slug(l.talhao)}.pdf`)
}

// ─────────────────────────── Recibo de Pagamento ───────────────────────────

export type ReciboReport = {
  numero?: string
  plano: string
  valor: string
  data: string
  metodo?: string
  pagador?: string
}

export function gerarRecibo(r: ReciboReport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = header(doc, 'Comprovante de pagamento', 'Recibo')

  y = metaGrid(doc, [
    ['Plano', r.plano],
    ['Data do pagamento', r.data],
    ['Forma de pagamento', r.metodo ?? 'Cartão de crédito · Asaas'],
    ['Pagador', r.pagador ?? 'Douglas Vargas'],
  ], y)

  // caixa de valor + status pago
  y += 10
  const bw = PAGE_W - M * 2
  doc.setFillColor(C.zebra)
  doc.roundedRect(M, y, bw, 64, 8, 8, 'F')
  doc.setTextColor(C.muted)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('VALOR PAGO', M + 18, y + 24)
  doc.setTextColor(C.deep)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(r.valor, M + 18, y + 48)

  // selo PAGO
  doc.setFillColor(C.green)
  doc.roundedRect(PAGE_W - M - 92, y + 18, 74, 28, 14, 14, 'F')
  doc.setTextColor(C.white)
  doc.setFontSize(11)
  doc.text('PAGO', PAGE_W - M - 55, y + 36, { align: 'center' })
  y += 90

  y = sectionTitle(doc, 'Detalhes', y)
  y = paragraph(
    doc,
    `Recibo referente à assinatura do plano ${r.plano} na plataforma Frutificar Digital. Pagamento confirmado e processado com sucesso via Asaas. Este documento serve como comprovante.`,
    y,
  )

  footer(doc)
  doc.save(`recibo-${slug(r.plano)}-${slug(r.data)}.pdf`)
}
