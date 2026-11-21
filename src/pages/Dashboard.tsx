import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Smile,
  Clock,
  TrendingUp,
  ArrowRight,
  Play,
  FileCheck2,
  FileText,
  Plus,
  Stethoscope,
  UserCheck,
  ChevronRight,
  CalendarCheck2,
  Search,
  Link as LinkIcon,
  Copy,
  Check,
  MessageCircle,
  Share2,
  ExternalLink,
  Sparkles,
  Loader2,
  Phone,
  Mail,
} from 'lucide-react'

import { ModalLinkPreCadastro } from '@/components/ModalLinkPreCadastro'

import { TopbarBuscaPaciente } from '@/components/TopbarBuscaPaciente'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { getConsultasHoje, getConsultas } from '@/services/consultas'
import { getPacientes, ativarCadastroPaciente } from '@/services/pacientes'
import { getRascunhoAbertoPorPaciente } from '@/services/avaliacoes'
import type { ConsultaRecord, PacienteRecord, EvolucaoRecord } from '@/types/database'
import {
  ESPECIALIDADE_COLORS,
  formatHoraPTBR,
  formatDataPTBR,
  getInitials,
  CLINICA_WHATSAPP,
} from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)

  // Estatísticas globais (Admin)
  const [pacientesAtivosCount, setPacientesAtivosCount] = useState(0)
  const [consultasSemanaCount, setConsultasSemanaCount] = useState(0)
  const [pacientesRecentes, setPacientesRecentes] = useState<PacienteRecord[]>([])
  const [specialtyDistribution, setSpecialtyDistribution] = useState<
    { name: string; value: number; color: string }[]
  >([])

  // Estatísticas específicas do profissional
  const [minhasConsultasHoje, setMinhasConsultasHoje] = useState<ConsultaRecord[]>([])
  const [meusPacientesCount, setMeusPacientesCount] = useState(0)
  const [minhasEvolucoesMesCount, setMinhasEvolucoesMesCount] = useState(0)
  const [minhasAvaliacoesCount, setMinhasAvaliacoesCount] = useState(0)
  const [meusPacientesRecentes, setMeusPacientesRecentes] = useState<PacienteRecord[]>([])

  const [modalLinkPreCadastroOpen, setModalLinkPreCadastroOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [preCadastrosPendentes, setPreCadastrosPendentes] = useState<PacienteRecord[]>([])
  const [ativandoPacienteId, setAtivandoPacienteId] = useState<string | null>(null)
  const { toast } = useToast()

  // Link público direto de pré-avaliação/pré-cadastro (padrão com versão de cache)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicPreCadastroLink = `${origin}/pre-cadastro?v=0.0.55`

  const handleCopyPreCadastroLink = async () => {
    try {
      await navigator.clipboard.writeText(publicPreCadastroLink)
      setCopiedLink(true)
      toast({
        title: 'Link copiado com sucesso!',
        description: 'Repasse o link para o cliente preencher o cadastro e anamnese.',
      })
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      toast({
        title: 'Não foi possível copiar automaticamente',
        description: 'Abra as opções de compartilhamento para copiar o link.',
        variant: 'destructive',
      })
    }
  }

  const handleSharePreCadastroWhatsApp = () => {
    const mensagem = `Olá! Seja bem-vindo(a) à Clínica SOUL. ✨\n\n*Pré-Cadastro - Clínica Soul*\nPara agilizar seu atendimento e preparar o seu prontuário clínico personalizado, por favor preencha seu pré-cadastro no link abaixo:\n${publicPreCadastroLink}\n\nLeva apenas 2 minutos e seus dados chegam diretamente à nossa equipe clínica!`
    const encoded = encodeURIComponent(mensagem)
    // Com número da clínica configurado (VITE_CLINICA_WHATSAPP), abre direto a conversa;
    // sem número, abre o WhatsApp com a mensagem pronta para o usuário escolher o contato.
    window.open(
      CLINICA_WHATSAPP
        ? `https://wa.me/${CLINICA_WHATSAPP}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`,
      '_blank',
    )
  }

  const loadAdminData = async () => {
    // 1. Pacientes ativos e recentes
    const pacRes = await getPacientes('', '-created', 6, 1)
    setPacientesRecentes(pacRes.items)
    setPacientesAtivosCount(pacRes.totalItems)

    // 2. Consultas de hoje gerais
    const hoje = await getConsultasHoje()
    setMinhasConsultasHoje(hoje)

    // 3. Consultas da semana atual para cálculo de fluxo semanal e distribuição de especialidades
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diffMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(today)
    monday.setDate(diffMonday)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const startIso = monday.toISOString().replace('T', ' ')
    const endIso = sunday.toISOString().replace('T', ' ')

    const weekFilter = `data_hora >= "${startIso}" && data_hora <= "${endIso}"`
    const consultasSemana = await getConsultas(weekFilter, 'data_hora')
    setConsultasSemanaCount(consultasSemana.length)
    const todasConsultas = consultasSemana

    // Distribution
    const counts: Record<string, number> = {
      Fisioterapia: 0,
      Personal: 0,
      Nutrição: 0,
      Médico: 0,
    }
    todasConsultas.forEach((c) => {
      if (counts[c.especialidade] !== undefined) {
        counts[c.especialidade]++
      }
    })

    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    if (total === 0) {
      setSpecialtyDistribution([
        { name: 'Fisioterapia', value: 40, color: '#C9A46A' },
        { name: 'Personal', value: 25, color: '#B87355' },
        { name: 'Nutrição', value: 20, color: '#477A53' },
        { name: 'Médico', value: 15, color: '#5C4033' },
      ])
    } else {
      setSpecialtyDistribution([
        { name: 'Fisioterapia', value: counts['Fisioterapia'] || 1, color: '#C9A46A' },
        { name: 'Personal', value: counts['Personal'] || 1, color: '#B87355' },
        { name: 'Nutrição', value: counts['Nutrição'] || 1, color: '#477A53' },
        { name: 'Médico', value: counts['Médico'] || 1, color: '#5C4033' },
      ])
    }
  }

  const loadProfessionalData = async (userId: string) => {
    const today = new Date()
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    ).toISOString()
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    ).toISOString()

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0).toISOString()

    // 1. Minhas Consultas Hoje (filtradas por user_id do profissional)
    try {
      const consultasHojeRes = await pb.collection('consultas').getFullList<ConsultaRecord>({
        filter: `data_hora >= "${startOfDay}" && data_hora <= "${endOfDay}" && (user_id = "${userId}" || user_id = "" || user_id = null)`,
        sort: 'data_hora',
        expand: 'paciente_id',
      })
      setMinhasConsultasHoje(consultasHojeRes)
    } catch {
      setMinhasConsultasHoje([])
    }

    // 2. Meus Pacientes em acompanhamento: pacientes com consultas ou avaliações desse profissional
    try {
      // Pacientes ativos gerais da clínica
      const pacListRes = await pb.collection('pacientes').getList<PacienteRecord>(1, 6, {
        filter: `status = "Ativo"`,
        sort: '-updated',
      })
      setMeusPacientesRecentes(pacListRes.items)
      setMeusPacientesCount(pacListRes.totalItems)
    } catch {
      setMeusPacientesRecentes([])
      setMeusPacientesCount(0)
    }

    // 3. Minhas evoluções no mês (assinado_por_user_id = userId)
    try {
      const evolucoesRes = await pb.collection('evolucoes').getList<EvolucaoRecord>(1, 1, {
        filter: `created >= "${startOfMonth}" && (assinado_por_user_id = "${userId}" || assinado_por_user_id = "")`,
      })
      setMinhasEvolucoesMesCount(evolucoesRes.totalItems)
    } catch {
      setMinhasEvolucoesMesCount(0)
    }

    // 4. Minhas avaliações totais
    try {
      const [f, p, n, m] = await Promise.allSettled([
        pb.collection('avaliacoes_fisioterapia').getList(1, 1, {
          filter: `user_id = "${userId}" || user_id = "" || user_id = null`,
        }),
        pb.collection('avaliacoes_personal').getList(1, 1, {
          filter: `user_id = "${userId}" || user_id = "" || user_id = null`,
        }),
        pb.collection('avaliacoes_nutricao').getList(1, 1, {
          filter: `user_id = "${userId}" || user_id = "" || user_id = null`,
        }),
        pb.collection('avaliacoes_medico').getList(1, 1, {
          filter: `user_id = "${userId}" || user_id = "" || user_id = null`,
        }),
      ])

      const totalAv =
        (f.status === 'fulfilled' ? f.value.totalItems : 0) +
        (p.status === 'fulfilled' ? p.value.totalItems : 0) +
        (n.status === 'fulfilled' ? n.value.totalItems : 0) +
        (m.status === 'fulfilled' ? m.value.totalItems : 0)

      setMinhasAvaliacoesCount(totalAv)
    } catch {
      setMinhasAvaliacoesCount(0)
    }
  }

  const loadPreCadastros = async () => {
    try {
      const res = await getPacientes('status = "Pré-cadastro"', '-created', 50, 1)
      setPreCadastrosPendentes(res.items)
    } catch (err) {
      console.warn('Erro ao carregar pré-cadastros pendentes:', err)
      setPreCadastrosPendentes([])
    }
  }

  const handleAtivarPreCadastro = async (p: PacienteRecord) => {
    try {
      setAtivandoPacienteId(p.id)
      await ativarCadastroPaciente(p.id)
      toast({
        title: 'Cadastro ativado!',
        description: `Cadastro de ${p.nome} ativado com sucesso. Abrindo prontuário...`,
      })
      // Atualiza lista local
      setPreCadastrosPendentes((prev) => prev.filter((item) => item.id !== p.id))

      // Verificar se já existe rascunho em aberto para este paciente
      try {
        const rascunhoAberto = await getRascunhoAbertoPorPaciente('Fisioterapia', p.id)
        if (rascunhoAberto?.id) {
          navigate(
            `/prontuarios/novo?paciente=${p.id}&especialidade=Fisioterapia&edit=${rascunhoAberto.id}`,
          )
          return
        }
      } catch {
        /* intentionally ignored */
      }

      // Redireciona para nova avaliação / prontuário pré-carregado
      navigate(`/prontuarios/novo?paciente=${p.id}&especialidade=Fisioterapia`)
    } catch (err: any) {
      console.error('Erro ativando pré-cadastro:', err)
      toast({
        title: 'Erro ao ativar cadastro',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setAtivandoPacienteId(null)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        isAdmin ? loadAdminData() : user?.id ? loadProfessionalData(user.id) : Promise.resolve(),
        loadPreCadastros(),
      ])
    } catch (err) {
      console.error('Erro dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [isAdmin, user?.id])

  // Revalidar ao focar a janela do navegador
  useEffect(() => {
    const handleFocus = () => {
      loadPreCadastros()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Realtime updates
  useRealtime('consultas', () => loadDashboardData())
  useRealtime('pacientes', () => {
    loadDashboardData()
  })
  useRealtime('evolucoes', () => loadDashboardData())

  const hojePtBr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Próxima consulta do profissional
  const proximaConsulta = useMemo(() => {
    if (!minhasConsultasHoje.length) return null
    const agora = new Date().getTime()
    const futuras = minhasConsultasHoje.filter((c) => {
      const horaConsulta = new Date(c.data_hora).getTime()
      return (
        horaConsulta >= agora - 30 * 60 * 1000 &&
        c.status !== 'Concluída' &&
        c.status !== 'Cancelada'
      )
    })
    return futuras.length > 0 ? futuras[0] : minhasConsultasHoje[0]
  }, [minhasConsultasHoje])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header com boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#C9A46A]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#73574A]">
              {isAdmin
                ? 'Painel Geral de Gestão Clínica'
                : `Painel Clínico · ${user?.especialidade || 'Profissional'}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#4A322A]">
            Bem-vindo(a), {user?.name || 'Profissional SOUL'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#73574A] capitalize mt-0.5">
            {isAdmin
              ? `Hoje, ${hojePtBr}`
              : `Confira suas consultas agendadas para hoje e seus pacientes em acompanhamento.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate('/prontuarios/novo')}
              className="bg-gradient-to-r from-[#B87355] to-[#8C4A32] hover:brightness-105 text-white font-semibold rounded-xl h-10 px-4 text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-sm"
              title="Cadastrar nova avaliação clínica"
            >
              <FileText className="h-4 w-4 text-white/90" />
              <span>Nova Avaliação</span>
            </Button>

            <Button
              onClick={() => navigate('/atendimento')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl h-10 px-4 text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-sm"
              title="Registrar atendimento: presença + evolução em um único lugar"
            >
              <CalendarCheck2 className="h-4 w-4 text-emerald-100" />
              <span>Registro de Atendimento</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTÕES DE ACESSO RÁPIDO EM DESTAQUE (PÓS-LOGIN): PRESENÇA, EVOLUÇÃO,      */}
      {/* NOVA AVALIAÇÃO E BUSCA DE PACIENTE                                         */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* ========================================================================= */}
        {/* CARD EM DESTAQUE: PRÉ-CADASTROS PENDENTES QUE PRECISAM ABRIR PRONTUÁRIO   */}
        {/* Renderiza quando houver clientes aguardando ativação                     */}
        {/* ========================================================================= */}
        {preCadastrosPendentes.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#FFF9F0] via-[#FAF5EE] to-[#F5EAD6] border-2 border-[#C9A46A] shadow-md transition-all animate-fade-in">
            {/* Faixa decorativa superior */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3C89A]/80">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#8C6527] to-[#C9A46A] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] bg-[#E3C89A]/60 px-2.5 py-0.5 rounded-full inline-block">
                      Lembrete de Gestão
                    </span>
                    <Badge className="bg-[#B87355] text-white text-[11px] font-bold px-2 py-0.5 shadow-xs">
                      {preCadastrosPendentes.length}{' '}
                      {preCadastrosPendentes.length === 1
                        ? 'pré-cadastro pendente'
                        : 'pré-cadastros pendentes'}
                    </Badge>
                  </div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#4A322A] mt-0.5">
                    Pré-Cadastros Aguardando Abertura de Prontuário
                  </h2>
                </div>
              </div>
              <p className="text-xs text-[#73574A] max-w-md leading-relaxed sm:text-right">
                Clientes que preencheram o link público de pré-avaliação. Ative para iniciar o
                atendimento.
              </p>
            </div>

            {/* Lista dos Pré-cadastros pendentes */}
            <div className="mt-4 space-y-3">
              {preCadastrosPendentes.map((p) => {
                const isActivating = ativandoPacienteId === p.id
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white/95 border border-[#E9E1D2] hover:border-[#C9A46A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all group"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <Avatar className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-xs shrink-0 shadow-xs border border-white">
                        <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                          {getInitials(p.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => navigate(`/pacientes/${p.id}`)}
                            className="font-bold text-sm sm:text-base text-[#33221C] hover:text-[#8C6527] cursor-pointer transition-colors truncate"
                          >
                            {p.nome}
                          </span>
                          <span className="text-[11px] font-medium text-[#8C6527] bg-[#FAF4EA] border border-[#E3C89A]/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#8C6527]" />
                            Preenchido em {formatDataPTBR(p.created)}
                          </span>
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-1 text-xs text-[#73574A] flex-wrap">
                          {p.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {p.telefone}
                            </span>
                          )}
                          {p.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {p.email}
                            </span>
                          )}
                          {p.motivo_procura && (
                            <span className="text-gray-600 line-clamp-1 italic max-w-md">
                              Motivo: {p.motivo_procura}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/pacientes/${p.id}`)}
                        className="rounded-xl h-9 px-3 text-xs font-semibold border-[#E3C89A] hover:bg-[#FAF4EA] text-[#73574A]"
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAtivarPreCadastro(p)}
                        disabled={isActivating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-9 px-3.5 text-xs shadow-sm flex items-center gap-1.5 border border-emerald-500"
                      >
                        {isActivating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Ativando...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Ativar Cadastro & Abrir Prontuário</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Card Destaque Frontal: Link Público de Pré-Avaliação / Pré-Cadastro */}
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#FAF5EE] via-white to-[#F6EDE0] border-2 border-[#E3C89A] hover:border-[#C9A46A] shadow-xs transition-all duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#8C6527] to-[#B88E52] text-white flex items-center justify-center shrink-0 shadow-md">
                <LinkIcon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] bg-[#E3C89A]/50 px-2.5 py-0.5 rounded-full inline-block">
                    Acesso Público do Cliente
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 hidden sm:inline-block">
                    Sem necessidade de login
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#4A322A] mt-1">
                  Pré-Avaliação via Link
                </h2>
                <p className="text-xs text-[#73574A] mt-0.5">
                  Copie o link público para repassar ao cliente preencher o cadastro e anamnese
                  prévia.
                </p>
              </div>
            </div>

            {/* Visualização do Link e Ações Rápidas de Cópia e Compartilhamento */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:shrink-0 pt-2 lg:pt-0 border-t border-[#E9E1D2]/80 lg:border-t-0">
              {/* Badge/Pill do link encurtado visualmente */}
              <div
                onClick={handleCopyPreCadastroLink}
                title="Clique para copiar o link completo"
                className="flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-[#E9E1D2] hover:border-[#C9A46A] text-[#73574A] cursor-pointer group/link transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span className="font-mono text-xs font-semibold text-[#4A322A] group-hover/link:text-[#8C6527] truncate max-w-[220px] sm:max-w-[260px]">
                    .../pre-cadastro
                  </span>
                </div>
                <span className="text-[11px] text-[#8C6527] font-medium underline sm:no-underline sm:text-gray-400 group-hover/link:text-[#8C6527] shrink-0">
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </span>
              </div>

              {/* Botão Principal: Copiar Link */}
              <Button
                type="button"
                onClick={handleCopyPreCadastroLink}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  copiedLink
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] border border-[#DFBF8E]/60'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copiar Link
                  </>
                )}
              </Button>

              {/* Botão WhatsApp direto */}
              <Button
                type="button"
                onClick={handleSharePreCadastroWhatsApp}
                title="Compartilhar via WhatsApp com mensagem pronta"
                className="h-10 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>

              {/* Botão Modal de Compartilhamento Completo */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalLinkPreCadastroOpen(true)}
                title="Abrir opções completas de compartilhamento e QR Code"
                className="h-10 px-3 rounded-xl border-[#E3C89A] hover:bg-[#FAF4EA] text-[#8C6527] text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Mais Opções</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de Busca de Paciente no Painel de Entrada */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#E9E1D2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50 flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-[#8C6527]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-serif font-bold text-[#4A322A]">Buscar Paciente</h3>
              <p className="text-xs text-[#73574A] truncate">
                Localize prontuários, evoluções e agendamentos pelo nome, CPF ou e-mail
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto md:min-w-[340px]">
            <TopbarBuscaPaciente className="w-full" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISÃO DO PROFISSIONAL (!isAdmin) — EXCLUSIVA, FOCADA EM SEUS ATENDIMENTOS */}
      {/* ========================================================================= */}
      {!isAdmin ? (
        <div className="space-y-8">
          {/* 4 Cards de Métricas Pessoais do Profissional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Minhas Consultas Hoje */}
            <div
              onClick={() => navigate('/agenda')}
              className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Minhas Consultas Hoje
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#FDF2EE] text-[#B87355] border border-[#E7BFB0]/50 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">
                  {minhasConsultasHoje.length}
                </span>
                <span className="text-xs text-[#B87355] font-semibold">Ver minha agenda →</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Seus atendimentos programados para hoje</p>
            </div>

            {/* Card 2: Meus Pacientes Ativos */}
            <div
              onClick={() => navigate('/pacientes')}
              className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Meus Pacientes Ativos
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/40 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">
                  {meusPacientesCount}
                </span>
                <span className="text-xs font-semibold text-[#477A53] flex items-center gap-0.5">
                  <UserCheck className="h-3 w-3" /> Em acompanhamento
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Pacientes ativos disponíveis para você</p>
            </div>

            {/* Card 3: Minhas Evoluções no Mês */}
            <div
              onClick={() => navigate('/prontuarios')}
              className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Minhas Evoluções no Mês
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#F2F6F1] text-[#477A53] border border-[#C1D7C4]/50 flex items-center justify-center transition-transform group-hover:scale-110">
                  <FileCheck2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">
                  {minhasEvolucoesMesCount}
                </span>
                <span className="text-xs font-semibold text-[#477A53]">Assinadas este mês</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Registros clínicos carimbados por você</p>
            </div>

            {/* Card 4: Minhas Avaliações Clínicas */}
            <div
              onClick={() => navigate('/prontuarios')}
              className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Minhas Avaliações
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#F5F1EE] text-[#5C4033] border border-[#D9C8BE]/50 flex items-center justify-center transition-transform group-hover:scale-110">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">
                  {minhasAvaliacoesCount}
                </span>
                <span className="text-xs text-[#5C4033] font-semibold">Laudos emitidos</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Avaliações completas no seu nome</p>
            </div>
          </div>

          {/* Destaque: Próximo Atendimento do Dia */}
          {proximaConsulta && (
            <div className="bg-gradient-to-r from-[#FAF4EA] via-[#F8EFE3] to-[#FAF4EA] rounded-2xl p-5 sm:p-6 border border-[#C9A46A]/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#4A322A] text-[#FAF4EA] flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="h-6 w-6 text-[#C9A46A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] bg-[#E3C89A]/40 px-2 py-0.5 rounded-md">
                      Próximo Atendimento
                    </span>
                    <span className="text-xs font-mono font-bold text-[#4A322A]">
                      {formatHoraPTBR(proximaConsulta.data_hora)}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#4A322A] mt-0.5">
                    {proximaConsulta.expand?.paciente_id?.nome || 'Paciente'}
                  </h3>
                  <p className="text-xs text-[#73574A]">
                    Especialidade:{' '}
                    <strong className="text-[#4A322A]">{proximaConsulta.especialidade}</strong> ·{' '}
                    Duração: {proximaConsulta.duracao_min || 45} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/prontuarios/novo?paciente=${proximaConsulta.paciente_id}&especialidade=${encodeURIComponent(
                        proximaConsulta.especialidade,
                      )}`,
                    )
                  }
                  className="bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold text-xs rounded-xl h-9 px-4 flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Iniciar Avaliação
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/pacientes/${proximaConsulta.paciente_id}`)}
                  className="border-[#C9A46A]/60 text-[#4A322A] hover:bg-white text-xs rounded-xl h-9"
                >
                  Ver Prontuário
                </Button>
              </div>
            </div>
          )}

          {/* Grid Principal do Profissional: Minhas Consultas Hoje + Atalhos Rápidos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista das Minhas Consultas de Hoje */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-lg font-serif font-bold text-[#4A322A]">
                        Minhas Consultas de Hoje
                      </h2>
                      <p className="text-xs text-[#73574A]">
                        Acesso rápido aos pacientes agendados na sua grade
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/agenda')}
                    className="text-xs text-[#8C6527] hover:text-[#5C4033] hover:bg-[#FAF4EA] rounded-lg"
                  >
                    Abrir Minha Agenda <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                {minhasConsultasHoje.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                      Você não possui consultas agendadas para hoje.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Agende um novo atendimento na tela de Agenda ou clique em Nova Avaliação.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {minhasConsultasHoje.map((c) => {
                      const espStyle = ESPECIALIDADE_COLORS[c.especialidade]
                      const pacNome = c.expand?.paciente_id?.nome || 'Paciente'
                      return (
                        <div
                          key={c.id}
                          onClick={() => navigate('/agenda')}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-[#C9A46A]/60 hover:bg-[#FAF7F1]/60 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-bold text-xs min-w-[60px]">
                              <Clock className="h-3 w-3 text-gray-500 mb-0.5" />
                              {formatHoraPTBR(c.data_hora)}
                            </div>

                            <div>
                              <div className="font-semibold text-sm text-[#33221C] group-hover:text-[#8C6527] transition-colors">
                                {pacNome}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${espStyle.badge}`}
                                >
                                  {c.especialidade}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {c.duracao_min || 45} min
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                c.status === 'Concluída'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                                  : c.status === 'Confirmada'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 text-xs'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 text-xs'
                              }
                            >
                              {c.status}
                            </Badge>

                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(
                                  `/prontuarios/novo?paciente=${c.paciente_id}&especialidade=${encodeURIComponent(
                                    c.especialidade,
                                  )}`,
                                )
                              }}
                              className="h-8 px-2.5 rounded-lg bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] text-xs font-semibold flex items-center gap-1 shadow-xs border border-[#DFBF8E]/40"
                              title="Iniciar avaliação clínica"
                            >
                              <Play className="h-3.5 w-3.5 fill-current text-[#33221C]" />
                              <span className="hidden sm:inline">Iniciar</span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Lateral: Atalhos Clínicos do Profissional */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs space-y-4">
                <h3 className="text-base font-serif font-bold text-[#4A322A]">Ações Rápidas</h3>
                <p className="text-xs text-gray-500">
                  Acesse diretamente as ferramentas de trabalho clínico diário:
                </p>

                <div className="space-y-2.5">
                  <Button
                    onClick={() => navigate('/atendimento')}
                    className="w-full justify-start h-11 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs shadow-2xs"
                  >
                    <CalendarCheck2 className="h-4 w-4 mr-2 text-emerald-700" />
                    Registrar Atendimento (Presença + Evolução)
                  </Button>

                  <Button
                    onClick={() => navigate('/prontuarios/novo')}
                    className="w-full justify-start h-11 rounded-xl bg-gradient-to-r from-[#C9A46A] to-[#B88E52] text-[#33221C] font-semibold text-xs shadow-xs"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Avaliação Clínica
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/pacientes')}
                    className="w-full justify-start h-11 rounded-xl border-[#E9E1D2] hover:bg-[#FAF7F1] text-[#4A322A] text-xs font-semibold"
                  >
                    <Search className="h-4 w-4 mr-2 text-[#8C6527]" />
                    Buscar Paciente
                  </Button>
                </div>
              </div>

              {/* Informação sobre permissão restrita */}
              <div className="bg-[#FAF7F1] rounded-2xl p-5 border border-[#E9E1D2] text-xs text-[#73574A] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#4A322A]">
                  <Stethoscope className="h-4 w-4 text-[#C9A46A]" />
                  Perfil Profissional SOUL
                </div>
                <p className="leading-relaxed">
                  Seu acesso está focado em clientes, cadastro de novos pacientes, avaliações e
                  evoluções clínicas do prontuário eletrônico.
                </p>
              </div>
            </div>
          </div>

          {/* Pacientes em Acompanhamento Recentes */}
          <div className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#4A322A]">
                    Pacientes em Acompanhamento
                  </h2>
                  <p className="text-xs text-[#73574A]">
                    Prontuários ativos disponíveis para atendimento e evolução
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/pacientes')}
                className="text-xs text-[#8C6527] hover:text-[#5C4033] hover:bg-[#FAF4EA] rounded-lg"
              >
                Ver todos os pacientes <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            {meusPacientesRecentes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Nenhum paciente cadastrado no momento.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meusPacientesRecentes.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="p-4 rounded-xl border border-gray-100 hover:border-[#C9A46A]/60 hover:shadow-sm bg-gray-50/40 hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-xs shrink-0 shadow-xs">
                        <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                          {getInitials(p.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#33221C] truncate group-hover:text-[#8C6527] transition-colors">
                          {p.nome}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {p.email || p.telefone || 'Sem contato cadastrado'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0"
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Última atualização:</span>
                      <span className="font-medium text-gray-700">{formatDataPTBR(p.updated)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VISÃO ADMINISTRATIVA (isAdmin) — MANTÉM OS NÚMEROS GLOBAIS DA CLÍNICA    */
        /* ========================================================================= */
        <div className="space-y-8">
          {/* 4 Stat Cards Row Administrativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Pacientes Ativos Globais */}
            <div
              onClick={() => navigate('/pacientes')}
              className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Pacientes Ativos (Clínica)
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/40 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">
                  {pacientesAtivosCount}
                </span>
                <span className="text-xs font-semibold text-[#477A53] flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> Base completa
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Total de prontuários cadastrados na clínica
              </p>
            </div>

            {/* Card 2: Consultas Hoje Globais */}
            <div
              onClick={() => navigate('/agenda')}
              className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Consultas Hoje (Clínica)
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#FDF2EE] text-[#B87355] border border-[#E7BFB0]/50 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">
                  {minhasConsultasHoje.length}
                </span>
                <span className="text-xs text-[#B87355] font-semibold">Ver grade completa →</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Atendimentos programados para hoje na clínica
              </p>
            </div>

            {/* Card 3: Satisfação */}
            <div className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Avg. Satisfação
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#F2F6F1] text-[#477A53] border border-[#C1D7C4]/50 flex items-center justify-center">
                  <Smile className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">94%</span>
                <span className="text-xs font-semibold text-[#477A53]">Excelente</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Avaliações positivas dos pacientes</p>
            </div>

            {/* Card 4: Consultas na Semana */}
            <div
              onClick={() => navigate('/agenda')}
              className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
                  Consultas na Semana
                </span>
                <div className="h-10 w-10 rounded-xl bg-[#F5F1EE] text-[#5C4033] border border-[#D9C8BE]/50 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-serif text-[#4A322A]">
                  {consultasSemanaCount}
                </span>
                <span className="text-xs text-[#5C4033] font-semibold">Fluxo semanal</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Total de agendamentos registrados</p>
            </div>
          </div>

          {/* Main Grid: Consultas de Hoje + Donut Especialidades */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <h2 className="text-lg font-serif font-bold text-[#4A322A]">
                      Consultas de Hoje
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/agenda')}
                    className="text-xs text-[#8C6527] hover:text-[#5C4033] hover:bg-[#FAF4EA] rounded-lg"
                  >
                    Abrir Agenda <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                {minhasConsultasHoje.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                      Nenhuma consulta agendada para hoje.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Agende consultas pelo botão acima ou pela tela de agenda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {minhasConsultasHoje.map((c) => {
                      const espStyle = ESPECIALIDADE_COLORS[c.especialidade]
                      const pacNome = c.expand?.paciente_id?.nome || 'Paciente'
                      return (
                        <div
                          key={c.id}
                          onClick={() => navigate('/agenda')}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/70 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-bold text-xs min-w-[60px]">
                              <Clock className="h-3 w-3 text-gray-500 mb-0.5" />
                              {formatHoraPTBR(c.data_hora)}
                            </div>

                            <div>
                              <div className="font-semibold text-sm text-[#33221C] group-hover:text-[#8C6527] transition-colors">
                                {pacNome}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${espStyle.badge}`}
                                >
                                  {c.especialidade}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {c.duracao_min || 45} min
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                c.status === 'Concluída'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                                  : c.status === 'Confirmada'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 text-xs'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 text-xs'
                              }
                            >
                              {c.status}
                            </Badge>

                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(
                                  `/prontuarios/novo?paciente=${c.paciente_id}&especialidade=${encodeURIComponent(
                                    c.especialidade,
                                  )}`,
                                )
                              }}
                              className="h-8 px-2.5 rounded-lg bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] text-xs font-semibold flex items-center gap-1 shadow-xs border border-[#DFBF8E]/40"
                              title="Iniciar avaliação clínica"
                            >
                              <Play className="h-3.5 w-3.5 fill-current text-[#33221C]" />
                              <span className="hidden sm:inline">Iniciar</span>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Donut Chart: Especialidades Globais */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#4A322A] mb-1">Especialidades</h2>
                <p className="text-xs text-[#73574A] mb-4">
                  Distribuição de atendimentos da clínica
                </p>

                <div className="h-48 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 rounded-lg shadow-md border border-gray-100 text-xs font-medium">
                                <span style={{ color: payload[0].payload.color }}>
                                  {payload[0].name}: {payload[0].value} consultas
                                </span>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Pie
                        data={specialtyDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        isAnimationActive={true}
                        animationDuration={800}
                      >
                        {specialtyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                  {specialtyDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-600 truncate">{item.name}</span>
                      <span className="text-xs font-semibold text-gray-900 ml-auto">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row: Pacientes Recentes Gerais */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#4A322A]">
                    Pacientes Recentes
                  </h2>
                  <p className="text-xs text-[#73574A]">Últimos pacientes cadastrados na clínica</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/pacientes')}
                className="text-xs text-[#8C6527] hover:text-[#5C4033] hover:bg-[#FAF4EA] rounded-lg"
              >
                Ver todos os pacientes <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            {pacientesRecentes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Nenhum paciente cadastrado ainda.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pacientesRecentes.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-gray-50/40 hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-xs shrink-0 shadow-xs">
                        <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                          {getInitials(p.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#33221C] truncate group-hover:text-[#8C6527] transition-colors">
                          {p.nome}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {p.email || p.telefone || 'Sem contato'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 ml-auto"
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Cadastrado em:</span>
                      <span className="font-medium text-gray-700">{formatDataPTBR(p.created)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de Compartilhamento do Link de Pré-Avaliação */}
      <ModalLinkPreCadastro
        open={modalLinkPreCadastroOpen}
        onOpenChange={setModalLinkPreCadastroOpen}
      />
    </div>
  )
}
