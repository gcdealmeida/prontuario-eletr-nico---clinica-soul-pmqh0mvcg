import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/types/database'

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface UserCreatePayload {
  name: string
  email: string
  password: string
  passwordConfirm: string
  role: 'adm' | 'secretaria' | 'profissional'
  especialidade?: string
  access_status?: 'approved' | 'pending'
}

export interface VinculoPacienteRecord {
  id: string
  profissional_id: string
  paciente_id: string
  expand?: {
    paciente_id?: { id: string; nome: string; status?: string; telefone?: string }
    profissional_id?: { id: string; name: string }
  }
}

export interface ProntuarioLiberadoRecord {
  id: string
  profissional_id: string
  paciente_id: string
  expand?: {
    paciente_id?: { id: string; nome: string; status?: string; telefone?: string }
    profissional_id?: { id: string; name: string }
  }
}

export const OPCOES_PERFIL = [
  { value: 'adm', label: 'Administrador (ADM)' },
  { value: 'secretaria', label: 'Secretária' },
  { value: 'profissional', label: 'Profissional' },
] as const

export const OPCOES_ESPECIALIDADE = ['Fisioterapia', 'Personal', 'Nutrição', 'Médico'] as const

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

/** Lista todos os usuários (só ADM/Secretária têm permissão nas API rules). */
export async function listarUsuarios(): Promise<UserRecord[]> {
  const records = await pb.collection('users').getFullList<UserRecord>({
    sort: 'name',
  })
  return records
}

/** Cria um usuário com perfil (ADM, Secretária ou Profissional). */
export async function criarUsuario(payload: UserCreatePayload): Promise<UserRecord> {
  const res = await pb.collection('users').create<UserRecord>(payload as never)
  return res
}

/** Atualiza dados de um usuário (nome, perfil, especialidade, status). */
export async function atualizarUsuario(
  id: string,
  data: Partial<Pick<UserCreatePayload, 'name' | 'role' | 'especialidade' | 'access_status'>> & {
    password?: string
    passwordConfirm?: string
  },
): Promise<UserRecord> {
  const payload: Record<string, unknown> = { ...data }
  if (payload.password && payload.passwordConfirm) {
    payload.password = payload.password
    payload.passwordConfirm = payload.passwordConfirm
  } else {
    delete payload.password
    delete payload.passwordConfirm
  }
  const res = await pb.collection('users').update<UserRecord>(id, payload as never)
  return res
}

/** Exclui um usuário (via endpoint administrativo existente). */
export async function excluirUsuario(target_user_id: string): Promise<void> {
  await pb.send('/backend/v1/admin/access/manage', {
    method: 'POST',
    body: { target_user_id, action: 'delete', reason: 'Excluído na Gestão' },
  })
}

/* ------------------------------------------------------------------ */
/* Vínculos (designação de pacientes a profissionais)                  */
/* ------------------------------------------------------------------ */

export async function listarVinculos(): Promise<VinculoPacienteRecord[]> {
  return pb.collection('vinculos_pacientes').getFullList<VinculoPacienteRecord>({
    sort: '-created',
    expand: 'paciente_id,profissional_id',
  })
}

export async function listarVinculosPorProfissional(
  profissionalId: string,
): Promise<VinculoPacienteRecord[]> {
  return pb.collection('vinculos_pacientes').getFullList<VinculoPacienteRecord>({
    filter: `profissional_id = "${profissionalId}"`,
    sort: '-created',
    expand: 'paciente_id',
  })
}

/** Designa um paciente a um profissional (par único; ignora 400 de duplicidade). */
export async function designarPaciente(
  profissionalId: string,
  pacienteId: string,
): Promise<'criado' | 'existente'> {
  try {
    await pb.collection('vinculos_pacientes').create({
      profissional_id: profissionalId,
      paciente_id: pacienteId,
    })
    return 'criado'
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 400) return 'existente'
    throw err
  }
}

export async function removerVinculo(vinculoId: string): Promise<void> {
  await pb.collection('vinculos_pacientes').delete(vinculoId)
}

/* ------------------------------------------------------------------ */
/* Prontuários liberados                                               */
/* ------------------------------------------------------------------ */

export async function listarProntuariosLiberados(): Promise<ProntuarioLiberadoRecord[]> {
  return pb.collection('prontuarios_liberados').getFullList<ProntuarioLiberadoRecord>({
    sort: '-created',
    expand: 'paciente_id,profissional_id',
  })
}

export async function listarProntuariosLiberadosPorProfissional(
  profissionalId: string,
): Promise<ProntuarioLiberadoRecord[]> {
  return pb.collection('prontuarios_liberados').getFullList<ProntuarioLiberadoRecord>({
    filter: `profissional_id = "${profissionalId}"`,
    sort: '-created',
    expand: 'paciente_id',
  })
}

/** Libera os prontuários de um paciente a um profissional (par único). */
export async function liberarProntuarios(
  profissionalId: string,
  pacienteId: string,
): Promise<'criado' | 'existente'> {
  try {
    await pb.collection('prontuarios_liberados').create({
      profissional_id: profissionalId,
      paciente_id: pacienteId,
    })
    return 'criado'
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 400) return 'existente'
    throw err
  }
}

export async function revogarProntuariosLiberados(registroId: string): Promise<void> {
  await pb.collection('prontuarios_liberados').delete(registroId)
}
