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
  options?: { addToTimeline?: boolean },
) {
  const record = await pb.collection('evolucoes').create<EvolucaoRecord>(data)

  // Opcionalmente cria evento na timeline do paciente se estiver finalizada
  if (options?.addToTimeline !== false && record.status === 'Finalizada') {
    try {
      const resumo =
        record.conduta_procedimentos ||
        record.avaliacao_clinica ||
        record.subjetivo ||
        record.texto_livre ||
        'Sessão de evolução clínica registrada.'

      await createTimelineEvent({
        paciente_id: record.paciente_id,
        tipo: 'Nota',
        especialidade: record.especialidade as Especialidade,
        titulo: `Evolução Clínica (${record.especialidade}) - ${record.profissional || 'Profissional'}`,
        conteudo: resumo,
        data_evento: record.data_evolucao || new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Não foi possível registrar evolução na timeline:', err)
    }
  }

  return record
}

export async function updateEvolucao(id: string, data: Partial<EvolucaoRecord>) {
  return await pb.collection('evolucoes').update<EvolucaoRecord>(id, data)
}

export async function deleteEvolucao(id: string) {
  return await pb.collection('evolucoes').delete(id)
}
