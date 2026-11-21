/**
 * Utilidades de agregação para o Painel Administrativo de Relatórios da clínica SOUL.
 * Tudo é derivado dos registros de presença (coleção "presencas"), que o ADM/Secretária
 * já pode ler por completo — nenhuma regra de API nova é criada.
 */

export type PresetPeriodo = 'hoje' | '7d' | 'mes' | 'mesAnterior' | 'ano' | 'custom'

export interface PeriodoRange {
  inicio: string // YYYY-MM-DD
  fim: string // YYYY-MM-DD
}

export const LABELS_PRESET: Record<PresetPeriodo, string> = {
  hoje: 'Hoje',
  '7d': 'Últimos 7 dias',
  mes: 'Este mês',
  mesAnterior: 'Mês anterior',
  ano: 'Este ano',
  custom: 'Intervalo personalizado',
}

/** Data de hoje (America/Sao_Paulo) no formato YYYY-MM-DD. */
export function hojeYMD(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function deslocarYMD(ymd: string, dias: number): string {
  const [a, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + dias)
  return dt.toISOString().slice(0, 10)
}

function inicioDoAno(ymd: string): string {
  return `${ymd.slice(0, 4)}-01-01`
}

/** Resolve um preset para um intervalo de datas YYYY-MM-DD (início e fim inclusivos). */
export function resolverPreset(
  preset: PresetPeriodo,
  custom?: Partial<PeriodoRange>,
): PeriodoRange {
  const hoje = hojeYMD()
  switch (preset) {
    case 'hoje':
      return { inicio: hoje, fim: hoje }
    case '7d':
      return { inicio: deslocarYMD(hoje, -6), fim: hoje }
    case 'mes':
      return { inicio: `${hoje.slice(0, 7)}-01`, fim: hoje }
    case 'mesAnterior': {
      const primeiroMesAtual = `${hoje.slice(0, 7)}-01`
      const fim = deslocarYMD(primeiroMesAtual, -1)
      return { inicio: `${fim.slice(0, 7)}-01`, fim }
    }
    case 'ano':
      return { inicio: inicioDoAno(hoje), fim: hoje }
    case 'custom': {
      const inicio = custom?.inicio || hoje
      const fim = custom?.fim || hoje
      return fim < inicio ? { inicio: fim, fim: inicio } : { inicio, fim }
    }
  }
}

/** Rotula o intervalo para exibição (dd/mm – dd/mm/aaaa). */
export function rotuloPeriodo(r: PeriodoRange): string {
  const fmt = (ymd: string) => {
    const [a, m, d] = ymd.split('-')
    return `${d}/${m}/${a}`
  }
  return `${fmt(r.inicio)} – ${fmt(r.fim)}`
}

/** Extrai YYYY-MM-DD de qualquer formato de data (date ou datetime). */
export function ymdDeData(valor: string | undefined | null): string {
  return (valor || '').slice(0, 10)
}

const CORES = [
  '#C9A46A',
  '#B87355',
  '#477A53',
  '#5C4033',
  '#7B8FA1',
  '#8C6527',
  '#A8574E',
  '#5B7553',
]

export function corPorIndice(i: number): string {
  return CORES[i % CORES.length]
}

export interface ItemContagem {
  nome: string
  total: number
}

function contarPor(
  presencas: { area_servico?: string; profissional_id: string }[],
  chave: (p: any) => string,
): ItemContagem[] {
  const mapa = new Map<string, number>()
  for (const p of presencas) {
    const k = chave(p) || '—'
    mapa.set(k, (mapa.get(k) || 0) + 1)
  }
  return [...mapa.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
}

export function agruparPorArea(presencas: { area_servico?: string }[]): ItemContagem[] {
  return contarPor(presencas as any, (p) => (p.area_servico || '').trim() || 'Sem área')
}

export interface ItemProfissional extends ItemContagem {
  id: string
}

export function agruparPorProfissional(
  presencas: { profissional_id: string; profissional_nome?: string }[],
  nomesPorId?: Map<string, string>,
): ItemProfissional[] {
  const mapa = new Map<string, { total: number; nome: string }>()
  for (const p of presencas) {
    const id = p.profissional_id
    if (!id) continue
    const atual = mapa.get(id) || {
      total: 0,
      nome: p.profissional_nome || nomesPorId?.get(id) || 'Profissional',
    }
    atual.total++
    if (!p.profissional_nome && nomesPorId?.has(id)) atual.nome = nomesPorId.get(id)!
    mapa.set(id, atual)
  }
  return [...mapa.entries()]
    .map(([id, v]) => ({ id, nome: v.nome, total: v.total }))
    .sort((a, b) => b.total - a.total)
}

export type StatusPresencaValor = 'Presente' | 'Confirmado' | 'Justificado' | 'Cancelado'

/** Status que conta como comparecimento no relatório de frequência. */
export function isCompareceu(status: string | undefined): boolean {
  return status === 'Presente' || status === 'Confirmado'
}

export interface ContagemStatus {
  presente: number
  confirmado: number
  justificado: number
  cancelado: number
  semStatus: number
}

export function contagemPorStatus(presencas: { status?: string }[]): ContagemStatus {
  const c: ContagemStatus = {
    presente: 0,
    confirmado: 0,
    justificado: 0,
    cancelado: 0,
    semStatus: 0,
  }
  for (const p of presencas) {
    switch (p.status) {
      case 'Presente':
        c.presente++
        break
      case 'Confirmado':
        c.confirmado++
        break
      case 'Justificado':
        c.justificado++
        break
      case 'Cancelado':
        c.cancelado++
        break
      default:
        c.semStatus++
    }
  }
  return c
}

/**
 * Série temporal de atendimentos no período. Para períodos <= 45 dias agrupa por dia,
 * senão por mês (chave YYYY-MM).
 */
export function serieTemporal(
  presencas: { data_atendimento: string }[],
  inicio: string,
  fim: string,
): { chave: string; label: string; total: number }[] {
  const contagem = new Map<string, number>()
  for (const p of presencas) {
    const ymd = ymdDeData(p.data_atendimento)
    if (!ymd) continue
    const chave = ymd > fim || diaDiferenca(inicio, fim) > 45 ? ymd.slice(0, 7) : ymd
    contagem.set(chave, (contagem.get(chave) || 0) + 1)
  }
  // Preenche lacunas
  const dias = diaDiferenca(inicio, fim)
  const serie: { chave: string; label: string; total: number }[] = []
  if (dias > 45) {
    let cursor = inicio.slice(0, 7)
    const fimMes = fim.slice(0, 7)
    while (cursor <= fimMes) {
      const [a, m] = cursor.split('-').map(Number)
      serie.push({
        chave: cursor,
        label: `${MESES_ABREV[m - 1]}/${String(a).slice(-2)}`,
        total: contagem.get(cursor) || 0,
      })
      const dt = new Date(Date.UTC(a, m - 1, 1))
      dt.setUTCMonth(dt.getUTCMonth() + 1)
      cursor = dt.toISOString().slice(0, 7)
      if (serie.length > 60) break
    }
  } else {
    let cursor = inicio
    while (cursor <= fim) {
      const [a, m, d] = cursor.split('-').map(Number)
      serie.push({
        chave: cursor,
        label: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
        total: contagem.get(cursor) || 0,
      })
      cursor = deslocarYMD(cursor, 1)
      if (serie.length > 120) break
    }
  }
  return serie
}

const MESES_ABREV = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function diaDiferenca(a: string, b: string): number {
  const [a1, m1, d1] = a.split('-').map(Number)
  const [a2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / (24 * 60 * 60 * 1000))
}
