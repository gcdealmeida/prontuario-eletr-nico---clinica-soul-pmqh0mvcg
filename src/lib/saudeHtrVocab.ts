/**
 * Vocabulário do app externo Health Tracker (outro projeto Skip) para os
 * registros enviados pela clínica — MESMA tradução do hook de servidor
 * pocketbase/hooks/healthtracker_integracao.js (CANDIDATOS_TYPE_POR_TIPO,
 * CANDIDATOS_CATEGORY_POR_TIPO, CATEGORIA_POR_TIPO e mapa de repeat).
 *
 * O frontend envia type/category JÁ traduzidos (1º candidato de cada lista),
 * para não depender do reenvio automático do servidor em "Invalid value".
 */

/** Mapa tipo de registro (saude_registros) → coleção gravável do Health Tracker. */
const COLECAO_HTR_POR_TIPO: Record<string, string> = {
  atividade_fisica: 'health_metrics',
  sono: 'health_metrics',
  bebida: 'health_metrics',
  energia: 'health_metrics',
  alimento: 'diets',
  refeicao: 'diets',
  dieta: 'diets',
  medicacao: 'medications',
  emocao: 'emotional_logs',
  humor: 'emotional_logs',
  sintoma: 'medical_records',
  exame: 'medical_records',
  treino: 'medical_records',
  reabilitacao: 'medical_records',
}

/** Coleção do Health Tracker permitida para gravar um tipo de registro. */
export function colecaoHtrParaTipo(tipo: string): string {
  return COLECAO_HTR_POR_TIPO[tipo] || 'medical_records'
}

/**
 * category exigida pelo Health Tracker em TODAS as coleções graváveis
 * (obrigatória, junto com date_time — sem eles o outro projeto responde
 * "cannot be blank").
 */
const CATEGORIA_HTR_POR_TIPO: Record<string, string> = {
  treino: 'workout',
  reabilitacao: 'rehabilitation',
  exame: 'exam',
  sintoma: 'symptom',
  atividade_fisica: 'activity',
  sono: 'sleep',
  bebida: 'water',
  energia: 'energy',
  alimento: 'nutrition',
  refeicao: 'diet',
  dieta: 'diet',
  medicacao: 'medication',
  emocao: 'emotion',
  humor: 'emotion',
}

/** Categoria do Health Tracker correspondente a um tipo de registro. */
export function categoriaHtrParaTipo(tipo: string): string {
  return CATEGORIA_HTR_POR_TIPO[tipo] || tipo || 'general'
}

/**
 * Candidatos para o campo ENUM "type" de cada coleção, por tipo de
 * lançamento — espelha CANDIDATOS_TYPE_POR_TIPO do hook. O Health Tracker
 * recusa valores fora da lista de opções (erro real: "type: Invalid value
 * treino"); quando o log [HealthTracker] mostrar o valor aceito, ele vira a
 * 1ª posição aqui (e no hook).
 */
export const CANDIDATOS_TYPE_POR_TIPO: Record<string, string[]> = {
  treino: ['workout', 'exercise', 'treino_fisico', 'training', 'other', 'general'],
  reabilitacao: ['rehabilitation', 'therapy', 'treatment', 'other', 'general'],
  exame: ['exam', 'examination', 'other', 'general'],
  sintoma: ['symptom', 'other', 'general'],
  atividade_fisica: ['activity', 'exercise', 'other', 'general'],
  sono: ['sleep', 'other', 'general'],
  bebida: ['water', 'hydration', 'other', 'general'],
  energia: ['energy', 'activity', 'other', 'general'],
  alimento: ['food', 'nutrition', 'meal', 'other', 'general'],
  refeicao: ['meal', 'food', 'diet', 'other', 'general'],
  dieta: ['diet', 'nutrition', 'other', 'general'],
  medicacao: ['medication', 'medicine', 'other', 'general'],
  emocao: ['emotion', 'mood', 'other', 'general'],
  humor: ['emotion', 'mood', 'other', 'general'],
  lembrete: ['reminder', 'task', 'other', 'general'],
}

/** Candidatos de fallback quando o tipo não está no mapa. */
export const CANDIDATOS_TYPE_PADRAO: string[] = ['other', 'general']

/**
 * Candidatos análogos para o campo "category" (obrigatório em todas as
 * coleções e também suscetível de ser enum no outro projeto) — espelha
 * CANDIDATOS_CATEGORY_POR_TIPO do hook.
 */
export const CANDIDATOS_CATEGORY_POR_TIPO: Record<string, string[]> = {
  treino: ['workout', 'exercise', 'training', 'activity', 'general'],
  reabilitacao: ['rehabilitation', 'therapy', 'treatment', 'general'],
  exame: ['exam', 'examination', 'medical', 'general'],
  sintoma: ['symptom', 'medical', 'general'],
  atividade_fisica: ['activity', 'exercise', 'general'],
  sono: ['sleep', 'general'],
  bebida: ['water', 'hydration', 'general'],
  energia: ['energy', 'activity', 'general'],
  alimento: ['nutrition', 'food', 'meal', 'diet', 'general'],
  refeicao: ['diet', 'meal', 'nutrition', 'general'],
  dieta: ['diet', 'nutrition', 'general'],
  medicacao: ['medication', 'medicine', 'general'],
  emocao: ['emotion', 'mood', 'general'],
  humor: ['emotion', 'mood', 'general'],
  lembrete: ['reminder', 'task', 'event', 'general'],
}

/** Candidatos de category para tipos fora do mapa. */
export const CANDIDATOS_CATEGORY_PADRAO: string[] = ['general', 'other']

/** 1º candidato do enum "type" para um tipo de lançamento. */
export function typeHtrParaTipo(tipo: string): string {
  const lista = CANDIDATOS_TYPE_POR_TIPO[tipo] || CANDIDATOS_TYPE_PADRAO
  return lista[0] || tipo || 'other'
}

/**
 * repeat (lembretes): a clínica guarda em português ('nenhuma', 'diaria'…);
 * o Health Tracker espera o valor do enum em inglês.
 */
export function repeatHtr(repeticao: string): string | undefined {
  const mapa: Record<string, string> = {
    nenhuma: 'none',
    diaria: 'daily',
    semanal: 'weekly',
    mensal: 'monthly',
  }
  return mapa[String(repeticao).toLowerCase()]
}

/**
 * Garante category/date_time/type já traduzidos no payload que vai ao Health
 * Tracker (mesma lógica do hook — última linha de defesa lá; aqui evita a
 * primeira recusa "Invalid value"). Valores explícitos no payload têm
 * prioridade.
 */
export function prepararPayloadHtr(opcoes: {
  tipo: string
  payload: Record<string, unknown>
  /** Data própria do lançamento ("YYYY-MM-DD" ou ISO) — vira date_time. */
  dataLancamento?: string
}): Record<string, unknown> {
  const dados: Record<string, unknown> = {}
  for (const k in opcoes.payload) {
    const v = opcoes.payload[k]
    if (v === undefined || v === null || v === '') continue
    dados[k] = v
  }
  dados.category = String(
    dados.category || categoriaHtrParaTipo(opcoes.tipo) || opcoes.tipo || 'general',
  )
  if (!dados.date_time) {
    const d = typeof dados.data === 'string' ? dados.data : opcoes.dataLancamento || ''
    dados.date_time = /^\d{4}-\d{2}-\d{2}$/.test(d)
      ? d + ' 12:00:00.000Z'
      : new Date().toISOString()
  }
  dados.type = String(dados.type || typeHtrParaTipo(opcoes.tipo) || opcoes.tipo || 'other')
  dados.title = String(dados.title || dados.titulo || opcoes.tipo)
  return dados
}
