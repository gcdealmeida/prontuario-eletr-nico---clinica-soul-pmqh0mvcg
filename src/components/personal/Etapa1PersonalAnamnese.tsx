import React, { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Activity, Heart, Scale, Ruler, AlertCircle, Phone, Mail, MapPin } from 'lucide-react'
import { formatCPF, formatTelefone } from '@/lib/constants'
import { formatarEnderecoCompleto } from '@/services/pacientes'
import {
  calcularIMC,
  calcularRCQ,
  classificarPerimetroAbdominal,
  type Sexo,
} from '@/lib/personalPhysicalTest'
import type { PacienteRecord } from '@/types/database'

interface Etapa1PersonalAnamneseProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  paciente?: PacienteRecord
}

export const Etapa1PersonalAnamnese: React.FC<Etapa1PersonalAnamneseProps> = ({
  formData,
  onChange,
  paciente,
}) => {
  const anamnese = formData.anamnese_personal || {}

  // Auto-calcular idade com base na data de nascimento do paciente se disponível
  const calcularIdade = (dataNasc?: string): number => {
    if (!dataNasc) return anamnese.idade || 30
    const diff = Date.now() - new Date(dataNasc).getTime()
    const ageDt = new Date(diff)
    return Math.abs(ageDt.getUTCFullYear() - 1970)
  }

  const idadeCalculada = calcularIdade(paciente?.data_nascimento)
  const sexo: Sexo = anamnese.sexo || 'M'
  const peso = Number(anamnese.peso ?? formData.peso ?? 70)
  const altura = Number(anamnese.altura ?? formData.altura ?? 1.75)
  const cintura = Number(anamnese.circ_cintura ?? formData.circ_cintura ?? 0)
  const quadril = Number(anamnese.circ_quadril ?? formData.circ_quadril ?? 0)
  const abdomen = Number(anamnese.circ_abdomen ?? formData.circ_abdomen ?? 0)
  const fcRepouso = anamnese.fc_repouso ?? ''
  const pressaoArterial = anamnese.pressao_arterial ?? ''

  // Cálculos em tempo real
  const imcResult = calcularIMC(peso, altura)
  const rcqResult = calcularRCQ(cintura, quadril, sexo)
  const perimAbdomenResult = classificarPerimetroAbdominal(abdomen, sexo)

  const updateSubfield = (field: string, value: any) => {
    const updated = {
      ...anamnese,
      [field]: value,
    }

    // Manter sincronizado com campos de topo legados
    if (field === 'peso') onChange('peso', value)
    if (field === 'altura') onChange('altura', value)
    if (field === 'circ_cintura') onChange('circ_cintura', value)
    if (field === 'circ_quadril') onChange('circ_quadril', value)
    if (field === 'circ_abdomen') onChange('circ_abdomen', value)

    if (imcResult) {
      updated.imc = imcResult.valor
      updated.classificacao_imc = imcResult.classificacao
      onChange('imc', imcResult.valor)
    }

    if (rcqResult) {
      updated.rcq = rcqResult.valor
      updated.classificacao_rcq = rcqResult.risco
    }

    onChange('anamnese_personal', updated)
  }

  useEffect(() => {
    if (!anamnese.idade && idadeCalculada) {
      updateSubfield('idade', idadeCalculada)
    }
  }, [idadeCalculada])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título da Etapa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              1. Identificação, Antropometria Inicial & Anamnese
            </h4>
            <p className="text-xs text-gray-500">
              Dados demográficos, parâmetros vitais, IMC e Relação Cintura-Quadril com cálculos
              automáticos (OMS)
            </p>
          </div>
        </div>
      </div>

      {/* Dados do Paciente (Herdados) */}
      <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-gray-500 block">Nome do Aluno/Paciente</span>
            <span className="font-bold text-gray-900 text-sm">
              {paciente?.nome || 'Aluno SOUL'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">CPF</span>
            <span className="font-semibold font-mono text-gray-800">
              {paciente?.cpf ? formatCPF(paciente.cpf) : '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Data de Nasc. / Idade</span>
            <span className="font-semibold text-gray-800">
              {paciente?.data_nascimento
                ? `${new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')} (${anamnese.idade || idadeCalculada || '—'} anos)`
                : 'Não informada'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block flex items-center gap-1">
              <Phone className="h-3 w-3 text-[#8C6527]" /> Celular / WhatsApp
            </span>
            <span className="font-semibold font-mono text-gray-800">
              {paciente?.telefone ? formatTelefone(paciente.telefone) : '—'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E9E1D2]/70">
          <div>
            <span className="text-gray-500 block flex items-center gap-1">
              <Mail className="h-3 w-3 text-[#8C6527]" /> E-mail
            </span>
            <span className="font-semibold text-gray-800 truncate block">
              {paciente?.email || '—'}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-500 block flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#8C6527]" /> Endereço Residencial Completo
            </span>
            <span
              className="font-semibold text-gray-800 truncate block"
              title={(paciente && (formatarEnderecoCompleto(paciente) || paciente.endereco)) || '—'}
            >
              {(paciente && (formatarEnderecoCompleto(paciente) || paciente.endereco)) || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Dados de Perfil Biológico e Vitais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">
            Sexo Biológico (para equações) *
          </Label>
          <Select value={sexo} onValueChange={(val) => updateSubfield('sexo', val as Sexo)}>
            <SelectTrigger className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">
            Frequência Cardíaca de Repouso (bpm)
          </Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="Ex: 68"
              value={fcRepouso}
              onChange={(e) => updateSubfield('fc_repouso', e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm pr-12"
            />
            <Heart className="h-4 w-4 text-red-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">
            Pressão Arterial de Repouso (PA)
          </Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Ex: 120/80 mmHg"
              value={pressaoArterial}
              onChange={(e) => updateSubfield('pressao_arterial', e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm pr-12"
            />
            <Activity className="h-4 w-4 text-blue-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Medidas Básicas & Cards com Cálculos em Tempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Peso Corporal (kg) *</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={peso || ''}
              onChange={(e) => updateSubfield('peso', parseFloat(e.target.value) || 0)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
              placeholder="70.5"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">kg</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Altura Estatural (m) *</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={altura || ''}
              onChange={(e) => updateSubfield('altura', parseFloat(e.target.value) || 0)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
              placeholder="1.75"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">m</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Perímetro Cintura (cm)</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={cintura || ''}
              onChange={(e) => updateSubfield('circ_cintura', parseFloat(e.target.value) || 0)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
              placeholder="80.0"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">cm</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Perímetro Quadril (cm)</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={quadril || ''}
              onChange={(e) => updateSubfield('circ_quadril', parseFloat(e.target.value) || 0)}
              className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
              placeholder="98.0"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">cm</span>
          </div>
        </div>
      </div>

      {/* Perímetro Abdominal para Risco Metabólico */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          Perímetro Abdominal / Cicatriz Umbilical (cm)
        </Label>
        <div className="relative max-w-xs">
          <Input
            type="number"
            step="0.1"
            value={abdomen || ''}
            onChange={(e) => updateSubfield('circ_abdomen', parseFloat(e.target.value) || 0)}
            className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
            placeholder="85.0"
          />
          <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">cm</span>
        </div>
      </div>

      {/* RESULTADOS CALCULADOS EM TEMPO REAL (CARDS PHYSICAL TEST) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Card IMC */}
        <div
          className={`p-4 rounded-2xl border ${imcResult?.cor || 'bg-gray-50 border-gray-100'} transition-all`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
              <Scale className="h-3.5 w-3.5" /> IMC Automático (OMS)
            </span>
            <span className="text-lg font-black font-mono">
              {imcResult ? `${imcResult.valor} kg/m²` : '—'}
            </span>
          </div>
          <p className="text-xs font-semibold mt-1">
            {imcResult ? imcResult.classificacao : 'Aguardando peso e altura'}
          </p>
        </div>

        {/* Card RCQ */}
        <div
          className={`p-4 rounded-2xl border ${rcqResult?.cor || 'bg-gray-50 border-gray-100'} transition-all`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> RCQ Cintura/Quadril
            </span>
            <span className="text-lg font-black font-mono">
              {rcqResult ? rcqResult.valor : '—'}
            </span>
          </div>
          <p className="text-xs font-semibold mt-1">
            {rcqResult ? rcqResult.risco : 'Informe cintura e quadril'}
          </p>
        </div>

        {/* Card Risco Abdominal */}
        <div className="p-4 rounded-2xl border bg-gray-50/90 border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-[#8C6527]" /> Risco Circunf. Abdominal
            </span>
            <span className="text-xs font-mono font-bold text-gray-800">
              {abdomen ? `${abdomen} cm` : '—'}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-1">
            {perimAbdomenResult ? perimAbdomenResult.risco : 'Aguardando perímetro abdominal'}
          </p>
        </div>
      </div>

      {/* Histórico e Objetivos de Treino */}
      <div className="space-y-4 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Objetivo Principal do Aluno
            </Label>
            <Select
              value={formData.objetivo_principal || 'Condicionamento'}
              onValueChange={(val) => onChange('objetivo_principal', val)}
            >
              <SelectTrigger className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hipertrofia">Hipertrofia Muscular</SelectItem>
                <SelectItem value="Emagrecimento">Emagrecimento / Redução %G</SelectItem>
                <SelectItem value="Condicionamento">Condicionamento Cardiorrespiratório</SelectItem>
                <SelectItem value="Reabilitação">Reabilitação Funcional / Prevenção</SelectItem>
                <SelectItem value="Performance">Performance Atlética / Força</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Nível de Experiência com Treinamento
            </Label>
            <Select
              value={formData.nivel_experiencia || 'Intermediário'}
              onValueChange={(val) => onChange('nivel_experiencia', val)}
            >
              <SelectTrigger className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Iniciante">Iniciante (&lt; 6 meses)</SelectItem>
                <SelectItem value="Intermediário">Intermediário (6 meses a 2 anos)</SelectItem>
                <SelectItem value="Avançado">Avançado (&gt; 2 anos contínuos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">
            Histórico Clínico, Lesões Anteriores & Restrições Médicas
          </Label>
          <Textarea
            rows={3}
            placeholder="Cirurgias, dores articulares (ombro, joelho, coluna), hipertensão, diabetes, recomendações médicas..."
            value={formData.restricoes_treino || anamnese.historico_lesoes || ''}
            onChange={(e) => {
              onChange('restricoes_treino', e.target.value)
              updateSubfield('historico_lesoes', e.target.value)
            }}
            className="rounded-xl border-gray-200 text-xs sm:text-sm"
          />
        </div>
      </div>
    </div>
  )
}
