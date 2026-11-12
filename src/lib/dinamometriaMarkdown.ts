import type { LeituraTabela } from '@/components/fisioterapia/TabelaDinamometria'

/**
 * Parser do texto livre `forca_muscular_descricao`.
 * Formatos reconhecidos:
 *  A) Markdown do extrator IA agrupado por segmento:
 *     **Quadril** seguido de tabela | Movimento | Lado Direito (D) | Lado Esquerdo (E) | ...
 *  B) Linhas "Movimento ... D: 28,4 kgf | E: 24,1 kgf"
 *  C) Tabelas simples "Movimento | 28.4 | 24.1"
 * Também separa o texto em blocos de conteúdo (títulos, tabelas, bullets,
 * parágrafos) para renderização formatada, sem nenhum markdown visível.
 */

export interface LinhaComSegmento extends LeituraTabela {
  segmento?: string
}

export interface BlocoConteudo {
  tipo: 'titulo' | 'subtitulo' | 'texto' | 'bullets' | 'tabela' | 'formula'
  texto: string
  itens?: string[]
  /** Para tipo 'tabela': [cabeçalho, ...corpo] já sem markdown */
  linhas?: string[][]
}

const reSegmento = /^\s*(?:#{1,6}\s*)?\*\*(.+?)\*\*\s*:?\s*$/
const reTituloHash = /^\s*#{1,6}\s+(.+)$/

function limparCelula(txt: string): string {
  return txt.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim()
}

const limparInline = limparCelula

/** Detecta linha separadora de tabela markdown: |---|---| */
export function isSeparadorTabela(linha: string): boolean {
  return /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(linha) && linha.includes('-')
}

function celulas(linha: string): string[] {
  return linha.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(limparCelula)
}

/** Detecta colunas D/E no cabeçalho de uma tabela markdown. */
function detectarColunas(cabecalho: string[]): { d: number; e: number; movimento: number } | null {
  let d = -1
  let e = -1
  let movimento = 0
  cabecalho.forEach((c, i) => {
    const ci = c.toLowerCase()
    if (ci.includes('assimetria') || ci.includes('déficit') || ci.includes('deficit')) return
    if (d === -1 && /direit/.test(ci)) d = i
    if (e === -1 && /esquerd/.test(ci)) e = i
    if (/movimento|grupo|musculo|músculo/.test(ci)) movimento = i
  })
  if (d === -1 || e === -1) return null
  return { d, e, movimento }
}

function parseNumeroSeguro(v: string | undefined): number | null {
  if (!v) return null
  const m = v
    .replace(/\s/g, '')
    .replace(',', '.')
    .match(/-?\d+(\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

interface TabelaMd {
  segmento: string
  cabecalho: string[]
  corpo: string[][]
  /** true quando o cabeçalho tem colunas de Direito/Esquerdo (leituras extraídas) */
  temLados: boolean
}

interface TabelaLocalizada {
  range: [number, number]
  tabela: TabelaMd
}

/** Encontra blocos de tabela markdown no texto (índices de início/fim). */
function localizarTabelas(linhas: string[]): TabelaLocalizada[] {
  const encontradas: TabelaLocalizada[] = []
  let i = 0
  while (i < linhas.length) {
    const t = linhas[i].trim()
    if (!t.startsWith('|')) {
      i++
      continue
    }
    // Procura o fim do bloco de linhas "|"
    let fim = i
    while (fim + 1 < linhas.length && linhas[fim + 1].trim().startsWith('|')) fim++

    const det = detectarColunas(celulas(t))
    // Segmento: linha imediatamente anterior em negrito, se houver
    let segmento = ''
    for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
      const ant = linhas[j].trim()
      const mSeg = ant.match(reSegmento)
      if (mSeg) {
        segmento = limparInline(mSeg[1])
        break
      }
      if (ant) break
    }

    if (det) {
      const corpo = linhas
        .slice(i + 1, fim + 1)
        .map((l) => l.trim())
        .filter((l) => !isSeparadorTabela(l))
        .map(celulas)
        .filter((cel) => cel.some((c) => parseNumeroSeguro(c) !== null))
      if (corpo.length > 0) {
        encontradas.push({
          range: [i, fim],
          tabela: { segmento, cabecalho: celulas(t), corpo, temLados: true },
        })
        i = fim + 1
        continue
      }
    } else if (fim > i) {
      // Tabela sem colunas D/E (genérica): renderiza como tabela, nunca como texto cru
      const corpo = linhas
        .slice(i + 1, fim + 1)
        .map((l) => l.trim())
        .filter((l) => !isSeparadorTabela(l))
        .map(celulas)
      encontradas.push({
        range: [i, fim],
        tabela: { segmento, cabecalho: celulas(t), corpo, temLados: false },
      })
    }
    i = fim + 1
  }
  return encontradas
}

/** Extrai leituras de tabelas markdown agrupadas por segmento. */
function extrairTabelasMarkdown(texto: string): LinhaComSegmento[] {
  const linhas = texto.split('\n')
  const tabelas = localizarTabelas(linhas)
  const resultado: LinhaComSegmento[] = []
  for (const { tabela } of tabelas) {
    if (!tabela.temLados) continue
    const cols = detectarColunas(tabela.cabecalho)
    if (!cols) continue
    for (const cel of tabela.corpo) {
      const movimento = cel[cols.movimento] || ''
      const direita = parseNumeroSeguro(cel[cols.d])
      const esquerda = parseNumeroSeguro(cel[cols.e])
      if (!movimento || (direita === null && esquerda === null)) continue
      resultado.push({
        movimento,
        direita,
        esquerda,
        assimetriaPct: null,
        segmento: tabela.segmento,
      })
    }
  }
  return resultado
}

/** Converte o texto livre em blocos de conteúdo prontos para renderização. */
export function parsearBlocosForca(texto: string): BlocoConteudo[] {
  if (!texto || !texto.trim()) return []
  const linhasTxt = texto.split('\n')
  const tabelas = localizarTabelas(linhasTxt)
  const inicioTabela = new Map<number, TabelaMd>()
  const dentroTabela = new Set<number>()
  for (const { range, tabela } of tabelas) {
    inicioTabela.set(range[0], tabela)
    for (let j = range[0]; j <= range[1]; j++) dentroTabela.add(j)
  }

  const blocos: BlocoConteudo[] = []
  let bullets: string[] | null = null

  const fecharBullets = () => {
    if (bullets && bullets.length > 0) blocos.push({ tipo: 'bullets', texto: '', itens: bullets })
    bullets = null
  }

  for (let i = 0; i < linhasTxt.length; i++) {
    const brutaLinha = linhasTxt[i]
    const t = brutaLinha.trim()

    // Tabela markdown → bloco próprio (uma por segmento)
    if (dentroTabela.has(i)) {
      const tb = inicioTabela.get(i)
      if (tb) {
        fecharBullets()
        blocos.push({ tipo: 'tabela', texto: tb.segmento, linhas: [tb.cabecalho, ...tb.corpo] })
      }
      continue
    }

    // Título de segmento em negrito (**Quadril**): se a tabela vem logo depois,
    // o nome do segmento já estiliza o cabeçalho do bloco de tabela; senão, subtítulo
    const mSeg = t.match(reSegmento)
    if (mSeg) {
      fecharBullets()
      if (!proximaLinhaIniciaTabela(linhasTxt, i)) {
        blocos.push({ tipo: 'subtitulo', texto: limparInline(mSeg[1]) })
      }
      continue
    }

    // Título com ### (Conclusão / Observações Clínicas etc.)
    const mTitulo = t.match(reTituloHash)
    if (mTitulo) {
      fecharBullets()
      blocos.push({ tipo: 'titulo', texto: limparInline(mTitulo[1]) })
      continue
    }

    // Linha horizontal "---"
    if (/^-{3,}$/.test(t) || /^\*{3,}$/.test(t)) {
      fecharBullets()
      continue
    }

    // Rodapé de fórmula: "\*Assimetria calculada como..." ou "*Assimetria calculada..."
    if (/^\\\*[^*]/.test(t) || /^\*[^*\s]/.test(t)) {
      fecharBullets()
      blocos.push({ tipo: 'formula', texto: limparInline(t.replace(/^\\?\*+/, '')) })
      continue
    }

    // Bullets: "- item", "• item", "* item"
    const mBullet = t.match(/^[-•*]\s+(.+)$/)
    if (mBullet) {
      const conteudo = limparInline(mBullet[1])
      const indentado = /^\s{2,}/.test(brutaLinha)
      if (indentado && bullets && bullets.length > 0) {
        bullets[bullets.length - 1] += ` — ${conteudo}`
      } else {
        if (!bullets) bullets = []
        bullets.push(conteudo)
      }
      continue
    }

    // Linha vazia
    if (!t) {
      fecharBullets()
      continue
    }

    // Parágrafo normal
    fecharBullets()
    blocos.push({ tipo: 'texto', texto: limparInline(t) })
  }
  fecharBullets()

  return blocos.filter(
    (b) =>
      b.tipo === 'tabela' ||
      (b.tipo === 'bullets' && b.itens && b.itens.length > 0) ||
      (b.tipo !== 'bullets' && b.texto.trim().length > 0),
  )
}

function proximaLinhaIniciaTabela(linhas: string[], idx: number): boolean {
  if (idx + 1 >= linhas.length) return false
  const t = linhas[idx + 1].trim()
  if (!t.startsWith('|')) return false
  return detectarColunas(celulas(t)) !== null
}

/**
 * Extrai leituras do texto livre, em QUALQUER dos formatos suportados.
 * (função principal usada por TabelaDinamometria)
 */
export function extrairLeiturasComSegmentos(texto: string): LinhaComSegmento[] {
  if (!texto || !texto.trim()) return []
  // Formato A: tabelas markdown agrupadas por segmento
  const md = extrairTabelasMarkdown(texto)
  if (md.length > 0) return md
  return []
}
