import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  FileText,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Edit,
  Plus,
  Loader2,
  Activity,
  CheckCircle2,
  Info,
  ShieldCheck,
  Dumbbell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPacienteById, updatePaciente } from '@/services/pacientes'
import { getTimelineByPaciente, getAvaliacoesByPaciente } from '@/services/avaliacoes'
import type {
  PacienteRecord,
  TimelineRecord,
  Especialidade,
  StatusPaciente,
} from '@/types/database'
import {
  ESPECIALIDADE_COLORS,
  formatCPF,
  formatTelefone,
  formatDataPTBR,
  formatDataHoraPTBR,
  getInitials,
} from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { NovaConsultaModal } from '@/components/NovaConsultaModal'
import { ModalImportarAvaliacaoPlanilha } from '@/components/ModalImportarAvaliacaoPlanilha'
import { ModalMesclarPacientes } from '@/components/ModalMesclarPacientes'
import { useAuth } from '@/contexts/AuthContext'
import { ativarCadastroPaciente } from '@/services/pacientes'
import { FileSpreadsheet, GitMerge, UserCheck, ShieldCheck } from 'lucide-react'
import { EvaBadge } from '@/components/ReguaEva'
import { TrajetoriaEvaGrafico } from '@/components/TrajetoriaEvaGrafico'
import { SecaoEvolucoes } from '@/components/SecaoEvolucoes'

export default function PacienteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const initialTab = searchParams.get('tab') || 'timeline'
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [paciente, setPaciente] = useState<PacienteRecord | null>(null)
  const [timeline, setTimeline] = useState<TimelineRecord[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  // Avaliações agrupadas
  const [avaliacoes, setAvaliacoes] = useState<{
    fisio: any[]
    personal: any[]
    nutri: any[]
    medico: any[]
  }>({ fisio: [], personal: [], nutri: [], medico: [] })

  // Evoluções clínicas do paciente
  const [evolucoesPaciente, setEvolucoesPaciente] = useState<any[]>([])

  // Programas de Treino do paciente
  const [programasPaciente, setProgramasPaciente] = useState<any[]>([])

  // Modal Consulta
  const [consultaModalOpen, setConsultaModalOpen] = useState(false)

  // Modal Importar Avaliação
  const [importAvaliacaoModalOpen, setImportAvaliacaoModalOpen] = useState(false)

  // Edit Tab Form
  const [editNome, setEditNome] = useState('')
  const [editCpf, setEditCpf] = useState('')
  const [editDataNasc, setEditDataNasc] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editEndereco, setEditEndereco] = useState('')
  const [editObs, setEditObs] = useState('')
  const [editStatus, setEditStatus] = useState<StatusPaciente>('Ativo')
  const [editOrigem, setEditOrigem] = useState('')
  const [editMotivo, setEditMotivo] = useState('')
  const [editLimitacoes, setEditLimitacoes] = useState('')
  const [editTratamentos, setEditTratamentos] = useState('')
  const [editResultado, setEditResultado] = useState('')
  const [editDiagnostico, setEditDiagnostico] = useState('')
  const [editGenero, setEditGenero] = useState('')
  const [editQueixaDorOnde, setEditQueixaDorOnde] = useState('')
  const [editAtividadeFisica, setEditAtividadeFisica] = useState('')
  const [editFrequenciaSemanal, setEditFrequenciaSemanal] = useState('')
  const [editDuracaoTreino, setEditDuracaoTreino] = useState('')
  const [editControleAlimentar, setEditControleAlimentar] = useState('')
  const [editQuemIndicou, setEditQuemIndicou] = useState('')
  const [savingDados, setSavingDados] = useState(false)
  const [activating, setActivating] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const p = await getPacienteById(id)
      setPaciente(p)
      setEditNome(p.nome)
      setEditCpf(p.cpf || '')
      setEditDataNasc(p.data_nascimento ? p.data_nascimento.substring(0, 10) : '')
      setEditTelefone(p.telefone || '')
      setEditEmail(p.email || '')
      setEditEndereco(p.endereco || '')
      setEditObs(p.observacoes || '')
      setEditStatus(p.status || 'Ativo')
      setEditOrigem(p.origem_como_chegou || '')
      setEditMotivo(p.motivo_procura || '')
      setEditLimitacoes(p.limitacoes_incomodo || '')
      setEditTratamentos(p.tratamentos_anteriores || '')
      setEditResultado(p.resultado_esperado || '')
      setEditDiagnostico(p.diagnostico_medico || '')
      setEditGenero(p.genero || '')
      setEditQueixaDorOnde(p.queixa_dor_onde || '')
      setEditAtividadeFisica(p.atividade_fisica || '')
      setEditFrequenciaSemanal(p.frequencia_semanal || '')
      setEditDuracaoTreino(p.duracao_treino || '')
      setEditControleAlimentar(p.controle_alimentar || '')
      setEditQuemIndicou(p.quem_indicou || '')

      // Timeline
      const t = await getTimelineByPaciente(id)
      setTimeline(t)

      // Avaliações
      const avs = await getAvaliacoesByPaciente(id)
      setAvaliacoes(avs)

      // Programas de Treino
      try {
        const { getProgramasByPaciente } = await import('@/services/programas')
        const progs = await getProgramasByPaciente(id)
        setProgramasPaciente(progs)
      } catch (errProgs) {
        console.warn('Erro ao carregar programas do paciente:', errProgs)
      }

      // Evoluções
      try {
        const { getEvolucoesByPaciente } = await import('@/services/evolucoes')
        const evos = await getEvolucoesByPaciente(id)
        setEvolucoesPaciente(evos)
      } catch (errEvos) {
        console.warn('Erro ao carregar evoluções do paciente:', errEvos)
      }
    } catch (err) {
      console.error('Erro ao carregar paciente:', err)
      toast({
        title: 'Paciente não encontrado',
        description: 'Não foi possível carregar as informações deste prontuário.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  // Sincroniza a aba quando a URL muda (ex: ?tab=evolucoes ou ?tab=avaliacoes)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (
      tabParam &&
      ['timeline', 'evolucoes', 'programas', 'avaliacoes', 'dados'].includes(tabParam)
    ) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Realtime timeline e evolucoes
  useRealtime('timeline', () => {
    if (id) {
      getTimelineByPaciente(id)
        .then(setTimeline)
        .catch(() => {})
    }
  })

  useRealtime('evolucoes', () => {
    if (id) {
      import('@/services/evolucoes').then(({ getEvolucoesByPaciente }) => {
        getEvolucoesByPaciente(id)
          .then(setEvolucoesPaciente)
          .catch(() => {})
      })
    }
  })

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  const handleAtivarCadastroEIrProntuario = async () => {
    if (!paciente) return
    try {
      setActivating(true)
      const res = await ativarCadastroPaciente(paciente.id)
      setPaciente((prev) => (prev ? { ...prev, status: 'Ativo' } : prev))
      toast({
        title: 'Cadastro ativado com sucesso!',
        description: 'Redirecionando automaticamente para abertura do prontuário...',
      })
      // Redireciona imediatamente para nova avaliação/prontuário com dados do pré-cadastro
      navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Fisioterapia`)
    } catch (err: any) {
      console.error('Erro ativando paciente:', err)
      toast({
        title: 'Erro ao ativar cadastro',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setActivating(false)
    }
  }

  const handleSaveDadosPessoais = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !paciente) return

    try {
      setSavingDados(true)
      const updated = await updatePaciente(id, {
        nome: editNome.trim(),
        cpf: editCpf.trim() || undefined,
        data_nascimento: editDataNasc ? `${editDataNasc} 00:00:00.000Z` : undefined,
        telefone: editTelefone.trim() || undefined,
        email: editEmail.trim() || undefined,
        endereco: editEndereco.trim() || undefined,
        observacoes: editObs.trim() || undefined,
        status: editStatus,
        origem_como_chegou: editOrigem.trim() || undefined,
        motivo_procura: editMotivo.trim() || undefined,
        limitacoes_incomodo: editLimitacoes.trim() || undefined,
        tratamentos_anteriores: editTratamentos.trim() || undefined,
        resultado_esperado: editResultado.trim() || undefined,
        diagnostico_medico: editDiagnostico.trim() || undefined,
        genero: editGenero.trim() || undefined,
        queixa_dor_onde: editQueixaDorOnde.trim() || undefined,
        atividade_fisica: editAtividadeFisica.trim() || undefined,
        frequencia_semanal: editFrequenciaSemanal.trim() || undefined,
        duracao_treino: editDuracaoTreino.trim() || undefined,
        controle_alimentar: editControleAlimentar.trim() || undefined,
        quem_indicou: editQuemIndicou.trim() || undefined,
      })
      setPaciente(updated)
      toast({
        title: 'Dados salvos com sucesso!',
        description: 'O prontuário do paciente foi atualizado.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Verifique as informações preenchidas.',
        variant: 'destructive',
      })
    } finally {
      setSavingDados(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
        <span className="text-sm text-[#73574A] font-medium">Carregando prontuário...</span>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Paciente não encontrado</h2>
        <Button onClick={() => navigate('/pacientes')} variant="outline">
          Voltar para lista de pacientes
        </Button>
      </div>
    )
  }

  // Especialidades avaliadas (chips)
  const espAvaliadas: Especialidade[] = []
  if (avaliacoes.fisio.length > 0) espAvaliadas.push('Fisioterapia')
  if (avaliacoes.personal.length > 0) espAvaliadas.push('Personal')
  if (avaliacoes.nutri.length > 0) espAvaliadas.push('Nutrição')
  if (avaliacoes.medico.length > 0) espAvaliadas.push('Médico')

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pacientes')}
          className="text-xs text-gray-500 hover:text-gray-900 -ml-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para Pacientes
        </Button>
      </div>

      {/* Header Block */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-2xl shadow-md border-2 border-white shrink-0">
              <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                {getInitials(paciente.nome)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {paciente.nome}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    paciente.status === 'Pré-cadastro'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold text-xs shadow-2xs'
                      : paciente.status === 'Ativo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                        : 'bg-gray-100 text-gray-600 border-gray-200 text-xs'
                  }
                >
                  {paciente.status === 'Pré-cadastro' ? '⚡ Pré-cadastro' : paciente.status}
                </Badge>
              </div>

              {/* Patient meta */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-600">
                <span className="font-mono">CPF: {formatCPF(paciente.cpf)}</span>
                {paciente.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {formatTelefone(paciente.telefone)}
                  </span>
                )}
                {paciente.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    {paciente.email}
                  </span>
                )}
                {paciente.endereco && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    {paciente.endereco}
                  </span>
                )}
              </div>

              {/* Specialty Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
                  Atendimentos:
                </span>
                {espAvaliadas.length === 0 ? (
                  <span className="text-xs text-gray-400 italic">Nenhuma avaliação realizada</span>
                ) : (
                  espAvaliadas.map((esp) => {
                    const style = ESPECIALIDADE_COLORS[esp]
                    return (
                      <span
                        key={esp}
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${style.badge}`}
                      >
                        {esp}
                      </span>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {paciente.status === 'Pré-cadastro' && (
              <Button
                onClick={handleAtivarCadastroEIrProntuario}
                disabled={activating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-4 text-xs shadow-sm flex items-center gap-1.5 border border-emerald-500/40"
              >
                {activating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ativando...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" /> Ativar Cadastro & Abrir Prontuário
                  </>
                )}
              </Button>
            )}

            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setMergeModalOpen(true)}
                className="rounded-xl h-10 px-3.5 text-xs font-semibold border-purple-300/80 bg-purple-50/70 text-purple-900 hover:bg-purple-100/70 flex items-center gap-1.5 shadow-2xs"
                title="Mesclar este paciente com outro cadastro duplicado (somente Administradores)"
              >
                <GitMerge className="h-4 w-4 text-purple-700" />
                Mesclar Cadastro
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setImportAvaliacaoModalOpen(true)}
              className="rounded-xl h-10 px-3.5 text-xs font-semibold border-[#C9A46A]/80 bg-[#FAF7F1] text-[#73574A] hover:bg-[#F3EAD9] flex items-center gap-1.5 shadow-2xs"
              title="Importar avaliação e histórico de evolução deste paciente a partir de planilha .xlsx"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#8C6527]" />
              Importar Avaliação (Planilha)
            </Button>

            <Button
              onClick={() => setConsultaModalOpen(true)}
              variant="outline"
              className="rounded-xl h-10 px-3.5 text-xs font-semibold border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4 text-blue-600" />
              Agendar Consulta
            </Button>
            <Button
              onClick={() => navigate(`/programas/novo?paciente=${paciente.id}`)}
              variant="outline"
              className="rounded-xl h-10 px-3.5 text-xs font-semibold border-[#E9E1D2] hover:bg-[#FAF7F1] text-[#8C6527] flex items-center gap-1.5"
            >
              <Dumbbell className="h-4 w-4" />
              Montar Programa
            </Button>
            <Button
              onClick={() => navigate(`/prontuarios/novo?paciente=${paciente.id}`)}
              className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] rounded-xl h-10 px-4 text-xs font-semibold shadow-sm flex items-center gap-1.5 border border-[#DFBF8E]/40"
            >
              <Plus className="h-4 w-4 text-[#33221C]" />
              Nova Avaliação
            </Button>
          </div>
        </div>

        {/* Banner de Autorização de Ativação para Pacientes em Pré-cadastro */}
        {paciente.status === 'Pré-cadastro' && (
          <div className="mt-6 p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs">
                    ⚡
                  </span>
                  <h4 className="font-bold text-base text-amber-950">
                    Autorização de Ativação de Cadastro
                  </h4>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold"
                  >
                    Pendente de Ativação
                  </Badge>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed max-w-2xl">
                  Esta paciente preencheu a ficha de pré-avaliação online. Clique em{' '}
                  <strong>"Ativar Cadastro & Abrir Prontuário"</strong> para autorizar o cadastro na
                  clínica e iniciar imediatamente o preenchimento da avaliação com os dados já
                  integrados.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  onClick={handleAtivarCadastroEIrProntuario}
                  disabled={activating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md flex items-center gap-2 border border-emerald-500"
                >
                  {activating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Ativando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Ativar Cadastro & Abrir Prontuário →
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Banner de Pré-Cadastro / Respostas da Anamnese Inicial */}
        {(paciente.motivo_procura ||
          paciente.origem_como_chegou ||
          paciente.queixa_dor_onde ||
          paciente.atividade_fisica ||
          paciente.ficha_pre_cadastro ||
          paciente.status === 'Pré-cadastro') && (
          <div className="mt-6 p-4 rounded-2xl bg-[#FAF5EE] border border-[#E3C89A]/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C9A46A] text-white font-bold text-xs">
                  ✓
                </span>
                <h4 className="font-bold text-sm text-[#33221C]">
                  Respostas da Anamnese Inicial / Formulário de Cadastro
                </h4>
                {paciente.origem_como_chegou && (
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-white border-[#C9A46A]/50 text-[#8C6527]"
                  >
                    Origem: {paciente.origem_como_chegou}
                  </Badge>
                )}
                {paciente.genero && (
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-white border-gray-200 text-gray-700"
                  >
                    {paciente.genero}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Fisioterapia`)
                }
                className="bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-bold text-xs h-8 px-3 rounded-xl shadow-2xs self-start sm:self-auto"
              >
                Abrir Prontuário com estes Dados →
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-[#5C4033] pt-1">
              {paciente.motivo_procura && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">Motivo / Queixa Principal:</span>
                  <p className="text-gray-700 leading-relaxed">{paciente.motivo_procura}</p>
                </div>
              )}
              {(paciente.queixa_dor_onde || paciente.limitacoes_incomodo) && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">Local da Dor / Limitações:</span>
                  <p className="text-gray-700 leading-relaxed">
                    {paciente.queixa_dor_onde || paciente.limitacoes_incomodo}
                  </p>
                </div>
              )}
              {paciente.atividade_fisica && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">
                    Atividade Física Praticada:
                  </span>
                  <p className="text-gray-700 leading-relaxed">
                    {paciente.atividade_fisica}
                    {paciente.frequencia_semanal ? ` (${paciente.frequencia_semanal})` : ''}
                    {paciente.duracao_treino ? ` - ${paciente.duracao_treino}` : ''}
                  </p>
                </div>
              )}
              {paciente.controle_alimentar && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">
                    Controle Alimentar / Dieta:
                  </span>
                  <p className="text-gray-700 leading-relaxed">{paciente.controle_alimentar}</p>
                </div>
              )}
              {paciente.quem_indicou && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">Indicado por:</span>
                  <p className="text-gray-700 leading-relaxed">{paciente.quem_indicou}</p>
                </div>
              )}
              {paciente.observacoes_formulario && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">Observações do Paciente:</span>
                  <p className="text-gray-700 leading-relaxed">{paciente.observacoes_formulario}</p>
                </div>
              )}
              {paciente.tratamentos_anteriores && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">Tratamentos Anteriores:</span>
                  <p className="text-gray-700 leading-relaxed">{paciente.tratamentos_anteriores}</p>
                </div>
              )}
              {paciente.resultado_esperado && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">Resultado Esperado:</span>
                  <p className="text-gray-700 leading-relaxed">{paciente.resultado_esperado}</p>
                </div>
              )}
              {paciente.diagnostico_medico && (
                <div className="p-3 rounded-xl bg-white/90 border border-[#E9E1D2]/80 space-y-1">
                  <span className="font-bold text-[#8C6527] block">
                    Diagnóstico Médico Informado:
                  </span>
                  <p className="text-gray-700 leading-relaxed">{paciente.diagnostico_medico}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val)
          const newParams = new URLSearchParams(searchParams)
          newParams.set('tab', val)
          setSearchParams(newParams, { replace: true })
        }}
        className="w-full"
      >
        <TabsList className="bg-white border border-gray-200 rounded-2xl p-1 h-12 shadow-xs">
          <TabsTrigger
            value="timeline"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#1E2530] data-[state=checked]:text-white transition-all h-10 px-4"
          >
            Timeline Cronológica ({timeline.length})
          </TabsTrigger>
          <TabsTrigger
            value="evolucoes"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#1E2530] data-[state=checked]:text-white transition-all h-10 px-4"
          >
            Evoluções ({evolucoesPaciente.length})
          </TabsTrigger>
          <TabsTrigger
            value="programas"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#1E2530] data-[state=checked]:text-white transition-all h-10 px-4"
          >
            Programas de Treino ({programasPaciente.length})
          </TabsTrigger>
          <TabsTrigger
            value="avaliacoes"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#1E2530] data-[state=checked]:text-white transition-all h-10 px-4"
          >
            Avaliações (
            {avaliacoes.fisio.length +
              avaliacoes.personal.length +
              avaliacoes.nutri.length +
              avaliacoes.medico.length}
            )
          </TabsTrigger>
          <TabsTrigger
            value="dados"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#1E2530] data-[state=checked]:text-white transition-all h-10 px-4"
          >
            Dados Pessoais
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TIMELINE */}
        <TabsContent value="timeline" className="pt-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Histórico do Paciente</h3>
                <p className="text-xs text-gray-400">
                  Visualização unificada de consultas, avaliações multidisciplinares e notas.
                </p>
              </div>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Nenhum evento registrado na timeline.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ao agendar uma consulta ou concluir uma avaliação, o registro aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
                {timeline.map((item, index) => {
                  const esp = item.especialidade || 'Fisioterapia'
                  const colorConfig = ESPECIALIDADE_COLORS[esp] || ESPECIALIDADE_COLORS.Fisioterapia
                  const isExpanded = !!expandedNodes[item.id]

                  return (
                    <div
                      key={item.id}
                      className="relative group transition-all"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Timeline Dot with specialty color */}
                      <span
                        className="absolute -left-6 sm:-left-8 top-1.5 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: colorConfig.hex }}
                      />

                      <div
                        onClick={() => toggleNode(item.id)}
                        className="bg-gray-50/60 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-2xl p-4 transition-all cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {item.especialidade && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorConfig.badge}`}
                              >
                                {item.especialidade}
                              </span>
                            )}
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                              {item.tipo}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 font-medium">
                              {formatDataHoraPTBR(item.data_evento)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span>{isExpanded ? 'Recolher' : 'Ver detalhes'}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 mt-2">{item.titulo}</h4>

                        {/* Excerpt */}
                        {!isExpanded && item.conteudo && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.conteudo}</p>
                        )}

                        {/* Expanded full content */}
                        {isExpanded && item.conteudo && (
                          <div className="mt-3 pt-3 border-t border-gray-200/60 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-200 bg-white p-3.5 rounded-xl border border-gray-100">
                            {item.conteudo}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: EVOLUÇÕES DO PACIENTE */}
        <TabsContent value="evolucoes" className="pt-4">
          <SecaoEvolucoes
            pacienteId={paciente.id}
            avaliacaoId=""
            especialidade={
              avaliacoes.fisio[0]?.especialidade ||
              avaliacoes.personal[0]?.especialidade ||
              'Fisioterapia'
            }
            pacienteNome={paciente.nome}
          />
        </TabsContent>

        {/* TAB: PROGRAMAS DE TREINO */}
        <TabsContent value="programas" className="pt-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Programas de Acompanhamento / Periodização
                </h3>
                <p className="text-xs text-gray-400">
                  Planejamento de treino fatiado em semanas, objetivos e mensuração de cargas.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/programas/novo?paciente=${paciente.id}`)}
                className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs rounded-xl h-8 px-3 shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Montar Novo Programa
              </Button>
            </div>

            {programasPaciente.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-2">
                <Dumbbell className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">
                  Nenhum programa de periodização montado para este aluno ainda.
                </p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Crie um programa definindo a duração em semanas, os objetivos com tempo e a grade
                  de treinos.
                </p>
                <Button
                  onClick={() => navigate(`/programas/novo?paciente=${paciente.id}`)}
                  className="bg-[#C9A46A] text-[#33221C] font-bold text-xs rounded-xl h-8 px-4 mt-2"
                >
                  Criar Programa de Treino
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programasPaciente.map((prog) => {
                  const statusCor =
                    prog.status === 'ativo'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : prog.status === 'rascunho'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'

                  return (
                    <div
                      key={prog.id}
                      onClick={() => navigate(`/programas/${prog.id}`)}
                      className="p-5 rounded-2xl border border-gray-200 hover:border-[#C9A46A] bg-white hover:shadow-xs transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCor}`}
                        >
                          {prog.status}
                        </span>
                        <span className="text-xs text-[#8C6527] font-semibold group-hover:underline">
                          Abrir Grade →
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#8C6527]">
                          {prog.nome}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Duração: {prog.total_periodos} {prog.unidade_duracao} • Criado em{' '}
                          {formatDataPTBR(prog.created)}
                        </p>
                      </div>

                      {prog.observacoes && (
                        <p className="text-[11px] text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-xl">
                          {prog.observacoes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: AVALIAÇÕES */}
        <TabsContent value="avaliacoes" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Fisioterapia */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs">
                      F
                    </span>
                    <h4 className="font-bold text-gray-900">Fisioterapia</h4>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {avaliacoes.fisio.length} avaliação(ões)
                  </Badge>
                </div>

                {avaliacoes.fisio.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4">
                    Nenhuma avaliação de fisioterapia registrada.
                  </p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {avaliacoes.fisio.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => navigate(`/prontuarios/${av.id}?esp=Fisioterapia`)}
                        className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 bg-gray-50/50 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {formatDataPTBR(av.created)}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-xs">
                            {av.queixa_principal || 'Sem queixa informada'}
                          </p>
                        </div>
                        <Badge
                          className={
                            av.status === 'Concluída'
                              ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                              : 'bg-amber-100 text-amber-800 text-[10px]'
                          }
                        >
                          {av.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(() => {
                const rascunhoFisio = avaliacoes.fisio.find((a) => a.status === 'Rascunho')
                return (
                  <div className="mt-4 flex flex-col gap-2">
                    {rascunhoFisio && (
                      <Button
                        onClick={() =>
                          navigate(
                            `/prontuarios/novo?edit=${rascunhoFisio.id}&especialidade=Fisioterapia`,
                          )
                        }
                        className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white w-full shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>✏️ Continuar Rascunho</span>
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        navigate(
                          `/prontuarios/novo?paciente=${paciente.id}&especialidade=Fisioterapia`,
                        )
                      }
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 w-full"
                    >
                      + Nova Avaliação de Fisioterapia
                    </Button>
                  </div>
                )
              })()}
            </div>

            {/* Personal Trainer */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold text-xs">
                      P
                    </span>
                    <h4 className="font-bold text-gray-900">Personal Trainer</h4>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {avaliacoes.personal.length} avaliação(ões)
                  </Badge>
                </div>

                {avaliacoes.personal.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4">
                    Nenhuma avaliação de personal registrada.
                  </p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {avaliacoes.personal.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => navigate(`/prontuarios/${av.id}?esp=Personal`)}
                        className="p-3 rounded-xl border border-gray-100 hover:border-orange-200 bg-gray-50/50 hover:bg-orange-50/30 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {formatDataPTBR(av.created)}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-xs">
                            Objetivo: {av.objetivo_principal || 'Geral'}
                          </p>
                        </div>
                        <Badge
                          className={
                            av.status === 'Concluída'
                              ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                              : 'bg-amber-100 text-amber-800 text-[10px]'
                          }
                        >
                          {av.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(() => {
                const rascunhoPersonal = avaliacoes.personal.find((a) => a.status === 'Rascunho')
                return (
                  <div className="mt-4 flex flex-col gap-2">
                    {rascunhoPersonal && (
                      <Button
                        onClick={() =>
                          navigate(
                            `/prontuarios/novo?edit=${rascunhoPersonal.id}&especialidade=Personal`,
                          )
                        }
                        className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white w-full shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>✏️ Continuar Rascunho</span>
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Personal`)
                      }
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 w-full"
                    >
                      + Nova Avaliação de Personal
                    </Button>
                  </div>
                )
              })()}
            </div>

            {/* Nutrição */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600 font-bold text-xs">
                      N
                    </span>
                    <h4 className="font-bold text-gray-900">Nutrição</h4>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {avaliacoes.nutri.length} avaliação(ões)
                  </Badge>
                </div>

                {avaliacoes.nutri.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4">
                    Nenhuma avaliação de nutrição registrada.
                  </p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {avaliacoes.nutri.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => navigate(`/prontuarios/${av.id}?esp=Nutrição`)}
                        className="p-3 rounded-xl border border-gray-100 hover:border-green-200 bg-gray-50/50 hover:bg-green-50/30 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {formatDataPTBR(av.created)}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-xs">
                            {av.objetivos || 'Plano nutricional'}
                          </p>
                        </div>
                        <Badge
                          className={
                            av.status === 'Concluída'
                              ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                              : 'bg-amber-100 text-amber-800 text-[10px]'
                          }
                        >
                          {av.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(() => {
                const rascunhoNutri = avaliacoes.nutri.find((a) => a.status === 'Rascunho')
                return (
                  <div className="mt-4 flex flex-col gap-2">
                    {rascunhoNutri && (
                      <Button
                        onClick={() =>
                          navigate(
                            `/prontuarios/novo?edit=${rascunhoNutri.id}&especialidade=Nutrição`,
                          )
                        }
                        className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white w-full shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>✏️ Continuar Rascunho</span>
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Nutrição`)
                      }
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold text-green-600 border-green-200 hover:bg-green-50 w-full"
                    >
                      + Nova Avaliação de Nutrição
                    </Button>
                  </div>
                )
              })()}
            </div>

            {/* Médico */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold text-xs">
                      M
                    </span>
                    <h4 className="font-bold text-gray-900">Médico</h4>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    {avaliacoes.medico.length} avaliação(ões)
                  </Badge>
                </div>

                {avaliacoes.medico.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4">Nenhuma avaliação médica registrada.</p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {avaliacoes.medico.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => navigate(`/prontuarios/${av.id}?esp=Médico`)}
                        className="p-3 rounded-xl border border-gray-100 hover:border-purple-200 bg-gray-50/50 hover:bg-purple-50/30 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {formatDataPTBR(av.created)}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-xs">
                            {av.hipotese_diagnostica || av.queixa_principal || 'Consulta clínica'}
                          </p>
                        </div>
                        <Badge
                          className={
                            av.status === 'Concluída'
                              ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                              : 'bg-amber-100 text-amber-800 text-[10px]'
                          }
                        >
                          {av.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(() => {
                const rascunhoMedico = avaliacoes.medico.find((a) => a.status === 'Rascunho')
                return (
                  <div className="mt-4 flex flex-col gap-2">
                    {rascunhoMedico && (
                      <Button
                        onClick={() =>
                          navigate(
                            `/prontuarios/novo?edit=${rascunhoMedico.id}&especialidade=Médico`,
                          )
                        }
                        className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white w-full shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>✏️ Continuar Rascunho</span>
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Médico`)
                      }
                      variant="outline"
                      size="sm"
                      className="mt-4 rounded-xl text-xs font-semibold text-purple-600 border-purple-200 hover:bg-purple-50 w-full"
                    >
                      + Nova Avaliação Médica
                    </Button>
                  </div>
                )
              })()}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: DADOS PESSOAIS */}
        <TabsContent value="dados" className="pt-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Dados Cadastrais</h3>
            <p className="text-xs text-gray-400 mb-6">
              Atualize as informações cadastrais do paciente.
            </p>

            <form onSubmit={handleSaveDadosPessoais} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Nome completo *</Label>
                <Input
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">CPF</Label>
                  <Input
                    value={editCpf}
                    onChange={(e) => setEditCpf(e.target.value)}
                    className="h-10 rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={editDataNasc}
                    onChange={(e) => setEditDataNasc(e.target.value)}
                    className="h-10 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Telefone / WhatsApp</Label>
                  <Input
                    value={editTelefone}
                    onChange={(e) => setEditTelefone(e.target.value)}
                    className="h-10 rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">E-mail</Label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="h-10 rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Endereço</Label>
                <Input
                  value={editEndereco}
                  onChange={(e) => setEditEndereco(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(val) => setEditStatus(val as StatusPaciente)}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Pré-cadastro">Pré-cadastro</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>{' '}
                </Select>
              </div>

              {/* Seção adicional de respostas do formulário de pré-cadastro */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-[#8C6527] uppercase tracking-wider">
                  Informações de Pré-Cadastro (Questionário)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Como chegou até nós
                    </Label>
                    <Input
                      value={editOrigem}
                      onChange={(e) => setEditOrigem(e.target.value)}
                      placeholder="Indicação, Google, Instagram..."
                      className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Quem lhe indicou?</Label>
                    <Input
                      value={editQuemIndicou}
                      onChange={(e) => setEditQuemIndicou(e.target.value)}
                      placeholder="Nome do médico, academia, amigo..."
                      className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Atividade Física</Label>
                    <Input
                      value={editAtividadeFisica}
                      onChange={(e) => setEditAtividadeFisica(e.target.value)}
                      placeholder="Musculação, corrida, etc."
                      className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Frequência Semanal
                    </Label>
                    <Input
                      value={editFrequenciaSemanal}
                      onChange={(e) => setEditFrequenciaSemanal(e.target.value)}
                      placeholder="Ex: 3 x"
                      className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Duração Média</Label>
                    <Input
                      value={editDuracaoTreino}
                      onChange={(e) => setEditDuracaoTreino(e.target.value)}
                      placeholder="Ex: 1 hora"
                      className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Motivo que trouxe até aqui
                  </Label>
                  <Textarea
                    rows={2}
                    value={editMotivo}
                    onChange={(e) => setEditMotivo(e.target.value)}
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Limitações / O que incomoda
                  </Label>
                  <Textarea
                    rows={2}
                    value={editLimitacoes}
                    onChange={(e) => setEditLimitacoes(e.target.value)}
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Tratamentos já tentados
                  </Label>
                  <Textarea
                    rows={2}
                    value={editTratamentos}
                    onChange={(e) => setEditTratamentos(e.target.value)}
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Resultado que espera
                  </Label>
                  <Textarea
                    rows={2}
                    value={editResultado}
                    onChange={(e) => setEditResultado(e.target.value)}
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Diagnóstico Médico</Label>
                  <Input
                    value={editDiagnostico}
                    onChange={(e) => setEditDiagnostico(e.target.value)}
                    className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold text-gray-700">
                  Observações Clínicas / Gerais
                </Label>
                <Textarea
                  rows={3}
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  className="rounded-xl border-gray-200 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={savingDados}
                  className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-6 shadow-sm border border-[#DFBF8E]/40"
                >
                  {savingDados ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Consulta */}
      <NovaConsultaModal
        open={consultaModalOpen}
        onOpenChange={setConsultaModalOpen}
        defaultPacienteId={paciente.id}
        onSuccess={() => loadData()}
      />

      {/* Modal Importar Avaliação para este Paciente */}
      <ModalImportarAvaliacaoPlanilha
        open={importAvaliacaoModalOpen}
        onOpenChange={setImportAvaliacaoModalOpen}
        pacientePredefinidoId={paciente.id}
        pacientePredefinidoNome={paciente.nome}
        onSuccess={() => {
          loadData()
        }}
      />

      {/* Modal Mesclar Paciente (Admin only) */}
      {isAdmin && paciente && (
        <ModalMesclarPacientes
          open={mergeModalOpen}
          onOpenChange={setMergeModalOpen}
          initialPacienteId={paciente.id}
          initialRole="target"
          onSuccess={(res) => {
            if (res.target_paciente_id === paciente.id) {
              loadData()
            } else {
              navigate(`/pacientes/${res.target_paciente_id}`)
            }
          }}
        />
      )}
    </div>
  )
}
