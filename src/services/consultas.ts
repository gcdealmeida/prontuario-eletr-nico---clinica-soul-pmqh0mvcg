import pb from '@/lib/pocketbase/client'
import type { ConsultaRecord } from '@/types/database'

export async function getConsultas(filter = '', sort = 'data_hora', expand = 'paciente_id') {
  return await pb.collection('consultas').getFullList<ConsultaRecord>({
    filter,
    sort,
    expand,
  })
}

export async function getConsultasHoje() {
  const today = new Date()
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
  ).toISOString()
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
  ).toISOString()

  return await pb.collection('consultas').getFullList<ConsultaRecord>({
    filter: `data_hora >= "${startOfDay}" && data_hora <= "${endOfDay}"`,
    sort: 'data_hora',
    expand: 'paciente_id',
  })
}

export async function createConsulta(data: Partial<ConsultaRecord>) {
  return await pb.collection('consultas').create<ConsultaRecord>(data)
}

export async function updateConsulta(id: string, data: Partial<ConsultaRecord>) {
  return await pb.collection('consultas').update<ConsultaRecord>(id, data)
}

export async function deleteConsulta(id: string) {
  return await pb.collection('consultas').delete(id)
}
