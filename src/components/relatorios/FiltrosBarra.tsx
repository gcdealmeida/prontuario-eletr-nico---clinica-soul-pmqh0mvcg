/**
 * Barra de filtros do Painel de Relatórios do gestor (/relatorios):
 * período (preset + datas), profissional, serviço e programa.
 * Serviço e programa filtram de verdade (campos `servico`/`programa` em
 * `presencas`, migration 0065) — presenças antigas sem esses campos ficam fora.
 */
import { CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LABELS_PRESET } from '@/lib/relatoriosAdmin'
import type { PresetPeriodo } from '@/lib/relatoriosAdmin'

export interface FiltrosState {
  preset: PresetPeriodo
  inicio: string // YYYY-MM-DD
  fim: string // YYYY-MM-DD
  profissional: string // 'todos' ou user id
  servico: string // 'todos' ou nome do serviço
  programa: string // 'todos' ou nome do programa
}

export const iniciaisFiltros: FiltrosState = {
  preset: 'mes',
  inicio: '',
  fim: '',
  profissional: 'todos',
  servico: 'todos',
  programa: 'todos',
}

interface ProfissionalOpcao {
  id: string
  nome: string
}

interface Props {
  filtros: FiltrosState
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosState>>
  areas: string[]
  profissionais: ProfissionalOpcao[]
  programas: string[]
}

export function FiltrosBarra({ filtros, setFiltros, areas, profissionais, programas }: Props) {
  const set = <K extends keyof FiltrosState>(campo: K, valor: FiltrosState[K]) =>
    setFiltros((f) => ({ ...f, [campo]: valor }))

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-[#73574A]" />
        <p className="text-xs font-bold uppercase tracking-wider text-[#73574A]">
          Filtros do painel
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Período
          </Label>
          <Select value={filtros.preset} onValueChange={(v) => set('preset', v as PresetPeriodo)}>
            <SelectTrigger className="h-9 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(LABELS_PRESET) as PresetPeriodo[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {LABELS_PRESET[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            De
          </Label>
          <Input
            type="date"
            value={filtros.inicio}
            max={filtros.fim || undefined}
            onChange={(e) => set('inicio', e.target.value)}
            className="h-9 bg-white text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Até
          </Label>
          <Input
            type="date"
            value={filtros.fim}
            min={filtros.inicio || undefined}
            onChange={(e) => set('fim', e.target.value)}
            className="h-9 bg-white text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Profissional
          </Label>
          <Select value={filtros.profissional} onValueChange={(v) => set('profissional', v)}>
            <SelectTrigger className="h-9 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {profissionais.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Serviço
          </Label>
          <Select value={filtros.servico} onValueChange={(v) => set('servico', v)}>
            <SelectTrigger className="h-9 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Programa
          </Label>
          <Select value={filtros.programa} onValueChange={(v) => set('programa', v)}>
            <SelectTrigger className="h-9 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {programas.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
