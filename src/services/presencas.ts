import pb from '@/lib/pocketbase/client'
import type { PresencaRecord, StatusPresenca } from '@/types/database'

export interface PresencasFilter {
  dataInicio?: string // YYYY-MM-DD
  dataFim?: string // YYYY-MM-DD
  pacienteId?: string
  profissionalId?: string
  areaServico?: string
  search?: string
  status?: StatusPresenca | 'Todos'
}

export interface PresencaPayload {
  paciente_id: string
  profissional_id: string
  data_atendimento: string // YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss
  area_servico: string
  detalhe_servico?: string
  observacoes?: string
  status?: StatusPresenca
  paciente_nome?: string
  profissional_nome?: string
}

/**
 * Monta o filtro PocketBase a partir dos parâmetros combináveis
 */
export function buildPresencasFilter(filters: PresencasFilter): string {
  const clauses: string[] = []

  if (filters.dataInicio) {
    // PocketBase armazena datas no formato UTC ou YYYY-MM-DD 00:00:00.000Z
    clauses.push(`data_atendimento >= "${filters.dataInicio} 00:00:00"`)
  }

  if (filters.dataFim) {
    clauses.push(`data_atendimento <= "${filters.dataFim} 23:59:59"`)
  }

  if (filters.pacienteId && filters.pacienteId !== 'Todos') {
    clauses.push(`paciente_id = "${filters.pacienteId}"`)
  }

  if (filters.profissionalId && filters.profissionalId !== 'Todos') {
    clauses.push(`profissional_id = "${filters.profissionalId}"`)
  }

  if (filters.areaServico && filters.areaServico !== 'Todos') {
    clauses.push(`area_servico ~ "${filters.areaServico}"`)
  }

  if (filters.status && filters.status !== 'Todos') {
    clauses.push(`status = "${filters.status}"`)
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().replace(/"/g, '\\"')
    clauses.push(
      `(paciente_nome ~ "${q}" || profissional_nome ~ "${q}" || area_servico ~ "${q}" || detalhe_servico ~ "${q}" || observacoes ~ "${q}")`,
    )
  }

  return clauses.join(' && ')
}

/**
 * Busca lista de presenças paginada com filtros
 */
export async function getPresencas(
  filters: PresencasFilter = {},
  page = 1,
  perPage = 50,
  sort = '-data_atendimento,-created',
): Promise<{ items: PresencaRecord[]; totalItems: number; totalPages: number }> {
  try {
    const filter = buildPresencasFilter(filters)
    const res = await pb.collection('presencas').getList<PresencaRecord>(page, perPage, {
      filter: filter || undefined,
      sort,
      expand: 'paciente_id,profissional_id',
    })
    return {
      items: res.items,
      totalItems: res.totalItems,
      totalPages: res.totalPages,
    }
  } catch (err) {
    console.error('Erro ao buscar presenças:', err)
    return { items: [], totalItems: 0, totalPages: 1 }
  }
}

/**
 * Busca todas as presenças que satisfaçam os filtros (sem paginação, para contagem, agrupamentos, impressão e exportação XLSX)
 */
export async function getAllPresencas(
  filters: PresencasFilter = {},
  sort = '-data_atendimento,-created',
): Promise<PresencaRecord[]> {
  try {
    const filter = buildPresencasFilter(filters)
    const records = await pb.collection('presencas').getFullList<PresencaRecord>({
      filter: filter || undefined,
      sort,
      expand: 'paciente_id,profissional_id',
    })
    return records
  } catch (err) {
    console.error('Erro ao buscar todas as presenças:', err)
    return []
  }
}

/**
 * Busca um lançamento de presença por ID
 */
export async function getPresencaById(id: string): Promise<PresencaRecord> {
  return await pb.collection('presencas').getOne<PresencaRecord>(id, {
    expand: 'paciente_id,profissional_id',
  })
}

/**
 * Cria um novo lançamento de presença
 */
export async function createPresenca(payload: PresencaPayload): Promise<PresencaRecord> {
  return await pb.collection('presencas').create<PresencaRecord>(payload, {
    expand: 'paciente_id,profissional_id',
  })
}

/**
 * Atualiza um lançamento de presença existente
 */
export async function updatePresenca(
  id: string,
  payload: Partial<PresencaPayload>,
): Promise<PresencaRecord> {
  return await pb.collection('presencas').update<PresencaRecord>(id, payload, {
    expand: 'paciente_id,profissional_id',
  })
}

/**
 * Exclui um lançamento de presença existente
 */
export async function deletePresenca(id: string): Promise<boolean> {
  return await pb.collection('presencas').delete(id)
}
