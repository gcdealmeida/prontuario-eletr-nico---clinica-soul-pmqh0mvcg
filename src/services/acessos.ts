import pb from '@/lib/pocketbase/client'
import type {
  UserRecord,
  AccessLogRecord,
  AccessStatus,
  ClinicalUpdateLogRecord,
  NotificationRecord,
} from '@/types/database'

export interface ManageAccessPayload {
  target_user_id: string
  action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete'
  reason?: string
}

export interface ManageAccessResponse {
  success: boolean
  message: string
  access_status?: AccessStatus
}

/**
 * Busca todos os usuários do sistema (exclusivo para Admin)
 */
export async function getAllUsers(): Promise<UserRecord[]> {
  try {
    const records = await pb.collection('users').getFullList<UserRecord>({
      sort: '-created',
    })
    return records
  } catch (err) {
    console.error('Erro ao buscar usuários:', err)
    return []
  }
}

/**
 * Executa ação administrativa no endpoint de controle de acesso
 */
export async function manageUserAccess(
  payload: ManageAccessPayload,
): Promise<ManageAccessResponse> {
  const res = await pb.send<ManageAccessResponse>('/backend/v1/admin/access/manage', {
    method: 'POST',
    body: payload,
  })
  return res
}

/**
 * Busca os logs de auditoria de acessos
 */
export async function getAccessLogs(limit: number = 100): Promise<AccessLogRecord[]> {
  try {
    const records = await pb.collection('access_logs').getList<AccessLogRecord>(1, limit, {
      sort: '-created',
    })
    return records.items
  } catch (err) {
    console.error('Erro ao buscar logs de auditoria:', err)
    return []
  }
}

export interface ClinicalLogsFilter {
  tipo_entidade?: string
  especialidade?: string
  user_email?: string
  search?: string
}

/**
 * Busca os logs de atualizações clínicas (avaliacoes, prontuarios, evolucoes)
 * Suporta filtros por tipo de entidade, especialidade, profissional e busca textual
 */
export async function getClinicalUpdateLogs(
  page: number = 1,
  perPage: number = 30,
  filters?: ClinicalLogsFilter,
): Promise<{ items: ClinicalUpdateLogRecord[]; totalItems: number; totalPages: number }> {
  try {
    const filterClauses: string[] = []

    if (filters?.tipo_entidade && filters.tipo_entidade !== 'Todos') {
      filterClauses.push(`tipo_entidade = "${filters.tipo_entidade}"`)
    }
    if (filters?.especialidade && filters.especialidade !== 'Todos') {
      filterClauses.push(`especialidade = "${filters.especialidade}"`)
    }
    if (filters?.user_email && filters.user_email !== 'Todos') {
      filterClauses.push(`user_email = "${filters.user_email}"`)
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().replace(/"/g, '\\"')
      filterClauses.push(
        `(paciente_nome ~ "${q}" || user_name ~ "${q}" || user_email ~ "${q}" || detalhes ~ "${q}")`,
      )
    }

    const filter = filterClauses.length > 0 ? filterClauses.join(' && ') : ''

    const res = await pb
      .collection('clinical_update_logs')
      .getList<ClinicalUpdateLogRecord>(page, perPage, {
        sort: '-created',
        filter: filter || undefined,
      })

    return {
      items: res.items,
      totalItems: res.totalItems,
      totalPages: res.totalPages,
    }
  } catch (err) {
    console.error('Erro ao buscar logs de atualizações clínicas:', err)
    return { items: [], totalItems: 0, totalPages: 1 }
  }
}
