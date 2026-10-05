import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Shield, Sparkles, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { calcularMcGillIndices } from '@/lib/personalPhysicalTest'

interface Etapa6PersonalCoreProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa6PersonalCore: React.FC<Etapa6PersonalCoreProps> = ({ formData, onChange }) => {
  const mcgill = formData.core_mcgill || {}

  const pranchaVentral = mcgill.prancha_ventral_seg ?? ''
  const pranchaLatD = mcgill.prancha_lat_d_seg ?? ''
  const pranchaLatE = mcgill.prancha_lat_e_seg ?? ''
  const bieringExtensao = mcgill.extensao_biering_seg ?? ''
  const flexaoTronco = mcgill.flexao_tronco_seg ?? ''

  // Cálculos automáticos dos índices de equilíbrio de McGill
  const mcgillCalculos = calcularMcGillIndices({
    flexaoTroncoSeg: Number(flexaoTronco),
    extensaoBieringSeg: Number(bieringExtensao),
    pranchaLatDirSeg: Number(pranchaLatD),
    pranchaLatEsqSeg: Number(pranchaLatE),
  })

  const updateSubfield = (field: string, val: string) => {
    const num = val === '' ? '' : parseFloat(val) || 0
    const updated = {
      ...mcgill,
      [field]: num,
    }

    const novosCalculos = calcularMcGillIndices({
      flexaoTroncoSeg:
        field === 'flexao_tronco_seg' ? Number(num) : Number(updated.flexao_tronco_seg),
      extensaoBieringSeg:
        field === 'extensao_biering_seg' ? Number(num) : Number(updated.extensao_biering_seg),
      pranchaLatDirSeg:
        field === 'prancha_lat_d_seg' ? Number(num) : Number(updated.prancha_lat_d_seg),
      pranchaLatEsqSeg:
        field === 'prancha_lat_e_seg' ? Number(num) : Number(updated.prancha_lat_e_seg),
    })

    updated.razao_flexao_extensao = novosCalculos.razaoFlexaoExtensao
    updated.razao_lat_extensao = novosCalculos.razaoLateralExtensao
    updated.razao_lat_d_e = novosCalculos.razaoLateralD_E
    updated.alertas = novosCalculos.alertas

    onChange('core_mcgill', updated)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              6. Testes Funcionais de Core — McGill Torso Endurance
            </h4>
            <p className="text-xs text-gray-500">
              Avaliação de resistência isométrica (tempo em segundos) e cálculo dos índices de
              equilíbrio de McGill
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Inputs de Tempo (segundos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Prancha Ventral */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-800">Prancha Ventral Isométrica</Label>
            <Clock className="h-4 w-4 text-[#8C6527]" />
          </div>
          <div className="relative">
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 60"
              value={pranchaVentral}
              onChange={(e) => updateSubfield('prancha_ventral_seg', e.target.value)}
              className="h-10 rounded-xl text-xs sm:text-sm font-mono pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">seg</span>
          </div>
          <p className="text-[10px] text-gray-400">Resistência estabilizadora anterior</p>
        </div>

        {/* Extensão de Tronco (Biering-Sørensen) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-800">Extensão de Tronco (Sørensen)</Label>
            <Clock className="h-4 w-4 text-[#8C6527]" />
          </div>
          <div className="relative">
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 90"
              value={bieringExtensao}
              onChange={(e) => updateSubfield('extensao_biering_seg', e.target.value)}
              className="h-10 rounded-xl text-xs sm:text-sm font-mono pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">seg</span>
          </div>
          <p className="text-[10px] text-gray-400">
            Extensores paravertebrais / eretores da espinha
          </p>
        </div>

        {/* Flexão de Tronco (60°) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-800">Flexão de Tronco a 60°</Label>
            <Clock className="h-4 w-4 text-[#8C6527]" />
          </div>
          <div className="relative">
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 75"
              value={flexaoTronco}
              onChange={(e) => updateSubfield('flexao_tronco_seg', e.target.value)}
              className="h-10 rounded-xl text-xs sm:text-sm font-mono pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">seg</span>
          </div>
          <p className="text-[10px] text-gray-400">Flexores abdominais e cadeia anterior</p>
        </div>

        {/* Prancha Lateral Direita */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-800">Prancha Lateral Direita</Label>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="relative">
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 45"
              value={pranchaLatD}
              onChange={(e) => updateSubfield('prancha_lat_d_seg', e.target.value)}
              className="h-10 rounded-xl text-xs sm:text-sm font-mono pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">seg</span>
          </div>
          <p className="text-[10px] text-gray-400">Quadrado lombar e oblíquos D.</p>
        </div>

        {/* Prancha Lateral Esquerda */}
        <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-800">Prancha Lateral Esquerda</Label>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="relative">
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 42"
              value={pranchaLatE}
              onChange={(e) => updateSubfield('prancha_lat_e_seg', e.target.value)}
              className="h-10 rounded-xl text-xs sm:text-sm font-mono pr-12"
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">seg</span>
          </div>
          <p className="text-[10px] text-gray-400">Quadrado lombar e oblíquos E.</p>
        </div>
      </div>

      {/* PAINEL DE ÍNDICES DE EQUILÍBRIO DE MCGILL */}
      <div className="p-6 rounded-3xl bg-[#FAF5EE] border-2 border-[#E9E1D2] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E9E1D2] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8C6527]" />
            <h5 className="font-bold text-gray-900 text-sm">
              Índices de Equilíbrio Muscular de McGill (Valores de Referência)
            </h5>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              mcgillCalculos.equilibrado
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {mcgillCalculos.equilibrado ? 'Core Equilibrado' : 'Assimetrias / Desequilíbrio'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Razão Flexão / Extensão */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Razão Flexores / Extensores
            </span>
            <div className="text-2xl font-black font-mono text-gray-900 mt-1">
              {mcgillCalculos.razaoFlexaoExtensao !== null
                ? mcgillCalculos.razaoFlexaoExtensao
                : '—'}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold">
              Padrão ideal: <strong>&lt; 1,0</strong> (ideal ~0,75 a 1,0)
            </p>
          </div>

          {/* Razão Lateral / Extensão */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Razão Ponte Lateral / Extensão
            </span>
            <div className="text-2xl font-black font-mono text-gray-900 mt-1">
              {mcgillCalculos.razaoLateralExtensao !== null
                ? mcgillCalculos.razaoLateralExtensao
                : '—'}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold">
              Padrão ideal: <strong>&lt; 0,75</strong> (ideal ~0,40 a 0,70)
            </p>
          </div>

          {/* Razão Lateral D / Lateral E */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Equilíbrio Lateral (D / E)
            </span>
            <div className="text-2xl font-black font-mono text-gray-900 mt-1">
              {mcgillCalculos.razaoLateralD_E !== null ? mcgillCalculos.razaoLateralD_E : '—'}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold">
              Padrão ideal: <strong>0,85 a 1,15</strong> (diferença &lt; 15%)
            </p>
          </div>
        </div>

        {/* Alertas clínicos se fora dos padrões */}
        {mcgillCalculos.alertas.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Alertas de Desequilíbrio de Core:
            </div>
            <ul className="list-disc list-inside text-xs text-amber-900 space-y-0.5">
              {mcgillCalculos.alertas.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Observações de Core */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          Observações Funcionais de Core
        </Label>
        <Textarea
          rows={3}
          placeholder="Tremores compensatórios, perda de ativação de glúteos na prancha, queixas álgicas lombares..."
          value={mcgill.observacoes || ''}
          onChange={(e) => updateSubfield('observacoes', e.target.value)}
          className="rounded-xl border-gray-200 text-xs sm:text-sm"
        />
      </div>
    </div>
  )
}
