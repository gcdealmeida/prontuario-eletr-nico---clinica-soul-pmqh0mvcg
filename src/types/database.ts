export type Especialidade = 'Fisioterapia' | 'Personal' | 'Nutrição' | 'Médico'

export type StatusPaciente = 'Ativo' | 'Inativo'

export type StatusConsulta = 'Agendada' | 'Confirmada' | 'Concluída' | 'Cancelada'

export type TipoTimeline = 'Consulta' | 'Avaliação' | 'Nota'

export type StatusAvaliacao = 'Rascunho' | 'Concluída'

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
  created: string
  updated: string
}

export interface PacienteRecord {
  id: string
  nome: string
  cpf?: string
  data_nascimento?: string
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
  status: StatusPaciente
  created: string
  updated: string
}

export interface ConsultaRecord {
  id: string
  paciente_id: string
  especialidade: Especialidade
  data_hora: string
  duracao_min?: number
  status: StatusConsulta
  notas?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export interface TimelineRecord {
  id: string
  paciente_id: string
  tipo: TipoTimeline
  especialidade?: Especialidade
  titulo: string
  conteudo?: string
  data_evento: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export interface AvaliacaoFisioterapiaRecord {
  id: string
  paciente_id: string
  especialidade: 'Fisioterapia'
  status: StatusAvaliacao
  queixa_principal: string
  historia_doenca_atual?: string
  historico_medico?: string
  medicamentos?: string
  cirurgias?: string
  postura?: string
  adm_ombro?: number
  adm_joelho?: number
  adm_quadril?: number
  adm_coluna?: number
  forca_mmss?: number
  forca_mmii?: number
  forca_core?: number
  palpacao?: string
  testes_especiais?: string
  diagnostico_fisioterapeutico?: string
  objetivos_tratamento?: string
  plano_tratamento?: string
  evolucao_nota?: string
  profissional_responsavel?: string
  data_avaliacao?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export interface AvaliacaoPersonalRecord {
  id: string
  paciente_id: string
  especialidade: 'Personal'
  status: StatusAvaliacao
  objetivo_principal?:
    | 'Hipertrofia'
    | 'Emagrecimento'
    | 'Condicionamento'
    | 'Reabilitação'
    | 'Performance'
  nivel_experiencia?: 'Iniciante' | 'Intermediário' | 'Avançado'
  frequencia_semanal?: number
  restricoes_treino?: string
  peso?: number
  altura?: number
  imc?: number
  percentual_gordura?: number
  circ_cintura?: number
  circ_abdomen?: number
  circ_quadril?: number
  flexibilidade_sit_reach?: number
  teste_1rm?: string
  vo2max?: number
  resistencia_muscular?: string
  plano_treino?: string
  observacoes?: string
  profissional_responsavel?: string
  data_avaliacao?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export interface AvaliacaoNutricaoRecord {
  id: string
  paciente_id: string
  especialidade: 'Nutrição'
  status: StatusAvaliacao
  peso?: number
  altura?: number
  imc?: number
  historico_peso?: string
  patologias?: string
  medicamentos?: string
  cirurgias?: string
  historico_familiar?: string
  rec_cafe_manha?: string
  rec_almoco?: string
  rec_jantar?: string
  rec_lanches?: string
  consumo_agua_l?: number
  consumo_alcool?: 'Nunca' | 'Raramente' | 'Às vezes' | 'Frequentemente'
  atividade_fisica?: string
  sono_horas?: number
  estresse_nivel?: number
  tabagismo?: 'Sim' | 'Não'
  objetivos?: string
  plano_alimentar?: string
  metas?: string
  profissional_responsavel?: string
  data_avaliacao?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export interface AvaliacaoMedicoRecord {
  id: string
  paciente_id: string
  especialidade: 'Médico'
  status: StatusAvaliacao
  queixa_principal: string
  hda?: string
  historico_medico?: string
  medicamentos?: string
  alergias?: string
  antecedentes_familiares?: string
  pressao_arterial?: string
  fc?: number
  fr?: number
  temperatura?: number
  peso?: number
  altura?: number
  ausculta?: string
  abdome?: string
  aparelho_osteomuscular?: string
  hipotese_diagnostica?: string
  exames_complementares?: string
  conduta_terapeutica?: string
  prescricao?: string
  evolucao_nota?: string
  profissional_responsavel?: string
  data_avaliacao?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}
