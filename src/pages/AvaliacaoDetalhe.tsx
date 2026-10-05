import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Printer,
  Edit,
  ArrowLeft,
  Calendar,
  User,
  Activity,
  CheckCircle2,
  FileText,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAvaliacaoById, getCollectionNameByEspecialidade } from '@/services/avaliacoes'
import { ESPECIALIDADE_COLORS, formatDataPTBR } from '@/lib/constants'
import type { Especialidade, AvaliacaoFisioterapiaRecord } from '@/types/database'
import { LogoSOUL } from '@/components/LogoSOUL'
import { VisualizacaoFisioterapia } from '@/components/fisioterapia/VisualizacaoFisioterapia'

export default function AvaliacaoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const espParam = (searchParams.get('esp') || 'Fisioterapia') as Especialidade
  const navigate = useNavigate()

  const [avaliacao, setAvaliacao] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const col = getCollectionNameByEspecialidade(espParam)
    getAvaliacaoById(col, id)
      .then((res) => {
        setAvaliacao(res)
      })
      .catch((err) => {
        console.error('Erro ao carregar prontuário:', err)
      })
      .finally(() => setLoading(false))
  }, [id, espParam])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
        <span className="text-xs text-[#73574A] font-medium">Carregando prontuário...</span>
      </div>
    )
  }

  if (!avaliacao) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Avaliação não encontrada</h2>
        <Button onClick={() => navigate('/prontuarios')} variant="outline">
          Voltar para Prontuários
        </Button>
      </div>
    )
  }

  const pacNome = avaliacao.expand?.paciente_id?.nome || 'Paciente SOUL'
  const pacCpf = avaliacao.expand?.paciente_id?.cpf
  const espStyle = ESPECIALIDADE_COLORS[espParam] || ESPECIALIDADE_COLORS.Fisioterapia

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:max-w-none print:m-0 print:p-0">
      {/* Top Bar / Breadcrumb (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link to="/prontuarios" className="hover:text-gray-900 transition-colors">
            Prontuários
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-700">{pacNome}</span>
          <span>/</span>
          <span className="font-bold text-[#8C6527]">{espParam}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Editar */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/prontuarios/novo?edit=${avaliacao.id}&especialidade=${encodeURIComponent(
                  espParam,
                )}&paciente=${avaliacao.paciente_id}`,
              )
            }
            className="rounded-xl h-9 text-xs font-semibold border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Edit className="h-3.5 w-3.5 text-gray-600" />
            Editar
          </Button>

          {/* Baixar PDF via window.print */}
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-[#1E2530] hover:bg-black text-white rounded-xl h-9 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Baixar PDF / Imprimir
          </Button>
        </div>
      </div>

      {/* Main Document Card (rendered for view & print) */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho Oficial do Prontuário Clínico Oficial:
            Disposição vertical oficial empilhada e centralizada:
            - Símbolo oficial fiel à imagem no topo
            - "CLÍNICA" com as linhas douradas laterais
            - "SOUL" em serifada grande
            - Lótus com linha divisória
            - "SAÚDE E BEM-ESTAR"
            Garantindo imagem original completa, sem cortes, sem distorção e com overflow visível */}
        <div className="pb-6 border-b-2 border-[#E9E1D2] flex flex-col items-center justify-center text-center gap-3 print:pb-4 print:mb-6 overflow-visible">
          <LogoSOUL
            variant="full"
            size="md"
            theme="light"
            className="shrink-0 print:shrink-0 mx-auto overflow-visible"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-1">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#8C6527] font-bold block leading-tight">
              Prontuário Clínico Oficial
            </span>
            <span className="hidden sm:inline-block text-[#D4B278]">•</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E9E1D2] text-[10px] font-semibold text-[#8C6527] uppercase tracking-wider">
              Documento Confidencial
            </div>
            <span className="hidden sm:inline-block text-[#D4B278]">•</span>
            <span className="text-[11px] text-[#73574A]">
              Emitido em {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Document Header */}
        <div className="pb-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${espStyle.badge}`}
              >
                {espParam}
              </span>
              <Badge
                className={
                  avaliacao.status === 'Concluída'
                    ? 'bg-emerald-100 text-emerald-800 text-[10px]'
                    : 'bg-amber-100 text-amber-800 text-[10px]'
                }
              >
                {avaliacao.status || 'Rascunho'}
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{pacNome}</h1>
            {pacCpf && <p className="text-xs text-gray-400 font-mono mt-0.5">CPF: {pacCpf}</p>}
          </div>

          <div className="text-right sm:text-right space-y-1">
            <div className="text-xs text-gray-500 flex items-center justify-start sm:justify-end gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>
                Data da Avaliação: {formatDataPTBR(avaliacao.data_avaliacao || avaliacao.created)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Profissional: <strong>{avaliacao.profissional_responsavel || 'SOUL Clínica'}</strong>
            </div>
          </div>
        </div>

        {/* Content Renderers by Specialty */}
        {espParam === 'Fisioterapia' && (
          <VisualizacaoFisioterapia avaliacao={avaliacao as AvaliacaoFisioterapiaRecord} />
        )}

        {espParam === 'Personal' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-700 bg-orange-50/70 p-2 rounded-lg">
                1. Objetivos & Restrições
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Objetivo</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.objetivo_principal || '—'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Nível</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.nivel_experiencia || '—'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Freq. Semanal</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.frequencia_semanal || '—'} dias
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Restrições</span>
                  <span className="text-sm font-bold text-gray-900 truncate">
                    {avaliacao.restricoes_treino || 'Nenhuma'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-700 bg-orange-50/70 p-2 rounded-lg">
                2. Avaliação Antropométrica
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Peso</span>
                  <span className="text-base font-bold text-gray-900">
                    {avaliacao.peso || '—'} kg
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Altura</span>
                  <span className="text-base font-bold text-gray-900">
                    {avaliacao.altura || '—'} m
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">IMC</span>
                  <span className="text-base font-bold text-[#8C6527]">{avaliacao.imc || '—'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">% Gordura</span>
                  <span className="text-base font-bold text-gray-900">
                    {avaliacao.percentual_gordura || '—'}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Cintura</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.circ_cintura || '—'} cm
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Abdômen</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.circ_abdomen || '—'} cm
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Quadril</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.circ_quadril || '—'} cm
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-700 bg-orange-50/70 p-2 rounded-lg">
                3. Prescrição de Treino
              </h3>
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-700 block">Plano de Treino:</span>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {avaliacao.plano_treino || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {espParam === 'Nutrição' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 bg-green-50/70 p-2 rounded-lg">
                1. Antropometria & Saúde
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Peso Atual</span>
                  <span className="text-base font-bold text-gray-900">
                    {avaliacao.peso || '—'} kg
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Altura</span>
                  <span className="text-base font-bold text-gray-900">
                    {avaliacao.altura || '—'} m
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">IMC</span>
                  <span className="text-base font-bold text-green-700">{avaliacao.imc || '—'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Água</span>
                  <span className="text-base font-bold text-gray-900">
                    {avaliacao.consumo_agua_l || '—'} L/dia
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 bg-green-50/70 p-2 rounded-lg">
                2. Recordatório 24 Horas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-gray-700 block">Café da Manhã:</span>
                  <p className="text-gray-900 mt-0.5">{avaliacao.rec_cafe_manha || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-gray-700 block">Almoço:</span>
                  <p className="text-gray-900 mt-0.5">{avaliacao.rec_almoco || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-gray-700 block">Lanches:</span>
                  <p className="text-gray-900 mt-0.5">{avaliacao.rec_lanches || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-gray-700 block">Jantar / Ceia:</span>
                  <p className="text-gray-900 mt-0.5">{avaliacao.rec_jantar || '—'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 bg-green-50/70 p-2 rounded-lg">
                3. Plano Alimentar & Metas
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-gray-700 block">Objetivos:</span>
                  <p className="text-gray-900 mt-0.5">{avaliacao.objetivos || '—'}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">Plano Alimentar Prescrito:</span>
                  <p className="text-gray-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {avaliacao.plano_alimentar || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {espParam === 'Médico' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 bg-purple-50/70 p-2 rounded-lg">
                1. Anamnese Clínica
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-gray-700 block">Queixa Principal:</span>
                  <p className="text-gray-900 mt-0.5">{avaliacao.queixa_principal || '—'}</p>
                </div>
                {avaliacao.hda && (
                  <div>
                    <span className="font-bold text-gray-700 block">HDA:</span>
                    <p className="text-gray-900 mt-0.5 whitespace-pre-wrap">{avaliacao.hda}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="font-bold text-gray-700 block">Medicamentos:</span>
                    <p className="text-gray-900 mt-0.5">{avaliacao.medicamentos || '—'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 block">Alergias:</span>
                    <p className="text-gray-900 mt-0.5">
                      {avaliacao.alergias || 'Nenhuma relatada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 bg-purple-50/70 p-2 rounded-lg">
                2. Exame Físico & Sinais Vitais
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Pressão Arterial</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.pressao_arterial || '—'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">FC</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.fc ? `${avaliacao.fc} bpm` : '—'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">FR</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.fr ? `${avaliacao.fr} irpm` : '—'}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Temp</span>
                  <span className="text-sm font-bold text-gray-900">
                    {avaliacao.temperatura ? `${avaliacao.temperatura}°C` : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 bg-purple-50/70 p-2 rounded-lg">
                3. Conduta Terapêutica & Prescrição
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-gray-700 block">Hipótese Diagnóstica:</span>
                  <p className="text-gray-900 mt-0.5 font-medium">
                    {avaliacao.hipotese_diagnostica || '—'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">Conduta Terapêutica:</span>
                  <p className="text-gray-900 mt-0.5 whitespace-pre-wrap">
                    {avaliacao.conduta_terapeutica || '—'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">Prescrição Médica:</span>
                  <p className="text-gray-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {avaliacao.prescricao || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Signature */}
        <div className="pt-10 border-t border-gray-200 mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>
            <p className="font-bold text-gray-900">
              {avaliacao.profissional_responsavel || 'Profissional Responsável'}
            </p>
            <p className="text-[11px] text-gray-400">Especialidade: {espParam}</p>
          </div>

          <div className="text-center sm:text-right">
            <div className="w-48 border-b border-gray-400 mb-1" />
            <span className="text-[10px] text-gray-400">Assinatura Digital SOUL Clínica</span>
          </div>
        </div>
      </div>
    </div>
  )
}
