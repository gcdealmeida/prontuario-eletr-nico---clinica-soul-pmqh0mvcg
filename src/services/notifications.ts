import pb from '@/lib/pocketbase/client'
import type { NotificationRecord } from '@/types/database'

/**
 * Busca notificações do usuário logado (ou admin)
 */
export async function getNotifications(limit: number = 50): Promise<NotificationRecord[]> {
  try {
    const res = await pb.collection('notifications').getList<NotificationRecord>(1, limit, {
      sort: '-created',
    })
    return res.items
  } catch (err) {
    console.error('Erro ao buscar notificações:', err)
    return []
  }
}

/**
 * Conta quantas notificações não lidas existem
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  try {
    const res = await pb.collection('notifications').getList<NotificationRecord>(1, 1, {
      filter: 'lida = false',
    })
    return res.totalItems
  } catch (err) {
    console.error('Erro ao contar notificações não lidas:', err)
    return 0
  }
}

/**
 * Marca uma notificação como lida
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    await pb.collection('notifications').update(id, { lida: true })
    return true
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err)
    return false
  }
}

/**
 * Marca todas as notificações não lidas como lidas
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const unread = await pb.collection('notifications').getFullList<NotificationRecord>({
      filter: 'lida = false',
    })
    await Promise.all(
      unread.map((n) => pb.collection('notifications').update(n.id, { lida: true })),
    )
    return true
  } catch (err) {
    console.error('Erro ao marcar todas notificações como lidas:', err)
    return false
  }
}
