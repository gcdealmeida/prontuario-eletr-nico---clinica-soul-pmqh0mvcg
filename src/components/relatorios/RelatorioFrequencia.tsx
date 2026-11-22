/**
 * Relatório de Frequência — quatro visões alternáveis: Geral (clínica toda),
 * Por profissional, Por serviço e Evolução no período. Números absolutos e percentuais.
 * Novo: painel de definição dos dados (o que incluir na contagem) e exportação
 * da visão ativa para Excel (xlsx) e PDF (jspdf) — src/lib/exportFrequencia.ts.
 * Exportação DETALHADA (uma linha por atendimento, formato da planilha exemplo
 * do usuário) — src/lib/exportFrequenciaDetalhado.ts, alternada pelo seletor
 * Agregado/Detalhado ao lado dos botões Excel/PDF.
 * A granularidade da Evolução segue o período escolhido na barra de filtros:
 * até 31 dias = por dia; até 12 meses = por mês; acima = por ano.
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
import { FileDown, FileSpreadsheet, List, SlidersHorizontal, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isCompareceu, rotuloPeriodo } from '@/lib/relatoriosAdmin'
import type { PeriodoRange } from '@/lib/relatoriosAdmin'
import { exportarExcelFrequencia, exportarPdfFrequencia } from '@/lib/exportFrequencia'
import type { LinhaExportFrequencia } from '@/lib/exportFrequencia'
import {
  exportarExcelFrequenciaDetalhado,
  exportarPdfFrequenciaDetalhado,
} from '@/lib/exportFrequenciaDetalhado'
import type { LinhaDetalhadaFrequencia } from '@/lib/exportFrequenciaDetalhado'
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

const ROTULO_VISAO: Record<Visao, string> = {
  geral: 'Geral',
  profissional: 'Por profissional',
  servico: 'Por serviço',
  evolucao: 'Evolução',
}

interface Props {
  presencas: PresencaRecord[]
  periodo: PeriodoRange
  nomesPorId?: Map<string, string>
}

interface LinhaTabela extends LinhaExportFrequencia {}

interface LinhaEvolucao {
  chave: string
  rotulo: string
  total: number
  compareceu: number
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
            <tr
              key={`${l.nome}#${l.total}#${l.compareceu}`}
              className="hover:bg-gray-50/60 transition-colors"
            >
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
  // Formato de exportação: agregado (visões existentes) ou detalhado
  // (uma linha por atendimento, como a planilha exemplo do usuário).
  const [formatoExportacao, setFormatoExportacao] = useState<'agregado' | 'detalhado'>('agregado')
  // Painel de definição dos dados: o gestor decide quais status entram na contagem.
  // Presente/Confirmado = comparecimento; Justificado/Cancelado = ausência (mesma
  // regra dos KPIs do painel). "Sem status" inclui presenças sem status gravado.
  const [incluirPresente, setIncluirPresente] = useState(true)
  const [incluirConfirmado, setIncluirConfirmado] = useState(true)
  const [incluirJustificado, setIncluirJustificado] = useState(true)
  const [incluirCancelado, setIncluirCancelado] = useState(true)
  const [incluirSemStatus, setIncluirSemStatus] = useState(true)
  const [painelAberto, setPainelAberto] = useState(false)

  const statusAtivos = useMemo(
    () =>
      new Set<string>(
        [
          incluirPresente && 'Presente',
          incluirConfirmado && 'Confirmado',
          incluirJustificado && 'Justificado',
          incluirCancelado && 'Cancelado',
        ].filter(Boolean) as string[],
      ),
    [incluirPresente, incluirConfirmado, incluirJustificado, incluirCancelado],
  )

  const presencasEscopo = useMemo(
    () =>
      presencas.filter((p) => {
        const st = (p.status || '').trim()
        if (!st) return incluirSemStatus
        return statusAtivos.has(st)
      }),
    [presencas, statusAtivos, incluirSemStatus],
  )

  const geral = useMemo(() => {
    const total = presencasEscopo.length
    const compareceu = presencasEscopo.filter((p) => isCompareceu(p.status)).length
    return {
      total,
      compareceu,
      faltou: total - compareceu,
      taxaPct: total > 0 ? Math.round((compareceu / total) * 1000) / 10 : 0,
    }
  }, [presencasEscopo])

  const porProfissional = useMemo(
    () =>
      montarLinhas(
        presencasEscopo,
        (p) => p.profissional_nome || nomesPorId?.get(p.profissional_id) || p.profissional_id,
      ),
    [presencasEscopo, nomesPorId],
  )

  const porServico = useMemo(
    () =>
      montarLinhas(
        presencasEscopo,
        (p) => (p.servico || p.area_servico || '').trim() || 'Sem serviço',
      ),
    [presencasEscopo],
  )

  // Evolução: granularidade automática conforme a duração do período filtrado.
  const evolucao = useMemo<LinhaEvolucao[]>(() => {
    const inicio = new Date(`${periodo.inicio}T00:00:00`)
    const fim = new Date(`${periodo.fim}T00:00:00`)
    const dias = Math.round((fim.getTime() - inicio.getTime()) / 86400000) + 1
    const gran: 'dia' | 'mes' | 'ano' = dias <= 31 ? 'dia' : dias <= 366 ? 'mes' : 'ano'
    const chaveDe = (ymd: string) =>
      gran === 'dia' ? ymd : gran === 'mes' ? ymd.slice(0, 7) : ymd.slice(0, 4)
    const rotuloDe = (chave: string) => {
      if (gran === 'dia') {
        const [, m, d] = chave.split('-')
        return `${d}/${m}`
      }
      if (gran === 'mes')
        return `${MESES_ABREV[Number(chave.slice(5, 7)) - 1]}/${chave.slice(2, 4)}`
      return chave
    }
    const mapa = new Map<string, { total: number; compareceu: number }>()
    for (const p of presencasEscopo) {
      const ymd = (p.data_atendimento || '').slice(0, 10)
      if (!ymd) continue
      const chave = chaveDe(ymd)
      const atual = mapa.get(chave) || { total: 0, compareceu: 0 }
      atual.total++
      if (isCompareceu(p.status)) atual.compareceu++
      mapa.set(chave, atual)
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([chave, v]) => ({
        chave,
        rotulo: rotuloDe(chave),
        total: v.total,
        compareceu: v.compareceu,
        taxaPct: v.total > 0 ? Math.round((v.compareceu / v.total) * 1000) / 10 : 0,
      }))
  }, [presencasEscopo, periodo])

  const linhasAtivas: LinhaExportFrequencia[] = useMemo(() => {
    if (visao === 'profissional') return porProfissional
    if (visao === 'servico') return porServico
    if (visao === 'evolucao') {
      return evolucao.map((e) => ({
        nome: e.rotulo,
        total: e.total,
        compareceu: e.compareceu,
        faltou: e.total - e.compareceu,
        taxaPct: e.taxaPct,
      }))
    }
    return [
      {
        nome: 'Clínica toda (geral)',
        total: geral.total,
        compareceu: geral.compareceu,
        faltou: geral.faltou,
        taxaPct: geral.taxaPct,
      },
    ]
  }, [visao, porProfissional, porServico, evolucao, geral])

  // Linhas do formato DETALHADO (uma por atendimento): mesmos filtros do painel
  // (período/profissional/serviço/programa, aplicados antes em presencasFiltradas)
  // e mesmo escopo de status da definição dos dados (presencasEscopo).
  const linhasDetalhadas = useMemo<LinhaDetalhadaFrequencia[]>(() => {
    return presencasEscopo.map((p) => {
      const horario = (p.horario || '').trim()
      return {
        dataYmd: (p.data_atendimento || '').slice(0, 10),
        horario: horario ? horario.slice(0, 5) : undefined,
        paciente: p.paciente_nome || 'Paciente',
        areaEspecialidade: (p.servico || p.area_servico || '').trim() || 'Sem serviço',
        detalheServico: (p.detalhe_servico || '').trim() || undefined,
        status: (p.status || 'Sem status').trim(),
        profissional:
          p.profissional_nome || nomesPorId?.get(p.profissional_id) || p.profissional_id || '—',
      }
    })
  }, [presencasEscopo, nomesPorId])

  const exportar = (tipo: 'xlsx' | 'pdf') => {
    if (formatoExportacao === 'detalhado') {
      if (tipo === 'xlsx') exportarExcelFrequenciaDetalhado(linhasDetalhadas, periodo)
      else exportarPdfFrequenciaDetalhado(linhasDetalhadas, periodo)
      return
    }
    const titulo = `Relatório de Frequência — ${ROTULO_VISAO[visao]}`
    if (tipo === 'xlsx') exportarExcelFrequencia(linhasAtivas, titulo, periodo)
    else exportarPdfFrequencia(linhasAtivas, titulo, periodo)
  }

  return (
    <Tabs
      value={visao}
      onValueChange={(v) => setVisao(v as Visao)}
      className="space-y-4 focus-visible:outline-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold text-gray-900">
            Relatório de Frequência
          </CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            Comparecimentos vs. faltas/cancelamentos — {rotuloPeriodo(periodo)}
          </p>
        </div>
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
      </div>

      {/* Painel de definição dos dados + exportação */}
      <div className="rounded-xl border border-gray-100 bg-[#FAF7F1]/60 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPainelAberto((a) => !a)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#73574A] hover:text-[#5A4436]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Definição dos dados
            <span className="text-[10px] font-normal normal-case text-gray-400">
              (clique para {painelAberto ? 'ocultar' : 'expandir'})
            </span>
          </button>
          <div className="flex items-center gap-2">
            {/* Formato da exportação: visão agregada (padrão) ou detalhada
                (uma linha por atendimento, planilha exemplo do usuário). */}
            <div className="inline-flex items-center rounded-lg border border-[#E7E0D6] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setFormatoExportacao('agregado')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  formatoExportacao === 'agregado'
                    ? 'bg-[#73574A] text-white'
                    : 'text-gray-500 hover:text-[#73574A]'
                }`}
              >
                <Table2 className="h-3 w-3" /> Agregado
              </button>
              <button
                type="button"
                onClick={() => setFormatoExportacao('detalhado')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  formatoExportacao === 'detalhado'
                    ? 'bg-[#73574A] text-white'
                    : 'text-gray-500 hover:text-[#73574A]'
                }`}
              >
                <List className="h-3 w-3" /> Detalhado
              </button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs border-[#C9A46A] text-[#73574A] hover:bg-[#FAF7F1]"
              onClick={() => exportar('xlsx')}
              disabled={
                formatoExportacao === 'agregado'
                  ? linhasAtivas.length === 0
                  : linhasDetalhadas.length === 0
              }
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs border-[#C9A46A] text-[#73574A] hover:bg-[#FAF7F1]"
              onClick={() => exportar('pdf')}
              disabled={
                formatoExportacao === 'agregado'
                  ? linhasAtivas.length === 0
                  : linhasDetalhadas.length === 0
              }
            >
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
          </div>
        </div>

        {painelAberto && (
          <div className="mt-3 pt-3 border-t border-[#E7E0D6] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <p className="col-span-full text-[11px] text-gray-500">
              Escolha o que entra na contagem do relatório (período e filtros ficam na barra acima
              do painel). Presenças sem status contam quando “Sem status” está marcado.
            </p>
            {[
              { id: 'presente', label: 'Presente', on: incluirPresente, set: setIncluirPresente },
              {
                id: 'confirmado',
                label: 'Confirmado',
                on: incluirConfirmado,
                set: setIncluirConfirmado,
              },
              {
                id: 'justificado',
                label: 'Justificado',
                on: incluirJustificado,
                set: setIncluirJustificado,
              },
              {
                id: 'cancelado',
                label: 'Cancelado',
                on: incluirCancelado,
                set: setIncluirCancelado,
              },
              {
                id: 'sem-status',
                label: 'Sem status',
                on: incluirSemStatus,
                set: setIncluirSemStatus,
              },
            ].map((op) => (
              <label
                key={op.id}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={op.on}
                  onChange={(e) => op.set(e.target.checked)}
                  className="accent-[#1E2530]"
                />
                {op.label}
              </label>
            ))}
          </div>
        )}
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
                <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} stroke="#73574A" />
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
                  dataKey="taxaPct"
                  name="Frequência"
                  stroke="#C9A46A"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#C9A46A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
