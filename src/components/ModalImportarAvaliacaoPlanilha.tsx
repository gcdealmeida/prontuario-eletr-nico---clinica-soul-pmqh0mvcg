import { useState, useRef, useId, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  UserCheck,
  UserPlus,
  Activity,
  FileText,
  Calendar,
  Sparkles,
  Check,
  Info,
  Layers,
  HeartPulse,
  Scale,
  Footprints,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getAllPacientes, createPaciente } from '@/services/pacientes'
import { createAvaliacao, createTimelineEvent } from '@/services/avaliacoes'
import { createEvolucao } from '@/services/evolucoes'
import type { PacienteRecord } from '@/types/database'
import {
  parseAvaliacaoWorkbook,
  buildAvaliacaoPayloadFromPlanilha,
  buildEvolucoesPayloadFromPlanilha,
  type ParsedPlanilhaAvaliacao,
} from '@/services/importacaoAvaliacao'
import { normalizeCPF, normalizeNameForCompare } from '@/components/ModalImportarPacientes'

interface ModalImportarAvaliacaoPlanilhaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacientePredefinidoId?: string
  pacientePredefinidoNome?: string
  onSuccess?: (resultado: {
    pacienteId: string
    avaliacaoId: string
    evolucoesCount: number
  }) => void
}

export function ModalImportarAvaliacaoPlanilha({
  open,
  onOpenChange,
  pacientePredefinidoId,
  pacientePredefinidoNome,
  onSuccess,
}: ModalImportarAvaliacaoPlanilhaProps) {
  const { toast } = useToast()
  const { user, isAdmin } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [loadingFile, setLoadingFile] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedPlanilhaAvaliacao | null>(null)

  // Pacientes existentes para match de CPF / Nome
  const [existingPacientes, setExistingPacientes] = useState<PacienteRecord[]>([])
  const [matchedPaciente, setMatchedPaciente] = useState<PacienteRecord | null>(null)
  const [pacienteMode, setPacienteMode] = useState<'link' | 'create'>('link')

  // Campos editáveis do Paciente antes de confirmar
  const [editNome, setEditNome] = useState('')
  const [editCpf, setEditCpf] = useState('')
  const [editDataNasc, setEditDataNasc] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editEndereco, setEditEndereco] = useState('')
  const [editProfissao, setEditProfissao] = useState('')

  // Campos editáveis da Avaliação
  const [editQueixaPrincipal, setEditQueixaPrincipal] = useState('')
  const [editDesdeQuando, setEditDesdeQuando] = useState('')
  const [editEva, setEditEva] = useState<number>(5)
  const [editDiagnostico, setEditDiagnostico] = useState('')
  const [editObjetivos, setEditObjetivos] = useState('')

  // Opções de importação
  const [importarEvolucoes, setImportarEvolucoes] = useState(true)

  // Estado de execução da importação (Etapa 3)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importReport, setImportReport] = useState<{
    pacienteNome: string
    pacienteCriado: boolean
    pacienteId: string
    avaliacaoId: string
    secoesImportadas: string[]
    evolucoesImportadas: number
    erros: string[]
  } | null>(null)

  // Carrega lista de pacientes para auto-match
  useEffect(() => {
    if (open) {
      getAllPacientes()
        .then(setExistingPacientes)
        .catch((err) => console.warn('Erro ao carregar pacientes para auto-match:', err))
    }
  }, [open])

  // Reset ao fechar
  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen && !importing) {
      setStep(1)
      setFileName('')
      setFileSize(0)
      setParsedData(null)
      setMatchedPaciente(null)
      setImportReport(null)
      setImportProgress(0)
    }
    onOpenChange(newOpen)
  }

  // Leitura do arquivo .xlsx no navegador (sem upload de arquivo no backend)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setFileSize(file.size)
    setLoadingFile(true)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

      const parsed = parseAvaliacaoWorkbook(workbook, file.name)
      setParsedData(parsed)

      // Preenche os campos editáveis
      setEditNome(parsed.pacienteIdentificado.nome || pacientePredefinidoNome || '')
      setEditCpf(parsed.pacienteIdentificado.cpf || '')
      setEditDataNasc(
        parsed.pacienteIdentificado.dataNascimento
          ? parsed.pacienteIdentificado.dataNascimento.substring(0, 10)
          : '',
      )
      setEditTelefone(parsed.pacienteIdentificado.contato || '')
      setEditEndereco(parsed.pacienteIdentificado.endereco || '')
      setEditProfissao(parsed.pacienteIdentificado.profissao || '')

      setEditQueixaPrincipal(parsed.anamnese.queixaPrincipal || '')
      setEditDesdeQuando(parsed.anamnese.desdeQuando || '')
      setEditEva(parsed.anamnese.eva || 5)
      setEditDiagnostico(parsed.anamnese.diagnosticoMedico || '')
      setEditObjetivos(parsed.anamnese.objetivos || '')

      // Tenta encontrar paciente existente por CPF ou Nome (ou paciente pré-definido da rota)
      let found: PacienteRecord | undefined = undefined

      if (pacientePredefinidoId) {
        found = existingPacientes.find((p) => p.id === pacientePredefinidoId)
      }

      if (!found && parsed.pacienteIdentificado.cpf) {
        const normPlanilhaCpf = normalizeCPF(parsed.pacienteIdentificado.cpf)
        found = existingPacientes.find((p) => p.cpf && normalizeCPF(p.cpf) === normPlanilhaCpf)
      }

      if (!found && parsed.pacienteIdentificado.nome) {
        const normPlanilhaNome = normalizeNameForCompare(parsed.pacienteIdentificado.nome)
        found = existingPacientes.find((p) => normalizeNameForCompare(p.nome) === normPlanilhaNome)
      }

      if (found) {
        setMatchedPaciente(found)
        setPacienteMode('link')
      } else {
        setMatchedPaciente(null)
        setPacienteMode('create')
      }

      setStep(2)
    } catch (err: any) {
      console.error('Erro ao ler planilha de avaliação:', err)
      toast({
        title: 'Erro ao processar planilha',
        description: err?.message || 'Verifique se o arquivo é um .xlsx válido.',
        variant: 'destructive',
      })
    } finally {
      setLoadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Executa a importação das entidades
  const handleConfirmImport = async () => {
    if (!parsedData) return

    setImporting(true)
    setImportProgress(10)

    const erros: string[] = []
    const secoesImportadas: string[] = []
    let finalPacienteId = matchedPaciente?.id || ''
    let pacienteCriado = false
    let finalAvaliacaoId = ''
    let evolucoesCount = 0

    try {
      // 1. Criar ou vincular Paciente
      if (pacienteMode === 'create' || !finalPacienteId) {
        setImportProgress(20)
        const novoPaciente = await createPaciente({
          nome: editNome.trim() || 'Paciente Importado',
          cpf: editCpf.trim() ? normalizeCPF(editCpf) : undefined,
          data_nascimento: editDataNasc ? `${editDataNasc} 00:00:00.000Z` : undefined,
          telefone: editTelefone.trim() || undefined,
          endereco: editEndereco.trim() || undefined,
          status: 'Ativo',
          diagnostico_medico: editDiagnostico.trim() || undefined,
          motivo_procura: editQueixaPrincipal.trim() || undefined,
          tratamentos_anteriores: parsedData.anamnese.tratamentosAnteriores || undefined,
          atividade_fisica: parsedData.anamnese.atividadeFisica || undefined,
          observacoes: `Paciente cadastrado automaticamente via importação de planilha de avaliação (${parsedData.arquivoNome}).`,
        })
        finalPacienteId = novoPaciente.id
        pacienteCriado = true
        secoesImportadas.push('Cadastro de Paciente')
      } else {
        secoesImportadas.push(`Paciente Vinculado (${matchedPaciente?.nome})`)
      }

      setImportProgress(40)

      // 2. Atualizar dados editados no parsedData antes de gerar o payload
      parsedData.anamnese.queixaPrincipal = editQueixaPrincipal
      parsedData.anamnese.desdeQuando = editDesdeQuando
      parsedData.anamnese.eva = editEva
      parsedData.anamnese.diagnosticoMedico = editDiagnostico
      parsedData.anamnese.objetivos = editObjetivos

      // 3. Montar e criar Avaliação de Fisioterapia
      const avaliacaoPayload = buildAvaliacaoPayloadFromPlanilha(
        parsedData,
        finalPacienteId,
        user?.id,
      )

      setImportProgress(60)

      const avaliacaoCriada = await createAvaliacao('avaliacoes_fisioterapia', avaliacaoPayload)
      finalAvaliacaoId = avaliacaoCriada.id
      secoesImportadas.push('Avaliação de Fisioterapia Completa')
      if (parsedData.anamnese.queixaPrincipal)
        secoesImportadas.push('Anamnese Estratégica & Queixas')
      if (Object.keys(parsedData.anamnese.visceras).length > 0)
        secoesImportadas.push('Vísceras Sistêmicas')
      if (Object.keys(parsedData.anamnese.habitos).length > 0)
        secoesImportadas.push('Hábitos de Saúde & Sono')
      if (parsedData.anamnese.examesComplementares.length > 0)
        secoesImportadas.push('Laudos de Exames Complementares')
      if (Object.keys(parsedData.exameFisico.inspecaoEstatica).length > 0)
        secoesImportadas.push('Inspeção Estática')
      if (parsedData.exameFisico.palpacao) secoesImportadas.push('Palpação Clínica')
      if (Object.keys(parsedData.cirtometria.medidas).length > 0)
        secoesImportadas.push('Cirtometria / Perimetria')
      if (parsedData.testesFuncionais.pranchaVentral || parsedData.testesFuncionais.ponteUniD)
        secoesImportadas.push('Testes Funcionais de Core')
      if (parsedData.testesEspeciais.ombro && parsedData.testesEspeciais.ombro.length > 0)
        secoesImportadas.push('Testes Especiais de Ombro')
      if (parsedData.podal.elementosPrescritos && parsedData.podal.elementosPrescritos.length > 0)
        secoesImportadas.push('Avaliação Podopostural & Palmilha')

      secoesImportadas.push('Dados Importados da Planilha (Bloco Geral Sem Perdas)')

      // Timeline de criação da avaliação
      try {
        await createTimelineEvent({
          paciente_id: finalPacienteId,
          tipo: 'Avaliação',
          especialidade: 'Fisioterapia',
          titulo: `Avaliação de Fisioterapia Importada (${parsedData.arquivoNome})`,
          conteudo: `Avaliação completa importada da planilha clínica. Queixa principal: ${editQueixaPrincipal || '—'}.`,
          data_evento: parsedData.anamnese.dataAvaliacao || new Date().toISOString(),
        })
      } catch (errTimeline) {
        console.warn('Erro ao registrar timeline da avaliação importada:', errTimeline)
      }

      setImportProgress(75)

      // 4. Criar Evoluções se solicitado
      if (importarEvolucoes && parsedData.evolucoes.length > 0) {
        const evolucoesPayloads = buildEvolucoesPayloadFromPlanilha(
          parsedData,
          finalPacienteId,
          finalAvaliacaoId,
          user?.name || 'Profissional SOUL',
        )

        for (let i = 0; i < evolucoesPayloads.length; i++) {
          try {
            await createEvolucao(evolucoesPayloads[i], {
              addToTimeline: false,
              assinarImediatamente: false, // Regra: sem assinatura, marcadas como importadas
            })
            evolucoesCount++
          } catch (errEvo: any) {
            console.warn(`Erro ao importar evolução ${i + 1}:`, errEvo)
            erros.push(
              `Evolução de ${parsedData.evolucoes[i]?.data || 'data'}: ${errEvo?.message || 'Falha'}`,
            )
          }
          const prog = 75 + Math.round(((i + 1) / evolucoesPayloads.length) * 20)
          setImportProgress(prog)
        }

        secoesImportadas.push(`${evolucoesCount} Evoluções Clínicas Agrupadas por Data (Rascunho)`)
      }

      setImportProgress(100)

      setImportReport({
        pacienteNome: editNome.trim() || matchedPaciente?.nome || 'Paciente',
        pacienteCriado,
        pacienteId: finalPacienteId,
        avaliacaoId: finalAvaliacaoId,
        secoesImportadas,
        evolucoesImportadas: evolucoesCount,
        erros,
      })

      setStep(3)

      toast({
        title: 'Importação concluída com sucesso!',
        description: `Avaliação e ${evolucoesCount} evoluções inseridas no prontuário.`,
      })

      if (onSuccess) {
        onSuccess({
          pacienteId: finalPacienteId,
          avaliacaoId: finalAvaliacaoId,
          evolucoesCount,
        })
      }
    } catch (err: any) {
      console.error('Erro na importação da avaliação:', err)
      toast({
        title: 'Falha durante a importação',
        description: err?.message || 'Verifique as permissões ou se o CPF já está cadastrado.',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-[#FAF7F1]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#8C6527]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Importar Avaliação (Planilha .xlsx)
                </DialogTitle>
                <p className="text-xs text-gray-500">
                  Lê todas as abas da pasta de trabalho e preenche o paciente, avaliação e
                  evoluções.
                </p>
              </div>
            </div>

            {/* Stepper badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[11px] px-2.5 py-0.5 rounded-full ${
                  step === 1
                    ? 'border-[#C9A46A] bg-[#FAF5EE] text-[#8C6527] font-bold'
                    : 'text-gray-400 border-gray-200'
                }`}
              >
                1. Upload
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] px-2.5 py-0.5 rounded-full ${
                  step === 2
                    ? 'border-[#C9A46A] bg-[#FAF5EE] text-[#8C6527] font-bold'
                    : 'text-gray-400 border-gray-200'
                }`}
              >
                2. Pré-Visualização
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] px-2.5 py-0.5 rounded-full ${
                  step === 3
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-gray-400 border-gray-200'
                }`}
              >
                3. Relatório
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ETAPA 1: UPLOAD */}
          {step === 1 && (
            <div className="space-y-6 py-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#C9A46A]/50 hover:border-[#C9A46A] bg-[#FAF7F1]/40 hover:bg-[#FAF7F1]/80 rounded-3xl p-10 text-center cursor-pointer transition-all space-y-4 group"
              >
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mx-auto h-16 w-16 rounded-2xl bg-white border border-[#E9E1D2] flex items-center justify-center text-[#8C6527] shadow-sm group-hover:scale-105 transition-transform">
                  {loadingFile ? (
                    <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-gray-900">
                    Selecione a planilha de avaliação (.xlsx)
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    A planilha é lida inteiramente no navegador sem trafegar para servidores
                    externos, identificando automaticamente as abas de Anamnese, Exame Físico,
                    Evolução, Testes e Perimetria.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#C9A46A]/70 text-[#8C6527] bg-white hover:bg-amber-50/50 text-xs font-semibold"
                >
                  Procurar arquivo no computador
                </Button>
              </div>

              {/* Informações de conformidade e privacidade */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Info className="h-4 w-4 text-blue-600" />
                  Regras de Importação de Avaliação:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-blue-800">
                  <li>
                    <strong>Estrutura esperada:</strong> Abas "ANAMNESE", "EXAME FÍSICO",
                    "Evolução", "Testes Funcionais", "Cirtometria", "Goniometria", etc.
                  </li>
                  <li>
                    <strong>Aba "Proposta $":</strong> Aba comercial de orçamentos é ignorada por
                    segurança.
                  </li>
                  <li>
                    <strong>Evoluções:</strong> Linhas consecutivas são agrupadas por data e salvas
                    como rascunho clínico não assinado, preservando integridade legal.
                  </li>
                  <li>
                    <strong>Identificação do paciente:</strong> Busca correspondência por CPF ou
                    Nome. Caso não exista, o paciente é pré-cadastrado no mesmo instante.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ETAPA 2: PRÉ-VISUALIZAÇÃO EDITÁVEL */}
          {step === 2 && parsedData && (
            <div className="space-y-6">
              {/* Resumo do Arquivo e Paciente Detectado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Arquivo Carregado
                  </span>
                  <p className="text-xs font-bold text-gray-900 truncate" title={fileName}>
                    {fileName}
                  </p>
                  <span className="text-[11px] text-gray-500 block">
                    {parsedData.abasEncontradas.length} abas detectadas (
                    {parsedData.diagnosticoImportacao.abasReconhecidas.length} clínicas)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                      Vínculo do Paciente
                    </span>
                    {matchedPaciente ? (
                      <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Paciente Encontrado
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <UserPlus className="h-3 w-3" /> Novo Paciente
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs font-bold text-gray-900">
                    {matchedPaciente
                      ? `Vinculando ao prontuário de ${matchedPaciente.nome}`
                      : `Será cadastrado um novo paciente: ${editNome || 'Sem Nome'}`}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {matchedPaciente
                      ? `CPF: ${matchedPaciente.cpf || '—'} | ID: ${matchedPaciente.id}`
                      : 'O cadastro será criado com os dados detectados na Anamnese.'}
                  </p>
                </div>
              </div>

              {/* Painel de Transparência de Leitura: Campos Reconhecidos vs Não Encontrados */}
              <div className="rounded-2xl border border-gray-200 bg-white p-3.5 space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    Diagnóstico Estrutural da Leitura da Planilha
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {parsedData.diagnosticoImportacao.camposReconhecidos.length} itens reconhecidos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {/* Campos reconhecidos */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      Campos & Seções Reconhecidos:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {parsedData.diagnosticoImportacao.camposReconhecidos.map((campo, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] bg-white text-emerald-800 border-emerald-200 font-medium"
                        >
                          {campo}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Campos não encontrados no arquivo */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      Não Encontrados / Opcionais na Planilha:
                    </span>
                    {parsedData.diagnosticoImportacao.camposNaoEncontrados.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {parsedData.diagnosticoImportacao.camposNaoEncontrados.map((campo, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] bg-white text-amber-900 border-amber-200 font-normal"
                          >
                            {campo} (vazio)
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-emerald-700 italic">
                        Todos os campos essenciais foram identificados!
                      </p>
                    )}
                  </div>
                </div>

                {/* Aviso explícito amigável sobre campos não encontrados */}
                {parsedData.diagnosticoImportacao.camposNaoEncontrados.length > 0 && (
                  <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <Info className="h-3.5 w-3.5 inline mr-1 text-gray-400" />
                    <strong>Dica:</strong> Os campos vazios acima podem ser digitados diretamente
                    nas abas abaixo antes de confirmar a importação, caso deseje complementá-los
                    agora.
                  </p>
                )}
              </div>

              {/* Tabs de Revisão antes de Confirmar */}
              <Tabs defaultValue="paciente" className="w-full">
                <TabsList className="bg-gray-100/80 p-1 rounded-2xl w-full grid grid-cols-4 h-auto text-xs">
                  <TabsTrigger value="paciente" className="rounded-xl py-2 font-semibold">
                    1. Paciente
                  </TabsTrigger>
                  <TabsTrigger value="anamnese" className="rounded-xl py-2 font-semibold">
                    2. Anamnese
                  </TabsTrigger>
                  <TabsTrigger value="evolucoes" className="rounded-xl py-2 font-semibold">
                    3. Evoluções ({parsedData.evolucoes.length})
                  </TabsTrigger>
                  <TabsTrigger value="extras" className="rounded-xl py-2 font-semibold">
                    4. Testes & Outros
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: PACIENTE */}
                <TabsContent value="paciente" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-700">Nome Completo *</Label>
                        {parsedData.pacienteIdentificado.nome ? (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            Encontrado na planilha: {parsedData.pacienteIdentificado.nome}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">
                            Não encontrado no arquivo (digite abaixo)
                          </span>
                        )}
                      </div>
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        placeholder="Nome do paciente"
                        className="h-9 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">CPF</Label>
                      <Input
                        value={editCpf}
                        onChange={(e) => setEditCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-700">
                          Data de Nascimento
                        </Label>
                        {parsedData.anamnese.idade && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            Idade na planilha: {parsedData.anamnese.idade} anos
                          </span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={editDataNasc}
                        onChange={(e) => setEditDataNasc(e.target.value)}
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">
                        Telefone / Contato
                      </Label>
                      <Input
                        value={editTelefone}
                        onChange={(e) => setEditTelefone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Profissão</Label>
                      <Input
                        value={editProfissao}
                        onChange={(e) => setEditProfissao(e.target.value)}
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Endereço</Label>
                      <Input
                        value={editEndereco}
                        onChange={(e) => setEditEndereco(e.target.value)}
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: ANAMNESE */}
                <TabsContent value="anamnese" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-medium text-gray-700">
                        Queixa Principal *
                      </Label>
                      <Input
                        value={editQueixaPrincipal}
                        onChange={(e) => setEditQueixaPrincipal(e.target.value)}
                        placeholder="Principal motivo da busca"
                        className="h-9 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">EVA da Dor (0-10)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={editEva}
                        onChange={(e) => setEditEva(Number(e.target.value))}
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-medium text-gray-700">
                        Diagnóstico Médico
                      </Label>
                      <Input
                        value={editDiagnostico}
                        onChange={(e) => setEditDiagnostico(e.target.value)}
                        placeholder="Laudo ou hipótese médica trazida"
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Desde quando?</Label>
                      <Input
                        value={editDesdeQuando}
                        onChange={(e) => setEditDesdeQuando(e.target.value)}
                        placeholder="Tempo de evolução"
                        className="h-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">
                      Histórico da Doença / Linha do Tempo da Dor
                    </Label>
                    <Textarea
                      rows={4}
                      defaultValue={parsedData.anamnese.historico}
                      onChange={(e) => (parsedData.anamnese.historico = e.target.value)}
                      className="rounded-xl text-xs leading-relaxed"
                    />
                  </div>

                  {/* Laudos de Exames detectados */}
                  {parsedData.anamnese.examesComplementares.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-gray-900 block">
                        Exames Complementares Identificados (
                        {parsedData.anamnese.examesComplementares.length}):
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {parsedData.anamnese.examesComplementares.map((exame, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-800 whitespace-pre-wrap"
                          >
                            {exame}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: EVOLUÇÕES */}
                <TabsContent value="evolucoes" className="pt-4 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="check-evos"
                        checked={importarEvolucoes}
                        onChange={(e) => setImportarEvolucoes(e.target.checked)}
                        className="h-4 w-4 rounded text-[#C9A46A] border-gray-300 focus:ring-[#C9A46A]"
                      />
                      <label htmlFor="check-evos" className="text-xs font-bold text-gray-800">
                        Importar {parsedData.evolucoes.length} sessões de evolução detectadas
                      </label>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-amber-700 border-amber-300"
                    >
                      Salvas como rascunho não assinado
                    </Badge>
                  </div>

                  {parsedData.evolucoes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 italic">
                      Nenhuma sessão de evolução identificada nesta planilha.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {parsedData.evolucoes.map((evo, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#8C6527] flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" /> Data da Sessão: {evo.data}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {evo.avaliacaoNotas.length + evo.evolucaoProcedimentos.length}{' '}
                              anotações
                            </span>
                          </div>
                          {evo.avaliacaoNotas.length > 0 && (
                            <p className="text-gray-700 text-[11px] leading-relaxed">
                              <strong>Avaliação:</strong> {evo.avaliacaoNotas.join(' • ')}
                            </p>
                          )}
                          {evo.evolucaoProcedimentos.length > 0 && (
                            <p className="text-blue-800 text-[11px] leading-relaxed">
                              <strong>Conduta:</strong> {evo.evolucaoProcedimentos.join(' • ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* TAB 4: TESTES & OUTROS DADOS */}
                <TabsContent value="extras" className="pt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Testes Funcionais */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <span className="font-bold text-gray-900 block">
                        Testes Funcionais de Core (McGill)
                      </span>
                      <div className="space-y-1 text-gray-700 text-[11px]">
                        <div>
                          Prancha Ventral:{' '}
                          <strong className="text-gray-900">
                            {parsedData.testesFuncionais.pranchaVentral || '—'}s
                          </strong>
                        </div>
                        <div>
                          Prancha Lateral (D / E):{' '}
                          <strong className="text-gray-900">
                            {parsedData.testesFuncionais.pranchaLateralD || '—'}s /{' '}
                            {parsedData.testesFuncionais.pranchaLateralE || '—'}s
                          </strong>
                        </div>
                        <div>
                          Ponte Unilateral (D / E):{' '}
                          <strong className="text-gray-900">
                            {parsedData.testesFuncionais.ponteUniD || '—'}s /{' '}
                            {parsedData.testesFuncionais.ponteUniE || '—'}s
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Cirtometria */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <span className="font-bold text-gray-900 block">
                        Cirtometria ({Object.keys(parsedData.cirtometria.medidas).length} regiões)
                      </span>
                      <div className="space-y-1 text-gray-700 text-[11px] max-h-32 overflow-y-auto">
                        {Object.entries(parsedData.cirtometria.medidas).map(([k, v]) => (
                          <div
                            key={k}
                            className="flex justify-between border-b border-gray-100 pb-0.5"
                          >
                            <span>{k}</span>
                            <span className="font-mono font-medium">
                              E: {v.esquerdo || '—'} | D: {v.direito || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testes Especiais de Ombro */}
                  {parsedData.testesEspeciais.ombro &&
                    parsedData.testesEspeciais.ombro.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                        <span className="font-bold text-gray-900 block">
                          Testes Especiais de Ombro ({parsedData.testesEspeciais.ombro.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          {parsedData.testesEspeciais.ombro.map((t, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-2 rounded-xl border border-gray-200"
                            >
                              <span className="font-bold block truncate">{t.nome}</span>
                              <span className="text-gray-500 text-[10px]">
                                D: {t.direito || '—'} | E: {t.esquerdo || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Palmilha e Elementos Podais */}
                  {parsedData.podal.elementosPrescritos &&
                    parsedData.podal.elementosPrescritos.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                        <span className="font-bold text-gray-900 block">
                          Elementos da Palmilha / Avaliação Podal (
                          {parsedData.podal.elementosPrescritos.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedData.podal.elementosPrescritos.map((elem, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[10px] bg-white border-amber-300 text-amber-900"
                            >
                              {elem}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ETAPA 3: RELATÓRIO FINAL */}
          {step === 3 && importReport && (
            <div className="space-y-6 py-2">
              <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950">
                  Importação Finalizada com Sucesso!
                </h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Todos os dados da planilha foram processados, estruturados e registrados no banco
                  de dados da SOUL.
                </p>
              </div>

              {/* Detalhamento das seções criadas */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-900 block">
                  Resumo das Seções Gravadas no Prontuário:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {importReport.secoesImportadas.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-gray-200 flex items-center gap-2.5 shadow-2xs"
                    >
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-gray-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertas de erro caso alguma evolução pontual tenha falhado */}
              {importReport.erros.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Alertas da importação:
                  </span>
                  <ul className="list-disc pl-5 space-y-0.5 text-amber-800 text-[11px]">
                    {importReport.erros.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between">
          {step === 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleDialogChange(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
          )}

          {step === 2 && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={importing}
                onClick={() => setStep(1)}
                className="rounded-xl text-xs gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>

              <div className="flex items-center gap-2">
                {importing && (
                  <div className="flex items-center gap-2 pr-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#C9A46A]" />
                    <span className="text-xs text-gray-500 font-medium">Gravando dados...</span>
                  </div>
                )}
                <Button
                  type="button"
                  disabled={importing || !editNome.trim()}
                  onClick={handleConfirmImport}
                  className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl text-xs px-5 h-10 shadow-sm"
                >
                  Confirmar e Importar Avaliação
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <Button
              type="button"
              onClick={() => handleDialogChange(false)}
              className="bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-bold rounded-xl text-xs px-6 h-10 ml-auto"
            >
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
