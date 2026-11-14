/**
 * Preparação de anexos para a leitura por IA na Etapa 6.
 *
 * pdfjs-dist NÃO instala neste ambiente (tentativa anterior falhou) — o pdf.js
 * é carregado em RUNTIME de CDN via import dinâmico do módulo ESM. Se o CDN
 * falhar, degrada graciosamente (arquivo cru + aviso), sem quebrar o build.
 *
 * Fluxo anti "arquivo muito grande" (bug report de 14/11/2026 — PDF escaneado
 * de densitometria/RNM chegava ao hook com paginas=0 e caía no 422):
 *  - o PDF é rasterizado página por página com re-render escalonado
 *    (1400→900→700px de largura, JPEG 70→60→50%) até cada página caber no
 *    LIMITE_POR_PAGINA; uma página que falha não derruba as outras.
 *  - o COMPONENTE da Etapa 6 envia 1 página por requisição (via
 *    analisarAnexoPagina); nunca mais um pacote de 4 data URLs de ~2 MB.
 *  - se TODAS as tentativas falharem, o cliente devolve arquivo cru + aviso
 *    específico (que agora só menciona compactação quando é de verdade).
 */

const LARGURA_ALVO = 1400
const LARGURAS = [1400, 1000, 900, 800]
const QUALIDADES = [0.7, 0.6, 0.5]
const LIMITE_POR_PAGINA = 3 * 1024 * 1024 // 3 MB de data URL por página
const MAX_PAGINAS_PDF = 4
/** Número de páginas por requisição na análise em lotes (1 lote = 1 POST). */
export const TAMANHO_LOTE_PADRAO = 1
const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/'

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

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

  // O build ESM da v4.x exporta NAMED exports (getDocument, GlobalWorkerOptions...),
  // não um objeto "pdfjsLib" — por isso aceitamos também o próprio módulo.
  pdfJsPromise = import(/* @vite-ignore */ PDFJS_BASE + 'pdf.min.mjs')
    .then((mod: Record<string, unknown>) => {
      const candidatos = [
        mod?.pdfjsLib,
        mod,
        (window as unknown as Record<string, unknown>).pdfjsLib,
      ]
      const lib = candidatos.find(
        (m): m is PdfJsLib => !!m && typeof (m as PdfJsLib).getDocument === 'function',
      )
      if (!lib) {
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

function canvasParaDataUrl(canvas: HTMLCanvasElement, qualidade: number): string {
  return canvas.toDataURL('image/jpeg', qualidade)
}

/**
 * Rasteriza UMA página do PDF em data URL JPEG, re-renderizando com
 * resolução/qualidade menores (1400px/70% → ... → 700px/50%) até caber no
 * LIMITE_POR_PAGINA. Nunca desce abaixo de 700px de largura (legibilidade
 * mínima para a visão multimodal ler laudos).
 */
async function rasterizarPaginaAdaptativa(
  page: PdfJsPage,
  numPagina: number,
  totalPaginas: number,
  onProgress?: (msg: string) => void,
): Promise<string | null> {
  const base = page.getViewport({ scale: 1 })
  for (const largura of LARGURAS) {
    const escala = Math.min(largura / base.width, 2.5)
    const viewport = page.getViewport({ scale: escala })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas indisponível no navegador')
    try {
      await page.render({ canvasContext: ctx, viewport }).promise
    } catch (renderErr) {
      console.warn(
        `[anexoIaPreparo] falha ao renderizar página ${numPagina} a ${largura}px:`,
        renderErr,
      )
      if (largura === LARGURAS[LARGURAS.length - 1]) return null
      continue
    }
    for (const qualidade of QUALIDADES) {
      const dataUrl = canvasParaDataUrl(canvas, qualidade)
      if (dataUrl.length <= LIMITE_POR_PAGINA) {
        onProgress?.(`Convertendo página ${numPagina} de ${totalPaginas} (${largura}px)...`)
        return dataUrl
      }
    }
    // Qualidade mínima ainda estourou o limite → tenta a próxima largura
    if (largura === LARGURAS[LARGURAS.length - 1]) {
      console.warn(
        `[anexoIaPreparo] página ${numPagina} excedeu o limite mesmo a ${largura}px/50% ` +
          `(${formatarTamanho(canvasParaDataUrl(canvas, QUALIDADES[QUALIDADES.length - 1]).length)})`,
      )
      return null
    }
  }
  return null
}

export type PdfRasterizado = {
  /** Data URLs JPEG — uma por página rasterizada com sucesso. */
  paginas: string[]
  /** Total de páginas do PDF (pode exceder paginas.length). */
  totalPaginas: number
  /** Páginas do PDF que não couberam nem com a menor resolução (índice 1-based). */
  paginasFalhas: number[]
}

/**
 * Rasteriza as primeiras MAX_PAGINAS_PDF páginas do PDF em data URLs JPEG.
 * Cada página é independente: a que falhar não derruba as outras.
 * Lança Error com prefixo 'cdn_indisponivel' quando o CDN de pdf.js não responde.
 */
export async function rasterizarPdfParaDataUrls(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<PdfRasterizado> {
  const pdfjs = await carregarPdfJsDeCdn()
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.mjs'
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const total = Math.min(doc.numPages, MAX_PAGINAS_PDF)
    const paginas: string[] = []
    const paginasFalhas: number[] = []
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i)
      onProgress?.(`Convertendo página ${i} de ${total}...`)
      const dataUrl = await rasterizarPaginaAdaptativa(page, i, total, onProgress)
      if (dataUrl) {
        paginas.push(dataUrl)
      } else {
        paginasFalhas.push(i)
      }
    }
    if (paginas.length === 0 && paginasFalhas.length === 0) {
      throw new Error('PDF sem páginas legíveis')
    }
    return { paginas, totalPaginas: doc.numPages, paginasFalhas }
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
    const dataUrl = canvasParaDataUrl(canvas, QUALIDADES[0])
    if (dataUrl.length <= LIMITE_POR_PAGINA) return dataUrl
    // Imagem enorme: re-comprime em larguras menores até caber
    for (const largura of LARGURAS.slice(1)) {
      const esc2 = Math.min(1, largura / Math.max(img.width, img.height))
      const c2 = document.createElement('canvas')
      c2.width = Math.max(1, Math.round(img.width * esc2))
      c2.height = Math.max(1, Math.round(img.height * esc2))
      const ctx2 = c2.getContext('2d')
      if (!ctx2) break
      ctx2.drawImage(img, 0, 0, c2.width, c2.height)
      for (const qualidade of QUALIDADES) {
        const d2 = canvasParaDataUrl(c2, qualidade)
        if (d2.length <= LIMITE_POR_PAGINA) return d2
      }
    }
    return dataUrl // melhor esforço: devolve o que temos
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
  /** Páginas do PDF que não couberam mesmo com a menor resolução (1-based). */
  paginasFalhas?: number[]
}

/**
 * Prepara o anexo para o hook:
 * - Imagens: comprimidas via canvas e enviadas como data URL (visão multimodal).
 * - PDFs: rasterizados (primeiras 4 páginas) e enviados como data URLs — cobre
 *   PDFs escaneados SEM camada de texto. Cada página é independente: a que
 *   não couber no limite é descartada (sinalizada em paginasFalhas) e as
 *   outras seguem. Se NENHUMA couber, degrada graciosamente: envia o arquivo
 *   cru (o servidor tenta extrair texto; em PDFs escaneados responde com
 *   motivo específico) e sinaliza um aviso com o motivo real.
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
      const { paginas, totalPaginas, paginasFalhas } = await rasterizarPdfParaDataUrls(
        file,
        onProgress,
      )
      const avisos: string[] = []
      if (totalPaginas > MAX_PAGINAS_PDF) {
        avisos.push(
          `PDF tem ${totalPaginas} páginas — apenas as primeiras ${MAX_PAGINAS_PDF} foram lidas pela IA.`,
        )
      }
      if (paginasFalhas.length > 0 && paginas.length > 0) {
        avisos.push(
          `Página(s) ${paginasFalhas.join(', ')} não couberam no limite de envio (${formatarTamanho(
            LIMITE_POR_PAGINA,
          )} por página) e foram ignoradas.`,
        )
      }
      if (paginas.length === 0) {
        // Nenhuma página coube — envia o arquivo cru e avisa com o motivo real
        return {
          dataUrls: [],
          arquivoCru: file,
          aviso:
            'As páginas geradas a partir deste PDF excederam o limite de envio (' +
            `${formatarTamanho(LIMITE_POR_PAGINA)} por página), mesmo com resolução reduzida. ` +
            'Compacte o PDF ou anexe fotos nítidas das páginas (JPG/PNG).',
          paginasFalhas,
        }
      }
      return { dataUrls: paginas, aviso: avisos.join(' ') || undefined, paginasFalhas }
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
