import { useEffect, useMemo, useState } from 'react'
import { Activity, ClipboardList, Droplets, Moon, Stethoscope, Utensils } from 'lucide-react'
import type { SaudeRegistroTipo } from '@/services/saudeBemEstar'

/** Ícones por tipo de registro — compartilhado entre visão geral e individual. */
export const ICONES_TIPO: Record<SaudeRegistroTipo, typeof Activity> = {
  atividade_fisica: Activity,
  sono: Moon,
  bebida: Droplets,
  alimento: Utensils,
  exame: Stethoscope,
  sintoma: ClipboardList,
}

interface Props {
  porTipo: Partial<Record<SaudeRegistroTipo, number>>
  icones?: Record<SaudeRegistroTipo, typeof Activity>
}

export function SaudeResumoIcones({ porTipo, icones = ICONES_TIPO }: Props) {
  const itens = (Object.keys(porTipo) as SaudeRegistroTipo[]).filter((t) => (porTipo[t] || 0) > 0)
  if (itens.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-3">
      {itens.map((t) => {
        const Icone = icones[t]
        return (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-xs text-[#73574A]"
            title={`${itens.length ? '' : ''}${t}`}
          >
            <Icone className="h-3.5 w-3.5 text-[#C9A46A]" />
            {porTipo[t]}
          </span>
        )
      })}
    </div>
  )
}

export default SaudeResumoIcones
