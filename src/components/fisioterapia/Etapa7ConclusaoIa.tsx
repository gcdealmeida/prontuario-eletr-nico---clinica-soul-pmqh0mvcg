import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, BookOpen, Layers } from 'lucide-react'
import { gerarIaFisioterapia } from '@/services/avaliacoes'
import { useToast } from '@/hooks/use-toast'
import type { PacienteRecord, PlanoSemanalItem } from '@/types/database'

interface Etapa7ConclusaoIaProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  paciente?: PacienteRecord
}

export const Etapa7ConclusaoIa: React.FC<Etapa7ConclusaoIaProps> = ({
  formData,
  onChange,
  paciente,
}) => {
  const { toast } = useToast()
  const [loadingIa, setLoadingIa] = useState(false)
  const [iaError, setIaError] = useState<string | null>(null)

  const planoSemanal: PlanoSemanalItem[] = formData.plano_semanal_detalhado || [
    {
      semana: 'Semanas 1–2',
      foco: 'Alívio da dor, modulação inflamatória e analgesia',
      condutas:
        'Isometria submáxima sem dor, liberação miofascial suave, mobilização articular grau I-II, orientações de controle de carga.',
      criterios_evolucao: 'Redução da EVA para <= 3 e término de espasmos protetores.',
    },
    {
      semana: 'Semanas 3–4',
      foco: 'Restauração de ADM e ativação neuromuscular inicial',
      condutas:
        'Mobilidade ativa-assistida, ganho de ADM nos segmentos restritos, exercícios em cadeia cinética fechada.',
      criterios_evolucao: 'Recuperação de pelo menos 80% da ADM contralateral simétrica.',
    },
    {
      semana: 'Semanas 5–6',
      foco: 'Ganho de força muscular e controle dinâmico de Core',
      condutas:
        'Exercícios concêntricos/excêntricos progressivos, pranchas e pontes com controle lumbopélvico, treino de rotação.',
      criterios_evolucao: 'Déficit de dinamometria contralateral inferior a 15%.',
    },
    {
      semana: 'Semanas 7–8',
      foco: 'Propriocepção avançada, gesto funcional e retorno seguro',
      condutas:
        'Pliometria leve, simulação de gestos esportivos/ocupacionais, treino de estabilidade em superfícies instáveis.',
      criterios_evolucao:
        'Realização de testes funcionais e pranchas dentro da faixa de referência sem dor.',
    },
  ]

  const handleGerarIa = async () => {
    try {
      setLoadingIa(true)
      setIaError(null)

      const payload = {
        ...formData,
        paciente_nome: paciente?.nome,
        paciente_nascimento: paciente?.data_nascimento,
        resumos_anexos: formData.resumos_anexos || {},
      }

      const res = await gerarIaFisioterapia(payload)
      const data = res.structured

      if (data) {
        if (data.hipotese_diagnostica) {
          onChange('hipotese_diagnostica_ia', data.hipotese_diagnostica)
        }
        if (data.diagnostico_disfuncional) {
          onChange('diagnostico_disfuncional', data.diagnostico_disfuncional)
          onChange('diagnostico_fisioterapeutico', data.diagnostico_disfuncional)
        }
        if (data.objetivos_tratamento) {
          onChange('objetivos_tratamento', data.objetivos_tratamento)
        }
        if (data.plano_tratamento_semanal && Array.isArray(data.plano_tratamento_semanal)) {
          onChange('plano_semanal_detalhado', data.plano_tratamento_semanal)
          // Também formatar versão texto para compatibilidade
          const planoTexto = data.plano_tratamento_semanal
            .map(
              (s: any) =>
                `[${s.semana}] ${s.foco}\nCondutas: ${s.condutas}\nCritérios: ${s.criterios_evolucao || 'Evolução clínica favorável'}`,
            )
            .join('\n\n')
          onChange('plano_tratamento', planoTexto)
        }
        toast({
          title: 'Análise gerada com sucesso pela IA!',
          description:
            'A hipótese, objetivos e plano semanal foram preenchidos e estão abertos para sua edição.',
        })
      } else if (res.raw_content) {
        // Fallback para conteúdo em texto caso json não venha parseado
        onChange('hipotese_diagnostica_ia', res.raw_content)
        onChange('diagnostico_disfuncional', res.raw_content.substring(0, 300))
        toast({
          title: 'Resposta da IA gerada!',
          description: 'Verifique as seções preenchidas.',
        })
      }
    } catch (err: any) {
      console.error('Erro ao chamar agente de IA:', err)
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

    const planoTexto = list
      .map(
        (s) =>
          `[${s.semana}] ${s.foco}\nCondutas: ${s.condutas}\nCritérios: ${s.criterios_evolucao || '—'}`,
      )
      .join('\n\n')
    onChange('plano_tratamento', planoTexto)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Inteligência Artificial SOUL */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1E2530] via-[#2A3444] to-[#1E2530] text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] flex items-center justify-center text-[#1E2530] shrink-0 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Inteligência Artificial SOUL Fisioterapia
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#C9A46A]/20 border border-[#C9A46A]/40 text-[#DFBF8E] text-[10px] font-bold uppercase tracking-wider">
                  Agente Nativo
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Cruza automaticamente diagnóstico médico, queixas, amplitudes (ADM),
                força/dinamômetro, testes especiais e tabela de Core com diretrizes científicas de
                alto impacto (CPG, Lancet, JOSPT, Oliveira et al. 2018).
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
                Processando raciocínio clínico...
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
            <BookOpen className="h-3.5 w-3.5" /> Evidências científicas conectadas
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> Hipótese + Diagnóstico + Plano 8 semanas
          </span>
          <span>•</span>
          <span className="text-gray-300">Totalmente aberto a edição manual</span>
        </div>
      </div>

      {/* 1. Hipótese Diagnóstica (Cruzamento Clínico) */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <span>1. Hipótese Diagnóstica (Cruzamento de Dados Clínicos e Biomecânicos)</span>
          {formData.hipotese_diagnostica_ia && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
              Gerado com base na avaliação
            </span>
          )}
        </Label>
        <Textarea
          rows={3}
          value={formData.hipotese_diagnostica_ia || ''}
          onChange={(e) => onChange('hipotese_diagnostica_ia', e.target.value)}
          placeholder="Relação entre diagnóstico médico, fragilidades musculares encontradas, testes especiais positivos e laudos dos exames..."
          className="rounded-2xl text-xs sm:text-sm leading-relaxed"
        />
      </div>

      {/* 2. Diagnóstico Disfuncional (Cinético-Funcional) */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          2. Diagnóstico Disfuncional (Fisioterapêutico / Cinético-Funcional)
        </Label>
        <Textarea
          rows={2}
          value={formData.diagnostico_disfuncional || formData.diagnostico_fisioterapeutico || ''}
          onChange={(e) => {
            onChange('diagnostico_disfuncional', e.target.value)
            onChange('diagnostico_fisioterapeutico', e.target.value)
          }}
          placeholder="Ex: Disfunção cinético-funcional por déficit de rotação externa glenoumeral, fraqueza de estabilizadores escapulares e sobrecarga tendínea..."
          className="rounded-2xl text-xs sm:text-sm leading-relaxed"
        />
      </div>

      {/* 3. Objetivos do Tratamento */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          3. Objetivos do Tratamento (Curto, Médio e Longo Prazo)
        </Label>
        <Textarea
          rows={3}
          value={formData.objetivos_tratamento || ''}
          onChange={(e) => onChange('objetivos_tratamento', e.target.value)}
          placeholder="Curto prazo: redução da dor em 50% e modulação do tônus. Médio prazo: restauração da ADM e força. Longo prazo: retorno pleno à atividade esportiva sem receio..."
          className="rounded-2xl text-xs sm:text-sm leading-relaxed"
        />
      </div>

      {/* 4. Plano de Tratamento Semana a Semana (8 Semanas) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            4. Plano de Tratamento Semana a Semana (Fases de Reabilitação)
          </Label>
          <span className="text-[11px] text-gray-400">Editável fase a fase</span>
        </div>

        <div className="space-y-3">
          {planoSemanal.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 font-bold text-xs">
                    {item.semana}
                  </span>
                  <Input
                    value={item.foco}
                    onChange={(e) => handleSemanaChange(idx, 'foco', e.target.value)}
                    placeholder="Foco da fase..."
                    className="h-8 font-semibold text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <Label className="text-gray-600 font-semibold">
                    Condutas Terapêuticas & Exercícios
                  </Label>
                  <Textarea
                    rows={2}
                    value={item.condutas}
                    onChange={(e) => handleSemanaChange(idx, 'condutas', e.target.value)}
                    placeholder="Exercícios específicos, técnicas de terapia manual, parâmetros..."
                    className="mt-1 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-semibold">
                    Critérios para Progressão de Fase
                  </Label>
                  <Textarea
                    rows={2}
                    value={item.criterios_evolucao || ''}
                    onChange={(e) => handleSemanaChange(idx, 'criterios_evolucao', e.target.value)}
                    placeholder="Critérios clínicos para avançar para a próxima fase..."
                    className="mt-1 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
