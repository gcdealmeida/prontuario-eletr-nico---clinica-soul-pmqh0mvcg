import React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Activity, AlertTriangle, CheckCircle2, Sparkles, HelpCircle, XCircle } from 'lucide-react'
import { FMS_TESTES_LISTA, calcularFMS } from '@/lib/personalPhysicalTest'

interface Etapa7PersonalFmsProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa7PersonalFms: React.FC<Etapa7PersonalFmsProps> = ({ formData, onChange }) => {
  const fmsDados = formData.fms_dados || {}
  const itens = fmsDados.itens || {}
  const estrategia = fmsDados.estrategia_treino ?? ''

  // Cálculos automáticos do FMS
  const fmsCalc = calcularFMS(itens)

  const handleUpdateScore = (key: string, score: number) => {
    const updatedItens = { ...itens, [key]: score }
    const updatedCalc = calcularFMS(updatedItens)

    onChange('fms_dados', {
      ...fmsDados,
      itens: updatedItens,
      score_total: updatedCalc.scoreTotal,
      assimetrias_total: updatedCalc.assimetrias,
      classificacao_risco: updatedCalc.classificacaoRisco,
    })
  }

  const handleToggleClearDor = (key: string) => {
    const current = Boolean(itens[`${key}_clear_dor`])
    const updatedItens = { ...itens, [`${key}_clear_dor`]: !current }
    const updatedCalc = calcularFMS(updatedItens)

    onChange('fms_dados', {
      ...fmsDados,
      itens: updatedItens,
      score_total: updatedCalc.scoreTotal,
      assimetrias_total: updatedCalc.assimetrias,
      classificacao_risco: updatedCalc.classificacaoRisco,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              7. FMS — Functional Movement Screen (Avaliação de Movimento Funcional)
            </h4>
            <p className="text-xs text-gray-500">
              Os 7 testes de padrão motor com clearing tests de dor, marcação de assimetrias e
              pontuação total /21
            </p>
          </div>
        </div>
      </div>

      {/* DASHBOARD FMS: SCORE TOTAL, ASSIMETRIAS E RISCO */}
      <div className="p-6 rounded-3xl bg-[#FAF5EE] border-2 border-[#E9E1D2] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E9E1D2] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8C6527]" />
            <h5 className="font-bold text-gray-900 text-sm sm:text-base">
              Painel de Pontuação do FMS
            </h5>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${fmsCalc.corRisco}`}>
              {fmsCalc.classificacaoRisco}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Score Total */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Pontuação Total FMS
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-[#8C6527] font-mono">
                {fmsCalc.scoreTotal}
              </span>
              <span className="text-sm font-bold text-gray-400">/ 21 pts</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              (&gt; 14: baixo risco de lesão musculoesquelética)
            </span>
          </div>

          {/* Assimetrias Detectadas */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Assimetrias Contralaterais
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-3xl font-black font-mono ${
                  fmsCalc.assimetrias > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {fmsCalc.assimetrias}
              </span>
              <span className="text-xs font-bold text-gray-400">testes com diferença D/E</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              Assimetrias são o maior preditor de lesão no FMS
            </span>
          </div>

          {/* Critérios Resumidos */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs space-y-1 text-[11px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Critérios de Pontuação
            </span>
            <div className="text-gray-700 space-y-0.5 pt-0.5">
              <p>
                <strong>3:</strong> Padrão perfeito sem compensação
              </p>
              <p>
                <strong>2:</strong> Realiza com compensação motora
              </p>
              <p>
                <strong>1:</strong> Não consegue realizar o padrão
              </p>
              <p className="text-red-700">
                <strong>0:</strong> Presença de dor (teste zerado)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OS 7 TESTES DO FMS */}
      <div className="space-y-4">
        {FMS_TESTES_LISTA.map((teste) => {
          const clearDor = Boolean(itens[`${teste.id}_clear_dor`])

          if (teste.bilateral) {
            const notaD = Number(itens[`${teste.id}_d`]) || 0
            const notaE = Number(itens[`${teste.id}_e`]) || 0
            const notaFinal = clearDor ? 0 : Math.min(notaD, notaE)
            const assimetrico = !clearDor && notaD !== notaE

            return (
              <div
                key={teste.id}
                className={`p-5 rounded-3xl border transition-all ${
                  clearDor
                    ? 'bg-red-50/50 border-red-200'
                    : assimetrico
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-white border-[#E9E1D2] shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-gray-900 text-sm sm:text-base">{teste.nome}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Bilateral (D / E)
                      </span>
                      {assimetrico && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Assimetria
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Nota Final do Teste:</span>
                    <span className="text-base font-black font-mono px-3 py-0.5 rounded-xl bg-gray-900 text-white">
                      {notaFinal}
                    </span>
                  </div>
                </div>

                {/* Critérios Resumidos */}
                <div className="py-2.5 text-[11px] text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <p>
                    <strong>Nota 3:</strong> {teste.criterios[3]}
                  </p>
                  <p>
                    <strong>Nota 2:</strong> {teste.criterios[2]}
                  </p>
                  <p>
                    <strong>Nota 1:</strong> {teste.criterios[1]}
                  </p>
                  <p className="text-red-700">
                    <strong>Nota 0:</strong> {teste.criterios[0]}
                  </p>
                </div>

                {/* Seleção de Pontuação Bilateral */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Lado Direito */}
                  <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Lado Direito:</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          disabled={clearDor}
                          onClick={() => handleUpdateScore(`${teste.id}_d`, pt)}
                          className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                            notaD === pt && !clearDor
                              ? 'bg-[#8C6527] text-white shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lado Esquerdo */}
                  <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Lado Esquerdo:</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          disabled={clearDor}
                          onClick={() => handleUpdateScore(`${teste.id}_e`, pt)}
                          className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                            notaE === pt && !clearDor
                              ? 'bg-[#8C6527] text-white shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clearing Test se aplicável */}
                {teste.hasClear && (
                  <div className="mt-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="font-bold text-gray-800 block">
                        Clearing Test (Teste de Limpeza / Provocação de Dor):
                      </span>
                      <span className="text-[11px] text-gray-500">{teste.clearNome}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleClearDor(teste.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        clearDor
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {clearDor ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Positivo (Com Dor = Nota 0)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Negativo (Sem
                          Dor)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // Teste Unilateral (Deep Squat, Trunk Stability)
          const nota = Number(itens[teste.id]) || 0
          const notaFinal = clearDor ? 0 : nota

          return (
            <div
              key={teste.id}
              className={`p-5 rounded-3xl border transition-all ${
                clearDor ? 'bg-red-50/50 border-red-200' : 'bg-white border-[#E9E1D2] shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-gray-900 text-sm sm:text-base">{teste.nome}</h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    Unilateral
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Nota do Teste:</span>
                  <span className="text-base font-black font-mono px-3 py-0.5 rounded-xl bg-gray-900 text-white">
                    {notaFinal}
                  </span>
                </div>
              </div>

              {/* Critérios Resumidos */}
              <div className="py-2.5 text-[11px] text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <p>
                  <strong>Nota 3:</strong> {teste.criterios[3]}
                </p>
                <p>
                  <strong>Nota 2:</strong> {teste.criterios[2]}
                </p>
                <p>
                  <strong>Nota 1:</strong> {teste.criterios[1]}
                </p>
                <p className="text-red-700">
                  <strong>Nota 0:</strong> {teste.criterios[0]}
                </p>
              </div>

              {/* Seleção de Pontuação */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">
                  Selecione a Pontuação Obtida:
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      disabled={clearDor}
                      onClick={() => handleUpdateScore(teste.id, pt)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                        nota === pt && !clearDor
                          ? 'bg-[#8C6527] text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clearing Test */}
              {teste.hasClear && (
                <div className="mt-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-bold text-gray-800 block">Clearing Test:</span>
                    <span className="text-[11px] text-gray-500">{teste.clearNome}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleClearDor(teste.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      clearDor
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {clearDor ? (
                      <>
                        <XCircle className="h-3.5 w-3.5" /> Positivo (Com Dor = Nota 0)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Negativo (Sem Dor)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Campo de Estratégia / Conduta de Treino FMS */}
      <div className="space-y-1.5 pt-2">
        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Estratégia e Conduta de Treinamento com Base no FMS
        </Label>
        <Textarea
          rows={4}
          placeholder="Prioridades corretivas (ex: restaurar simetria em ASLR antes de carregar agachamento pesado, exercícios de mobilidade torácica para ombro, ativação do complexo lombo-pélvico)..."
          value={estrategia}
          onChange={(e) =>
            onChange('fms_dados', { ...fmsDados, estrategia_treino: e.target.value })
          }
          className="rounded-xl border-gray-200 text-xs sm:text-sm"
        />
      </div>
    </div>
  )
}
