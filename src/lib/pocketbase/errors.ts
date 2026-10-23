import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export const FIELD_LABELS_PTBR: Record<string, string> = {
  queixa_principal: 'Queixa Principal',
  paciente_id: 'Paciente',
  anexos_exames: 'Anexos de Exames',
  anexos_dinamometro: 'Anexos de Dinamômetro',
  anexos_postura: 'Anexos de Postura',
  data_avaliacao: 'Data da Avaliação',
  diagnostico_fisioterapeutico: 'Diagnóstico Fisioterapêutico',
  especialidade: 'Especialidade',
  status: 'Status',
  profissional_responsavel: 'Profissional Responsável',
  objetivo_principal: 'Objetivo Principal',
  peso: 'Peso',
  altura: 'Altura',
  adm_ombro: 'ADM Ombro',
  adm_joelho: 'ADM Joelho',
  adm_quadril: 'ADM Quadril',
  adm_coluna: 'ADM Coluna',
  forca_mmss: 'Força MMSS',
  forca_mmii: 'Força MMII',
  forca_core: 'Força Core',
}

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }
  const fieldErrors = extractFieldErrors(error)
  const entries = Object.entries(fieldErrors)
  if (entries.length > 0) {
    return entries
      .map(([field, msg]) => {
        const label = FIELD_LABELS_PTBR[field] || field
        let msgPt = msg
        if (msg === 'Cannot be blank.' || msg === 'validation_required') {
          msgPt = 'é obrigatório(a).'
        } else if (msg === 'validation_invalid_file') {
          msgPt = 'contém arquivo em formato inválido para upload.'
        }
        return `${label}: ${msgPt}`
      })
      .join(' | ')
  }
  return error.message || 'Ocorreu um erro inesperado ao salvar no servidor.'
}
