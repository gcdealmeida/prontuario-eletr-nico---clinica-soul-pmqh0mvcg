import React from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ProgramaMetaRecord,
  ProgramaSemanaRecord,
  UnidadeDuracaoPrograma,
} from '@/types/database'

interface GradePeriodizacaoProps {
  unidadeDuracao: UnidadeDuracaoPrograma
  totalPeriodos: number
  metas: ProgramaMetaRecord[]
  semanas: ProgramaSemanaRecord[]
  semanaSelecionada: number
  onSelecionarSemana: (indice: number) => void
  onToggleMetaNaSemana: (semanaIndice: number, metaId: string) => void
  onAplicarProximasSemanas: (semanaOrigemIndice: number, quantidadeSemanas: number) => void
}

const CORES_PALETA = [
  { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300', dot: 'bg-blue-500' },
  {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300',
    dot: 'bg-purple-500',
  },
  { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-300', dot: 'bg-cyan-500' },
  {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
  },
]

export const GradePeriodizacao: React.FC<GradePeriodizacaoProps> = ({
  unidadeDuracao,
  totalPeriodos,
  metas,
  semanas,
  semanaSelecionada,
  onSelecionarSemana,
  onToggleMetaNaSemana,
  onAplicarProximasSemanas,
}) => {
  const singular = unidadeDuracao === 'dias' ? 'Dia' : unidadeDuracao === 'meses' ? 'Mês' : 'Semana'
  const plural =
    unidadeDuracao === 'dias' ? 'Dias' : unidadeDuracao === 'meses' ? 'Meses' : 'Semanas'

  // Criar mapa de semana -> array de metas_ids
  const mapaSemanas = new Map<number, string[]>()
  semanas.forEach((s) => {
    mapaSemanas.set(s.indice, Array.isArray(s.metas_ids) ? s.metas_ids : [])
  })

  // Lista de períodos 1..N
  const periodos = Array.from({ length: totalPeriodos }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      {/* 1. VISÃO EM GRADE / TIMELINE DE BARRAS DE COBERTURA */}
      <div className="p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Grade Visual de Periodização ({totalPeriodos} {plural.toLowerCase()})
            </h4>
            <p className="text-[11px] text-gray-500">
              Cobertura e distribuição das metas e objetivos ao longo de cada período
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#8C6527] bg-[#FAF5EE] px-2.5 py-1 rounded-xl border border-[#E9E1D2]">
            {metas.length} objetivos criados
          </span>
        </div>

        {/* Matriz visual: Colunas de Períodos x Linhas de Objetivos */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[620px] space-y-2">
            {/* Linha de cabeçalho: Semanas */}
            <div
              className="grid gap-1.5 items-center"
              style={{ gridTemplateColumns: `200px repeat(${totalPeriodos}, minmax(42px, 1fr))` }}
            >
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Objetivo / Período
              </div>
              {periodos.map((p) => {
                const ativo = p === semanaSelecionada
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onSelecionarSemana(p)}
                    className={`py-1.5 px-1 rounded-xl text-center text-[10px] font-bold transition-all border ${
                      ativo
                        ? 'bg-[#1E2530] text-white border-[#1E2530] shadow-xs'
                        : 'bg-[#FAF7F1] text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p}ª {singular.substring(0, 3)}
                  </button>
                )
              })}
            </div>

            {/* Linhas de Objetivos com barras de cobertura */}
            {metas.map((m, idx) => {
              const cor = CORES_PALETA[idx % CORES_PALETA.length]
              return (
                <div
                  key={m.id}
                  className="grid gap-1.5 items-center py-1 border-t border-gray-100 text-xs"
                  style={{
                    gridTemplateColumns: `200px repeat(${totalPeriodos}, minmax(42px, 1fr))`,
                  }}
                >
                  <div className="flex items-center gap-2 truncate pr-2" title={m.titulo}>
                    <span className={`h-2.5 w-2.5 rounded-full ${cor.dot} shrink-0`} />
                    <span className="font-semibold text-gray-800 truncate text-[11px]">
                      {m.ordem}º {m.titulo}
                    </span>
                  </div>

                  {periodos.map((p) => {
                    const metasNestePeriodo = mapaSemanas.get(p) || []
                    const coberto = metasNestePeriodo.includes(m.id)

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onToggleMetaNaSemana(p, m.id)}
                        title={`Clique para ${coberto ? 'remover' : 'adicionar'} da ${p}ª ${singular}`}
                        className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                          coberto
                            ? `${cor.bg} ${cor.border} border shadow-2xs font-bold text-[10px]`
                            : 'bg-gray-50/60 border border-transparent hover:bg-gray-100 text-transparent hover:text-gray-400'
                        }`}
                      >
                        {coberto ? '✓' : '+'}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. GESTÃO SEMANA A SEMANA (MODELO REAL DO USUÁRIO) */}
      <div className="p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Distribuição Período a Período</span>
            </h4>
            <p className="text-[11px] text-gray-500">
              Selecione quais objetivos atuam em cada semana (igual ao modelo prático de prescrição)
            </p>
          </div>

          {/* Seletor rápido de semana ativa */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Período Selecionado:</span>
            <select
              value={semanaSelecionada}
              onChange={(e) => onSelecionarSemana(parseInt(e.target.value, 10))}
              className="text-xs font-bold rounded-xl border border-gray-300 bg-white px-3 py-1.5 shadow-2xs"
            >
              {periodos.map((p) => (
                <option key={p} value={p}>
                  {p}ª {singular.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modelo de leitura rápida linha a linha (Exatamente como o usuário pediu no briefing) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {periodos.map((p) => {
            const metasAtivasIds = mapaSemanas.get(p) || []
            const metasAtivas = metas.filter((m) => metasAtivasIds.includes(m.id))
            const isSelected = p === semanaSelecionada

            return (
              <div
                key={p}
                onClick={() => onSelecionarSemana(p)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/70 border-[#C9A46A] shadow-xs ring-1 ring-[#C9A46A]'
                    : 'bg-gray-50/70 border-gray-200/90 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold tracking-wider ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#C9A46A] to-[#B88E52] text-[#33221C]'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {p}ª {singular.toUpperCase()}
                  </span>

                  {/* Botão de replicar para as próximas semanas */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAplicarProximasSemanas(p, 3)
                    }}
                    title="Replicar metas desta semana para as próximas 3 semanas"
                    className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-900 rounded-md"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Replicar +3
                  </Button>
                </div>

                {/* Exibição textual como no exemplo: 1º Objetivo e 2º Objetivo */}
                <div className="mt-2.5 text-xs text-gray-800 min-h-[28px] flex flex-wrap items-center gap-1.5">
                  {metasAtivas.length === 0 ? (
                    <span className="text-gray-400 italic text-[11px]">
                      Nenhum objetivo selecionado
                    </span>
                  ) : (
                    metasAtivas.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-900 font-bold text-[11px] shadow-2xs"
                      >
                        {m.ordem}º Objetivo
                      </span>
                    ))
                  )}
                </div>

                {/* Checklist com toggles para a semana selecionada */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-1.5 animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold text-[#8C6527] uppercase block">
                      Marcar objetivos que atuam na {p}ª {singular}:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {metas.map((m) => {
                        const checked = metasAtivasIds.includes(m.id)
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleMetaNaSemana(p, m.id)
                            }}
                            className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-semibold transition-all border ${
                              checked
                                ? 'bg-white border-[#C9A46A] text-[#8C6527] shadow-2xs font-bold'
                                : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white'
                            }`}
                          >
                            <span
                              className={`h-4 w-4 rounded-md flex items-center justify-center text-[10px] border ${
                                checked
                                  ? 'bg-[#C9A46A] text-[#33221C] border-[#C9A46A]'
                                  : 'border-gray-300'
                              }`}
                            >
                              {checked && '✓'}
                            </span>
                            <span className="truncate">
                              {m.ordem}º {m.titulo}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
