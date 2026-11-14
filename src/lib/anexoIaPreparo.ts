/**
 * Preparação de anexos para a leitura por IA na Etapa 6.
 *
 * pdfjs-dist NÃO instala neste ambiente (tentativa anterior falhou) — o pdf.js
 * é carregado em RUNTIME de CDN via import dinâmico do módulo ESM. Se o CDN
 * falhar, degrada graciosamente (arquivo cru + aviso), sem quebrar o build.
 */

const MAX_PAGINAS_PDF = 4
const LARGURA_ALVO = 1400
const JPEG_QUALIDADE = 0.7
const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/'

type PdfJsPage = {
  getViewport: (p: { scale: number }) => { width: number; height: number }
  render: (p: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => {
    promise: Promise<void>
  }
}

type PdfJsLib = {
  getDocument: (src: { data: ArrayBuffer }) => {
    promise: Promise<{ numPages: number; getPage: (n: number) => Promise<PdfJsPage> }>
  }
  GlobalWorkerOptions: { workerSrc: string }
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib
  }
}

let pdfJsPromise: Promise<PdfJsLib> | null = null

function carregarPdfJsDeCdn(): Promise<PdfJsLib> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('cdn_indisponivel: ambiente sem navegador'))
  }
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib)
  if (pdfJsPromise) return pdfJsPromise

  pdfJsPromise = import(/* @vite-ignore */ PDFJS_BASE + 'pdf.min.mjs')
    .then((mod: { pdfjsLib?: PdfJsLib }) => {
      const lib = mod?.pdfjsLib ?? (window.pdfjsLib as PdfJsLib | undefined)
      if (!lib || typeof lib.getDocument !== 'function') {
        throw new Error('cdn_indisponivel: pdf.js não exposto pela CDN')
      }
      window.pdfjsLib = lib
      return lib
    })
    .catch((e: unknown) => {
      pdfJsPromise = null // permite nova tentativa em "Tentar novamente"
      throw new Error(
        'cdn_indisponivel: ' + (e instanceof Error ? e.message : 'falha ao carregar pdf.js da CDN'),
      )
    })

  return pdfJsPromise
}

function canvasParaDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', JPEG_QUALIDADE)
}

export type PdfRasterizado = {
  /** Data URLs JPEG — uma por página rasterizada. */
  paginas: string[]
  /** Total de páginas do PDF (pode exceder paginas.length). */
  totalPaginas: number
}

/**
 * Rasteriza as primeiras MAX_PAGINAS_PDF páginas do PDF em data URLs JPEG.
 * Lança Error com prefixo 'cdn_indisponivel' quando o CDN de pdf.js não responde.
 */
export async function rasterizarPdfParaDataUrls(file: File): Promise<PdfRasterizado> {
  const pdfjs = await carregarPdfJsDeCdn()
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.mjs'
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const total = Math.min(doc.numPages, MAX_PAGINAS_PDF)
    const paginas: string[] = []
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i)
      const base = page.getViewport({ scale: 1 })
      const escala = Math.min(LARGURA_ALVO / base.width, 2.5)
      const viewport = page.getViewport({ scale: escala })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas indisponível no navegador')
      await page.render({ canvasContext: ctx, viewport }).promise
      paginas.push(canvasParaDataUrl(canvas))
    }
    if (paginas.length === 0) throw new Error('PDF sem páginas legíveis')
    return { paginas, totalPaginas: doc.numPages }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('cdn_indisponivel')) throw err
    throw new Error(
      'rasterizacao_falhou: ' + (err instanceof Error ? err.message : 'erro desconhecido'),
    )
  }
}

/**
 * Comprime uma imagem via canvas para manter cada página bem abaixo do
 * limite aceito pela visão multimodal (largura alvo 1400px, JPEG 70%).
 */
export async function comprimirImagemParaDataUrl(file: File | Blob): Promise<string> {
  const bitmapUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('imagem_invalida'))
      el.src = bitmapUrl
    })
    const escala = Math.min(1, LARGURA_ALVO / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * escala))
    canvas.height = Math.max(1, Math.round(img.height * escala))
    const ctx = canvas.getContext('2d')
    if (!ctx) return await arquivoParaDataUrlDireto(file)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvasParaDataUrl(canvas)
  } catch {
    return await arquivoParaDataUrlDireto(file)
  } finally {
    URL.revokeObjectURL(bitmapUrl)
  }
}

async function arquivoParaDataUrlDireto(file: File | Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('falha_leitura_arquivo'))
    reader.readAsDataURL(file)
  })
}

export type AnexoPreparado = {
  /** Data URLs (JPEG) — uma por página rasterizada (imagens e PDFs). */
  dataUrls: string[]
  /** Arquivo cru a enviar ao servidor (só quando NÃO há páginas rasterizadas). */
  arquivoCru?: File
  /** Aviso de degradação mostrado ao usuário (ex.: CDN do pdf.js indisponível). */
  aviso?: string
}

/**
 * Prepara o anexo para o hook:
 * - Imagens: comprimidas via canvas e enviadas como data URL (visão multimodal).
 * - PDFs: rasterizados (primeiras 4 páginas) e enviados como data URLs — cobre
 *   PDFs escaneados SEM camada de texto. Se o CDN do pdf.js falhar, degrada
 *   graciosamente: envia o arquivo cru (o servidor tenta extrair texto; em
 *   PDFs escaneados responde com motivo específico) e sinaliza um aviso.
 * - DOCX/XLSX/PPTX/TXT: vão crus ao hook, que usa $documents.toMarkdown.
 */
export async function prepararAnexoParaIa(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<AnexoPreparado> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImagem = file.type.startsWith('image/')

  if (isImagem) {
    onProgress?.('Preparando imagem...')
    return { dataUrls: [await comprimirImagemParaDataUrl(file)] }
  }

  if (isPdf) {
    onProgress?.('Convertendo páginas do PDF em imagens...')
    try {
      const { paginas, totalPaginas } = await rasterizarPdfParaDataUrls(file)
      if (totalPaginas > MAX_PAGINAS_PDF) {
        return {
          dataUrls: paginas,
          aviso: `PDF tem ${totalPaginas} páginas — apenas as primeiras ${MAX_PAGINAS_PDF} foram lidas pela IA.`,
        }
      }
      return { dataUrls: paginas }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const motivoUsuario = msg.startsWith('cdn_indisponivel')
        ? 'Não foi possível carregar o leitor de PDFs (CDN indisponível). Tentando enviar o arquivo original; se falhar, anexe fotos nítidas das páginas (JPG/PNG).'
        : 'Não foi possível converter as páginas deste PDF em imagens. Tentando enviar o arquivo original; se falhar, anexe fotos nítidas do documento (JPG/PNG).'
      return { dataUrls: [], arquivoCru: file, aviso: motivoUsuario }
    }
  }

  // Outros formatos (docx/xlsx/txt...): envia o arquivo cru ao hook, que usa $documents
  return { dataUrls: [], arquivoCru: file }
}
