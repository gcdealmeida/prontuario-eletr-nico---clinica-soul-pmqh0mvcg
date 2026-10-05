import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  BERG_ITENS,
  ELEMENTOS_PALMILHA,
  CIRTOMETRIA_REGIOES_PADRAO,
  SEGMENTOS_GONIOMETRIA_MAP,
} from '@/lib/fisioterapiaModel'
import type { SecoesComplementaresFisio } from '@/types/database'
import {
  Layers,
  Plus,
  Trash2,
  Calendar,
  Footprints,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

interface Etapa5ComplementaresProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa5Complementares: React.FC<Etapa5ComplementaresProps> = ({
  formData,
  onChange,
}) => {
  const comp: SecoesComplementaresFisio = formData.secoes_complementares || {}

  const updateComp = (patch: Partial<SecoesComplementaresFisio>) => {
    onChange('secoes_complementares', { ...comp, ...patch })
  }

  // ----------------------------------------------------
  // 1. BERG BALANCE SCALE
  // ----------------------------------------------------
  const bergItens = comp.berg_itens || {}
  const bergTotal = Object.values(bergItens).reduce((acc, v) => acc + (Number(v) || 0), 0)
  const bergPct = ((bergTotal / 56) * 100).toFixed(1)

  const handleBergItemChange = (id: number, val: number) => {
    const updated = { ...bergItens, [id]: val }
    const total = Object.values(updated).reduce((acc, v) => acc + (Number(v) || 0), 0)
    updateComp({ berg_itens: updated, berg_total: total })
  }

  const handleBergObsChange = (id: number, obs: string) => {
    const prev = comp.berg_observacoes || {}
    updateComp({ berg_observacoes: { ...prev, [id]: obs } })
  }

  // ----------------------------------------------------
  // 2. TIMED UP AND GO (TUG)
  // ----------------------------------------------------
  const tVal1 = parseFloat(comp.tug_valida1?.tempo || '')
  const tVal2 = parseFloat(comp.tug_valida2?.tempo || '')

  const validas = [tVal1, tVal2].filter((t) => !isNaN(t) && t > 0)
  const tugMelhor = validas.length > 0 ? Math.min(...validas) : null
  const tugMedia =
    validas.length > 0
      ? Number((validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(2))
      : null

  const criterio = comp.tug_criterio || 'melhor'
  const resultadoEscolhido = criterio === 'melhor' ? tugMelhor : tugMedia

  // ----------------------------------------------------
  // 3. CIRTOMETRIA - MÚLTIPLAS MEDIDAS (FASES DO TRATAMENTO)
  // ----------------------------------------------------
  // Inicialização com suporte a retrocompatibilidade (se já existia cirtometria_dados)
  const hojeStr = new Date().toISOString().substring(0, 10)
  const cirtometriaFases = comp.cirtometria_fases || [
    {
      id: 'fase-inicial',
      fase: 'Medida Inicial',
      data: hojeStr,
      medidas: comp.cirtometria_dados || {},
      observacoes: '',
    },
  ]

  const addNovaMedidaCirtometria = () => {
    const num = cirtometriaFases.length
    const novaFase = {
      id: `fase-${Date.now()}`,
      fase: num === 1 ? 'Fase 1 (Reavaliação)' : `Fase ${num} (Reavaliação)`,
      data: hojeStr,
      medidas: {},
      observacoes: '',
    }
    const updated = [...cirtometriaFases, novaFase]
    updateComp({
      cirtometria_fases: updated,
      // manter cirtometria_dados sincronizado com a primeira fase para compatibilidade
      cirtometria_dados: updated[0]?.medidas || {},
    })
  }

  const removeFaseCirtometria = (idx: number) => {
    if (cirtometriaFases.length <= 1) return
    const updated = cirtometriaFases.filter((_, i) => i !== idx)
    updateComp({
      cirtometria_fases: updated,
      cirtometria_dados: updated[0]?.medidas || {},
    })
  }

  const handleCirtoFaseMetaChange = (
    idx: number,
    field: 'fase' | 'data' | 'observacoes',
    val: string,
  ) => {
    const updated = [...cirtometriaFases]
    updated[idx] = { ...updated[idx], [field]: val }
    updateComp({ cirtometria_fases: updated })
  }

  const handleCirtoFaseValorChange = (
    idx: number,
    regiao: string,
    lado: 'direito' | 'esquerdo',
    val: string,
  ) => {
    const updated = [...cirtometriaFases]
    const curFase = { ...updated[idx] }
    const curMedidas = { ...(curFase.medidas || {}) }
    curMedidas[regiao] = { ...(curMedidas[regiao] || {}), [lado]: val }
    curFase.medidas = curMedidas
    updated[idx] = curFase
    updateComp({
      cirtometria_fases: updated,
      cirtometria_dados: updated[0]?.medidas || {},
    })
  }

  // ----------------------------------------------------
  // 4. GONIOMETRIA - SELEÇÃO DE SEGMENTO + MOVIMENTO (ESQ / DIR GRAUS)
  // ----------------------------------------------------
  const goniometriaItens = comp.goniometria_avaliacoes || []

  // Se estiver vazio e o usuário tinha goniometria_medicoes antiga, migrar se houver dados
  const segmentosDisponiveis = Object.keys(SEGMENTOS_GONIOMETRIA_MAP)

  const addGoniometriaLinha = () => {
    const defaultSegmento = 'Ombro'
    const defaultMovimento = SEGMENTOS_GONIOMETRIA_MAP[defaultSegmento][0]
    const novoItem = {
      id: `gonio-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data: hojeStr,
      segmento: defaultSegmento,
      movimento: defaultMovimento,
      esquerdo_graus: '',
      direito_graus: '',
      observacoes: '',
    }
    updateComp({ goniometria_avaliacoes: [...goniometriaItens, novoItem] })
  }

  const removeGoniometriaLinha = (id: string) => {
    updateComp({
      goniometria_avaliacoes: goniometriaItens.filter((item) => item.id !== id),
    })
  }

  const updateGoniometriaLinha = (
    id: string,
    field: 'data' | 'segmento' | 'movimento' | 'esquerdo_graus' | 'direito_graus' | 'observacoes',
    val: any,
  ) => {
    const updated = goniometriaItens.map((item) => {
      if (item.id !== id) return item
      if (field === 'segmento') {
        const novosMovs = SEGMENTOS_GONIOMETRIA_MAP[val] || []
        return {
          ...item,
          segmento: val,
          movimento: novosMovs[0] || '',
        }
      }
      return { ...item, [field]: val }
    })
    updateComp({ goniometria_avaliacoes: updated })
  }

  // ----------------------------------------------------
  // 5. PRESCRIÇÃO DE PALMILHA - SUB-FLUXO EM ETAPAS + PRESCRIÇÃO FINAL
  // ----------------------------------------------------
  const [subEtapaPalmilha, setSubEtapaPalmilha] = useState<number>(1)
  const palmAvaliacao = comp.palmilha_avaliacao || {}
  const palmPedido = comp.palmilha_pedido || {}
  const palmElementos = comp.palmilha_elementos || palmPedido.elementos_selecionados || {}

  const updatePalmAvaliacao = (
    patch: Partial<NonNullable<SecoesComplementaresFisio['palmilha_avaliacao']>>,
  ) => {
    updateComp({
      palmilha_avaliacao: { ...palmAvaliacao, ...patch },
    })
  }

  const updatePalmPedido = (
    patch: Partial<NonNullable<SecoesComplementaresFisio['palmilha_pedido']>>,
  ) => {
    const updatedPedido = { ...palmPedido, ...patch }
    // Manter sincronizado com campos legados
    updateComp({
      palmilha_pedido: updatedPedido,
      palmilha_tamanho: updatedPedido.calçado_tamanho || comp.palmilha_tamanho,
      palmilha_obs: updatedPedido.observacoes_laboratorio || comp.palmilha_obs,
      palmilha_elementos: updatedPedido.elementos_selecionados || comp.palmilha_elementos,
    })
  }

  const handlePalmilhaToggle = (id: string) => {
    const nextVal = !palmElementos[id]
    const updatedMap = { ...palmElementos, [id]: nextVal }
    updateComp({
      palmilha_elementos: updatedMap,
      palmilha_pedido: {
        ...palmPedido,
        elementos_selecionados: updatedMap,
      },
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
        <Layers className="h-5 w-5 text-[#8C6527]" />
        <div>
          <h4 className="text-base font-bold text-gray-900">
            Seções Complementares e Avaliações Específicas (Optativas)
          </h4>
          <p className="text-xs text-gray-500">
            Ative nos seletores abaixo as fichas e testes adicionais que deseja incluir nesta
            avaliação.
          </p>
        </div>
      </div>

      {/* 1. BERG BALANCE SCALE */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.berg_ativo}
              onCheckedChange={(val) => updateComp({ berg_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Berg Balance Scale (Escala de Equilíbrio de Berg)
              </span>
              <span className="text-[11px] text-gray-500">
                13 itens avaliados de 0 a 4 (Pontuação Total 0 a 56)
              </span>
            </div>
          </div>

          {comp.berg_ativo && (
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Escore Total</span>
              <span className="font-mono text-base font-black text-[#8C6527]">
                {bergTotal} / 56 ({bergPct}%)
              </span>
            </div>
          )}
        </div>

        {comp.berg_ativo && (
          <div className="space-y-3 pt-2">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3 text-left w-12 font-bold">#</th>
                    <th className="py-2 px-3 text-left font-bold w-1/3">Descrição do Teste</th>
                    <th className="py-2 px-3 text-left font-bold w-1/4">Instrução ao Paciente</th>
                    <th className="py-2 px-2 text-center font-bold w-24">Pontos (0-4)</th>
                    <th className="py-2 px-3 text-left font-bold">Observações Clínicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {BERG_ITENS.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 font-mono text-gray-400">{item.id}</td>
                      <td className="py-2 px-3 font-semibold text-gray-800">{item.desc}</td>
                      <td className="py-2 px-3 text-gray-500">{item.instrucao}</td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={bergItens[item.id] ?? 4}
                          onChange={(e) => handleBergItemChange(item.id, Number(e.target.value))}
                          className="h-8 w-16 text-center text-xs font-bold rounded-xl border border-gray-200 bg-white"
                        >
                          {[0, 1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          placeholder="Observação..."
                          value={comp.berg_observacoes?.[item.id] || ''}
                          onChange={(e) => handleBergObsChange(item.id, e.target.value)}
                          className="h-7 text-xs rounded-lg"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. TIMED UP AND GO (TUG) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.tug_ativo}
              onCheckedChange={(val) => updateComp({ tug_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Timed Up and Go (TUG) — Ficha de Aplicação
              </span>
              <span className="text-[11px] text-gray-500">
                1 tentativa de familiarização + 2 tentativas válidas (tempo e flags biomecânicos)
              </span>
            </div>
          </div>

          {comp.tug_ativo && resultadoEscolhido !== null && (
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Tempo Escolhido</span>
              <span className="font-mono text-base font-black text-blue-700">
                {resultadoEscolhido} s ({criterio === 'melhor' ? 'Melhor' : 'Média'})
              </span>
            </div>
          )}
        </div>

        {comp.tug_ativo && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-bold">Tentativa</th>
                    <th className="py-2.5 px-2 text-center font-bold">Tempo (s)</th>
                    <th className="py-2.5 px-2 text-center font-bold">Usou Braços?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Instabilidade Giro?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Passos Curtos?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Desvio?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Hesitação?</th>
                    <th className="py-2.5 px-3 text-left font-bold">Apoio / Obs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Familiarização */}
                  <tr>
                    <td className="py-2 px-3 font-semibold text-gray-700">Familiarização</td>
                    <td className="py-2 px-2 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="s"
                        value={comp.tug_familiarizacao?.tempo || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              tempo: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-20 text-center text-xs rounded-xl mx-auto"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.bracos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              bracos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.giro}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              giro: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.passos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              passos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.desvio}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              desvio: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.freezing}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              freezing: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="Apoio necessário, observações..."
                        value={comp.tug_familiarizacao?.obs || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              obs: e.target.value,
                            },
                          })
                        }
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                  </tr>

                  {/* Válida 1 */}
                  <tr>
                    <td className="py-2 px-3 font-semibold text-gray-900">Válida 1</td>
                    <td className="py-2 px-2 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="s"
                        value={comp.tug_valida1?.tempo || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              tempo: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-20 text-center text-xs rounded-xl mx-auto font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.bracos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              bracos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.giro}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              giro: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.passos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              passos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.desvio}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              desvio: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.freezing}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              freezing: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="Observações da tentativa 1..."
                        value={comp.tug_valida1?.obs || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              obs: e.target.value,
                            },
                          })
                        }
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                  </tr>

                  {/* Válida 2 */}
                  <tr>
                    <td className="py-2 px-3 font-semibold text-gray-900">Válida 2</td>
                    <td className="py-2 px-2 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="s"
                        value={comp.tug_valida2?.tempo || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              tempo: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-20 text-center text-xs rounded-xl mx-auto font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.bracos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              bracos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.giro}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              giro: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.passos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              passos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.desvio}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              desvio: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.freezing}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              freezing: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="Observações da tentativa 2..."
                        value={comp.tug_valida2?.obs || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              obs: e.target.value,
                            },
                          })
                        }
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Critério de Escolha e Resultados Calculados */}
            <div className="p-4 bg-gray-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700">Critério de resultado padrão:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tug_criterio"
                    checked={criterio === 'melhor'}
                    onChange={() => updateComp({ tug_criterio: 'melhor' })}
                  />
                  <span>Melhor tempo ({tugMelhor ? `${tugMelhor}s` : '—'})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tug_criterio"
                    checked={criterio === 'media'}
                    onChange={() => updateComp({ tug_criterio: 'media' })}
                  />
                  <span>Média das válidas ({tugMedia ? `${tugMedia}s` : '—'})</span>
                </label>
              </div>

              <div className="text-gray-500 text-[11px]">
                Referência: &lt; 10s normal / 10–20s risco moderado / &gt; 20s risco elevado de
                queda
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CIRTOMETRIA / PERIMETRIA COM FASES DO TRATAMENTO (REAVALIAÇÃO COMPARATIVA) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.cirtometria_ativo}
              onCheckedChange={(val) => updateComp({ cirtometria_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Cirtometria / Perimetria de Membros Inferiores (Evolução por Fases)
              </span>
              <span className="text-[11px] text-gray-500">
                Adicione novas medições a cada fase do tratamento para análise comparativa
              </span>
            </div>
          </div>

          {comp.cirtometria_ativo && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addNovaMedidaCirtometria}
              className="text-xs h-8 rounded-xl border-[#C9A46A] text-[#8C6527] hover:bg-[#FAF4EA] font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Nova Medida
            </Button>
          )}
        </div>

        {comp.cirtometria_ativo && (
          <div className="space-y-6 pt-2">
            {cirtometriaFases.map((fase, fIdx) => (
              <div
                key={fase.id || fIdx}
                className="rounded-2xl border border-gray-200 p-4 space-y-3 bg-gray-50/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#8C6527] text-white font-bold text-xs">
                      #{fIdx + 1}
                    </span>
                    <Input
                      value={fase.fase}
                      onChange={(e) => handleCirtoFaseMetaChange(fIdx, 'fase', e.target.value)}
                      placeholder="Ex: Medida Inicial / Fase 1..."
                      className="h-8 text-xs font-bold w-48 rounded-xl bg-white"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <Input
                        type="date"
                        value={fase.data || hojeStr}
                        onChange={(e) => handleCirtoFaseMetaChange(fIdx, 'data', e.target.value)}
                        className="h-8 text-xs w-36 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  {cirtometriaFases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFaseCirtometria(fIdx)}
                      className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:self-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remover Medida
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-3 text-left font-bold w-1/2">Região Avaliada</th>
                        <th className="py-2 px-2 text-center font-bold w-1/4">Lado Direito (cm)</th>
                        <th className="py-2 px-2 text-center font-bold w-1/4">
                          Lado Esquerdo (cm)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {CIRTOMETRIA_REGIOES_PADRAO.map((reg) => (
                        <tr key={reg} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-semibold text-gray-800">{reg}</td>
                          <td className="py-2 px-2 text-center">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="cm"
                              value={fase.medidas?.[reg]?.direito || ''}
                              onChange={(e) =>
                                handleCirtoFaseValorChange(fIdx, reg, 'direito', e.target.value)
                              }
                              className="h-8 w-24 text-center text-xs rounded-xl mx-auto"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="cm"
                              value={fase.medidas?.[reg]?.esquerdo || ''}
                              onChange={(e) =>
                                handleCirtoFaseValorChange(fIdx, reg, 'esquerdo', e.target.value)
                              }
                              className="h-8 w-24 text-center text-xs rounded-xl mx-auto"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Input
                  placeholder="Observações desta fase (ex: após drenagem linfática, ganho de trofismo pós 4 semanas)..."
                  value={fase.observacoes || ''}
                  onChange={(e) => handleCirtoFaseMetaChange(fIdx, 'observacoes', e.target.value)}
                  className="h-8 text-xs rounded-xl bg-white"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. GONIOMETRIA POR SEGMENTO + MOVIMENTO (ESQ / DIR GRAUS) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.goniometria_ativo}
              onCheckedChange={(val) => {
                updateComp({ goniometria_ativo: val })
                if (val && goniometriaItens.length === 0) {
                  addGoniometriaLinha()
                }
              }}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Goniometria Articular (Segmento + Movimento)
              </span>
              <span className="text-[11px] text-gray-500">
                Selecione o segmento e o movimento avaliado, registrando os graus dos lados esquerdo
                e direito
              </span>
            </div>
          </div>

          {comp.goniometria_ativo && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGoniometriaLinha}
              className="text-xs h-8 rounded-xl border-blue-500 text-blue-700 hover:bg-blue-50 font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Movimento
            </Button>
          )}
        </div>

        {comp.goniometria_ativo && (
          <div className="space-y-3 pt-2">
            {goniometriaItens.length === 0 ? (
              <div className="p-4 rounded-2xl bg-gray-50 text-center text-xs text-gray-500">
                Nenhum movimento adicionado ainda. Clique em "Adicionar Movimento" para iniciar a
                avaliação.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-bold w-28">Data</th>
                      <th className="py-2.5 px-2 text-left font-bold w-36">Segmento</th>
                      <th className="py-2.5 px-2 text-left font-bold w-44">Movimento</th>
                      <th className="py-2.5 px-2 text-center font-bold w-24">Lado E (°)</th>
                      <th className="py-2.5 px-2 text-center font-bold w-24">Lado D (°)</th>
                      <th className="py-2.5 px-3 text-left font-bold">Observações</th>
                      <th className="py-2.5 px-2 text-center font-bold w-12">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {goniometriaItens.map((item) => {
                      const movimentosSegmento = SEGMENTOS_GONIOMETRIA_MAP[item.segmento] || []
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3">
                            <Input
                              type="date"
                              value={item.data || hojeStr}
                              onChange={(e) =>
                                updateGoniometriaLinha(item.id, 'data', e.target.value)
                              }
                              className="h-8 text-xs rounded-xl"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.segmento}
                              onChange={(e) =>
                                updateGoniometriaLinha(item.id, 'segmento', e.target.value)
                              }
                              className="h-8 w-full text-xs rounded-xl border border-gray-200 bg-white font-semibold text-gray-800 px-2"
                            >
                              {segmentosDisponiveis.map((seg) => (
                                <option key={seg} value={seg}>
                                  {seg}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.movimento}
                              onChange={(e) =>
                                updateGoniometriaLinha(item.id, 'movimento', e.target.value)
                              }
                              className="h-8 w-full text-xs rounded-xl border border-gray-200 bg-white font-medium text-gray-800 px-2"
                            >
                              {movimentosSegmento.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Input
                              type="number"
                              placeholder="°"
                              value={item.esquerdo_graus ?? ''}
                              onChange={(e) =>
                                updateGoniometriaLinha(item.id, 'esquerdo_graus', e.target.value)
                              }
                              className="h-8 w-20 text-center text-xs font-mono font-bold rounded-xl mx-auto"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Input
                              type="number"
                              placeholder="°"
                              value={item.direito_graus ?? ''}
                              onChange={(e) =>
                                updateGoniometriaLinha(item.id, 'direito_graus', e.target.value)
                              }
                              className="h-8 w-20 text-center text-xs font-mono font-bold rounded-xl mx-auto"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              placeholder="Dor em fim de arco, compensação..."
                              value={item.observacoes || ''}
                              onChange={(e) =>
                                updateGoniometriaLinha(item.id, 'observacoes', e.target.value)
                              }
                              className="h-8 text-xs rounded-xl"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGoniometriaLinha(item.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. PRESCRIÇÃO DE PALMILHA - AVALIAÇÃO EM ETAPAS + PRESCRIÇÃO FINAL */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.palmilha_ativo}
              onCheckedChange={(val) => updateComp({ palmilha_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block flex items-center gap-1.5">
                <Footprints className="h-4 w-4 text-[#8C6527]" />
                Avaliação Específica Podopostural & Prescrição de Palmilha
              </span>
              <span className="text-[11px] text-gray-500">
                Passo a passo podopostural: Postura Estática, Testes Biomecânicos, Cadeia Ascendente
                e Pedido da Palmilha
              </span>
            </div>
          </div>

          {comp.palmilha_ativo && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={subEtapaPalmilha === 4 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSubEtapaPalmilha(4)}
                className={`text-xs h-8 rounded-xl font-bold ${
                  subEtapaPalmilha === 4
                    ? 'bg-[#8C6527] text-white hover:bg-[#73521E]'
                    : 'border-[#C9A46A] text-[#8C6527] hover:bg-[#FAF4EA]'
                }`}
              >
                <FileCheck className="h-3.5 w-3.5 mr-1" />
                Prescrição / Pedido
              </Button>
            </div>
          )}
        </div>

        {comp.palmilha_ativo && (
          <div className="space-y-6 pt-1 text-xs">
            {/* Navegador de Sub-Etapas da Palmilha */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 1, label: '1. Postura Podal Estática' },
                { id: 2, label: '2. Testes Biomecânicos' },
                { id: 3, label: '3. Cadeia Ascendente & Pisada' },
                { id: 4, label: '4. Prescrição & Pedido' },
              ].map((etp) => (
                <button
                  key={etp.id}
                  type="button"
                  onClick={() => setSubEtapaPalmilha(etp.id)}
                  className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all text-center border ${
                    subEtapaPalmilha === etp.id
                      ? 'bg-[#1E2530] text-white border-[#1E2530] shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {etp.label}
                </button>
              ))}
            </div>

            {/* SUB-ETAPA 1: POSTURA PODAL ESTÁTICA E ALINHAMENTO */}
            {subEtapaPalmilha === 1 && (
              <div className="space-y-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-200 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h5 className="font-bold text-sm text-gray-900">
                    Etapa 1: Postura Podal Estática e Alinhamento Ascendente
                  </h5>
                  <span className="text-[11px] text-gray-500">Conforme Modelo Clínico ZERO</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Antepé */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Postura do Antepé</Label>
                    <select
                      value={palmAvaliacao.postura_antepe || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ postura_antepe: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Valgo">Valgo de Antepé</option>
                      <option value="Varo">Varo de Antepé</option>
                      <option value="Neutro / Alinhado">Neutro / Alinhado</option>
                    </select>
                  </div>

                  {/* Retropé / Tornozelo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Retropé / Tornozelo
                    </Label>
                    <select
                      value={palmAvaliacao.postura_retrope || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ postura_retrope: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Valgo">Valgo de Calcâneo (Pronação)</option>
                      <option value="Varo">Varo de Calcâneo (Supinação)</option>
                      <option value="Neutro / Alinhado">Neutro / Alinhado</option>
                    </select>
                  </div>

                  {/* Joelhos */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Postura dos Joelhos
                    </Label>
                    <select
                      value={palmAvaliacao.postura_joelho || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ postura_joelho: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Valgo">Genu Valgo</option>
                      <option value="Varo">Genu Varo</option>
                      <option value="Neutro / Alinhado">Neutro / Alinhado</option>
                    </select>
                  </div>

                  {/* Rotação Quadril */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Rotação de Quadril
                    </Label>
                    <select
                      value={palmAvaliacao.postura_quadril || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ postura_quadril: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Rotação Interna">Rotação Interna</option>
                      <option value="Rotação Externa">Rotação Externa</option>
                      <option value="Neutro">Neutro / Simétrico</option>
                    </select>
                  </div>

                  {/* Altura Crista Ilíaca */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Altura de Crista Ilíaca
                    </Label>
                    <select
                      value={palmAvaliacao.altura_crista_iliaca || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ altura_crista_iliaca: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Simétrica">Simétrica</option>
                      <option value="Direita Mais Alta">Direita Mais Alta</option>
                      <option value="Esquerda Mais Alta">Esquerda Mais Alta</option>
                    </select>
                  </div>

                  {/* Altura de Ombros */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Altura dos Ombros</Label>
                    <select
                      value={palmAvaliacao.altura_ombro || ''}
                      onChange={(e) => updatePalmAvaliacao({ altura_ombro: e.target.value as any })}
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Simétrica">Simétrica</option>
                      <option value="Direito Mais Alto">Direito Mais Alto</option>
                      <option value="Esquerdo Mais Alto">Esquerdo Mais Alto</option>
                    </select>
                  </div>

                  {/* Inclinação de Cabeça */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Inclinação de Cabeça
                    </Label>
                    <select
                      value={palmAvaliacao.inclinacao_cabeca || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ inclinacao_cabeca: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Simétrica">Simétrica / Neutra</option>
                      <option value="Direita">Inclinada à Direita</option>
                      <option value="Esquerda">Inclinada à Esquerda</option>
                    </select>
                  </div>

                  {/* Plano Sagital / Postural */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-gray-700">
                      Plano Postural Vista Lateral (Sagital)
                    </Label>
                    <select
                      value={palmAvaliacao.plano_sagital || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ plano_sagital: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium"
                    >
                      <option value="">Não avaliado / Selecionar...</option>
                      <option value="Neutro">Neutro / Alinhado</option>
                      <option value="Anteriorizado">Anteriorizado (Projeção Anterior)</option>
                      <option value="Posteriorizado">Posteriorizado (Retropulsão de Tronco)</option>
                      <option value="Retificado">Retificado (Perda de Curvaturas)</option>
                      <option value="Hiperlordose / Aumento de Curvas">
                        Aumento de Curvas / Hiperlordose
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSubEtapaPalmilha(2)}
                    className="bg-[#1E2530] text-white rounded-xl text-xs h-8 px-4 flex items-center gap-1"
                  >
                    Próximo: Testes Biomecânicos <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* SUB-ETAPA 2: TESTES BIOMECÂNICOS PODAIS */}
            {subEtapaPalmilha === 2 && (
              <div className="space-y-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-200 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h5 className="font-bold text-sm text-gray-900">
                    Etapa 2: Testes Biomecânicos Podais e Mecanismo de Windlass
                  </h5>
                  <span className="text-[11px] text-gray-500">
                    Avaliação do arco medial e apoios
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Jack Test D */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Jack Test (Extensão do Hálux) - Direito
                    </Label>
                    <select
                      value={palmAvaliacao.jack_test_direito || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ jack_test_direito: e.target.value as any })
                      }
                      className="h-8 w-full rounded-lg border border-gray-200 text-xs px-2"
                    >
                      <option value="">Selecionar...</option>
                      <option value="POSITIVO">POSITIVO (Arco NÃO se forma)</option>
                      <option value="NEGATIVO">NEGATIVO (Arco se forma normalmente)</option>
                    </select>
                  </div>

                  {/* Jack Test E */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Jack Test (Extensão do Hálux) - Esquerdo
                    </Label>
                    <select
                      value={palmAvaliacao.jack_test_esquerdo || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ jack_test_esquerdo: e.target.value as any })
                      }
                      className="h-8 w-full rounded-lg border border-gray-200 text-xs px-2"
                    >
                      <option value="">Selecionar...</option>
                      <option value="POSITIVO">POSITIVO (Arco NÃO se forma)</option>
                      <option value="NEGATIVO">NEGATIVO (Arco se forma normalmente)</option>
                    </select>
                  </div>

                  {/* Hubscher Modificado */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Teste de Hubscher Modificado
                    </Label>
                    <select
                      value={palmAvaliacao.hubscher_modificado || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ hubscher_modificado: e.target.value as any })
                      }
                      className="h-8 w-full rounded-lg border border-gray-200 text-xs px-2"
                    >
                      <option value="">Selecionar...</option>
                      <option value="Funcional (melhora sem carga)">
                        Funcional (melhora o arco sem carga)
                      </option>
                      <option value="Estrutural (sem melhora)">
                        Estrutural (arco rígido / sem melhora)
                      </option>
                      <option value="Normal">Normal</option>
                    </select>
                  </div>

                  {/* Drop do Navicular D/E */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Drop do Navicular (mm)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Direito</span>
                        <Input
                          type="number"
                          placeholder="mm"
                          value={palmAvaliacao.drop_navicular_mm_direito || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({ drop_navicular_mm_direito: e.target.value })
                          }
                          className="h-8 text-xs text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Esquerdo</span>
                        <Input
                          type="number"
                          placeholder="mm"
                          value={palmAvaliacao.drop_navicular_mm_esquerdo || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({ drop_navicular_mm_esquerdo: e.target.value })
                          }
                          className="h-8 text-xs text-center font-mono font-bold"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 block pt-0.5">
                      &gt; 10 mm indica hiperpronação
                    </span>
                  </div>

                  {/* Core Podal */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Teste do Core Podal (30s)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Direito</span>
                        <select
                          value={palmAvaliacao.core_podal_direito || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({ core_podal_direito: e.target.value as any })
                          }
                          className="h-8 w-full rounded-lg border border-gray-200 text-xs px-1 text-center"
                        >
                          <option value="">—</option>
                          <option value="NORMAL">NORMAL</option>
                          <option value="ALTERADO">ALTERADO</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Esquerdo</span>
                        <select
                          value={palmAvaliacao.core_podal_esquerdo || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({ core_podal_esquerdo: e.target.value as any })
                          }
                          className="h-8 w-full rounded-lg border border-gray-200 text-xs px-1 text-center"
                        >
                          <option value="">—</option>
                          <option value="NORMAL">NORMAL</option>
                          <option value="ALTERADO">ALTERADO</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Mobilidade do 1º Raio */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Mobilidade da 1ª Cabeça Metatarsal
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Direito</span>
                        <select
                          value={palmAvaliacao.mobilidade_1_raio_direito || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({
                              mobilidade_1_raio_direito: e.target.value as any,
                            })
                          }
                          className="h-8 w-full rounded-lg border border-gray-200 text-xs px-1"
                        >
                          <option value="">—</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIPOMÓVEL">Hipomóvel</option>
                          <option value="HIPERMÓVEL">Hipermóvel</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Esquerdo</span>
                        <select
                          value={palmAvaliacao.mobilidade_1_raio_esquerdo || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({
                              mobilidade_1_raio_esquerdo: e.target.value as any,
                            })
                          }
                          className="h-8 w-full rounded-lg border border-gray-200 text-xs px-1"
                        >
                          <option value="">—</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIPOMÓVEL">Hipomóvel</option>
                          <option value="HIPERMÓVEL">Hipermóvel</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Equilíbrio Unipodal */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Equilíbrio Unipodal
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Direito</span>
                        <select
                          value={palmAvaliacao.equilibrio_unipodal_direito || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({
                              equilibrio_unipodal_direito: e.target.value as any,
                            })
                          }
                          className="h-8 w-full rounded-lg border border-gray-200 text-xs px-1 text-center"
                        >
                          <option value="">—</option>
                          <option value="NORMAL">Normal</option>
                          <option value="ALTERADO">Alterado</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Esquerdo</span>
                        <select
                          value={palmAvaliacao.equilibrio_unipodal_esquerdo || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({
                              equilibrio_unipodal_esquerdo: e.target.value as any,
                            })
                          }
                          className="h-8 w-full rounded-lg border border-gray-200 text-xs px-1 text-center"
                        >
                          <option value="">—</option>
                          <option value="NORMAL">Normal</option>
                          <option value="ALTERADO">Alterado</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Lunge Test (Dorsiflexão em cm) */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Lunge Test / Tendão Calcâneo (cm)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Direito (cm)</span>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="cm"
                          value={palmAvaliacao.lunge_test_cm_direito || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({ lunge_test_cm_direito: e.target.value })
                          }
                          className="h-8 text-xs text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Esquerdo (cm)</span>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="cm"
                          value={palmAvaliacao.lunge_test_cm_esquerdo || ''}
                          onChange={(e) =>
                            updatePalmAvaliacao({ lunge_test_cm_esquerdo: e.target.value })
                          }
                          className="h-8 text-xs text-center font-mono font-bold"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 block pt-0.5">
                      Meta: &gt;= 9 a 10 cm da parede
                    </span>
                  </div>

                  {/* Teste Perna Curta */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Teste de Perna Curta / Dismetria
                    </Label>
                    <select
                      value={palmAvaliacao.perna_curta || ''}
                      onChange={(e) => updatePalmAvaliacao({ perna_curta: e.target.value as any })}
                      className="h-8 w-full rounded-lg border border-gray-200 text-xs px-2"
                    >
                      <option value="Nenhuma / Simétrica">Nenhuma / Simétrica</option>
                      <option value="Perna Curta Direita">Perna Curta Direita</option>
                      <option value="Perna Curta Esquerda">Perna Curta Esquerda</option>
                    </select>
                    {palmAvaliacao.perna_curta &&
                      palmAvaliacao.perna_curta !== 'Nenhuma / Simétrica' && (
                        <Input
                          type="number"
                          placeholder="Estimativa em mm (ex: 4)"
                          value={palmAvaliacao.perna_curta_mm || ''}
                          onChange={(e) => updatePalmAvaliacao({ perna_curta_mm: e.target.value })}
                          className="h-7 text-xs mt-1"
                        />
                      )}
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSubEtapaPalmilha(1)}
                    className="rounded-xl text-xs h-8"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Voltar: Postura
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSubEtapaPalmilha(3)}
                    className="bg-[#1E2530] text-white rounded-xl text-xs h-8 px-4 flex items-center gap-1"
                  >
                    Próximo: Cadeia Ascendente <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* SUB-ETAPA 3: TESTES POSTUROLÓGICOS, CADEIA ASCENDENTE & MARCHA */}
            {subEtapaPalmilha === 3 && (
              <div className="space-y-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-200 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h5 className="font-bold text-sm text-gray-900">
                    Etapa 3: Testes Posturológicos, Cadeia Ascendente e Marcha
                  </h5>
                  <span className="text-[11px] text-gray-500">
                    Influência do captor podal no tônus
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Tipo de Pisada */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Tipo de Pisada Predominante
                    </Label>
                    <select
                      value={palmAvaliacao.tipo_pisada || ''}
                      onChange={(e) => updatePalmAvaliacao({ tipo_pisada: e.target.value as any })}
                      className="h-9 w-full rounded-xl border border-gray-200 text-xs px-2 font-bold text-gray-800"
                    >
                      <option value="">Selecionar...</option>
                      <option value="Pronada">Pronada</option>
                      <option value="Hiperpronada">Hiperpronada</option>
                      <option value="Supinada">Supinada</option>
                      <option value="Neutra">Neutra</option>
                    </select>
                  </div>

                  {/* Polegares Ascendentes */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Teste dos Polegares Ascendentes
                    </Label>
                    <select
                      value={palmAvaliacao.polegares_ascendentes || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ polegares_ascendentes: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 text-xs px-2 font-medium"
                    >
                      <option value="">Selecionar...</option>
                      <option value="Simétrico">Simétrico (Tônus Postural Equilibrado)</option>
                      <option value="Assimetria Direita">Assimetria Direita</option>
                      <option value="Assimetria Esquerda">Assimetria Esquerda</option>
                    </select>
                  </div>

                  {/* Posturodinâmico */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Teste Posturodinâmico (Latero-flexão)
                    </Label>
                    <select
                      value={palmAvaliacao.posturodinamico || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({ posturodinamico: e.target.value as any })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 text-xs px-2 font-medium"
                    >
                      <option value="">Selecionar...</option>
                      <option value="Normal">Normal (Rotação Simétrica)</option>
                      <option value="Bloqueio à Direita">
                        Bloqueio / Não anteriorizou à Direita
                      </option>
                      <option value="Bloqueio à Esquerda">
                        Bloqueio / Não anteriorizou à Esquerda
                      </option>
                    </select>
                  </div>

                  {/* Rotação da Cabeça com Estímulo Podal */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-gray-200 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold text-gray-800 block">
                      Rotação da Cabeça com Estímulo Podal / Inibição Podal
                    </Label>
                    <select
                      value={palmAvaliacao.rotacao_cabeca_estimulo_podal || ''}
                      onChange={(e) =>
                        updatePalmAvaliacao({
                          rotacao_cabeca_estimulo_podal: e.target.value as any,
                        })
                      }
                      className="h-9 w-full rounded-xl border border-gray-200 text-xs px-2 font-medium"
                    >
                      <option value="">Selecionar...</option>
                      <option value="Melhora com Estímulo">
                        Melhora com Estímulo Podal (Indicação Positiva de Palmilha)
                      </option>
                      <option value="Sem Alteração">Sem Alteração</option>
                      <option value="Piora">Piora com o Estímulo</option>
                    </select>
                  </div>

                  {/* Análise da Marcha */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold text-gray-700">
                      Análise Visual da Marcha e Apoio
                    </Label>
                    <Input
                      placeholder="Colapso de arco na fase de apoio, ritmo de impulsão pelo hálux, contato do calcâneo..."
                      value={palmAvaliacao.marcha_observacoes || ''}
                      onChange={(e) => updatePalmAvaliacao({ marcha_observacoes: e.target.value })}
                      className="h-9 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSubEtapaPalmilha(2)}
                    className="rounded-xl text-xs h-8"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Voltar: Biomecânicos
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSubEtapaPalmilha(4)}
                    className="bg-[#8C6527] hover:bg-[#73521E] text-white rounded-xl text-xs h-9 px-5 font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <FileCheck className="h-4 w-4" />
                    Ir para Prescrição & Pedido da Palmilha
                    <ArrowRight className="h-4 w-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* SUB-ETAPA 4: PRESCRIÇÃO E DADOS PARA PEDIDO DA PALMILHA */}
            {subEtapaPalmilha === 4 && (
              <div className="space-y-6 p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#8C6527] text-white">
                      <FileCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900">
                        Prescrição Técnica & Pedido da Palmilha
                      </h5>
                      <p className="text-[11px] text-gray-500">
                        Preencha os elementos podoposturais e as especificações técnicas para
                        confecção no laboratório
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold self-start sm:self-auto">
                    Avaliação Concluída
                  </span>
                </div>

                {/* Seleção de Elementos Podoposturológicos */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                    Elementos Podoposturológicos Prescritos:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ELEMENTOS_PALMILHA.map((elem) => {
                      const selecionado = !!palmElementos[elem.id]
                      return (
                        <label
                          key={elem.id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            selecionado
                              ? 'border-[#8C6527] bg-white shadow-xs ring-1 ring-[#8C6527]'
                              : 'border-gray-200 bg-white/70 hover:bg-white'
                          }`}
                        >
                          <Checkbox
                            checked={selecionado}
                            onCheckedChange={() => handlePalmilhaToggle(elem.id)}
                            className="mt-0.5 data-[state=checked]:bg-[#8C6527] data-[state=checked]:border-[#8C6527]"
                          />
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">
                              {elem.nome}
                            </span>
                            <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">
                              {elem.desc}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Especificações Técnicas do Pedido */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                    Especificações Técnicas da Palmilha:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-amber-200">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Modelo da Palmilha
                      </Label>
                      <select
                        value={palmPedido.modelo_palmilha || ''}
                        onChange={(e) =>
                          updatePalmPedido({ modelo_palmilha: e.target.value as any })
                        }
                        className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-2 text-xs font-semibold"
                      >
                        <option value="Postural / Proprioceptiva">Postural / Proprioceptiva</option>
                        <option value="Mecânica / Esportiva">Mecânica / Esportiva</option>
                        <option value="Conforto / Diabético">Conforto / Diabético</option>
                        <option value="Infantil">Infantil</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Tamanho Calçado / Palmilha
                      </Label>
                      <Input
                        placeholder="Ex: 38 / 39"
                        value={palmPedido.calçado_tamanho || comp.palmilha_tamanho || ''}
                        onChange={(e) => updatePalmPedido({ calçado_tamanho: e.target.value })}
                        className="mt-1 h-9 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Densidade do EVA
                      </Label>
                      <select
                        value={palmPedido.densidade_eva || ''}
                        onChange={(e) => updatePalmPedido({ densidade_eva: e.target.value as any })}
                        className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-2 text-xs font-medium"
                      >
                        <option value="">Selecionar...</option>
                        <option value="Macia (25-30 shore)">Macia (25-30 shore)</option>
                        <option value="Média (35-40 shore)">Média (35-40 shore)</option>
                        <option value="Firme (45-50 shore)">Firme (45-50 shore)</option>
                        <option value="Rígida (60+ shore)">Rígida (60+ shore)</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Cobertura Superior
                      </Label>
                      <select
                        value={palmPedido.cobertura_tipo || ''}
                        onChange={(e) =>
                          updatePalmPedido({ cobertura_tipo: e.target.value as any })
                        }
                        className="mt-1 h-9 w-full rounded-xl border border-gray-200 bg-white px-2 text-xs font-medium"
                      >
                        <option value="">Selecionar...</option>
                        <option value="EVA Perfurado">EVA Perfurado</option>
                        <option value="Camurça">Camurça / Microfibra</option>
                        <option value="Couro Sintético">Couro Sintético</option>
                        <option value="Plastazote">Plastazote</option>
                        <option value="Neoprene">Neoprene</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Espessura da Base (mm)
                      </Label>
                      <Input
                        placeholder="Ex: 2mm, 3mm"
                        value={palmPedido.espessura_base_mm || ''}
                        onChange={(e) => updatePalmPedido({ espessura_base_mm: e.target.value })}
                        className="mt-1 h-9 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Compensação de Dismetria
                      </Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <select
                          value={palmPedido.compensacao_dismetria_lado || ''}
                          onChange={(e) =>
                            updatePalmPedido({ compensacao_dismetria_lado: e.target.value as any })
                          }
                          className="h-9 w-full rounded-xl border border-gray-200 bg-white px-1 text-xs"
                        >
                          <option value="Nenhum">Nenhum</option>
                          <option value="Direito">Direito</option>
                          <option value="Esquerdo">Esquerdo</option>
                        </select>
                        <Input
                          type="number"
                          placeholder="mm"
                          value={palmPedido.compensacao_dismetria_mm || ''}
                          onChange={(e) =>
                            updatePalmPedido({ compensacao_dismetria_mm: e.target.value })
                          }
                          className="h-9 rounded-xl text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Laboratório / Fornecedor
                      </Label>
                      <Input
                        placeholder="Nome do laboratório..."
                        value={palmPedido.laboratorio_fornecedor || ''}
                        onChange={(e) =>
                          updatePalmPedido({ laboratorio_fornecedor: e.target.value })
                        }
                        className="mt-1 h-9 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Previsão de Entrega
                      </Label>
                      <Input
                        type="date"
                        value={palmPedido.prazo_previsto || ''}
                        onChange={(e) => updatePalmPedido({ prazo_previsto: e.target.value })}
                        className="mt-1 h-9 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                      <Label className="text-xs font-semibold text-gray-700">
                        Observações Especiais para Confecção
                      </Label>
                      <Input
                        placeholder="Ex: alívio pontual em 1º metatarso, paciente corredora, sapatos sociais estreitos..."
                        value={palmPedido.observacoes_laboratorio || comp.palmilha_obs || ''}
                        onChange={(e) =>
                          updatePalmPedido({ observacoes_laboratorio: e.target.value })
                        }
                        className="mt-1 h-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSubEtapaPalmilha(3)}
                    className="rounded-xl text-xs h-8"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Voltar: Cadeia Ascendente
                  </Button>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Prescrição Pronta para o Prontuário
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
