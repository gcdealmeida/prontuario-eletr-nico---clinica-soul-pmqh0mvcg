import pb from '@/lib/pocketbase/client'
import type { PacienteRecord } from '@/types/database'

export async function getPacientes(filter = '', sort = '-created', limit = 100, page = 1) {
  return await pb.collection('pacientes').getList<PacienteRecord>(page, limit, {
    filter,
    sort,
  })
}

export async function getAllPacientes() {
  return await pb.collection('pacientes').getFullList<PacienteRecord>({
    sort: 'nome',
  })
}

export async function getPacienteById(id: string) {
  return await pb.collection('pacientes').getOne<PacienteRecord>(id)
}

export async function createPaciente(data: Partial<PacienteRecord>) {
  return await pb.collection('pacientes').create<PacienteRecord>(data)
}

export async function updatePaciente(id: string, data: Partial<PacienteRecord>) {
  return await pb.collection('pacientes').update<PacienteRecord>(id, data)
}

export async function deletePaciente(id: string) {
  return await pb.collection('pacientes').delete(id)
}
