import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Activity,
  Stethoscope,
  Lock,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAllAvaliacoes } from '@/services/avaliacoes'
import { ESPECIALIDADE_COLORS, formatDataPTBR } from '@/lib/constants'
import type { Especialidade } from '@/types/database'
import { PacienteAcoesRapidas } from '@/components/PacienteAcoesRapidas'
import { useAuth } from '@/contexts/AuthContext'

export default function Prontuarios() {
  const navigate = useNavigate()
  const { isProfissional } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<string>('Todos')
  const [search, setSearch] = useState(searchParams.get('busca') || '')

  const fetchAvaliacoes = async () => {
    try {
      setLoading(true)
      const res = await getAllAvaliacoes()
      setAvaliacoes(res)
    } catch (err) {
      console.error('Erro ao buscar prontuários:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvaliacoes()
  }, [])

  // Contagens por aba
  const countAll = avaliacoes.length
  const countFisio = avaliacoes.filter((a) => a.especialidade === 'Fisioterapia').length
  const countPersonal = avaliacoes.filter((a) => a.especialidade === 'Personal').length
  const countNutri = avaliacoes.filter((a) => a.especialidade === 'Nutrição').length
  const countMedico = avaliacoes.filter((a) => a.especialidade === 'Médico').length

  const filteredAvaliacoes = avaliacoes.filter((av) => {
    if (selectedEspecialidade !== 'Todos' && av.especialidade !== selectedEspecialidade) {
      return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      const pacNome = (av.expand?.paciente_id?.nome || '').toLowerCase()
      const queixa = (
        av.queixa_principal ||
        av.objetivos ||
        av.hipotese_diagnostica ||
        ''
      ).toLowerCase()
      return pacNome.includes(q) || queixa.includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Prontuários & Avaliações
          </h1>
          <p className="text-sm text-gray-500">
            Histórico clínico centralizado com fichas de Fisioterapia, Personal, Nutrição e
            Medicina.
          </p>
          {isProfissional && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6527] bg-[#FAF5EE] border border-[#E3C89A]/50 px-2.5 py-1 rounded-lg">
              <Lock className="h-3 w-3" />
              Visão do Profissional: você vê tudo dos pacientes designados a você, além dos
              prontuários construídos por você.
            </p>
          )}
        </div>

        <Button
          onClick={() => navigate('/prontuarios/novo')}
          className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-semibold rounded-xl h-10 px-4 text-sm flex items-center gap-2 shadow-sm border border-[#DFBF8E]/40"
        >
          <Plus className="h-4 w-4 text-[#33221C]" />
          Nova Avaliação
        </Button>
      </div>

      {/* Tabs Filter Bar */}
      <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm flex flex-wrap items-center gap-1.5">
        {[
          { label: 'Todos', count: countAll, val: 'Todos' },
          { label: 'Fisioterapia', count: countFisio, val: 'Fisioterapia' },
          { label: 'Personal Trainer', count: countPersonal, val: 'Personal' },
          { label: 'Nutrição', count: countNutri, val: 'Nutrição' },
          { label: 'Médico', count: countMedico, val: 'Médico' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setSelectedEspecialidade(tab.val)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              selectedEspecialidade === tab.val
                ? 'bg-[#1E2530] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
                selectedEspecialidade === tab.val
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar em Destaque com Atalho Rápido */}
      <div className="bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C6527]/70" />
          <Input
            type="search"
            placeholder="Buscar paciente pelo nome, queixa clínica, diagnóstico ou objetivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-9 h-11 rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white text-xs sm:text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#73574A] font-medium">
          <span>Total visível:</span>
          <span className="font-bold text-[#33221C] bg-[#FAF5EE] px-2.5 py-1 rounded-lg border border-[#E3C89A]/50">
            {filteredAvaliacoes.length} de {countAll} prontuários
          </span>
        </div>
      </div>

      {/* List / Cards */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#73574A]">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
          <span className="text-xs font-medium">Carregando prontuários...</span>
        </div>
      ) : filteredAvaliacoes.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <FileText className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">Nenhum prontuário encontrado</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Não existem avaliações registradas nesta categoria ou com este termo de busca.
          </p>
          <Button
            onClick={() => navigate('/prontuarios/novo')}
            size="sm"
            className="mt-2 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold rounded-xl text-xs"
          >
            Criar primeira avaliação
          </Button>{' '}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAvaliacoes.map((item) => {
            const esp = (item.especialidade || 'Fisioterapia') as Especialidade
            const espStyle = ESPECIALIDADE_COLORS[esp] || ESPECIALIDADE_COLORS.Fisioterapia
            const pacNome = item.expand?.paciente_id?.nome || 'Paciente SOUL'

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/prontuarios/${item.id}?esp=${encodeURIComponent(esp)}`)}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${espStyle.badge}`}
                    >
                      {esp}
                    </span>
                    <Badge
                      className={
                        item.status === 'Concluída'
                          ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                          : 'bg-amber-100 text-amber-800 text-[10px]'
                      }
                    >
                      {item.status || 'Rascunho'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-[#33221C] group-hover:text-[#8C6527] transition-colors truncate">
                    {pacNome}
                  </h3>

                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.queixa_principal ||
                      item.objetivo_principal ||
                      item.objetivos ||
                      item.hipotese_diagnostica ||
                      'Avaliação clínica detalhada'}
                  </p>
                </div>

                {/* Atalhos Rápidos por Paciente na própria linha/card de prontuário */}
                {item.paciente_id && (
                  <div
                    className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Atalhos:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(
                            `/prontuarios/${item.id}?esp=${encodeURIComponent(esp)}&tab=evolucoes`,
                          )
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors"
                        title="Ir direto para as sessões de evolução deste paciente"
                      >
                        <Activity className="h-3 w-3 text-emerald-600" />
                        Evolução
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/pacientes/${item.paciente_id}`)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold border border-gray-200 transition-colors"
                        title="Ver histórico e perfil completo do paciente"
                      >
                        <User className="h-3 w-3 text-gray-500" />
                        Perfil
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDataPTBR(item.data_avaliacao || item.created)}</span>
                  </div>
                  <span className="text-[#8C6527] font-semibold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Abrir avaliação <ArrowRight className="h-3.5 w-3.5" />
                  </span>{' '}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
