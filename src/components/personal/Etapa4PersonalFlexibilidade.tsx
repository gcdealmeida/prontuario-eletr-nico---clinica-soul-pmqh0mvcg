import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Activity, Ruler, Sparkles, CheckCircle2 } from 'lucide-react'
import {
  classificarBancoDeWells,
  classificarFlexitest,
  FLEXITEST_MOVIMENTOS,
  type Sexo,
} from '@/lib/personalPhysicalTest'

interface Etapa4PersonalFlexibilidadeProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa4PersonalFlexibilidade: React.FC<Etapa4PersonalFlexibilidadeProps> = ({
  formData,
  onChange,
}) => {
  const sexo: Sexo = formData.anamnese_personal?.sexo || 'M'
  const idade: number = Number(formData.anamnese_personal?.idade || 30)

  const flexDados = formData.flexibilidade_dados || {}
  const wells = flexDados.banco_wells || {}
  const flexitestAtivo = Boolean(flexDados.flexitest_ativo)
  const flexitestNotas: Record<number, number> = flexDados.flexitest_notas || {}

  const m1 = wells.medida1_cm ?? ''
  const m2 = wells.medida2_cm ?? ''
  const m3 = wells.medida3_cm ?? ''

  // Melhor medida do banco de wells
  const numM1 = parseFloat(m1)
  const numM2 = parseFloat(m2)
  const numM3 = parseFloat(m3)
  const validVals = [numM1, numM2, numM3].filter((n) => !isNaN(n))
  const melhorMedida = validVals.length > 0 ? Math.max(...validVals) : null

  const classifWells =
    melhorMedida !== null ? classificarBancoDeWells(melhorMedida, sexo, idade) : null

  // Flexitest soma
  const flexitestTotal = Object.values(flexitestNotas).reduce((acc, v) => acc + (Number(v) || 0), 0)
  const classifFlexitest = classificarFlexitest(flexitestTotal)

  const updateWells = (campo: string, val: string) => {
    const num = val === '' ? '' : parseFloat(val) || 0
    const updatedWells = { ...wells, [campo]: num }

    const vals = [
      campo === 'medida1_cm' ? num : updatedWells.medida1_cm,
      campo === 'medida2_cm' ? num : updatedWells.medida2_cm,
      campo === 'medida3_cm' ? num : updatedWells.medida3_cm,
    ].filter((n): n is number => typeof n === 'number' && !isNaN(n))

    const best = vals.length > 0 ? Math.max(...vals) : undefined
    updatedWells.melhor_medida_cm = best
    if (best !== undefined) {
      const c = classificarBancoDeWells(best, sexo, idade)
      updatedWells.classificacao = c?.classificacao
      onChange('flexibilidade_sit_reach', best)
    }

    onChange('flexibilidade_dados', { ...flexDados, banco_wells: updatedWells })
  }

  const handleUpdateFlexitestNota = (movId: number, nota: number) => {
    const updatedNotas = { ...flexitestNotas, [movId]: nota }
    const total = Object.values(updatedNotas).reduce((acc, v) => acc + (Number(v) || 0), 0)
    const c = classificarFlexitest(total)

    onChange('flexibilidade_dados', {
      ...flexDados,
      flexitest_notas: updatedNotas,
      flexitest_total: total,
      flexitest_classificacao: c.classificacao,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Ruler className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              4. Testes de Flexibilidade (Physical Test)
            </h4>
            <p className="text-xs text-gray-500">
              Banco de Wells (Sentar e Alcançar) com 3 tentativas e Teste de Flexitest (Cláudio Gil
              Araújo)
            </p>
          </div>
        </div>
      </div>

      {/* 1. Banco de Wells */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              Banco de Wells (Sentar e Alcançar - cm)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C6527] border border-[#E9E1D2]">
              Padrão Ouro Physical Test
            </span>
          </div>
          {melhorMedida !== null && (
            <span className="text-xs font-mono font-bold text-[#8C6527]">
              Melhor Medida: {melhorMedida} cm
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">1ª Tentativa (cm)</Label>
            <Input
              type="number"
              step="0.5"
              placeholder="Ex: 28.0"
              value={m1}
              onChange={(e) => updateWells('medida1_cm', e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">2ª Tentativa (cm)</Label>
            <Input
              type="number"
              step="0.5"
              placeholder="Ex: 30.5"
              value={m2}
              onChange={(e) => updateWells('medida2_cm', e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">3ª Tentativa (cm)</Label>
            <Input
              type="number"
              step="0.5"
              placeholder="Ex: 32.0"
              value={m3}
              onChange={(e) => updateWells('medida3_cm', e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm font-mono"
            />
          </div>
        </div>

        {/* Card de Classificação Wells */}
        {classifWells && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${classifWells.cor}`}
          >
            <div>
              <span className="text-xs font-bold block uppercase tracking-wider">
                Classificação Banco de Wells ({sexo === 'M' ? 'Homens' : 'Mulheres'}, {idade} anos)
              </span>
              <span className="text-sm font-black mt-0.5 block">{classifWells.classificacao}</span>
            </div>
            <div className="text-2xl font-black font-mono">{melhorMedida} cm</div>
          </div>
        )}
      </div>

      {/* 2. Flexitest (Cláudio Gil Araújo) - Opcional por Seleção */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-bold text-gray-900 text-sm">
              Teste de Flexitest (Cláudio Gil Araújo - 20 Movimentos)
            </h5>
            <p className="text-xs text-gray-500">
              Avaliação de amplitude máxima passiva pontuada de 0 a 4 por articulação
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-semibold">Aplicar Flexitest</span>
            <Switch
              checked={flexitestAtivo}
              onCheckedChange={(checked) =>
                onChange('flexibilidade_dados', { ...flexDados, flexitest_ativo: checked })
              }
            />
          </div>
        </div>

        {flexitestAtivo && (
          <div className="space-y-4 pt-2 border-t border-gray-100 animate-fade-in">
            {/* Header com Resultado do Flexitest */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${classifFlexitest.cor}`}
            >
              <div>
                <span className="text-xs font-bold block uppercase tracking-wider">
                  Índice Fleximax Calculado
                </span>
                <span className="text-sm font-black mt-0.5 block">
                  Classificação: {classifFlexitest.classificacao}
                </span>
              </div>
              <div className="text-2xl font-black font-mono">{flexitestTotal} / 80 pts</div>
            </div>

            {/* Grid dos 20 movimentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FLEXITEST_MOVIMENTOS.map((m) => {
                const notaAtual = flexitestNotas[m.id] ?? 0
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-gray-800 line-clamp-1">
                      {m.id}. {m.nome}
                    </span>

                    {/* Botões de nota 0 a 4 */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[0, 1, 2, 3, 4].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => handleUpdateFlexitestNota(m.id, pt)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                            notaAtual === pt
                              ? 'bg-[#8C6527] text-white shadow-xs'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Observações da Flexibilidade */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">Observações de Flexibilidade</Label>
        <Textarea
          rows={3}
          placeholder="Encurtamento de cadeia posterior, restrição de rotação de ombro, queixas de desconforto lombar durante o teste de Wells..."
          value={flexDados.observacoes || ''}
          onChange={(e) =>
            onChange('flexibilidade_dados', { ...flexDados, observacoes: e.target.value })
          }
          className="rounded-xl border-gray-200 text-xs sm:text-sm"
        />
      </div>
    </div>
  )
}
