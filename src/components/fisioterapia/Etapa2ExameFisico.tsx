import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { SEGMENTOS_ADM_PADRAO } from '@/lib/fisioterapiaModel'
import type { AdmSegmento } from '@/types/database'
import { Activity, Sparkles, CheckSquare, Square } from 'lucide-react'
import { EstrelaAvaliacaoDor } from '@/components/fisioterapia/EstrelaAvaliacaoDor'

interface Etapa2ExameFisicoProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa2ExameFisico: React.FC<Etapa2ExameFisicoProps> = ({ formData, onChange }) => {
  const segmentos: AdmSegmento[] =
    formData.adm_segmentos && formData.adm_segmentos.length > 0
      ? formData.adm_segmentos
      : SEGMENTOS_ADM_PADRAO

  const handleToggleSegmento = (index: number) => {
    const list = segmentos.map((s, idx) => (idx === index ? { ...s, ativo: !s.ativo } : s))
    onChange('adm_segmentos', list)
  }

  const handleMovimentoChange = (
    segIdx: number,
    movIdx: number,
    lado: 'direito' | 'esquerdo',
    val: string,
  ) => {
    const list = [...segmentos]
    const seg = { ...list[segIdx] }
    const movs = [...seg.movimentos]
    movs[movIdx] = { ...movs[movIdx], [lado]: val }
    seg.movimentos = movs
    list[segIdx] = seg
    onChange('adm_segmentos', list)

    // Sincronizar compatibilidade com campos antigos de ADM (ex: flexão de ombro/joelho)
    if (seg.segmento === 'Ombro' && movs[movIdx].movimento === 'Flexão') {
      onChange('adm_ombro', Number(val) || 0)
    }
    if (seg.segmento === 'Joelho' && movs[movIdx].movimento === 'Flexão') {
      onChange('adm_joelho', Number(val) || 0)
    }
    if (seg.segmento === 'Quadril' && movs[movIdx].movimento === 'Flexão') {
      onChange('adm_quadril', Number(val) || 0)
    }
    if (seg.segmento === 'Coluna Torácica e Lombar' && movs[movIdx].movimento === 'Flexão') {
      onChange('adm_coluna', Number(val) || 0)
    }
  }

  const handleSelectAll = (ativo: boolean) => {
    const list = segmentos.map((s) => ({ ...s, ativo }))
    onChange('adm_segmentos', list)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Inspeção Estática e Dinâmica */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
          <Activity className="h-5 w-5 text-[#8C6527]" />
          <div>
            <h4 className="text-base font-bold text-gray-900">1. Exame Físico</h4>
            <p className="text-xs text-gray-500">
              Assimetrias funcionais e estruturais, curvaturas da coluna, pés, pelve e centro de
              gravidade
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <Label className="text-gray-700 font-semibold">
              Avaliação Postural Geral (Inspeção Estática)
            </Label>
            <Textarea
              rows={3}
              value={formData.postura || ''}
              onChange={(e) => onChange('postura', e.target.value)}
              placeholder="Assimetrias de ombros, cristas ilíacas, báscula pélvica, alinhamento cervical, escápula alada..."
              className="mt-1 rounded-xl text-xs"
            />
          </div>
          <div>
            <Label className="text-gray-700 font-semibold">Palpação e Tecidos Sensibilizados</Label>
            <Textarea
              rows={3}
              value={formData.palpacao || ''}
              onChange={(e) => onChange('palpacao', e.target.value)}
              placeholder="Pontos-gatilho miofasciais, tônus aumentado, espasmos, hiperestesia..."
              className="mt-1 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* ADM Optativa por Segmento */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E9E1D2]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8C6527]" />
              <h4 className="text-base font-bold text-gray-900">
                2. Exame de Amplitude de Movimento (ADM) — OPTATIVO POR SEGMENTO
              </h4>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Nem todo paciente precisa de todos os segmentos. Selecione os segmentos que deseja
              avaliar; os movimentos padrão e campos numéricos aparecerão apenas para os
              selecionados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(true)}
              className="text-xs h-8 rounded-xl"
            >
              <CheckSquare className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Selecionar Todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(false)}
              className="text-xs h-8 rounded-xl"
            >
              <Square className="h-3.5 w-3.5 mr-1 text-gray-400" />
              Desmarcar
            </Button>
          </div>
        </div>

        {/* Caixas de Seleção dos Segmentos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {segmentos.map((seg, idx) => (
            <label
              key={seg.segmento}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                seg.ativo
                  ? 'border-blue-400 bg-blue-50/70 shadow-xs'
                  : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/70'
              }`}
            >
              <Checkbox
                checked={seg.ativo}
                onCheckedChange={() => handleToggleSegmento(idx)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span
                className={`text-xs font-semibold ${seg.ativo ? 'text-blue-900' : 'text-gray-700'}`}
              >
                {seg.segmento}
              </span>
            </label>
          ))}
        </div>

        {/* Tabelas de Movimento dos Segmentos Selecionados */}
        <div className="space-y-6 pt-2">
          {segmentos.filter((s) => s.ativo).length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-500">
                Nenhum segmento corporal selecionado para teste de ADM. Marque acima os segmentos a
                serem avaliados para abrir os movimentos correspondentes.
              </p>
            </div>
          ) : (
            segmentos.map((seg, segIdx) => {
              if (!seg.ativo) return null
              return (
                <div
                  key={seg.segmento}
                  className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <h5 className="font-bold text-sm text-gray-900">ADM — {seg.segmento}</h5>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Unidade de medição: graus (°)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500 uppercase text-[10px]">
                          <th className="text-left py-2 font-bold w-1/2">Movimento Avaliado</th>
                          <th className="text-center py-2 font-bold w-1/4">Lado Direito (°)</th>
                          <th className="text-center py-2 font-bold w-1/4">Lado Esquerdo (°)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {seg.movimentos.map((mov, movIdx) => (
                          <tr key={mov.movimento} className="hover:bg-blue-50/20">
                            <td className="py-2.5 font-medium text-gray-800">{mov.movimento}</td>
                            <td className="py-2.5 px-2">
                              <Input
                                type="number"
                                placeholder="ex: 170"
                                value={mov.direito ?? ''}
                                onChange={(e) =>
                                  handleMovimentoChange(segIdx, movIdx, 'direito', e.target.value)
                                }
                                className="h-8 text-center text-xs rounded-xl"
                              />
                            </td>
                            <td className="py-2.5 px-2">
                              <Input
                                type="number"
                                placeholder="ex: 170"
                                value={mov.esquerdo ?? ''}
                                onChange={(e) =>
                                  handleMovimentoChange(segIdx, movIdx, 'esquerdo', e.target.value)
                                }
                                className="h-8 text-center text-xs rounded-xl"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Estrela da Avaliação da Dor */}
      <EstrelaAvaliacaoDor formData={formData} onChange={onChange} />
    </div>
  )
}
