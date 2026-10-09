import { useState, useRef, useId } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Info,
  Check,
  ChevronDown,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getAllPacientes, createPaciente } from '@/services/pacientes'
import type { PacienteRecord } from '@/types/database'

interface ModalImportarPacientesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Definição dos campos destino suportados
export interface TargetFieldDef {
  key: string
  label: string
  required?: boolean
  description?: string
  expectedAliases: string[]
}

export const TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'nome',
    label: 'Nome completo',
    required: true,
    description: 'Nome civil do paciente (obrigatório)',
    expectedAliases: ['nome completo', 'nome', 'paciente', 'nome do paciente'],
  },
  {
    key: 'cpf',
    label: 'CPF',
    description: 'Cadastro de Pessoa Física (números normalizados)',
    expectedAliases: ['cpf', 'documento', 'cpf do paciente'],
  },
  {
    key: 'data_nascimento',
    label: 'Data de Nascimento',
    description: 'Formatos DD/MM/AAAA, DDMMAAAA ou data serial',
    expectedAliases: [
      'data de nascimento',
      'nascimento',
      'data nasc',
      'dt nascimento',
      'data de nasc.',
    ],
  },
  {
    key: 'genero',
    label: 'Gênero / Sexo',
    description: 'Feminino, Masculino, etc.',
    expectedAliases: ['gênero', 'genero', 'sexo'],
  },
  {
    key: 'telefone',
    label: 'Telefone / WhatsApp',
    description: 'DDD + número de contato',
    expectedAliases: ['fone / whatsapp', 'telefone', 'whatsapp', 'celular', 'fone', 'tel', 'whats'],
  },
  {
    key: 'rua',
    label: 'Rua / Endereço (logradouro)',
    description: 'Utilizado para compor o endereço completo',
    expectedAliases: ['rua / avenida', 'rua', 'avenida', 'logradouro', 'endereço'],
  },
  {
    key: 'numero',
    label: 'Número',
    description: 'Número do imóvel',
    expectedAliases: ['nº', 'numero', 'n°', 'num'],
  },
  {
    key: 'complemento',
    label: 'Complemento',
    description: 'Apto, bloco, casa...',
    expectedAliases: ['complemento', 'compl'],
  },
  {
    key: 'bairro',
    label: 'Bairro',
    description: 'Bairro de residência',
    expectedAliases: ['bairro'],
  },
  {
    key: 'cidade',
    label: 'Cidade',
    description: 'Município',
    expectedAliases: ['cidade', 'municipio'],
  },
  {
    key: 'uf',
    label: 'Estado (UF)',
    description: 'Sigla ou nome do estado',
    expectedAliases: ['estado (uf)', 'estado', 'uf'],
  },
  {
    key: 'cep',
    label: 'CEP',
    description: 'Código de Endereçamento Postal',
    expectedAliases: ['cep'],
  },
  {
    key: 'ponto_referencia',
    label: 'Ponto de Referência',
    description: 'Ponto de referência de localização',
    expectedAliases: ['ponto de referência', 'ponto de referencia', 'referencia'],
  },
  {
    key: 'motivo_procura',
    label: 'Por que nos procurou? (Queixa principal)',
    description: 'Motivo principal da busca pelo atendimento',
    expectedAliases: [
      'por que nos procurou?',
      'por que nos procurou',
      'motivo',
      'queixa principal',
      'motivo da procura',
    ],
  },
  {
    key: 'tem_dor',
    label: 'Tem alguma dor ou incômodo?',
    description: 'Sim ou Não',
    expectedAliases: [
      'tem alguma dor ou incômodo?',
      'tem alguma dor ou incomodo?',
      'dor ou incomodo',
    ],
  },
  {
    key: 'queixa_dor_onde',
    label: 'Local da Dor / Incômodo ("onde é?")',
    description: 'Região corporal afetada (joelhos, ombro, ciático...)',
    expectedAliases: [
      'caso tenha alguma dor ou incômodo, onde é?',
      'caso tenha alguma dor ou incomodo, onde é?',
      'onde é a dor?',
      'local da dor',
      'regiao da dor',
    ],
  },
  {
    key: 'atividade_fisica',
    label: 'Atividade física praticada',
    description: 'Modalidade (Musculação, vôlei, corrida...)',
    expectedAliases: [
      'qual (is)?',
      'qual(is)?',
      'quais?',
      'pratica alguma atividade física?',
      'qual atividade',
      'atividades fisicas',
    ],
  },
  {
    key: 'frequencia_semanal',
    label: 'Frequência semanal de atividade',
    description: 'Vezes por semana (ex: 3x, 5x)',
    expectedAliases: [
      'com que frequência na semana pratica?',
      'com que frequencia na semana pratica?',
      'frequencia semanal',
      'frequência semanal',
    ],
  },
  {
    key: 'duracao_treino',
    label: 'Duração média diária do treino',
    description: 'Tempo médio (ex: Uma hora, 45 min)',
    expectedAliases: [
      'qual a duração em média por dia praticado?',
      'qual a duracao em media por dia praticado?',
      'duracao media',
      'duração',
    ],
  },
  {
    key: 'controle_alimentar',
    label: 'Dieta ou controle alimentar?',
    description: 'Sim ou Não / detalhes nutricionais',
    expectedAliases: [
      'faz dieta ou algum controle alimentar?',
      'dieta ou controle alimentar',
      'controle alimentar',
      'dieta',
    ],
  },
  {
    key: 'origem_como_chegou',
    label: 'Como conheceu a Clínica?',
    description: 'Indicação, Google, Instagram, etc.',
    expectedAliases: [
      'como conheceu a clínica?',
      'como conheceu a clinica?',
      'como conheceu',
      'origem',
    ],
  },
  {
    key: 'quem_indicou',
    label: 'Quem lhe indicou?',
    description: 'Nome da pessoa/profissional ou local que indicou',
    expectedAliases: [
      'no caso de indicação, quem lhe indicou?',
      'no caso de indicacao, quem lhe indicou?',
      'quem indicou',
      'indicacao por',
    ],
  },
  {
    key: 'observacoes_importantes',
    label: 'Observações importantes da anamnese',
    description: 'Espaço livre para detalhes clínicos, cirurgias, alergias',
    expectedAliases: [
      'utilize o espaço abaixo caso tenha alguma informação sobre você que seja importante sabermos. muito obrigado!',
      'utilize o espaço abaixo',
      'observações importantes',
      'observacoes importantes',
      'informações adicionais',
    ],
  },
]

// Normalizar strings para correspondência
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Normalizar CPF (apenas dígitos)
export function normalizeCPF(val: any): string {
  if (!val) return ''
  const str = String(val).replace(/\D/g, '').trim()
  if (str.length === 0) return ''
  // Preencher com zeros à esquerda se veio como número truncado com 9-10 dígitos
  if (str.length > 0 && str.length < 11) {
    return str.padStart(11, '0')
  }
  return str.slice(0, 11)
}

// Normalizar telefone
export function normalizePhone(val: any): string {
  if (!val) return ''
  const digits = String(val).replace(/\D/g, '').trim()
  return digits
}

// Normalizar chave de nome para deduplicação
export function normalizeNameForCompare(val: string): string {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// Parser inteligente de data de nascimento para ISO string PocketBase ("YYYY-MM-DD 00:00:00.000Z")
export function parseBirthDateToISO(val: any): string | undefined {
  if (!val) return undefined

  // Se já for Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d} 00:00:00.000Z`
  }

  // Se for número serial do Excel (ex: 35000 a 45000)
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val)
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const y = parsed.y
        const m = String(parsed.m).padStart(2, '0')
        const d = String(parsed.d).padStart(2, '0')
        return `${y}-${m}-${d} 00:00:00.000Z`
      }
    } catch {
      // continua para string
    }
  }

  const str = String(val).trim()
  if (!str) return undefined

  // Formato DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const slashMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0')
    const m = slashMatch[2].padStart(2, '0')
    const y = slashMatch[3]
    return `${y}-${m}-${d} 00:00:00.000Z`
  }

  // Formato YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = isoMatch[2].padStart(2, '0')
    const d = isoMatch[3].padStart(2, '0')
    return `${y}-${m}-${d} 00:00:00.000Z`
  }

  // Formato DDMMAAAA (8 dígitos sem pontuação, comum no forms: ex 30051983)
  const ddmmyyyyMatch = str.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (ddmmyyyyMatch) {
    const d = ddmmyyyyMatch[1]
    const m = ddmmyyyyMatch[2]
    const y = ddmmyyyyMatch[3]
    const dNum = parseInt(d, 10)
    const mNum = parseInt(m, 10)
    if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12) {
      return `${y}-${m}-${d} 00:00:00.000Z`
    }
  }

  // Tentar Date.parse nativo
  const ts = Date.parse(str)
  if (!isNaN(ts)) {
    const dObj = new Date(ts)
    const y = dObj.getUTCFullYear()
    const m = String(dObj.getUTCMonth() + 1).padStart(2, '0')
    const d = String(dObj.getUTCDate()).padStart(2, '0')
    if (y > 1900 && y < 2100) {
      return `${y}-${m}-${d} 00:00:00.000Z`
    }
  }

  return undefined
}

interface ImportRowError {
  line: number
  nome?: string
  reason: string
}

interface ImportReport {
  totalRead: number
  importedCount: number
  ignoredDuplicateCount: number
  errorsCount: number
  duplicatesList: Array<{ line: number; nome: string; motivo: string }>
  errorsList: ImportRowError[]
}

export function ModalImportarPacientes({
  open,
  onOpenChange,
  onSuccess,
}: ModalImportarPacientesProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fileName, setFileName] = useState('')
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([])
  // Mapeamento: chave do targetField -> índice ou nome da coluna na planilha
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Estado da importação
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importCurrentText, setImportCurrentText] = useState('')
  const [report, setReport] = useState<ImportReport | null>(null)

  const resetAll = () => {
    setStep(1)
    setFileName('')
    setFileHeaders([])
    setRawRows([])
    setMapping({})
    setIsImporting(false)
    setImportProgress(0)
    setImportCurrentText('')
    setReport(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result
        if (!buffer) return

        const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          toast({
            title: 'Planilha vazia',
            description: 'Nenhuma aba encontrada no arquivo selecionado.',
            variant: 'destructive',
          })
          return
        }

        // Se a planilha possuir múltiplas abas típicas de avaliação clínica (ANAMNESE, EXAME FÍSICO, Evolução),
        // alertar o usuário para utilizar o importador correto ("Importar Avaliação (Planilha)")
        const lowerSheets = workbook.SheetNames.map((s) => s.toLowerCase())
        const looksLikeAvaliacao =
          lowerSheets.some((s) => s.includes('anamnese')) &&
          lowerSheets.some((s) => s.includes('exame') || s.includes('evoluc'))

        if (looksLikeAvaliacao) {
          toast({
            title: 'Planilha de Avaliação Detectada',
            description:
              'Este arquivo parece ser uma ficha/avaliação clínica individual. Utilize o botão "Importar Avaliação (Planilha)" para importar este modelo com abas.',
            variant: 'destructive',
          })
          return
        }

        const worksheet = workbook.Sheets[sheetName]
        // Carregar como array de objetos (1 linha = 1 paciente)
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: true,
        })

        if (!jsonData || jsonData.length === 0) {
          toast({
            title: 'Planilha sem dados',
            description: 'Não foram encontradas linhas de respostas para importar.',
            variant: 'destructive',
          })
          return
        }

        // Extrair cabeçalhos reais da planilha
        const headersSet = new Set<string>()
        jsonData.forEach((row) => {
          Object.keys(row).forEach((k) => headersSet.add(k))
        })
        const headers = Array.from(headersSet)

        setFileHeaders(headers)
        setRawRows(jsonData)

        // Mapeamento automático inicial baseado em aliases
        const initialMapping: Record<string, string> = {}
        TARGET_FIELDS.forEach((target) => {
          // Procurar correspondência exata ou por alias
          for (const alias of target.expectedAliases) {
            const normAlias = normalizeHeader(alias)
            const matchedHeader = headers.find((h) => {
              const normH = normalizeHeader(h)
              return normH === normAlias || normH.includes(normAlias)
            })
            if (matchedHeader) {
              initialMapping[target.key] = matchedHeader
              break
            }
          }
        })

        setMapping(initialMapping)
        setStep(2)
      } catch (err: any) {
        console.error('Erro lendo arquivo:', err)
        toast({
          title: 'Erro ao ler arquivo',
          description: err?.message || 'Verifique se o arquivo .xlsx ou .csv está corrompido.',
          variant: 'destructive',
        })
      }
    }

    reader.readAsArrayBuffer(file)
  }

  // Validação da etapa 2 antes de iniciar
  const handleProceedToImport = async () => {
    if (!mapping.nome) {
      toast({
        title: 'Mapeamento incompleto',
        description:
          'Selecione qual coluna da planilha corresponde ao campo obrigatório "Nome completo".',
        variant: 'destructive',
      })
      return
    }

    setStep(3)
    runImportProcess()
  }

  // Processo de importação com dedupe e relatório
  const runImportProcess = async () => {
    setIsImporting(true)
    setImportProgress(0)
    setImportCurrentText('Carregando base existente para verificação de duplicidade...')

    try {
      // 1. Carregar todos os pacientes existentes para deduplicação segura
      const existingPacientes = await getAllPacientes()
      const existingCpfs = new Set<string>()
      const existingNamesAndPhones = new Set<string>()
      const existingNames = new Set<string>()

      existingPacientes.forEach((p) => {
        if (p.cpf) {
          const c = normalizeCPF(p.cpf)
          if (c) existingCpfs.add(c)
        }
        const normName = normalizeNameForCompare(p.nome)
        if (normName) {
          existingNames.add(normName)
          if (p.telefone) {
            const phone = normalizePhone(p.telefone)
            if (phone) existingNamesAndPhones.add(`${normName}|${phone}`)
          }
        }
      })

      const total = rawRows.length
      let imported = 0
      let duplicates = 0
      let errors = 0
      const duplicatesList: Array<{ line: number; nome: string; motivo: string }> = []
      const errorsList: ImportRowError[] = []

      // Cache da sessão atual para evitar duplicatas dentro da própria planilha
      const sessionCpfs = new Set<string>()
      const sessionNamesAndPhones = new Set<string>()

      // 2. Iterar linha por linha
      for (let i = 0; i < total; i++) {
        const lineNum = i + 2 // Linha 1 no excel é o cabeçalho
        const row = rawRows[i]
        const progressPct = Math.round(((i + 1) / total) * 100)
        setImportProgress(progressPct)
        setImportCurrentText(`Processando linha ${i + 1} de ${total}...`)

        const rawNome = mapping.nome ? String(row[mapping.nome] || '').trim() : ''
        // Proteção contra cabeçalhos/perguntas tratados acidentalmente como nomes
        const looksLikeQuestionOrHeader =
          rawNome.endsWith(':') ||
          rawNome.endsWith('?') ||
          rawNome.length > 80 ||
          /^(ABERTURA SUGERIDA|MOTIVO DA PROCURA|ANAMNESE|EXAME|TRATAMENTOS|EXAMES COMPLEMENTARES)/i.test(
            rawNome,
          )

        if (!rawNome || rawNome.length < 2 || looksLikeQuestionOrHeader) {
          errors++
          errorsList.push({
            line: lineNum,
            nome: rawNome || '(Vazio)',
            reason: looksLikeQuestionOrHeader
              ? 'Parece cabeçalho ou pergunta, não nome de paciente'
              : 'Nome inválido ou ausente',
          })
          continue
        }

        const rawCpf = mapping.cpf ? normalizeCPF(row[mapping.cpf]) : ''
        const rawPhone = mapping.telefone ? normalizePhone(row[mapping.telefone]) : ''
        const normName = normalizeNameForCompare(rawNome)

        // Deduplicação:
        // Caso 1: CPF presente coincide com paciente existente ou já processado nesta importação
        let isDuplicate = false
        let dupReason = ''

        if (rawCpf && rawCpf.length === 11) {
          if (existingCpfs.has(rawCpf) || sessionCpfs.has(rawCpf)) {
            isDuplicate = true
            dupReason = `CPF já cadastrado (${rawCpf})`
          }
        }

        // Caso 2: Se não detectou por CPF, verificar por nome + telefone
        if (!isDuplicate && rawPhone.length >= 8) {
          const comboKey = `${normName}|${rawPhone}`
          if (existingNamesAndPhones.has(comboKey) || sessionNamesAndPhones.has(comboKey)) {
            isDuplicate = true
            dupReason = `Nome e telefone idênticos (${rawNome})`
          }
        }

        if (isDuplicate) {
          duplicates++
          duplicatesList.push({
            line: lineNum,
            nome: rawNome,
            motivo: dupReason,
          })
          continue
        }

        // Montar dados do paciente
        try {
          const birthDateIso = mapping.data_nascimento
            ? parseBirthDateToISO(row[mapping.data_nascimento])
            : undefined

          // Montar endereço completo
          const rua = mapping.rua ? String(row[mapping.rua] || '').trim() : ''
          const num = mapping.numero ? String(row[mapping.numero] || '').trim() : ''
          const compl = mapping.complemento ? String(row[mapping.complemento] || '').trim() : ''
          const bairro = mapping.bairro ? String(row[mapping.bairro] || '').trim() : ''
          const cidade = mapping.cidade ? String(row[mapping.cidade] || '').trim() : ''
          const uf = mapping.uf ? String(row[mapping.uf] || '').trim() : ''
          const cep = mapping.cep ? String(row[mapping.cep] || '').trim() : ''
          const pontoRef = mapping.ponto_referencia
            ? String(row[mapping.ponto_referencia] || '').trim()
            : ''

          const addressParts: string[] = []
          if (rua) {
            addressParts.push(num ? `${rua}, nº ${num}` : rua)
          }
          if (compl) addressParts.push(compl)
          if (bairro) addressParts.push(`Bairro: ${bairro}`)
          if (cidade || uf) {
            addressParts.push([cidade, uf].filter(Boolean).join(' - '))
          }
          if (cep) addressParts.push(`CEP: ${cep}`)
          if (pontoRef) addressParts.push(`(Ref: ${pontoRef})`)
          const fullEndereco = addressParts.join(', ')

          // Dados de anamnese / questionário
          const motivo = mapping.motivo_procura
            ? String(row[mapping.motivo_procura] || '').trim()
            : ''
          const dorOnde = mapping.queixa_dor_onde
            ? String(row[mapping.queixa_dor_onde] || '').trim()
            : ''
          const temDor = mapping.tem_dor ? String(row[mapping.tem_dor] || '').trim() : ''
          const atvFisica = mapping.atividade_fisica
            ? String(row[mapping.atividade_fisica] || '').trim()
            : ''
          const freqSemanal = mapping.frequencia_semanal
            ? String(row[mapping.frequencia_semanal] || '').trim()
            : ''
          const duracaoTreino = mapping.duracao_treino
            ? String(row[mapping.duracao_treino] || '').trim()
            : ''
          const controleAlim = mapping.controle_alimentar
            ? String(row[mapping.controle_alimentar] || '').trim()
            : ''
          const origemComoChegou = mapping.origem_como_chegou
            ? String(row[mapping.origem_como_chegou] || '').trim()
            : ''
          const quemIndicou = mapping.quem_indicou
            ? String(row[mapping.quem_indicou] || '').trim()
            : ''
          const obsImportantes = mapping.observacoes_importantes
            ? String(row[mapping.observacoes_importantes] || '').trim()
            : ''
          const genero = mapping.genero ? String(row[mapping.genero] || '').trim() : ''

          // Montar ficha_pre_cadastro estruturada com todos os dados brutos mapeados
          const fichaPreCadastro: Record<string, any> = {
            importado_planilha: true,
            data_importacao: new Date().toISOString(),
            arquivo_origem: fileName,
            genero: genero || undefined,
            tem_dor: temDor || undefined,
            dor_onde: dorOnde || undefined,
            atividade_fisica: atvFisica || undefined,
            frequencia_semanal: freqSemanal || undefined,
            duracao_treino: duracaoTreino || undefined,
            controle_alimentar: controleAlim || undefined,
            como_conheceu: origemComoChegou || undefined,
            quem_indicou: quemIndicou || undefined,
            observacoes_gerais: obsImportantes || undefined,
          }

          // Montar payload final do paciente
          const payload: Partial<PacienteRecord> = {
            nome: rawNome,
            cpf: rawCpf || undefined,
            data_nascimento: birthDateIso,
            telefone:
              rawPhone ||
              (mapping.telefone ? String(row[mapping.telefone] || '').trim() : undefined),
            endereco: fullEndereco || undefined,
            status: 'Ativo', // Pacientes já atendidos ou cadastrados na clínica
            genero: genero || undefined,
            origem_como_chegou: origemComoChegou || undefined,
            motivo_procura: motivo || undefined,
            queixa_dor_onde: dorOnde || undefined,
            limitacoes_incomodo: dorOnde ? `Dor/incômodo em: ${dorOnde}` : undefined,
            atividade_fisica: atvFisica || undefined,
            frequencia_semanal: freqSemanal || undefined,
            duracao_treino: duracaoTreino || undefined,
            controle_alimentar: controleAlim || undefined,
            quem_indicou: quemIndicou || undefined,
            observacoes_formulario: obsImportantes || undefined,
            observacoes: obsImportantes ? `Obs do pré-cadastro: ${obsImportantes}` : undefined,
            ficha_pre_cadastro: fichaPreCadastro,
          }

          await createPaciente(payload)

          // Registrar no cache de sessão
          if (rawCpf) sessionCpfs.add(rawCpf)
          if (rawPhone) sessionNamesAndPhones.add(`${normName}|${rawPhone}`)
          imported++
        } catch (saveErr: any) {
          console.error(`Erro ao salvar paciente na linha ${lineNum}:`, saveErr)
          errors++
          const msg =
            saveErr?.data?.data?.cpf?.message ||
            saveErr?.message ||
            'Erro ao gravar registro no banco'
          errorsList.push({
            line: lineNum,
            nome: rawNome,
            reason: msg,
          })
        }
      }

      // Concluir relatório
      const finalReport: ImportReport = {
        totalRead: total,
        importedCount: imported,
        ignoredDuplicateCount: duplicates,
        errorsCount: errors,
        duplicatesList,
        errorsList,
      }

      setReport(finalReport)
      toast({
        title: 'Importação finalizada!',
        description: `${imported} pacientes cadastrados com sucesso na Clínica SOUL.`,
      })
      onSuccess?.()
    } catch (err: any) {
      console.error('Falha geral no processo de importação:', err)
      toast({
        title: 'Erro na importação',
        description: err?.message || 'Ocorreu um erro durante a execução.',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Obter amostra de preview da linha 0 com o mapeamento atual
  const previewSampleRow = rawRows[0] || {}

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && isImporting) return // Não fechar enquanto processa
        if (!isOpen) resetAll()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[760px] max-h-[92vh] overflow-y-auto rounded-3xl p-6 bg-white border border-gray-100 shadow-2xl">
        <DialogHeader className="pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#C9A46A] to-[#8C6527] text-white shadow-sm">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Importar Pacientes da Planilha
                </DialogTitle>
                <p className="text-xs text-gray-500">
                  Importe respostas de cadastros Google Forms (.xlsx ou .csv) diretamente para o
                  prontuário SOUL.
                </p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 1
                    ? 'bg-[#C9A46A] text-[#33221C]'
                    : step > 1
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                1
              </span>
              <div className="w-4 h-0.5 bg-gray-200" />
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2
                    ? 'bg-[#C9A46A] text-[#33221C]'
                    : step > 2
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                2
              </span>
              <div className="w-4 h-0.5 bg-gray-200" />
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === 3 ? 'bg-[#C9A46A] text-[#33221C]' : 'bg-gray-100 text-gray-400'
                }`}
              >
                3
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* ETAPA 1: SELEÇÃO E UPLOAD DO ARQUIVO */}
        {step === 1 && (
          <div className="py-6 space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#C9A46A]/50 hover:border-[#8C6527] rounded-3xl p-8 sm:p-12 text-center bg-[#FAF5EE]/50 hover:bg-[#FAF5EE] transition-all cursor-pointer group flex flex-col items-center justify-center gap-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0DE] group-hover:bg-[#F3E3C7] text-[#8C6527] transition-all shadow-xs">
                <Upload className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-gray-900 group-hover:text-[#8C6527] transition-colors">
                  Clique ou arraste a planilha aqui
                </p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Formatos aceitos: <strong>.xlsx</strong> e <strong>.csv</strong> com respostas
                  exportadas do formulário Google Forms da clínica.
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[11px] bg-white border-[#C9A46A]/40 text-[#8C6527]"
              >
                Leitura 100% no navegador (Client-side)
              </Badge>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Info className="h-4 w-4 text-amber-700 shrink-0" />
                Como funciona a importação inteligente:
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px] pl-1">
                <li>
                  <strong>Segurança e Privacidade:</strong> O arquivo é processado localmente no seu
                  computador e nenhuma linha de dado fica gravada no código do sistema.
                </li>
                <li>
                  <strong>Detecção de Colunas:</strong> O sistema mapeia automaticamente colunas
                  como "Nome completo", "CPF", "Telefone", "Endereço", "Queixa", "Atividades" e
                  "Observações".
                </li>
                <li>
                  <strong>Anti-duplicidade:</strong> Pacientes com o mesmo CPF ou mesmo Nome +
                  Telefone são preservados e identificados como ignorados no relatório.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ETAPA 2: PRÉ-VISUALIZAÇÃO E AJUSTE DO MAPEAMENTO */}
        {step === 2 && (
          <div className="py-4 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E3C89A]/60">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#8C6527]">Arquivo carregado:</span>
                <p className="text-sm font-bold text-gray-900 truncate">{fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-white border-[#C9A46A]/50 text-[#8C6527] text-xs font-bold"
                >
                  {rawRows.length} linhas detectadas
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  className="h-8 text-xs text-gray-600 hover:text-gray-900"
                >
                  Trocar arquivo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Mapeamento de Colunas</h4>
                  <p className="text-xs text-gray-500">
                    Confirme ou ajuste qual coluna da planilha corresponde a cada campo do
                    prontuário SOUL.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200"
                >
                  {Object.keys(mapping).length} campos mapeados
                </Badge>
              </div>

              {/* Tabela de Mapeamento */}
              <div className="max-h-[340px] overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/50 p-3 space-y-2.5">
                {TARGET_FIELDS.map((field) => {
                  const currentMappedHeader = mapping[field.key] || ''
                  const sampleValue = currentMappedHeader
                    ? previewSampleRow[currentMappedHeader]
                    : ''

                  return (
                    <div
                      key={field.key}
                      className="p-3 bg-white rounded-xl border border-gray-100 hover:border-[#C9A46A]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0 md:w-5/12">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">{field.label}</span>
                          {field.required && (
                            <span className="text-xs font-bold text-red-500">*</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{field.description}</p>
                      </div>

                      <div className="md:w-7/12 flex flex-col sm:flex-row sm:items-center gap-2">
                        <Select
                          value={currentMappedHeader || '__none__'}
                          onValueChange={(val) => {
                            setMapping((prev) => {
                              const next = { ...prev }
                              if (val === '__none__') {
                                delete next[field.key]
                              } else {
                                next[field.key] = val
                              }
                              return next
                            })
                          }}
                        >
                          <SelectTrigger className="h-8 rounded-lg border-gray-200 text-xs w-full bg-white">
                            <SelectValue placeholder="Ignorar campo..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            <SelectItem value="__none__" className="text-xs text-gray-400 italic">
                              (Não importar / Ignorar)
                            </SelectItem>
                            {fileHeaders.map((hdr) => (
                              <SelectItem key={hdr} value={hdr} className="text-xs">
                                {hdr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Amostra da primeira linha */}
                        {currentMappedHeader && (
                          <div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 max-w-xs truncate shrink-0">
                            Ex:{' '}
                            <span className="font-mono text-gray-800">
                              {String(sampleValue || '(vazio)')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Aviso de Nome Obrigatório */}
            {!mapping.nome && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span>
                  O campo <strong>"Nome completo"</strong> é obrigatório para cadastrar pacientes.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ETAPA 3: PROCESSANDO E RELATÓRIO FINAL */}
        {step === 3 && (
          <div className="py-4 space-y-6">
            {isImporting ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#C9A46A]" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-gray-900">
                    Importando pacientes para a Clínica SOUL...
                  </h4>
                  <p className="text-xs text-gray-500">{importCurrentText}</p>
                </div>
                <div className="w-full max-w-md space-y-1 pt-2">
                  <Progress value={importProgress} className="h-2.5 rounded-full" />
                  <span className="text-xs font-mono font-bold text-[#8C6527]">
                    {importProgress}%
                  </span>
                </div>
              </div>
            ) : report ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Resumo em cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                      Total Lidas
                    </span>
                    <span className="text-2xl font-black text-gray-900">{report.totalRead}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                      Importados
                    </span>
                    <span className="text-2xl font-black text-emerald-700">
                      {report.importedCount}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                      Duplicados
                    </span>
                    <span className="text-2xl font-black text-amber-700">
                      {report.ignoredDuplicateCount}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                    <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                      Com Erro
                    </span>
                    <span className="text-2xl font-black text-rose-700">{report.errorsCount}</span>
                  </div>
                </div>

                {/* Banner de status */}
                <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E3C89A]/80 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold text-[#33221C]">
                      Processo de importação concluído!
                    </h5>
                    <p className="text-xs text-[#73574A]">
                      Foram criados <strong>{report.importedCount}</strong> novos prontuários com
                      status <strong>Ativo</strong>. Nenhum dado pré-existente foi sobrescrito.
                    </p>
                  </div>
                </div>

                {/* Lista de duplicados (se houver) */}
                {report.duplicatesList.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Registros ignorados por duplicidade ({report.duplicatesList.length})
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium">
                        Preservados sem alteração
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {report.duplicatesList.slice(0, 30).map((dup, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] bg-white p-2 rounded-lg border border-amber-100 flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-gray-800 truncate">
                            Linha {dup.line}: {dup.nome}
                          </span>
                          <span className="text-[10px] text-amber-700 shrink-0 font-medium">
                            {dup.motivo}
                          </span>
                        </div>
                      ))}
                      {report.duplicatesList.length > 30 && (
                        <p className="text-[10px] text-gray-400 italic text-center pt-1">
                          + {report.duplicatesList.length - 30} outros duplicados ignorados
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de erros (se houver) */}
                {report.errorsList.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      Linhas que apresentaram erro ({report.errorsList.length})
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {report.errorsList.slice(0, 20).map((errRow, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] bg-white p-2 rounded-lg border border-rose-100 flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-gray-800 truncate">
                            Linha {errRow.line}: {errRow.nome}
                          </span>
                          <span className="text-[10px] text-rose-600 shrink-0">
                            {errRow.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          {step === 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 w-full sm:w-auto text-xs"
            >
              Cancelar
            </Button>
          )}

          {step === 2 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-xl h-10 w-full sm:w-auto text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={handleProceedToImport}
                className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-5 text-xs shadow-sm border border-[#DFBF8E]/40 w-full sm:w-auto flex items-center gap-1.5"
              >
                Iniciar Importação ({rawRows.length} linhas)
                <ArrowRight className="h-3.5 w-3.5 text-[#33221C]" />
              </Button>
            </>
          )}

          {step === 3 && (
            <div className="w-full flex justify-end">
              <Button
                type="button"
                disabled={isImporting}
                onClick={() => {
                  onOpenChange(false)
                  resetAll()
                }}
                className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-6 text-xs shadow-sm border border-[#DFBF8E]/40"
              >
                Fechar Relatório
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
