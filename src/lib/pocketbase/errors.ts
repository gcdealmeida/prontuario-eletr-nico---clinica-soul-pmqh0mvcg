import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

// Mapeamento amigável de nomes de campos para mensagens em português
const FIELD_LABELS: Record<string, string> = {
  queixa_principal: 'Queixa Principal',
  paciente_id: 'Paciente',
  especialidade: 'Especialidade',
  status: 'Status',
  historia_doenca_atual: 'História da Doença Atual (HDA)',
  historico_medico: 'Histórico Médico',
  medicamentos: 'Medicamentos',
  cirurgias: 'Cirurgias',
  postura: 'Postura',
  palpacao: 'Palpação',
  testes_especiais: 'Testes Especiais',
  diagnostico_fisioterapeutico: 'Diagnóstico Fisioterapêutico',
  diagnostico_disfuncional: 'Diagnóstico Disfuncional',
  objetivos_tratamento: 'Objetivos do Tratamento',
  plano_tratamento: 'Plano de Tratamento',
  data_avaliacao: 'Data da Avaliação',
  profissional_responsavel: 'Profissional Responsável',
  adm_ombro: 'ADM Ombro',
  adm_joelho: 'ADM Joelho',
  adm_quadril: 'ADM Quadril',
  adm_coluna: 'ADM Coluna',
  forca_mmss: 'Força MMSS',
  forca_mmii: 'Força MMII',
  forca_core: 'Força Core',
  anamnese_detalhada: 'Anamnese Detalhada',
  queixas_multiplas: 'Queixas Múltiplas',
  visceras_sistemicas: 'Vísceras / Sistêmicas',
  habitos_saude: 'Hábitos de Saúde',
  adm_segmentos: 'ADM por Segmento',
  forca_muscular_grupos: 'Grupos Musculares',
  testes_especiais_segmentos: 'Testes Especiais por Segmento',
  plano_semanal_detalhado: 'Plano Semanal',
  resumos_anexos: 'Resumos dos Anexos',
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
    } else if (typeof detail === 'string') {
      errors[field] = detail
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
    const formatted = entries.map(([field, msg]) => {
      const label = FIELD_LABELS[field] || field
      // Se for validação de required
      if (msg.toLowerCase().includes('cannot be blank') || msg.toLowerCase().includes('required')) {
        return `Verifique "${label}": campo obrigatório.`
      }
      return `${label}: ${msg}`
    })
    return `Não foi possível salvar: ${formatted.join('; ')}`
  }

  // Falha 400 geral do PocketBase sem detalhe específico em data
  if (error.status === 400) {
    if (
      error.message?.includes('Failed to create') ||
      error.message?.includes('Failed to update')
    ) {
      return 'Não foi possível salvar os dados da avaliação. Verifique se os campos obrigatórios (como Queixa Principal) estão preenchidos corretamente.'
    }
    return error.message || 'Dados inválidos ao salvar avaliação.'
  }

  return error.message || 'Ocorreu um erro ao comunicar com o servidor.'
}
