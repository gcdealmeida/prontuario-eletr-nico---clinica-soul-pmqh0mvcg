import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

export default function PacienteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
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

  // Modal Consulta
  const [consultaModalOpen, setConsultaModalOpen] = useState(false)

  // Edit Tab Form
  const [editNome, setEditNome] = useState('')
  const [editCpf, setEditCpf] = useState('')
  const [editDataNasc, setEditDataNasc] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editEndereco, setEditEndereco] = useState('')
  const [editObs, setEditObs] = useState('')
  const [editStatus, setEditStatus] = useState<StatusPaciente>('Ativo')
  const [savingDados, setSavingDados] = useState(false)

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

      // Timeline
      const t = await getTimelineByPaciente(id)
      setTimeline(t)

      // Avaliações
      const avs = await getAvaliacoesByPaciente(id)
      setAvaliacoes(avs)

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
                    paciente.status === 'Ativo'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                      : 'bg-gray-100 text-gray-600 border-gray-200 text-xs'
                  }
                >
                  {paciente.status}
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
            <Button
              onClick={() => setConsultaModalOpen(true)}
              variant="outline"
              className="rounded-xl h-10 px-3.5 text-xs font-semibold border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4 text-blue-600" />
              Agendar Consulta
            </Button>
            <Button
              onClick={() => navigate(`/prontuarios/novo?paciente=${paciente.id}`)}
              className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] rounded-xl h-10 px-4 text-xs font-semibold shadow-sm flex items-center gap-1.5 border border-[#DFBF8E]/40"
            >
              <Plus className="h-4 w-4 text-[#33221C]" />
              Nova Avaliação
            </Button>{' '}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Evoluções Clínicas Registradas</h3>
                <p className="text-xs text-gray-400">
                  Histórico de sessões SOAP e condutas dos atendimentos do paciente.
                </p>
              </div>
            </div>

            {evolucoesPaciente.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Nenhuma evolução registrada para este paciente.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Acesse qualquer prontuário deste paciente na aba Avaliações para registrar sessões
                  de evolução.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evolucoesPaciente.map((evo) => {
                  const espStyle =
                    ESPECIALIDADE_COLORS[evo.especialidade] || ESPECIALIDADE_COLORS.Fisioterapia
                  return (
                    <div
                      key={evo.id}
                      className="p-4 rounded-2xl border border-gray-100 hover:border-[#C9A46A]/50 bg-gray-50/40 hover:bg-white transition-all shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${espStyle.badge}`}
                          >
                            {evo.especialidade}
                          </span>

                          {evo.documento_fechado || evo.status === 'Finalizada' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C6527] border border-[#C9A46A]/40">
                              <ShieldCheck className="h-3 w-3 text-[#8C6527]" />
                              Assinado / Fechado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Rascunho
                            </span>
                          )}

                          {evo.numero_registro && (
                            <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {evo.numero_registro}
                            </span>
                          )}

                          <span className="text-xs font-semibold text-gray-700">
                            {formatDataHoraPTBR(
                              evo.assinado_em || evo.data_evolucao || evo.created,
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            • Profissional:{' '}
                            <strong>{evo.assinado_por_nome || evo.profissional}</strong>
                          </span>
                        </div>

                        {evo.avaliacao_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/prontuarios/${evo.avaliacao_id}?esp=${encodeURIComponent(
                                  evo.especialidade,
                                )}&tab=evolucoes`,
                              )
                            }
                            className="text-xs text-[#8C6527] hover:text-[#4A322A] h-7 px-2"
                          >
                            Abrir no Prontuário →
                          </Button>
                        )}
                      </div>

                      {evo.conduta_procedimentos && (
                        <div className="text-xs text-gray-800 font-medium mb-1">
                          <span className="text-[#8C6527] font-bold">Conduta: </span>
                          {evo.conduta_procedimentos}
                        </div>
                      )}

                      {evo.avaliacao_clinica && (
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-700">Análise (A): </span>
                          {evo.avaliacao_clinica}
                        </div>
                      )}

                      {evo.texto_livre && !evo.conduta_procedimentos && (
                        <div className="text-xs text-gray-700 whitespace-pre-wrap">
                          {evo.texto_livre}
                        </div>
                      )}

                      {/* Selo compacto de documento fechado se assinado */}
                      {evo.documento_fechado && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-[#73574A]">
                          <span className="flex items-center gap-1 font-medium">
                            <ShieldCheck className="h-3 w-3 text-[#8C6527]" />
                            Assinado digitalmente por {evo.assinado_por_nome ||
                              evo.profissional} (
                            {evo.assinado_por_especialidade || evo.especialidade})
                          </span>
                          <span className="text-gray-400 font-mono">
                            {evo.assinado_em ? formatDataHoraPTBR(evo.assinado_em) : ''}
                          </span>
                        </div>
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

              <Button
                onClick={() =>
                  navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Fisioterapia`)
                }
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 w-full"
              >
                + Nova Avaliação de Fisioterapia
              </Button>
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

              <Button
                onClick={() =>
                  navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Personal`)
                }
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl text-xs font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 w-full"
              >
                + Nova Avaliação de Personal
              </Button>
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

              <Button
                onClick={() =>
                  navigate(`/prontuarios/novo?paciente=${paciente.id}&especialidade=Nutrição`)
                }
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl text-xs font-semibold text-green-600 border-green-200 hover:bg-green-50 w-full"
              >
                + Nova Avaliação de Nutrição
              </Button>
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
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
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
    </div>
  )
}
