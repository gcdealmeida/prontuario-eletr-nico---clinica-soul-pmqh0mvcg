/**
 * Rasterização de PDF no navegador com pdf.js.
 *
 * O conversor de documentos do servidor ($documents.toMarkdown) rejeita PDFs
 * escaneados ("PDF has no extractable text (Scanned): OCR is required"). Para
 * esses casos, cada página do PDF é renderizada aqui como PNG e enviada ao
 * hook /backend/v1/anexos/analisar-ia (campo multipart 'paginas'), que faz o
 * OCR de visão com IA multimodal.
 */

const LIMITE_PAGINAS = 8
const LARGURA_ALVO = 1700 // px — suficiente para OCR, mantém o payload leve

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString()
      return pdfjs
    })
  }
  return pdfjsPromise
}

function dataUrlParaFile(dataUrl: string, indice: number): File {
  const [cabecalho, base64] = dataUrl.split(',')
  const mime = cabecalho.match(/data:([^;]+)/)?.[1] || 'image/png'
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return new File([bytes], `pagina-${indice + 1}.png`, { type: mime })
}

/**
 * Renderiza as primeiras páginas de um PDF como imagens PNG.
 * Retorna null quando o arquivo não é um PDF (nada a rasterizar).
 */
export async function rasterizarPaginasPdf(
  arquivo: File | Blob,
  nomeArquivo = 'documento.pdf',
): Promise<File[] | null> {
  const nome = (arquivo instanceof File ? arquivo.name : nomeArquivo) || ''
  const ext = (nome.split('.').pop() || '').toLowerCase()
  const tipo = (arquivo as { type?: string }).type || ''
  if (ext !== 'pdf' && !tipo.includes('pdf')) return null

  try {
    const pdfjs = await getPdfjs()
    const dados = await arquivo.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: new Uint8Array(dados) }).promise
    const total = Math.min(doc.numPages, LIMITE_PAGINAS)
    const paginas: File[] = []

    for (let i = 0; i < total; i++) {
      const pagina = await doc.getPage(i + 1)
      const viewport = pagina.getViewport({ scale: 1 })
      const escala = LARGURA_ALVO / viewport.width
      const viewportRender = pagina.getViewport({ scale: escala })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewportRender.width)
      canvas.height = Math.floor(viewportRender.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await pagina.render({ canvas, canvasContext: ctx, viewport: viewportRender }).promise
      const dataUrl = canvas.toDataURL('image/png')
      paginas.push(dataUrlParaFile(dataUrl, i))
      pagina.cleanup()
    }

    doc.destroy()
    return paginas.length > 0 ? paginas : null
  } catch (err) {
    console.warn('Rasterização do PDF falhou (seguindo sem páginas):', err)
    return null
  }
}
