import * as XLSX from 'xlsx'
import type {
  PacienteRecord,
  AvaliacaoFisioterapiaRecord,
  EvolucaoRecord,
  QueixaItem,
  ViscerasSistemicas,
  HabitosSaude,
  ForcaCoreTabela,
  TestesEspeciaisSegmento,
  SecoesComplementaresFisio,
} from '@/types/database'
import {
  SEGMENTOS_ADM_PADRAO,
  TESTES_ESPECIAIS_PADRAO,
  VALORES_REFERENCIA_CORE,
} from '@/lib/fisioterapiaModel'
import {
  parseBirthDateToISO,
  normalizeCPF,
  normalizePhone,
} from '@/components/ModalImportarPacientes'

// Normalização de rótulos e strings para correspondência resiliente
export function normalizeLabel(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[:\-–—_]/g, ' ') // substitui pontuações por espaço
    .replace(/\s+/g, ' ') // múltiplos espaços em um
    .trim()
}

// Converte valores variados de data (serial Excel, Date, string) em string ISO ou DD/MM/AAAA
export function parseExcelDate(val: unknown): { iso?: string; formatted?: string } {
  if (!val) return {}

  // Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return {
      iso: `${y}-${m}-${d} 00:00:00.000Z`,
      formatted: `${d}/${m}/${y}`,
    }
  }

  // Serial number Excel (ex: 45200)
  if (typeof val === 'number' && val > 20000 && val < 70000) {
    try {
      const parsed = XLSX.SSF.parse_date_code(val)
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const y = parsed.y
        const m = String(parsed.m).padStart(2, '0')
        const d = String(parsed.d).padStart(2, '0')
        return {
          iso: `${y}-${m}-${d} 00:00:00.000Z`,
          formatted: `${d}/${m}/${y}`,
        }
      }
    } catch {
      // continua
    }
  }

  const str = String(val).trim()
  if (!str) return {}

  // DD/MM/AAAA ou DD-MM-AAAA
  const slashMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0')
    const m = slashMatch[2].padStart(2, '0')
    const y = slashMatch[3]
    return {
      iso: `${y}-${m}-${d} 00:00:00.000Z`,
      formatted: `${d}/${m}/${y}`,
    }
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = isoMatch[2].padStart(2, '0')
    const d = isoMatch[3].padStart(2, '0')
    return {
      iso: `${y}-${m}-${d} 00:00:00.000Z`,
      formatted: `${d}/${m}/${y}`,
    }
  }

  // Tentativa Date.parse
  const ts = Date.parse(str)
  if (!isNaN(ts)) {
    const dObj = new Date(ts)
    const y = dObj.getUTCFullYear()
    const m = String(dObj.getUTCMonth() + 1).padStart(2, '0')
    const d = String(dObj.getUTCDate()).padStart(2, '0')
    if (y >= 1920 && y <= 2100) {
      return {
        iso: `${y}-${m}-${d} 00:00:00.000Z`,
        formatted: `${d}/${m}/${y}`,
      }
    }
  }

  return { formatted: str }
}

// Estruturas do resultado do parsing
export interface ParsedAnamneseData {
  nome: string
  cpf: string
  dataNascimento?: string
  idade?: string | number
  peso?: string | number
  altura?: string | number
  endereco: string
  contato: string
  profissao: string
  diagnosticoMedico: string
  objetivos: string
  queixaPrincipal: string
  desdeQuando: string
  tipoDor: string
  eva: number
  historico: string
  piorMomentoDia: string
  movimentoPiora: string
  oQueAlivia: string
  acidentesTraumas: string
  atividadeFisica: string
  cirurgias: string
  medicamentos: string
  tratamentosAnteriores: string
  dataAvaliacao?: string
  visceras: ViscerasSistemicas
  habitos: HabitosSaude
  examesComplementares: string[]
  linhasNaoMapeadas: Array<{ rotulo: string; valor: string }>
}

export interface ParsedExameFisicoData {
  inspecaoEstatica: Record<string, string>
  palpacao: string
  mobilidadeAtiva: string
  dor: string
  amplitudeMovimentoPassiva: string
  testesCaptores: Record<string, string>
  marcadoresBiologicos: Record<string, string>
  linhasExtras: Array<{ topico: string; valor: string }>
}

export interface ParsedEvolucaoItem {
  data: string
  dataIso?: string
  avaliacaoNotas: string[]
  evolucaoProcedimentos: string[]
  textoCompleto: string
}

export interface ParsedTestesFuncionaisData {
  dataTeste?: string
  pranchaVentral?: number | string
  pranchaLateralD?: number | string
  pranchaLateralE?: number | string
  ponteUniD?: number | string
  ponteUniE?: number | string
  referenciasUtilizadas?: Record<string, any>
  comparativos?: Record<string, any>
  historicoMultiplosTestes?: Array<{
    coluna: string
    valores: Record<string, number | string>
  }>
}

export interface ParsedCirtometriaData {
  medidas: Record<string, { esquerdo?: string; direito?: string }>
  fases?: Array<{
    coluna: string
    medidas: Record<string, { esquerdo?: string; direito?: string }>
  }>
}

export interface ParsedGoniometriaData {
  medicoes: Array<{
    segmento: string
    data?: string
    esquerdo?: string | number
    direito?: string | number
  }>
}

export interface ParsedTestesEspeciaisData {
  ombro?: Array<{
    nome: string
    direito?: string
    esquerdo?: string
    estrutura?: string
    comoRealizar?: string
  }>
  outros?: Array<{
    aba: string
    linhas: Array<Record<string, any>>
  }>
}

export interface ParsedPodalData {
  elementosPrescritos?: string[]
  testesBiomecanicos?: Record<string, any>
  avaliacaoPostural?: Record<string, any>
}

export interface ParsedPlanilhaAvaliacao {
  arquivoNome: string
  abasEncontradas: string[]
  pacienteIdentificado: {
    nome: string
    cpf: string
    dataNascimento?: string
    idade?: string | number
    endereco?: string
    contato?: string
    profissao?: string
  }
  anamnese: ParsedAnamneseData
  exameFisico: ParsedExameFisicoData
  evolucoes: ParsedEvolucaoItem[]
  testesFuncionais: ParsedTestesFuncionaisData
  cirtometria: ParsedCirtometriaData
  goniometria: ParsedGoniometriaData
  testesEspeciais: ParsedTestesEspeciaisData
  podal: ParsedPodalData
  dadosExtrasImportados: Record<string, any>
  diagnosticoImportacao: {
    camposReconhecidos: string[]
    camposNaoEncontrados: string[]
    abasReconhecidas: string[]
    abasNaoReconhecidas: string[]
  }
}

// Parser Genérico Principal da Planilha
export function parseAvaliacaoWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
): ParsedPlanilhaAvaliacao {
  const sheetNames = workbook.SheetNames || []

  // Normaliza busca de abas tolerante a espaços extras, pontuações, maiúsculas/minúsculas e acentuação
  const findSheet = (keywords: string[]): XLSX.WorkSheet | null => {
    // 1. Match exato normalizado
    for (const kw of keywords) {
      const targetNorm = normalizeLabel(kw)
      const foundName = sheetNames.find((s) => normalizeLabel(s) === targetNorm)
      if (foundName && workbook.Sheets[foundName]) {
        return workbook.Sheets[foundName]
      }
    }
    // 2. Match onde o nome da aba contém a palavra-chave inteira normalizada
    for (const kw of keywords) {
      const targetNorm = normalizeLabel(kw)
      if (!targetNorm) continue
      const foundName = sheetNames.find((s) => {
        const norm = normalizeLabel(s)
        return norm.includes(targetNorm) || targetNorm.includes(norm)
      })
      if (foundName && workbook.Sheets[foundName]) {
        return workbook.Sheets[foundName]
      }
    }
    // 3. Match de tokens / palavras sem ordem
    for (const kw of keywords) {
      const kwTokens = normalizeLabel(kw).split(' ').filter(Boolean)
      if (kwTokens.length === 0) continue
      const foundName = sheetNames.find((s) => {
        const norm = normalizeLabel(s)
        return kwTokens.every((token) => norm.includes(token))
      })
      if (foundName && workbook.Sheets[foundName]) {
        return workbook.Sheets[foundName]
      }
    }
    return null
  }

  // 1. ANAMNESE
  const anamneseSheet = findSheet(['ANAMNESE', 'Anamnese', 'ANAMNESE CLINICA'])
  const parsedAnamnese = parseAnamneseSheet(anamneseSheet)

  // 2. EXAME FÍSICO
  const exameFisicoSheet = findSheet([
    'EXAME FÍSICO',
    'EXAME FISICO',
    'Exame Físico',
    'Exame Fisico',
  ])
  const parsedExameFisico = parseExameFisicoSheet(exameFisicoSheet)

  // 3. EVOLUÇÃO
  const evolucaoSheet = findSheet([
    'Evolução',
    'Evolucao',
    'EVOLUÇÃO',
    'EVOLUCAO',
    'Evoluções',
    'Evolucoes',
  ])
  const parsedEvolucoes = parseEvolucaoSheet(evolucaoSheet)

  // 4. TESTES FUNCIONAIS (Core / McGill / Prancha)
  const testesFuncionaisSheet = findSheet([
    'Testes Funcionais',
    'TESTES FUNCIONAIS',
    'Funcionais',
    'Planilha1', // fallback comum na pasta do usuário
  ])
  const parsedTestesFuncionais = parseTestesFuncionaisSheet(testesFuncionaisSheet)

  // 5. CIRTOMETRIA
  const cirtometriaSheet = findSheet(['Cirtometria', 'CIRTOMETRIA', 'Perimetria', 'PERIMETRIA'])
  const parsedCirtometria = parseCirtometriaSheet(cirtometriaSheet)

  // 6. GONIOMETRIA
  const goniometriaSheet = findSheet(['Goniometria', 'GONIOMETRIA', 'ADM'])
  const parsedGoniometria = parseGoniometriaSheet(goniometriaSheet)

  // 7. TESTES ESPECIAIS (Ombro / Osteopáticos)
  const ombroSheet = findSheet([
    'Testes Especiais OMBRO',
    'TESTES ESPECIAIS OMBRO',
    'Ombro',
    'OMBRO',
  ])
  const osteoSheet = findSheet([
    'TESTES OSTEOPÁTICOS',
    'TESTES OSTEOPATICOS',
    'Testes Osteopáticos',
    'Osteopatia',
  ])
  const parsedTestesEspeciais = parseTestesEspeciaisSheets(ombroSheet, osteoSheet)

  // 8. PÉ E PALMILHA
  const peAvaliacaoSheet = findSheet([
    'Pé - Avaliação',
    'Pe - Avaliacao',
    'Avaliação do Pé',
    'Avaliacao do Pe',
  ])
  const avaliacaoPeSheet = findSheet(['Avaliação do Pé', 'Avaliacao do Pe'])
  const parsedPodal = parsePodalSheets(peAvaliacaoSheet, avaliacaoPeSheet)

  // Identificação do Paciente prioritária da aba ANAMNESE (com fallback inteligente)
  let fallbackNome = parsedAnamnese.nome || ''
  let fallbackDataNasc = parsedAnamnese.dataNascimento

  // Se o nome não veio da Anamnese, tenta extrair do próprio nome do arquivo
  // Ex: "avaliacao-eduardo-magalhaes-sarmento-afonso-905b2.xlsx" -> "Eduardo Magalhaes Sarmento Afonso"
  if (!fallbackNome && fileName) {
    const cleanFile = fileName.replace(/\.xlsx?$/i, '')
    // Remove hash final se houver (ex: "-905b2")
    const semHash = cleanFile.replace(/[-_][a-f0-9]{4,10}$/i, '')
    // Remove prefixos comuns ("avaliacao-", "prontuario-", "ficha-")
    const semPrefixo = semHash.replace(/^(avaliacao|prontuario|ficha|paciente)[-_]/i, '')
    if (semPrefixo && semPrefixo.length > 3) {
      fallbackNome = semPrefixo
        .split(/[-_]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    }
  }

  const pacienteIdentificado = {
    nome: fallbackNome,
    cpf: normalizeCPF(parsedAnamnese.cpf) || '',
    dataNascimento: fallbackDataNasc,
    idade: parsedAnamnese.idade,
    endereco: parsedAnamnese.endereco || '',
    contato: normalizePhone(parsedAnamnese.contato) || parsedAnamnese.contato || '',
    profissao: parsedAnamnese.profissao || '',
  }

  // Diagnóstico de importação para transparência ao usuário
  const camposReconhecidos: string[] = []
  const camposNaoEncontrados: string[] = []

  if (pacienteIdentificado.nome) camposReconhecidos.push('Nome do Paciente')
  else camposNaoEncontrados.push('Nome do Paciente')

  if (pacienteIdentificado.idade)
    camposReconhecidos.push(`Idade (${pacienteIdentificado.idade} anos)`)
  else if (pacienteIdentificado.dataNascimento) camposReconhecidos.push('Data de Nascimento')
  else camposNaoEncontrados.push('Idade / Data de Nascimento')

  if (pacienteIdentificado.cpf) camposReconhecidos.push('CPF')
  else camposNaoEncontrados.push('CPF')

  if (pacienteIdentificado.contato) camposReconhecidos.push('Telefone / Contato')
  else camposNaoEncontrados.push('Telefone / Contato')

  if (pacienteIdentificado.profissao) camposReconhecidos.push('Profissão')
  else camposNaoEncontrados.push('Profissão')

  if (parsedAnamnese.queixaPrincipal) camposReconhecidos.push('Queixa Principal')
  else camposNaoEncontrados.push('Queixa Principal')

  if (parsedAnamnese.historico) camposReconhecidos.push('Histórico Clínico')
  else camposNaoEncontrados.push('Histórico Clínico')

  if (parsedAnamnese.eva) camposReconhecidos.push(`EVA da Dor (${parsedAnamnese.eva})`)
  else camposNaoEncontrados.push('EVA da Dor')

  if (parsedAnamnese.examesComplementares.length > 0)
    camposReconhecidos.push(`${parsedAnamnese.examesComplementares.length} Laudos de Exames`)

  if (parsedEvolucoes.length > 0)
    camposReconhecidos.push(`${parsedEvolucoes.length} Sessões de Evolução`)

  const abasReconhecidas: string[] = []
  const abasNaoReconhecidas: string[] = []

  // Abas adicionais não comerciais guardadas em extras para garantir que nada se perde
  const dadosExtrasImportados: Record<string, any> = {}
  for (const name of sheetNames) {
    const norm = normalizeLabel(name)
    // Ignorar propostas comerciais explicitamente solicitadas na regra
    if (norm.includes('proposta')) continue

    // Se não for uma das processadas nativamente
    const conhecidas = [
      'anamnese',
      'exame fisico',
      'evolucao',
      'evolucoes',
      'testes funcionais',
      'planilha1',
      'cirtometria',
      'perimetria',
      'goniometria',
      'testes especiais ombro',
      'testes osteopaticos',
      'pe avaliacao',
      'avaliacao do pe',
    ]
    const isConhecida = conhecidas.some((c) => norm.includes(c))
    if (isConhecida) {
      abasReconhecidas.push(name)
    } else {
      abasNaoReconhecidas.push(name)
      if (workbook.Sheets[name]) {
        try {
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' })
          dadosExtrasImportados[name] = json
        } catch {
          // ignora
        }
      }
    }
  }

  return {
    arquivoNome: fileName,
    abasEncontradas: sheetNames,
    pacienteIdentificado,
    anamnese: parsedAnamnese,
    exameFisico: parsedExameFisico,
    evolucoes: parsedEvolucoes,
    testesFuncionais: parsedTestesFuncionais,
    cirtometria: parsedCirtometria,
    goniometria: parsedGoniometria,
    testesEspeciais: parsedTestesEspeciais,
    podal: parsedPodal,
    dadosExtrasImportados,
    diagnosticoImportacao: {
      camposReconhecidos,
      camposNaoEncontrados,
      abasReconhecidas,
      abasNaoReconhecidas,
    },
  }
}

// -------------------------------------------------------------
// Sub-parsers por aba
// -------------------------------------------------------------

function parseAnamneseSheet(sheet: XLSX.WorkSheet | null): ParsedAnamneseData {
  const result: ParsedAnamneseData = {
    nome: '',
    cpf: '',
    endereco: '',
    contato: '',
    profissao: '',
    diagnosticoMedico: '',
    objetivos: '',
    queixaPrincipal: '',
    desdeQuando: '',
    tipoDor: '',
    eva: 0,
    historico: '',
    piorMomentoDia: '',
    movimentoPiora: '',
    oQueAlivia: '',
    acidentesTraumas: '',
    atividadeFisica: '',
    cirurgias: '',
    medicamentos: '',
    tratamentosAnteriores: '',
    visceras: {},
    habitos: {},
    examesComplementares: [],
    linhasNaoMapeadas: [],
  }

  if (!sheet) return result

  // Ler como matriz de células (linhas x colunas)
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!rows || rows.length === 0) return result

  // Contexto de acumulação: rótulo atual para linhas de continuação
  let currentTargetCategory:
    | 'historico'
    | 'acidentesTraumas'
    | 'atividadeFisica'
    | 'exames'
    | 'visceras'
    | 'habitos'
    | 'cirurgias'
    | 'medicamentos'
    | 'tratamentosAnteriores'
    | 'outro'
    | null = null
  let currentSubKey = ''

  // Sub-rótulos de vísceras
  const viscerasMap: Record<string, keyof ViscerasSistemicas> = {
    esofago: 'esofago',
    estomago: 'estomago',
    intestino: 'intestino',
    coracao: 'coracao',
    pulmao: 'pulmao',
    rim: 'rim',
    bexiga: 'bexiga',
    prostata: 'prostata_utero_ovario',
    utero: 'prostata_utero_ovario',
    ovario: 'prostata_utero_ovario',
    figado: 'figado',
    vesicula: 'vesicula',
    pancreas: 'pancreas',
    tireoide: 'tireoide',
    olhos: 'olhos',
    dente: 'dente',
    ites: 'ites',
    endocrina: 'endocrina',
    alergias: 'alergias',
  }

  // Percorre as linhas
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    // Encontra a primeira célula não vazia como rótulo candidato (normalmente col 0, mas tolera indentação)
    let labelColIdx = -1
    for (let c = 0; c < Math.min(3, row.length); c++) {
      if (row[c] !== undefined && String(row[c]).trim() !== '') {
        labelColIdx = c
        break
      }
    }

    const col0Raw = labelColIdx !== -1 ? String(row[labelColIdx]).trim() : ''

    // Se a própria célula do rótulo contiver dois pontos ou quebra de linha com valor embutido (ex: "Nome: Fulano de Tal")
    let embeddedVal = ''
    let cleanedLabel = col0Raw
    if (col0Raw.includes(':')) {
      const splitIdx = col0Raw.indexOf(':')
      const possibleLabel = col0Raw.substring(0, splitIdx).trim()
      const possibleVal = col0Raw.substring(splitIdx + 1).trim()
      // Se a parte após os dois pontos tiver conteúdo substantivo, usamos como valor
      if (possibleVal) {
        cleanedLabel = possibleLabel
        embeddedVal = possibleVal
      }
    }

    // Valor pode estar na célula ao lado (a partir de labelColIdx + 1), ou no embeddedVal, ou na linha de baixo (se célula mesclada vertical)
    let valRaw = embeddedVal
    if (!valRaw) {
      for (let c = labelColIdx + 1; c < row.length; c++) {
        if (row[c] !== undefined && String(row[c]).trim() !== '') {
          valRaw = String(row[c]).trim()
          break
        }
      }
    }

    const normLabel = normalizeLabel(cleanedLabel || col0Raw)

    // Se ainda não encontrou valor ao lado, mas o rótulo é conhecido (ex: Nome, Idade, Queixa), checa se o valor está na linha imediatamente abaixo (célula vertical mesclada)
    if (!valRaw && i + 1 < rows.length) {
      const nextRow = rows[i + 1]
      if (nextRow) {
        const nextCol0 =
          nextRow[labelColIdx !== -1 ? labelColIdx : 0] !== undefined
            ? String(nextRow[labelColIdx !== -1 ? labelColIdx : 0]).trim()
            : ''
        // Se a linha de baixo não é um novo rótulo conhecido
        const normNext = normalizeLabel(nextCol0)
        const isNextLabel = [
          'nome',
          'cpf',
          'idade',
          'dn',
          'peso',
          'altura',
          'endereco',
          'contato',
          'profissao',
          'queixa',
          'eva',
          'historico',
          'objetivos',
          'diagnostico',
        ].some((k) => normNext.startsWith(k))

        if (!isNextLabel) {
          for (let c = 0; c < nextRow.length; c++) {
            if (nextRow[c] !== undefined && String(nextRow[c]).trim() !== '') {
              valRaw = String(nextRow[c]).trim()
              break
            }
          }
        }
      }
    }

    // Detecção de linha sem rótulo ou linha de continuação
    if (!col0Raw) {
      if (valRaw && currentTargetCategory) {
        appendContinuation(result, currentTargetCategory, currentSubKey, valRaw)
      }
      continue
    }

    // Se col0 tem texto mas não é um rótulo conhecido, pode ser um sub-rótulo ou continuação
    // 1. Data da avaliação
    if (normLabel.includes('data da avaliacao') || normLabel.startsWith('data avaliacao')) {
      const dt = parseExcelDate(valRaw || col0Raw)
      result.dataAvaliacao = dt.iso || dt.formatted
      currentTargetCategory = null
      continue
    }

    // 2. Identificação cadastral
    if (
      normLabel === 'nome' ||
      normLabel === 'nome completo' ||
      normLabel === 'nome do paciente' ||
      normLabel === 'paciente' ||
      normLabel.startsWith('nome:') ||
      normLabel.startsWith('nome ')
    ) {
      result.nome = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'dn' ||
      normLabel === 'd n' ||
      normLabel === 'data nasc' ||
      normLabel === 'data de nascimento' ||
      normLabel === 'data nascimento' ||
      normLabel === 'nascimento' ||
      normLabel.startsWith('dn:') ||
      normLabel.startsWith('d n') ||
      normLabel.includes('data de nascimento') ||
      normLabel.includes('data nascimento')
    ) {
      const dt = parseExcelDate(valRaw)
      result.dataNascimento = dt.iso || parseBirthDateToISO(valRaw)
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'idade' ||
      normLabel === 'idade anos' ||
      normLabel.startsWith('idade:') ||
      normLabel.startsWith('idade ')
    ) {
      result.idade = valRaw
      currentTargetCategory = null
      continue
    }
    if (normLabel === 'peso' || normLabel.startsWith('peso:') || normLabel.startsWith('peso ')) {
      result.peso = valRaw.replace(',', '.')
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'altura' ||
      normLabel.startsWith('altura:') ||
      normLabel.startsWith('altura ')
    ) {
      result.altura = valRaw.replace(',', '.')
      currentTargetCategory = null
      continue
    }
    if (normLabel === 'cpf' || normLabel.startsWith('cpf:') || normLabel.startsWith('cpf ')) {
      result.cpf = normalizeCPF(valRaw)
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'endereco' ||
      normLabel === 'endereco completo' ||
      normLabel.startsWith('endereco:') ||
      normLabel.startsWith('endereco ')
    ) {
      result.endereco = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'contato' ||
      normLabel === 'telefone' ||
      normLabel === 'celular' ||
      normLabel === 'whatsapp' ||
      normLabel.startsWith('contato:') ||
      normLabel.startsWith('contato ') ||
      normLabel.startsWith('telefone:') ||
      normLabel.startsWith('telefone ') ||
      normLabel.includes('telefone') ||
      normLabel.includes('celular')
    ) {
      result.contato = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'profissao' ||
      normLabel === 'ocupacao' ||
      normLabel === 'trabalho' ||
      normLabel.startsWith('profissao:') ||
      normLabel.startsWith('profissao ')
    ) {
      result.profissao = valRaw
      currentTargetCategory = null
      continue
    }

    // 3. Queixas e anamnese clínica
    if (
      normLabel === 'diagnostico medico' ||
      normLabel.startsWith('diagnostico medico') ||
      normLabel.startsWith('diagnostico')
    ) {
      result.diagnosticoMedico = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'objetivos' ||
      normLabel.startsWith('objetivos') ||
      normLabel.includes('objetivo do tratamento')
    ) {
      result.objetivos = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'queixa principal' ||
      normLabel.startsWith('queixa principal') ||
      normLabel === 'queixa' ||
      normLabel.startsWith('queixa:') ||
      normLabel.startsWith('queixa ') ||
      normLabel.includes('motivo da consulta') ||
      normLabel.includes('motivo principal')
    ) {
      result.queixaPrincipal = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'desde quando' ||
      normLabel.startsWith('desde quando') ||
      normLabel.includes('tempo de evolucao') ||
      normLabel.includes('inicio dos sintomas')
    ) {
      result.desdeQuando = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'tipo' ||
      normLabel === 'tipo dor' ||
      normLabel.startsWith('tipo de dor') ||
      normLabel.startsWith('tipo dor') ||
      normLabel.startsWith('caracteristica da dor')
    ) {
      result.tipoDor = valRaw
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'eva' ||
      normLabel.startsWith('eva:') ||
      normLabel.startsWith('eva ') ||
      normLabel.includes('escala visual') ||
      normLabel.includes('nivel da dor') ||
      normLabel.includes('escala de dor')
    ) {
      const numMatch = valRaw.match(/\d+([.,]\d+)?/)
      if (numMatch) {
        result.eva = parseFloat(numMatch[0].replace(',', '.'))
      }
      currentTargetCategory = null
      continue
    }
    if (
      normLabel === 'historico' ||
      normLabel.startsWith('historico') ||
      normLabel.includes('hda') ||
      normLabel.includes('historia da doenca')
    ) {
      result.historico = valRaw
      currentTargetCategory = 'historico'
      continue
    }
    if (normLabel.includes('pior momento do dia') || normLabel.includes('pior momento dia')) {
      result.piorMomentoDia = valRaw
      currentTargetCategory = null
      continue
    }
    if (normLabel.includes('movimento que piora a dor') || normLabel.includes('movimento piora')) {
      result.movimentoPiora = valRaw
      currentTargetCategory = null
      continue
    }
    if (normLabel.includes('o que alivia a dor') || normLabel.includes('alivia dor')) {
      result.oQueAlivia = valRaw
      currentTargetCategory = null
      continue
    }
    if (normLabel.includes('acidentes') || normLabel.includes('traumas')) {
      result.acidentesTraumas = valRaw
      currentTargetCategory = 'acidentesTraumas'
      continue
    }
    if (
      normLabel.includes('atividade fisica') &&
      !normLabel.includes('habito') &&
      currentTargetCategory !== 'habitos'
    ) {
      result.atividadeFisica = valRaw
      currentTargetCategory = 'atividadeFisica'
      continue
    }
    if (normLabel.includes('cirurgias')) {
      result.cirurgias = valRaw
      currentTargetCategory = 'cirurgias'
      continue
    }
    if (
      normLabel.includes('medicacao') ||
      normLabel.includes('medicamento') ||
      normLabel.includes('suplementacao terapeutica')
    ) {
      result.medicamentos = valRaw
      currentTargetCategory = 'medicamentos'
      continue
    }
    if (normLabel.includes('tratamentos anteriores')) {
      result.tratamentosAnteriores = valRaw
      currentTargetCategory = 'tratamentosAnteriores'
      continue
    }

    // 4. Seção Vísceras
    if (normLabel.includes('visceras') || normLabel.includes('questoes sistemicas')) {
      currentTargetCategory = 'visceras'
      continue
    }
    // Verifica sub-rótulos de vísceras
    let matchedViscera = false
    for (const [k, field] of Object.entries(viscerasMap)) {
      if (normLabel === k || normLabel.startsWith(k + ' ') || normLabel.includes(k)) {
        if (valRaw) {
          result.visceras[field] = valRaw
        }
        currentSubKey = field
        currentTargetCategory = 'visceras'
        matchedViscera = true
        break
      }
    }
    if (matchedViscera) continue

    // 5. Estado de saúde geral e Hábitos (Sono, Alimentação, Estresse)
    if (
      normLabel.includes('estado de saude geral') ||
      normLabel.includes('habitos') ||
      normLabel === 'sono'
    ) {
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('quantidade de horas') || normLabel.includes('horas sono')) {
      result.habitos.sono_horas = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('qualidade')) {
      result.habitos.sono_qualidade = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('como acorda')) {
      result.habitos.sono_como_acorda = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (
      normLabel.includes('ao longo do dia') ||
      normLabel.includes('como voce fica ao longo do dia')
    ) {
      result.habitos.sono_ao_longo_dia = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('alimentacao') || normLabel.startsWith('alimentacao')) {
      // Pode ser geral ou detalhado
      if (valRaw) {
        result.habitos.refeicoes_almoco = valRaw
      }
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('cafe da manha') || normLabel.includes('cafe manha')) {
      result.habitos.refeicoes_cafe = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('lanche manha')) {
      result.habitos.refeicoes_lanche_manha = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('almoco')) {
      result.habitos.refeicoes_almoco = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('lanche tarde')) {
      result.habitos.refeicoes_lanche_tarde = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('jantar')) {
      result.habitos.refeicoes_jantar = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel === 'agua' || normLabel.startsWith('agua')) {
      result.habitos.agua = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel === 'acucar' || normLabel.startsWith('acucar')) {
      result.habitos.acucar = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('bebida alcoolica') || normLabel.includes('alcool')) {
      result.habitos.bebida_alcoolica = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel === 'trabalho' || normLabel.startsWith('trabalho')) {
      result.habitos.trabalho = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('stress') || normLabel.includes('estresse')) {
      if (normLabel.includes('trabalho')) {
        result.habitos.stress_trabalho = valRaw
      } else if (normLabel.includes('familia')) {
        result.habitos.stress_familia = valRaw
      } else if (normLabel.includes('pessoal')) {
        result.habitos.stress_pessoal = valRaw
      } else {
        result.habitos.stress_pessoal = valRaw
      }
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel === 'familia') {
      result.habitos.stress_familia = valRaw
      currentTargetCategory = 'habitos'
      continue
    }
    if (normLabel.includes('pessoal') && normLabel.includes('voce com voce mesmo')) {
      result.habitos.stress_pessoal = valRaw
      currentTargetCategory = 'habitos'
      continue
    }

    // 6. Exames Complementares (RNM, Raio X, Ultrassom, Tomografia, etc.)
    if (
      normLabel.includes('exames complementares') ||
      normLabel.includes('rnm') ||
      normLabel.includes('raio x') ||
      normLabel.includes('ressonancia') ||
      normLabel.includes('radiografia') ||
      normLabel.includes('ultrassom') ||
      normLabel.includes('tomografia')
    ) {
      currentTargetCategory = 'exames'
      const laudo = valRaw ? `${col0Raw}: ${valRaw}` : col0Raw
      result.examesComplementares.push(laudo)
      continue
    }

    // Se chegou aqui com um rótulo não mapeado
    if (currentTargetCategory && valRaw) {
      // Linha com contexto ativo (ex: "20 anos de idade: Acidente de carro...")
      appendContinuation(result, currentTargetCategory, currentSubKey, `${col0Raw}: ${valRaw}`)
    } else if (valRaw) {
      result.linhasNaoMapeadas.push({ rotulo: col0Raw, valor: valRaw })
    }
  }

  return result
}

function appendContinuation(
  res: ParsedAnamneseData,
  category: string,
  subKey: string,
  text: string,
) {
  if (!text) return
  if (category === 'historico') {
    res.historico = res.historico ? `${res.historico}\n${text}` : text
  } else if (category === 'acidentesTraumas') {
    res.acidentesTraumas = res.acidentesTraumas ? `${res.acidentesTraumas}\n${text}` : text
  } else if (category === 'atividadeFisica') {
    res.atividadeFisica = res.atividadeFisica ? `${res.atividadeFisica}\n${text}` : text
  } else if (category === 'cirurgias') {
    res.cirurgias = res.cirurgias ? `${res.cirurgias}\n${text}` : text
  } else if (category === 'medicamentos') {
    res.medicamentos = res.medicamentos ? `${res.medicamentos}\n${text}` : text
  } else if (category === 'tratamentosAnteriores') {
    res.tratamentosAnteriores = res.tratamentosAnteriores
      ? `${res.tratamentosAnteriores}\n${text}`
      : text
  } else if (category === 'exames') {
    res.examesComplementares.push(text)
  } else if (category === 'visceras' && subKey) {
    const k = subKey as keyof ViscerasSistemicas
    res.visceras[k] = res.visceras[k] ? `${res.visceras[k]}\n${text}` : text
  } else {
    res.linhasNaoMapeadas.push({ rotulo: '', valor: text })
  }
}

function parseExameFisicoSheet(sheet: XLSX.WorkSheet | null): ParsedExameFisicoData {
  const result: ParsedExameFisicoData = {
    inspecaoEstatica: {},
    palpacao: '',
    mobilidadeAtiva: '',
    dor: '',
    amplitudeMovimentoPassiva: '',
    testesCaptores: {},
    marcadoresBiologicos: {},
    linhasExtras: [],
  }

  if (!sheet) return result

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!rows || rows.length === 0) return result

  let currentSection:
    | 'inspecao'
    | 'palpacao'
    | 'adm'
    | 'captores'
    | 'marcadores'
    | 'clinicos'
    | null = null

  for (const row of rows) {
    if (!row || row.length === 0) continue

    const col0 = row[0] !== undefined ? String(row[0]).trim() : ''
    let colVal = ''
    for (let c = 1; c < row.length; c++) {
      if (row[c] !== undefined && String(row[c]).trim() !== '') {
        colVal = String(row[c]).trim()
        break
      }
    }

    const norm = normalizeLabel(col0)

    if (norm.includes('inspecao estatica')) {
      currentSection = 'inspecao'
      continue
    }
    if (norm.includes('palpacao')) {
      currentSection = 'palpacao'
      if (colVal) {
        result.palpacao = result.palpacao ? `${result.palpacao}\n${colVal}` : colVal
      }
      continue
    }
    if (
      norm.includes('amplitude de movimento') ||
      norm.includes('avaliacao passiva da adm') ||
      norm.includes('mobilidade ativa')
    ) {
      currentSection = 'adm'
      if (colVal) {
        result.amplitudeMovimentoPassiva = result.amplitudeMovimentoPassiva
          ? `${result.amplitudeMovimentoPassiva}\n${col0}: ${colVal}`
          : `${col0}: ${colVal}`
      }
      continue
    }
    if (norm.includes('testes captores') || norm.includes('sobrecarga alostatica')) {
      currentSection = 'captores'
      continue
    }
    if (
      norm.includes('marcadores biologicos') ||
      norm.includes('frequencia cardiaca') ||
      norm.includes('pressao arterial')
    ) {
      currentSection = 'marcadores'
      continue
    }

    // Linhas sem rótulo (continuação do tópico anterior)
    if (!col0) {
      if (colVal) {
        if (currentSection === 'palpacao') {
          result.palpacao = result.palpacao ? `${result.palpacao}\n${colVal}` : colVal
        } else if (currentSection === 'adm') {
          result.amplitudeMovimentoPassiva = result.amplitudeMovimentoPassiva
            ? `${result.amplitudeMovimentoPassiva}\n${colVal}`
            : colVal
        } else {
          result.linhasExtras.push({ topico: currentSection || 'continuação', valor: colVal })
        }
      }
      continue
    }

    // Rótulos específicos
    if (norm.includes('teste dedos chao') || norm.includes('flexao anterior')) {
      result.mobilidadeAtiva = colVal ? `${col0}: ${colVal}` : col0
      continue
    }
    if (norm === 'dor' || norm.startsWith('dor ')) {
      result.dor = colVal
      continue
    }

    // Agrupamento por seção
    if (currentSection === 'inspecao') {
      if (colVal) {
        result.inspecaoEstatica[col0] = colVal
      }
    } else if (currentSection === 'captores') {
      if (colVal) {
        result.testesCaptores[col0] = colVal
      }
    } else if (currentSection === 'marcadores') {
      if (colVal) {
        result.marcadoresBiologicos[col0] = colVal
      }
    } else if (colVal) {
      result.linhasExtras.push({ topico: col0, valor: colVal })
    }
  }

  return result
}

function parseEvolucaoSheet(sheet: XLSX.WorkSheet | null): ParsedEvolucaoItem[] {
  if (!sheet) return []

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!rows || rows.length <= 1) return []

  // Localiza índices das colunas no cabeçalho
  let dateColIdx = -1
  let avaliacaoColIdx = -1
  let evolucaoColIdx = -1

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r]
    for (let c = 0; c < row.length; c++) {
      const norm = normalizeLabel(row[c])
      if (norm === 'data' || norm.startsWith('data ')) {
        dateColIdx = c
      } else if (norm === 'avaliacao' || norm.startsWith('avaliacao')) {
        avaliacaoColIdx = c
      } else if (norm === 'evolucao' || norm.startsWith('evolucao')) {
        evolucaoColIdx = c
      }
    }
    if (dateColIdx !== -1 && (avaliacaoColIdx !== -1 || evolucaoColIdx !== -1)) {
      break
    }
  }

  // Fallbacks caso o cabeçalho seja em posições padrão (ex: col 1 = DATA, col 2 = AVALIAÇÃO, col 3 = EVOLUÇÃO)
  if (dateColIdx === -1) dateColIdx = 1
  if (avaliacaoColIdx === -1) avaliacaoColIdx = 2
  if (evolucaoColIdx === -1) evolucaoColIdx = 3

  const entries: ParsedEvolucaoItem[] = []
  let currentDate = ''
  let currentDateIso: string | undefined = undefined
  let currentAvaliacoes: string[] = []
  let currentEvolucoes: string[] = []

  const flushCurrent = () => {
    if (currentDate && (currentAvaliacoes.length > 0 || currentEvolucoes.length > 0)) {
      const partes: string[] = []
      if (currentAvaliacoes.length > 0) {
        partes.push(`Avaliação / Queixas:\n${currentAvaliacoes.join('\n')}`)
      }
      if (currentEvolucoes.length > 0) {
        partes.push(`Conduta / Evolução:\n${currentEvolucoes.join('\n')}`)
      }

      entries.push({
        data: currentDate,
        dataIso: currentDateIso,
        avaliacaoNotas: [...currentAvaliacoes],
        evolucaoProcedimentos: [...currentEvolucoes],
        textoCompleto: partes.join('\n\n'),
      })
    }
    currentAvaliacoes = []
    currentEvolucoes = []
  }

  // Percorre da linha 1 até o fim (ignorando linhas de cabeçalho)
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    if (!row) continue

    const dateCell = row[dateColIdx]
    const avaliacaoCell =
      row[avaliacaoColIdx] !== undefined ? String(row[avaliacaoColIdx]).trim() : ''
    const evolucaoCell = row[evolucaoColIdx] !== undefined ? String(row[evolucaoColIdx]).trim() : ''

    // Se é a linha de cabeçalho literal ("DATA", "AVALIAÇÃO"), pula
    if (normalizeLabel(dateCell) === 'data' && normalizeLabel(avaliacaoCell) === 'avaliacao') {
      continue
    }

    const parsedDate = parseExcelDate(dateCell)

    if (parsedDate.formatted && parsedDate.formatted !== 'DATA') {
      // Nova data detectada -> fecha a anterior e abre uma nova
      flushCurrent()
      currentDate = parsedDate.formatted
      currentDateIso = parsedDate.iso
    }

    if (avaliacaoCell) {
      currentAvaliacoes.push(avaliacaoCell)
    }
    if (evolucaoCell) {
      currentEvolucoes.push(evolucaoCell)
    }
  }

  // Fecha o último grupo
  flushCurrent()

  return entries
}

function parseTestesFuncionaisSheet(sheet: XLSX.WorkSheet | null): ParsedTestesFuncionaisData {
  const result: ParsedTestesFuncionaisData = {
    referenciasUtilizadas: {},
    comparativos: {},
    historicoMultiplosTestes: [],
  }

  if (!sheet) return result

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!rows || rows.length === 0) return result

  // Encontrar onde começam os testes funcionais
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    if (!row) continue

    const rowText = row.map((c) => String(c)).join(' ')
    const normRow = normalizeLabel(rowText)

    // Busca linhas de testes
    if (normRow.includes('prancha ventral') || normRow.includes('prone bridge')) {
      const val = extrairPrimeiroNumero(row)
      if (val !== undefined) result.pranchaVentral = val
    } else if (
      normRow.includes('prancha lateral direita') ||
      normRow.includes('side bridge right')
    ) {
      const val = extrairPrimeiroNumero(row)
      if (val !== undefined) result.pranchaLateralD = val
    } else if (
      normRow.includes('prancha lateral esquerda') ||
      normRow.includes('side bridge left')
    ) {
      const val = extrairPrimeiroNumero(row)
      if (val !== undefined) result.pranchaLateralE = val
    } else if (normRow.includes('ponte unilateral direita')) {
      const val = extrairPrimeiroNumero(row)
      if (val !== undefined) result.ponteUniD = val
    } else if (normRow.includes('ponte unilateral esquerda')) {
      const val = extrairPrimeiroNumero(row)
      if (val !== undefined) result.ponteUniE = val
    }
  }

  return result
}

function extrairPrimeiroNumero(row: any[]): number | undefined {
  for (let c = 1; c < row.length; c++) {
    const val = row[c]
    if (typeof val === 'number') return val
    if (typeof val === 'string' && val.trim() !== '') {
      const num = parseFloat(val.replace(',', '.'))
      if (!isNaN(num)) return num
    }
  }
  return undefined
}

function parseCirtometriaSheet(sheet: XLSX.WorkSheet | null): ParsedCirtometriaData {
  const result: ParsedCirtometriaData = {
    medidas: {},
  }

  if (!sheet) return result

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!rows || rows.length === 0) return result

  // Detecta colunas ESQUERDO e DIREITO na linha de cabeçalho
  let colEsq = 1
  let colDir = 2

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r]
    for (let c = 0; c < row.length; c++) {
      const norm = normalizeLabel(row[c])
      if (norm === 'esquerdo') colEsq = c
      if (norm === 'direito') colDir = c
    }
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length === 0) continue

    const regiao = String(row[0] || '').trim()
    if (
      !regiao ||
      normalizeLabel(regiao).includes('regiao') ||
      normalizeLabel(regiao).includes('perimetria')
    ) {
      continue
    }

    const esq =
      row[colEsq] !== undefined && row[colEsq] !== '' ? String(row[colEsq]).trim() : undefined
    const dir =
      row[colDir] !== undefined && row[colDir] !== '' ? String(row[colDir]).trim() : undefined

    if (esq || dir) {
      result.medidas[regiao] = { esquerdo: esq, direito: dir }
    }
  }

  return result
}

function parseGoniometriaSheet(sheet: XLSX.WorkSheet | null): ParsedGoniometriaData {
  const result: ParsedGoniometriaData = {
    medicoes: [],
  }

  if (!sheet) return result

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!rows || rows.length === 0) return result

  // Busca linhas de segmentos
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length === 0) continue

    const seg = String(row[0] || row[1] || '').trim()
    const norm = normalizeLabel(seg)
    if (norm.includes('joelho') || norm.includes('ombro') || norm.includes('quadril')) {
      // Extrair valores adjacentes
      const numEsq = extrairPrimeiroNumero(row)
      result.medicoes.push({
        segmento: seg,
        esquerdo: numEsq,
      })
    }
  }

  return result
}

function parseTestesEspeciaisSheets(
  ombroSheet: XLSX.WorkSheet | null,
  osteoSheet: XLSX.WorkSheet | null,
): ParsedTestesEspeciaisData {
  const result: ParsedTestesEspeciaisData = {
    ombro: [],
    outros: [],
  }

  if (ombroSheet) {
    const rows: any[][] = XLSX.utils.sheet_to_json(ombroSheet, { header: 1, defval: '' })
    let dCol = 2
    let eCol = 3

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]
      if (!row || row.length < 2) continue

      const nomeTeste = String(row[1] || row[0] || '').trim()
      const norm = normalizeLabel(nomeTeste)

      if (norm.includes('direito') && norm.includes('esquerdo')) {
        continue
      }
      if (norm.includes('testes especiais') || !nomeTeste) {
        continue
      }

      const dirVal = row[dCol] !== undefined ? String(row[dCol]).trim() : ''
      const esqVal = row[eCol] !== undefined ? String(row[eCol]).trim() : ''
      const estrutura = row[4] !== undefined ? String(row[4]).trim() : ''
      const como = row[7] !== undefined ? String(row[7]).trim() : ''

      if (dirVal || esqVal || estrutura) {
        result.ombro?.push({
          nome: nomeTeste,
          direito: dirVal,
          esquerdo: esqVal,
          estrutura,
          comoRealizar: como,
        })
      }
    }
  }

  if (osteoSheet) {
    const osteoRows: any[][] = XLSX.utils.sheet_to_json(osteoSheet, { header: 1, defval: '' })
    result.outros?.push({
      aba: 'TESTES OSTEOPÁTICOS',
      linhas: osteoRows,
    })
  }

  return result
}

function parsePodalSheets(
  peAvaliacaoSheet: XLSX.WorkSheet | null,
  avaliacaoPeSheet: XLSX.WorkSheet | null,
): ParsedPodalData {
  const result: ParsedPodalData = {
    elementosPrescritos: [],
    testesBiomecanicos: {},
    avaliacaoPostural: {},
  }

  const sheet = peAvaliacaoSheet || avaliacaoPeSheet
  if (!sheet) return result

  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  for (const row of rows) {
    if (!row || row.length === 0) continue

    const elem = String(row[1] || row[0] || '').trim()
    const desc = String(row[2] || '').trim()
    const funcao = String(row[3] || '').trim()

    if (elem && !normalizeLabel(elem).includes('elemento')) {
      result.elementosPrescritos?.push(`${elem} (${desc} - ${funcao})`.trim())
    }
  }

  return result
}

// -------------------------------------------------------------
// Converte os dados parseados em objetos prontos para o banco
// -------------------------------------------------------------

export function buildAvaliacaoPayloadFromPlanilha(
  parsed: ParsedPlanilhaAvaliacao,
  pacienteId: string,
  userId?: string,
): Partial<AvaliacaoFisioterapiaRecord> {
  const {
    anamnese,
    exameFisico,
    testesFuncionais,
    cirtometria,
    testesEspeciais,
    podal,
    dadosExtrasImportados,
  } = parsed

  // 1. Queixas Múltiplas
  const queixas: QueixaItem[] = [
    {
      titulo: 'Principal',
      queixa: anamnese.queixaPrincipal || 'Não especificada',
      desde_quando: anamnese.desdeQuando || '',
      tipo: anamnese.tipoDor || '',
      eva: anamnese.eva || 5,
      historico: anamnese.historico || '',
      pior_momento_dia: anamnese.piorMomentoDia || '',
      movimento_piora: anamnese.movimentoPiora || '',
      o_que_alivia: anamnese.oQueAlivia || '',
    },
  ]

  // 2. Anamnese Detalhada
  const anamneseDetalhada = {
    data_avaliacao: anamnese.dataAvaliacao || new Date().toISOString(),
    profissao: anamnese.profissao,
    diagnostico_medico: anamnese.diagnosticoMedico,
    objetivos: anamnese.objetivos,
    acidentes_traumas: anamnese.acidentesTraumas,
    atividade_fisica: anamnese.atividadeFisica,
    cirurgias: anamnese.cirurgias,
    medicamentos: anamnese.medicamentos,
    tratamentos_anteriores_tipo: anamnese.tratamentosAnteriores,
  }

  // 3. Força Core / McGill
  const forcaCoreTabela: ForcaCoreTabela = {
    sexo: 'M',
    faixa_etaria: '41-65',
    prancha_ventral: testesFuncionais.pranchaVentral || '',
    prancha_lateral_d: testesFuncionais.pranchaLateralD || '',
    prancha_lateral_e: testesFuncionais.pranchaLateralE || '',
    ponte_uni_d: testesFuncionais.ponteUniD || '',
    ponte_uni_e: testesFuncionais.ponteUniE || '',
  }

  // 4. Testes Especiais Mapeados (Ombro)
  const testesSegmentos: TestesEspeciaisSegmento[] = JSON.parse(
    JSON.stringify(TESTES_ESPECIAIS_PADRAO),
  )
  if (testesEspeciais.ombro && testesEspeciais.ombro.length > 0) {
    const segOmbro = testesSegmentos.find((s) => s.segmento === 'Ombro')
    if (segOmbro) {
      segOmbro.ativo = true
      for (const t of testesEspeciais.ombro) {
        const normItem = normalizeLabel(t.nome)
        const itemExistente = segOmbro.testes.find(
          (p) =>
            normalizeLabel(p.nome).includes(normItem) || normItem.includes(normalizeLabel(p.nome)),
        )

        const statusD =
          t.direito === '+' ? 'POSITIVO' : t.direito === '-' ? 'NEGATIVO' : 'NÃO REALIZADO'
        const statusE =
          t.esquerdo === '+' ? 'POSITIVO' : t.esquerdo === '-' ? 'NEGATIVO' : 'NÃO REALIZADO'

        if (itemExistente) {
          itemExistente.status_direito = statusD as any
          itemExistente.status_esquerdo = statusE as any
          if (t.comoRealizar) itemExistente.observacao = t.comoRealizar
        } else {
          segOmbro.testes.push({
            nome: t.nome,
            estrutura: t.estrutura,
            status_direito: statusD as any,
            status_esquerdo: statusE as any,
            observacao: t.comoRealizar,
          })
        }
      }
    }
  }

  // 5. Seções Complementares (Cirtometria + Inspeção)
  const secoesComplementares: SecoesComplementaresFisio = {
    inspecao_ativo: Object.keys(exameFisico.inspecaoEstatica).length > 0,
    inspecao_dados: exameFisico.inspecaoEstatica,
    cirtometria_ativo: Object.keys(cirtometria.medidas).length > 0,
    cirtometria_dados: cirtometria.medidas,
  }

  // 6. Bloco Genérico "Dados Importados da Planilha" (tudo que foi detectado sem perda)
  const dadosImportadosPlanilha = {
    arquivo_origem: parsed.arquivoNome,
    importado_em: new Date().toISOString(),
    abas_processadas: parsed.abasEncontradas,
    resumo: {
      anamnese_linhas: Object.keys(anamnese).length,
      exames_complementares_qtd: anamnese.examesComplementares.length,
      evolucoes_detectadas: parsed.evolucoes.length,
      cirtometria_itens: Object.keys(cirtometria.medidas).length,
      testes_ombro_itens: testesEspeciais.ombro?.length || 0,
    },
    dados_extras: {
      exames_complementares_laudos: anamnese.examesComplementares,
      linhas_anamnese_nao_mapeadas: anamnese.linhasNaoMapeadas,
      exame_fisico_extras: exameFisico.linhasExtras,
      palpacao_detalhada: exameFisico.palpacao,
      amplitude_movimento_passiva: exameFisico.amplitudeMovimentoPassiva,
      testes_captores: exameFisico.testesCaptores,
      marcadores_biologicos: exameFisico.marcadoresBiologicos,
      elementos_podais_detectados: podal.elementosPrescritos,
      outros_testes: testesEspeciais.outros,
      abas_adicionais: dadosExtrasImportados,
    },
  }

  return {
    paciente_id: pacienteId,
    user_id: userId,
    especialidade: 'Fisioterapia',
    status: 'Concluída',
    queixa_principal: anamnese.queixaPrincipal || 'Avaliação Importada via Planilha',
    historia_doenca_atual: anamnese.historico,
    historico_medico: anamnese.diagnosticoMedico,
    medicamentos: anamnese.medicamentos,
    cirurgias: anamnese.cirurgias,
    palpacao: exameFisico.palpacao,
    diagnostico_fisioterapeutico:
      anamnese.diagnosticoMedico || 'Avaliação Fisioterapêutica Importada',
    objetivos_tratamento: anamnese.objetivos,
    data_avaliacao: anamnese.dataAvaliacao || new Date().toISOString(),
    // Estruturados
    anamnese_detalhada: anamneseDetalhada,
    queixas_multiplas: queixas,
    visceras_sistemicas: anamnese.visceras,
    habitos_saude: anamnese.habitos,
    forca_core_tabela: forcaCoreTabela,
    testes_especiais_segmentos: testesSegmentos,
    secoes_complementares: secoesComplementares,
    dados_importados_planilha: dadosImportadosPlanilha,
  }
}

// Constrói os payloads das evoluções agrupadas por data
export function buildEvolucoesPayloadFromPlanilha(
  parsed: ParsedPlanilhaAvaliacao,
  pacienteId: string,
  avaliacaoId?: string,
  profissionalNome = 'Importado via Planilha',
): Array<Partial<EvolucaoRecord>> {
  return parsed.evolucoes.map((item) => {
    return {
      paciente_id: pacienteId,
      avaliacao_id: avaliacaoId,
      especialidade: 'Fisioterapia',
      data_evolucao: item.dataIso || new Date().toISOString(),
      profissional: profissionalNome,
      // Não assinado, marcado como rascunho importado
      status: 'Rascunho',
      documento_fechado: false,
      subjetivo: item.avaliacaoNotas.join('\n'),
      conduta_procedimentos: item.evolucaoProcedimentos.join('\n'),
      texto_livre: item.textoCompleto,
      avaliacao_clinica: `Evolução importada da planilha clínica (Data original: ${item.data})`,
    }
  })
}
