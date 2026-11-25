import React, { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarRange, CheckCircle2, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { ProgramaSemanaRecord, UnidadeDuracaoPrograma } from '@/types/database'
import { saveSemanaPeriodo } from '@/services/programas'

interface PainelPeriodizacaoAbaProps {
  programaId: string
  unidadeDuracao: UnidadeDuracaoPrograma
  totalPeriodos: number
  semanas: ProgramaSemanaRecord[]
  onSemanasChange: (semanas: ProgramaSemanaRecord[]) => void
}

interface LinhaSemana {
  indice: number
  rotulo: string
  carga: string
  horas: string
  cumprida: boolean
}

const GRID = '#E9E1D2'

export const PainelPeriodizacaoAba: React.FC<PainelPeriodizacaoAbaProps> = ({
  programaId,
  unidadeDuracao,
  totalPeriodos,
  semanas,
  onSemanasChange,
}) => {
  const singular = unidadeDuracao === 'dias' ? 'Dia' : unidadeDuracao === 'meses' ? 'Mês' : 'Semana'

  const [linhas, setLinhas] = useState<LinhaSemana[]>(() =>
    Array.from({ length: totalPeriodos }, (_, i) => {
      const s = semanas.find((w) => w.indice === i + 1)
      return {
        indice: i + 1,
        rotulo: s?.rotulo || '',
        carga: s?.carga_planejada_kg != null ? String(s.carga_planejada_kg) : '',
        horas: s?.horas_treino != null ? String(s.horas_treino) : '',
        cumprida: !!s?.cumprida,
      }
    }),
  )
  const [salvando, setSalvando] = useState(false)
  const [salvoEm, setSalvoEm] = useState<Date | null>(null)

  const atualizarLinha = (indice: number, patch: Partial<LinhaSemana>) => {
    setLinhas((prev) => prev.map((l) => (l.indice === indice ? { ...l, ...patch } : l)))
  }

  const adicionarSemana = () => {
    const proximo = linhas.length + 1
    setLinhas((prev) => [
      ...prev,
      { indice: proximo, rotulo: '', carga: '', horas: '', cumprida: false },
    ])
  }

  const removerUltima = () => {
    setLinhas((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      const salvas: ProgramaSemanaRecord[] = []
      for (const linha of linhas) {
        const existente = semanas.find((s) => s.indice === linha.indice)
        const rec = await saveSemanaPeriodo({
          programa_id: programaId,
          indice: linha.indice,
          rotulo: linha.rotulo.trim() || undefined,
          carga_planejada_kg: linha.carga.trim() === '' ? undefined : Number(linha.carga),
          horas_treino: linha.horas.trim() === '' ? undefined : Number(linha.horas),
          cumprida: linha.cumprida,
        })
        salvas.push(rec || existente || ({} as ProgramaSemanaRecord))
      }
      onSemanasChange(salvas.filter((s) => s.id))
      setSalvoEm(new Date())
    } finally {
      setSalvando(false)
    }
  }

  const dadosGrafico = useMemo(
    () =>
      linhas.map((l) => ({
        nome: `${l.indice}ª`,
        carga: l.carga.trim() === '' ? null : Number(l.carga) || 0,
        horas: l.horas.trim() === '' ? null : Number(l.horas) || 0,
        cumprida: l.cumprida,
      })),
    [linhas],
  )

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-[#8C6527]" />
            Programação {pluralSemanas(unidadeDuracao)} do programa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="pb-2 pr-2 font-bold">{singular}</th>
                  <th className="pb-2 pr-2 font-bold">Rótulo / Foco</th>
                  <th className="pb-2 pr-2 font-bold">Carga planejada (kg)</th>
                  <th className="pb-2 pr-2 font-bold">Horas de treino</th>
                  <th className="pb-2 pr-2 font-bold">Cumprida</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.indice} className="border-t border-gray-100">
                    <td className="py-2 pr-2 font-bold text-gray-800 whitespace-nowrap">
                      {l.indice}ª {singular.toLowerCase()}
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={l.rotulo}
                        onChange={(e) => atualizarLinha(l.indice, { rotulo: e.target.value })}
                        placeholder="Ex.: Base / Adaptação"
                        className="h-9"
                        aria-label={`Rótulo da ${l.indice}ª ${singular.toLowerCase()}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.5"
                        value={l.carga}
                        onChange={(e) => atualizarLinha(l.indice, { carga: e.target.value })}
                        className="h-9 w-28"
                        aria-label={`Carga da ${l.indice}ª ${singular.toLowerCase()}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.5"
                        value={l.horas}
                        onChange={(e) => atualizarLinha(l.indice, { horas: e.target.value })}
                        className="h-9 w-24"
                        aria-label={`Horas da ${l.indice}ª ${singular.toLowerCase()}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`cumprida-${l.indice}`}
                          checked={l.cumprida}
                          onCheckedChange={(v) =>
                            atualizarLinha(l.indice, { cumprida: v === true })
                          }
                        />
                        <Label
                          htmlFor={`cumprida-${l.indice}`}
                          className="text-xs text-gray-500 font-normal cursor-pointer"
                        >
                          Concluída
                        </Label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={adicionarSemana}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar {singular.toLowerCase()}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removerUltima}
              disabled={linhas.length <= 1}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Remover última
            </Button>
            <div className="flex-1" />
            {salvoEm && (
              <span className="text-xs text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Salvo às{' '}
                {salvoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button type="button" onClick={handleSalvar} disabled={salvando}>
              {salvando ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Salvar periodização
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Gráfico da periodização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis yAxisId="kg" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={44} />
                <YAxis
                  yAxisId="h"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  width={36}
                />
                <Tooltip
                  formatter={(value: number | null, name: string) => [
                    value == null ? '—' : value,
                    name === 'carga' ? 'Carga (kg)' : 'Horas',
                  ]}
                  labelFormatter={(label: string) => `${label} ${singular.toLowerCase()}`}
                />
                <Legend
                  formatter={(value: string) =>
                    value === 'carga' ? 'Carga (kg)' : 'Horas de treino'
                  }
                />
                <Bar
                  yAxisId="kg"
                  dataKey="carga"
                  fill="#C9A46A"
                  radius={[6, 6, 0, 0]}
                  name="carga"
                />
                <Line
                  yAxisId="h"
                  type="monotone"
                  dataKey="horas"
                  stroke="#1E2530"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="horas"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Barras: carga planejada (kg) por {singular.toLowerCase()} • Linha: horas de treino
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function pluralSemanas(unidade: UnidadeDuracaoPrograma): string {
  return unidade === 'dias' ? 'dos dias' : unidade === 'meses' ? 'dos meses' : 'das semanas'
}
