import pb from '@/lib/pocketbase/client'
import type { Especialidade, RelatorioIaRecord } from '@/types/database'

export interface GerarRelatorioIaPayload {
  paciente_id: string
  avaliacao_id: string
  especialidade: Especialidade | 'Geral'
  tipo_relatorio?: 'Relatório Clínico' | 'Resumo de Evolução' | 'Laudo' | 'Parecer'
  necessidade: string
  titulo?: string
  publico_alvo?: string
  dados_prontuario: Record<string, unknown>
  historico_evolucoes?: Array<Record<string, unknown>>
  historico_avaliacoes?: Array<Record<string, unknown>>
}

export interface GerarRelatorioIaResponse {
  id: string
  paciente_id: string
  avaliacao_id: string
  especialidade: Especialidade | 'Geral'
  tipo_relatorio?: 'Relatório Clínico' | 'Resumo de Evolução' | 'Laudo' | 'Parecer'
  titulo: string
  necessidade: string
  conteudo: string
  autor_id: string
  autor_nome: string
  created: string
  falha_historico?: boolean
  aviso?: string
}

/**
 * Chama o backend para gerar um relatório clínico otimizado com o agente nativo Skip Cloud
 * e persistir na collection relatorios_ia.
 */
export async function gerarRelatorioIa(
  payload: GerarRelatorioIaPayload,
): Promise<GerarRelatorioIaResponse> {
  const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/relatorios/gerar-ia`
  const token = pb.authStore.token

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Falha ao processar relatório com IA')
  }

  return data as GerarRelatorioIaResponse
}

/**
 * Busca o histórico de relatórios emitidos para uma determinada avaliação
 */
export async function getRelatoriosByAvaliacao(avaliacaoId: string): Promise<RelatorioIaRecord[]> {
  try {
    const records = await pb.collection('relatorios_ia').getFullList<RelatorioIaRecord>({
      filter: `avaliacao_id = '${avaliacaoId}'`,
      sort: '-created',
      expand: 'autor_id,paciente_id',
    })
    return records
  } catch (err) {
    console.error('Erro ao buscar histórico de relatórios:', err)
    return []
  }
}

/**
 * Busca o histórico de relatórios emitidos para um paciente (incluindo todas as avaliações e resumos)
 */
export async function getRelatoriosByPaciente(pacienteId: string): Promise<RelatorioIaRecord[]> {
  try {
    const records = await pb.collection('relatorios_ia').getFullList<RelatorioIaRecord>({
      filter: `paciente_id = '${pacienteId}'`,
      sort: '-created',
      expand: 'autor_id,paciente_id',
    })
    return records
  } catch (err) {
    console.error('Erro ao buscar histórico de relatórios do paciente:', err)
    return []
  }
}

/**
 * Atualiza o conteúdo de um relatório emitido (ex: ajustes manuais feitos pelo profissional)
 */
export async function updateRelatorioIa(
  id: string,
  dados: { titulo?: string; conteudo?: string },
): Promise<RelatorioIaRecord> {
  return await pb.collection('relatorios_ia').update<RelatorioIaRecord>(id, dados)
}

/**
 * Exclui um relatório do histórico
 */
export async function deleteRelatorioIa(id: string): Promise<boolean> {
  return await pb.collection('relatorios_ia').delete(id)
}
