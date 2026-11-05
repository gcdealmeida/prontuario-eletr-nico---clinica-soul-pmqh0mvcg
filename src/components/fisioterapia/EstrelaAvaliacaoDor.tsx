import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { EstrelaDorItem } from '@/types/database'
import { Star, Plus, Trash2 } from 'lucide-react'

interface EstrelaAvaliacaoDorProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

const ITEM_VAZIO: EstrelaDorItem = {
  segmento: '',
  amplitude_movimento: '',
  qualidade_movimento: '',
}

export const EstrelaAvaliacaoDor: React.FC<EstrelaAvaliacaoDorProps> = ({ formData, onChange }) => {
  const itens: EstrelaDorItem[] =
    formData.estrela_dor && formData.estrela_dor.length > 0 ? formData.estrela_dor : []

  const atualizar = (novaLista: EstrelaDorItem[]) => {
    onChange('estrela_dor', novaLista)
  }

  const handleAdd = () => {
    atualizar([...itens, { ...ITEM_VAZIO }])
  }

  const handleRemove = (idx: number) => {
    atualizar(itens.filter((_, i) => i !== idx))
  }

  const handleFieldChange = (idx: number, campo: keyof EstrelaDorItem, valor: string) => {
    const list = [...itens]
    list[idx] = { ...list[idx], [campo]: valor }
    atualizar(list)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
        <Star className="h-5 w-5 text-[#8C6527]" />
        <div>
          <h4 className="text-base font-bold text-gray-900">3. Estrela da Avaliação da Dor</h4>
          <p className="text-xs text-gray-500">
            Avaliação da dor do segmento avaliado: amplitude e qualidade do movimento observados
          </p>
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-500 mb-3">
            Nenhum segmento registrado na Estrela da Avaliação da Dor ainda.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="text-xs h-8 rounded-xl border-[#8C6527]/40 text-[#8C6527] hover:bg-[#8C6527]/5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar Segmento Avaliado
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {itens.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#E9E1D2] bg-white p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8C6527]" />
                  <h5 className="font-bold text-sm text-gray-900">
                    Estrela da Dor — Registro {idx + 1}
                  </h5>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(idx)}
                  className="text-xs h-8 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remover
                </Button>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold text-xs">
                  Qual Segmento Será Avaliado
                </Label>
                <Input
                  value={item.segmento || ''}
                  onChange={(e) => handleFieldChange(idx, 'segmento', e.target.value)}
                  placeholder="ex: Ombro direito, Lombar, Joelho esquerdo..."
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-gray-700 font-semibold text-xs">
                  Amplitude do Movimento
                </Label>
                <Textarea
                  rows={3}
                  value={item.amplitude_movimento || ''}
                  onChange={(e) => handleFieldChange(idx, 'amplitude_movimento', e.target.value)}
                  placeholder="Descreva a amplitude do movimento observada (limitações, arcos, comparação entre lados...)"
                  className="mt-1 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-gray-700 font-semibold text-xs">
                  Qualidade do Movimento
                </Label>
                <Textarea
                  rows={3}
                  value={item.qualidade_movimento || ''}
                  onChange={(e) => handleFieldChange(idx, 'qualidade_movimento', e.target.value)}
                  placeholder="Descreva a qualidade do movimento (fluidez, compensações, dor durante o movimento...)"
                  className="mt-1 rounded-xl text-xs"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="text-xs h-8 rounded-xl border-[#8C6527]/40 text-[#8C6527] hover:bg-[#8C6527]/5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar Outro Segmento
          </Button>
        </div>
      )}
    </div>
  )
}
