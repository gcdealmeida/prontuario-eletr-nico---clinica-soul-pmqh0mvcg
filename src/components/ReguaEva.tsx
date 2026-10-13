import React from 'react'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export interface EvaConfig {
  label: string
  faixa: 'sem_dor' | 'leve' | 'moderada' | 'intensa'
  bgBadge: string
  textBadge: string
  borderBadge: string
  borderCard: string
  colorHex: string
}

export function getEvaConfig(valor: number | null | undefined): EvaConfig {
  if (valor === null || valor === undefined) {
    return {
      label: 'Não informada',
      faixa: 'sem_dor',
      bgBadge: 'bg-gray-100',
      textBadge: 'text-gray-700',
      borderBadge: 'border-gray-200',
      borderCard: 'border-gray-200',
      colorHex: '#9ca3af',
    }
  }

  const v = Math.round(valor)
  if (v === 0) {
    return {
      label: 'Sem dor',
      faixa: 'sem_dor',
      bgBadge: 'bg-emerald-50',
      textBadge: 'text-emerald-800',
      borderBadge: 'border-emerald-200',
      borderCard: 'border-emerald-300',
      colorHex: '#10b981',
    }
  }
  if (v <= 3) {
    return {
      label: 'Dor leve',
      faixa: 'leve',
      bgBadge: 'bg-emerald-50',
      textBadge: 'text-emerald-800',
      borderBadge: 'border-emerald-200',
      borderCard: 'border-emerald-400',
      colorHex: '#059669',
    }
  }
  if (v <= 6) {
    return {
      label: 'Dor moderada',
      faixa: 'moderada',
      bgBadge: 'bg-amber-50',
      textBadge: 'text-amber-800',
      borderBadge: 'border-amber-300',
      borderCard: 'border-amber-400',
      colorHex: '#d97706',
    }
  }
  return {
    label: 'Dor intensa',
    faixa: 'intensa',
    bgBadge: 'bg-rose-50',
    textBadge: 'text-rose-800',
    borderBadge: 'border-rose-300',
    borderCard: 'border-rose-400',
    colorHex: '#e11d48',
  }
}

interface ReguaEvaProps {
  value: number | null | undefined
  onChange: (val: number | null) => void
  disabled?: boolean
  referenciaAnterior?: {
    valor: number
    data: string
  } | null
  className?: string
}

export const ReguaEva: React.FC<ReguaEvaProps> = ({
  value,
  onChange,
  disabled = false,
  referenciaAnterior,
  className = '',
}) => {
  const currentVal = typeof value === 'number' ? Math.max(0, Math.min(10, value)) : null
  const config = getEvaConfig(currentVal)

  const handleSliderChange = (vals: number[]) => {
    if (disabled) return
    const v = vals[0]
    onChange(typeof v === 'number' ? v : null)
  }

  const handleButtonClick = (num: number) => {
    if (disabled) return
    onChange(num)
  }

  const handleLimpar = () => {
    if (disabled) return
    onChange(null)
  }

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 bg-gradient-to-b from-[#FAF5EE]/70 to-white transition-all ${
        currentVal !== null ? config.borderCard : 'border-[#E9E1D2]'
      } shadow-2xs ${className}`}
    >
      {/* Cabeçalho da Régua */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            EVA
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#4A322A]">
                Escala Visual Analógica de Dor
              </span>
              <span className="text-[10px] text-gray-500 hidden sm:inline">(0 a 10)</span>
            </div>
            <p className="text-[10px] text-gray-500">
              Classifique o nível de dor relatado pelo paciente nesta sessão
            </p>
          </div>
        </div>

        {/* Indicador de Valor / Badge */}
        <div className="flex items-center gap-2">
          {currentVal !== null ? (
            <div className="flex items-center gap-1.5">
              <Badge
                className={`${config.bgBadge} ${config.textBadge} ${config.borderBadge} border text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1`}
              >
                <span className="text-sm font-black">{currentVal}</span>
                <span className="text-[10px] opacity-80">/ 10</span>
                <span className="text-[11px] font-semibold ml-0.5">• {config.label}</span>
              </Badge>

              {!disabled && (
                <button
                  type="button"
                  onClick={handleLimpar}
                  title="Limpar seleção de EVA"
                  className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-gray-500 italic bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              Não avaliada nesta sessão
            </span>
          )}
        </div>
      </div>

      {/* Régua Interativa: Botões 0 a 10 com cores gradativas */}
      <div
        className="grid grid-cols-11 gap-1 sm:gap-1.5 my-2.5"
        role="radiogroup"
        aria-label="Escala Visual Analógica de Dor de 0 a 10"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
          const isSelected = currentVal === num
          // Cores por faixa
          let colorClasses = ''
          if (num === 0) {
            colorClasses = isSelected
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
          } else if (num <= 3) {
            colorClasses = isSelected
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
              : 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
          } else if (num <= 6) {
            colorClasses = isSelected
              ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-300'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
          } else {
            colorClasses = isSelected
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300'
              : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border-rose-200'
          }

          return (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => handleButtonClick(num)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`EVA ${num}`}
              className={`h-9 sm:h-10 rounded-xl font-bold text-xs sm:text-sm border transition-all flex flex-col items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A46A] disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses} ${
                isSelected ? 'scale-105 z-10' : ''
              }`}
            >
              <span>{num}</span>
            </button>
          )
        })}
      </div>

      {/* Slider contínuo de suporte acessível */}
      <div className="px-1 pt-1 pb-1">
        <Slider
          value={[currentVal ?? 0]}
          min={0}
          max={10}
          step={1}
          disabled={disabled}
          onValueChange={handleSliderChange}
          className="cursor-pointer py-1"
          aria-label="Ajustar EVA de 0 a 10"
        />
      </div>

      {/* Legenda das faixas SOUL */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 px-1">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          <strong className="text-emerald-800">0</strong> = Sem dor
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
          <strong className="text-emerald-800">1–3</strong> = Leve
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
          <strong className="text-amber-800">4–6</strong> = Moderada
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
          <strong className="text-rose-800">7–10</strong> = Intensa
        </span>
      </div>

      {/* Referência da última EVA registrada do paciente (para agilizar) */}
      {referenciaAnterior && (
        <div className="mt-2.5 pt-2 border-t border-[#E9E1D2]/70 flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#73574A] bg-[#FAF5EE]/60 px-2.5 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#8C6527] bg-[#EFE3CF] px-1.5 py-0.5 rounded">
              Referência anterior
            </span>
            <span>
              Última EVA registrada:{' '}
              <strong className="text-[#4A322A]">
                {referenciaAnterior.valor}/10 ({getEvaConfig(referenciaAnterior.valor).label})
              </strong>{' '}
              em {referenciaAnterior.data}
            </span>
          </div>

          {!disabled && currentVal !== referenciaAnterior.valor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(referenciaAnterior.valor)}
              className="h-6 px-2 text-[10px] text-[#8C6527] hover:text-[#4A322A] hover:bg-[#EFE3CF] rounded-md flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Manter último ({referenciaAnterior.valor})
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Chip/Badge compacto de EVA para ser exibido em cards de evolução, tabelas ou listas
 */
interface EvaBadgeProps {
  valor: number | null | undefined
  tamanho?: 'sm' | 'md' | 'lg'
  mostrarRotulo?: boolean
  className?: string
}

export const EvaBadge: React.FC<EvaBadgeProps> = ({
  valor,
  tamanho = 'md',
  mostrarRotulo = true,
  className = '',
}) => {
  if (valor === null || valor === undefined) return null

  const config = getEvaConfig(valor)
  const isSm = tamanho === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold ${config.bgBadge} ${config.textBadge} ${config.borderBadge} ${
        isSm ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5'
      } shadow-2xs ${className}`}
      title={`Nível de dor (Escala Visual Analógica): ${valor}/10 — ${config.label}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.colorHex }}
      />
      <span>EVA {valor}/10</span>
      {mostrarRotulo && (
        <span className="opacity-75 font-medium hidden sm:inline">• {config.label}</span>
      )}
    </span>
  )
}
