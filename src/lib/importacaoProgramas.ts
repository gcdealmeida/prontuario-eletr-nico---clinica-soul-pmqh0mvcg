import * as XLSX from 'xlsx'
import type { ModalidadePrograma } from '@/services/programas'

// Tipos de saída do parser — alimenta as abas da área dedicada
export interface ExercicioImportado {
  treinoNome: string
  nome: string
  series?: number
  repeticoes?: string
  observacoes?: string
}

export interface ResultadoImportacaoPrograma {
  nome: string
  modalidade: ModalidadePrograma
  semanas: Array<{ indice: number; rotulo?: string; carga?: number; horas?: number }>
  treinos: Array<{ nome: string; exercicios: ExercicioImportado[] }>
  avisos: string[]
}

const HEADERS_CHAVE = {
  semana: ['semana', 'periodo', 'mês', 'mes', 'week'],
  rotulo: ['rotulo', 'rótulo', 'foco', 'objetivo', 'descricao', 'descrição'],
  carga: ['carga', 'kg', 'carga_kg', 'carga (kg)'],
  horas: ['hora', 'horas', 'duracao', 'duração', 'horas_treino', 'tempo'],
}

function normalizaChave(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function acharChave(headers: string[], candidatos: string[]): string | null {
  for (const h of headers) {
    const n = normalizaChave(h)
    if (candidatos.some((c) => n === normalizaChave(c) || n.includes(normalizaChave(c)))) return h
  }
  return null
}

function paraNumero(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(
    String(v)
      .replace(',', '.')
      .replace(/[^\d.-]/g, ''),
  )
  return Number.isFinite(n) && n !== 0 ? n : undefined
}

/** Lê .xlsx/.xls/.csv e extrai semanas (aba "Periodização") e treinos/exercícios (aba "Treinos"/"Exercícios"). */
export async function parseArquivoExcel(
  file: File,
): Promise<Omit<ResultadoImportacaoPrograma, 'modalidade'>> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const avisos: string[] = []
  const semanas: ResultadoImportacaoPrograma['semanas'] = []
  const treinosMap = new Map<string, ExercicioImportado[]>()

  const nome = file.name.replace(/\.(xlsx|xls|csv)$/i, '') || 'Programa importado'

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) continue
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    if (rows.length === 0) continue

    const headers = Object.keys(rows[0])
    const chaveSemana = acharChave(headers, HEADERS_CHAVE.semana)
    const chaveRotulo = acharChave(headers, HEADERS_CHAVE.rotulo)
    const chaveCarga = acharChave(headers, HEADERS_CHAVE.carga)
    const chaveHoras = acharChave(headers, HEADERS_CHAVE.horas)
    const chaveTreino = acharChave(headers, ['treino', 'sessão', 'sessao', 'workout'])
    const chaveExercicio = acharChave(headers, ['exercicio', 'exercício', 'movimento'])
    const chaveSeries = acharChave(headers, ['series', 'séries', 'set'])
    const chaveReps = acharChave(headers, ['repeticoes', 'repetições', 'reps', 'rep'])
    const chaveObs = acharChave(headers, ['observacao', 'observações', 'obs', 'notas'])

    const abaPeriodizacao = chaveSemana && chaveExercicio == null
    const abaTreinos = chaveExercicio != null

    if (abaPeriodizacao) {
      for (const row of rows) {
        const indice = paraNumero(row[chaveSemana])
        if (indice == null) continue
        semanas.push({
          indice: Math.round(indice),
          rotulo: chaveRotulo ? String(row[chaveRotulo] || '').trim() || undefined : undefined,
          carga: chaveCarga ? paraNumero(row[chaveCarga]) : undefined,
          horas: chaveHoras ? paraNumero(row[chaveHoras]) : undefined,
        })
      }
    } else if (abaTreinos) {
      for (const row of rows) {
        const treinoNome = chaveTreino ? String(row[chaveTreino] || '').trim() : ''
        const nomeEx = chaveExercicio ? String(row[chaveExercicio] || '').trim() : ''
        if (!nomeEx) continue
        const chave = treinoNome || 'Treino 1'
        if (!treinosMap.has(chave)) treinosMap.set(chave, [])
        treinosMap.get(chave)!.push({
          treinoNome: chave,
          nome: nomeEx,
          series: chaveSeries ? paraNumero(row[chaveSeries]) : undefined,
          repeticoes: chaveReps ? String(row[chaveReps] || '').trim() || undefined : undefined,
          observacoes: chaveObs ? String(row[chaveObs] || '').trim() || undefined : undefined,
        })
      }
    } else {
      avisos.push(`Aba "${sheetName}" não reconhecida (sem colunas de semana ou de exercício).`)
    }
  }

  if (semanas.length === 0 && treinosMap.size === 0) {
    throw new Error(
      'Não foi possível identificar semanas nem exercícios no arquivo. Use as colunas "Semana", "Rótulo", "Carga", "Horas" e/ou "Treino", "Exercício", "Séries", "Repetições", "Observações".',
    )
  }

  const treinos = Array.from(treinosMap.entries()).map(([nomeTreino, exercicios]) => ({
    nome: nomeTreino,
    exercicios,
  }))

  if (semanas.length === 0) avisos.push('Nenhuma semana de periodização encontrada no arquivo.')
  if (treinos.length === 0) avisos.push('Nenhum treino/exercício encontrado no arquivo.')

  return { nome, semanas, treinos, avisos }
}

type MammothBrowser = {
  convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
  extractRawText?: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
}

const MAMMOTH_FONTES: { nome: string; url: string }[] = [
  {
    nome: 'jsdelivr',
    url: 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.esm.js',
  },
  { nome: 'unpkg', url: 'https://unpkg.com/mammoth@1.8.0/mammoth.browser.esm.js' },
  { nome: 'esm.sh', url: 'https://esm.sh/mammoth@1.8.0' },
]

let mammothPromise: Promise<MammothBrowser> | null = null

/**
 * Carrega o mammoth (leitor de .docx) em RUNTIME via CDN ESM — igual ao padrão
 * do pdf.js em anexoIaPreparo.ts. O pacote NÃO está instalado no projeto e por
 * isso NUNCA pode ser importado estaticamente (derrubaria o build do Rolldown).
 * Se nenhuma CDN responder, lança erro 'cdn_indisponivel' com mensagem clara
 * para o usuário tentar novamente ou importar uma planilha .xlsx.
 */
async function carregarMammoth(): Promise<MammothBrowser> {
  if (typeof window === 'undefined') {
    throw new Error('cdn_indisponivel: ambiente sem navegador')
  }
  if (mammothPromise) return mammothPromise

  const tentar = async (): Promise<MammothBrowser> => {
    const motivos: string[] = []
    for (const fonte of MAMMOTH_FONTES) {
      try {
        const mod = (await import(/* @vite-ignore */ fonte.url)) as unknown as Record<
          string,
          unknown
        >
        const lib = (mod?.default ?? mod) as MammothBrowser | undefined
        if (!lib || typeof lib.convertToHtml !== 'function') {
          throw new Error('módulo não expõe convertToHtml')
        }
        console.info(`[importacaoProgramas] mammoth carregado de ${fonte.nome}`)
        return lib
      } catch (e) {
        const motivo = e instanceof Error ? e.message : String(e)
        console.warn(`[importacaoProgramas] CDN "${fonte.nome}" falhou: ${motivo}`)
        motivos.push(`${fonte.nome}: ${motivo}`)
      }
    }
    throw new Error(
      'cdn_indisponivel: Não foi possível carregar o leitor de Word. Verifique sua conexão e tente novamente, ou importe uma planilha .xlsx.',
    )
  }

  mammothPromise = tentar().catch((e: unknown) => {
    mammothPromise = null // permite nova tentativa ("Tentar novamente")
    throw e
  })
  return mammothPromise
}

/** Lê .docx e extrai texto estruturado (títulos = treinos/semanas, listas/tabelas = exercícios). */
export async function parseArquivoWord(
  file: File,
): Promise<Omit<ResultadoImportacaoPrograma, 'modalidade'>> {
  const mammoth = await carregarMammoth()
  const arrayBuffer = await file.arrayBuffer()
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const nome = file.name.replace(/\.docx$/i, '') || 'Programa importado'
  const semanas: ResultadoImportacaoPrograma['semanas'] = []
  const treinosMap = new Map<string, ExercicioImportado[]>()
  const avisos: string[] = []

  let treinoAtual = 'Treino 1'
  let semanaAtual: number | null = null

  const pushExercicio = (texto: string) => {
    const limpo = texto.trim()
    if (!limpo) return
    if (!treinosMap.has(treinoAtual)) treinosMap.set(treinoAtual, [])
    treinosMap.get(treinoAtual)!.push({ treinoNome: treinoAtual, nome: limpo })
  }

  const processarLinha = (texto: string) => {
    const t = texto.trim()
    if (!t) return
    const mSemana = t.match(/semana\s*(\d+)/i)
    if (mSemana) {
      semanaAtual = Number(mSemana[1])
      semanas.push({
        indice: semanaAtual,
        rotulo: t.replace(/semana\s*\d+/i, '').trim() || undefined,
      })
      return
    }
    const mTreino = t.match(/^(treino|sess[ãa]o|workout)\s*[a-z0-9]*\s*[-–—:]?\s*(.*)$/i)
    if (mTreino) {
      treinoAtual = t.replace(/[:\-–—]\s*$/, '').trim()
      if (!treinosMap.has(treinoAtual)) treinosMap.set(treinoAtual, [])
      return
    }
    const bullet = /^[•\-*]\s*/.test(t)
    if (bullet) {
      pushExercicio(t.replace(/^[•\-*]\s*/, ''))
    }
  }

  // Parágrafos e itens de lista
  doc.querySelectorAll('p, li').forEach((el) => processarLinha(el.textContent || ''))

  // Tabelas: cada linha vira exercício; primeira célula pode ser o treino
  doc.querySelectorAll('table').forEach((table) => {
    table.querySelectorAll('tr').forEach((tr) => {
      const celulas = Array.from(tr.querySelectorAll('td,th')).map((td) =>
        (td.textContent || '').trim(),
      )
      if (celulas.length >= 2 && celulas[0] && celulas[1]) {
        if (/^(treino|sess[ãa]o)/i.test(celulas[0])) {
          treinoAtual = celulas[0]
          if (!treinosMap.has(treinoAtual)) treinosMap.set(treinoAtual, [])
        } else {
          treinosMap.get(treinoAtual)?.push({
            treinoNome: treinoAtual,
            nome: celulas[0],
            series: paraNumero(celulas[1]),
            repeticoes: celulas[2] || undefined,
            observacoes: celulas[3] || undefined,
          })
        }
      }
    })
  })

  if (semanas.length === 0 && treinosMap.size === 0) {
    throw new Error(
      'Não foi possível identificar treinos ou semanas no documento. Use títulos "Semana 1", "Treino A" e listas/tabelas de exercícios.',
    )
  }

  const treinos = Array.from(treinosMap.entries()).map(([nomeTreino, exercicios]) => ({
    nome: nomeTreino,
    exercicios,
  }))

  if (semanas.length === 0)
    avisos.push('Nenhuma semana ("Semana 1", "Semana 2"...) encontrada no documento.')
  if (treinos.length === 0) avisos.push('Nenhum treino/exercício encontrado no documento.')

  return { nome, semanas, treinos, avisos }
}

export async function parseArquivoPrograma(
  file: File,
): Promise<Omit<ResultadoImportacaoPrograma, 'modalidade'>> {
  if (/\.docx$/i.test(file.name)) return parseArquivoWord(file)
  if (/\.(xlsx|xls|csv)$/i.test(file.name)) return parseArquivoExcel(file)
  throw new Error('Formato não suportado. Envie um arquivo .xlsx, .xls, .csv ou .docx.')
}
