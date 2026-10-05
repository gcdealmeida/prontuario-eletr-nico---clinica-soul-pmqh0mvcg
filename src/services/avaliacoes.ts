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
  return await pb.collection(collectionName).create(data)
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

export function getFileUrl(collectionName: string, recordId: string, filename: string): string {
  return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${collectionName}/${recordId}/${filename}`
}
