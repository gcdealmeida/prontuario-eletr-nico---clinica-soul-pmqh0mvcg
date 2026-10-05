import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, PieChart, Layers, ChevronDown, ChevronUp, Scale, Percent } from 'lucide-react'
import {
  PROTOCOLOS_CONFIG,
  TODAS_DOBRAS,
  calcularComposicaoCorporal,
  type ProtocoloDobras,
  type DobraKey,
  type Sexo,
} from '@/lib/personalPhysicalTest'

interface Etapa2PersonalComposicaoProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa2PersonalComposicao: React.FC<Etapa2PersonalComposicaoProps> = ({
  formData,
  onChange,
}) => {
  const comp = formData.composicao_corporal || {}
  const protocolo: ProtocoloDobras = comp.protocolo || 'Pollock 7 dobras'
  const formulaConversao: 'Siri' | 'Brozek' = comp.formula_conversao || 'Siri'
  const dobras: Record<string, number> = comp.dobras || {}
  const perimetros: Record<string, number> = comp.perimetros || {}

  const [mostrarPerimetros, setMostrarPerimetros] = useState(true)

  // Dados básicos vindos da etapa 1 ou formData
  const sexo: Sexo = formData.anamnese_personal?.sexo || 'M'
  const idade: number = Number(formData.anamnese_personal?.idade || 30)
  const pesoKg: number = Number(formData.peso || formData.anamnese_personal?.peso || 70)

  // Dobras necessárias para o protocolo selecionado
  const dobrasNecessarias = PROTOCOLOS_CONFIG[protocolo]?.dobrasNecessarias(sexo) || []

  // Calcular resultados em tempo real
  const resultadoCalc = calcularComposicaoCorporal({
    protocolo,
    dobras,
    sexo,
    idade,
    pesoKg,
    formulaConversao,
  })

  const updateDobra = (key: DobraKey, val: string) => {
    const num = val === '' ? 0 : parseFloat(val) || 0
    const updatedDobras = { ...dobras, [key]: num }

    const novosCalculos = calcularComposicaoCorporal({
      protocolo,
      dobras: updatedDobras,
      sexo,
      idade,
      pesoKg,
      formulaConversao,
    })

    const updatedComp = {
      ...comp,
      protocolo,
      formula_conversao: formulaConversao,
      dobras: updatedDobras,
      densidade_corporal: novosCalculos.densidadeCorporal,
      percentual_gordura: novosCalculos.percentualGordura,
      massa_gorda_kg: novosCalculos.massaGordaKg,
      massa_magra_kg: novosCalculos.massaMagraKg,
      peso_ideal_kg: novosCalculos.pesoIdealEstimadoKg,
      classificacao_gordura: novosCalculos.classificacaoGordura,
    }

    onChange('composicao_corporal', updatedComp)
    if (novosCalculos.percentualGordura !== null) {
      onChange('percentual_gordura', novosCalculos.percentualGordura)
    }
  }

  const updateProtocolo = (novoProtocolo: ProtocoloDobras) => {
    const novosCalculos = calcularComposicaoCorporal({
      protocolo: novoProtocolo,
      dobras,
      sexo,
      idade,
      pesoKg,
      formulaConversao,
    })

    const updatedComp = {
      ...comp,
      protocolo: novoProtocolo,
      densidade_corporal: novosCalculos.densidadeCorporal,
      percentual_gordura: novosCalculos.percentualGordura,
      massa_gorda_kg: novosCalculos.massaGordaKg,
      massa_magra_kg: novosCalculos.massaMagraKg,
      peso_ideal_kg: novosCalculos.pesoIdealEstimadoKg,
      classificacao_gordura: novosCalculos.classificacaoGordura,
    }
    onChange('composicao_corporal', updatedComp)
    if (novosCalculos.percentualGordura !== null) {
      onChange('percentual_gordura', novosCalculos.percentualGordura)
    }
  }

  const updatePerimetro = (key: string, val: string) => {
    const num = val === '' ? 0 : parseFloat(val) || 0
    const updatedPerim = { ...perimetros, [key]: num }
    onChange('composicao_corporal', { ...comp, perimetros: updatedPerim })

    if (key === 'cintura') onChange('circ_cintura', num)
    if (key === 'abdomen') onChange('circ_abdomen', num)
    if (key === 'quadril') onChange('circ_quadril', num)
  }

  // Soma das dobras do protocolo
  const somaDobrasProtocolo = dobrasNecessarias.reduce((acc, k) => acc + (dobras[k] || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              2. Composição Corporal & Antropometria (Physical Test)
            </h4>
            <p className="text-xs text-gray-500">
              Protocolos de dobras cutâneas com cálculo automático de densidade, % de gordura,
              massas magra/gorda e peso ideal
            </p>
          </div>
        </div>
      </div>

      {/* Seleção do Protocolo e Fórmula */}
      <div className="p-5 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#8C6527] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> Protocolo de Dobras Cutâneas *
            </Label>
            <Select value={protocolo} onValueChange={(v) => updateProtocolo(v as ProtocoloDobras)}>
              <SelectTrigger className="h-11 rounded-xl bg-white border-[#E9E1D2] text-xs sm:text-sm font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PROTOCOLOS_CONFIG).map((pKey) => (
                  <SelectItem key={pKey} value={pKey} className="text-xs sm:text-sm">
                    {PROTOCOLOS_CONFIG[pKey as ProtocoloDobras].nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-gray-500 mt-1">
              {PROTOCOLOS_CONFIG[protocolo]?.descricao}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Equação de Conversão de Densidade para %G
            </Label>
            <Select
              value={formulaConversao}
              onValueChange={(v) => {
                const updatedComp = { ...comp, formula_conversao: v }
                onChange('composicao_corporal', updatedComp)
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Siri">
                  Equação de Siri [ (4.95 / D - 4.50) * 100 ] - Padrão
                </SelectItem>
                <SelectItem value="Brozek">
                  Equação de Brozek [ (4.57 / D - 4.142) * 100 ]
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-[11px] text-[#8C6527] font-semibold mt-1">
              Fórmula ativa: {PROTOCOLOS_CONFIG[protocolo]?.formulaInfo}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Dobras Cutâneas (Exibe apenas as necessárias do protocolo com destaque) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <span>Medições de Dobras Cutâneas (em milímetros - mm)</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {dobrasNecessarias.length} dobras necessárias para {protocolo}
            </span>
          </Label>
          <span className="text-xs font-mono font-bold text-[#8C6527]">
            Σ Dobras = {somaDobrasProtocolo.toFixed(1)} mm
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {TODAS_DOBRAS.map((dobra) => {
            const isNecessaria = dobrasNecessarias.includes(dobra.key)
            const valorAtual = dobras[dobra.key] ?? ''

            return (
              <div
                key={dobra.key}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isNecessaria
                    ? 'bg-white border-[#E9E1D2] shadow-2xs hover:border-[#8C6527]'
                    : 'bg-gray-50/70 border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isNecessaria ? 'bg-[#FAF5EE] text-[#8C6527]' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {dobra.sigla}
                    </span>
                    <span className="text-xs font-bold text-gray-800">{dobra.label}</span>
                  </div>
                  {isNecessaria && (
                    <span className="text-[9px] font-semibold text-emerald-600 uppercase">
                      Obrigatória
                    </span>
                  )}
                </div>

                <div className="relative mt-2">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.0"
                    value={valorAtual}
                    onChange={(e) => updateDobra(dobra.key, e.target.value)}
                    className={`h-10 rounded-xl text-xs sm:text-sm font-mono pr-10 ${
                      isNecessaria
                        ? 'border-gray-200 focus-visible:ring-[#8C6527]'
                        : 'border-gray-200'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">
                    mm
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{dobra.descricao}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* PAINEL DE RESULTADOS CALCULADOS (CÁLCULOS EM TEMPO REAL) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FAF5EE] via-white to-[#FAF5EE] border-2 border-[#E9E1D2] shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#E9E1D2] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8C6527]" />
            <h5 className="font-bold text-gray-900 text-sm sm:text-base">
              Resultados da Análise de Composição Corporal (Physical Test)
            </h5>
          </div>
          <span className="text-xs font-bold text-[#8C6527] uppercase tracking-wider">
            Cálculo Automático em Tempo Real
          </span>
        </div>

        {/* 4 Cards de Métricas Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* % Gordura */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              % Gordura Corporal
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[#8C6527] font-mono">
                {resultadoCalc.percentualGordura !== null ? resultadoCalc.percentualGordura : '—'}
              </span>
              <span className="text-xs text-gray-500 font-bold">%</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              Densidade: {resultadoCalc.densidadeCorporal || '—'} g/cm³
            </span>
          </div>

          {/* Massa Gorda */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Massa Gorda (MG)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-700 font-mono">
                {resultadoCalc.massaGordaKg !== null ? resultadoCalc.massaGordaKg : '—'}
              </span>
              <span className="text-xs text-gray-500 font-bold">kg</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">Peso Atual: {pesoKg} kg</span>
          </div>

          {/* Massa Magra */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Massa Livre de Gordura (MLG)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {resultadoCalc.massaMagraKg !== null ? resultadoCalc.massaMagraKg : '—'}
              </span>
              <span className="text-xs text-gray-500 font-bold">kg</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">Músculos, ossos e vísceras</span>
          </div>

          {/* Peso Ideal Estimado */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Peso Ideal Alvo
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-blue-700 font-mono">
                {resultadoCalc.pesoIdealEstimadoKg !== null
                  ? resultadoCalc.pesoIdealEstimadoKg
                  : '—'}
              </span>
              <span className="text-xs text-gray-500 font-bold">kg</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              Meta ({sexo === 'M' ? '15%' : '22%'} %G)
            </span>
          </div>
        </div>

        {/* Tabela de Classificação do % de Gordura (Guedes & Guedes) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Classificação por Sexo e Faixa Etária (Guedes & Guedes)
            </span>
            {resultadoCalc.classificacaoGordura && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${resultadoCalc.classificacaoGordura.cor}`}
              >
                Paciente está em: {resultadoCalc.classificacaoGordura.categoria}
              </span>
            )}
          </div>

          {/* Comparativo de Faixas Coloridas */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-600 block font-bold uppercase">Atlético</span>
              <span className="font-bold text-blue-900 mt-0.5 block font-mono">
                {sexo === 'M' ? '< 12%' : '< 18%'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 ring-2 ring-emerald-500/20">
              <span className="text-[10px] text-emerald-700 block font-bold uppercase">
                Ideal / Bom
              </span>
              <span className="font-bold text-emerald-900 mt-0.5 block font-mono">
                {sexo === 'M' ? '12% – 16%' : '18% – 24%'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-700 block font-bold uppercase">Médio</span>
              <span className="font-bold text-amber-900 mt-0.5 block font-mono">
                {sexo === 'M' ? '16.1% – 20%' : '24.1% – 28%'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
              <span className="text-[10px] text-orange-700 block font-bold uppercase">
                Sobrepeso
              </span>
              <span className="font-bold text-orange-900 mt-0.5 block font-mono">
                {sexo === 'M' ? '20.1% – 25%' : '28.1% – 33%'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
              <span className="text-[10px] text-red-700 block font-bold uppercase">Obesidade</span>
              <span className="font-bold text-red-900 mt-0.5 block font-mono">
                {sexo === 'M' ? '> 25%' : '> 33%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Perímetros e Circunferências Opcionais */}
      <div className="space-y-4 pt-2">
        <div
          onClick={() => setMostrarPerimetros(!mostrarPerimetros)}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all border border-gray-100"
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#8C6527]" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Perímetros / Circunferências Corporais (Opcionais - cm)
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            {mostrarPerimetros ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {mostrarPerimetros && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 rounded-2xl border border-gray-100 bg-white animate-fade-in">
            {[
              { key: 'torax', label: 'Tórax' },
              { key: 'cintura', label: 'Cintura' },
              { key: 'abdomen', label: 'Abdômen' },
              { key: 'quadril', label: 'Quadril' },
              { key: 'braco_d_relaxado', label: 'Braço D. (Relaxado)' },
              { key: 'braco_e_relaxado', label: 'Braço E. (Relaxado)' },
              { key: 'braco_d_contraido', label: 'Braço D. (Contraído)' },
              { key: 'braco_e_contraido', label: 'Braço E. (Contraído)' },
              { key: 'antebraco_d', label: 'Antebraço D.' },
              { key: 'antebraco_e', label: 'Antebraço E.' },
              { key: 'coxa_d', label: 'Coxa Direita' },
              { key: 'coxa_e', label: 'Coxa Esquerda' },
              { key: 'panturrilha_d', label: 'Panturrilha D.' },
              { key: 'panturrilha_e', label: 'Panturrilha E.' },
            ].map((p) => (
              <div key={p.key} className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-600">{p.label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="0.0"
                    value={perimetros[p.key] ?? ''}
                    onChange={(e) => updatePerimetro(p.key, e.target.value)}
                    className="h-9 rounded-xl border-gray-200 text-xs font-mono pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-mono">
                    cm
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
