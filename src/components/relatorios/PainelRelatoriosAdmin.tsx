/**
 * Painel de Relatórios do gestor (ADM/Secretária) em /relatorios.
 *
 * Cuidado estrutural: TabsContent SEMPRE dentro de <Tabs> (regressão v0.0.132).
 * Números-chave e gráficos respeitam TODOS os filtros, incluindo serviço
 * (campo `servico`, migration 0065) e programa (campo `programa`, 0065).
 * Presenças antigas sem esses campos ficam fora dos filtros específicos.
 */
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getAllUsers } from '@/services/acessos'
import {
  resolverPreset,
  rotuloPeriodo,
  corPorIndice,
  listarServicosDe,
  listarProgramasDe,
  agruparPorArea,
  agruparPorProfissional,
} from '@/lib/relatoriosAdmin'
import type { PeriodoRange } from '@/lib/relatoriosAdmin'
import { isCompareceu } from '@/lib/relatoriosAdmin'
import type { PresencaRecord, UserRecord } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { RelatorioFrequencia } from '@/components/relatorios/RelatorioFrequencia'
import { GraficoAtendimentosTempo } from '@/components/relatorios/GraficoAtendimentosTempo'
import { FiltrosBarra } from './FiltrosBarra'
import { iniciaisFiltros } from './FiltrosBarra'
import type { FiltrosState } from './FiltrosBarra'

const TOOLTIP_STYLE = {
  backgroundColor: '#FFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  fontSize: '12px',
}

export function PainelRelatoriosAdmin() {
  const [filtros, setFiltros] = useState<FiltrosState>(iniciaisFiltros)
  const [carregando, setCarregando] = useState(true)
  const [presencas, setPresencas] = useState<PresencaRecord[]>([])
  const [usuarios, setUsuarios] = useState<UserRecord[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const periodo: PeriodoRange = useMemo(
    () => resolverPreset(filtros.preset, { inicio: filtros.inicio, fim: filtros.fim }),
    [filtros.preset, filtros.inicio, filtros.fim],
  )

  // Carga inicial: presenças (clínica toda) + usuários. Programas agora vêm do
  // campo `programa` das próprias presenças (0065) — sem carga extra.
  useEffect(() => {
    let ativo = true
    ;(async () => {
      setCarregando(true)
      setErro(null)
      try {
        const [regs, usrs] = await Promise.all([
          pb
            .collection<PresencaRecord>('presencas')
            .getFullList({
              sort: '-data_atendimento',
              fields:
                'id,paciente_id,profissional_id,profissional_nome,data_atendimento,area_servico,servico,programa,status',
            })
            .catch(() => [] as PresencaRecord[]),
          getAllUsers().catch(() => [] as UserRecord[]),
        ])
        if (!ativo) return
        setPresencas(regs)
        setUsuarios(usrs)
      } catch {
        if (ativo) setErro('Não foi possível carregar os dados dos relatórios.')
      }
      if (ativo) setCarregando(false)
    })()
    return () => {
      ativo = false
    }
  }, [])

  const nomesPorId = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of usuarios) m.set(u.id, u.name || u.email)
    return m
  }, [usuarios])

  const areas = useMemo(() => listarServicosDe(presencas), [presencas])
  const programasDisponiveis = useMemo(() => listarProgramasDe(presencas), [presencas])

  const profissionais = useMemo(
    () =>
      usuarios
        .map((u) => ({ id: u.id, nome: u.name || u.email }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [usuarios],
  )

  // Todos os filtros valem para TODO o painel (KPIs, gráficos e frequência):
  // período, profissional, serviço e programa (0065 grava servico/programa).
  const presencasFiltradas = useMemo(() => {
    return presencas.filter((p) => {
      const ymd = (p.data_atendimento || '').slice(0, 10)
      if (!ymd) return false
      if (ymd < periodo.inicio || ymd > periodo.fim) return false
      const servico = (p.servico || p.area_servico || '').trim()
      if (filtros.servico && filtros.servico !== 'todos' && servico !== filtros.servico)
        return false
      if (
        filtros.profissional &&
        filtros.profissional !== 'todos' &&
        p.profissional_id !== filtros.profissional
      )
        return false
      if (
        filtros.programa &&
        filtros.programa !== 'todos' &&
        (p.programa || '').trim() !== filtros.programa
      )
        return false
      return true
    })
  }, [presencas, periodo, filtros.servico, filtros.profissional, filtros.programa])

  const porServico = useMemo(() => agruparPorArea(presencasFiltradas), [presencasFiltradas])
  const porProfissional = useMemo(
    () => agruparPorProfissional(presencasFiltradas, nomesPorId),
    [presencasFiltradas, nomesPorId],
  )
  // 'serie' antigo removido — o gráfico "Atendimentos no tempo" agora é o
  // GraficoAtendimentosTempo (granularidade + agrupamento + multi-série).

  const totalPeriodo = presencasFiltradas.length
  const compareceu = presencasFiltradas.filter((p) => isCompareceu(p.status)).length
  const taxaPct = totalPeriodo > 0 ? Math.round((compareceu / totalPeriodo) * 1000) / 10 : 0

  return (
    <div className="space-y-5">
      <FiltrosBarra
        filtros={filtros}
        setFiltros={setFiltros}
        areas={areas}
        profissionais={profissionais}
        programas={programasDisponiveis}
      />

      {erro && (
        <Card className="border-[#E7BFB0] bg-[#FDF2EE]">
          <CardContent className="py-4 flex items-center gap-2 text-sm text-[#9A4B2E]">
            <AlertTriangle className="h-4 w-4" /> {erro}
          </CardContent>
        </Card>
      )}

      {carregando ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {['a', 'b', 'c'].map((k) => (
            <Card key={k} className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-52 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Números-chave — todos os filtros aplicados */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Atendimentos no período', valor: String(totalPeriodo) },
              { label: 'Compareceu', valor: String(compareceu) },
              {
                label: 'Faltou/Cancelou',
                valor: String(totalPeriodo - compareceu),
              },
              { label: 'Taxa de frequência', valor: `${taxaPct.toFixed(1)}%` },
            ].map((c) => (
              <Card key={c.label} className="border-gray-100 shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    {c.label}
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{c.valor}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Card className="border-gray-100 shadow-sm xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">
                  Atendimentos no tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GraficoAtendimentosTempo
                  presencas={presencasFiltradas}
                  periodoInicio={periodo.inicio}
                  periodoFim={periodo.fim}
                  nomesPorId={nomesPorId}
                />
              </CardContent>
            </Card>

            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">
                  Atendimentos por serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {porServico.length === 0 ? (
                    <SemDados mensagem="Sem atendimentos no período filtrado." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={porServico} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11 }}
                          stroke="#73574A"
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="nome"
                          tick={{ fontSize: 11 }}
                          stroke="#73574A"
                          width={130}
                        />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="total" name="Atendimentos" radius={[0, 6, 6, 0]}>
                          {porServico.map((_, i) => (
                            <Cell key={i} fill={corPorIndice(i)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">
                  Atendimentos por profissional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {porProfissional.length === 0 ? (
                    <SemDados mensagem="Sem atendimentos no período filtrado." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={porProfissional} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11 }}
                          stroke="#73574A"
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="nome"
                          tick={{ fontSize: 11 }}
                          stroke="#73574A"
                          width={130}
                        />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="total" name="Atendimentos" radius={[0, 6, 6, 0]}>
                          {porProfissional.map((_, i) => (
                            <Cell key={i} fill={corPorIndice(i)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Relatório de Frequência (visões: geral, profissional, serviço, evolução) */}
            <Card className="border-gray-100 shadow-sm xl:col-span-2">
              <CardContent className="pt-6">
                <RelatorioFrequencia
                  presencas={presencasFiltradas}
                  periodo={periodo}
                  nomesPorId={nomesPorId}
                />
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Período analisado: {rotuloPeriodo(periodo)}
            {filtros.servico !== 'todos' && ` · Serviço: ${filtros.servico}`}
            {filtros.programa !== 'todos' && ` · Programa: ${filtros.programa}`}
            {filtros.profissional !== 'todos' &&
              ` · Profissional: ${profissionais.find((p) => p.id === filtros.profissional)?.nome ?? filtros.profissional}`}
          </p>
          <p className="text-[11px] text-gray-300 text-center">
            Presenças anteriores à gravação de serviço/programa (migration 0065) podem ficar fora
            dos filtros específicos de serviço ou programa.
          </p>
        </>
      )}
    </div>
  )
}

function SemDados({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-xs text-gray-400">{mensagem}</p>
    </div>
  )
}
