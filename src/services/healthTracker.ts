import pb from '@/lib/pocketbase/client'

/* ------------------------------------------------------------------ */
/* Integração com o app Health Tracker da clínica (outro projeto Skip)  */
/*                                                                      */
/* O segredo de confiança (INSTITUTIONAL_TRUST_SECRET) e o handshake    */
/* HMAC ficam no SERVIDOR (hook healthtracker_integracao.js). Aqui só   */
/* chamamos as rotas internas deste projeto:                            */
/*   GET  /backend/v1/healthtracker/summary?cliente=<id>                */
/*   POST /backend/v1/healthtracker/record                              */
/* ------------------------------------------------------------------ */

/** Resumo do cliente no Health Tracker — estrutura devolvida pelo outro backend. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HealthTrackerSummary = Record<string, any>

export interface HealthTrackerSummaryResponse {
  health_tracker: HealthTrackerSummary
  cliente_email: string
}

export interface HealthTrackerErro {
  error: string
}

/**
 * Busca o resumo (todas as áreas de dados) do cliente no Health Tracker.
 * Falha com { error } nas respostas de erro do hook — quem chama decide se
 * mostra aviso (o resumo é complementar, nunca bloqueia a tela).
 */
export async function buscarHealthTrackerSummary(
  clienteId: string,
): Promise<HealthTrackerSummaryResponse> {
  return pb.send<HealthTrackerSummaryResponse>('/backend/v1/healthtracker/summary', {
    method: 'GET',
    query: { cliente: clienteId },
  })
}

/**
 * Envia um registro para o Health Tracker (best effort — chamado APÓS o
 * registro local já ter sido gravado; uma falha aqui NÃO desfaz nada).
 * professionalName = nome do profissional logado, exibido no outro app como
 * "via app institucional".
 */
export async function enviarRegistroHealthTracker(payload: {
  cliente_id: string
  collection: string
  tipo?: string
  payload?: Record<string, unknown>
  professional_name: string
}): Promise<{ success: boolean }> {
  return pb.send<{ success: boolean }>('/backend/v1/healthtracker/record', {
    method: 'POST',
    body: payload,
  })
}

/** Extrai a mensagem amigável de um erro devolvido pelo hook/Health Tracker. */
export function mensagemErroHealthTracker(err: unknown): string {
  const qualquer = err as { response?: HealthTrackerErro; message?: string; data?: unknown }
  const resposta = qualquer?.response
  if (resposta && typeof resposta.error === 'string' && resposta.error) {
    return resposta.error
  }
  if (qualquer?.message) return qualquer.message
  return 'Não foi possível comunicar com o Health Tracker.'
}
