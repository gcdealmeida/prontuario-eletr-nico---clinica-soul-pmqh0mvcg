import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Smile,
  Clock,
  TrendingUp,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { getConsultasHoje, getConsultas } from '@/services/consultas'
import { getPacientes } from '@/services/pacientes'
import type { ConsultaRecord, PacienteRecord } from '@/types/database'
import { ESPECIALIDADE_COLORS, formatHoraPTBR, formatDataPTBR, getInitials } from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [pacientesAtivosCount, setPacientesAtivosCount] = useState(0)
  const [consultasHoje, setConsultasHoje] = useState<ConsultaRecord[]>([])
  const [consultasSemanaCount, setConsultasSemanaCount] = useState(0)
  const [pacientesRecentes, setPacientesRecentes] = useState<PacienteRecord[]>([])
  const [specialtyDistribution, setSpecialtyDistribution] = useState<
    { name: string; value: number; color: string }[]
  >([])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // 1. Pacientes ativos e recentes
      const pacRes = await getPacientes('', '-created', 5, 1)
      setPacientesRecentes(pacRes.items)
      setPacientesAtivosCount(pacRes.totalItems)

      // 2. Consultas de hoje
      const hoje = await getConsultasHoje()
      setConsultasHoje(hoje)

      // 3. Consultas gerais para cálculo de especialidades e semana
      const todasConsultas = await getConsultas()
      setConsultasSemanaCount(todasConsultas.length)

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

      // Distribuição por especialidade com a paleta terrosa oficial SOUL
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      if (total === 0) {
        setSpecialtyDistribution([
          { name: 'Fisioterapia', value: 40, color: '#C9A46A' }, // Dourado champagne
          { name: 'Personal', value: 25, color: '#B87355' }, // Cobre / rosé
          { name: 'Nutrição', value: 20, color: '#477A53' }, // Verde sálvia
          { name: 'Médico', value: 15, color: '#5C4033' }, // Marrom café
        ])
      } else {
        setSpecialtyDistribution([
          { name: 'Fisioterapia', value: counts['Fisioterapia'] || 1, color: '#C9A46A' },
          { name: 'Personal', value: counts['Personal'] || 1, color: '#B87355' },
          { name: 'Nutrição', value: counts['Nutrição'] || 1, color: '#477A53' },
          { name: 'Médico', value: counts['Médico'] || 1, color: '#5C4033' },
        ])
      }
    } catch (err) {
      console.error('Erro dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Realtime updates
  useRealtime('consultas', () => loadDashboardData())
  useRealtime('pacientes', () => loadDashboardData())

  const hojePtBr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#4A322A]">
            Bem-vindo(a), {user?.name || 'Profissional SOUL'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#73574A] capitalize mt-1">Hoje, {hojePtBr}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/prontuarios/novo')}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] text-[#33221C] font-semibold shadow-sm hover:brightness-105 rounded-xl h-10 px-4 text-sm flex items-center gap-2 border border-[#DFBF8E]/40"
          >
            <Plus className="h-4 w-4 text-[#33221C]" />
            Nova Avaliação
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pacientes Ativos */}
        <div
          onClick={() => navigate('/pacientes')}
          className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
              Pacientes Ativos
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
              <TrendingUp className="h-3 w-3" /> +12% mês
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Total de prontuários cadastrados</p>
        </div>

        {/* Card 2: Consultas Hoje (Clicável -> Agenda) */}
        <div
          onClick={() => navigate('/agenda')}
          className="bg-white rounded-2xl p-6 border border-[#E9E1D2] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#73574A]">
              Consultas Hoje
            </span>
            <div className="h-10 w-10 rounded-xl bg-[#FDF2EE] text-[#B87355] border border-[#E7BFB0]/50 flex items-center justify-center transition-transform group-hover:scale-110">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-[#4A322A]">
              {consultasHoje.length}
            </span>
            <span className="text-xs text-[#B87355] font-semibold">Ver agenda do dia →</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Atendimentos programados para hoje</p>
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

      {/* Main Grid: Consultas de Hoje (2 cols) + Donut Specialty (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultas de Hoje */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
                  <Calendar className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-serif font-bold text-[#4A322A]">Consultas de Hoje</h2>
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

            {consultasHoje.length === 0 ? (
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
                {consultasHoje.map((c) => {
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

                        {/* Ação Iniciar abre formulário de avaliação */}
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

        {/* Donut Chart: Especialidades */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#4A322A] mb-1">Especialidades</h2>
            <p className="text-xs text-[#73574A] mb-4">Distribuição de atendimentos da clínica</p>

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
                  <span className="text-xs font-semibold text-gray-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row: Pacientes Recentes */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#4A322A]">Pacientes Recentes</h2>
              <p className="text-xs text-[#73574A]">Últimos pacientes atendidos ou cadastrados</p>
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
                    </p>{' '}
                    <p className="text-xs text-gray-400 truncate">
                      {p.email || p.telefone || 'Sem contato'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
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
  )
}
