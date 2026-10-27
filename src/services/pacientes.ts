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
  email?: string
  endereco?: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  origem_como_chegou: string
  motivo_procura: string
  limitacoes_incomodo: string
  tratamentos_anteriores: string
  resultado_esperado: string
  diagnostico_medico?: string
}

export function formatarEnderecoCompleto(p: {
  endereco?: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
}): string {
  const partes: string[] = []
  const ruaNumero = [p.endereco_rua, p.endereco_numero].filter(Boolean).join(', ')
  if (ruaNumero) {
    if (p.endereco_complemento) {
      partes.push(`${ruaNumero} (${p.endereco_complemento})`)
    } else {
      partes.push(ruaNumero)
    }
  } else if (p.endereco_complemento) {
    partes.push(p.endereco_complemento)
  }

  if (p.endereco_bairro) partes.push(p.endereco_bairro)

  const cidadeUf = [p.endereco_cidade, p.endereco_estado].filter(Boolean).join(' - ')
  if (cidadeUf) partes.push(cidadeUf)

  if (p.endereco_cep) partes.push(`CEP ${p.endereco_cep}`)

  const montado = partes.join(' • ')
  return montado || (p.endereco || '').trim()
}

export interface PreCadastroSubmitResponse {
  success: boolean
  is_existing: boolean
  paciente_id: string
  paciente_nome: string
  message: string
}

export async function submitPreCadastro(
  payload: PreCadastroPayload,
): Promise<PreCadastroSubmitResponse> {
  try {
    return await pb.send<PreCadastroSubmitResponse>('/backend/v1/public/pre-cadastro', {
      method: 'POST',
      body: payload,
    })
  } catch (err: any) {
    // Fallback gracioso caso endpoint backend esteja indisponível
    console.warn('Fallback para inserção direta de pré-cadastro:', err)
    const rec = await pb.collection('pacientes').create<PacienteRecord>({
      ...payload,
      status: 'Pré-cadastro',
    })
    return {
      success: true,
      is_existing: false,
      paciente_id: rec.id,
      paciente_nome: rec.nome,
      message: 'Pré-avaliação enviada com sucesso!',
    }
  }
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

export interface AtivarPacienteResponse {
  success: boolean
  message: string
  paciente: {
    id: string
    nome: string
    status: string
  }
}

export async function ativarCadastroPaciente(pacienteId: string): Promise<AtivarPacienteResponse> {
  try {
    return await pb.send<AtivarPacienteResponse>('/backend/v1/admin/pacientes/ativar', {
      method: 'POST',
      body: { paciente_id: pacienteId },
    })
  } catch (err: any) {
    console.warn('Fallback ativando paciente diretamente via collection update:', err)
    const rec = await pb.collection('pacientes').update<PacienteRecord>(pacienteId, {
      status: 'Ativo',
    })
    return {
      success: true,
      message: `Cadastro de "${rec.nome}" ativado com sucesso!`,
      paciente: {
        id: rec.id,
        nome: rec.nome,
        status: 'Ativo',
      },
    }
  }
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
