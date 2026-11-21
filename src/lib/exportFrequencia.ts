/**
 * Exportação da visão ativa do Relatório de Frequência (/relatorios, visão gestor).
 * - Excel: SheetJS (xlsx) — planilha real com os valores da visão ativa;
 * - PDF: jsPDF (já usado no projeto) — tabela simples com os mesmos valores.
 * Os dados chegam prontos do RelatorioFrequencia (mesma fonte da tabela em tela).
 */
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { rotuloPeriodo } from '@/lib/relatoriosAdmin'
import type { PeriodoRange } from '@/lib/relatoriosAdmin'

export interface LinhaExportFrequencia {
  nome: string
  total: number
  compareceu: number
  faltou: number
  taxaPct: number
}

const CABECALHO = ['Nome', 'Atendimentos', 'Compareceu', 'Faltou/Cancelou', 'Frequência (%)']

function valoresDe(linha: LinhaExportFrequencia): (string | number)[] {
  return [linha.nome, linha.total, linha.compareceu, linha.faltou, Number(linha.taxaPct.toFixed(1))]
}

export function exportarExcelFrequencia(
  linhas: LinhaExportFrequencia[],
  titulo: string,
  periodo: PeriodoRange,
): void {
  const dados = [CABECALHO, ...linhas.map(valoresDe)]
  const ws = XLSX.utils.aoa_to_sheet(dados)
  ws['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 13 }, { wch: 18 }, { wch: 16 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Frequência')
  XLSX.writeFile(wb, `${nomeArquivo(titulo, 'xlsx')}`)
}

export function exportarPdfFrequencia(
  linhas: LinhaExportFrequencia[],
  titulo: string,
  periodo: PeriodoRange,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margemX = 14
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Clínica SOUL', margemX, y)
  y += 7
  doc.setFontSize(11)
  doc.text('Relatório de Frequência', margemX, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`${titulo} — Período: ${rotuloPeriodo(periodo)}`, margemX, y)
  y += 8

  const colX = [margemX, margemX + 78, margemX + 102, margemX + 126, margemX + 152]
  const larguras = [76, 22, 22, 26, 26] // Nome, Atend., Compareceu, Faltou, Freq.

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Nome', colX[0], y)
  doc.text('Atend.', colX[1], y, { align: 'right' })
  doc.text('Compareceu', colX[2], y, { align: 'right' })
  doc.text('Faltou/Canc.', colX[3], y, { align: 'right' })
  doc.text('Freq. %', colX[4], y, { align: 'right' })
  y += 2
  doc.line(margemX, y, margemX + 164, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  for (const linha of linhas) {
    if (y > 275) {
      doc.addPage()
      y = 18
    }
    const vals = valoresDe(linha)
    const nome =
      String(vals[0]).length > 44 ? `${String(vals[0]).slice(0, 41)}...` : String(vals[0])
    doc.text(nome, colX[0], y)
    doc.text(String(vals[1]), colX[1], y, { align: 'right' })
    doc.text(String(vals[2]), colX[2], y, { align: 'right' })
    doc.text(String(vals[3]), colX[3], y, { align: 'right' })
    doc.text(`${vals[4]}%`, colX[4], y, { align: 'right' })
    y += 6
  }

  doc.save(nomeArquivo(titulo, 'pdf'))
}

function nomeArquivo(titulo: string, ext: 'xlsx' | 'pdf'): string {
  const slug = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `relatorio-frequencia-${slug || 'geral'}.${ext}`
}
