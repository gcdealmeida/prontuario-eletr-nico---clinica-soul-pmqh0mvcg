/**
 * Exportação DETALHADA do Relatório de Frequência (/relatorios, visão gestor):
 * uma linha por atendimento, no formato da planilha exemplo do usuário:
 * Nº | Data | Horário | Paciente | Área / Especialidade | Detalhe do Serviço | Status | Profissional Responsável
 * - Excel: SheetJS (xlsx) — cabeçalho fixo, Nº sequencial, datas DD/MM/AAAA;
 * - PDF: jsPDF — A4 paisagem com tabela formatada, título e período no cabeçalho.
 * Os dados chegam do RelatorioFrequencia (presencas já filtradas pelo painel de definição;
 * os filtros de período/profissional/serviço/programa são aplicados antes, no PainelRelatoriosAdmin).
 */
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { formatDataPTBR } from '@/lib/constants'
import { rotuloPeriodo } from '@/lib/relatoriosAdmin'
import type { PeriodoRange } from '@/lib/relatoriosAdmin'

export const COLUNAS_DETALHADO = [
  'Nº',
  'Data',
  'Horário',
  'Paciente',
  'Área / Especialidade',
  'Detalhe do Serviço',
  'Status',
  'Profissional Responsável',
] as const

export interface LinhaDetalhadaFrequencia {
  dataYmd: string // YYYY-MM-DD de data_atendimento
  horario?: string // HH:mm quando existir
  paciente: string
  areaEspecialidade: string
  detalheServico?: string
  status: string // já legível em português (Presente, Confirmado…)
  profissional: string
}

const LARGURAS_PDF = [8, 20, 15, 62, 46, 30, 20, 44] // soma ~245mm, cabe em A4 paisagem (297mm)

function nomeArquivo(ext: 'xlsx' | 'pdf'): string {
  return `relatorio-frequencia-detalhado.${ext}`
}

function ordenar(linhas: LinhaDetalhadaFrequencia[]): LinhaDetalhadaFrequencia[] {
  // Mais recente primeiro (como no exemplo), desempate por paciente.
  return [...linhas].sort(
    (a, b) => b.dataYmd.localeCompare(a.dataYmd) || a.paciente.localeCompare(b.paciente),
  )
}

export function exportarExcelFrequenciaDetalhado(
  linhas: LinhaDetalhadaFrequencia[],
  periodo: PeriodoRange,
): void {
  const aoa: (string | number)[][] = [
    [...COLUNAS_DETALHADO],
    ...ordenar(linhas).map((l, i) => [
      i + 1,
      formatDataPTBR(l.dataYmd),
      l.horario || '',
      l.paciente,
      l.areaEspecialidade,
      l.detalheServico || '',
      l.status,
      l.profissional,
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [
    { wch: 5 }, // Nº
    { wch: 12 }, // Data
    { wch: 9 }, // Horário
    { wch: 34 }, // Paciente
    { wch: 26 }, // Área / Especialidade
    { wch: 20 }, // Detalhe do Serviço
    { wch: 12 }, // Status
    { wch: 28 }, // Profissional Responsável
  ]
  // Cabeçalho congelado (linha 1) — trivial e mantém a planilha navegável.
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Frequência Detalhada')
  XLSX.writeFile(wb, nomeArquivo('xlsx'))
}

export function exportarPdfFrequenciaDetalhado(
  linhas: LinhaDetalhadaFrequencia[],
  periodo: PeriodoRange,
): void {
  // A4 paisagem para caber as 8 colunas do exemplo sem apertar os nomes.
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const margemX = 10
  const total = ordenar(linhas).length

  // Cabeçalho do documento
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Clínica SOUL', margemX, 12)
  doc.setFontSize(11)
  doc.text('Relatório de Frequência — Detalhado', margemX, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    `Período: ${rotuloPeriodo(periodo)} · ${total} atendimento${total === 1 ? '' : 's'}`,
    margemX,
    23,
  )

  // Tabela
  const colX: number[] = []
  let x = margemX
  for (const w of LARGURAS_PDF) {
    colX.push(x)
    x += w
  }
  const larguraTabela = x - margemX

  let y = 30
  const desenharCabecalho = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    COLUNAS_DETALHADO.forEach((c, i) => doc.text(c, colX[i] + 1, y))
    y += 1.5
    doc.line(margemX, y, margemX + larguraTabela, y)
    y += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
  }
  desenharCabecalho()

  ordenar(linhas).forEach((l, i) => {
    if (y > 200) {
      doc.addPage()
      y = 15
      desenharCabecalho()
    }
    const celular: string[] = [
      String(i + 1),
      formatDataPTBR(l.dataYmd),
      l.horario || '',
      truncar(l.paciente, 38),
      truncar(l.areaEspecialidade, 30),
      truncar(l.detalheServico || '', 20),
      l.status,
      truncar(l.profissional, 26),
    ]
    celular.forEach((v, ci) => doc.text(v, colX[ci] + 1, y))
    y += 1.2
    doc.setDrawColor(230)
    doc.line(margemX, y, margemX + larguraTabela, y)
    y += 4.2
  })

  doc.save(nomeArquivo('pdf'))
}

function truncar(t: string, max: number): string {
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}
