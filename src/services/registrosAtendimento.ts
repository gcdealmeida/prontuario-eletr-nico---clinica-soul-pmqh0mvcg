import pb from '@/lib/pocketbase/client'
import type { Especialidade } from '@/types/database'
import { SERVICOS_PRESENCA_PADRAO, type ServicoPresencaPadrao } from '@/lib/constants'
import { garantirPresencaAutomatica } from '@/services/presencas'
import { createTimelineEvent } from '@/services/avaliacoes'

/**
 * Coleção `registros_atendimento` (migration 0055): imutável (update/delete rules = null).
 * Cada atendimento salvo entra automaticamente em:
 *  - Prontuário do paciente (timeline, tipo 'Nota')
 *  - Lista de presença / controle mensal (coleção `presencas`)
 */

export type StatusRegistroAtendimento = 'Finalizada' | 'Ausência' | 'Desmarcada'
export type ModeloRegistroAtendimento = 'Completo' | 'Rápido'

export interface EvaDorItem {
  queixa: string
  valor: number
  descricao: string
}

export interface RegistroAtendimentoPayload {
  paciente_id: string
  paciente_nome: string
  data_atendimento: string // YYYY-MM-DD
  horario: string // HH:mm
  area_servico: string
  status: StatusRegistroAtendimento
  motivo_desmarque?: string
  modelo: ModeloRegistroAtendimento
  evaluacoes_dor?: EvaDorItem[]
  avaliacao_report?: string
  conduta_realizada?: string
  evolucao_descricao?: string
}

export interface RegistroAtendimentoRecord {
  id: string
  paciente_id: string
  profissional_id: string
  paciente_nome: string
  profissional_nome: string
  profissional_especialidade: string
  data_atendimento: string
  horario: string
  area_servico: string
  status: StatusRegistroAtendimento
  motivo_desmarque?: string
  modelo: RegistroAtendimentoPayload['modelo']
  evaluacoes_dor?: EvaDorItem[] | string
  avaliacao_report?: string
  conduta_realizada?: string
  evolucao_descricao?: string
  created: string
  updated: string
}

export function parseEvasDor(valor: RegistroAtendimentoRecord['evaluacoes_dor']): EvaDorItem[] {
  if (!valor) return []
  if (Array.isArray(valor)) return valor as EvaDorItem[]
  try {
    const arr = JSON.parse(valor as string)
    return Array.isArray(arr) ? (arr as EvaDorItem[]) : []
  } catch {
    return []
  }
}

function montarConteudoRegistro(r: RegistroAtendimentoPayload, profissionalNome: string): string {
  const partes: string[] = []
  partes.push(`Status: ${r.status}`)
  if (r.status === 'Desmarcada' && r.motivo_desmarque) {
    partes.push(`Motivo do desmarque: ${r.motivo_desmarque}`)
  }
  partes.push(`Modelo: ${r.modelo}`)
  if (r.modelo === 'Completo') {
    const evas = (r.evaluacoes_dor || []).filter((e) => e.valor != null || e.queixa)
    if (evas.length > 0) {
      partes.push(
        `EVA(s) de Dor: ${evas
          .map(
            (e) =>
              `${e.queixa || 'Queixa'}: ${e.valor}/10${e.descricao ? ` — ${e.descricao}` : ''}`,
          )
          .join(' | ')}`,
      )
    }
    if (r.avaliacao_report) partes.push(`Avaliação/Report: ${r.avaliacao_report}`)
    if (r.conduta_realizada) partes.push(`Conduta Realizada: ${r.conduta_realizada}`)
  } else if (r.evolucao_descricao) {
    partes.push(`Evolução e Descrição Geral: ${r.evolucao_descricao}`)
  }
  partes.push(`Registrado por: ${profissionalNome}`)
  partes.push('Registro imutável — não pode ser editado nem excluído.')
  return partes.join('\n')
}

function tituloRegistro(r: RegistroAtendimentoPayload): string {
  const sufixo =
    r.status === 'Finalizada'
      ? `Atendimento ${r.area_servico}`
      : r.status === 'Ausência'
        ? 'Ausência registrada'
        : 'Atendimento desmarcado'
  return `${sufixo} — Modelo ${r.modelo} (${r.data_atendimento.split('-').reverse().join('/')})`
}

function mapearStatusPresenca(
  status: StatusRegistroAtendimento,
): 'Presente' | 'Justificado' | 'Cancelado' {
  if (status === 'Finalizada') return 'Presente'
  if (status === 'Ausência') return 'Justificado'
  return 'Cancelado'
}

export interface SalvarRegistroResultado {
  registro: RegistroAtendimentoRecord
  presencaId?: string
  timelineId?: string
}

export async function getRegistrosAtendimentoByPaciente(pacienteId: string) {
  return await pb.collection('registros_atendimento').getFullList<RegistroAtendimentoRecord>({
    filter: `paciente_id = "${pacienteId}"`,
    sort: '-created',
  })
}

/**
 * Salva o registro imutável de atendimento e propaga automaticamente:
 * presença (lista/controle do mês) + timeline do prontuário.
 */
export async function salvarRegistroAtendimento(
  payload: RegistroAtendimentoPayload,
  options?: { addToTimeline?: boolean },
): Promise<SalvarRegistroResultado> {
  const auth = pb.authStore.record
  const profissionalId = auth?.id
  if (!profissionalId) {
    throw new Error('Sessão expirada — faça login novamente para registrar o atendimento.')
  }
  const profissionalNome =
    (auth as { name?: string })?.name || (auth as { email?: string })?.email || ''
  const profissionalEspecialidade =
    (auth as { especialidade?: string })?.especialidade || 'Fisioterapia'

  // 1) Registro imutável na coleção registros_atendimento
  const registro = await pb.collection('registros_atendimento').create<RegistroAtendimentoRecord>({
    paciente_id: payload.paciente_id,
    profissional_id: profissionalId,
    paciente_nome: payload.paciente_nome,
    profissional_nome: profissionalNome,
    profissional_especialidade: profissionalEspecialidade,
    data_atendimento: payload.data_atendimento,
    horario: payload.horario,
    area_servico: payload.area_servico,
    status: payload.status,
    motivo_desmarque: payload.motivo_desmarque || '',
    modelo: payload.modelo,
    evaluacoes_dor: JSON.stringify(payload.evaluacoes_dor || []),
    avaliacao_report: payload.avaliacao_report || '',
    conduta_realizada: payload.conduta_realizada || '',
    evolucao_descricao: payload.evolucao_descricao || '',
  })

  const resultado: SalvarRegistroResultado = { registro }

  // 2) Presença automática: alimenta a lista de presença e o controle do mês da clínica
  try {
    const areaServico = (SERVICOS_PRESENCA_PADRAO as readonly string[]).includes(
      payload.area_servico,
    )
      ? (payload.area_servico as ServicoPresencaPadrao)
      : 'Sessão Fisioterapia'
    const presenca = await garantirPresencaAutomatica({
      pacienteId: payload.paciente_id,
      pacienteNome: payload.paciente_nome,
      profissionalId,
      profissionalNome,
      dataAtendimento: payload.data_atendimento,
      horario: payload.horario,
      areaServico,
      identificadorOrigem: registro.id,
      observacaoOrigem: `Registro de Atendimento ${registro.id} — status ${payload.status}${
        payload.motivo_desmarque ? ` (${payload.motivo_desmarque})` : ''
      }`,
    })
    if (presenca) {
      resultado.presencaId = presenca.id
      // garantirPresencaAutomatica cria como 'Presente' — ajusta ao status correto
      if (mapearStatusPresenca(payload.status) !== 'Presente') {
        await pb.collection('presencas').update(presenca.id, {
          status: mapearStatusPresenca(payload.status),
          observacoes: `Registro de Atendimento ${registro.id} — status ${payload.status}${
            payload.motivo_desmarque ? ` (${payload.motivo_desmarque})` : ''
          }`,
        })
      }
    }
  } catch (err) {
    console.warn('Registro salvo, mas a presença automática não foi criada:', err)
  }

  // 3) Prontuário: evento na timeline do paciente com todas as informações
  if (options?.addToTimeline !== false) {
    try {
      const evento = await createTimelineEvent({
        paciente_id: payload.paciente_id,
        tipo: 'Nota',
        especialidade: (payload.area_servico || 'Fisioterapia') as Especialidade,
        titulo: tituloRegistro(payload),
        conteudo: montarConteudoRegistro(payload, profissionalNome),
        data_evento: `${payload.data_atendimento} ${payload.horario}:00.000Z`,
      })
      resultado.timelineId = evento?.id
    } catch (err) {
      console.warn('Registro salvo, mas não entrou na timeline do prontuário:', err)
    }
  }

  return resultado
}
