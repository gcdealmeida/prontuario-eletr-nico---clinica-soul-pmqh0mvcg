import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Play,
  CheckCircle2,
  Edit,
  XCircle,
  User,
  Filter,
  Bell,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getConsultas, updateConsulta } from '@/services/consultas'
import { NovaConsultaModal } from '@/components/NovaConsultaModal'
import type { ConsultaRecord, Especialidade, StatusConsulta } from '@/types/database'
import { ESPECIALIDADE_COLORS, formatHoraPTBR, formatDataPTBR, getInitials } from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export default function Agenda() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'dia' | 'semana'>('dia')
  const [consultas, setConsultas] = useState<ConsultaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [novaConsultaOpen, setNovaConsultaOpen] = useState(false)
  const [selectedConsulta, setSelectedConsulta] = useState<ConsultaRecord | null>(null)

  const fetchConsultasData = async () => {
    try {
      setLoading(true)
      const res = await getConsultas('', 'data_hora')
      setConsultas(res)
    } catch (err) {
      console.error('Erro buscando consultas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsultasData()
  }, [])

  // Realtime
  useRealtime('consultas', () => {
    fetchConsultasData()
  })

  // Navegação de data
  const handlePrev = () => {
    const next = new Date(currentDate)
    if (viewMode === 'dia') {
      next.setDate(next.getDate() - 1)
    } else {
      next.setDate(next.getDate() - 7)
    }
    setCurrentDate(next)
  }

  const handleNext = () => {
    const next = new Date(currentDate)
    if (viewMode === 'dia') {
      next.setDate(next.getDate() + 1)
    } else {
      next.setDate(next.getDate() + 7)
    }
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleUpdateStatus = async (consultaId: string, status: StatusConsulta) => {
    try {
      await updateConsulta(consultaId, { status })
      toast({
        title: 'Status atualizado',
        description: `Consulta marcada como ${status}.`,
      })
      fetchConsultasData()
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  // Filtrar consultas do dia selecionado
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  const consultasDoDia = consultas.filter((c) => {
    const cDate = new Date(c.data_hora)
    return isSameDay(cDate, currentDate)
  })

  // Dias da semana atual (Segunda a Domingo)
  const getDaysOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    // adjust when day is sunday (0) to be 7th day
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))

    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday)
      nextDay.setDate(monday.getDate() + i)
      weekDays.push(nextDay)
    }
    return weekDays
  }

  const weekDays = getDaysOfWeek(currentDate)

  const formattedDateTitle =
    viewMode === 'dia'
      ? currentDate.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : `Semana de ${weekDays[0].toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
        })} a ${weekDays[6].toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda Clínica</h1>
          <p className="text-sm text-gray-500">
            Acompanhamento de horários, consultas e atendimentos multidisciplinares.
          </p>
        </div>

        <Button
          onClick={() => setNovaConsultaOpen(true)}
          className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-semibold rounded-xl h-10 px-4 text-sm flex items-center gap-2 shadow-sm border border-[#DFBF8E]/40"
        >
          <Plus className="h-4 w-4 text-[#33221C]" />
          Nova Consulta
        </Button>
      </div>

      {/* Date Navigator Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-9 w-9 p-0 rounded-xl border-gray-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-9 px-3 text-xs font-semibold rounded-xl border-gray-200"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-9 w-9 p-0 rounded-xl border-gray-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 capitalize pl-2">
            <CalendarIcon className="h-4 w-4 text-[#8C6527]" />
            <span>{formattedDateTitle}</span>
          </div>
        </div>

        {/* Segmented View Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setViewMode('dia')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'dia'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => setViewMode('semana')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'semana'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      {/* VIEW: DIA */}
      {viewMode === 'dia' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Horários do Dia ({consultasDoDia.length} consultas)
              </h3>
              <p className="text-xs text-gray-400">
                Clique na consulta para ver detalhes, alterar status ou iniciar a avaliação.
              </p>
            </div>
          </div>

          {consultasDoDia.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-800">Nenhum agendamento para este dia</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Não existem consultas agendadas para a data selecionada.
              </p>
              <Button
                onClick={() => setNovaConsultaOpen(true)}
                size="sm"
                className="mt-4 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold rounded-xl text-xs"
              >
                Agendar Consulta
              </Button>{' '}
            </div>
          ) : (
            <div className="space-y-3">
              {consultasDoDia.map((c) => {
                const espStyle =
                  ESPECIALIDADE_COLORS[c.especialidade] || ESPECIALIDADE_COLORS.Fisioterapia
                const pacNome = c.expand?.paciente_id?.nome || 'Paciente'
                const isAlerta = (c.notas || '').toUpperCase().includes('[ALERTA')

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isAlerta
                        ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50/80 shadow-2xs'
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div
                        className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border font-bold text-sm min-w-[75px] ${
                          isAlerta
                            ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                            : 'bg-gray-50 border-gray-100 text-gray-900'
                        }`}
                      >
                        {isAlerta ? (
                          <Bell className="h-3.5 w-3.5 text-amber-600 mb-1 animate-pulse" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-gray-400 mb-1" />
                        )}
                        {formatHoraPTBR(c.data_hora)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => navigate(`/pacientes/${c.paciente_id}`)}
                            className="font-bold text-base text-gray-900 hover:text-[#8C6527] cursor-pointer transition-colors"
                          >
                            {pacNome}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${espStyle.badge}`}
                          >
                            {c.especialidade}
                          </span>
                          {isAlerta && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              Lembrete de Reavaliação
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <span>Duração: {c.duracao_min || 45} min</span>
                          {c.notas && (
                            <span
                              className={isAlerta ? 'font-medium text-amber-950' : 'text-gray-500'}
                            >
                              • {c.notas}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                      {/* Status select rápido */}
                      <Select
                        value={c.status}
                        onValueChange={(val) => handleUpdateStatus(c.id, val as StatusConsulta)}
                      >
                        <SelectTrigger className="h-8 w-32 rounded-lg text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Agendada">Agendada</SelectItem>
                          <SelectItem value="Confirmada">Confirmada</SelectItem>
                          <SelectItem value="Concluída">Concluída</SelectItem>
                          <SelectItem value="Cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Iniciar Avaliação */}
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/prontuarios/novo?paciente=${c.paciente_id}&especialidade=${encodeURIComponent(
                              c.especialidade,
                            )}`,
                          )
                        }
                        className="h-8 px-3 rounded-lg bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] text-xs font-semibold flex items-center gap-1.5 shadow-xs border border-[#DFBF8E]/40"
                      >
                        <Play className="h-3.5 w-3.5 fill-current text-[#33221C]" />
                        Atender
                      </Button>{' '}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: SEMANA */}
      {viewMode === 'semana' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[700px] gap-2 divide-x divide-gray-100">
            {weekDays.map((dayDate) => {
              const dayConsultas = consultas.filter((c) =>
                isSameDay(new Date(c.data_hora), dayDate),
              )
              const isToday = isSameDay(dayDate, new Date())

              return (
                <div
                  key={dayDate.toISOString()}
                  onClick={() => {
                    setCurrentDate(dayDate)
                    setViewMode('dia')
                  }}
                  className={`p-2.5 rounded-2xl transition-all cursor-pointer hover:bg-gray-50 flex flex-col min-h-[360px] ${
                    isToday ? 'bg-[#FAF4EA] ring-1 ring-[#C9A46A]/40' : ''
                  }`}
                >
                  {/* Day Header */}
                  <div className="text-center pb-2.5 mb-2 border-b border-gray-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                      {dayDate.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-lg font-black inline-flex items-center justify-center h-8 w-8 rounded-full mt-0.5 ${
                        isToday ? 'bg-[#C9A46A] text-[#33221C] shadow-xs' : 'text-gray-900'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                  </div>

                  {/* Day Appointment chips */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {dayConsultas.length === 0 ? (
                      <span className="text-[10px] text-gray-300 text-center block pt-4">
                        Livre
                      </span>
                    ) : (
                      dayConsultas.map((c) => {
                        const espStyle =
                          ESPECIALIDADE_COLORS[c.especialidade] || ESPECIALIDADE_COLORS.Fisioterapia
                        const pacNome = c.expand?.paciente_id?.nome || 'Paciente'
                        const isAlerta = (c.notas || '').toUpperCase().includes('[ALERTA')

                        return (
                          <div
                            key={c.id}
                            className={`p-2 rounded-xl text-left border shadow-2xs transition-all hover:scale-[1.02] ${
                              isAlerta
                                ? 'bg-amber-100/90 text-amber-950 border-amber-300 ring-1 ring-amber-400/40'
                                : espStyle.badge
                            }`}
                          >
                            <div className="font-bold text-[11px] truncate flex items-center gap-1">
                              {isAlerta && <Bell className="h-2.5 w-2.5 text-amber-700 shrink-0" />}
                              <span>{pacNome}</span>
                            </div>
                            <div className="text-[10px] opacity-80 flex items-center justify-between mt-0.5">
                              <span>{formatHoraPTBR(c.data_hora)}</span>
                              <span className="font-semibold">
                                {isAlerta ? 'ALERTA' : c.especialidade.slice(0, 3)}
                              </span>
                            </div>
                            {isAlerta && c.notas && (
                              <div className="text-[9px] text-amber-800 truncate mt-0.5 font-medium">
                                {c.notas.replace(/\[ALERTA[^\]]*\]/i, '').trim()}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Nova Consulta */}
      <NovaConsultaModal
        open={novaConsultaOpen}
        onOpenChange={setNovaConsultaOpen}
        onSuccess={() => fetchConsultasData()}
      />
    </div>
  )
}
