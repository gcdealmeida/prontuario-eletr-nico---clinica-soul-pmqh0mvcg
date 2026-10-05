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

export interface AnamneseDetalhadaFisio {
  data_avaliacao?: string
  peso?: number
  altura?: number
  imc?: number
  profissao?: string
  diagnostico_medico?: string
  objetivos?: string
  // 1. Motivo da procura e momento da decisão
  motivo_principal?: string
  tempo_evolucao?: string
  momento_decisao_agora?: string
  mudanca_recente_prioridade?: string
  // 2. Impacto real do problema
  impacto_dia_a_dia?: string
  impacto_trabalho_familia?: string
  impacto_esporte_lazer?: string
  o_que_evita_fazer?: string
  // 3. Tentativas anteriores e lacunas
  tentativas_anteriores?: string
  resultado_tentativas?: string
  por_que_nao_resolveu?: string
  // 4. Resultado desejado e visão de futuro
  preocupacao_3_6_meses?: string
  vida_resolvida_3_6_meses?: string
  desejo_voltar_fazer?: string
  resultado_valeu_a_pena?: string
  // 5. Síntese
  frase_chave_paciente?: string
  // Histórico
  acidentes_traumas?: string
  atividade_fisica?: string
  cirurgias?: string
  medicamentos?: string
  tratamentos_anteriores_tipo?: string
}

export interface QueixaItem {
  titulo: 'Principal' | 'Secundária' | 'Terciária'
  queixa: string
  desde_quando: string
  tipo: string
  eva: number
  historico: string
  pior_momento_dia: string
  movimento_piora: string
  o_que_alivia: string
}

export interface ViscerasSistemicas {
  esofago?: string
  estomago?: string
  intestino?: string
  coracao?: string
  pulmao?: string
  rim?: string
  bexiga?: string
  prostata_utero_ovario?: string
  figado?: string
  vesicula?: string
  pancreas?: string
  tireoide?: string
  olhos?: string
  dente?: string
  ites?: string
  endocrina?: string
  alergias?: string
}

export interface HabitosSaude {
  sono_horas?: number | string
  sono_qualidade?: string
  sono_como_acorda?: string
  sono_ao_longo_dia?: string
  refeicoes_cafe?: string
  refeicoes_lanche_manha?: string
  refeicoes_almoco?: string
  refeicoes_lanche_tarde?: string
  refeicoes_jantar?: string
  agua?: string
  acucar?: string
  bebida_alcoolica?: string
  atividade_fisica?: string
  trabalho?: string
  stress_trabalho?: string
  stress_familia?: string
  stress_pessoal?: string
}

export interface AdmItem {
  movimento: string
  direito?: number | string
  esquerdo?: number | string
}

export interface AdmSegmento {
  segmento: string
  ativo: boolean
  movimentos: AdmItem[]
}

export interface ForcaGrupoItem {
  grupo: string
  grau_direito?: string
  grau_esquerdo?: string
  dinamometro_direito_kgf?: string | number
  dinamometro_esquerdo_kgf?: string | number
  descricao_livre?: string
}

export interface ForcaCoreLinha {
  teste: string
  realizado_direito?: number | string
  realizado_esquerdo?: number | string
  padrao_18_40?: number
  padrao_41_65?: number
}

export interface ForcaCoreTabela {
  sexo: 'M' | 'F'
  faixa_etaria: '18-40' | '41-65'
  prancha_ventral?: number | string
  prancha_lateral_d?: number | string
  prancha_lateral_e?: number | string
  ponte_uni_d?: number | string
  ponte_uni_e?: number | string
  observacoes?: string
}

export interface TesteEspecialItem {
  nome: string
  estrutura?: string
  status_direito?: 'POSITIVO' | 'NEGATIVO' | 'NÃO REALIZADO'
  status_esquerdo?: 'POSITIVO' | 'NEGATIVO' | 'NÃO REALIZADO'
  observacao?: string
}

export interface TestesEspeciaisSegmento {
  segmento: string
  ativo: boolean
  testes: TesteEspecialItem[]
}

export interface SecoesComplementaresFisio {
  // Berg
  berg_ativo?: boolean
  berg_itens?: { [key: number]: number }
  berg_observacoes?: { [key: number]: string }
  berg_total?: number
  // TUG
  tug_ativo?: boolean
  tug_familiarizacao?: {
    tempo?: string
    bracos?: boolean
    giro?: boolean
    passos?: boolean
    desvio?: boolean
    freezing?: boolean
    apoio?: boolean
    obs?: string
  }
  tug_valida1?: {
    tempo?: string
    bracos?: boolean
    giro?: boolean
    passos?: boolean
    desvio?: boolean
    freezing?: boolean
    apoio?: boolean
    obs?: string
  }
  tug_valida2?: {
    tempo?: string
    bracos?: boolean
    giro?: boolean
    passos?: boolean
    desvio?: boolean
    freezing?: boolean
    apoio?: boolean
    obs?: string
  }
  tug_criterio?: 'melhor' | 'media'
  tug_resultado_escolhido?: number | string
  // Inspecao e marcadores
  inspecao_ativo?: boolean
  inspecao_dados?: Record<string, string>
  // Cirtometria
  cirtometria_ativo?: boolean
  cirtometria_dados?: Record<string, { direito?: string; esquerdo?: string }>
  // Goniometria
  goniometria_ativo?: boolean
  goniometria_medicoes?: Array<{
    data: string
    joelho_d?: string
    joelho_e?: string
    outros?: string
  }>
  // Palmilha
  palmilha_ativo?: boolean
  palmilha_elementos?: Record<string, boolean>
  palmilha_tamanho?: string
  palmilha_obs?: string
}

export interface PlanoSemanalItem {
  semana: string
  foco: string
  condutas: string
  criterios_evolucao?: string
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
  // Novos campos estruturados
  anamnese_detalhada?: AnamneseDetalhadaFisio
  queixas_multiplas?: QueixaItem[]
  visceras_sistemicas?: ViscerasSistemicas
  habitos_saude?: HabitosSaude
  adm_segmentos?: AdmSegmento[]
  forca_muscular_grupos?: ForcaGrupoItem[]
  forca_core_tabela?: ForcaCoreTabela
  testes_especiais_segmentos?: TestesEspeciaisSegmento[]
  secoes_complementares?: SecoesComplementaresFisio
  diagnostico_disfuncional?: string
  hipotese_diagnostica_ia?: string
  plano_semanal_detalhado?: PlanoSemanalItem[]
  anexos_exames?: string[]
  anexos_dinamometro?: string[]
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
