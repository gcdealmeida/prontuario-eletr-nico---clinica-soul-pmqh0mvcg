/**
 * Painel Administrativo de Relatórios da clínica SOUL (visão ADM/Secretária).
 * Filtros de período, área, profissional e programas + gráficos Recharts
 * (atendimentos no tempo, por área, por profissional) + Relatório de Frequência.
 */
import { useEffect, useMemo, useState } from 'react'
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
import { AlertTriangle, CalendarDays, FolderKanban, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
// O cliente PocketBase é o export default do módulo (padrão do projeto — ver src/services/gestao.ts).
import pb from '@/lib/pocketbase/client'
import type { PresencaRecord, UserRecord } from '@/types/database'
import { getAllUsers } from '@/services/acessos'
import {
  agruparPorArea,
  agruparPorProfissional,
  corPorIndice,
  isCompareceu,
  LABELS_PRESET,
  rotuloPeriodo,
  resolverPreset,
  serieTemporal,
} from '@/lib/relatoriosAdmin'
import type { PeriodoRange, PresetPeriodo } from '@/lib/relatoriosAdmin'
import { RelatorioFrequencia } from '@/components/relatorios/RelatorioFrequencia'

const TOOLTIP_STYLE = {
  backgroundColor: '#FFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  fontSize: '12px',
}

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/* ------------------------------------------------------------------ */

const PRESETS: PresetPeriodo[] = ['hoje', '7d', 'mes', 'mesAnterior', 'ano', 'custom']

export interface FiltrosState {
  preset: PresetPeriodo
  inicio: string
  fim: string
  area: string // 'todas' | nome da área/serviço
  profissional: string // 'todos' | user id
  // NOTA: a coleção `presencas` não tem campo de programa, então este filtro é
  // apenas de UI (seleção visível, sem cruzamento com os dados agregados).
  programa: string // 'todos' | id do programa
}

export function iniciaisFiltros(): FiltrosState {
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  return {
    preset: 'mes',
    inicio: `${hoje.slice(0, 7)}-01`,
    fim: hoje,
    area: 'todas',
    profissional: 'todos',
    programa: 'todos',
  }
}

interface PropsFiltros {
  filtros: FiltrosState
  setFiltros: (f: FiltrosState) => void
  areas: string[]
  profissionais: { id: string; nome: string }[]
  programas: { id: string; nome: string }[]
}

function FiltrosBarra({ filtros, setFiltros, areas, profissionais, programas }: PropsFiltros) {
  const set = (p: Partial<FiltrosState>) => setFiltros({ ...filtros, ...p })

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Período */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-[#73574A] flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Período
          </Label>
          <Select
            value={filtros.preset}
            onValueChange={(v) => {
              const preset = v as PresetPeriodo
              const r = resolverPreset(preset, { inicio: filtros.inicio, fim: filtros.fim })
              set({ preset, inicio: r.inicio, fim: r.fim })
            }}
          >
            <SelectTrigger className="w-full h-9 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p} value={p}>
                  {LABELS_PRESET[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtros.preset === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filtros.inicio}
                onChange={(e) => set({ inicio: e.target.value })}
                className="h-9 text-xs bg-white"
              />
              <span className="text-xs text-gray-400">até</span>
              <Input
                type="date"
                value={filtros.fim}
                onChange={(e) => set({ fim: e.target.value })}
                className="h-9 text-xs bg-white"
              />
            </div>
          )}
        </div>

        {/* Área de atendimento */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-[#73574A]">Área de atendimento</Label>
          <Select value={filtros.area || 'todas'} onValueChange={(v) => set({ area: v })}>
            <SelectTrigger className="w-full h-9 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as áreas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profissional */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-[#73574A] flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Profissional
          </Label>
          <Select
            value={filtros.profissional || 'todos'}
            onValueChange={(v) => set({ profissional: v })}
          >
            <SelectTrigger className="w-full h-9 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os profissionais</SelectItem>
              {profissionais.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Programas */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-[#73574A] flex items-center gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" /> Programas
          </Label>
          {programas.length === 0 ? (
            <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-gray-200 bg-[#FAF7F1]/50 text-xs text-gray-400">
              Sem programas cadastrados
            </div>
          ) : (
            <Select value={filtros.programa || 'todos'} onValueChange={(v) => set({ programa: v })}>
              <SelectTrigger className="w-full h-9 bg-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os programas</SelectItem>
                {programas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Painel                                                              */
/* ------------------------------------------------------------------ */

export function PainelRelatoriosAdmin() {
  const [filtros, setFiltros] = useState<FiltrosState>(iniciaisFiltros)
  const [carregando, setCarregando] = useState(true)
  const [presencas, setPresencas] = useState<PresencaRecord[]>([])
  const [usuarios, setUsuarios] = useState<UserRecord[]>([])
  const [programas, setProgramas] = useState<{ id: string; nome: string }[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const periodo: PeriodoRange = useMemo(
    () => resolverPreset(filtros.preset, { inicio: filtros.inicio, fim: filtros.fim }),
    [filtros.preset, filtros.inicio, filtros.fim],
  )

  // Carga inicial: presenças (clínica toda), usuários e programas
  useEffect(() => {
    let ativo = true
    ;(async () => {
      setCarregando(true)
      setErro(null)
      try {
        const [regs, usrs, progs] = await Promise.all([
          pb
            .collection<PresencaRecord>('presencas')
            .getFullList({
              sort: '-data_atendimento',
              fields:
                'id,paciente_id,profissional_id,profissional_nome,data_atendimento,area_servico,status',
            })
            .catch(() => [] as PresencaRecord[]),
          getAllUsers().catch(() => [] as UserRecord[]),
          pb
            .collection<{ id: string; nome: string }>('programa_acompanhamento')
            .getFullList({ filter: "status != 'rascunho'", sort: '-created', fields: 'id,nome' })
            .catch(() => [] as { id: string; nome: string }[]),
        ])
        if (!ativo) return
        setPresencas(regs)
        setUsuarios(usrs)
        setProgramas(progs)
      } catch {
        if (ativo) setErro('Não foi possível carregar os dados dos relatórios.')
      }
      if (ativo) setCarregando(false)
    })()
    return () => {
      ativo = false
    }
  }, [])

  const areas = useMemo(
    () => [...new Set(presencas.map((p) => (p.area_servico || '').trim()).filter(Boolean))].sort(),
    [presencas],
  )

  const nomesPorId = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of usuarios) m.set(u.id, u.name || u.email)
    return m
  }, [usuarios])

  const profissionais = useMemo(
    () =>
      usuarios
        .map((u) => ({ id: u.id, nome: u.name || u.email }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [usuarios],
  )

  // Filtro de programa NÃO é aplicado aqui de propósito: `presencas` não possui
  // campo de programa e simular um cruzamento traria números falsos (ver nota em FiltrosState).
  const presencasFiltradas = useMemo(() => {
    return presencas.filter((p) => {
      const ymd = (p.data_atendimento || '').slice(0, 10)
      if (!ymd) return false
      if (ymd < periodo.inicio || ymd > periodo.fim) return false
      if (
        filtros.area &&
        filtros.area !== 'todas' &&
        (p.area_servico || '').trim() !== filtros.area
      )
        return false
      if (
        filtros.profissional &&
        filtros.profissional !== 'todos' &&
        p.profissional_id !== filtros.profissional
      )
        return false
      return true
    })
  }, [presencas, periodo, filtros.area, filtros.profissional])

  const serie = useMemo(
    () => serieTemporal(presencasFiltradas, periodo.inicio, periodo.fim),
    [presencasFiltradas, periodo],
  )
  const porArea = useMemo(() => agruparPorArea(presencasFiltradas), [presencasFiltradas])
  const porProfissional = useMemo(
    () => agruparPorProfissional(presencasFiltradas, nomesPorId),
    [presencasFiltradas, nomesPorId],
  )

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
        programas={programas}
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
          {/* Números-chave */}
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
                <div className="h-64">
                  {serie.every((s) => s.total === 0) ? (
                    <SemDados mensagem="Sem atendimentos no período filtrado." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={serie}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#73574A" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#73574A" allowDecimals={false} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="Atendimentos"
                          stroke="#C9A46A"
                          strokeWidth={3}
                          dot={serie.length <= 45 ? { r: 3, fill: '#C9A46A' } : false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-gray-900">
                  Atendimentos por área
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {porArea.length === 0 ? (
                    <SemDados mensagem="Sem atendimentos no período filtrado." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={porArea} layout="vertical">
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
                          {porArea.map((_, i) => (
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
            {filtros.area !== 'todas' && ` · Área: ${filtros.area}`}
            {filtros.profissional !== 'todos' &&
              ` · Profissional: ${profissionais.find((p) => p.id === filtros.profissional)?.nome ?? filtros.profissional}`}
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
