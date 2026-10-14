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
  Activity,
  UserCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { ModalSincronizacaoIcs } from '@/components/ModalSincronizacaoIcs'
import { ModalAcessoRapidoEvolucao } from '@/components/ModalAcessoRapidoEvolucao'
import { CalendarCheck2, Sparkles, CheckCircle2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { getConsultasHoje, getConsultas } from '@/services/consultas'
import { getPacientes } from '@/services/pacientes'
import type { ConsultaRecord, PacienteRecord, EvolucaoRecord } from '@/types/database'
import { ESPECIALIDADE_COLORS, formatHoraPTBR, formatDataPTBR, getInitials } from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'

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
  const [sincronizacaoOpen, setSincronizacaoOpen] = useState(false)
  const [modalEvolucaoOpen, setModalEvolucaoOpen] = useState(false)

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

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      if (isAdmin) {
        await loadAdminData()
      } else if (user?.id) {
        await loadProfessionalData(user.id)
      }
    } catch (err) {
      console.error('Erro dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [isAdmin, user?.id])

  // Realtime updates
  useRealtime('consultas', () => loadDashboardData())
  useRealtime('pacientes', () => loadDashboardData())
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSincronizacaoOpen(true)}
            className="border-[#E3C89A] hover:bg-[#FAF4EA] text-[#8C6527] font-semibold rounded-xl h-10 px-3.5 text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-2xs"
            title="Sincronizar com Google Agenda"
          >
            <RefreshCw className="h-4 w-4 text-[#8C6527]" />
            <span className="hidden sm:inline">Google Agenda</span>
          </Button>

          <Button
            onClick={() => navigate('/prontuarios/novo')}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] text-[#33221C] font-semibold shadow-sm hover:brightness-105 rounded-xl h-10 px-4 text-sm flex items-center gap-2 border border-[#DFBF8E]/40"
          >
            <Plus className="h-4 w-4 text-[#33221C]" />
            Nova Avaliação
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTÕES DE ACESSO RÁPIDO EM DESTAQUE (PÓS-LOGIN): PRESENÇA E EVOLUÇÃO      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Botão A: Presença e Confirmação */}
        <div
          onClick={() => navigate('/presencas')}
          className="relative overflow-hidden group p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#FAF4EA] via-white to-[#F5EAD6] border-2 border-[#E3C89A] hover:border-[#C9A46A] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#8C6527] to-[#B88E52] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <CalendarCheck2 className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] bg-[#E3C89A]/50 px-2 py-0.5 rounded-md">
                  Acesso Rápido Diário
                </span>
                <span className="text-[11px] text-[#73574A] font-medium hidden sm:inline">
                  Base contábil / cobrança futura
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#4A322A] group-hover:text-[#8C6527] transition-colors mt-0.5">
                Presença e Confirmação
              </h2>
              <p className="text-xs text-[#73574A] line-clamp-1 mt-0.5">
                Lançar presença de hoje ou conferir atendimentos dos seus pacientes e alunos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate('/presencas')
              }}
              className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold text-xs rounded-xl h-10 px-4 shadow-sm border border-[#DFBF8E]/60 flex items-center gap-1.5"
            >
              <span>Acessar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Botão B: Evolução SOAP Rápida */}
        <div
          onClick={() => setModalEvolucaoOpen(true)}
          className="relative overflow-hidden group p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 border-2 border-emerald-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Fluxo SOAP & EVA
                </span>
                <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
                  Com ou sem avaliação prévia
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#4A322A] group-hover:text-emerald-800 transition-colors mt-0.5">
                Evolução Clínica
              </h2>
              <p className="text-xs text-[#73574A] line-clamp-1 mt-0.5">
                Buscar paciente e registrar sessão de atendimento com régua EVA de 1 clique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setModalEvolucaoOpen(true)
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-10 px-4 shadow-sm border border-emerald-600 flex items-center gap-1.5"
            >
              <span>Evoluir</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
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
                    onClick={() => navigate('/presencas')}
                    className="w-full justify-start h-11 rounded-xl bg-gradient-to-r from-[#FAF4EA] to-[#F5EAD6] border border-[#E3C89A] hover:bg-[#F3E5CF] text-[#4A322A] font-bold text-xs shadow-2xs"
                  >
                    <CalendarCheck2 className="h-4 w-4 mr-2 text-[#8C6527]" />
                    Presença / Confirmação de Hoje
                  </Button>

                  <Button
                    onClick={() => setModalEvolucaoOpen(true)}
                    className="w-full justify-start h-11 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs shadow-2xs"
                  >
                    <Activity className="h-4 w-4 mr-2 text-emerald-700" />
                    Nova Evolução Clínica (Sessão SOAP)
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
                    <Users className="h-4 w-4 mr-2 text-[#8C6527]" />
                    Cadastrar Novo Paciente
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/agenda')}
                    className="w-full justify-start h-11 rounded-xl border-[#E9E1D2] hover:bg-[#FAF7F1] text-[#4A322A] text-xs font-semibold"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-[#B87355]" />
                    Agendar Atendimento
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSincronizacaoOpen(true)}
                    className="w-full justify-start h-11 rounded-xl border-[#E3C89A]/70 hover:bg-[#FAF4EA] text-[#8C6527] text-xs font-semibold"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 text-[#8C6527]" />
                    Sincronizar Google Agenda
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/guia')}
                    className="w-full justify-start h-11 rounded-xl border-[#E9E1D2] hover:bg-[#FAF7F1] text-[#4A322A] text-xs font-semibold"
                  >
                    <Activity className="h-4 w-4 mr-2 text-[#477A53]" />
                    Guia de Uso & Procedimentos
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
      {/* Modal de Sincronização Google Agenda / Exportação iCal */}
      <ModalSincronizacaoIcs
        open={sincronizacaoOpen}
        onOpenChange={setSincronizacaoOpen}
        onSyncComplete={loadDashboardData}
      />

      {/* Modal de Acesso Rápido a Evolução */}
      <ModalAcessoRapidoEvolucao open={modalEvolucaoOpen} onOpenChange={setModalEvolucaoOpen} />
    </div>
  )
}
