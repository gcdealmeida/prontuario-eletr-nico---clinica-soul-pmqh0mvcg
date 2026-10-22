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

export async function createAvaliacao(
  collectionName: string,
  data: Record<string, unknown> | FormData,
) {
  // Garante que o user_id do autor autenticado seja salvo se ainda não definido
  if (data instanceof FormData) {
    if (!data.has('user_id') && pb.authStore.record?.id) {
      data.append('user_id', pb.authStore.record.id)
    }
    return await pb.collection(collectionName).create(data)
  }

  const payload: Record<string, unknown> = {
    ...data,
  }
  if (!payload.user_id && pb.authStore.record?.id) {
    payload.user_id = pb.authStore.record.id
  }
  return await pb.collection(collectionName).create(payload)
}

export async function updateAvaliacao(
  collectionName: string,
  id: string,
  data: Record<string, unknown> | FormData,
) {
  return await pb.collection(collectionName).update(id, data)
}

export async function gerarIaFisioterapia(avaliacaoPayload: Record<string, unknown>) {
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
  return data
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
