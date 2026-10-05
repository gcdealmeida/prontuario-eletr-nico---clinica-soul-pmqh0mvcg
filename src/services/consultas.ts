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

/**
 * Retorna o calendar_token do usuário atual. Se não existir, gera um novo.
 */
export async function getOrGenerateCalendarToken(): Promise<string> {
  const currentAuth = pb.authStore.record
  if (!currentAuth?.id) {
    throw new Error('Usuário não autenticado')
  }

  // Buscar usuário atualizado no PocketBase
  const user = await pb.collection('users').getOne<any>(currentAuth.id)
  if (user.calendar_token && user.calendar_token.length >= 16) {
    return user.calendar_token
  }

  // Gerar novo token randômico seguro
  const newToken = generateRandomToken(32)
  const updated = await pb.collection('users').update<any>(currentAuth.id, {
    calendar_token: newToken,
  })

  // Atualizar authStore se necessário
  if (pb.authStore.record) {
    pb.authStore.save(pb.authStore.token, updated)
  }

  return updated.calendar_token || newToken
}

/**
 * Regenera o calendar_token do usuário atual (invalidando o link anterior).
 */
export async function regenerateCalendarToken(): Promise<string> {
  const currentAuth = pb.authStore.record
  if (!currentAuth?.id) {
    throw new Error('Usuário não autenticado')
  }

  const newToken = generateRandomToken(32)
  const updated = await pb.collection('users').update<any>(currentAuth.id, {
    calendar_token: newToken,
  })

  if (pb.authStore.record) {
    pb.authStore.save(pb.authStore.token, updated)
  }

  return updated.calendar_token || newToken
}

/**
 * Retorna a URL absoluta do feed .ics para o token fornecido.
 */
export function getCalendarFeedUrl(token: string): string {
  const baseUrl = (pb.baseUrl || window.location.origin).replace(/\/$/, '')
  return `${baseUrl}/calendar/${token}/agenda.ics`
}

function generateRandomToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(length)
    cryptoObj.getRandomValues(values)
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length]
    }
    return result
  }
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
