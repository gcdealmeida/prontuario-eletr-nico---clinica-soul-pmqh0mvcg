/**
 * Agregações locais do app do Cliente Soul (modelo do health-tracker de
 * referência) — nenhuma IA: tudo calculado a partir dos registros gravados em
 * saude_registros (dados_json por tipo). Usado por Hoje, Sono/Detalhe,
 * Refeições, Medicações, Diário Emocional, Exames e Insights.
 */
import type { SaudeRegistroRecord, SaudeRegistroTipo } from '@/services/saudeBemEstar'

export const hojeYMD = () => {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export const ymdDe = (iso?: string) => (iso || '').slice(0, 10)

/** "2024-05-02 12:00:00.000Z" (formato de data dos registros) -> ymd local do dia gravado. */
export const ymdDoRegistro = (r: SaudeRegistroRecord) => ymdDe(r.data)

/* ------------------------- formas dos dados_json ------------------------- */

export interface DadosSono {
  hora_deitar?: string
  hora_acordar?: string
  horas?: number
  qualidade?: number // 1..5
  fases?: { deep?: number; rem?: number; awake?: number; light?: number }
}

export interface DadosRefeicao {
  refeicao?: 'cafe' | 'almoco' | 'janta' | 'lanche'
  itens?: string
  calorias?: number
}

export interface DadosMedicacao {
  nome?: string
  dose?: string
  horario?: string
  ingerida?: boolean
}

export interface DadosEmocao {
  humor: 'otimo' | 'bom' | 'neutro' | 'baixo' | 'ruim'
  notas?: string
}

export interface DadosAtividade {
  descricao?: string
  duracao_min?: number
  intensidade?: 'leve' | 'moderada' | 'intensa'
}

export interface DadosBebida {
  bebida?: 'agua' | 'cafe' | 'cha' | 'suco' | 'refrigerante' | 'alcool'
  copos?: number
}

export const dadosSono = (r: SaudeRegistroRecord) => (r.dados_json || {}) as DadosSono
export const dadosRefeicao = (r: SaudeRegistroRecord) => (r.dados_json || {}) as DadosRefeicao
export const dadosMedicacao = (r: SaudeRegistroRecord) => (r.dados_json || {}) as DadosMedicacao
export const dadosEmocao = (r: SaudeRegistroRecord) => (r.dados_json || {}) as DadosEmocao
export const dadosAtividade = (r: SaudeRegistroRecord) => (r.dados_json || {}) as DadosAtividade
export const dadosBebida = (r: SaudeRegistroRecord) => (r.dados_json || {}) as DadosBebida

/* ----------------------------- selecionadores ---------------------------- */

export const registrosDoDia = (rs: SaudeRegistroRecord[], dia: string) =>
  rs.filter((r) => ymdDoRegistro(r) === dia)

export const porTipo = (rs: SaudeRegistroRecord[], t: SaudeRegistroTipo) =>
  rs.filter((r) => r.tipo === t)

export const registrosDeTipoNoDia = (
  rs: SaudeRegistroRecord[],
  t: SaudeRegistroTipo,
  dia: string,
) => porTipo(rs, t).filter((r) => ymdDoRegistro(r) === dia)

/* ------------------------------- métricas -------------------------------- */

/** Horas de sono do dia (registro 'sono' mais recente do dia). */
export function horasSonoNoDia(rs: SaudeRegistroRecord[], dia: string): number | null {
  const doDia = registrosDeTipoNoDia(rs, 'sono', dia)
  if (doDia.length === 0) return null
  const d = dadosSono(doDia[0])
  if (typeof d.horas === 'number' && d.horas > 0) return d.horas
  if (d.hora_deitar && d.hora_acordar) {
    const [h1, m1] = d.hora_deitar.split(':').map(Number)
    const [h2, m2] = d.hora_acordar.split(':').map(Number)
    let mins = h2 * 60 + m2 - (h1 * 60 + m1)
    if (mins <= 0) mins += 24 * 60 // dormiu passando da meia-noite
    return Math.round((mins / 60) * 10) / 10
  }
  return null
}

/** Copos de água do dia (soma dos registros 'bebida' com bebida=agua). */
export function coposAguaNoDia(rs: SaudeRegistroRecord[], dia: string): number {
  return registrosDeTipoNoDia(rs, 'bebida', dia)
    .map(dadosBebida)
    .filter((b) => b.bebida === 'agua')
    .reduce((s, b) => s + (b.copos || 0), 0)
}

/** Calorias do dia (soma das refeições). */
export function caloriasNoDia(rs: SaudeRegistroRecord[], dia: string): number {
  return registrosDeTipoNoDia(rs, 'refeicao', dia)
    .map(dadosRefeicao)
    .reduce((s, r) => s + (r.calorias || 0), 0)
}

/** Minutos de atividade do dia. */
export function minutosAtividadeNoDia(rs: SaudeRegistroRecord[], dia: string): number {
  return registrosDeTipoNoDia(rs, 'atividade_fisica', dia)
    .map(dadosAtividade)
    .reduce((s, a) => s + (a.duracao_min || 0), 0)
}

/** Metas do perfil (saude_clientes.metas json): { agua_copos, sono_horas, calorias, atividade_min }. */
export interface MinhasMetas {
  agua_copos?: number
  sono_horas?: number
  calorias?: number
  atividade_min?: number
}

export function metasDoPerfil(perfil?: Record<string, unknown> | null): MinhasMetas {
  const m = (perfil?.metas || {}) as MinhasMetas
  return {
    agua_copos: m.agua_copos || 8,
    sono_horas: m.sono_horas || 8,
    calorias: m.calorias || 2000,
    atividade_min: m.atividade_min || 30,
  }
}

/* --------------------------- sono (fases/hist.) --------------------------- */

export interface PontoSono {
  dia: string
  horas: number | null
  deep?: number
  rem?: number
  awake?: number
  light?: number
}

/** Série dos últimos N dias com sono registrado (para gráfico e fases). */
export function serieSono(rs: SaudeRegistroRecord[], dias = 14): PontoSono[] {
  const out: PontoSono[] = []
  const base = new Date(`${hojeYMD()}T12:00:00`)
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86400000)
    const dia = d.toISOString().slice(0, 10)
    const doDia = registrosDeTipoNoDia(rs, 'sono', dia)
    if (doDia.length === 0) {
      out.push({ dia, horas: null })
      continue
    }
    const dd = dadosSono(doDia[0])
    out.push({
      dia,
      horas: horasSonoNoDia(rs, dia),
      deep: dd.fases?.deep,
      rem: dd.fases?.rem,
      awake: dd.fases?.awake,
      light: dd.fases?.light,
    })
  }
  return out
}

/* --------------------------- diário emocional ----------------------------- */

export const ROTULOS_HUMOR: Record<DadosEmocao['humor'], string> = {
  otimo: 'Ótimo',
  bom: 'Bom',
  neutro: 'Neutro',
  baixo: 'Baixo',
  ruim: 'Ruim',
}

/** Percentual de cada humor no período (para o quadro do diário emocional). */
export function distribuicaoHumor(rs: SaudeRegistroRecord[], dias = 30) {
  const corte = new Date(new Date(`${hojeYMD()}T12:00:00`).getTime() - (dias - 1) * 86400000)
  const noPeriodo = porTipo(rs, 'emocao').filter(
    (r) => new Date(`${ymdDoRegistro(r)}T12:00:00`) >= corte,
  )
  const total = noPeriodo.length
  const contagem: Record<DadosEmocao['humor'], number> = {
    otimo: 0,
    bom: 0,
    neutro: 0,
    baixo: 0,
    ruim: 0,
  }
  for (const r of noPeriodo) {
    const h = dadosEmocao(r).humor
    if (h in contagem) contagem[h] += 1
  }
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
  return {
    total,
    contagem,
    percentuais: {
      otimo: pct(contagem.otimo),
      bom: pct(contagem.bom),
      neutro: pct(contagem.neutro),
      baixo: pct(contagem.baixo),
      ruim: pct(contagem.ruim),
    },
  }
}

/* -------------------------------- insights -------------------------------- */

export interface Insight {
  titulo: string
  texto: string
  tom: 'positivo' | 'atencao' | 'neutro'
}

/** Insights calculados localmente (sem IA) a partir dos últimos 7/14 dias. */
export function calcularInsights(rs: SaudeRegistroRecord[]): Insight[] {
  const hoje = hojeYMD()
  const dias7: string[] = []
  for (let i = 6; i >= 0; i--) {
    dias7.push(
      new Date(new Date(`${hoje}T12:00:00`).getTime() - i * 86400000).toISOString().slice(0, 10),
    )
  }
  const out: Insight[] = []

  // Sono médio
  const horas = dias7.map((d) => horasSonoNoDia(rs, d)).filter((h): h is number => h !== null)
  if (horas.length >= 2) {
    const media = Math.round((horas.reduce((a, b) => a + b, 0) / horas.length) * 10) / 10
    out.push({
      titulo: 'Sono',
      texto: `Média de ${media}h de sono nos últimos ${horas.length} dias registrados.`,
      tom: media >= 7 ? 'positivo' : 'atencao',
    })
  }

  // Água
  const copos = dias7.map((d) => coposAguaNoDia(rs, d))
  const mediaCopos = copos.reduce((a, b) => a + b, 0) / 7
  if (mediaCopos > 0) {
    out.push({
      titulo: 'Hidratação',
      texto: `Você bebe em média ${Math.round(mediaCopos)} copos de água por dia.`,
      tom: mediaCopos >= 6 ? 'positivo' : 'atencao',
    })
  }

  // Atividade
  const mins = dias7.map((d) => minutosAtividadeNoDia(rs, d))
  const totalMin = mins.reduce((a, b) => a + b, 0)
  if (totalMin > 0) {
    const diasAtivos = mins.filter((m) => m > 0).length
    out.push({
      titulo: 'Atividade física',
      texto: `${diasAtivos} de 7 dias com atividade física (${totalMin} min no total).`,
      tom: diasAtivos >= 3 ? 'positivo' : 'atencao',
    })
  }

  // Refeições
  const diasComRefeicao = dias7.filter(
    (d) => registrosDeTipoNoDia(rs, 'refeicao', d).length > 0,
  ).length
  if (diasComRefeicao > 0) {
    const calorias = dias7.map((d) => caloriasNoDia(rs, d)).filter((c) => c > 0)
    const mediaCal = calorias.length
      ? Math.round(calorias.reduce((a, b) => a + b, 0) / calorias.length)
      : 0
    out.push({
      titulo: 'Alimentação',
      texto: mediaCal
        ? `Você registrou refeições em ${diasComRefeicao} dos últimos 7 dias (média de ${mediaCal} kcal/dia).`
        : `Você registrou refeições em ${diasComRefeicao} dos últimos 7 dias.`,
      tom: diasComRefeicao >= 5 ? 'positivo' : 'neutro',
    })
  }

  // Humor
  const humor = distribuicaoHumor(rs, 7)
  if (humor.total > 0) {
    const positivos = humor.contagem.otimo + humor.contagem.bom
    const pctPositivo = Math.round((positivos / humor.total) * 100)
    out.push({
      titulo: 'Humor',
      texto: `${pctPositivo}% dos seus registros de humor nos últimos 7 dias foram positivos (${humor.total} registro(s)).`,
      tom: pctPositivo >= 60 ? 'positivo' : pctPositivo >= 40 ? 'neutro' : 'atencao',
    })
  }

  if (out.length === 0) {
    out.push({
      titulo: 'Comece registrando',
      texto: 'Registre sono, alimentação, atividades e humor para ver seus insights aqui.',
      tom: 'neutro',
    })
  }
  return out
}

/** Descrição curta de um registro (para timeline e listas). */
export function descreverRegistro(r: SaudeRegistroRecord): string {
  if (r.observacao) return r.observacao
  const d = (r.dados_json || {}) as Record<string, unknown>
  switch (r.tipo) {
    case 'sono': {
      const s = d as DadosSono
      if (s.horas) return `${s.horas}h de sono`
      if (s.hora_deitar && s.hora_acordar)
        return `Deitou ${s.hora_deitar}, acordou ${s.hora_acordar}`
      return 'Registro de sono'
    }
    case 'bebida': {
      const b = d as DadosBebida
      return `${b.copos || 1} copo(s) de ${b.bebida || 'água'}`
    }
    case 'refeicao': {
      const f = d as DadosRefeicao
      return `${f.refeicao || 'refeição'}${f.calorias ? ` — ${f.calorias} kcal` : ''}${f.itens ? `: ${f.itens}` : ''}`
    }
    case 'medicacao': {
      const m = d as DadosMedicacao
      return `${m.nome || 'Medicação'}${m.dose ? ` (${m.dose})` : ''}`
    }
    case 'atividade_fisica': {
      const a = d as DadosAtividade
      return `${a.duracao_min ? `${a.duracao_min} min` : 'Atividade'}${a.descricao ? `: ${a.descricao}` : ''}`
    }
    case 'emocao': {
      const e = d as DadosEmocao
      return `Humor: ${ROTULOS_HUMOR[e.humor] || e.humor}`
    }
    case 'sintoma':
    case 'exame':
    default:
      return typeof d.descricao === 'string' && d.descricao
        ? d.descricao
        : labelTipoFallback(r.tipo)
  }
}

const labelTipoFallback = (t: SaudeRegistroTipo) => t.replace(/_/g, ' ')
