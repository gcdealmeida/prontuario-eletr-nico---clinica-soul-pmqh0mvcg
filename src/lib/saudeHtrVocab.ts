/**
 * Vocabulário do app externo Health Tracker (outro projeto Skip) para os
 * registros enviados pela clínica — MESMA tradução do hook de servidor
 * pocketbase/hooks/healthtracker_integracao.js (CATEGORIA_POR_TIPO e mapa de
 * repeat).
 *
 * O frontend envia type/category JÁ traduzidos ao schema REAL do Health
 * Tracker, fornecido pelo dono do outro projeto — sem "escada de candidatos":
 * uma única chamada com o valor certo basta.
 *
 * SCHEMA REAL — coleção `reminders` do Health Tracker:
 *   - type: ENUM, aceita APENAS remedio | exame | consulta | habito | outro
 *     (padrão do envio da clínica: 'outro').
 *   - title (texto do lembrete) e date (YYYY-MM-DD) são OBRIGATÓRIOS.
 *   - time (HH:MM) e notes (detalhes) são opcionais.
 * Demais coleções (health_metrics, diets, medical_records…) mantêm category +
 * date_time obrigatórios e o type que já funcionava (treino → 'workout' etc.).
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
 * ENUM "type" de cada coleção, por tipo de lançamento — schema REAL do Health
 * Tracker. Para os tipos de prescrição/linha do tempo (treino, reabilitação,
 * exame, sintoma…) mantém o valor que o outro app já aceita; para lembretes,
 * a coleção `reminders` só aceita remedio/exame/consulta/habito/outro.
 */
export const CANDIDATOS_TYPE_POR_TIPO: Record<string, string[]> = {
  treino: ['workout'],
  reabilitacao: ['rehabilitation'],
  exame: ['exam'],
  sintoma: ['symptom'],
  atividade_fisica: ['activity'],
  sono: ['sleep'],
  bebida: ['water'],
  energia: ['energy'],
  alimento: ['food'],
  refeicao: ['meal'],
  dieta: ['diet'],
  medicacao: ['medication'],
  emocao: ['emotion'],
  humor: ['emotion'],
  // Schema real da coleção reminders (informado pelo dono do Health Tracker):
  // remedio | exame | consulta | habito | outro. A clínica envia 'outro' por
  // padrão (o valor exato só quando o lembrete É remédio/exame/consulta/hábito).
  lembrete: ['outro'],
  lembrete_medicacao: ['remedio'],
  lembrete_exame: ['exame'],
  lembrete_consulta: ['consulta'],
  lembrete_habito: ['habito'],
}

/** Valor de fallback quando o tipo não está no mapa. */
export const CANDIDATOS_TYPE_PADRAO: string[] = ['other']

/**
 * Categoria por tipo de lançamento (obrigatória em todas as coleções).
 * Em reminders não há campo category — o hook não injeta categoria para
 * essa coleção.
 */
export const CANDIDATOS_CATEGORY_POR_TIPO: Record<string, string[]> = {
  treino: ['workout'],
  reabilitacao: ['rehabilitation'],
  exame: ['exam'],
  sintoma: ['symptom'],
  atividade_fisica: ['activity'],
  sono: ['sleep'],
  bebida: ['water'],
  energia: ['energy'],
  alimento: ['nutrition'],
  refeicao: ['diet'],
  dieta: ['diet'],
  medicacao: ['medication'],
  emocao: ['emotion'],
  humor: ['emotion'],
  // reminders não usa category (schema real: type/title/date/time/notes/repeat).
  lembrete: [],
  lembrete_medicacao: [],
  lembrete_exame: [],
  lembrete_consulta: [],
  lembrete_habito: [],
}

/** Category de fallback para tipos fora do mapa. */
export const CANDIDATOS_CATEGORY_PADRAO: string[] = ['general']

/**
 * 1º (e único) valor do enum "type" para um tipo de lançamento.
 * Para os subtipos de lembrete (lembrete_medicacao…) devolve o valor exato
 * do schema real (remedio/exame/consulta/habito); para 'lembrete', 'outro'.
 */
export function typeHtrParaTipo(tipo: string): string {
  const lista = CANDIDATOS_TYPE_POR_TIPO[tipo] || CANDIDATOS_TYPE_PADRAO
  return lista[0] || tipo || 'outro'
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
 * Garante o shape do schema REAL no payload que vai ao Health Tracker
 * (mesma lógica do hook — última linha de defesa lá):
 *  - reminders: type (enum real, 'outro' por padrão), title e date
 *    OBRIGATÓRIOS (date = YYYY-MM-DD), time (HH:MM) e notes opcionais —
 *    SEM category (a coleção não tem esse campo).
 *  - demais coleções: category + date_time obrigatórios como já funcionava.
 * Valores explícitos no payload têm prioridade.
 */
export function prepararPayloadHtr(opcoes: {
  tipo: string
  payload: Record<string, unknown>
  /** Data própria do lançamento ("YYYY-MM-DD" ou ISO) — vira date/time. */
  dataLancamento?: string
}): Record<string, unknown> {
  const dados: Record<string, unknown> = {}
  for (const k in opcoes.payload) {
    const v = opcoes.payload[k]
    if (v === undefined || v === null || v === '') continue
    dados[k] = v
  }

  if (colecaoHtrParaTipo(opcoes.tipo) === 'reminders') {
    // ---- Schema real da coleção reminders ----
    if (!dados.type) dados.type = typeHtrParaTipo(opcoes.tipo)
    // title = texto do lembrete (obrigatório)
    dados.title = String(dados.title || dados.titulo || dados.description || opcoes.tipo)
    delete dados.titulo
    delete dados.description
    delete dados.observacao
    // date = YYYY-MM-DD (obrigatório); time = HH:MM (opcional)
    const bruta = String(
      dados.data ||
        (opcoes.dataLancamento ? opcoes.dataLancamento : '') ||
        new Date().toISOString(),
    )
    const dia = /^\d{4}-\d{2}-\d{2}/.test(bruta)
      ? bruta.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
    dados.date = dia
    delete dados.data
    delete dados.date_time
    const horaBruta = String(dados.time || dados.hora || '')
    if (/^\d{1,2}:\d{2}/.test(horaBruta)) {
      const [h, m] = horaBruta.split(':')
      dados.time = `${h.padStart(2, '0')}:${m}`
    } else if (/T\d{2}:\d{2}/.test(bruta)) {
      dados.time = bruta.slice(11, 16)
    } else {
      delete dados.time
    }
    delete dados.hora
    // notes = detalhes (opcional)
    if (!dados.notes && typeof dados.texto === 'string' && dados.texto.trim()) {
      dados.notes = dados.texto
    }
    delete dados.texto
    // A coleção reminders não tem category — remove qualquer resquício.
    delete dados.category
    return dados
  }

  // ---- Demais coleções (comportamento que já funciona) ----
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
