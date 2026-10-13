import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import { formatDataPTBR } from '@/lib/constants'
import type { EvolucaoRecord } from '@/types/database'
import { getEvaConfig } from './ReguaEva'
import { Activity, TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface TrajetoriaEvaGraficoProps {
  evolucoes: EvolucaoRecord[]
  className?: string
}

export const TrajetoriaEvaGrafico: React.FC<TrajetoriaEvaGraficoProps> = ({
  evolucoes,
  className = '',
}) => {
  // Filtrar apenas evoluções que possuem eva_dor definido
  const comEva = evolucoes
    .filter((e) => typeof e.eva_dor === 'number')
    .sort(
      (a, b) =>
        new Date(a.data_evolucao || a.created).getTime() -
        new Date(b.data_evolucao || b.created).getTime(),
    )

  if (comEva.length === 0) {
    return null
  }

  const dados = comEva.map((e) => {
    const dataIso = e.data_evolucao || e.created
    return {
      id: e.id,
      data: formatDataPTBR(dataIso),
      rawDate: dataIso,
      eva: e.eva_dor as number,
      profissional: e.assinado_por_nome || e.profissional || 'Profissional',
      especialidade: e.especialidade,
      numeroRegistro: e.numero_registro,
    }
  })

  const primeiraEva = dados[0].eva
  const ultimaEva = dados[dados.length - 1].eva
  const delta = ultimaEva - primeiraEva
  const ultimaConfig = getEvaConfig(ultimaEva)

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-3.5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]">
              <Activity className="h-4 w-4" />
            </span>
            <h4 className="text-xs font-bold text-[#4A322A] uppercase tracking-wider">
              Trajetória do Nível de Dor (Escala EVA)
            </h4>
          </div>
          <p className="text-[11px] text-gray-500">
            Acompanhamento da dor relatada pelo paciente ao longo das {dados.length}{' '}
            {dados.length === 1 ? 'sessão avaliada' : 'sessões avaliadas'}.
          </p>
        </div>

        {/* Indicadores comparativos de evolução */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 shadow-2xs ${ultimaConfig.bgBadge} ${ultimaConfig.textBadge} ${ultimaConfig.borderBadge}`}
          >
            <span>Última EVA:</span>
            <strong className="text-sm">{ultimaEva} / 10</strong>
            <span className="text-[10px] opacity-80 hidden sm:inline">({ultimaConfig.label})</span>
          </span>

          {dados.length > 1 && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 shadow-2xs ${
                delta < 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : delta > 0
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {delta < 0 ? (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Melhora de {Math.abs(delta)} pts</span>
                </>
              ) : delta > 0 ? (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-rose-600" />
                  <span>Aumento de {delta} pts</span>
                </>
              ) : (
                <>
                  <Minus className="h-3.5 w-3.5 text-gray-500" />
                  <span>Estável</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Mini Gráfico Recharts de Trajetória */}
      <div className="h-44 sm:h-48 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 12, right: 16, left: -22, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DC" vertical={false} />

            {/* Faixas de fundo coloridas de dor: Leve (0-3), Moderada (4-6), Intensa (7-10) */}
            <ReferenceArea y1={0} y2={3} fill="#10b981" fillOpacity={0.05} />
            <ReferenceArea y1={3} y2={6} fill="#f59e0b" fillOpacity={0.06} />
            <ReferenceArea y1={6} y2={10} fill="#f43f5e" fillOpacity={0.06} />

            <XAxis
              dataKey="data"
              tick={{ fontSize: 10, fill: '#73574A' }}
              stroke="#D8C8B5"
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 10, fill: '#73574A' }}
              stroke="#D8C8B5"
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload
                  const conf = getEvaConfig(item.eva)
                  return (
                    <div className="p-3 rounded-2xl bg-[#33221C] text-white text-xs shadow-xl border border-[#C9A46A]/40 space-y-1">
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1">
                        <span className="font-bold text-[#E9D5B5]">{item.data}</span>
                        <span className="text-[10px] opacity-75">{item.especialidade}</span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: conf.colorHex }}
                        />
                        <span className="font-bold text-sm text-white">EVA {item.eva} / 10</span>
                        <span className="text-[11px] text-[#E9D5B5] font-medium">
                          ({conf.label})
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300">Profissional: {item.profissional}</p>
                      {item.numeroRegistro && (
                        <p className="font-mono text-[9px] text-gray-400">{item.numeroRegistro}</p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="eva"
              stroke="#C9A46A"
              strokeWidth={3}
              dot={{ fill: '#8C6527', r: 4, stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#B87355', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rodapé explicativo das faixas */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            0–3 Leve
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            4–6 Moderada
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
            7–10 Intensa
          </span>
        </div>
        <span className="text-gray-400">Escala Visual Analógica (EVA)</span>
      </div>
    </div>
  )
}
