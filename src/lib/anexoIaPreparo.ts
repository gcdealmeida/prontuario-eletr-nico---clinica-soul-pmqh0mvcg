/**
 * Preparo do anexo para análise por IA no cliente:
 * - PDFs: rasteriza cada página via pdf.js (canvas → JPEG). PDFs escaneados
 *   (sem camada de texto) precisam disso — a IA lê a IMAGEM da página, não o texto.
 * - Imagens: redimensiona/comprime via canvas para caber com folga no payload.
 * - DOCX/XLSX/PPTX/TXT: envia o arquivo cru (o servidor extrai o texto).
 */

const MAX_DIMENSAO = 1600
const JPEG_QUALIDADE = 0.82

// Worker do pdf.js via ?url — padrão Vite (new URL com bare specifier falha no build)
=======

/** Rasteriza um PDF em data URLs JPEG (uma por página). */
export async function rasterizarPdfParaDataUrls(
  file: File,
  onProgresso?: (msg: string) => void,
): Promise<string[]> {
  onProgresso?.('Preparando documento para leitura...')
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const total = Math.min(pdf.numPages, 4) // 1ªs páginas: onde está o laudo
  const paginas: string[] = []

  for (let i = 1; i <= total; i++) {
    onProgresso?.(`Lendo página ${i} de ${total}...`)
    const page = await pdf.getPage(i)
    const base = page.getViewport({ scale: 1 })
    const scale = Math.min(2, Math.max(1, MAX_DIMENSAO / Math.max(base.width, base.height)))
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponível neste navegador')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvas, canvasContext: ctx, viewport }).promise
    paginas.push(canvas.toDataURL('image/jpeg', JPEG_QUALIDADE))
    page.cleanup()
  }
  await pdf.destroy()
  return paginas
}

/** Redimensiona/comprime uma imagem para data URL JPEG leve. */
export async function comprimirImagemParaDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSAO / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível neste navegador')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', JPEG_QUALIDADE)
}

export interface AnexoPreparado {
  /** Data URLs por página (PDF/images) — visão multimodal. */
  paginas: string[]
  /** Arquivo cru para o servidor (DOCX/XLSX/PPTX/TXT e sempre, p/ persistência). */
  arquivo?: File
  avisoPreparo?: string
}

/**
 * Prepara qualquer anexo para POST /backend/v1/anexos/analisar-ia.
 * Nunca lança por arquivo grande demais: PDFs são rasterizados (o limite do
 * payload não depende mais do tamanho do PDF), imagens comprimidas e o resto
 * segue cru — se ainda assim estourar, o erro específico aparece na UI.
 */
export async function prepararAnexoParaIa(
  file: File,
  onProgresso?: (msg: string) => void,
): Promise<AnexoPreparado> {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') {
    const paginas = await rasterizarPdfParaDataUrls(file, onProgresso)
    return { paginas, arquivo: file }
  }
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    const paginas = [await comprimirImagemParaDataUrl(file)]
    return { paginas, arquivo: file }
  }
  if (['docx', 'xlsx', 'pptx', 'txt'].includes(ext)) {
    return { paginas: [], arquivo: file }
  }
  // Formato desconhecido: tenta como imagem (foto sem extensão, HEIC renomeado)
  try {
    const paginas = [await comprimirImagemParaDataUrl(file)]
    return { paginas, arquivo: file, avisoPreparo: 'Formato não reconhecido — lendo como imagem.' }
  } catch {
    return { paginas: [], arquivo: file }
  }
}
