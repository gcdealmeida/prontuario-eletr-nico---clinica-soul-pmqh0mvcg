/**
 * Relatório de Frequência — quatro visões alternáveis: Geral (clínica toda),
 * Por profissional, Por serviço e Evolução no período. Números absolutos e percentuais.
 */
import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isCompareceu, rotuloPeriodo } from '@/lib/relatoriosAdmin'
import type { PeriodoRange } from '@/lib/relatoriosAdmin'
import type { PresencaRecord } from '@/types/database'

const MESES_ABREV = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const TOOLTIP_STYLE = {
  backgroundColor: '#FFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  fontSize: '12px',
}

type Visao = 'geral' | 'profissional' | 'servico' | 'evolucao'

interface Props {
  presencas: PresencaRecord[]
  periodo: PeriodoRange
  nomesPorId?: Map<string, string>
}

interface LinhaTabela {
  nome: string
  total: number
  compareceu: number
  faltou: number
  taxaPct: number
}

function montarLinhas(
  presencas: PresencaRecord[],
  chave: (p: PresencaRecord) => string,
): LinhaTabela[] {
  const mapa = new Map<string, { total: number; compareceu: number }>()
  for (const p of presencas) {
    const k = chave(p)
    if (!k) continue
    const atual = mapa.get(k) || { total: 0, compareceu: 0 }
    atual.total++
    if (isCompareceu(p.status)) atual.compareceu++
    mapa.set(k, atual)
  }
  return [...mapa.entries()]
    .map(([nome, v]) => ({
      nome,
      total: v.total,
      compareceu: v.compareceu,
      faltou: v.total - v.compareceu,
      taxaPct: v.total > 0 ? Math.round((v.compareceu / v.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

function TabelaFrequencia({
  linhas,
  rotuloColuna,
}: {
  linhas: LinhaTabela[]
  rotuloColuna: string
}) {
  if (linhas.length === 0) {
    return <p className="py-8 text-center text-xs text-gray-400">Sem atendimentos no período.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <th className="pb-3 px-2">{rotuloColuna}</th>
            <th className="pb-3 px-4 text-right">Atendimentos</th>
            <th className="pb-3 px-4 text-right">Compareceu</th>
            <th className="pb-3 px-4 text-right">Faltou/Cancelou</th>
            <th className="pb-3 px-4 text-right">Frequência</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {linhas.map((l) => (
            <tr key={l.nome} className="hover:bg-gray-50/60 transition-colors">
              <td className="py-3 px-2 font-bold text-gray-900">{l.nome}</td>
              <td className="py-3 px-4 text-right text-gray-700">{l.total}</td>
              <td className="py-3 px-4 text-right text-[#477A53] font-semibold">{l.compareceu}</td>
              <td className="py-3 px-4 text-right text-[#B87355] font-semibold">{l.faltou}</td>
              <td className="py-3 px-4 text-right">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold ${
                    l.taxaPct >= 85
                      ? 'bg-[#F2F6F1] text-[#477A53]'
                      : l.taxaPct >= 70
                        ? 'bg-[#FAF4EA] text-[#8C6527]'
                        : 'bg-[#FDF2EE] text-[#B87355]'
                  }`}
                >
                  {l.taxaPct.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RelatorioFrequencia({ presencas, periodo, nomesPorId }: Props) {
  const [visao, setVisao] = useState<Visao>('geral')

  const geral = useMemo(() => {
    const total = presencas.length
    const compareceu = presencas.filter((p) => isCompareceu(p.status)).length
    return {
      total,
      compareceu,
      faltou: total - compareceu,
      taxaPct: total > 0 ? Math.round((compareceu / total) * 1000) / 10 : 0,
    }
  }, [presencas])

  const porProfissional = useMemo(
    () =>
      montarLinhas(
        presencas,
        (p) => p.profissional_nome || nomesPorId?.get(p.profissional_id) || p.profissional_id,
      ),
    [presencas, nomesPorId],
  )

  const porServico = useMemo(
    () => montarLinhas(presencas, (p) => (p.area_servico || '').trim() || 'Sem serviço'),
    [presencas],
  )

  const evolucao = useMemo(() => {
    const mapa = new Map<string, { total: number; compareceu: number }>()
    for (const p of presencas) {
      const ymd = (p.data_atendimento || '').slice(0, 10)
      if (!ymd) continue
      const chave = ymd.slice(0, 7)
      const atual = mapa.get(chave) || { total: 0, compareceu: 0 }
      atual.total++
      if (isCompareceu(p.status)) atual.compareceu++
      mapa.set(chave, atual)
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, v]) => ({
        mes: `${MESES_ABREV[Number(mes.slice(5, 7)) - 1]}/${mes.slice(2, 4)}`,
        frequencia: v.total > 0 ? Math.round((v.compareceu / v.total) * 1000) / 10 : 0,
        total: v.total,
      }))
  }, [presencas])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-gray-900">
            Relatório de Frequência
          </CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            Comparecimentos vs. faltas/cancelamentos — {rotuloPeriodo(periodo)}
          </p>
        </div>
        <Tabs value={visao} onValueChange={(v) => setVisao(v as Visao)}>
          <TabsList className="bg-[#FAF7F1] h-9">
            <TabsTrigger value="geral" className="text-xs">
              Geral
            </TabsTrigger>
            <TabsTrigger value="profissional" className="text-xs">
              Por profissional
            </TabsTrigger>
            <TabsTrigger value="servico" className="text-xs">
              Por serviço
            </TabsTrigger>
            <TabsTrigger value="evolucao" className="text-xs">
              Evolução
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Geral */}
      <TabsContent value="geral" className="mt-0 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Atendimentos', valor: geral.total, cor: 'text-gray-900' },
            { label: 'Compareceu', valor: geral.compareceu, cor: 'text-[#477A53]' },
            { label: 'Faltou/Cancelou', valor: geral.faltou, cor: 'text-[#B87355]' },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-[#FAF7F1] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                {c.label}
              </p>
              <p className={`text-xl font-black ${c.cor}`}>
                {c.valor}
                {c.label !== 'Atendimentos' && geral.total > 0 && (
                  <span className="text-xs font-semibold text-gray-400 ml-1">
                    ({((c.valor / geral.total) * 100).toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <TabelaFrequencia
            linhas={[
              {
                nome: 'Clínica toda (geral)',
                ...geral,
                faltou: geral.faltou,
                taxaPct: geral.taxaPct,
              },
            ]}
            rotuloColuna="Escopo"
          />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { nome: 'Compareceu', valor: geral.compareceu },
                  { nome: 'Faltou/Cancelou', valor: geral.faltou },
                ]}
                layout="vertical"
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nome"
                  tick={{ fontSize: 11 }}
                  stroke="#73574A"
                  width={110}
                />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {[geral.compareceu, geral.faltou].map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#477A53' : '#B87355'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TabsContent>

      {/* Por profissional */}
      <TabsContent value="profissional" className="mt-0">
        <TabelaFrequencia linhas={porProfissional} rotuloColuna="Profissional" />
      </TabsContent>

      {/* Por serviço */}
      <TabsContent value="servico" className="mt-0">
        <TabelaFrequencia linhas={porServico} rotuloColuna="Serviço / Área" />
      </TabsContent>

      {/* Evolução */}
      <TabsContent value="evolucao" className="mt-0">
        {evolucao.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">Sem atendimentos no período.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#73574A" />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="#73574A"
                  tickFormatter={(v: number) => `${v}%`}
                />
                <RechartsTooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number | string) => [`${v}%`, 'Frequência']}
                />
                <Line
                  type="monotone"
                  dataKey="frequencia"
                  stroke="#C9A46A"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#C9A46A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </TabsContent>
    </div>
  )
}
