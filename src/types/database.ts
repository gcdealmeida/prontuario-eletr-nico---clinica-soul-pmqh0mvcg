export type Especialidade = 'Fisioterapia' | 'Personal' | 'Nutrição' | 'Médico'

export type StatusPaciente = 'Ativo' | 'Inativo' | 'Pré-cadastro'

export type StatusConsulta = 'Agendada' | 'Confirmada' | 'Concluída' | 'Cancelada'

export type TipoTimeline = 'Consulta' | 'Avaliação' | 'Nota'

export type StatusAvaliacao = 'Rascunho' | 'Concluída'

export type StatusEvolucao = 'Finalizada' | 'Rascunho'
export type TipoEvolucao = 'Rotina' | 'Corretiva'

export interface EvolucaoRecord {
  id: string
  paciente_id: string
  avaliacao_id?: string
  especialidade: Especialidade
  data_evolucao: string
  horario?: string
  profissional: string
  // SOAP
  subjetivo?: string
  objetivo?: string
  avaliacao_clinica?: string
  plano?: string
  // Condutas e procedimentos da sessão
  conduta_procedimentos?: string
  // Texto livre de evolução rápida
  texto_livre?: string
  status: StatusEvolucao

  // Escala Visual Analógica de dor (0 a 10)
  eva_dor?: number | null

  // Documento Fechado e Assinatura Digital SOUL
  numero_registro?: string
  assinado_em?: string
  assinado_por_nome?: string
  assinado_por_especialidade?: string
  assinado_por_user_id?: string
  documento_fechado?: boolean
  tipo_evolucao?: TipoEvolucao
  evolucao_referencia_id?: string
  resumos_anexos?: Record<string, ResumoAnexoIaItem>

  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export type AccessStatus = 'pending' | 'approved' | 'suspended'
export type UserRole = 'admin' | 'professional'

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
  calendar_token?: string
  access_status?: AccessStatus
  role?: UserRole
  especialidade?: Especialidade | 'Geral' | string
  requested_at?: string
  approved_at?: string
  approved_by?: string
  last_login_at?: string
  created: string
  updated: string
}

export type AccessLogAction =
  | 'signup_requested'
  | 'login_success'
  | 'login_blocked_pending'
  | 'login_blocked_suspended'
  | 'access_approved'
  | 'access_rejected'
  | 'access_suspended'
  | 'access_reactivated'

export interface AccessLogRecord {
  id: string
  user_id: string
  user_email: string
  user_name?: string
  action: AccessLogAction
  actor_id?: string
  actor_email?: string
  details?: string
  ip_address?: string
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
  endereco_rua?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  observacoes?: string
  status: StatusPaciente
  // Dados de Pré-Cadastro e Anamnese Geral
  origem_como_chegou?: string
  motivo_procura?: string
  limitacoes_incomodo?: string
  tratamentos_anteriores?: string
  resultado_esperado?: string
  diagnostico_medico?: string
  profissional_responsavel_id?: string
  genero?: string
  queixa_dor_onde?: string
  atividade_fisica?: string
  frequencia_semanal?: string
  duracao_treino?: string
  controle_alimentar?: string
  quem_indicou?: string
  observacoes_formulario?: string
  ficha_pre_cadastro?: Record<string, any>
  created: string
  updated: string
}

export type OrigemConsulta = 'app' | 'google'

export interface GoogleCalendarSyncRecord {
  id: string
  user_id: string
  ics_url: string
  calendar_name?: string
  last_sync?: string
  last_status?: 'pending' | 'success' | 'error' | string
  last_error?: string
  events_count?: number
  auto_sync?: boolean
  created: string
  updated: string
}

export interface GoogleCalendarSyncStatus {
  configured: boolean
  masked_url?: string
  calendar_name?: string
  last_sync?: string
  last_status?: string
  last_error?: string
  events_count?: number
  auto_sync?: boolean
}

export interface GoogleCalendarSyncResult {
  success: boolean
  message: string
  calendar_name?: string
  total_in_feed?: number
  in_window?: number
  imported?: number
  updated?: number
  removed?: number
  last_sync?: string
  error?: string
}

export interface ConsultaRecord {
  id: string
  paciente_id: string
  especialidade: Especialidade
  data_hora: string
  duracao_min?: number
  status: StatusConsulta
  notas?: string
  origem?: OrigemConsulta | string
  google_event_uid?: string
  google_sync_id?: string
  titulo_externo?: string
  user_id?: string
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
  observacoes_gerais?: string
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
  observacoes_gerais?: string
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
  acompanhamento_nutricional?: 'Sim' | 'Não'
  acompanhamento_nutricional_obs?: string
}

export interface AdmItem {
  movimento: string
  direito?: number | string
  esquerdo?: number | string
  graus?: number | string
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

export interface EstrelaDorItem {
  segmento: string
  amplitude_movimento: string
  qualidade_movimento: string
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
  cirtometria_dados?: Record<string, { direito?: string; esquerdo?: string }> // Legado / retrocompatibilidade
  cirtometria_fases?: Array<{
    id: string
    fase: string // ex: "Medida Inicial", "Fase 1 (Reavaliação)", etc.
    data: string
    medidas: Record<string, { direito?: string; esquerdo?: string }>
    observacoes?: string
  }>
  // Goniometria (por segmento + movimento)
  goniometria_ativo?: boolean
  goniometria_medicoes?: Array<{
    data: string
    joelho_d?: string
    joelho_e?: string
    outros?: string
  }> // Legado
  goniometria_avaliacoes?: Array<{
    id: string
    data: string
    segmento: string
    movimento: string
    esquerdo_graus?: string | number
    direito_graus?: string | number
    graus?: string | number
    observacoes?: string
  }>
  // Palmilha - Avaliação Podal + Prescrição
  palmilha_ativo?: boolean
  palmilha_elementos?: Record<string, boolean>
  palmilha_tamanho?: string
  palmilha_obs?: string
  // Avaliação Podal Específica em Etapas
  palmilha_avaliacao?: {
    // 1. Postura Podal Estática e Alinhamento
    postura_antepe?: 'Valgo' | 'Varo' | 'Neutro / Alinhado' | ''
    postura_retrope?: 'Valgo' | 'Varo' | 'Neutro / Alinhado' | ''
    postura_joelho?: 'Valgo' | 'Varo' | 'Neutro / Alinhado' | ''
    postura_quadril?: 'Rotação Interna' | 'Rotação Externa' | 'Neutro' | ''
    altura_crista_iliaca?: 'Simétrica' | 'Direita Mais Alta' | 'Esquerda Mais Alta' | ''
    altura_ombro?: 'Simétrica' | 'Direito Mais Alto' | 'Esquerdo Mais Alto' | ''
    inclinacao_cabeca?: 'Simétrica' | 'Direita' | 'Esquerda' | ''
    plano_sagital?:
      | 'Retificado'
      | 'Anteriorizado'
      | 'Neutro'
      | 'Hiperlordose / Aumento de Curvas'
      | 'Posteriorizado'
      | ''
    // 2. Testes Biomecânicos Podais
    jack_test_direito?: 'POSITIVO' | 'NEGATIVO' | 'NÃO REALIZADO' | ''
    jack_test_esquerdo?: 'POSITIVO' | 'NEGATIVO' | 'NÃO REALIZADO' | ''
    hubscher_modificado?:
      | 'Estrutural (sem melhora)'
      | 'Funcional (melhora sem carga)'
      | 'Normal'
      | ''
    tripe_podal_direito?: { calcaneo?: boolean; meta1?: boolean; meta5?: boolean }
    tripe_podal_esquerdo?: { calcaneo?: boolean; meta1?: boolean; meta5?: boolean }
    drop_navicular_mm_direito?: string | number
    drop_navicular_mm_esquerdo?: string | number
    core_podal_direito?: 'NORMAL' | 'ALTERADO' | ''
    core_podal_esquerdo?: 'NORMAL' | 'ALTERADO' | ''
    mobilidade_1_raio_direito?: 'NORMAL' | 'HIPOMÓVEL' | 'HIPERMÓVEL' | ''
    mobilidade_1_raio_esquerdo?: 'NORMAL' | 'HIPOMÓVEL' | 'HIPERMÓVEL' | ''
    equilibrio_unipodal_direito?: 'NORMAL' | 'ALTERADO' | ''
    equilibrio_unipodal_esquerdo?: 'NORMAL' | 'ALTERADO' | ''
    perna_curta?: 'Nenhuma / Simétrica' | 'Perna Curta Direita' | 'Perna Curta Esquerda' | ''
    perna_curta_mm?: string | number
    lunge_test_cm_direito?: string | number
    lunge_test_cm_esquerdo?: string | number
    // 3. Testes Posturológicos e Cadeia Ascendente
    polegares_ascendentes?: 'Simétrico' | 'Assimetria Direita' | 'Assimetria Esquerda' | ''
    posturodinamico?: 'Normal' | 'Bloqueio à Direita' | 'Bloqueio à Esquerda' | ''
    rotacao_cabeca_estimulo_podal?: 'Melhora com Estímulo' | 'Sem Alteração' | 'Piora' | ''
    marcha_observacoes?: string
    tipo_pisada?: 'Pronada' | 'Supinada' | 'Neutra' | 'Hiperpronada' | ''
  }
  // Prescrição e Pedido da Palmilha
  palmilha_pedido?: {
    prescricao_aberta?: boolean
    modelo_palmilha?:
      | 'Postural / Proprioceptiva'
      | 'Mecânica / Esportiva'
      | 'Conforto / Diabético'
      | 'Infantil'
      | ''
    calçado_tamanho?: string
    espessura_base_mm?: string
    densidade_eva?:
      | 'Macia (25-30 shore)'
      | 'Média (35-40 shore)'
      | 'Firme (45-50 shore)'
      | 'Rígida (60+ shore)'
      | ''
    cobertura_tipo?:
      | 'EVA Perfurado'
      | 'Couro Sintético'
      | 'Camurça'
      | 'Plastazote'
      | 'Neoprene'
      | ''
    elementos_selecionados?: Record<string, boolean>
    elementos_detalhes?: Record<
      string,
      { lado?: 'Bilateral' | 'Direito' | 'Esquerdo'; tamanho_mm?: string }
    >
    compensacao_dismetria_lado?: 'Nenhum' | 'Direito' | 'Esquerdo' | ''
    compensacao_dismetria_mm?: string | number
    data_pedido?: string
    prazo_previsto?: string
    laboratorio_fornecedor?: string
    observacoes_laboratorio?: string
  }
}

export interface PlanoSemanalItem {
  semana: string
  foco: string
  condutas: string
  criterios_evolucao?: string
}

export interface ResumoAnexoIaItem {
  nome_arquivo: string
  resumo: string
  analisado_em?: string
  analisado_por?: string
  editado_manualmente?: boolean
  truncated?: boolean
}

export interface AvaliacaoFisioterapiaRecord {
  id: string
  paciente_id: string
  user_id?: string
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
  estrela_dor?: EstrelaDorItem[]
  secoes_complementares?: SecoesComplementaresFisio
  diagnostico_disfuncional?: string
  forca_muscular_descricao?: string
  hipotese_diagnostica_ia?: string
  fundamentacao_cientifica?: string
  fundamentacao_cientifica_ia?: string
  plano_semanal_detalhado?: PlanoSemanalItem[]
  anexos_exames?: string[]
  anexos_dinamometro?: string[]
  resumos_anexos?: Record<string, ResumoAnexoIaItem>
  dados_importados_planilha?: {
    arquivo_origem?: string
    importado_em?: string
    abas_processadas?: string[]
    resumo?: Record<string, any>
    dados_extras?: Record<string, any>
  }
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export interface AvaliacaoPersonalRecord {
  id: string
  paciente_id: string
  user_id?: string
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
  // Campos expandidos do modelo PHYSICAL TEST
  anamnese_personal?: {
    sexo?: 'M' | 'F'
    idade?: number
    peso?: number
    altura?: number
    imc?: number
    classificacao_imc?: string
    circ_cintura?: number
    circ_quadril?: number
    circ_abdomen?: number
    rcq?: number
    classificacao_rcq?: string
    fc_repouso?: number
    pressao_arterial?: string
    objetivo_detalhado?: string
    historico_lesoes?: string
    pratica_atividade?: string
    medicamentos?: string
  }
  composicao_corporal?: {
    protocolo?: string
    formula_conversao?: 'Siri' | 'Brozek'
    dobras?: Record<string, number>
    densidade_corporal?: number
    percentual_gordura?: number
    massa_gorda_kg?: number
    massa_magra_kg?: number
    peso_ideal_kg?: number
    perimetros?: {
      torax?: number
      abdomen?: number
      cintura?: number
      quadril?: number
      braco_d_relaxado?: number
      braco_e_relaxado?: number
      braco_d_contraido?: number
      braco_e_contraido?: number
      antebraco_d?: number
      antebraco_e?: number
      coxa_d?: number
      coxa_e?: number
      panturrilha_d?: number
      panturrilha_e?: number
    }
    classificacao_gordura?: {
      categoria: string
      faixaIdealTexto: string
    }
  }
  forca_dinamometro?: {
    movimentos?: Array<{
      nome: string
      direito_kgf?: number | string
      esquerdo_kgf?: number | string
      assimetria_pct?: number | string
      forca_relativa_d?: number | string
      forca_relativa_e?: number | string
      referencia?: string
    }>
  }
  forca_muscular_descricao?: string
  anexos_dinamometro?: string[]
  flexibilidade_dados?: {
    banco_wells?: {
      medida1_cm?: number
      medida2_cm?: number
      medida3_cm?: number
      melhor_medida_cm?: number
      classificacao?: string
    }
    flexitest_ativo?: boolean
    flexitest_notas?: Record<number, number>
    flexitest_total?: number
    flexitest_classificacao?: string
    observacoes?: string
  }
  postural_dados?: {
    vista_anterior?: Record<string, { status: 'NORMAL' | 'ALTERADO'; obs?: string }>
    vista_posterior?: Record<string, { status: 'NORMAL' | 'ALTERADO'; obs?: string }>
    vista_lateral?: Record<string, { status: 'NORMAL' | 'ALTERADO'; obs?: string }>
    conclusao_postural?: string
  }
  anexos_postura?: string[]
  core_mcgill?: {
    prancha_ventral_seg?: number
    prancha_lat_d_seg?: number
    prancha_lat_e_seg?: number
    extensao_biering_seg?: number
    flexao_tronco_seg?: number
    razao_flexao_extensao?: number
    razao_lat_extensao?: number
    razao_lat_d_e?: number
    alertas?: string[]
    observacoes?: string
  }
  fms_dados?: {
    itens?: Record<string, any>
    score_total?: number
    assimetrias_total?: number
    classificacao_risco?: string
    estrategia_treino?: string
  }
  metas_treino?: {
    resumo_geral?: string
    meta_curto_prazo?: string
    meta_medio_prazo?: string
    meta_longo_prazo?: string
    divisao_rotina?: string
  }
  cruzamento_objetivos_fragilidades?: {
    fragilidades_medidas?: Array<{
      area: string
      descricao: string
      medida_exata: string
      impacto_biomecanico?: string
    }>
    cruzamentos?: Array<{
      objetivo_titulo: string
      fragilidade_atacada: string
      medida_citada: string
      estrategia_prescricao: string
      prioridade: 'Alta' | 'Média' | 'Baixa'
    }>
    priorizacao_objetivos?: Array<{
      ordem: number
      objetivo: string
      justificativa_clinica: string
    }>
    sintese_cruzamento?: string
  }
  hipotese_diagnostica_ia?: string
  fundamentacao_cientifica?: string
  fundamentacao_cientifica_ia?: string
  diagnostico_funcional?: string
  objetivos_treinamento?: string
  ia_plano_treino?: {
    hipotese_diagnostica?: string
    fundamentacao_cientifica?: string
    diagnostico_funcional?: string
    objetivos_treinamento?: string
    plano_tratamento_semanal?: Array<{
      semana: string
      foco: string
      condutas: string
      criterios_evolucao?: string
    }>
    sintese_geral?: string
  }
  resumos_anexos?: Record<string, ResumoAnexoIaItem>
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
  }
}

export interface AvaliacaoNutricaoRecord {
  id: string
  paciente_id: string
  user_id?: string
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
  user_id?: string
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

export type ClinicalUpdateAction =
  | 'criar'
  | 'editar'
  | 'concluir'
  | 'assinar'
  | 'evolucao_corretiva'
  | 'excluir'

export type ClinicalUpdateEntityType = 'avaliacao' | 'prontuario' | 'evolucao' | 'presenca'

export type StatusPresenca = 'Presente' | 'Confirmado' | 'Justificado' | 'Cancelado'

export interface PresencaRecord {
  id: string
  paciente_id: string
  profissional_id: string
  data_atendimento: string
  horario?: string
  area_servico: string // ex: Sessão Fisioterapia, Personal Individual, Assessoria Esportiva, etc.
  detalhe_servico?: string // detalhamento opcional do serviço
  observacoes?: string
  status?: StatusPresenca
  paciente_nome?: string
  profissional_nome?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
    profissional_id?: UserRecord
  }
}
export interface ClinicalUpdateLogRecord {
  id: string
  user_id: string
  user_name?: string
  user_email: string
  acao: ClinicalUpdateAction
  tipo_entidade: ClinicalUpdateEntityType
  especialidade?: Especialidade | 'Geral'
  entidade_id: string
  paciente_id?: string
  paciente_nome?: string
  detalhes?: string
  created: string
  updated: string
}

export interface NotificationRecord {
  id: string
  user_id: string
  titulo: string
  descricao?: string
  tipo: 'clinical_update' | 'access_request' | 'system'
  lida: boolean
  link?: string
  metadata?: Record<string, any>
  created: string
  updated: string
}

// ==========================================
// PROGRAMA DE ACOMPANHAMENTO (PERIODIZAÇÃO)
// ==========================================

export type UnidadeDuracaoPrograma = 'dias' | 'semanas' | 'meses'
export type StatusPrograma = 'rascunho' | 'ativo' | 'concluido'
export type TipoRepeticaoExercicio = 'reps' | 'segundos'

export interface ProgramaAcompanhamentoRecord {
  id: string
  paciente_id: string
  profissional_id?: string
  nome: string
  unidade_duracao: UnidadeDuracaoPrograma
  total_periodos: number
  status: StatusPrograma
  data_inicio?: string
  data_fim?: string
  observacoes?: string
  token_compartilhamento?: string
  link_publico_ativo?: boolean
  avaliacao_origem_id?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
    profissional_id?: UserRecord
  }
}

export interface ProgramaMetaRecord {
  id: string
  programa_id: string
  ordem: number
  titulo: string
  duracao_periodos?: number
  descricao?: string
  fragilidade_ref?: string
  cor?: string
  created: string
  updated: string
}

export interface ProgramaSemanaRecord {
  id: string
  programa_id: string
  indice: number // 1..N
  rotulo?: string
  metas_ids?: string[] // IDs de programa_meta
  foco?: string
  observacoes?: string
  created: string
  updated: string
}

export interface ProgramaTreinoRecord {
  id: string
  programa_id: string
  semana_indice: number
  nome: string // ex: "Treino A", "Treino B", "Superiores", etc.
  ordem?: number
  foco?: string
  objetivo_id?: string
  observacoes?: string
  created: string
  updated: string
}

export interface ExercicioCatalogoRecord {
  id: string
  nome: string
  categoria: string
  subcategoria?: string
  foto?: string
  link?: string
  descricao?: string
  created: string
  updated: string
}

export interface ProgramaExercicioRecord {
  id: string
  programa_id: string
  semana_indice: number
  treino_id?: string
  treino_nome?: string
  meta_id?: string
  exercicio_id?: string
  nome: string
  series?: number
  tipo_repeticao: TipoRepeticaoExercicio
  quantidade?: string
  intervalo?: string
  carga_prescrita?: string
  carga_atual_kg?: number
  observacao?: string
  link?: string
  foto_url?: string
  ordem?: number
  created: string
  updated: string
  expand?: {
    exercicio_id?: ExercicioCatalogoRecord
    treino_id?: ProgramaTreinoRecord
  }
}

export interface ProgramaRegistroCargaRecord {
  id: string
  exercicio_id: string
  data: string
  valor_kg: number
  repeticoes_feitas?: string
  rpe?: number
  notas?: string
  created: string
  updated: string
  expand?: {
    exercicio_id?: ProgramaExercicioRecord
  }
}

export interface RelatorioIaRecord {
  id: string
  paciente_id: string
  avaliacao_id: string
  especialidade: Especialidade | 'Geral'
  tipo_relatorio?: 'Relatório Clínico' | 'Resumo de Evolução' | 'Laudo' | 'Parecer'
  autor_id: string
  autor_nome?: string
  titulo: string
  necessidade: string
  conteudo: string
  publico_alvo?: string
  created: string
  updated: string
  expand?: {
    paciente_id?: PacienteRecord
    autor_id?: UserRecord
  }
}
