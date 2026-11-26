/**
 * Embutimento da ferramenta standalone "Programas de Exercícios - Clínica Soul".
 *
 * O fonte completo da ferramenta vive em `src/assets/index-6c05c.html` (~401 KB
 * no disco, logo/dados de exemplo/parser intactos). Ele NÃO pode ser copiado
 * para `public/programas/index.html` (acima do teto de ~98 KB da escrita do
 * builder e sem shell aqui), então ele é importado como texto (`?raw`) e
 * renderizado em um iframe `srcDoc`: mesmo resultado, mesma origem do app
 * (localStorage e downloads funcionam).
 *
 * As bibliotecas vendor (xlsx, html2canvas, jspdf) vêm dos pacotes locais do
 * node_modules — importadas AQUI no app (empacotadas pelo Vite em arquivos
 * locais, sem CDN) e injetadas como globais na window do iframe, que a
 * ferramenta lê no momento do uso (`XLSX`, `html2canvas`, `window.jspdf.jsPDF`).
 * O mammoth não está instalado (package.json protegido) e continua carregado
 * em runtime de CDN com fallback, no mesmo padrão de src/lib/importacaoProgramas.ts.
 */
import htmlRaw from '@/assets/index-6c05c.html?raw'

export const HTML_FERRAMENTA: string = htmlRaw

interface BibliotecaRefs {
  XLSX?: unknown
  html2canvas?: unknown
  jsPDF?: unknown
  mammoth?: unknown
}

const refs: BibliotecaRefs = {}

let cargaEmAndamento: Promise<void> | null = null

/** CDNs candidatas para o mammoth — mesmas fontes do importador de programas. */
const CDNS_MAMMOTH: string[] = [
  'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.esm.js',
  'https://unpkg.com/mammoth@1.8.0/mammoth.browser.esm.js',
  'https://esm.sh/mammoth@1.8.0',
]

interface ModuloMammoth {
  convertToHtml?: unknown
  default?: { convertToHtml?: unknown }
}

async function carregarMammothDeCdn(): Promise<unknown> {
  for (const url of CDNS_MAMMOTH) {
    try {
      const mod = (await import(/* @vite-ignore */ url)) as unknown as ModuloMammoth
      const candidato = mod.default ?? mod
      if (candidato && typeof candidato.convertToHtml === 'function') return candidato
      // O UMD carregado via import() pode definir window.mammoth como efeito colateral.
      const globalMammoth = (window as { mammoth?: unknown }).mammoth as
        | { convertToHtml?: unknown }
        | undefined
      if (globalMammoth && typeof globalMammoth.convertToHtml === 'function') return globalMammoth
    } catch {
      // tenta a próxima CDN
    }
  }
  return undefined
}

async function carregarBibliotecas(): Promise<void> {
  const [xlsxMod, h2cMod, jsPdfMod] = await Promise.all([
    import('xlsx'),
    import('html2canvas'),
    import('jspdf'),
  ])
  const xlsxDesconhecido = xlsxMod as unknown as {
    XLSX?: unknown
    default?: unknown
  }
  refs.XLSX = xlsxDesconhecido.XLSX ?? xlsxDesconhecido.default ?? xlsxMod
  const h2cDesconhecido = h2cMod as unknown as {
    default?: unknown
    html2canvas?: unknown
  }
  refs.html2canvas = h2cDesconhecido.default ?? h2cDesconhecido.html2canvas ?? h2cMod
  const jsPdfDesconhecido = jsPdfMod as unknown as {
    jsPDF?: unknown
    default?: { jsPDF?: unknown }
  }
  refs.jsPDF = jsPdfDesconhecido.jsPDF ?? jsPdfDesconhecido.default?.jsPDF
  if (!refs.jsPDF) throw new Error('jspdf não expõe jsPDF')
  refs.mammoth = await carregarMammothDeCdn()
}

/** Pré-carrega as bibliotecas (idempotente) para o iframe encontrar tudo pronto. */
export function garantirBibliotecas(): Promise<void> {
  if (!cargaEmAndamento) cargaEmAndamento = carregarBibliotecas()
  return cargaEmAndamento
}

/** Injeta os globais que a ferramenta lê dentro do iframe (mesma origem). */
export function injetarBibliotecasNoIframe(frame: HTMLIFrameElement | null): void {
  const w = frame?.contentWindow as
    | (Window & { XLSX?: unknown; html2canvas?: unknown; jspdf?: unknown; mammoth?: unknown })
    | null
  if (!w) return
  if (refs.XLSX) w.XLSX = refs.XLSX
  if (refs.html2canvas) w.html2canvas = refs.html2canvas
  if (refs.jsPDF) w.jspdf = { jsPDF: refs.jsPDF }
  if (refs.mammoth) w.mammoth = refs.mammoth
}
