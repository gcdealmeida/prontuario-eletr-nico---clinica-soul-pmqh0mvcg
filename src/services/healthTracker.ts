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

/** Erro com `not_found=true` = cliente sem cadastro no Health Tracker (404 do outro projeto). */
export interface HealthTrackerErro {
  error: string
  not_found?: boolean
}

/**
 * Busca o resumo (todas as áreas de dados) do cliente no Health Tracker.
 * Falha com { error } nas respostas de erro do hook — quem chama decide se
 * mostra aviso (o resumo é complementar, nunca bloqueia a tela).
 */
export async function buscarHealthTrackerSummary(
  clienteId: string,
): Promise<HealthTrackerSummaryResponse> {
  try {
    return await pb.send<HealthTrackerSummaryResponse>('/backend/v1/healthtracker/summary', {
      method: 'GET',
      query: { cliente: clienteId },
    })
  } catch (err) {
    if (eh404HealthTracker(err)) {
      // Cliente sem conta no outro projeto — estado vazio, não erro genérico.
      throw { error: 'Cliente sem cadastro no Health Tracker.', not_found: true }
    }
    throw err
  }
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
  return pb
    .send<{ success: boolean }>('/backend/v1/healthtracker/record', {
      method: 'POST',
      body: payload,
    })
    .catch((err) => {
      if (eh404HealthTracker(err)) {
        throw { error: 'Cliente sem cadastro no Health Tracker.', not_found: true }
      }
      throw err
    })
}

/** True quando o erro representa 404 — cliente sem cadastro no Health Tracker. */
export function eh404HealthTracker(err: unknown): boolean {
  const qualquer = err as { status?: number; response?: { status?: number }; data?: unknown }
  // pb.send (SDK JS) lança ClientResponseError com .status; erros do pb_hooks
  // chegam como { response: { status, data } } ou { data: { error, not_found } }.
  const status = qualquer?.status ?? qualquer?.response?.status ?? 0
  if (status === 404) return true
  const dados = (qualquer?.data || (qualquer?.response as { data?: unknown })?.data) as
    | HealthTrackerErro
    | undefined
  return Boolean(dados && typeof dados === 'object' && (dados as HealthTrackerErro).not_found)
}

/** Extrai a mensagem amigável de um erro devolvido pelo hook/Health Tracker. */
export function mensagemErroHealthTracker(err: unknown): string {
  const qualquer = err as { response?: HealthTrackerErro; message?: string; data?: unknown }
  const resposta = qualquer?.response
  if (resposta && typeof resposta.error === 'string' && resposta.error) {
    return resposta.error
  }
  const dados = qualquer?.data as HealthTrackerErro | undefined
  if (dados && typeof dados.error === 'string' && dados.error) {
    return dados.error
  }
  if (qualquer?.message) return qualquer.message
  return 'Não foi possível comunicar com o Health Tracker.'
}
