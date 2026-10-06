import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDataPTBR } from '@/lib/constants'
import type { ProgramaRegistroCargaRecord } from '@/types/database'

interface CurvaCargaGraficoProps {
  registros: ProgramaRegistroCargaRecord[]
  nomeExercicio: string
}

export const CurvaCargaGrafico: React.FC<CurvaCargaGraficoProps> = ({
  registros,
  nomeExercicio,
}) => {
  if (!registros || registros.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-400">
        Nenhum registro de carga cadastrado para este exercício ainda.
      </div>
    )
  }

  // Ordenar por data
  const ordenados = [...registros].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
  )

  const dados = ordenados.map((r) => ({
    data: formatDataPTBR(r.data),
    rawDate: r.data,
    carga: r.valor_kg,
    reps: r.repeticoes_feitas,
    rpe: r.rpe,
  }))

  const cargaMin = Math.min(...dados.map((d) => d.carga))
  const cargaMax = Math.max(...dados.map((d) => d.carga))
  const delta = cargaMax - cargaMin

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Curva de Evolução de Carga (kg)
          </h5>
          <p className="text-[11px] text-gray-500 font-medium">{nomeExercicio}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            Última: {dados[dados.length - 1].carga} kg
          </span>
          {dados.length > 1 && delta !== 0 && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                delta > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {delta > 0 ? `+${delta.toFixed(1)} kg` : `${delta.toFixed(1)} kg`}
            </span>
          )}
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DC" />
            <XAxis dataKey="data" tick={{ fontSize: 10, fill: '#73574A' }} stroke="#D8C8B5" />
            <YAxis
              tick={{ fontSize: 10, fill: '#73574A' }}
              stroke="#D8C8B5"
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload
                  return (
                    <div className="p-2.5 rounded-xl bg-[#4A322A] text-white text-xs shadow-lg space-y-0.5">
                      <p className="font-bold text-[#E3C89A]">{item.data}</p>
                      <p className="font-semibold text-white">Carga: {item.carga} kg</p>
                      {item.reps && <p className="text-[11px] text-gray-300">Reps: {item.reps}</p>}
                      {item.rpe && <p className="text-[11px] text-gray-300">RPE: {item.rpe}/10</p>}
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="carga"
              stroke="#C9A46A"
              strokeWidth={3}
              dot={{ fill: '#8C6527', r: 4 }}
              activeDot={{ r: 6, fill: '#B87355' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
