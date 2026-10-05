import React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Target, Calendar, CheckSquare, Sparkles } from 'lucide-react'

interface Etapa8PersonalMetasProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa8PersonalMetas: React.FC<Etapa8PersonalMetasProps> = ({ formData, onChange }) => {
  const metas = formData.metas_treino || {}
  const planoTreino = formData.plano_treino ?? ''
  const observacoes = formData.observacoes ?? ''

  const updateSubfield = (field: string, val: any) => {
    onChange('metas_treino', {
      ...metas,
      [field]: val,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              8. Metas de Treinamento, Divisão da Rotina & Conclusão
            </h4>
            <p className="text-xs text-gray-500">
              Resumo integrado da avaliação física, periodização de metas (curto, médio e longo
              prazo) e prescrição
            </p>
          </div>
        </div>
      </div>

      {/* Metas Fatiadas no Tempo */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-sm space-y-4">
        <h5 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 text-[#8C6527]">
          <Calendar className="h-4 w-4" /> Metas Periodizadas
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Curto Prazo (30 a 60 dias)
            </Label>
            <Textarea
              rows={3}
              placeholder="Ex: Adaptação neuromuscular, redução de assimetria do FMS em ombros, regularidade de 4x/semana..."
              value={metas.meta_curto_prazo || ''}
              onChange={(e) => updateSubfield('meta_curto_prazo', e.target.value)}
              className="rounded-xl border-gray-200 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Médio Prazo (3 a 6 meses)</Label>
            <Textarea
              rows={3}
              placeholder="Ex: Redução de 3% de gordura corporal, aumento de força em agachamento 1RM para 80kg, ganho de 2kg de MLG..."
              value={metas.meta_medio_prazo || ''}
              onChange={(e) => updateSubfield('meta_medio_prazo', e.target.value)}
              className="rounded-xl border-gray-200 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Longo Prazo (12 meses)</Label>
            <Textarea
              rows={3}
              placeholder="Ex: Atingir peso ideal estimado (72kg), %G alvo de 14%, completar meia-maratona ou teste de condicionamento..."
              value={metas.meta_longo_prazo || ''}
              onChange={(e) => updateSubfield('meta_longo_prazo', e.target.value)}
              className="rounded-xl border-gray-200 text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Divisão da Rotina e Prescrição de Treino */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-sm space-y-4">
        <h5 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 text-[#8C6527]">
          <CheckSquare className="h-4 w-4" /> Prescrição de Treino & Estrutura
        </h5>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Divisão da Rotina Semanal (Ex: Treino A / B / C / Aeróbio)
            </Label>
            <Input
              placeholder="Ex: A (Superiores + Core) / B (Inferiores + Posterior) / C (Fullbody Funcional)"
              value={metas.divisao_rotina || ''}
              onChange={(e) => updateSubfield('divisao_rotina', e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Detalhamento da Prescrição de Treino & Exercícios Prioritários
            </Label>
            <Textarea
              rows={6}
              placeholder="Descreva a periodização, métodos aplicados (ex: pirâmide, biset, RPE 7-8), aquecimentos específicos corretivos para os pontos apontados na postura e FMS..."
              value={planoTreino}
              onChange={(e) => onChange('plano_treino', e.target.value)}
              className="rounded-2xl border-gray-200 text-xs sm:text-sm leading-relaxed p-4"
            />
          </div>
        </div>
      </div>

      {/* Resumo Final e Observações Gerais */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Resumo Livre da Avaliação & Observações Finais
        </Label>
        <Textarea
          rows={4}
          placeholder="Síntese geral do estado físico do aluno, motivação, cuidados especiais e combinados para a próxima reavaliação..."
          value={observacoes}
          onChange={(e) => onChange('observacoes', e.target.value)}
          className="rounded-xl border-gray-200 text-xs sm:text-sm"
        />
      </div>
    </div>
  )
}
