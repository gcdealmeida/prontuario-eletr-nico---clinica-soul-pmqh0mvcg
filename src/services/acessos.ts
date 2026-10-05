import pb from '@/lib/pocketbase/client'
import type { UserRecord, AccessLogRecord, AccessStatus } from '@/types/database'

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
