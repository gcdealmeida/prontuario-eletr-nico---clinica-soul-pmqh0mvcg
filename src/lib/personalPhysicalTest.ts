// Protocolos, Fórmulas de Physical Test, Valores de Referência e Cálculos

export type Sexo = 'M' | 'F'

export type ProtocoloDobras =
  | 'Pollock 7 dobras'
  | 'Pollock 3 dobras'
  | 'Faulkner'
  | 'Guedes (1985)'
  | 'Petroski'
  | 'Durnin & Womersley'
  | 'Penroze'

export type DobraKey =
  | 'subescapular'
  | 'tricipital'
  | 'peitoral'
  | 'axilar_media'
  | 'suprailiaca'
  | 'abdominal'
  | 'coxa'
  | 'panturrilha_medial'
  | 'biceps'

export interface DobraConfig {
  key: DobraKey
  label: string
  sigla: string
  descricao: string
}

export const TODAS_DOBRAS: DobraConfig[] = [
  {
    key: 'tricipital',
    label: 'Tricipital',
    sigla: 'TR',
    descricao: 'Ponto médio entre acrômio e olécrano',
  },
  {
    key: 'subescapular',
    label: 'Subescapular',
    sigla: 'SE',
    descricao: '2 cm abaixo do ângulo inferior da escápula',
  },
  {
    key: 'biceps',
    label: 'Bicipital',
    sigla: 'BI',
    descricao: 'Ventre anterior do bíceps braquial',
  },
  {
    key: 'axilar_media',
    label: 'Axilar Média',
    sigla: 'AM',
    descricao: 'Linha axilar média no nível do apêndice xifoide',
  },
  {
    key: 'peitoral',
    label: 'Peitoral / Torácica',
    sigla: 'PT',
    descricao: 'Ponto médio ou 1/3 entre linha axilar e mamilo',
  },
  {
    key: 'suprailiaca',
    label: 'Suprailíaca',
    sigla: 'SI',
    descricao: 'Crista ilíaca ântero-superior oblíqua',
  },
  {
    key: 'abdominal',
    label: 'Abdominal',
    sigla: 'AB',
    descricao: '2 cm lateralmente à cicatriz umbilical',
  },
  {
    key: 'coxa',
    label: 'Coxa Medial/Anterior',
    sigla: 'CX',
    descricao: 'Ponto médio entre prega inguinal e borda superior patela',
  },
  {
    key: 'panturrilha_medial',
    label: 'Panturrilha Medial',
    sigla: 'PM',
    descricao: 'Maior circunferência medial da perna',
  },
]

export const PROTOCOLOS_CONFIG: Record<
  ProtocoloDobras,
  {
    nome: string
    descricao: string
    dobrasNecessarias: (sexo: Sexo) => DobraKey[]
    formulaInfo: string
  }
> = {
  'Pollock 7 dobras': {
    nome: 'Pollock & Jackson (7 Dobras)',
    descricao: 'Protocolo mais completo e consagrado na avaliação física (Homens e Mulheres)',
    formulaInfo:
      'Soma de 7 dobras (Peitoral, Axilar M., Tricipital, Subescapular, Abdômen, Suprailíaca, Coxa)',
    dobrasNecessarias: () => [
      'peitoral',
      'axilar_media',
      'tricipital',
      'subescapular',
      'abdominal',
      'suprailiaca',
      'coxa',
    ],
  },
  'Pollock 3 dobras': {
    nome: 'Pollock / Jackson & Pollock (3 Dobras)',
    descricao: 'Rápido e preciso. Dobras diferem entre masculino e feminino.',
    formulaInfo: 'Masc: Peitoral, Abdômen, Coxa | Fem: Tricipital, Suprailíaca, Coxa',
    dobrasNecessarias: (sexo) =>
      sexo === 'M' ? ['peitoral', 'abdominal', 'coxa'] : ['tricipital', 'suprailiaca', 'coxa'],
  },
  Faulkner: {
    nome: 'Faulkner (4 Dobras)',
    descricao:
      'Muito utilizado no Brasil para atletas e praticantes de atividade física moderada a intensa',
    formulaInfo: 'TR + SE + SI + AB — Equação de Faulkner direto para %G',
    dobrasNecessarias: () => ['tricipital', 'subescapular', 'suprailiaca', 'abdominal'],
  },
  'Guedes (1985)': {
    nome: 'Guedes (1985) - População Brasileira',
    descricao: 'Desenvolvido especificamente para jovens e adultos brasileiros',
    formulaInfo: 'TR + SI + AB (Masc) | CX + SE + SI (Fem)',
    dobrasNecessarias: (sexo) =>
      sexo === 'M'
        ? ['tricipital', 'suprailiaca', 'abdominal']
        : ['coxa', 'subescapular', 'suprailiaca'],
  },
  Petroski: {
    nome: 'Petroski (1995) - Adultos Brasileiros',
    descricao: 'Validado com hidrodensitometria em brasileiros de 18 a 66 anos',
    formulaInfo: 'Masc: SE + TR + SI + PM | Fem: AM + SI + CX + PM',
    dobrasNecessarias: (sexo) =>
      sexo === 'M'
        ? ['subescapular', 'tricipital', 'suprailiaca', 'panturrilha_medial']
        : ['axilar_media', 'suprailiaca', 'coxa', 'panturrilha_medial'],
  },
  'Durnin & Womersley': {
    nome: 'Durnin & Womersley (1974)',
    descricao: 'Excelente para diversas faixas etárias de 17 a 72 anos',
    formulaInfo: 'Soma de 4 dobras: Bíceps + Tríceps + Subescapular + Suprailíaca',
    dobrasNecessarias: () => ['biceps', 'tricipital', 'subescapular', 'suprailiaca'],
  },
  Penroze: {
    nome: 'Penroze & Nelson (3 Dobras)',
    descricao: 'Protocolo prático com boa correlação para condicionamento geral',
    formulaInfo: 'TR + SE + CX',
    dobrasNecessarias: () => ['tricipital', 'subescapular', 'coxa'],
  },
}

// 1. Cálculos de IMC e RCQ
export function calcularIMC(pesoKg: number, alturaM: number) {
  if (!pesoKg || !alturaM || alturaM <= 0) return null
  const imc = pesoKg / (alturaM * alturaM)
  let classificacao = ''
  let cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'

  if (imc < 18.5) {
    classificacao = 'Abaixo do peso'
    cor = 'text-amber-700 bg-amber-50 border-amber-200'
  } else if (imc < 24.9) {
    classificacao = 'Eutrofia (Peso adequado)'
    cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
  } else if (imc < 29.9) {
    classificacao = 'Sobrepeso'
    cor = 'text-amber-700 bg-amber-50 border-amber-200'
  } else if (imc < 34.9) {
    classificacao = 'Obesidade Grau I'
    cor = 'text-red-700 bg-red-50 border-red-200'
  } else if (imc < 39.9) {
    classificacao = 'Obesidade Grau II'
    cor = 'text-red-800 bg-red-100 border-red-300'
  } else {
    classificacao = 'Obesidade Grau III (Mórbida)'
    cor = 'text-red-900 bg-red-200 border-red-400'
  }

  return { valor: Number(imc.toFixed(2)), classificacao, cor }
}

export function calcularRCQ(cinturaCm: number, quadrilCm: number, sexo: Sexo) {
  if (!cinturaCm || !quadrilCm || quadrilCm <= 0) return null
  const rcq = cinturaCm / quadrilCm
  let risco = ''
  let cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'

  if (sexo === 'M') {
    if (rcq < 0.9) {
      risco = 'Baixo Risco Cardiovascular'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (rcq <= 0.95) {
      risco = 'Risco Moderado'
      cor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else {
      risco = 'Alto Risco Cardiovascular (Androide)'
      cor = 'text-red-700 bg-red-50 border-red-200'
    }
  } else {
    if (rcq < 0.8) {
      risco = 'Baixo Risco Cardiovascular'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (rcq <= 0.85) {
      risco = 'Risco Moderado'
      cor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else {
      risco = 'Alto Risco Cardiovascular (Androide)'
      cor = 'text-red-700 bg-red-50 border-red-200'
    }
  }

  return { valor: Number(rcq.toFixed(2)), risco, cor }
}

// 2. Classificação de Risco por Perímetro Abdominal (OMS)
export function classificarPerimetroAbdominal(perimetroCm: number, sexo: Sexo) {
  if (!perimetroCm) return null
  if (sexo === 'M') {
    if (perimetroCm < 94) return { risco: 'Adequado (<94 cm)', status: 'normal' }
    if (perimetroCm < 102)
      return { risco: 'Risco aumentado de complicações (94-101.9 cm)', status: 'alerta' }
    return { risco: 'Risco substancialmente aumentado (≥102 cm)', status: 'perigo' }
  } else {
    if (perimetroCm < 80) return { risco: 'Adequado (<80 cm)', status: 'normal' }
    if (perimetroCm < 88)
      return { risco: 'Risco aumentado de complicações (80-87.9 cm)', status: 'alerta' }
    return { risco: 'Risco substancialmente aumentado (≥88 cm)', status: 'perigo' }
  }
}

// 3. Equação de Densidade Corporal e % de Gordura (Physical Test)
export interface CalculoComposicaoResult {
  densidadeCorporal: number | null
  percentualGordura: number | null
  massaGordaKg: number | null
  massaMagraKg: number | null
  pesoIdealEstimadoKg: number | null
  classificacaoGordura: {
    categoria: string
    cor: string
    faixaIdealTexto: string
  } | null
}

export function calcularComposicaoCorporal(params: {
  protocolo: ProtocoloDobras
  dobras: Record<string, number>
  sexo: Sexo
  idade: number
  pesoKg: number
  formulaConversao?: 'Siri' | 'Brozek'
}): CalculoComposicaoResult {
  const { protocolo, dobras, sexo, idade, pesoKg, formulaConversao = 'Siri' } = params

  const getD = (k: DobraKey) => Number(dobras[k]) || 0
  let densidade: number | null = null
  let pctGordura: number | null = null

  // Equações de Densidade / %G por protocolo
  if (protocolo === 'Pollock 7 dobras') {
    const s7 =
      getD('peitoral') +
      getD('axilar_media') +
      getD('tricipital') +
      getD('subescapular') +
      getD('abdominal') +
      getD('suprailiaca') +
      getD('coxa')

    if (s7 > 0) {
      if (sexo === 'M') {
        densidade = 1.112 - 0.00043499 * s7 + 0.00000055 * s7 * s7 - 0.00028826 * idade
      } else {
        densidade = 1.097 - 0.00046971 * s7 + 0.00000056 * s7 * s7 - 0.00012828 * idade
      }
    }
  } else if (protocolo === 'Pollock 3 dobras') {
    if (sexo === 'M') {
      const s3 = getD('peitoral') + getD('abdominal') + getD('coxa')
      if (s3 > 0) {
        densidade = 1.10938 - 0.0008267 * s3 + 0.0000016 * s3 * s3 - 0.0002574 * idade
      }
    } else {
      const s3 = getD('tricipital') + getD('suprailiaca') + getD('coxa')
      if (s3 > 0) {
        densidade = 1.0994921 - 0.0009929 * s3 + 0.0000023 * s3 * s3 - 0.0001392 * idade
      }
    }
  } else if (protocolo === 'Faulkner') {
    // Faulkner calcula %G direto: %G = (TR + SE + SI + AB) * 0.153 + 5.783 (Homens) ou + 5.783 / 4.7
    const s4 = getD('tricipital') + getD('subescapular') + getD('suprailiaca') + getD('abdominal')
    if (s4 > 0) {
      pctGordura = s4 * 0.153 + 5.783
    }
  } else if (protocolo === 'Guedes (1985)') {
    if (sexo === 'M') {
      const s3 = getD('tricipital') + getD('suprailiaca') + getD('abdominal')
      if (s3 > 0) {
        densidade = 1.17136 - 0.06706 * Math.log10(s3)
      }
    } else {
      const s3 = getD('coxa') + getD('subescapular') + getD('suprailiaca')
      if (s3 > 0) {
        densidade = 1.1665 - 0.07063 * Math.log10(s3)
      }
    }
  } else if (protocolo === 'Petroski') {
    if (sexo === 'M') {
      const s4 =
        getD('subescapular') + getD('tricipital') + getD('suprailiaca') + getD('panturrilha_medial')
      if (s4 > 0) {
        densidade = 1.10726863 - 0.00081201 * s4 + 0.00000212 * s4 * s4 - 0.00041761 * idade
      }
    } else {
      const s4 =
        getD('axilar_media') + getD('suprailiaca') + getD('coxa') + getD('panturrilha_medial')
      if (s4 > 0) {
        densidade = 1.1954713 - 0.07513507 * Math.log10(s4) - 0.00041072 * idade
      }
    }
  } else if (protocolo === 'Durnin & Womersley') {
    const s4 = getD('biceps') + getD('tricipital') + getD('subescapular') + getD('suprailiaca')
    if (s4 > 0) {
      const logS4 = Math.log10(s4)
      if (sexo === 'M') {
        if (idade < 20) densidade = 1.162 - 0.063 * logS4
        else if (idade < 30) densidade = 1.1631 - 0.0632 * logS4
        else if (idade < 40) densidade = 1.1422 - 0.0544 * logS4
        else if (idade < 50) densidade = 1.162 - 0.07 * logS4
        else densidade = 1.1715 - 0.0779 * logS4
      } else {
        if (idade < 20) densidade = 1.1549 - 0.0678 * logS4
        else if (idade < 30) densidade = 1.1599 - 0.0717 * logS4
        else if (idade < 40) densidade = 1.1423 - 0.0632 * logS4
        else if (idade < 50) densidade = 1.1333 - 0.0612 * logS4
        else densidade = 1.1339 - 0.0645 * logS4
      }
    }
  } else if (protocolo === 'Penroze') {
    const s3 = getD('tricipital') + getD('subescapular') + getD('coxa')
    if (s3 > 0) {
      if (sexo === 'M') {
        densidade = 1.109 - 0.0008 * s3 - 0.00025 * idade
      } else {
        densidade = 1.098 - 0.0009 * s3 - 0.00015 * idade
      }
    }
  }

  // Conversão de Densidade para %G via Siri ou Brozek
  if (pctGordura === null && densidade !== null && densidade > 0) {
    if (formulaConversao === 'Brozek') {
      pctGordura = (4.57 / densidade - 4.142) * 100
    } else {
      // Siri (padrão Physical Test)
      pctGordura = (4.95 / densidade - 4.5) * 100
    }
  }

  if (pctGordura !== null) {
    pctGordura = Math.max(2, Math.min(65, Number(pctGordura.toFixed(2))))
  }

  // Cálculos de massas
  let massaGordaKg: number | null = null
  let massaMagraKg: number | null = null
  let pesoIdealEstimadoKg: number | null = null

  if (pctGordura !== null && pesoKg > 0) {
    massaGordaKg = Number(((pesoKg * pctGordura) / 100).toFixed(2))
    massaMagraKg = Number((pesoKg - massaGordaKg).toFixed(2))

    // Peso ideal estimado (considerando %G alvo médio: 15% para M, 22% para F)
    const pctGorduraAlvo = sexo === 'M' ? 0.15 : 0.22
    pesoIdealEstimadoKg = Number((massaMagraKg / (1 - pctGorduraAlvo)).toFixed(1))
  }

  // Classificação Guedes & Guedes por faixa etária e sexo
  let classificacaoGordura = null
  if (pctGordura !== null) {
    classificacaoGordura = classificarGorduraGuedes(pctGordura, sexo, idade)
  }

  return {
    densidadeCorporal: densidade ? Number(densidade.toFixed(4)) : null,
    percentualGordura: pctGordura,
    massaGordaKg,
    massaMagraKg,
    pesoIdealEstimadoKg,
    classificacaoGordura,
  }
}

// 4. Tabela de Classificação do % de Gordura por Guedes & Guedes
export const classificarGuedes = (pct: number, sexo: Sexo, idade: number) =>
  classificarGorduraGuedes(pct, sexo, idade)
export function classificarGorduraGuedes(pct: number, sexo: Sexo, idade: number) {
  // Faixas médias de Guedes & Guedes
  // Categorias: Baixo (Risco), Excelente/Bom, Médio (Ideal), Moderadamente Alto, Alto (Obesidade)
  let faixaIdealTexto = sexo === 'M' ? '12% – 16%' : '18% – 24%'
  let categoria = 'Médio / Aceitável'
  let cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'

  if (sexo === 'M') {
    if (pct < 6) {
      categoria = 'Excessivamente Baixo (Abaixo do essencial)'
      cor = 'text-amber-800 bg-amber-100 border-amber-300'
    } else if (pct < 12) {
      categoria = 'Excelente / Atlético'
      cor = 'text-blue-700 bg-blue-50 border-blue-200'
    } else if (pct <= 16) {
      categoria = 'Bom / Ideal (Padrão Saúde)'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (pct <= 20) {
      categoria = 'Médio / Limítrofe'
      cor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (pct <= 25) {
      categoria = 'Moderadamente Alto (Sobrepeso)'
      cor = 'text-orange-700 bg-orange-50 border-orange-200'
    } else {
      categoria = 'Alto / Excessivo (Obesidade)'
      cor = 'text-red-700 bg-red-50 border-red-200'
    }
  } else {
    // Feminino
    if (pct < 12) {
      categoria = 'Excessivamente Baixo (Abaixo do essencial)'
      cor = 'text-amber-800 bg-amber-100 border-amber-300'
    } else if (pct < 18) {
      categoria = 'Excelente / Atlética'
      cor = 'text-blue-700 bg-blue-50 border-blue-200'
    } else if (pct <= 24) {
      categoria = 'Bom / Ideal (Padrão Saúde)'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (pct <= 28) {
      categoria = 'Médio / Limítrofe'
      cor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (pct <= 33) {
      categoria = 'Moderadamente Alto (Sobrepeso)'
      cor = 'text-orange-700 bg-orange-50 border-orange-200'
    } else {
      categoria = 'Alto / Excessivo (Obesidade)'
      cor = 'text-red-700 bg-red-50 border-red-200'
    }
  }

  return { categoria, cor, faixaIdealTexto }
}

// 5. BANCO DE WELLS (Sentar e Alcançar) - Classificação
export function classificarBancoDeWells(melhorCm: number, sexo: Sexo, idade: number) {
  if (melhorCm === undefined || melhorCm === null) return null
  // Referência padrão Pollock / ACSM para Wells (cm)
  let classificacao = 'Média'
  let cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'

  if (sexo === 'M') {
    if (melhorCm >= 38) {
      classificacao = 'Excelente'
      cor = 'text-blue-700 bg-blue-50 border-blue-200'
    } else if (melhorCm >= 34) {
      classificacao = 'Acima da Média'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (melhorCm >= 29) {
      classificacao = 'Média'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (melhorCm >= 24) {
      classificacao = 'Abaixo da Média'
      cor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else {
      classificacao = 'Fraco / Insuficiente'
      cor = 'text-red-700 bg-red-50 border-red-200'
    }
  } else {
    if (melhorCm >= 40) {
      classificacao = 'Excelente'
      cor = 'text-blue-700 bg-blue-50 border-blue-200'
    } else if (melhorCm >= 36) {
      classificacao = 'Acima da Média'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (melhorCm >= 30) {
      classificacao = 'Média'
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else if (melhorCm >= 25) {
      classificacao = 'Abaixo da Média'
      cor = 'text-amber-700 bg-amber-50 border-amber-200'
    } else {
      classificacao = 'Fraco / Insuficiente'
      cor = 'text-red-700 bg-red-50 border-red-200'
    }
  }

  return { classificacao, cor }
}

// 6. FLEXITEST (Cláudio Gil Araújo) - 20 movimentos pontuados de 0 a 4
export const FLEXITEST_MOVIMENTOS = [
  { id: 1, nome: 'Flexão de Tornozelo' },
  { id: 2, nome: 'Extensão de Tornozelo' },
  { id: 3, nome: 'Flexão de Joelho' },
  { id: 4, nome: 'Extensão de Joelho' },
  { id: 5, nome: 'Flexão de Quadril' },
  { id: 6, nome: 'Extensão de Quadril' },
  { id: 7, nome: 'Adução de Quadril' },
  { id: 8, nome: 'Abdução de Quadril' },
  { id: 9, nome: 'Flexão de Tronco' },
  { id: 10, nome: 'Extensão de Tronco' },
  { id: 11, nome: 'Flexão Lateral de Tronco' },
  { id: 12, nome: 'Flexão de Punho' },
  { id: 13, nome: 'Extensão de Punho' },
  { id: 14, nome: 'Flexão de Cotovelo' },
  { id: 15, nome: 'Extensão de Cotovelo' },
  { id: 16, nome: 'Adução Posterior de Ombro' },
  { id: 17, nome: 'Extensão Posterior de Ombro' },
  { id: 18, nome: 'Flexão Lateral de Ombro (Abdução)' },
  { id: 19, nome: 'Rotação Medial de Ombro' },
  { id: 20, nome: 'Rotação Lateral de Ombro' },
]

export function classificarFlexitest(totalScore: number) {
  // Flexitest soma máxima = 80 pontos (20 movs * 4)
  // Classificação geral: Fraco (<30), Abaixo da média (30-39), Médio (40-49), Acima da média (50-59), Superior (≥60)
  if (totalScore < 30) {
    return { classificacao: 'Fraco', cor: 'text-red-700 bg-red-50 border-red-200' }
  } else if (totalScore < 40) {
    return { classificacao: 'Abaixo da Média', cor: 'text-amber-700 bg-amber-50 border-amber-200' }
  } else if (totalScore < 50) {
    return { classificacao: 'Médio', cor: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  } else if (totalScore < 60) {
    return { classificacao: 'Acima da Média', cor: 'text-blue-700 bg-blue-50 border-blue-200' }
  } else {
    return {
      classificacao: 'Superior / Excelente',
      cor: 'text-purple-700 bg-purple-50 border-purple-200',
    }
  }
}

// 7. MCGILL TORSO ENDURANCE TESTS (Core)
export interface McGillCalculos {
  razaoFlexaoExtensao: number | null
  razaoLateralExtensao: number | null
  razaoLateralD_E: number | null
  equilibrado: boolean
  alertas: string[]
}

export function calcularMcGillIndices(dados: {
  flexaoTroncoSeg?: number
  extensaoBieringSeg?: number
  pranchaLatDirSeg?: number
  pranchaLatEsqSeg?: number
}): McGillCalculos {
  const f = Number(dados.flexaoTroncoSeg) || 0
  const e = Number(dados.extensaoBieringSeg) || 0
  const ld = Number(dados.pranchaLatDirSeg) || 0
  const le = Number(dados.pranchaLatEsqSeg) || 0

  const alertas: string[] = []

  let rf_e: number | null = null
  if (e > 0 && f > 0) {
    rf_e = Number((f / e).toFixed(2))
    // Padrão McGill: Flexão / Extensão deve ser < 1.0 (ideal ~ 0.75 - 1.0)
    if (rf_e > 1.0) {
      alertas.push(
        `Razão Flexores/Extensores (${rf_e}) > 1,0: extensores de coluna enfraquecidos em relação aos flexores`,
      )
    }
  }

  let rld_e: number | null = null
  if (ld > 0 && le > 0) {
    rld_e = Number((ld / le).toFixed(2))
    // Padrão: Lateral D / Lateral E deve estar entre 0.95 e 1.05 (ou assimetria < 10-15%)
    if (rld_e < 0.85 || rld_e > 1.15) {
      alertas.push(
        `Assimetria de pranchas laterais (${rld_e}): desequilíbrio > 15% entre lado D e E`,
      )
    }
  }

  let rlat_ext: number | null = null
  if (e > 0 && (ld > 0 || le > 0)) {
    const latMedia = ((ld || le) + (le || ld)) / 2
    rlat_ext = Number((latMedia / e).toFixed(2))
    // Padrão: Lateral / Extensão ideal < 0.75 (típico ~ 0.40 - 0.70)
    if (rlat_ext > 0.75) {
      alertas.push(`Razão Ponte Lateral / Extensores (${rlat_ext}) elevada`)
    }
  }

  return {
    razaoFlexaoExtensao: rf_e,
    razaoLateralExtensao: rlat_ext,
    razaoLateralD_E: rld_e,
    equilibrado: alertas.length === 0,
    alertas,
  }
}

// 8. FMS — FUNCTIONAL MOVEMENT SCREEN (7 Testes + Clears)
export interface FMSTesteConfig {
  id: string
  nome: string
  bilateral: boolean
  hasClear: boolean
  clearNome?: string
  criterios: {
    3: string
    2: string
    1: string
    0: string
  }
}

export const FMS_TESTES_LISTA: FMSTesteConfig[] = [
  {
    id: 'deep_squat',
    nome: '1. Agachamento Profundo (Deep Squat)',
    bilateral: false,
    hasClear: false,
    criterios: {
      3: 'Tronco paralelo à tíbia ou vertical; fêmur abaixo da horizontal; joelhos alinhados; bastão sobre a cabeça',
      2: 'Realiza com compensação (ex: calcanhares elevados na prancha de apoio)',
      1: 'Não atinge profundidade, perde o alinhamento ou não mantém o bastão acima da cabeça',
      0: 'Dor durante qualquer fase da execução',
    },
  },
  {
    id: 'hurdle_step',
    nome: '2. Passada com Barreira (Hurdle Step)',
    bilateral: true,
    hasClear: false,
    criterios: {
      3: 'Quadril, joelho e tornozelo alinhados no plano sagital; sem movimento compensatório na coluna',
      2: 'Perda do alinhamento ou inclinação do tronco/coluna lombar',
      1: 'Toca na fita/barreira ou perde o equilíbrio',
      0: 'Dor durante o movimento',
    },
  },
  {
    id: 'inline_lunge',
    nome: '3. Afundo na Linha (Inline Lunge)',
    bilateral: true,
    hasClear: false,
    criterios: {
      3: 'Bastão mantém 3 pontos de contato (cabeça, torácica e sacro); joelho toca a prancha atrás do calcanhar',
      2: 'Perda do alinhamento do tronco, movimento compensatório ou perda de contato com o bastão',
      1: 'Perda de equilíbrio ou incapacidade de completar a descida',
      0: 'Dor em qualquer repetição',
    },
  },
  {
    id: 'shoulder_mobility',
    nome: '4. Mobilidade de Ombro (Shoulder Mobility)',
    bilateral: true,
    hasClear: true,
    clearNome: 'Clearing Test de Impingement / Dor no Ombro (mão no ombro oposto com elevação)',
    criterios: {
      3: 'Punhos a menos de 1 comprimento da mão de distância',
      2: 'Punhos a menos de 1,5 comprimento da mão de distância',
      1: 'Punhos a mais de 1,5 comprimento da mão de distância',
      0: 'Dor no teste ou clearing test positivo',
    },
  },
  {
    id: 'aslr',
    nome: '5. Elevação Ativa de Perna Reta (ASLR)',
    bilateral: true,
    hasClear: false,
    criterios: {
      3: 'Maléolo da perna elevada ultrapassa o ponto médio da coxa contralateral sem rotação',
      2: 'Maléolo fica entre o ponto médio da coxa e a patela',
      1: 'Maléolo fica abaixo da patela',
      0: 'Dor durante a elevação',
    },
  },
  {
    id: 'trunk_stability',
    nome: '6. Estabilidade de Tronco com Flexão (Push-up)',
    bilateral: false,
    hasClear: true,
    clearNome: 'Clearing Test de Extensão de Coluna (Press-up com dor lombar)',
    criterios: {
      3: 'Homens: polegares alinhados com o topo da testa / Mulheres: queixo — 1 repetição perfeita',
      2: 'Homens: polegares alinhados com queixo / Mulheres: clavícula — com tronco em bloco',
      1: 'Incapaz de realizar com alinhamento ou hiperextende lombar',
      0: 'Dor no teste ou clearing test de extensão positivo',
    },
  },
  {
    id: 'rotary_stability',
    nome: '7. Estabilidade Rotacional (Rotary Stability)',
    bilateral: true,
    hasClear: true,
    clearNome: 'Clearing Test de Flexão de Coluna (Postura da criança com dor lombar)',
    criterios: {
      3: 'Realiza repetição ipsilateral unilateral perfeita mantendo tronco paralelo',
      2: 'Realiza repetição diagonal contralateral correta (cotovelo toca joelho)',
      1: 'Incapaz de realizar diagonal mantendo estabilidade',
      0: 'Dor no teste ou clearing test de flexão positivo',
    },
  },
]

export function calcularFMS(dados: Record<string, any>) {
  let scoreTotal = 0
  let assimetrias = 0
  const detalhesPorTeste: Array<{
    id: string
    nome: string
    notaDireita?: number
    notaEsquerda?: number
    notaFinal: number
    assimetrico: boolean
    dor: boolean
  }> = []

  for (const t of FMS_TESTES_LISTA) {
    if (t.bilateral) {
      let nD = Number(dados[`${t.id}_d`])
      let nE = Number(dados[`${t.id}_e`])
      if (isNaN(nD)) nD = 0
      if (isNaN(nE)) nE = 0

      // Se houver clearing test positivo (dor), a nota final é zero
      const clearDor = Boolean(dados[`${t.id}_clear_dor`])
      if (clearDor) {
        nD = 0
        nE = 0
      }

      const notaFinal = Math.min(nD, nE)
      const assimetrico = nD !== nE

      if (assimetrico) assimetrias++
      scoreTotal += notaFinal

      detalhesPorTeste.push({
        id: t.id,
        nome: t.nome,
        notaDireita: nD,
        notaEsquerda: nE,
        notaFinal,
        assimetrico,
        dor: clearDor || nD === 0 || nE === 0,
      })
    } else {
      let n = Number(dados[t.id])
      if (isNaN(n)) n = 0

      const clearDor = Boolean(dados[`${t.id}_clear_dor`])
      if (clearDor) n = 0

      scoreTotal += n
      detalhesPorTeste.push({
        id: t.id,
        nome: t.nome,
        notaFinal: n,
        assimetrico: false,
        dor: clearDor || n === 0,
      })
    }
  }

  // Classificação de Risco FMS
  let classificacaoRisco = 'Sem Restrições (>14)'
  let corRisco = 'text-emerald-700 bg-emerald-50 border-emerald-200'

  if (scoreTotal <= 7) {
    classificacaoRisco = 'Alto Risco de Lesão (<7 pontos)'
    corRisco = 'text-red-700 bg-red-100 border-red-300'
  } else if (scoreTotal <= 14) {
    classificacaoRisco = 'Risco Aumentado de Lesão (≤14 pontos)'
    corRisco = 'text-amber-800 bg-amber-50 border-amber-300'
  }

  return {
    scoreTotal,
    assimetrias,
    classificacaoRisco,
    corRisco,
    detalhesPorTeste,
  }
}
