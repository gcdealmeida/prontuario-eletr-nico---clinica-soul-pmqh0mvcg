import pb from '@/lib/pocketbase/client'
import type { EvolucaoRecord, Especialidade } from '@/types/database'
import { createTimelineEvent } from './avaliacoes'

export async function getEvolucoesByPaciente(pacienteId: string) {
  return await pb.collection('evolucoes').getFullList<EvolucaoRecord>({
    filter: `paciente_id = "${pacienteId}"`,
    sort: '-data_evolucao,-created',
    expand: 'paciente_id',
  })
}

export async function getEvolucoesByAvaliacao(avaliacaoId: string) {
  return await pb.collection('evolucoes').getFullList<EvolucaoRecord>({
    filter: `avaliacao_id = "${avaliacaoId}"`,
    sort: '-data_evolucao,-created',
    expand: 'paciente_id',
  })
}

export async function getEvolucaoById(id: string) {
  return await pb.collection('evolucoes').getOne<EvolucaoRecord>(id, {
    expand: 'paciente_id',
  })
}

export async function createEvolucao(
  data: Partial<EvolucaoRecord>,
  options?: { addToTimeline?: boolean; assinarImediatamente?: boolean },
) {
  const isFinalizada = data.status === 'Finalizada' || options?.assinarImediatamente === true

  const payload: Partial<EvolucaoRecord> = {
    ...data,
    status: isFinalizada ? 'Finalizada' : 'Rascunho',
    documento_fechado: isFinalizada,
  }

  // Preenche dados de assinatura no payload inicial (o backend também assegura no hook com carimbo oficial)
  if (isFinalizada) {
    if (!payload.assinado_por_nome) {
      payload.assinado_por_nome =
        data.profissional || pb.authStore.record?.name || 'Profissional SOUL'
    }
    if (!payload.assinado_por_especialidade) {
      payload.assinado_por_especialidade = data.especialidade || 'Fisioterapia'
    }
    if (pb.authStore.record?.id && !payload.assinado_por_user_id) {
      payload.assinado_por_user_id = pb.authStore.record.id
    }
  }

  const record = await pb.collection('evolucoes').create<EvolucaoRecord>(payload)

  // Opcionalmente cria evento na timeline do paciente se estiver finalizada
  if (
    options?.addToTimeline !== false &&
    (record.status === 'Finalizada' || record.documento_fechado)
  ) {
    try {
      const resumo =
        record.conduta_procedimentos ||
        record.avaliacao_clinica ||
        record.subjetivo ||
        record.texto_livre ||
        'Sessão de evolução clínica registrada e assinada digitalmente.'

      const prefixo = record.tipo_evolucao === 'Corretiva' ? '[Evolução Corretiva] ' : ''
      const reg = record.numero_registro ? ` (${record.numero_registro})` : ''

      await createTimelineEvent({
        paciente_id: record.paciente_id,
        tipo: 'Nota',
        especialidade: record.especialidade as Especialidade,
        titulo: `${prefixo}Evolução Clínica ${record.especialidade}${reg} - ${record.assinado_por_nome || record.profissional || 'Profissional'}`,
        conteudo: resumo,
        data_evento: record.assinado_em || record.data_evolucao || new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Não foi possível registrar evolução na timeline:', err)
    }
  }

  return record
}

export async function updateEvolucao(id: string, data: Partial<EvolucaoRecord>) {
  // Se estiver finalizando/assinando um rascunho anterior
  const isFinalizando = data.status === 'Finalizada' || data.documento_fechado === true
  const payload: Partial<EvolucaoRecord> = { ...data }

  if (isFinalizando) {
    payload.status = 'Finalizada'
    payload.documento_fechado = true
    if (!payload.assinado_por_nome) {
      payload.assinado_por_nome =
        data.profissional || pb.authStore.record?.name || 'Profissional SOUL'
    }
    if (!payload.assinado_por_especialidade) {
      payload.assinado_por_especialidade = data.especialidade || 'Fisioterapia'
    }
    if (pb.authStore.record?.id && !payload.assinado_por_user_id) {
      payload.assinado_por_user_id = pb.authStore.record.id
    }
  }

  const updatedRecord = await pb.collection('evolucoes').update<EvolucaoRecord>(id, payload)

  // Timeline se foi assinado agora
  if (isFinalizando) {
    try {
      const resumo =
        updatedRecord.conduta_procedimentos ||
        updatedRecord.avaliacao_clinica ||
        updatedRecord.subjetivo ||
        updatedRecord.texto_livre ||
        'Sessão de evolução clínica assinada e fechada.'

      const prefixo = updatedRecord.tipo_evolucao === 'Corretiva' ? '[Evolução Corretiva] ' : ''
      const reg = updatedRecord.numero_registro ? ` (${updatedRecord.numero_registro})` : ''

      await createTimelineEvent({
        paciente_id: updatedRecord.paciente_id,
        tipo: 'Nota',
        especialidade: updatedRecord.especialidade as Especialidade,
        titulo: `${prefixo}Evolução Clínica ${updatedRecord.especialidade}${reg} - ${updatedRecord.assinado_por_nome || updatedRecord.profissional}`,
        conteudo: resumo,
        data_evento:
          updatedRecord.assinado_em || updatedRecord.data_evolucao || new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Não foi possível registrar timeline após assinar evolução:', err)
    }
  }

  return updatedRecord
}

export async function deleteEvolucao(id: string) {
  return await pb.collection('evolucoes').delete(id)
}
