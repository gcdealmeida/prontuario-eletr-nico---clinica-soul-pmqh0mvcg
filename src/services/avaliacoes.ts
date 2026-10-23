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

export async function createAvaliacao(
  collectionName: string,
  data: Record<string, unknown> | FormData,
) {
  // Tratar FormData (usado para envio de arquivos)
  if (data instanceof FormData) {
    if (!data.has('user_id') && pb.authStore.record?.id) {
      data.append('user_id', pb.authStore.record.id)
    }
    // Se for Fisioterapia, higienizar chaves indesejadas não é direto no FormData,
    // mas garantimos que as entradas numéricas/json cruciais estejam corretas
    return await pb.collection(collectionName).create(data)
  }

  let payload: Record<string, unknown> = {
    ...data,
  }

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
    return await pb.collection(collectionName).update(id, data)
  }

  let payload: Record<string, unknown> = {
    ...data,
  }

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
  paciente_id?: string
  avaliacao_id?: string
  evolucao_id?: string
  especialidade?: string
  nome_arquivo?: string
  collection_name?: string
  record_id?: string
}

export interface AnalisarAnexoIaResponse {
  success: boolean
  nome_arquivo: string
  resumo: string
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
