import React from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { TESTES_ESPECIAIS_PADRAO } from '@/lib/fisioterapiaModel'
import type { TestesEspeciaisSegmento, TesteEspecialItem } from '@/types/database'
import { Target, CheckSquare, Square } from 'lucide-react'

interface Etapa4TestesEspeciaisProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa4TestesEspeciais: React.FC<Etapa4TestesEspeciaisProps> = ({
  formData,
  onChange,
}) => {
  const segmentos: TestesEspeciaisSegmento[] =
    formData.testes_especiais_segmentos && formData.testes_especiais_segmentos.length > 0
      ? formData.testes_especiais_segmentos
      : TESTES_ESPECIAIS_PADRAO

  const handleToggleSegmento = (index: number) => {
    const list = segmentos.map((s, idx) => (idx === index ? { ...s, ativo: !s.ativo } : s))
    onChange('testes_especiais_segmentos', list)
  }

  const handleStatusChange = (
    segIdx: number,
    testeIdx: number,
    lado: 'status_direito' | 'status_esquerdo',
    status: 'POSITIVO' | 'NEGATIVO' | 'NÃO REALIZADO',
  ) => {
    const list = [...segmentos]
    const seg = { ...list[segIdx] }
    const testes = [...seg.testes]
    const current = testes[testeIdx]
    testes[testeIdx] = { ...current, [lado]: status }
    seg.testes = testes
    list[segIdx] = seg
    onChange('testes_especiais_segmentos', list)

    // Atualizar resumo em testes_especiais de compatibilidade
    atualizarResumoCompatibilidade(list)
  }

  const handleObservacaoChange = (segIdx: number, testeIdx: number, val: string) => {
    const list = [...segmentos]
    const seg = { ...list[segIdx] }
    const testes = [...seg.testes]
    testes[testeIdx] = { ...testes[testeIdx], observacao: val }
    seg.testes = testes
    list[segIdx] = seg
    onChange('testes_especiais_segmentos', list)
    atualizarResumoCompatibilidade(list)
  }

  const atualizarResumoCompatibilidade = (list: TestesEspeciaisSegmento[]) => {
    const positivos: string[] = []
    for (const seg of list) {
      if (!seg.ativo) continue
      for (const t of seg.testes) {
        if (t.status_direito === 'POSITIVO' || t.status_esquerdo === 'POSITIVO') {
          positivos.push(
            `${t.nome} (${t.status_direito === 'POSITIVO' ? 'D' : ''}${
              t.status_esquerdo === 'POSITIVO' ? 'E' : ''
            })`,
          )
        }
      }
    }
    if (positivos.length > 0) {
      onChange('testes_especiais', `Testes positivos: ${positivos.join(', ')}`)
    }
  }

  const handleSelectAll = (ativo: boolean) => {
    const list = segmentos.map((s) => ({ ...s, ativo }))
    onChange('testes_especiais_segmentos', list)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho explicativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E9E1D2]">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#8C6527]" />
            <h4 className="text-base font-bold text-gray-900">
              Testes Especiais Ortopédicos por Segmento
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Pré-selecione os segmentos a avaliar para abrir a lista completa dos testes padrão de
            cada segmento. Cada teste conta com botões de estado (POSITIVO / NEGATIVO / NÃO
            REALIZADO) e campo de observação.
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

      {/* Segmentos Disponíveis (Opt-in) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {segmentos.map((seg, idx) => (
          <label
            key={seg.segmento}
            className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
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
              className={`text-xs font-semibold line-clamp-1 ${
                seg.ativo ? 'text-blue-900' : 'text-gray-700'
              }`}
              title={seg.segmento}
            >
              {seg.segmento}
            </span>
          </label>
        ))}
      </div>

      {/* Lista de Testes para Segmentos Ativados */}
      <div className="space-y-6 pt-2">
        {segmentos.filter((s) => s.ativo).length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-500">
              Nenhum segmento selecionado para testes especiais. Selecione acima para visualizar e
              registrar as manobras.
            </p>
          </div>
        ) : (
          segmentos.map((seg, segIdx) => {
            if (!seg.ativo) return null
            return (
              <div
                key={seg.segmento}
                className="rounded-3xl border border-blue-200 bg-white p-4 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h5 className="font-bold text-sm sm:text-base text-gray-900">
                      Segmento: {seg.segmento}
                    </h5>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {seg.testes.length} manobras clínicas padronizadas
                  </span>
                </div>

                <div className="space-y-3">
                  {seg.testes.map((teste, testeIdx) => {
                    const dStatus = teste.status_direito || 'NÃO REALIZADO'
                    const eStatus = teste.status_esquerdo || 'NÃO REALIZADO'

                    return (
                      <div
                        key={teste.nome}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          dStatus === 'POSITIVO' || eStatus === 'POSITIVO'
                            ? 'bg-amber-50/40 border-amber-300'
                            : 'bg-gray-50/50 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">
                              {teste.nome}
                            </span>
                            {teste.estrutura && (
                              <span className="text-[10px] text-gray-500">
                                Alvo: {teste.estrutura}
                              </span>
                            )}
                          </div>

                          {/* Seletor Rápido Lado Direito */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {/* Lado Direito */}
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200">
                              <span className="font-bold text-[10px] text-gray-600 px-1">D:</span>
                              {(['POSITIVO', 'NEGATIVO', 'NÃO REALIZADO'] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(segIdx, testeIdx, 'status_direito', st)
                                  }
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                    dStatus === st
                                      ? st === 'POSITIVO'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : st === 'NEGATIVO'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-700 text-white'
                                      : 'text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  {st === 'POSITIVO' ? '+' : st === 'NEGATIVO' ? '-' : 'N/R'}
                                </button>
                              ))}
                            </div>

                            {/* Lado Esquerdo */}
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200">
                              <span className="font-bold text-[10px] text-gray-600 px-1">E:</span>
                              {(['POSITIVO', 'NEGATIVO', 'NÃO REALIZADO'] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(segIdx, testeIdx, 'status_esquerdo', st)
                                  }
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                    eStatus === st
                                      ? st === 'POSITIVO'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : st === 'NEGATIVO'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-700 text-white'
                                      : 'text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  {st === 'POSITIVO' ? '+' : st === 'NEGATIVO' ? '-' : 'N/R'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Observação Livre */}
                        <div>
                          <Input
                            placeholder="Observação do teste (grau de dor, crepitação, frouxidão, reprodução exata dos sintomas)..."
                            value={teste.observacao || ''}
                            onChange={(e) =>
                              handleObservacaoChange(segIdx, testeIdx, e.target.value)
                            }
                            className="h-8 text-xs rounded-xl bg-white border-gray-200"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
