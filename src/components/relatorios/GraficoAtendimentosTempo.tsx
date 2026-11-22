/**
 * Gráfico "Atendimentos no tempo" da visão gestor (/relatorios) — controle fino:
 * - Granularidade temporal: dia, semana, mês ou ano (com sugestão automática pelo período);
 * - Agrupamento: Profissional, Serviço ou Programa;
 * - Multi-seleção: várias séries (uma linha por profissional/serviço/programa) no mesmo gráfico.
 * Séries construídas por serieTemporalMulti() em src/lib/relatoriosAdmin.ts;
 * cada série sai como coluna "s0", "s1", … das linhas planas (ver nota abaixo).
 */
import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  corPorIndice,
  granularidadeSugerida,
  listarProgramasDe,
  listarServicosDe,
  serieTemporalMulti,
  serieDeLinha,
  LABELS_GRANULARIDADE,
} from '@/lib/relatoriosAdmin'
import type { Granularidade } from '@/lib/relatoriosAdmin'
import type { PresencaRecord } from '@/types/database'

/**
 * Cada entidade selecionada vira uma COLUNA NUMERADA da linha plana da série
 * ("s0", "s1", …): dataKey é sempre STRING — o caminho que o Recharts (incl. a
 * v3 em uso) executa de forma estável. dataKey como função e data trocando de
 * identidade a cada render são as causas conhecidas de linha vazia/zerada.
 */
const TOOLTIP_STYLE = {
  backgroundColor: '#FFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  fontSize: '12px',
}

export type AgrupamentoGrafico = 'profissional' | 'servico' | 'programa'

interface Props {
  presencas: PresencaRecord[]
  periodoInicio: string
  periodoFim: string
  nomesPorId: Map<string, string>
}

interface OpcaoEntidade {
  id: string // para profissional: user id; para serviço/programa: o próprio nome
  nome: string
}

const ROTULOS_AGRUPAMENTO: Record<AgrupamentoGrafico, string> = {
  profissional: 'Profissional',
  servico: 'Serviço',
  programa: 'Programa',
}

export function GraficoAtendimentosTempo({
  presencas,
  periodoInicio,
  periodoFim,
  nomesPorId,
}: Props) {
  const [agrupamento, setAgrupamento] = useState<AgrupamentoGrafico>('profissional')
  const [granularidade, setGranularidade] = useState<Granularidade>('mes')
  const [selecionadas, setSelecionadas] = useState<string[]>([])

  // Reavaliar sugestão de granularidade quando o período muda (somente se o usuário não tocou)
  const [granTocada, setGranTocada] = useState(false)
  useEffect(() => {
    if (!granTocada) setGranularidade(granularidadeSugerida(periodoInicio, periodoFim))
  }, [periodoInicio, periodoFim, granTocada])

  // --- opções de entidade conforme o agrupamento
  const opcoes: OpcaoEntidade[] = useMemo(() => {
    if (agrupamento === 'profissional') {
      return [...nomesPorId.entries()]
        .map(([id, nome]) => ({ id, nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome))
    }
    if (agrupamento === 'servico') {
      return listarServicosDe(presencas).map((s) => ({ id: s, nome: s }))
    }
    return listarProgramasDe(presencas).map((p) => ({ id: p, nome: p }))
  }, [agrupamento, presencas, nomesPorId])

  // Garante coerência quando troca o agrupamento ou as opções mudam: mantém as
  // escolhas ainda válidas e, se nada restou, pré-seleciona a primeira opção
  // para o gráfico já vir preenchido (o usuário pode desmarcar depois).
  useEffect(() => {
    const ids = new Set(opcoes.map((o) => o.id))
    setSelecionadas((atual) => {
      const filtradas = atual.filter((s) => ids.has(s))
      return filtradas.length > 0 ? filtradas : opcoes.length > 0 ? [opcoes[0].id] : []
    })
  }, [opcoes])

  const idsValidos = useMemo(() => new Set(opcoes.map((o) => o.id)), [opcoes])
  const entidadesSelecionadas = useMemo(
    () => selecionadas.filter((s) => idsValidos.has(s)),
    [selecionadas, idsValidos],
  )

  // No agrupamento por profissional, `selecionadas` guarda IDs — as séries da
  // resposta são chaveadas pelo NOME (o mesmo que os chips exibem).
  const nomesSerie = useMemo(
    () =>
      entidadesSelecionadas.map((id) =>
        agrupamento === 'profissional' ? nomesPorId.get(id) || id : id,
      ),
    [entidadesSelecionadas, agrupamento, nomesPorId],
  )

  const serie = useMemo(
    () =>
      serieTemporalMulti(
        presencas,
        periodoInicio,
        periodoFim,
        agrupamento,
        granularidade,
        entidadesSelecionadas,
        nomesPorId,
      ),
    [
      presencas,
      periodoInicio,
      periodoFim,
      agrupamento,
      granularidade,
      entidadesSelecionadas,
      nomesPorId,
    ],
  )
  const temDados = serie.some((linha) => nomesSerie.some((n) => serieDeLinha(linha, n) !== 0))

  // Linhas PLANAS para o Recharts: { label, s0, s1, … } — um dataKey string
  // simples por série, sem função nem caminho aninhado.
  const dadosGrafico = useMemo(
    () =>
      serie.map((linha) => {
        const plano: Record<string, string | number> = { label: linha.label }
        nomesSerie.forEach((nome, i) => {
          plano[`s${i}`] = linha.valores[nome] || 0
        })
        return plano
      }),
    [serie, nomesSerie],
  )

  const toggle = (id: string) => {
    setSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#73574A]">
            Agrupar por
          </p>
          <Select
            value={agrupamento}
            onValueChange={(v) => {
              setAgrupamento(v as AgrupamentoGrafico)
              setSelecionadas([])
            }}
          >
            <SelectTrigger className="h-9 w-[170px] bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profissional">Profissional</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="programa">Programa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#73574A]">
            Granularidade
          </p>
          <Select
            value={granularidade}
            onValueChange={(v) => {
              setGranularidade(v as Granularidade)
              setGranTocada(true)
            }}
          >
            <SelectTrigger className="h-9 w-[130px] bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['dia', 'semana', 'mes', 'ano'] as Granularidade[]).map((g) => (
                <SelectItem key={g} value={g}>
                  {LABELS_GRANULARIDADE[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Multi-seletor de entidades */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#73574A]">
          {ROTULOS_AGRUPAMENTO[agrupamento]}s no gráfico{' '}
          <span className="font-normal text-gray-400 normal-case">
            (clique para comparar várias)
          </span>
        </p>
        {opcoes.length === 0 ? (
          <p className="text-xs text-gray-400">
            {agrupamento === 'programa'
              ? 'Nenhum programa vinculado às presenças do período — presenças antigas podem não ter programa gravado.'
              : 'Nada disponível para agrupar.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {opcoes.map((o) => {
              const ativo = selecionadas.includes(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    ativo
                      ? 'border-transparent bg-[#1E2530] text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ativo && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: corPorIndice(selecionadas.indexOf(o.id)) }}
                    />
                  )}
                  {o.nome}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="h-72">
        {entidadesSelecionadas.length === 0 || !temDados ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-gray-400">
              {entidadesSelecionadas.length === 0
                ? `Selecione ao menos um ${ROTULOS_AGRUPAMENTO[agrupamento].toLowerCase()} para visualizar.`
                : 'Sem atendimentos no período para a seleção atual.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosGrafico} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#73574A" />
              <YAxis tick={{ fontSize: 11 }} stroke="#73574A" allowDecimals={false} />
              <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {nomesSerie.map((nome, i) => (
                <Line
                  key={nome}
                  type="monotone"
                  dataKey={`s${i}`}
                  name={nome}
                  stroke={corPorIndice(i)}
                  strokeWidth={2.5}
                  isAnimationActive={false}
                  dot={serie.length <= 45}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {entidadesSelecionadas.length > 1 && (
        <p className="text-[11px] text-gray-400">
          Comparando {entidadesSelecionadas.length} {ROTULOS_AGRUPAMENTO[agrupamento].toLowerCase()}
          s — cada série usa uma cor.
        </p>
      )}
    </div>
  )
}
