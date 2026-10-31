import pb from '@/lib/pocketbase/client'
import type { PresencaRecord, StatusPresenca, UserRecord } from '@/types/database'
import type { ServicoPresencaPadrao } from '@/lib/constants'

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
  horario?: string // HH:mm (horário local do atendimento no Brasil)
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

/**
 * Mapeia especialidade do atendimento para um dos 13 serviços oficiais da SOUL
 */
export function mapearEspecialidadeParaServicoPresenca(
  especialidade?: string,
  tipo: 'evolucao' | 'avaliacao' = 'evolucao',
): { area: ServicoPresencaPadrao; detalhe: string } {
  const esp = (especialidade || '').toLowerCase().trim()

  if (tipo === 'avaliacao') {
    if (esp.includes('nutri')) return { area: 'Nutricionista', detalhe: 'Nutrição' }
    if (esp.includes('medico') || esp.includes('médico'))
      return { area: 'Avaliação Inicial', detalhe: 'Médico' }
    return { area: 'Avaliação Física e Funcional', detalhe: especialidade || 'Avaliação' }
  }

  // Para evolução
  if (esp.includes('personal')) return { area: 'Personal Individual', detalhe: 'Personal' }
  if (esp.includes('nutri')) return { area: 'Nutricionista', detalhe: 'Nutrição' }
  if (esp.includes('osteopatia')) return { area: 'Sessão Osteopatia', detalhe: 'Osteopatia' }
  if (esp.includes('pilates')) return { area: 'Pilates Performance', detalhe: 'Pilates' }
  if (esp.includes('medico') || esp.includes('médico'))
    return { area: 'Avaliação Inicial', detalhe: 'Médico' }
  return { area: 'Sessão Fisioterapia', detalhe: 'Fisioterapia' }
}

export interface GarantirPresencaAutomaticaParams {
  pacienteId: string
  pacienteNome?: string
  profissionalId?: string
  profissionalNome?: string
  dataAtendimento?: string
  horario?: string
  areaServico: ServicoPresencaPadrao
  detalheServico?: string
  identificadorOrigem: string
  observacaoOrigem?: string
}

/**
 * Garante que um lançamento de presença exista para a evolução/avaliação.
 * Se o backend hook já tiver criado, não duplica.
 * Se ainda não existir, cria agora no PocketBase.
 */
export async function garantirPresencaAutomatica(
  params: GarantirPresencaAutomaticaParams,
): Promise<PresencaRecord | null> {
  try {
    const {
      pacienteId,
      pacienteNome,
      profissionalId,
      profissionalNome,
      dataAtendimento,
      horario,
      areaServico,
      detalheServico,
      identificadorOrigem,
      observacaoOrigem,
    } = params

    if (!pacienteId) return null

    // 1. Extrair data no formato YYYY-MM-DD e horário HH:mm sem conversão indevida de fuso
    let dataYmd = ''
    let horarioFinal = (horario || '').trim()

    if (dataAtendimento) {
      // Se contiver horário (ex: YYYY-MM-DD HH:mm ou T) e não tivermos horario explicito
      if (!horarioFinal) {
        if (dataAtendimento.includes('T')) {
          const partesT = dataAtendimento.split('T')
          dataYmd = partesT[0]
          const tempo = partesT[1] || ''
          if (tempo.length >= 5) {
            horarioFinal = tempo.substring(0, 5)
          }
        } else if (dataAtendimento.includes(' ')) {
          const partesEsp = dataAtendimento.split(' ')
          dataYmd = partesEsp[0]
          const tempo = partesEsp[1] || ''
          if (tempo.length >= 5 && tempo !== '12:00:00' && tempo !== '00:00:00') {
            horarioFinal = tempo.substring(0, 5)
          }
        } else {
          dataYmd = dataAtendimento.slice(0, 10)
        }
      } else {
        dataYmd = dataAtendimento.includes('T')
          ? dataAtendimento.split('T')[0]
          : dataAtendimento.includes(' ')
            ? dataAtendimento.split(' ')[0]
            : dataAtendimento.slice(0, 10)
      }
    }

    if (!dataYmd) {
      // Data atual no fuso de São Paulo
      const agora = new Date()
      dataYmd = agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    }

    if (!horarioFinal) {
      const agora = new Date()
      horarioFinal = agora.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }

    const obsTexto =
      observacaoOrigem || `Gerado automaticamente pelo documento ${identificadorOrigem}`

    // 2. Verificar se já existe por observação com identificadorOrigem
    if (identificadorOrigem) {
      try {
        const buscaOrigem = await pb.collection('presencas').getList<PresencaRecord>(1, 1, {
          filter: `paciente_id = '${pacienteId}' && observacoes ~ '${identificadorOrigem}'`,
        })
        if (buscaOrigem.items.length > 0) {
          return buscaOrigem.items[0]
        }
      } catch (_) {
        // Ignora erro de busca
      }
    }

    // 3. Verificar se já existe para o mesmo paciente no mesmo dia na mesma área
    try {
      const dtIni = `${dataYmd} 00:00:00`
      const dtFim = `${dataYmd} 23:59:59`
      const buscaDia = await pb.collection('presencas').getList<PresencaRecord>(1, 1, {
        filter: `paciente_id = '${pacienteId}' && area_servico = '${areaServico}' && data_atendimento >= '${dtIni}' && data_atendimento <= '${dtFim}'`,
      })
      if (buscaDia.items.length > 0) {
        return buscaDia.items[0]
      }
    } catch (_) {
      // Ignora erro de busca
    }

    // 4. Resolver profissional ID
    let finalProfId = profissionalId || pb.authStore.record?.id || ''
    let finalProfNome =
      profissionalNome || (pb.authStore.record as unknown as { name?: string })?.name || ''

    if (!finalProfId) {
      try {
        const adm = await pb
          .collection('users')
          .getFirstListItem<UserRecord>("email = 'gcdealmeida@gmail.com'")
        if (adm) {
          finalProfId = adm.id
          if (!finalProfNome) finalProfNome = adm.name || 'Dr. Guilherme (Admin)'
        }
      } catch (_) {
        // Fallback
      }
    }

    if (!finalProfId) {
      console.warn('garantirPresencaAutomatica: sem profissional_id para criar presença')
      return null
    }

    // 5. Criar registro de presença
    const payload: PresencaPayload = {
      paciente_id: pacienteId,
      profissional_id: finalProfId,
      data_atendimento: `${dataYmd} 12:00:00`,
      horario: horarioFinal || undefined,
      area_servico: areaServico,
      detalhe_servico: detalheServico || undefined,
      observacoes: obsTexto,
      status: 'Presente',
      paciente_nome: pacienteNome || undefined,
      profissional_nome: finalProfNome || undefined,
    }

    return await createPresenca(payload)
  } catch (err) {
    console.error('garantirPresencaAutomatica: falha ao registrar presença', err)
    return null
  }
}
