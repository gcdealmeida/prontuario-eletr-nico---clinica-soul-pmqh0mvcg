import type {
  AdmSegmento,
  ForcaGrupoItem,
  TestesEspeciaisSegmento,
  QueixaItem,
} from '@/types/database'

export const SEGMENTOS_ADM_PADRAO: AdmSegmento[] = [
  {
    segmento: 'Ombro',
    ativo: false,
    movimentos: [
      { movimento: 'Flexão', direito: '', esquerdo: '' },
      { movimento: 'Extensão', direito: '', esquerdo: '' },
      { movimento: 'Rotação Interna', direito: '', esquerdo: '' },
      { movimento: 'Rotação Externa', direito: '', esquerdo: '' },
      { movimento: 'Abdução', direito: '', esquerdo: '' },
      { movimento: 'Adução Horizontal', direito: '', esquerdo: '' },
    ],
  },
  {
    segmento: 'Cotovelo e Antebraço',
    ativo: false,
    movimentos: [
      { movimento: 'Flexão', direito: '', esquerdo: '' },
      { movimento: 'Extensão', direito: '', esquerdo: '' },
      { movimento: 'Pronação', direito: '', esquerdo: '' },
      { movimento: 'Supinação', direito: '', esquerdo: '' },
    ],
  },
  {
    segmento: 'Punho e Mão',
    ativo: false,
    movimentos: [
      { movimento: 'Flexão (Palmar)', direito: '', esquerdo: '' },
      { movimento: 'Extensão (Dorsiflexão)', direito: '', esquerdo: '' },
      { movimento: 'Desvio Ulnar', direito: '', esquerdo: '' },
      { movimento: 'Desvio Radial', direito: '', esquerdo: '' },
    ],
  },
  {
    segmento: 'Coluna Cervical',
    ativo: false,
    movimentos: [
      { movimento: 'Flexão', direito: '', esquerdo: '' },
      { movimento: 'Extensão', direito: '', esquerdo: '' },
      { movimento: 'Rotação Direita / Esquerda', direito: '', esquerdo: '' },
      { movimento: 'Inclinação Lateral D / E', direito: '', esquerdo: '' },
    ],
  },
  {
    segmento: 'Coluna Torácica e Lombar',
    ativo: false,
    movimentos: [
      { movimento: 'Flexão', direito: '', esquerdo: '' },
      { movimento: 'Extensão', direito: '', esquerdo: '' },
      { movimento: 'Rotação D / E', direito: '', esquerdo: '' },
      { movimento: 'Latero-flexão D / E', direito: '', esquerdo: '' },
    ],
  },
  {
    segmento: 'Quadril',
    ativo: false,
    movimentos: [
      { movimento: 'Flexão', direito: '', esquerdo: '' },
      { movimento: 'Extensão', direito: '', esquerdo: '' },
      { movimento: 'Abdução', direito: '', esquerdo: '' },
      { movimento: 'Adução', direito: '', esquerdo: '' },
      { movimento: 'Rotação Interna', direito: '', esquerdo: '' },
      { movimento: 'Rotação Externa', direito: '', esquerdo: '' },
    ],
  },
  {
    segmento: 'Joelho',
    ativo: false,
    movimentos: [
      { movimento: 'Flexão', direito: '', esquerdo: '' },
      { movimento: 'Extensão', direito: '', esquerdo: '' },
    ],
  },
  {
    segmento: 'Tornozelo e Pé',
    ativo: false,
    movimentos: [
      { movimento: 'Dorsiflexão', direito: '', esquerdo: '' },
      { movimento: 'Flexão Plantar', direito: '', esquerdo: '' },
      { movimento: 'Inversão', direito: '', esquerdo: '' },
      { movimento: 'Eversão', direito: '', esquerdo: '' },
    ],
  },
]

export const GRUPOS_FORCA_PADRAO: ForcaGrupoItem[] = [
  {
    grupo: 'Flexores de Ombro (Deltóide anterior / Peitoral)',
    grau_direito: '5',
    grau_esquerdo: '5',
  },
  { grupo: 'Abdutores de Ombro (Deltóide médio / Supra)', grau_direito: '5', grau_esquerdo: '5' },
  {
    grupo: 'Rotadores Externos Ombro (Infraespinhoso / Redondo)',
    grau_direito: '5',
    grau_esquerdo: '5',
  },
  {
    grupo: 'Rotadores Internos Ombro (Subescapular / Peitoral)',
    grau_direito: '5',
    grau_esquerdo: '5',
  },
  { grupo: 'Flexores de Cotovelo (Bíceps / Braquial)', grau_direito: '5', grau_esquerdo: '5' },
  { grupo: 'Extensores de Cotovelo (Tríceps)', grau_direito: '5', grau_esquerdo: '5' },
  {
    grupo: 'Flexores de Quadril (Iliopsoas / Reto femoral)',
    grau_direito: '5',
    grau_esquerdo: '5',
  },
  {
    grupo: 'Extensores de Quadril (Glúteo máximo / Isquios)',
    grau_direito: '5',
    grau_esquerdo: '5',
  },
  { grupo: 'Abdutores de Quadril (Glúteo médio / TFL)', grau_direito: '5', grau_esquerdo: '5' },
  { grupo: 'Extensores de Joelho (Quadríceps)', grau_direito: '5', grau_esquerdo: '5' },
  { grupo: 'Flexores de Joelho (Isquiotibiais)', grau_direito: '5', grau_esquerdo: '5' },
  { grupo: 'Dorsiflexores Tornozelo (Tibial anterior)', grau_direito: '5', grau_esquerdo: '5' },
  { grupo: 'Flexores Plantares (Tríceps sural)', grau_direito: '5', grau_esquerdo: '5' },
]

export const TESTES_ESPECIAIS_PADRAO: TestesEspeciaisSegmento[] = [
  {
    segmento: 'Ombro',
    ativo: false,
    testes: [
      { nome: 'Neer', estrutura: 'Tendinite Supraespinhal / Bursite Subacromial' },
      { nome: 'Hawkins-Kennedy', estrutura: 'Síndrome do Impacto Subacromial' },
      { nome: 'Jobe (Empty Can)', estrutura: 'Tendão do Supraespinhoso' },
      { nome: 'Yocum', estrutura: 'Síndrome do Impacto Coracoacromial' },
      { nome: 'Gerber (Lift-off)', estrutura: 'Tendão do Subescapular' },
      { nome: 'Teste do Infraespinhoso', estrutura: 'Músculo / Tendão do Infraespinhoso' },
      { nome: 'Patte', estrutura: 'Infraespinhoso e Redondo Menor' },
      { nome: 'Speed', estrutura: 'Tendão Bicipital e Lesão SLAP' },
      { nome: 'Sulcus Sign (Instabilidade Inferior)', estrutura: 'Frouxidão Ligamentar Inferior' },
      {
        nome: 'Apprehension / Instabilidade Anterior',
        estrutura: 'Instabilidade Glenoumeral Anterior',
      },
      { nome: 'Instabilidade Posterior', estrutura: 'Cápsula / Labrum Posterior' },
      { nome: 'Adson', estrutura: 'Síndrome do Desfiladeiro Torácico' },
    ],
  },
  {
    segmento: 'Joelho',
    ativo: false,
    testes: [
      { nome: 'Lachman', estrutura: 'Ligamento Cruzado Anterior (LCA)' },
      { nome: 'Gaveta Anterior', estrutura: 'Ligamento Cruzado Anterior (LCA)' },
      { nome: 'Gaveta Posterior', estrutura: 'Ligamento Cruzado Posterior (LCP)' },
      { nome: 'Pivot-Shift', estrutura: 'Instabilidade Rotacional Anterolateral' },
      { nome: 'Estresse em Valgo (0° e 30°)', estrutura: 'Ligamento Colateral Medial (LCM)' },
      { nome: 'Estresse em Varo (0° e 30°)', estrutura: 'Ligamento Colateral Lateral (LCL)' },
      { nome: 'McMurray', estrutura: 'Lesão Meniscal Medial / Lateral' },
      { nome: 'Apley Compressão e Tração', estrutura: 'Lesão Meniscal vs Ligamentar' },
      { nome: 'Thessaly (em 5° e 20° de flexão)', estrutura: 'Lesão Meniscal Dinâmica' },
      { nome: 'Steiman I e II', estrutura: 'Sensibilidade de Interlinha Meniscal' },
      {
        nome: 'Clarke (Apreensão Patelar / Grind Test)',
        estrutura: 'Condromalácia / Cartilagem Patelofemoral',
      },
      {
        nome: 'Inclinômetro Patelar / Mobilidade Patelar',
        estrutura: 'Retináculos Patelar Medial / Lateral',
      },
    ],
  },
  {
    segmento: 'Coluna Lombar e Pelve',
    ativo: false,
    testes: [
      { nome: 'SLR / Lasègue', estrutura: 'Radiculopatia Ciática / Tensão Dural L4-S1' },
      { nome: 'Bragard', estrutura: 'Confirmação de Radiculopatia Ciática' },
      { nome: 'Slump Test', estrutura: 'Mobilidade e Tensão Neurodinâmica' },
      { nome: 'Schober Modificado', estrutura: 'Flexibilidade e Mobilidade da Coluna Lombar' },
      { nome: 'Teste de Compressão Vertebral', estrutura: 'Sobrecarga Discal / Facetária' },
      { nome: 'Teste de Distração Vertebral', estrutura: 'Alívio de Compressão / Facetas' },
      { nome: 'Teste de Instabilidade Prone', estrutura: 'Instabilidade Segmentar Lombar' },
      { nome: 'Gaenslen', estrutura: 'Disfunção da Articulação Sacroilíaca' },
      { nome: 'Thigh Thrust', estrutura: 'Articulação Sacroilíaca' },
    ],
  },
  {
    segmento: 'Quadril',
    ativo: false,
    testes: [
      { nome: 'FABER (Patrick)', estrutura: 'Sacroilíaca / Impacto Coxofemoral' },
      { nome: 'FADIR', estrutura: 'Impacto Femoroacetabular (IFA) / Labrum' },
      { nome: 'Thomas', estrutura: 'Encurtamento do Iliopsoas / Reto Femoral' },
      { nome: 'Ober', estrutura: 'Trato Iliotibial e Tensor da Fáscia Lata' },
      { nome: 'Trendelenburg', estrutura: 'Fraqueza de Glúteo Médio' },
      { nome: 'Craig', estrutura: 'Anteversão / Retroversão Femoral' },
    ],
  },
  {
    segmento: 'Tornozelo, Pé e Postura Podal',
    ativo: false,
    testes: [
      { nome: 'Gaveta Anterior do Tornozelo', estrutura: 'Ligamento Talofibular Anterior (LTFA)' },
      {
        nome: 'Talar Tilt (Inversão e Eversão)',
        estrutura: 'Ligamento Calcaneofibular / Deltoide',
      },
      { nome: 'Thompson', estrutura: 'Integridade do Tendão Calcâneo' },
      { nome: 'Jack Test (Toe Extension)', estrutura: 'Mecanismo de Windlass / Arco Medial' },
      { nome: 'Hubscher Modificado (com e sem carga)', estrutura: 'Arco Estrutural vs Funcional' },
      {
        nome: 'Tripé Podal (Calcâneo, 1º e 5º metatarso)',
        estrutura: 'Distribuição de Apoio Plantar',
      },
      { nome: 'Drop do Navicular', estrutura: 'Pronação Subtalar (> 10mm indica hiperpronação)' },
      { nome: 'Teste do Core Podal', estrutura: 'Músculos Intrínsecos do Pé' },
      { nome: 'Equilíbrio Unipodal', estrutura: 'Estabilidade Dinâmica e Controle Sensoriomotor' },
      { nome: 'Teste de Flexibilidade - Lunge Test', estrutura: 'ADM de Dorsiflexão do Tornozelo' },
      { nome: 'Teste de Perna Curta', estrutura: 'Dismetria Aparente vs Real' },
      { nome: 'Polegares Ascendentes', estrutura: 'Assimetria Sacroilíaca / Tônus Postural' },
      { nome: 'Posturodinâmico', estrutura: 'Latero-flexão e Rotação Axial' },
      {
        nome: 'Rotação da Cabeça com Estímulo Podal',
        estrutura: 'Influência Podal na Cadeia Ascendente',
      },
    ],
  },
  {
    segmento: 'Coluna Cervical e Membro Superior',
    ativo: false,
    testes: [
      { nome: 'Spurling A e B', estrutura: 'Radiculopatia Cervical e Compressão Foraminal' },
      { nome: 'Teste de Distração Cervical', estrutura: 'Alívio de Radiculopatia Cervical' },
      { nome: 'Flexão-Rotação Cervical', estrutura: 'Mobilidade C1-C2 / Cefaleia Cervicogênica' },
      {
        nome: 'Upper Limb Tension Test (ULTT 1 - Mediano)',
        estrutura: 'Neurodinâmica do Nervo Mediano',
      },
      {
        nome: 'ULTT 2 (Radial) e ULTT 3 (Ulnar)',
        estrutura: 'Neurodinâmica dos Nervos Radial e Ulnar',
      },
      { nome: 'Roos (EAST)', estrutura: 'Síndrome do Desfiladeiro Torácico' },
      { nome: 'Eden (Costoclavicular)', estrutura: 'Compressão Costoclavicular' },
      { nome: 'Wright (Hiperabdução)', estrutura: 'Compressão do Peitoral Menor' },
    ],
  },
]

export const VALORES_REFERENCIA_CORE = {
  M: {
    '18-40': {
      prancha_ventral: 115.6,
      prancha_lateral_d: 89.3,
      prancha_lateral_e: 88.5,
      ponte_uni_d: 90.0,
      ponte_uni_e: 90.0,
    },
    '41-65': {
      prancha_ventral: 81.2,
      prancha_lateral_d: 63.2,
      prancha_lateral_e: 63.4,
      ponte_uni_d: 90.0,
      ponte_uni_e: 90.0,
    },
  },
  F: {
    '18-40': {
      prancha_ventral: 108.5,
      prancha_lateral_d: 85.7,
      prancha_lateral_e: 84.8,
      ponte_uni_d: 90.0,
      ponte_uni_e: 90.0,
    },
    '41-65': {
      prancha_ventral: 77.4,
      prancha_lateral_d: 62.2,
      prancha_lateral_e: 60.8,
      ponte_uni_d: 90.0,
      ponte_uni_e: 90.0,
    },
  },
}

export const QUEIXAS_INICIAIS_PADRAO: QueixaItem[] = [
  {
    titulo: 'Principal',
    queixa: '',
    desde_quando: '',
    tipo: '',
    eva: 5,
    historico: '',
    pior_momento_dia: '',
    movimento_piora: '',
    o_que_alivia: '',
  },
  {
    titulo: 'Secundária',
    queixa: '',
    desde_quando: '',
    tipo: '',
    eva: 0,
    historico: '',
    pior_momento_dia: '',
    movimento_piora: '',
    o_que_alivia: '',
  },
  {
    titulo: 'Terciária',
    queixa: '',
    desde_quando: '',
    tipo: '',
    eva: 0,
    historico: '',
    pior_momento_dia: '',
    movimento_piora: '',
    o_que_alivia: '',
  },
]

export const BERG_ITENS = [
  {
    id: 1,
    desc: 'Sentar para ficar em pé',
    instrucao: 'Levante-se da cadeira sem usar as mãos se possível',
  },
  { id: 2, desc: 'Ficar em pé sem apoio', instrucao: 'Permaneça em pé por 2 minutos sem apoio' },
  {
    id: 3,
    desc: 'Sentar sem apoio (costas desapoiadas)',
    instrucao: 'Sente-se com braços cruzados por 2 minutos',
  },
  {
    id: 4,
    desc: 'Transferências (cadeira para cadeira)',
    instrucao: 'Passe de uma cadeira para outra com segurança e retorne',
  },
  {
    id: 5,
    desc: 'Em pé com olhos fechados',
    instrucao: 'Fique em pé ereto com olhos fechados por 10 segundos',
  },
  {
    id: 6,
    desc: 'Em pé com pés juntos',
    instrucao: 'Una os pés completamente e mantenha por 1 minuto',
  },
  {
    id: 7,
    desc: 'Alcançar à frente com braço estendido',
    instrucao: 'Alcance à frente o mais longe possível mantendo pés fixos',
  },
  {
    id: 8,
    desc: 'Pegar objeto do chão',
    instrucao: 'Pegue o objeto colocado à frente dos pés no chão',
  },
  {
    id: 9,
    desc: 'Olhar para trás por cima dos ombros',
    instrucao: 'Vire o tronco e olhe para trás por ambos os lados',
  },
  {
    id: 10,
    desc: 'Girar 360 graus',
    instrucao: 'Gire completamente em círculo completo em até 4 segundos',
  },
  {
    id: 11,
    desc: 'Pé alternado no degrau (banco)',
    instrucao: 'Suba alternadamente cada pé no degrau 8 vezes',
  },
  {
    id: 12,
    desc: 'Pé à frente do outro (posição de Tandem)',
    instrucao: 'Fique com um pé diretamente à frente do outro por 30s',
  },
  {
    id: 13,
    desc: 'Apoio unipodal',
    instrucao: 'Fique apoiado em um único pé o máximo de tempo possível',
  },
]

export const ELEMENTOS_PALMILHA = [
  {
    id: 'bic',
    nome: 'BIC - Barra Infracapital',
    desc: 'Promove rotação pélvica homolateral ou retropulsão de tronco',
  },
  { id: 'subdigital', nome: 'Barra Subdigital', desc: 'Redução e conforto para dedos em garra' },
  { id: 'botao', nome: 'Botão Metatarsal', desc: 'Estimula flexores dos dedos e retropulsão' },
  {
    id: 'abd_5',
    nome: 'Abdutor do 5º Metatarso',
    desc: 'Estimula arco longitudinal lateral e rotação medial pélvica',
  },
  {
    id: 'abd_halux',
    nome: 'Abdutor do Hálux',
    desc: 'Estimula rotação lateral da pelve e arco medial',
  },
  {
    id: 'infracuboide',
    nome: 'Infracuboide',
    desc: 'Equilíbrio do arco lateral e báscula contralateral',
  },
  {
    id: 'antirotador_int',
    nome: 'Antirotador Interno',
    desc: 'Estimula rotação externa do membro inferior',
  },
  {
    id: 'antirotador_ext',
    nome: 'Antirotador Externo',
    desc: 'Estimula rotação interna do membro inferior',
  },
  { id: 'cunha_antivaro', nome: 'Cunha Antivaro', desc: 'Colocado sob o calcâneo lateralmente' },
  { id: 'cunha_antivalgo', nome: 'Cunha Antivalgo', desc: 'Colocado sob o calcâneo medialmente' },
  {
    id: 'barra_post_calcaneo',
    nome: 'Barra Posterior do Calcâneo',
    desc: 'Estimula propulsão e rotação contralateral',
  },
  {
    id: 'estabilizador_calcaneo',
    nome: 'Estabilizador do Calcâneo (U)',
    desc: 'Estabilização dinâmica do retropé',
  },
  {
    id: 'taloneta',
    nome: 'Taloneta (2 a 6mm)',
    desc: 'Compensação funcional para dismetrias de membros',
  },
]
