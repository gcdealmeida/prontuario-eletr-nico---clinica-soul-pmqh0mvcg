import pb from '@/lib/pocketbase/client'
import type {
  TimelineRecord,
  AvaliacaoFisioterapiaRecord,
  AvaliacaoPersonalRecord,
  AvaliacaoNutricaoRecord,
  AvaliacaoMedicoRecord,
  Especialidade,
} from '@/types/database'

export async function getTimelineByPaciente(pacienteId: string) {
  return await pb.collection('timeline').getFullList<TimelineRecord>({
    filter: `paciente_id = "${pacienteId}"`,
    sort: '-data_evento',
    expand: 'paciente_id',
  })
}

export async function createTimelineEvent(data: Partial<TimelineRecord>) {
  return await pb.collection('timeline').create<TimelineRecord>(data)
}

// Avaliacoes genéricas / por especialidade
export async function getAvaliacoesByPaciente(pacienteId: string) {
  const [fisio, personal, nutri, medico] = await Promise.all([
    pb.collection('avaliacoes_fisioterapia').getFullList<AvaliacaoFisioterapiaRecord>({
      filter: `paciente_id = "${pacienteId}"`,
      sort: '-created',
    }),
    pb.collection('avaliacoes_personal').getFullList<AvaliacaoPersonalRecord>({
      filter: `paciente_id = "${pacienteId}"`,
      sort: '-created',
    }),
    pb.collection('avaliacoes_nutricao').getFullList<AvaliacaoNutricaoRecord>({
      filter: `paciente_id = "${pacienteId}"`,
      sort: '-created',
    }),
    pb.collection('avaliacoes_medico').getFullList<AvaliacaoMedicoRecord>({
      filter: `paciente_id = "${pacienteId}"`,
      sort: '-created',
    }),
  ])

  return { fisio, personal, nutri, medico }
}

export async function getAllAvaliacoes() {
  const [fisio, personal, nutri, medico] = await Promise.all([
    pb.collection('avaliacoes_fisioterapia').getFullList<AvaliacaoFisioterapiaRecord>({
      sort: '-created',
      expand: 'paciente_id',
    }),
    pb.collection('avaliacoes_personal').getFullList<AvaliacaoPersonalRecord>({
      sort: '-created',
      expand: 'paciente_id',
    }),
    pb.collection('avaliacoes_nutricao').getFullList<AvaliacaoNutricaoRecord>({
      sort: '-created',
      expand: 'paciente_id',
    }),
    pb.collection('avaliacoes_medico').getFullList<AvaliacaoMedicoRecord>({
      sort: '-created',
      expand: 'paciente_id',
    }),
  ])

  type AnyAvaliacao = (
    | AvaliacaoFisioterapiaRecord
    | AvaliacaoPersonalRecord
    | AvaliacaoNutricaoRecord
    | AvaliacaoMedicoRecord
  ) & {
    collectionName: string
  }

  const all: AnyAvaliacao[] = [
    ...fisio.map((r) => ({ ...r, collectionName: 'avaliacoes_fisioterapia' })),
    ...personal.map((r) => ({ ...r, collectionName: 'avaliacoes_personal' })),
    ...nutri.map((r) => ({ ...r, collectionName: 'avaliacoes_nutricao' })),
    ...medico.map((r) => ({ ...r, collectionName: 'avaliacoes_medico' })),
  ]

  all.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  return all
}

export function getCollectionNameByEspecialidade(esp: Especialidade): string {
  switch (esp) {
    case 'Fisioterapia':
      return 'avaliacoes_fisioterapia'
    case 'Personal':
      return 'avaliacoes_personal'
    case 'Nutrição':
      return 'avaliacoes_nutricao'
    case 'Médico':
      return 'avaliacoes_medico'
  }
}

export async function getAvaliacaoById(collectionName: string, id: string) {
  return await pb.collection(collectionName).getOne(id, {
    expand: 'paciente_id',
  })
}

/**
 * Busca o rascunho em aberto mais recente do paciente para uma especialidade.
 * Retorna null se não houver rascunho aberto.
 */
export async function getRascunhoAbertoPorPaciente(
  especialidade: Especialidade,
  pacienteId: string,
) {
  try {
    const col = getCollectionNameByEspecialidade(especialidade)
    const list = await pb.collection(col).getList(1, 1, {
      filter: `paciente_id = "${pacienteId}" && status = "Rascunho"`,
      sort: '-updated',
    })
    return list.items.length > 0 ? list.items[0] : null
  } catch (err) {
    console.warn('Erro ao verificar rascunho aberto:', err)
    return null
  }
}

// Lista exata de campos permitidos no schema da coleção avaliacoes_fisioterapia
export const AVALIACOES_FISIOTERAPIA_ALLOWED_FIELDS = new Set<string>([
  'id',
  'paciente_id',
  'especialidade',
  'status',
  'queixa_principal',
  'historia_doenca_atual',
  'historico_medico',
  'medicamentos',
  'cirurgias',
  'postura',
  'adm_ombro',
  'adm_joelho',
  'adm_quadril',
  'adm_coluna',
  'forca_mmss',
  'forca_mmii',
  'forca_core',
  'palpacao',
  'testes_especiais',
  'diagnostico_fisioterapeutico',
  'objetivos_tratamento',
  'plano_tratamento',
  'evolucao_nota',
  'profissional_responsavel',
  'data_avaliacao',
  'anamnese_detalhada',
  'queixas_multiplas',
  'visceras_sistemicas',
  'habitos_saude',
  'adm_segmentos',
  'forca_muscular_grupos',
  'forca_core_tabela',
  'testes_especiais_segmentos',
  'estrela_dor',
  'dinamometro_leituras',
  'secoes_complementares',
  'diagnostico_disfuncional',
  'hipotese_diagnostica_ia',
  'plano_semanal_detalhado',
  'anexos_exames',
  'anexos_dinamometro',
  'forca_muscular_descricao',
  'user_id',
  'dados_importados_planilha',
  'resumos_anexos',
  'fundamentacao_cientifica',
  'fundamentacao_cientifica_ia',
])

const FISIO_NUMBER_FIELDS = new Set<string>([
  'adm_ombro',
  'adm_joelho',
  'adm_quadril',
  'adm_coluna',
  'forca_mmss',
  'forca_mmii',
  'forca_core',
])

const FISIO_JSON_FIELDS = new Set<string>([
  'anamnese_detalhada',
  'queixas_multiplas',
  'visceras_sistemicas',
  'habitos_saude',
  'adm_segmentos',
  'forca_muscular_grupos',
  'forca_core_tabela',
  'testes_especiais_segmentos',
  'estrela_dor',
  'dinamometro_leituras',
  'secoes_complementares',
  'plano_semanal_detalhado',
  'dados_importados_planilha',
  'resumos_anexos',
])

const FISIO_TEXT_FIELDS = new Set<string>([
  'queixa_principal',
  'historia_doenca_atual',
  'historico_medico',
  'medicamentos',
  'cirurgias',
  'postura',
  'palpacao',
  'testes_especiais',
  'diagnostico_fisioterapeutico',
  'diagnostico_disfuncional',
  'hipotese_diagnostica_ia',
  'objetivos_tratamento',
  'plano_tratamento',
  'evolucao_nota',
  'profissional_responsavel',
  'forca_muscular_descricao',
  'fundamentacao_cientifica',
  'fundamentacao_cientifica_ia',
])

/**
 * Normaliza um payload para a coleção avaliacoes_fisioterapia conforme o schema oficial do PocketBase:
 * 1. Remove qualquer chave não existente no schema.
 * 2. Converte campos NUMBER (""/undefined/NaN -> null).
 * 3. Converte campos JSON (string vazia -> null, se string tentar JSON.parse ou null se inválido).
 * 4. Garante que queixa_principal, paciente_id, especialidade e status estão preenchidos e válidos.
 */
export function normalizeAvaliacaoFisioterapiaPayload(
  raw: Record<string, unknown>,
  fallbackStatus: 'Rascunho' | 'Concluída' = 'Rascunho',
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(raw)) {
    // 1. Filtrar chaves que não existem no schema de avaliacoes_fisioterapia
    if (!AVALIACOES_FISIOTERAPIA_ALLOWED_FIELDS.has(key)) {
      continue
    }

    // 2. Normalizar campos NUMBER
    if (FISIO_NUMBER_FIELDS.has(key)) {
      if (val === '' || val === null || val === undefined) {
        normalized[key] = null
      } else {
        const num = Number(val)
        normalized[key] = Number.isFinite(num) ? num : null
      }
      continue
    }

    // 3. Normalizar campos JSON
    if (FISIO_JSON_FIELDS.has(key)) {
      if (val === '' || val === null || val === undefined) {
        normalized[key] = null
      } else if (typeof val === 'string') {
        const trimmed = val.trim()
        if (!trimmed || trimmed === 'null') {
          normalized[key] = null
        } else {
          try {
            normalized[key] = JSON.parse(trimmed)
          } catch {
            normalized[key] = null
          }
        }
      } else if (typeof val === 'object') {
        normalized[key] = val
      } else {
        normalized[key] = null
      }
      continue
    }

    // 4. Normalizar campos TEXT
    if (FISIO_TEXT_FIELDS.has(key)) {
      if (val === null || val === undefined) {
        normalized[key] = ''
      } else {
        normalized[key] = String(val)
      }
      continue
    }

    // Outros campos permitidos (data_avaliacao, especialidade, status, paciente_id, user_id, etc.)
    normalized[key] = val
  }

  // Garantias obrigatórias do schema
  normalized.especialidade = 'Fisioterapia'

  const currentStatus = String(normalized.status || raw.status || fallbackStatus)
  normalized.status = currentStatus === 'Concluída' ? 'Concluída' : 'Rascunho'

  // Garantir queixa_principal preenchida (obrigatória no schema de Fisioterapia)
  let queixa = String(normalized.queixa_principal || '').trim()
  if (!queixa) {
    const rawAnamnese = raw.anamnese_detalhada as Record<string, unknown> | undefined
    const rawQueixas = raw.queixas_multiplas as Array<Record<string, unknown>> | undefined
    queixa =
      (typeof rawAnamnese?.motivo_principal === 'string' && rawAnamnese.motivo_principal.trim()) ||
      (Array.isArray(rawQueixas) &&
        typeof rawQueixas[0]?.queixa === 'string' &&
        rawQueixas[0].queixa.trim()) ||
      (typeof raw.motivo_procura === 'string' && raw.motivo_procura.trim()) ||
      'Avaliação Fisioterapêutica'
  }
  normalized.queixa_principal = queixa

  // Garantir data_avaliacao em formato YYYY-MM-DD
  if (!normalized.data_avaliacao) {
    normalized.data_avaliacao = new Date().toISOString().substring(0, 10)
  } else if (
    typeof normalized.data_avaliacao === 'string' &&
    normalized.data_avaliacao.includes('T')
  ) {
    normalized.data_avaliacao = normalized.data_avaliacao.substring(0, 10)
  }

  // Garantir user_id do autor se ausente
  if (!normalized.user_id && pb.authStore.record?.id) {
    normalized.user_id = pb.authStore.record.id
  }

  return normalized
}

const FISIO_FILE_FIELDS = new Set<string>(['anexos_exames', 'anexos_dinamometro', 'anexos_postura'])

/**
 * Remove campos de arquivo quando o valor for apenas string ou array de strings
 * (nomes de arquivos já salvos anteriormente), pois em JSON/FormData o PocketBase
 * rejeita strings em campos do tipo file com validation_invalid_file.
 * Mantém valores se forem File ou Blob (ou array contendo File/Blob).
 */
export function stripExistingFileStringFields(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = { ...payload }
  for (const field of FISIO_FILE_FIELDS) {
    if (field in cleaned) {
      const val = cleaned[field]
      if (typeof val === 'string') {
        delete cleaned[field]
      } else if (Array.isArray(val)) {
        const hasRealFile = val.some(
          (item) =>
            (typeof File !== 'undefined' && item instanceof File) ||
            (typeof Blob !== 'undefined' && item instanceof Blob),
        )
        if (!hasRealFile) {
          delete cleaned[field]
        }
      }
    }
  }
  return cleaned
}

/**
 * Higieniza um FormData para a coleção avaliacoes_fisioterapia:
 * 1. Converte campos NUMBER vazios ("" ou "null" ou "NaN") omitindo-os ou setando null (PocketBase aceita ausência ou número real).
 * 2. Remove entradas dos campos file (anexos_exames, anexos_dinamometro, anexos_postura) se o valor for string (não File/Blob).
 * 3. Garante que campos JSON sejam strings JSON válidas ou omitidos.
 */
export function sanitizeFisioterapiaFormData(sourceFd: FormData): FormData {
  const sanitized = new FormData()

  for (const [key, val] of sourceFd.entries()) {
    // 1. Filtrar chaves que não existem no schema de avaliacoes_fisioterapia
    if (!AVALIACOES_FISIOTERAPIA_ALLOWED_FIELDS.has(key)) {
      continue
    }

    // 2. Tratar campos de arquivo: apenas aceitar File ou Blob real
    if (FISIO_FILE_FIELDS.has(key)) {
      if (typeof File !== 'undefined' && val instanceof File && val.size > 0 && val.name) {
        sanitized.append(key, val)
      } else if (typeof Blob !== 'undefined' && val instanceof Blob && !(typeof val === 'string')) {
        sanitized.append(key, val)
      }
      // Nomes de arquivos pré-existentes como strings são IGNORADOS aqui (não reenviar)
      continue
    }

    // 3. Tratar campos NUMBER
    if (FISIO_NUMBER_FIELDS.has(key)) {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') {
          // Não enviar strings vazias para campos numéricos no FormData
          continue
        }
        const num = Number(trimmed)
        if (Number.isFinite(num)) {
          sanitized.append(key, String(num))
        }
      }
      continue
    }

    // 4. Tratar campos JSON
    if (FISIO_JSON_FIELDS.has(key)) {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
          continue
        }
        try {
          JSON.parse(trimmed)
          sanitized.append(key, trimmed)
        } catch {
          // JSON inválido, não enviar
          continue
        }
      }
      continue
    }

    // 5. Demais campos (textos, data_avaliacao, paciente_id, status, etc.)
    sanitized.append(key, val)
  }

  // Garantias mínimas
  if (!sanitized.has('especialidade')) {
    sanitized.append('especialidade', 'Fisioterapia')
  }

  if (!sanitized.has('status')) {
    sanitized.append('status', 'Rascunho')
  }

  if (!sanitized.has('user_id') && pb.authStore.record?.id) {
    sanitized.append('user_id', pb.authStore.record.id)
  }

  if (!sanitized.has('data_avaliacao')) {
    sanitized.append('data_avaliacao', new Date().toISOString().substring(0, 10))
  }

  return sanitized
}

export async function createAvaliacao(
  collectionName: string,
  data: Record<string, unknown> | FormData,
) {
  // Tratar FormData (usado para envio de arquivos)
  if (data instanceof FormData) {
    let fdToSend = data
    if (collectionName === 'avaliacoes_fisioterapia') {
      fdToSend = sanitizeFisioterapiaFormData(data)
    } else {
      if (!fdToSend.has('user_id') && pb.authStore.record?.id) {
        fdToSend.append('user_id', pb.authStore.record.id)
      }
    }
    return await pb.collection(collectionName).create(fdToSend)
  }

  let payload: Record<string, unknown> = stripExistingFileStringFields(data)

  if (collectionName === 'avaliacoes_fisioterapia') {
    payload = normalizeAvaliacaoFisioterapiaPayload(
      payload,
      (payload.status as 'Rascunho' | 'Concluída') || 'Rascunho',
    )
  } else {
    if (!payload.user_id && pb.authStore.record?.id) {
      payload.user_id = pb.authStore.record.id
    }
  }

  return await pb.collection(collectionName).create(payload)
}

export async function updateAvaliacao(
  collectionName: string,
  id: string,
  data: Record<string, unknown> | FormData,
) {
  if (data instanceof FormData) {
    let fdToSend = data
    if (collectionName === 'avaliacoes_fisioterapia') {
      fdToSend = sanitizeFisioterapiaFormData(data)
    }
    return await pb.collection(collectionName).update(id, fdToSend)
  }

  let payload: Record<string, unknown> = stripExistingFileStringFields(data)

  if (collectionName === 'avaliacoes_fisioterapia') {
    payload = normalizeAvaliacaoFisioterapiaPayload(
      payload,
      (payload.status as 'Rascunho' | 'Concluída') || 'Rascunho',
    )
  }

  return await pb.collection(collectionName).update(id, payload)
}

export interface GerarIaFisioterapiaResponse {
  raw_content?: string
  structured?: {
    hipotese_diagnostica?: string
    fundamentacao_cientifica?: string
    diagnostico_disfuncional?: string
    objetivos_tratamento?: string
    plano_tratamento_semanal?: Array<{
      semana: string
      foco: string
      condutas: string
      criterios_evolucao?: string
    }>
    sintese_geral?: string
  }
  citations?: any[]
}

export async function gerarIaFisioterapia(
  avaliacaoPayload: Record<string, unknown>,
): Promise<GerarIaFisioterapiaResponse> {
  const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/fisioterapia/gerar-ia`
  const token = pb.authStore.token
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ avaliacao: avaliacaoPayload }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Falha ao processar análise da IA')
  }
  return data as GerarIaFisioterapiaResponse
}

export async function gerarIaPersonal(
  avaliacaoPayload: Record<string, unknown>,
  modo?: 'cruzamento_objetivos_fragilidades',
) {
  const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/personal/gerar-ia`
  const token = pb.authStore.token
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ avaliacao: avaliacaoPayload, modo }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Falha ao processar análise da IA de Personal')
  }
  return data as {
    raw_content?: string
    structured?: {
      hipotese_diagnostica?: string
      fundamentacao_cientifica?: string
      diagnostico_funcional?: string
      objetivos_treinamento?: string
      plano_tratamento_semanal?: Array<{
        semana: string
        foco: string
        condutas: string
        criterios_evolucao?: string
      }>
      sintese_geral?: string
      // Modo Cruzamento
      fragilidades_medidas?: Array<{
        area: string
        descricao: string
        medida_exata: string
        impacto_biomecanico?: string
      }>
      cruzamentos?: Array<{
        objetivo_titulo: string
        fragilidade_atacada: string
        medida_citada: string
        estrategia_prescricao: string
        prioridade: 'Alta' | 'Média' | 'Baixa'
      }>
      priorizacao_objetivos?: Array<{
        ordem: number
        objetivo: string
        justificativa_clinica: string
      }>
      sintese_cruzamento?: string
    }
    citations?: any[]
  }
}

export async function extrairDinamometroArquivo(file: File, textoContexto?: string) {
  const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/fisioterapia/extrair-dinamometro`
  const token = pb.authStore.token

  const formData = new FormData()
  formData.append('arquivo', file)
  if (textoContexto) {
    formData.append('texto', textoContexto)
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Falha ao extrair dados do dinamômetro')
  }
  return data as {
    success: boolean
    nome_arquivo?: string
    resumo: string
    aviso?: string
  }
}

export interface AnalisarAnexoIaParams {
  arquivo?: File
  paginas?: File[]
  paciente_id?: string
  avaliacao_id?: string
  evolucao_id?: string
  especialidade?: string
  nome_arquivo?: string
  collection_name?: string
  record_id?: string
}

export interface AnexoDadosExtraidos {
  tipo_exame?: string
  data_exame?: string
  laboratorio?: string
  achados?: string
  valores_referencia?: string
  conclusao?: string
  campo_sugerido?: string
}

export interface AnalisarAnexoIaResponse {
  success: boolean
  nome_arquivo: string
  resumo: string
  dados_extraidos?: AnexoDadosExtraidos
  truncated?: boolean
  aviso?: string
  analisado_em: string
  analisado_por: string
}

export async function analisarAnexoIa(
  params: AnalisarAnexoIaParams,
): Promise<AnalisarAnexoIaResponse> {
  const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/anexos/analisar-ia`
  const token = pb.authStore.token

  const formData = new FormData()
  if (params.arquivo) {
    formData.append('arquivo', params.arquivo)
  }
  // Páginas rasterizadas do PDF no navegador (pdf.js) — permitem OCR de visão
  // de PDFs escaneados, que o conversor do servidor rejeita por falta de texto.
  if (params.paginas && params.paginas.length > 0) {
    for (const pagina of params.paginas) {
      formData.append('paginas', pagina)
    }
  }
  if (params.paciente_id) formData.append('paciente_id', params.paciente_id)
  if (params.avaliacao_id) formData.append('avaliacao_id', params.avaliacao_id)
  if (params.evolucao_id) formData.append('evolucao_id', params.evolucao_id)
  if (params.especialidade) formData.append('especialidade', params.especialidade)
  if (params.nome_arquivo) formData.append('nome_arquivo', params.nome_arquivo)
  if (params.collection_name) formData.append('collection_name', params.collection_name)
  if (params.record_id) formData.append('record_id', params.record_id)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Falha ao analisar anexo com IA')
  }
  return data as AnalisarAnexoIaResponse
}

export function getFileUrl(collectionName: string, recordId: string, filename: string): string {
  return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${collectionName}/${recordId}/${filename}`
}
