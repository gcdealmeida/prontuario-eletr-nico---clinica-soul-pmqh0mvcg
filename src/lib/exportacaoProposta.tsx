/**
 * Exportação da proposta de tratamento em PDF A4 (padrão do anexo
 * propostas-soul: html2canvas das páginas .pg-proposta-soul + jsPDF, nome
 * "Proposta de Tratamento SOUL - {paciente} - {mes}.pdf").
 */
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { nomeArquivoProposta } from '@/services/programasTratamento'
import { DocumentoPropostaTratamento } from '@/components/DocumentoPropostaTratamento'
import type { ProgramaTratamentoRecord } from '@/services/programasTratamento'
import { createRoot, type Root } from 'react-dom/client'
import React from 'react'

let hostExportacao: HTMLDivElement | null = null
let rootReact: Root | null = null

function garantirHost(): HTMLDivElement {
  if (!hostExportacao) {
    hostExportacao = document.createElement('div')
    hostExportacao.className = 'host-exportacao-proposta'
    document.body.appendChild(hostExportacao)
  }
  if (!rootReact) {
    rootReact = createRoot(hostExportacao)
  }
  return hostExportacao
}

/** Desmonta o documento do host de exportação */
function limparHost() {
  if (rootReact) {
    rootReact.unmount()
    rootReact = null
  }
  if (hostExportacao) hostExportacao.innerHTML = ''
}

/**
 * Gera o blob PDF da proposta: monta o documento A4 num host oculto, fotografa
 * cada página .pg-proposta-soul em 2x e adiciona ao jsPDF em A4 portrait.
 */
export async function gerarPdfPropostaTratamento(
  programa: ProgramaTratamentoRecord,
): Promise<Blob> {
  const host = garantirHost()
  const wrapper = document.createElement('div')
  host.appendChild(wrapper)

  rootReact!.render(
    React.createElement(DocumentoPropostaTratamento, { programa } as {
      programa: ProgramaTratamentoRecord
    }),
  )

  try {
    // Aguarda imagens (foto da capa) carregarem antes de fotografar
    await new Promise<void>((resolve) => {
      const aguardar = (tentativa: number) => {
        const imgs = Array.from(wrapper.querySelectorAll('img'))
        const pendentes = imgs.filter((img) => !img.complete)
        if (pendentes.length === 0 || tentativa > 40) {
          resolve()
          return
        }
        setTimeout(() => aguardar(tentativa + 1), 50)
      }
      aguardar(0)
    })

    const paginas = Array.from(
      wrapper.querySelectorAll<HTMLElement>('.documento-proposta-soul > div'),
    )
    if (paginas.length === 0) throw new Error('Documento não montado para exportação.')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    for (let i = 0; i < paginas.length; i++) {
      const canvas = await html2canvas(paginas[i], {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      })
      if (i > 0) doc.addPage('a4', 'portrait')
      doc.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
    }
    return doc.output('blob')
  } finally {
    limparHost()
    wrapper.remove()
  }
}

/** Gera o PDF e dispara o download com o nome padrão SOUL */
export async function baixarPdfPropostaTratamento(programa: ProgramaTratamentoRecord) {
  const blob = await gerarPdfPropostaTratamento(programa)
  const nome = nomeArquivoProposta(
    programa.paciente_nome || programa.expand?.paciente_id?.nome || 'Cliente',
    programa.mes_referencia || '',
    'pdf',
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 2000)
}
