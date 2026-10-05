import React, { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { QUEIXAS_INICIAIS_PADRAO } from '@/lib/fisioterapiaModel'
import type {
  PacienteRecord,
  AnamneseDetalhadaFisio,
  QueixaItem,
  ViscerasSistemicas,
  HabitosSaude,
} from '@/types/database'
import { User, Activity, AlertCircle, Heart, Moon, Coffee } from 'lucide-react'

interface Etapa1AnamneseProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  paciente?: PacienteRecord
}

export const Etapa1Anamnese: React.FC<Etapa1AnamneseProps> = ({ formData, onChange, paciente }) => {
  const anamnese: AnamneseDetalhadaFisio = formData.anamnese_detalhada || {}
  const queixas: QueixaItem[] = formData.queixas_multiplas || QUEIXAS_INICIAIS_PADRAO
  const visceras: ViscerasSistemicas = formData.visceras_sistemicas || {}
  const habitos: HabitosSaude = formData.habitos_saude || {}

  // Auto-calcular idade com base no nascimento
  const calcIdade = (dataNasc?: string) => {
    if (!dataNasc) return ''
    const parts = dataNasc.split('-')
    if (parts.length < 3) return ''
    const nasc = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    const diff = Date.now() - nasc.getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
  }

  // Auto-calcular IMC
  useEffect(() => {
    const p = parseFloat(String(anamnese.peso || ''))
    const a = parseFloat(String(anamnese.altura || ''))
    if (p > 0 && a > 0) {
      const imc = Number((p / (a * a)).toFixed(1))
      if (anamnese.imc !== imc) {
        onChange('anamnese_detalhada', { ...anamnese, imc })
      }
    }
  }, [anamnese.peso, anamnese.altura])

  const handleAnamneseChange = (key: keyof AnamneseDetalhadaFisio, val: any) => {
    const updated = { ...anamnese, [key]: val }
    onChange('anamnese_detalhada', updated)
    // Sincronizar campos de compatibilidade retroativa
    if (key === 'motivo_principal' && !formData.queixa_principal) {
      onChange('queixa_principal', val)
    }
    if (key === 'diagnostico_medico' && !formData.diagnostico_fisioterapeutico) {
      onChange('diagnostico_fisioterapeutico', val)
    }
    if (key === 'cirurgias') onChange('cirurgias', val)
    if (key === 'medicamentos') onChange('medicamentos', val)
  }

  const handleQueixaChange = (index: number, key: keyof QueixaItem, val: any) => {
    const list = [...queixas]
    list[index] = { ...list[index], [key]: val }
    onChange('queixas_multiplas', list)
    if (index === 0 && key === 'queixa') {
      onChange('queixa_principal', val)
    }
  }

  const handleVisceraChange = (key: keyof ViscerasSistemicas, val: string) => {
    onChange('visceras_sistemicas', { ...visceras, [key]: val })
  }

  const handleHabitoChange = (key: keyof HabitosSaude, val: any) => {
    onChange('habitos_saude', { ...habitos, [key]: val })
  }

  const idadeCalculada = calcIdade(paciente?.data_nascimento)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* (A) Dados Iniciais do Paciente */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
          <User className="h-5 w-5 text-[#8C6527]" />
          <h4 className="text-base font-bold text-gray-900">(a) Dados Iniciais e Identificação</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <Label className="text-gray-600 font-semibold">Data da Avaliação</Label>
            <Input
              type="date"
              value={formData.data_avaliacao || new Date().toISOString().substring(0, 10)}
              onChange={(e) => onChange('data_avaliacao', e.target.value)}
              className="mt-1 h-9 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-gray-600 font-semibold">Nome do Paciente</Label>
            <Input
              value={paciente?.nome || ''}
              readOnly
              className="mt-1 h-9 rounded-xl bg-gray-50 text-gray-700 font-medium"
            />
          </div>
          <div>
            <Label className="text-gray-600 font-semibold">Data de Nascimento / Idade</Label>
            <Input
              value={`${paciente?.data_nascimento || '—'} (${idadeCalculada ? `${idadeCalculada} anos` : '—'})`}
              readOnly
              className="mt-1 h-9 rounded-xl bg-gray-50 text-gray-700"
            />
          </div>
          <div>
            <Label className="text-gray-600 font-semibold">CPF</Label>
            <Input
              value={paciente?.cpf || '—'}
              readOnly
              className="mt-1 h-9 rounded-xl bg-gray-50 font-mono text-gray-700"
            />
          </div>

          <div>
            <Label className="text-gray-600 font-semibold">Peso (kg)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 72.5"
              value={anamnese.peso || ''}
              onChange={(e) => handleAnamneseChange('peso', e.target.value)}
              className="mt-1 h-9 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-gray-600 font-semibold">Altura (m)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Ex: 1.75"
              value={anamnese.altura || ''}
              onChange={(e) => handleAnamneseChange('altura', e.target.value)}
              className="mt-1 h-9 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-gray-600 font-semibold">IMC Calculado</Label>
            <div className="mt-1 h-9 px-3 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-between">
              <span className="font-mono font-bold text-[#8C6527]">
                {anamnese.imc ? `${anamnese.imc} kg/m²` : '—'}
              </span>
              <span className="text-[11px] text-gray-500">
                {anamnese.imc
                  ? anamnese.imc < 18.5
                    ? 'Abaixo'
                    : anamnese.imc < 25
                      ? 'Adequado'
                      : anamnese.imc < 30
                        ? 'Sobrepeso'
                        : 'Obesidade'
                  : 'Automático'}
              </span>
            </div>
          </div>
          <div>
            <Label className="text-gray-600 font-semibold">Profissão</Label>
            <Input
              placeholder="Ex: Arquiteto, Bancário..."
              value={anamnese.profissao || ''}
              onChange={(e) => handleAnamneseChange('profissao', e.target.value)}
              className="mt-1 h-9 rounded-xl"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-gray-600 font-semibold">Diagnóstico Médico</Label>
            <Input
              placeholder="Ex: Tendinopatia de supraespinhal, hérnia discal L5-S1..."
              value={anamnese.diagnostico_medico || ''}
              onChange={(e) => handleAnamneseChange('diagnostico_medico', e.target.value)}
              className="mt-1 h-9 rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-gray-600 font-semibold">Objetivos Principais</Label>
            <Input
              placeholder="Ex: Retorno à corrida sem dor, ganho de mobilidade no ombro..."
              value={anamnese.objetivos || ''}
              onChange={(e) => handleAnamneseChange('objetivos', e.target.value)}
              className="mt-1 h-9 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* (B) Anamnese Clínica Estratégica (5 Partes) */}
      <div className="space-y-5 p-5 rounded-2xl bg-[#FCFAF7] border border-[#E9E1D2]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#8C6527]" />
            <h4 className="text-base font-bold text-gray-900">
              (b) Anamnese Clínica Estratégica — Motivo, Impacto e Objetivo
            </h4>
          </div>
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Abertura sugerida ao paciente:</span> “Hoje nossa conversa
            terá 4 partes: primeiro, vou entender o que te trouxe aqui; depois, vou te explicar o
            que está acontecendo; em seguida, vou te mostrar o caminho do tratamento; e, no final,
            combinamos como vamos fazer.” Durante a anamnese: pergunte, escute e registre as
            palavras exatas do paciente.
          </div>
        </div>

        {/* Parte 1 */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6527] block">
            1. Motivo da Procura e Momento da Decisão
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <Label className="text-gray-700">
                O que te trouxe aqui hoje? Qual é a principal dor/limitação?
              </Label>
              <Textarea
                rows={2}
                value={anamnese.motivo_principal || ''}
                onChange={(e) => handleAnamneseChange('motivo_principal', e.target.value)}
                placeholder="Nas palavras do paciente..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Há quanto tempo isso te incomoda? Como tem evoluído?
              </Label>
              <Textarea
                rows={2}
                value={anamnese.tempo_evolucao || ''}
                onChange={(e) => handleAnamneseChange('tempo_evolucao', e.target.value)}
                placeholder="Início, progressão, episódios prévios..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                O que te fez decidir buscar tratamento AGORA, e não semanas atrás?
              </Label>
              <Textarea
                rows={2}
                value={anamnese.momento_decisao_agora || ''}
                onChange={(e) => handleAnamneseChange('momento_decisao_agora', e.target.value)}
                placeholder="Gatilho de decisão..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                O que mudou recentemente para isso se tornar prioridade?
              </Label>
              <Textarea
                rows={2}
                value={anamnese.mudanca_recente_prioridade || ''}
                onChange={(e) => handleAnamneseChange('mudanca_recente_prioridade', e.target.value)}
                placeholder="Piora dos sintomas, evento próximo..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Parte 2 */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6527] block">
            2. Impacto Real do Problema
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <Label className="text-gray-700">
                Como isso impacta seu dia a dia e sua autonomia?
              </Label>
              <Input
                value={anamnese.impacto_dia_a_dia || ''}
                onChange={(e) => handleAnamneseChange('impacto_dia_a_dia', e.target.value)}
                placeholder="Atividades cotidianas, vestir-se, dormir..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Como interfere no seu trabalho, família, relações ou rotina?
              </Label>
              <Input
                value={anamnese.impacto_trabalho_familia || ''}
                onChange={(e) => handleAnamneseChange('impacto_trabalho_familia', e.target.value)}
                placeholder="Produtividade, paciência, tempo com filhos..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Como interfere no esporte, atividade física, lazer ou desempenho?
              </Label>
              <Input
                value={anamnese.impacto_esporte_lazer || ''}
                onChange={(e) => handleAnamneseChange('impacto_esporte_lazer', e.target.value)}
                placeholder="Academia, corrida, viagens..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Existe algo que você deixou de fazer, evita ou faz com receio?
              </Label>
              <Input
                value={anamnese.o_que_evita_fazer || ''}
                onChange={(e) => handleAnamneseChange('o_que_evita_fazer', e.target.value)}
                placeholder="Carregar peso, agachar, correr..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Parte 3 */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6527] block">
            3. Tentativas Anteriores e Lacunas
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <Label className="text-gray-700">
                Você já tentou resolver isso de outra forma? O que já fez?
              </Label>
              <Textarea
                rows={2}
                value={anamnese.tentativas_anteriores || ''}
                onChange={(e) => handleAnamneseChange('tentativas_anteriores', e.target.value)}
                placeholder="Fisioterapias, infiltrações, massagens..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                O que aconteceu com essas tentativas? O que melhorou e por quanto tempo?
              </Label>
              <Textarea
                rows={2}
                value={anamnese.resultado_tentativas || ''}
                onChange={(e) => handleAnamneseChange('resultado_tentativas', e.target.value)}
                placeholder="Alívio temporário, sem melhora..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Na sua percepção, por que o problema não foi resolvido completamente?
              </Label>
              <Textarea
                rows={2}
                value={anamnese.por_que_nao_resolveu || ''}
                onChange={(e) => handleAnamneseChange('por_que_nao_resolveu', e.target.value)}
                placeholder="Falta de constância, só tratou sintomas..."
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Parte 4 */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6527] block">
            4. Resultado Desejado e Visão de Futuro (3–6 Meses)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <Label className="text-gray-700">
                Se continuar exatamente como está pelos próximos 3–6 meses, o que mais te preocupa?
              </Label>
              <Input
                value={anamnese.preocupacao_3_6_meses || ''}
                onChange={(e) => handleAnamneseChange('preocupacao_3_6_meses', e.target.value)}
                placeholder="Piorar, precisar de cirurgia, parar de trabalhar..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Como seria sua vida se isso estivesse resolvido daqui 3–6 meses?
              </Label>
              <Input
                value={anamnese.vida_resolvida_3_6_meses || ''}
                onChange={(e) => handleAnamneseChange('vida_resolvida_3_6_meses', e.target.value)}
                placeholder="Sem dor ao acordar, correndo 5km..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                O que você gostaria de voltar a fazer com confiança e sem dor?
              </Label>
              <Input
                value={anamnese.desejo_voltar_fazer || ''}
                onChange={(e) => handleAnamneseChange('desejo_voltar_fazer', e.target.value)}
                placeholder="Brincar com filhos, carregar compras..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-gray-700">
                Qual resultado faria você dizer: “valeu a pena fazer este tratamento”?
              </Label>
              <Input
                value={anamnese.resultado_valeu_a_pena || ''}
                onChange={(e) => handleAnamneseChange('resultado_valeu_a_pena', e.target.value)}
                placeholder="Critério pessoal de sucesso do paciente..."
                className="mt-1 h-9 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Parte 5 */}
        <div className="space-y-2 pt-2 border-t border-[#E9E1D2]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6527] block">
            5. Síntese — O que mais importa para este paciente
          </span>
          <div>
            <Label className="text-gray-800 font-bold">
              Frase-Chave / Objetivo Central (registrar nas palavras do paciente)
            </Label>
            <Input
              value={anamnese.frase_chave_paciente || ''}
              onChange={(e) => handleAnamneseChange('frase_chave_paciente', e.target.value)}
              placeholder="Ex: 'Quero voltar a surfar sem sentir a fisgada no ombro'..."
              className="mt-1 h-10 rounded-xl font-medium border-[#C9A46A]/50 bg-white"
            />
          </div>
        </div>
      </div>

      {/* (C) Queixas (Principal, Secundária, Terciária) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
          <AlertCircle className="h-5 w-5 text-[#8C6527]" />
          <h4 className="text-base font-bold text-gray-900">
            (c) Queixas Clínicas (Principal e Complementares)
          </h4>
        </div>

        <div className="space-y-4">
          {queixas.map((q, idx) => (
            <div
              key={q.titulo}
              className={`p-4 rounded-2xl border ${
                idx === 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-gray-50/60 border-gray-200'
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Queixa {q.titulo} {idx === 0 && '(Obrigatória)'}
                </span>
                <span className="text-xs font-bold text-[#8C6527]">EVA: {q.eva}/10</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <Label className="text-gray-600">Descrição da Queixa</Label>
                  <Input
                    value={q.queixa}
                    onChange={(e) => handleQueixaChange(idx, 'queixa', e.target.value)}
                    placeholder="Ex: Dor na face anterior do ombro D..."
                    className="mt-1 h-9 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-600">Desde Quando</Label>
                  <Input
                    value={q.desde_quando}
                    onChange={(e) => handleQueixaChange(idx, 'desde_quando', e.target.value)}
                    placeholder="Ex: 3 semanas, 2 anos..."
                    className="mt-1 h-9 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-600">Tipo de Dor / Sintoma</Label>
                  <Input
                    value={q.tipo}
                    onChange={(e) => handleQueixaChange(idx, 'tipo', e.target.value)}
                    placeholder="Queimação, pontada, pressão, aperto..."
                    className="mt-1 h-9 rounded-xl bg-white"
                  />
                </div>

                {/* EVA Slider */}
                <div className="sm:col-span-2 lg:col-span-4 p-3 rounded-xl bg-white border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      Escala Visual Analógica (EVA) de Dor (0 a 10)
                    </span>
                    <span className="font-bold text-sm text-[#8C6527]">{q.eva} / 10</span>
                  </div>
                  <Slider
                    value={[q.eva]}
                    max={10}
                    step={1}
                    onValueChange={(vals) => handleQueixaChange(idx, 'eva', vals[0])}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>0 - Sem dor</span>
                    <span>5 - Dor moderada</span>
                    <span>10 - Pior dor imaginável</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-gray-600">Pior Momento do Dia</Label>
                  <Input
                    value={q.pior_momento_dia}
                    onChange={(e) => handleQueixaChange(idx, 'pior_momento_dia', e.target.value)}
                    placeholder="Ex: Ao acordar, no fim da tarde, à noite..."
                    className="mt-1 h-9 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-600">Movimento que Piora a Dor</Label>
                  <Input
                    value={q.movimento_piora}
                    onChange={(e) => handleQueixaChange(idx, 'movimento_piora', e.target.value)}
                    placeholder="Elevação acima da cabeça, agachar..."
                    className="mt-1 h-9 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-600">O que Alivia a Dor</Label>
                  <Input
                    value={q.o_que_alivia}
                    onChange={(e) => handleQueixaChange(idx, 'o_que_alivia', e.target.value)}
                    placeholder="Gelo, repouso, calor, alongamento..."
                    className="mt-1 h-9 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* (D) Histórico */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-gray-900 pb-2 border-b border-[#E9E1D2]">
          (d) Histórico Médico, Traumas e Cirurgias
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <Label className="text-gray-600">Acidentes / Traumas</Label>
            <Textarea
              rows={2}
              value={anamnese.acidentes_traumas || ''}
              onChange={(e) => handleAnamneseChange('acidentes_traumas', e.target.value)}
              placeholder="Quedas, fraturas, entorses, acidentes automobilísticos..."
              className="mt-1 rounded-xl text-xs"
            />
          </div>
          <div>
            <Label className="text-gray-600">Atividade Física Prévia / Atual</Label>
            <Textarea
              rows={2}
              value={anamnese.atividade_fisica || ''}
              onChange={(e) => handleAnamneseChange('atividade_fisica', e.target.value)}
              placeholder="Frequência, intensidade, modalidades esportivas..."
              className="mt-1 rounded-xl text-xs"
            />
          </div>
          <div>
            <Label className="text-gray-600">Cirurgias Prévias</Label>
            <Textarea
              rows={2}
              value={anamnese.cirurgias || ''}
              onChange={(e) => handleAnamneseChange('cirurgias', e.target.value)}
              placeholder="Procedimentos cirúrgicos realizados e ano..."
              className="mt-1 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* (E) Vísceras e Questões Sistêmicas */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
          <Heart className="h-5 w-5 text-[#8C6527]" />
          <div>
            <h4 className="text-base font-bold text-gray-900">
              (e) Vísceras & Questões Sistêmicas
            </h4>
            <span className="text-[11px] text-gray-500">
              Rastreamento de sintomas autonômicos e possíveis dores referidas somatovisceral
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          {[
            { key: 'esofago', label: 'Esôfago' },
            { key: 'estomago', label: 'Estômago (Refluxo/Gastrite)' },
            { key: 'intestino', label: 'Intestino (Constipação/Diarreia)' },
            { key: 'coracao', label: 'Coração / PA' },
            { key: 'pulmao', label: 'Pulmão / Respiração' },
            { key: 'rim', label: 'Rim / Cálculo' },
            { key: 'bexiga', label: 'Bexiga' },
            { key: 'prostata_utero_ovario', label: 'Próstata / Útero / Ovário' },
            { key: 'figado', label: 'Fígado' },
            { key: 'vesicula', label: 'Vesícula' },
            { key: 'pancreas', label: 'Pâncreas' },
            { key: 'tireoide', label: 'Tireoide' },
            { key: 'olhos', label: 'Olhos / Visão' },
            { key: 'dente', label: 'Dentes / ATM / Mordida' },
            { key: 'ites', label: '“Ites” (Tendinites/Sinusites)' },
            { key: 'endocrina', label: 'Endócrina / Diabetes' },
            { key: 'alergias', label: 'Alergias' },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <Label className="text-[11px] text-gray-600 line-clamp-1" title={item.label}>
                {item.label}
              </Label>
              <Input
                value={(visceras as any)[item.key] || ''}
                onChange={(e) =>
                  handleVisceraChange(item.key as keyof ViscerasSistemicas, e.target.value)
                }
                placeholder="Normal / alterações..."
                className="h-8 text-xs rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>

      {/* (F) Hábitos de Saúde e Estilo de Vida */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
          <Moon className="h-5 w-5 text-[#8C6527]" />
          <h4 className="text-base font-bold text-gray-900">(f) Estado de Saúde Geral e Hábitos</h4>
        </div>

        {/* Sono */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
            Qualidade do Sono
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <Label className="text-gray-600">Horas por Noite</Label>
              <Input
                type="number"
                step="0.5"
                value={habitos.sono_horas || ''}
                onChange={(e) => handleHabitoChange('sono_horas', e.target.value)}
                placeholder="Ex: 7.5"
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Qualidade Geral</Label>
              <Input
                value={habitos.sono_qualidade || ''}
                onChange={(e) => handleHabitoChange('sono_qualidade', e.target.value)}
                placeholder="Reparador, agitado, insônia..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Como Acorda</Label>
              <Input
                value={habitos.sono_como_acorda || ''}
                onChange={(e) => handleHabitoChange('sono_como_acorda', e.target.value)}
                placeholder="Disposto, cansado, com dor..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Ao Longo do Dia</Label>
              <Input
                value={habitos.sono_ao_longo_dia || ''}
                onChange={(e) => handleHabitoChange('sono_ao_longo_dia', e.target.value)}
                placeholder="Energia estável, sonolência..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
          </div>
        </div>

        {/* Alimentação e Consumo */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <Coffee className="h-4 w-4 text-[#8C6527]" />
            <span>Alimentação e Ingestão</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <Label className="text-gray-600">Café da Manhã</Label>
              <Input
                value={habitos.refeicoes_cafe || ''}
                onChange={(e) => handleHabitoChange('refeicoes_cafe', e.target.value)}
                placeholder="O que consome..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Lanche da Manhã</Label>
              <Input
                value={habitos.refeicoes_lanche_manha || ''}
                onChange={(e) => handleHabitoChange('refeicoes_lanche_manha', e.target.value)}
                placeholder="O que consome..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Almoço</Label>
              <Input
                value={habitos.refeicoes_almoco || ''}
                onChange={(e) => handleHabitoChange('refeicoes_almoco', e.target.value)}
                placeholder="Padrão alimentar..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Lanche da Tarde</Label>
              <Input
                value={habitos.refeicoes_lanche_tarde || ''}
                onChange={(e) => handleHabitoChange('refeicoes_lanche_tarde', e.target.value)}
                placeholder="O que consome..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Jantar</Label>
              <Input
                value={habitos.refeicoes_jantar || ''}
                onChange={(e) => handleHabitoChange('refeicoes_jantar', e.target.value)}
                placeholder="Padrão do jantar..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div>
              <Label className="text-gray-600">Água (Litros/dia)</Label>
              <Input
                value={habitos.agua || ''}
                onChange={(e) => handleHabitoChange('agua', e.target.value)}
                placeholder="Ex: 2 a 3 litros"
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Açúcar / Doces</Label>
              <Input
                value={habitos.acucar || ''}
                onChange={(e) => handleHabitoChange('acucar', e.target.value)}
                placeholder="Baixo, moderado, compulsivo..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Bebida Alcoólica</Label>
              <Input
                value={habitos.bebida_alcoolica || ''}
                onChange={(e) => handleHabitoChange('bebida_alcoolica', e.target.value)}
                placeholder="Frequência e tipo..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
          </div>
        </div>

        {/* Estresse e Rotina */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
            Nível de Stress (Baixo / Médio / Alto)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <Label className="text-gray-600">No Trabalho</Label>
              <Input
                value={habitos.stress_trabalho || ''}
                onChange={(e) => handleHabitoChange('stress_trabalho', e.target.value)}
                placeholder="Ex: Alto (prazos, carga excessiva)..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">Na Família / Relacionamentos</Label>
              <Input
                value={habitos.stress_familia || ''}
                onChange={(e) => handleHabitoChange('stress_familia', e.target.value)}
                placeholder="Ex: Médio / Baixo..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
            <div>
              <Label className="text-gray-600">
                Pessoal (Autocobrança / Julgamento / Realização)
              </Label>
              <Input
                value={habitos.stress_pessoal || ''}
                onChange={(e) => handleHabitoChange('stress_pessoal', e.target.value)}
                placeholder="Ex: Alta autocobrança e perfeccionismo..."
                className="mt-1 h-9 rounded-xl bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
