import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Target,
  Calendar,
  CheckSquare,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Layers,
  Dumbbell,
} from 'lucide-react'
import { gerarIaPersonal } from '@/services/avaliacoes'
import { useToast } from '@/hooks/use-toast'
import type { PacienteRecord, PlanoSemanalItem } from '@/types/database'

interface Etapa8PersonalMetasProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  paciente?: PacienteRecord
}

export const Etapa8PersonalMetas: React.FC<Etapa8PersonalMetasProps> = ({
  formData,
  onChange,
  paciente,
}) => {
  const { toast } = useToast()
  const [loadingIa, setLoadingIa] = useState(false)
  const [iaError, setIaError] = useState<string | null>(null)

  const metas = formData.metas_treino || {}
  const planoTreino = formData.plano_treino ?? ''
  const observacoes = formData.observacoes ?? ''

  // Plano Semanal de 12 semanas (com fallback padrão periodizado para Personal Trainer)
  const planoSemanal: PlanoSemanalItem[] = formData.plano_semanal_detalhado ||
    formData.ia_plano_treino?.plano_tratamento_semanal || [
      {
        semana: 'Semanas 1–2',
        foco: 'Adaptação anatômica, tolerância articular e ativação corretiva de Core',
        condutas:
          'Exercícios multiarticulares leves com foco técnico (RPE 6, 2-3 séries de 12-15 reps). Pranchas isométricas de McGill e mobilidade articular para restrições do FMS.',
        criterios_evolucao:
          'Execução sem compensações posturais e índice de esforço percebido adaptado sem dores articulares.',
      },
      {
        semana: 'Semanas 3–4',
        foco: 'Correção de assimetrias contralaterais e controle neuromuscular',
        condutas:
          'Ênfase em trabalho unilateral compensatório (afundo búlgaro, remada unilateral, elevação pélvica unilateral). Reteste de estabilização lumbopélvica.',
        criterios_evolucao:
          'Equilíbrio perceptível entre membros direito e esquerdo e boa cadência de movimento.',
      },
      {
        semana: 'Semanas 5–6',
        foco: 'Acúmulo de volume e hipertrofia funcional',
        condutas:
          'Progressão de carga submáxima (RPE 7-8, 3-4 séries de 8-12 reps). Treino periodizado A/B ou A/B/C conforme meta de composição corporal.',
        criterios_evolucao:
          'Aumento gradual de volume total de treino (tonelagem) mantendo técnica apurada.',
      },
      {
        semana: 'Semanas 7–8',
        foco: 'Intensificação de força e capacidade de trabalho',
        condutas:
          'Sobrecarga progressiva nos padrões básicos (agachamento, levantamento terra, supino/flexão). Estabilidade avançada de tronco com cargas livres.',
        criterios_evolucao:
          'Ganhos de força em dinamometria manual ou testes submáximos superiores a 10%.',
      },
      {
        semana: 'Semanas 9–10',
        foco: 'Força-potência, resistência metabólica e condicionamento',
        condutas:
          'Métodos de choque moderados (bisets, drop-sets pontuais), trabalho de aceleração/potência ou intervalos de alta intensidade (HIIT) conforme o objetivo principal.',
        criterios_evolucao:
          'Manutenção da recuperação inter-séries e melhora da FC de recuperação.',
      },
      {
        semana: 'Semanas 11–12',
        foco: 'Polimento final, consolidação das metas e reavaliação física',
        condutas:
          'Regulação de fadiga/deload estratégico nos dias finais, consolidação dos ganhos e preparação para a bateria de reavaliação física (Physical Test completo).',
        criterios_evolucao:
          'Atingimento das metas de curto/médio prazo e reteste de %G, dinamometria e FMS.',
      },
    ]

  const updateSubfield = (field: string, val: any) => {
    onChange('metas_treino', {
      ...metas,
      [field]: val,
    })
  }

  const handleGerarIa = async () => {
    try {
      setLoadingIa(true)
      setIaError(null)

      const payload = {
        ...formData,
        paciente_nome: paciente?.nome,
        paciente_nascimento: paciente?.data_nascimento,
      }

      const res = await gerarIaPersonal(payload)
      const data = res.structured

      if (data) {
        if (data.hipotese_diagnostica) {
          onChange('hipotese_diagnostica_ia', data.hipotese_diagnostica)
        }
        if (data.diagnostico_funcional) {
          onChange('diagnostico_funcional', data.diagnostico_funcional)
        }
        if (data.objetivos_treinamento) {
          onChange('objetivos_treinamento', data.objetivos_treinamento)
        }
        if (data.plano_tratamento_semanal && Array.isArray(data.plano_tratamento_semanal)) {
          onChange('plano_semanal_detalhado', data.plano_tratamento_semanal)
          onChange('ia_plano_treino', data)

          // Gerar texto formatado do plano para o campo plano_treino legado/compatibilidade
          const planoTexto = data.plano_tratamento_semanal
            .map(
              (s) =>
                `[${s.semana}] ${s.foco}\nPrescrição/Condutas: ${s.condutas}\nCritérios de Progressão: ${s.criterios_evolucao || 'Evolução favorável'}`,
            )
            .join('\n\n')
          onChange('plano_treino', planoTexto)
        } else {
          onChange('ia_plano_treino', data)
        }

        if (data.sintese_geral && !formData.observacoes) {
          onChange('observacoes', data.sintese_geral)
        }

        toast({
          title: 'Análise de Personal gerada com sucesso pela IA!',
          description:
            'A hipótese funcional, diagnóstico, objetivos e periodização de 12 semanas foram preenchidos e estão abertos para sua edição.',
        })
      } else if (res.raw_content) {
        onChange('hipotese_diagnostica_ia', res.raw_content)
        onChange('diagnostico_funcional', res.raw_content.substring(0, 300))
        toast({
          title: 'Resposta da IA gerada!',
          description: 'Verifique as seções preenchidas abaixo.',
        })
      }
    } catch (err: any) {
      console.error('Erro ao chamar agente de IA de Personal:', err)
      setIaError(err?.message || 'Falha na comunicação com o assistente inteligente')
      toast({
        title: 'Não foi possível gerar com IA no momento',
        description: 'Você pode preencher ou editar todos os campos manualmente abaixo.',
        variant: 'destructive',
      })
    } finally {
      setLoadingIa(false)
    }
  }

  const handleSemanaChange = (index: number, field: keyof PlanoSemanalItem, val: string) => {
    const list = [...planoSemanal]
    list[index] = { ...list[index], [field]: val }
    onChange('plano_semanal_detalhado', list)

    const planoAtualizado = {
      ...(formData.ia_plano_treino || {}),
      plano_tratamento_semanal: list,
    }
    onChange('ia_plano_treino', planoAtualizado)

    const planoTexto = list
      .map(
        (s) =>
          `[${s.semana}] ${s.foco}\nPrescrição/Condutas: ${s.condutas}\nCritérios de Progressão: ${s.criterios_evolucao || '—'}`,
      )
      .join('\n\n')
    onChange('plano_treino', planoTexto)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              8. Análise Integrada, Hipótese Funcional & Prescrição de 12 Semanas
            </h4>
            <p className="text-xs text-gray-500">
              Cruzamento clínico-esportivo inteligente de todos os dados do PHYSICAL TEST com
              periodização de treino
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Inteligência Artificial SOUL Personal */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1E2530] via-[#2A3444] to-[#1E2530] text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] flex items-center justify-center text-[#1E2530] shrink-0 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Inteligência Artificial SOUL Personal
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#C9A46A]/20 border border-[#C9A46A]/40 text-[#DFBF8E] text-[10px] font-bold uppercase tracking-wider">
                  Agente Nativo
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Cruza automaticamente IMC, RCQ, dobras e %G (Physical Test), dinamômetro manual com
                assimetrias, Banco de Wells, postura estática, Core McGill e FMS com as diretrizes
                do ACSM e evidências científicas.
              </p>
            </div>
          </div>

          <Button
            type="button"
            disabled={loadingIa}
            onClick={handleGerarIa}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold text-xs h-11 px-5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0 border border-[#DFBF8E]/40"
          >
            {loadingIa ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-[#33221C]" />
                Processando análise funcional...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar com IA / Regenerar
              </>
            )}
          </Button>
        </div>

        {iaError && (
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Nota: {iaError}. O fluxo não está bloqueado; todos os campos abaixo estão 100%
              editáveis para preenchimento manual do profissional.
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-[11px] text-[#DFBF8E] pt-1 border-t border-white/10">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Evidências ACSM, McGill e FMS conectadas
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> Hipótese + Diagnóstico + 12 semanas
          </span>
          <span>•</span>
          <span className="text-gray-300">Totalmente aberto a edição manual</span>
        </div>
      </div>

      {/* 1. Hipótese Diagnóstica / Avaliação Funcional Integrada */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span>1. Hipótese Diagnóstica / Avaliação Funcional Integrada</span>
          {formData.hipotese_diagnostica_ia && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
              Gerado com base na avaliação física
            </span>
          )}
        </Label>
        <Textarea
          rows={3}
          value={formData.hipotese_diagnostica_ia || ''}
          onChange={(e) => onChange('hipotese_diagnostica_ia', e.target.value)}
          placeholder="Síntese funcional cruzando riscos metabólicos (RCQ/IMC), assimetrias de força muscular, desvios posturais e restrições de movimento..."
          className="rounded-2xl text-xs sm:text-sm leading-relaxed border-gray-200"
        />
      </div>

      {/* 2. Diagnóstico Funcional (Pontos Fortes e Limitações) */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          2. Diagnóstico Funcional (Pontos Fortes & Limitações Prioritárias)
        </Label>
        <Textarea
          rows={3}
          value={formData.diagnostico_funcional || ''}
          onChange={(e) => onChange('diagnostico_funcional', e.target.value)}
          placeholder="Pontos fortes: boa resistência lumbopélvica em prancha ventral. Limitações: assimetria de ombros no FMS, encurtamento na cadeia posterior e déficit de rotação externa..."
          className="rounded-2xl text-xs sm:text-sm leading-relaxed border-gray-200"
        />
      </div>

      {/* 3. Objetivos do Treinamento Priorizados */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          3. Objetivos do Treinamento Priorizados (Curto, Médio e Longo Prazo)
        </Label>
        <Textarea
          rows={3}
          value={formData.objetivos_treinamento || ''}
          onChange={(e) => onChange('objetivos_treinamento', e.target.value)}
          placeholder="Curto prazo (30-60 dias): correção da assimetria do FMS e adaptação neuromuscular. Médio prazo (3-6 meses): redução de 3% de gordura e ganho de força. Longo prazo (12 meses): consolidação dos padrões e melhora do VO2..."
          className="rounded-2xl text-xs sm:text-sm leading-relaxed border-gray-200"
        />
      </div>

      {/* 4. Metas Fatiadas no Tempo (Campos Complementares do Physical Test) */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-4">
        <h5 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 text-[#8C6527]">
          <Calendar className="h-4 w-4" /> Detalhamento de Metas por Prazo
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Curto Prazo (30 a 60 dias)
            </Label>
            <Textarea
              rows={3}
              placeholder="Ex: Adaptação neuromuscular, regularidade de 4x/semana..."
              value={metas.meta_curto_prazo || ''}
              onChange={(e) => updateSubfield('meta_curto_prazo', e.target.value)}
              className="rounded-xl border-gray-200 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Médio Prazo (3 a 6 meses)</Label>
            <Textarea
              rows={3}
              placeholder="Ex: Redução de 3% de gordura corporal, ganho de 2kg de MLG..."
              value={metas.meta_medio_prazo || ''}
              onChange={(e) => updateSubfield('meta_medio_prazo', e.target.value)}
              className="rounded-xl border-gray-200 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Longo Prazo (12 meses)</Label>
            <Textarea
              rows={3}
              placeholder="Ex: Atingir peso ideal estimado (72kg), %G alvo de 14%..."
              value={metas.meta_longo_prazo || ''}
              onChange={(e) => updateSubfield('meta_longo_prazo', e.target.value)}
              className="rounded-xl border-gray-200 text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* 5. Plano de Treinamento Semana a Semana (12 Semanas Periodizadas) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-xs">
              <Dumbbell className="h-3.5 w-3.5" />
            </div>
            <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              5. Plano de Treinamento Semana a Semana (12 Semanas de Periodização)
            </Label>
          </div>
          <span className="text-[11px] text-gray-400">Editável bloco a bloco</span>
        </div>

        <div className="space-y-3">
          {planoSemanal.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 w-full">
                  <span className="px-2.5 py-1 rounded-xl bg-orange-100 text-orange-900 font-bold text-xs whitespace-nowrap">
                    {item.semana}
                  </span>
                  <Input
                    value={item.foco}
                    onChange={(e) => handleSemanaChange(idx, 'foco', e.target.value)}
                    placeholder="Foco da fase (ex: Adaptação anatômica, Hipertrofia funcional, Força máxima)..."
                    className="h-8 font-semibold text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <Label className="text-gray-600 font-semibold">
                    Prescrição, Divisão & Volume/Intensidade
                  </Label>
                  <Textarea
                    rows={2}
                    value={item.condutas}
                    onChange={(e) => handleSemanaChange(idx, 'condutas', e.target.value)}
                    placeholder="Divisão de treino, séries x reps, intensidade (RPE/%1RM) e exercícios prioritários..."
                    className="mt-1 rounded-xl text-xs border-gray-200"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-semibold">
                    Critérios de Progressão & Testes
                  </Label>
                  <Textarea
                    rows={2}
                    value={item.criterios_evolucao || ''}
                    onChange={(e) => handleSemanaChange(idx, 'criterios_evolucao', e.target.value)}
                    placeholder="Critérios clínicos/esportivos para avançar para a próxima fase..."
                    className="mt-1 rounded-xl text-xs border-gray-200"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Divisão da Rotina e Prescrição de Treino */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-4">
        <h5 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 text-[#8C6527]">
          <CheckSquare className="h-4 w-4" /> Divisão da Rotina & Prescrição Detalhada
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
              rows={5}
              placeholder="Descreva a periodização, métodos aplicados (ex: pirâmide, biset, RPE 7-8), aquecimentos específicos corretivos para os pontos apontados na postura e FMS..."
              value={planoTreino}
              onChange={(e) => onChange('plano_treino', e.target.value)}
              className="rounded-2xl border-gray-200 text-xs sm:text-sm leading-relaxed p-4"
            />
          </div>
        </div>
      </div>

      {/* 7. Resumo Final e Observações Gerais */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Resumo Livre da Avaliação & Observações Finais
        </Label>
        <Textarea
          rows={3}
          placeholder="Síntese geral do estado físico do aluno, motivação, cuidados especiais e combinados para a próxima reavaliação..."
          value={observacoes}
          onChange={(e) => onChange('observacoes', e.target.value)}
          className="rounded-xl border-gray-200 text-xs sm:text-sm"
        />
      </div>
    </div>
  )
}
