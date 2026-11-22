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
      default:
        c.semStatus++
    }
  }
  return c
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

export function diaDiferenca(a: string, b: string): number {
  const [a1, m1, d1] = a.split('-').map(Number)
  const [a2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / (24 * 60 * 60 * 1000))
}

/** Granularidade sugerida para o período: até 45 dias = dia, até 2 anos = semana, senão ano. */
export type Granularidade = 'dia' | 'semana' | 'mes' | 'ano'

export function granularidadeSugerida(inicio: string, fim: string): Granularidade {
  const dias = diaDiferenca(inicio, fim)
  if (dias <= 45) return 'dia'
  if (dias <= 150) return 'semana'
  if (dias <= 760) return 'mes'
  return 'ano'
}

export const LABELS_GRANULARIDADE: Record<Granularidade, string> = {
  dia: 'Dia',
  semana: 'Semana',
  mes: 'Mês',
  ano: 'Ano',
}

function segundaFeiraDe(ymd: string): string {
  const [a, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d))
  const diaSemana = (dt.getUTCDay() + 6) % 7 // 0 = segunda
  dt.setUTCDate(dt.getUTCDate() - diaSemana)
  return dt.toISOString().slice(0, 10)
}

/**
 * Série temporal de atendimentos no período (versão simples, total único).
 * Para períodos <= 45 dias agrupa por dia, senão por mês (chave YYYY-MM).
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

export function chaveTempoDe(ymd: string, g: Granularidade): string {
  if (g === 'dia') return ymd
  if (g === 'semana') return segundaFeiraDe(ymd)
  if (g === 'mes') return ymd.slice(0, 7)
  return ymd.slice(0, 4)
}

export function rotuloChave(chave: string, g: Granularidade): string {
  if (g === 'dia') {
    const [, m, d] = chave.split('-').map(Number)
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
  }
  if (g === 'semana') {
    const [, m, d] = chave.split('-').map(Number)
    return `sem ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
  }
  if (g === 'mes') {
    const [a, m] = chave.split('-').map(Number)
    return `${MESES_ABREV[m - 1]}/${String(a).slice(-2)}`
  }
  return chave
}

export function proximaChave(chave: string, g: Granularidade): string {
  if (g === 'dia') return deslocarYMD(chave, 1)
  if (g === 'semana') return deslocarYMD(chave, 7)
  const [a, m] = chave.split('-').map(Number)
  if (g === 'mes') {
    const dt = new Date(Date.UTC(a, m - 1, 1))
    dt.setUTCMonth(dt.getUTCMonth() + 1)
    return dt.toISOString().slice(0, 7)
  }
  return String(a + 1)
}

/**
 * Série temporal MULTI-SÉRIE do gráfico "Atendimentos no tempo": uma série por
 * entidade escolhida (profissional, serviço ou programa). Cada entrada da série
 * tem { chave, label, [nomeEntidade]: total }.
 */
export function serieTemporalMulti(
  presencas: {
    data_atendimento: string
    profissional_id?: string
    profissional_nome?: string
    servico?: string
    area_servico?: string
    programa?: string
  }[],
  inicio: string,
  fim: string,
  agrupamento: 'profissional' | 'servico' | 'programa',
  granularidade: Granularidade,
  entidades: string[],
  nomesPorId?: Map<string, string>,
): { chave: string; label: string; [nome: string]: string | number }[] {
  // No agrupamento por profissional, `entidades` chega como IDs de usuário —
  // as chaves do mapa usam o NOME (mesmo rótulo que os chips exibem).
  const nomes = entidades.map((e) => (agrupamento === 'profissional' ? nomesPorId?.get(e) || e : e))

  const conta = new Map<string, number>() // `${chaveTempo}||${entidade}` -> total
  for (const p of presencas) {
    const ymd = ymdDeData(p.data_atendimento)
    if (!ymd || ymd < inicio || ymd > fim) continue
    let entidade = ''
    if (agrupamento === 'profissional') {
      // Nome canônico = o mesmo que os chips exibem (nomesPorId); o campo
      // profissional_nome gravado pode divergir (ex.: sufixo "(Admin)").
      entidade = nomesPorId?.get(p.profissional_id || '') || (p.profissional_nome || '').trim()
    } else if (agrupamento === 'servico') {
      entidade = (p.servico || p.area_servico || '').trim()
    } else {
      entidade = (p.programa || '').trim()
    }
    if (!entidade) continue
    const chaveTempo = chaveTempoDe(ymd, granularidade)
    const k = `${chaveTempo}||${entidade}`
    conta.set(k, (conta.get(k) || 0) + 1)
  }

  // O cursor percorre CHAVES de bucket (mesma forma das chaves do mapa): dia =
  // YYYY-MM-DD, semana = segunda-feira, mês = YYYY-MM, ano = YYYY. Iterar a
  // data cheia fazia semana/mês/ano nunca casarem (série inteira zerada).
  const primeira = chaveTempoDe(inicio, granularidade)
  const corte = granularidade === 'dia' ? fim : chaveTempoDe(fim, granularidade)

  const serie: { chave: string; label: string; [nome: string]: string | number }[] = []
  let cursor = primeira
  let guard = 0
  while (cursor <= corte && guard < 400) {
    guard++
    const linha: { chave: string; label: string; [nome: string]: string | number } = {
      chave: cursor,
      label: rotuloChave(cursor, granularidade),
    }
    for (const nome of nomes) linha[nome] = conta.get(`${cursor}||${nome}`) || 0
    serie.push(linha)
    cursor = proximaChave(cursor, granularidade)
  }
  return serie
}

/** Lista distinta de serviços presentes nos registros (para o multi-seletor). */
export function listarServicosDe(
  presencas: { servico?: string; area_servico?: string }[],
): string[] {
  return [
    ...new Set(presencas.map((p) => (p.servico || p.area_servico || '').trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b))
}

/** Lista distinta de programas presentes nos registros (para o multi-seletor). */
export function listarProgramasDe(presencas: { programa?: string }[]): string[] {
  return [...new Set(presencas.map((p) => (p.programa || '').trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  )
}
