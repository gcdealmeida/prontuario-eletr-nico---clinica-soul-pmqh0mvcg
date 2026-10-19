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

export interface PreCadastroPayload {
  nome: string
  cpf?: string
  data_nascimento?: string
  telefone: string
  endereco?: string
  email?: string
  origem_como_chegou: string
  motivo_procura: string
  limitacoes_incomodo: string
  tratamentos_anteriores: string
  resultado_esperado: string
  diagnostico_medico?: string
}

export async function submitPreCadastro(payload: PreCadastroPayload) {
  return await pb.collection('pacientes').create<PacienteRecord>({
    ...payload,
    status: 'Pré-cadastro',
  })
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

export interface MergePacientesPayload {
  target_paciente_id: string
  source_paciente_id: string
}

export interface MergePacientesResponse {
  success: boolean
  message: string
  target_paciente_id: string
  target_paciente_nome: string
  source_paciente_id: string
  source_paciente_nome: string
  registros_movidos: Record<string, number>
  total_registros_movidos: number
  campos_herdados: string[]
}

export async function mergePacientes(
  payload: MergePacientesPayload,
): Promise<MergePacientesResponse> {
  return await pb.send<MergePacientesResponse>('/backend/v1/admin/pacientes/merge', {
    method: 'POST',
    body: payload,
  })
}
