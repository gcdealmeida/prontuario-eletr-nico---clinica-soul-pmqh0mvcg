import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  Dumbbell,
  Clock,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurvaCargaGrafico } from './CurvaCargaGrafico'
import type {
  ProgramaExercicioRecord,
  ProgramaMetaRecord,
  ProgramaRegistroCargaRecord,
  TipoRepeticaoExercicio,
} from '@/types/database'

interface PainelExerciciosObjetivoProps {
  semanaIndice: number
  rotuloPeriodo: string
  metasDaSemana: ProgramaMetaRecord[]
  exercicios: ProgramaExercicioRecord[]
  registrosCarga: Record<string, ProgramaRegistroCargaRecord[]> // chave: exercicio_id
  onSalvarExercicio: (ex: Partial<ProgramaExercicioRecord>) => Promise<void>
  onExcluirExercicio: (id: string) => Promise<void>
  onAdicionarCarga: (
    exercicioId: string,
    valorKg: number,
    dataIso: string,
    reps?: string,
  ) => Promise<void>
}

export const PainelExerciciosObjetivo: React.FC<PainelExerciciosObjetivoProps> = ({
  semanaIndice,
  rotuloPeriodo,
  metasDaSemana,
  exercicios,
  registrosCarga,
  onSalvarExercicio,
  onExcluirExercicio,
  onAdicionarCarga,
}) => {
  const [novoExNome, setNovoExNome] = useState('')
  const [novoExMetaId, setNovoExMetaId] = useState('')
  const [novoExSeries, setNovoExSeries] = useState<number | ''>(3)
  const [novoExTipo, setNovoExTipo] = useState<TipoRepeticaoExercicio>('reps')
  const [novoExQtd, setNovoExQtd] = useState('10-12')
  const [novoExIntervalo, setNovoExIntervalo] = useState('60s')
  const [novoExCarga, setNovoExCarga] = useState('')
  const [novoExObs, setNovoExObs] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  // Estado para modal / input rápido de nova carga
  const [exercicioCargaAberto, setExercicioCargaAberto] = useState<string | null>(null)
  const [novaCargaKg, setNovaCargaKg] = useState<number | ''>('')
  const [novaCargaData, setNovaCargaData] = useState(new Date().toISOString().substring(0, 10))
  const [novaCargaReps, setNovaCargaReps] = useState('')
  const [salvandoCarga, setSalvandoCarga] = useState(false)

  // Exercícios filtrados por esta semana
  const exerciciosSemana = exercicios.filter((e) => e.semana_indice === semanaIndice)

  const handleCriarExercicio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoExNome.trim()) return

    try {
      setAdicionando(true)
      await onSalvarExercicio({
        semana_indice: semanaIndice,
        meta_id: novoExMetaId || (metasDaSemana[0]?.id ?? ''),
        nome: novoExNome.trim(),
        series: typeof novoExSeries === 'number' ? novoExSeries : 3,
        tipo_repeticao: novoExTipo,
        quantidade: novoExQtd || (novoExTipo === 'reps' ? '12' : '30s'),
        intervalo: novoExIntervalo || '60s',
        carga_prescrita: novoExCarga || '',
        observacao: novoExObs || '',
        ordem: exerciciosSemana.length + 1,
      })

      // Reset
      setNovoExNome('')
      setNovoExCarga('')
      setNovoExObs('')
    } finally {
      setAdicionando(false)
    }
  }

  const handleRegistrarCarga = async (exercicioId: string) => {
    if (typeof novaCargaKg !== 'number' || isNaN(novaCargaKg)) return
    try {
      setSalvandoCarga(true)
      await onAdicionarCarga(
        exercicioId,
        novaCargaKg,
        new Date(novaCargaData).toISOString(),
        novaCargaReps,
      )
      setNovaCargaKg('')
      setNovaCargaReps('')
    } finally {
      setSalvandoCarga(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Semana / Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-orange-600 text-white font-bold text-xs">
            {rotuloPeriodo}
          </span>
          <span className="text-xs font-bold text-gray-800">
            Exercícios e Prescrição ({exerciciosSemana.length})
          </span>
        </div>

        {/* Metas ativas nesta semana */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-gray-400">Metas ativas:</span>
          {metasDaSemana.length === 0 ? (
            <span className="text-[11px] text-gray-400 italic">Nenhuma meta associada</span>
          ) : (
            metasDaSemana.map((m) => (
              <span
                key={m.id}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E9E1D2] text-[#8C6527] shadow-2xs"
              >
                {m.ordem}º {m.titulo}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Lista de Exercícios Cadastrados */}
      {exerciciosSemana.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white border border-dashed border-gray-200 text-center text-xs text-gray-400 space-y-1">
          <Dumbbell className="h-6 w-6 text-gray-300 mx-auto" />
          <p className="font-semibold text-gray-600">
            Nenhum exercício montado para {rotuloPeriodo}.
          </p>
          <p className="text-gray-400">
            Utilize o formulário abaixo para adicionar exercícios com séries, reps ou segundos,
            intervalo e carga.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exerciciosSemana.map((ex) => {
            const metaRelacionada = metasDaSemana.find((m) => m.id === ex.meta_id)
            const cargas = registrosCarga[ex.id] || []
            const aberto = exercicioCargaAberto === ex.id

            return (
              <div
                key={ex.id}
                className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-3 hover:border-[#C9A46A]/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527] font-bold text-xs shrink-0">
                      <Dumbbell className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{ex.nome}</h4>
                      {metaRelacionada && (
                        <span className="text-[10px] font-bold text-[#8C6527] block">
                          Objetivo: {metaRelacionada.ordem}º {metaRelacionada.titulo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExercicioCargaAberto(aberto ? null : ex.id)}
                      className={`h-7 px-2.5 text-[11px] font-bold rounded-lg border flex items-center gap-1 ${
                        cargas.length > 0
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      Cargas ({cargas.length})
                      {aberto ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onExcluirExercicio(ex.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Métricas Prescritas do Exercício */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-gray-100">
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">
                      Séries
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {ex.series || '—'} séries
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">
                      {ex.tipo_repeticao === 'segundos' ? 'Duração (tempo)' : 'Repetições'}
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {ex.quantidade || '—'}{' '}
                      {ex.tipo_repeticao === 'segundos' ? 'segundos' : 'reps'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">
                      Intervalo
                    </span>
                    <span className="font-bold text-gray-800 text-sm">{ex.intervalo || '—'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/80">
                    <span className="text-[10px] font-bold text-[#8C6527] uppercase block">
                      Carga Prescrita / Atual
                    </span>
                    <span className="font-bold text-amber-950 text-sm">
                      {ex.carga_atual_kg !== undefined && ex.carga_atual_kg !== null
                        ? `${ex.carga_atual_kg} kg`
                        : ex.carga_prescrita || 'Livre / Peso do corpo'}
                    </span>
                  </div>
                </div>

                {ex.observacao && (
                  <p className="text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                    <strong>Obs/Pedido Específico:</strong> {ex.observacao}
                  </p>
                )}

                {/* Painel Expandido: Curva de Carga & Registro */}
                {aberto && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-white border border-[#E9E1D2] space-y-4 animate-in fade-in duration-150">
                    {/* Gráfico da Curva */}
                    <CurvaCargaGrafico registros={cargas} nomeExercicio={ex.nome} />

                    {/* Formulário Rápido de Registro de Nova Carga */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2 text-xs">
                      <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase">
                        <TrendingUp className="h-3.5 w-3.5 text-[#8C6527]" />
                        Adicionar Registro de Carga Realizada
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                        <div>
                          <Label className="text-[10px] text-gray-500 font-semibold">
                            Carga (kg)
                          </Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={novaCargaKg}
                            onChange={(e) =>
                              setNovaCargaKg(
                                e.target.value === '' ? '' : parseFloat(e.target.value),
                              )
                            }
                            placeholder="Ex: 40"
                            className="h-8 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 font-semibold">Data</Label>
                          <Input
                            type="date"
                            value={novaCargaData}
                            onChange={(e) => setNovaCargaData(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 font-semibold">
                            Reps feitas (opcional)
                          </Label>
                          <Input
                            value={novaCargaReps}
                            onChange={(e) => setNovaCargaReps(e.target.value)}
                            placeholder="Ex: 10, 10, 8"
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          disabled={salvandoCarga || typeof novaCargaKg !== 'number'}
                          onClick={() => handleRegistrarCarga(ex.id)}
                          className="h-8 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-bold text-xs rounded-xl shadow-2xs"
                        >
                          Salvar Carga
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Formulário: Adicionar Novo Exercício à Semana */}
      <form
        onSubmit={handleCriarExercicio}
        className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-[#8C6527] uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar Exercício a {rotuloPeriodo}
          </Label>
          <span className="text-[10px] text-gray-400">Preencha os parâmetros prescritos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
          {/* Nome do exercício */}
          <div className="sm:col-span-4">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">
              Nome do Exercício *
            </Label>
            <Input
              required
              value={novoExNome}
              onChange={(e) => setNovoExNome(e.target.value)}
              placeholder="Ex: Agachamento Búlgaro, Prancha McGill..."
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Objetivo/Meta Vinculada */}
          <div className="sm:col-span-3">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">Objetivo / Meta</Label>
            <select
              value={novoExMetaId}
              onChange={(e) => setNovoExMetaId(e.target.value)}
              className="h-8 w-full text-xs font-semibold rounded-xl border border-gray-200 bg-white px-2 mt-0.5"
            >
              <option value="">Selecione a meta...</option>
              {metasDaSemana.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.ordem}º {m.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* Séries */}
          <div className="sm:col-span-2">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">Séries</Label>
            <Input
              type="number"
              min="1"
              value={novoExSeries}
              onChange={(e) =>
                setNovoExSeries(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Alternância Reps / Segundos */}
          <div className="sm:col-span-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                {novoExTipo === 'reps' ? 'Repetições' : 'Tempo (seg)'}
              </Label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNovoExTipo('reps')}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    novoExTipo === 'reps'
                      ? 'bg-[#C9A46A] text-[#33221C]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Reps
                </button>
                <button
                  type="button"
                  onClick={() => setNovoExTipo('segundos')}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    novoExTipo === 'segundos'
                      ? 'bg-[#C9A46A] text-[#33221C]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Segundos
                </button>
              </div>
            </div>
            <Input
              value={novoExQtd}
              onChange={(e) => setNovoExQtd(e.target.value)}
              placeholder={novoExTipo === 'reps' ? 'Ex: 10-12' : 'Ex: 45'}
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Intervalo */}
          <div className="sm:col-span-3">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">
              Intervalo (Descanso)
            </Label>
            <Input
              value={novoExIntervalo}
              onChange={(e) => setNovoExIntervalo(e.target.value)}
              placeholder="Ex: 60s, 90s, 2 min"
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Carga Prescrita */}
          <div className="sm:col-span-4">
            <Label className="text-[10px] text-[#8C6527] font-bold uppercase">
              Mensuração de Carga (kg)
            </Label>
            <Input
              value={novoExCarga}
              onChange={(e) => setNovoExCarga(e.target.value)}
              placeholder="Ex: 20kg halter, peso corporal..."
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Observações / Descrição */}
          <div className="sm:col-span-5">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">
              Observações / Pedido Específico
            </Label>
            <Input
              value={novoExObs}
              onChange={(e) => setNovoExObs(e.target.value)}
              placeholder="Ex: Cadência 3010, foco em estabilização de pelve..."
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={adicionando || !novoExNome.trim()}
            className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs h-8 px-4 rounded-xl shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {adicionando ? 'Salvando...' : 'Adicionar Exercício'}
          </Button>
        </div>
      </form>
    </div>
  )
}
