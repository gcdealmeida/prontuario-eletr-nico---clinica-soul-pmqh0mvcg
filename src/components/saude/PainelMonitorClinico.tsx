import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  Activity,
  AlarmClock,
  Baby,
  Bed,
  Bell,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  Loader2,
  Moon,
  Pill,
  RefreshCw,
  Salad,
  Search,
  Smile,
  Stethoscope,
  Utensils,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatDataHoraPTBR, formatDataPTBR } from '@/lib/constants'
import {
  labelTipoRegistro,
  type SaudeClienteRecord,
  type SaudeLembreteRecord,
  type SaudeRegistroRecord,
  type SaudeRegistroTipo,
} from '@/services/saudeBemEstar'
import { SOUL_HTR } from '@/lib/soulHtrTheme'
import type { ItemFeedSaude, NotificacaoRegistro } from '@/hooks/useSaudeRealtime'
import { getTimestampFeed } from '@/lib/saudeFeed'
import {
  ResumoHealthTrackerCliente,
  useResumosHealthTracker,
} from '@/components/saude/ResumoHealthTrackerCliente'

const iconeTipo = (t: string) => {
  const m: Record<string, typeof Activity> = {
    atividade_fisica: Activity,
    sono: Moon,
    bebida: Droplets,
    alimento: Utensils,
    exame: Stethoscope,
    dieta: Salad,
    sintoma: Flame,
    medicacao: Pill,
    refeicao: Utensils,
    emocao: Smile,
    treino: Dumbbell,
    reabilitacao: HeartPulse,
    agua: Droplets,
    lembrete: AlarmClock,
    sono_profundo: Bed,
    checkin: Baby,
  }
  return m[t] || Activity
}

const hojeYMD = () => {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

const horaCurta = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Resumo curto do conteúdo do registro (dados_json), p/ o feed. */
function resumoRegistro(r: SaudeRegistroRecord): string {
  const d = (r.dados_json || {}) as Record<string, unknown>
  const partes: string[] = []
  for (const k of [
    'valor',
    'quantidade',
    'horas',
    'horas_dormidas',
    'copos',
    'minutos',
    'duracao_min',
    'peso_kg',
  ]) {
    const v = d[k]
    if (typeof v === 'number' && v > 0) partes.push(String(v))
  }
  for (const k of [
    'nome',
    'alimento',
    'medicacao',
    'exercicio',
    'titulo',
    'intensidade',
    'humor',
    'emocao',
    'sintoma',
  ]) {
    const v = d[k]
    if (typeof v === 'string' && v.trim()) partes.push(v.trim())
  }
  if (partes.length === 0 && r.observacao) partes.push(r.observacao)
  return partes.join(' • ').slice(0, 120)
}

interface Props {
  clientes: SaudeClienteRecord[]
  registros: SaudeRegistroRecord[]
  lembretes?: SaudeLembreteRecord[]
  carregando: boolean
  notificacoes: NotificacaoRegistro[]
  recarregar: () => Promise<void>
  sinoAberto: boolean
  setSinoAberto: (v: boolean) => void
  naoLidas: number
  conectado: boolean
  onAbrirCliente?: (id: string) => void
}

/**
 * Painel do modo CLÍNICA — monitoramento em tempo real dos registros de saúde
 * que os clientes fazem no app deles (SOUL Health Tracker), estilo bege/marrom/dourado.
 */
export function PainelMonitorClinico({
  clientes,
  registros,
  lembretes = [],
  carregando,
  notificacoes,
  recarregar,
  sinoAberto,
  setSinoAberto,
  naoLidas,
  conectado,
  onAbrirCliente,
}: Props) {
  const { toast } = useToast()
  const [buscaLocal, setBuscaLocal] = useState('')
  const [tickHtr, setTickHtr] = useState(0)
  const resumosHtr = useResumosHealthTracker(clientes, tickHtr)

  const atualizarTudo = () => {
    setTickHtr((n) => n + 1)
    void recarregar()
  }

  /* Toast ao chegar notificação nova (evento create do SSE/polling). */
  const ultimaNotificacao = notificacoes[0]
  const ultimaVista = useRef<string>('')
  useEffect(() => {
    if (!ultimaNotificacao) return
    if (ultimaVista.current === ultimaNotificacao.id) return
    ultimaVista.current = ultimaNotificacao.id
    toast({
      title: 'Novo registro do cliente',
      description: `${ultimaNotificacao.clienteNome} registrou ${ultimaNotificacao.tipoLabel}.`,
    })
  }, [ultimaNotificacao, toast])

  const registrosOrdenados = useMemo(
    () =>
      [...registros].sort((a, b) =>
        (b.created || b.data || '') > (a.created || a.data || '') ? 1 : -1,
      ),
    [registros],
  )

  /**
   * Feed em Tempo Real: registros de saúde + lembretes lançados pela clínica,
   * unificados e ordenados do mais novo para o mais antigo (timestamp real de
   * criação — nunca pela data alvo do lembrete).
   */
  const feedOrdenado = useMemo<ItemFeedSaude[]>(
    () => [...registros, ...lembretes].sort((a, b) => getTimestampFeed(b) - getTimestampFeed(a)),
    [registros, lembretes],
  )

  const porCliente = useMemo(() => {
    const map = new Map<string, SaudeRegistroRecord[]>()
    for (const r of registrosOrdenados) {
      const arr = map.get(r.cliente_id) || []
      arr.push(r)
      map.set(r.cliente_id, arr)
    }
    return map
  }, [registrosOrdenados])

  const hoje = hojeYMD()
  const totalHoje = registros.filter((r) => (r.data || '').slice(0, 10) === hoje).length
  const clientesComRegistroHoje = new Set(
    registros.filter((r) => (r.data || '').slice(0, 10) === hoje).map((r) => r.cliente_id),
  ).size

  const metricasHoje = useMemo(() => {
    const acc = { agua: 0, sono: 0, exercicio: 0, humor: 0 }
    for (const r of registros) {
      if ((r.data || '').slice(0, 10) !== hoje) continue
      const d = (r.dados_json || {}) as Record<string, unknown>
      const num = (k: string) => (typeof d[k] === 'number' ? (d[k] as number) : 0)
      if (r.tipo === 'bebida') acc.agua += num('copos') || num('quantidade') || num('ml') / 200
      if (r.tipo === 'sono')
        acc.sono += num('horas') || num('horas_dormidas') || num('duracao_min') / 60
      if (r.tipo === 'atividade_fisica' || r.tipo === 'treino')
        acc.exercicio += num('minutos') || num('duracao_min') || 0
      if (r.tipo === 'emocao') acc.humor += 1
    }
    return acc
  }, [registros, hoje])

  const clientesFiltrados = useMemo(() => {
    const q = buscaLocal.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q),
    )
  }, [clientes, buscaLocal])

  return (
    <div className="space-y-4">
      {/* Barra do painel — busca + status de conexão + sino + refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#73574A]/60" />
          <Input
            placeholder="Buscar cliente por nome ou e-mail..."
            value={buscaLocal}
            onChange={(e) => setBuscaLocal(e.target.value)}
            className="w-full pl-9 sm:w-72"
          />
        </div>
        <div className="flex items-center gap-1">
          <span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: conectado ? SOUL_HTR.marrom : SOUL_HTR.textoFraco }}
            title={conectado ? 'Tempo real ativo (SSE)' : 'Atualização automática por polling'}
          >
            {conectado ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {conectado ? 'Tempo real' : 'Automático'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={atualizarTudo}
            disabled={carregando}
            aria-label="Atualizar monitoramento e dados do Health Tracker"
          >
            <RefreshCw className={'h-4 w-4' + (carregando ? ' animate-spin' : '')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificações de registros dos clientes"
            onClick={() => setSinoAberto(!sinoAberto)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {naoLidas > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B0714F] px-1 text-[10px] font-semibold text-white">
                {naoLidas}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de notificações (painel sob o sino) */}
      {sinoAberto && (
        <Card className="border-[#E2D4BF] shadow-sm" style={{ backgroundColor: SOUL_HTR.card }}>
          <CardContent className="p-2">
            {notificacoes.length === 0 ? (
              <p className="p-3 text-sm text-[#8A6F58]">Nenhuma notificação recente.</p>
            ) : (
              <ul className="max-h-64 overflow-auto">
                {notificacoes.map((n) => {
                  const Ico = iconeTipo(n.tipo)
                  return (
                    <li
                      key={n.id}
                      className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-[#F5EFE6]"
                    >
                      <Ico className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A063]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm" style={{ color: SOUL_HTR.marromEscuro }}>
                          <span className="font-semibold">{n.clienteNome}</span> registrou{' '}
                          {n.tipoLabel}.
                        </p>
                        <p className="text-xs text-[#A98D74]">{formatDataHoraPTBR(n.criadoEm)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 text-xs"
                        onClick={() =>
                          (
                            onAbrirCliente ||
                            ((id: string) => {
                              window.location.href = `/saude-bem-estar?cliente=${id}`
                            })
                          )(n.clienteId)
                        }
                      >
                        Ver
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Métricas consolidadas de hoje */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoMetricaHoje
          icone={<Droplets className="h-4 w-4" />}
          titulo="Água (copos hoje)"
          valor={String(metricasHoje.agua)}
          cor="#4FA3D9"
        />
        <CartaoMetricaHoje
          icone={<Moon className="h-4 w-4" />}
          titulo="Sono (h hoje)"
          valor={metricasHoje.sono.toFixed(1)}
          cor="#6B5B95"
        />
        <CartaoMetricaHoje
          icone={<Dumbbell className="h-4 w-4" />}
          titulo="Exercício (min hoje)"
          valor={String(metricasHoje.exercicio)}
          cor="#B0714F"
        />
        <CartaoMetricaHoje
          icone={<Smile className="h-4 w-4" />}
          titulo="Check-ins de humor hoje"
          valor={String(metricasHoje.humor)}
          cor="#C9A063"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[#73574A]">
        <Badge className="bg-[#C9A46A] text-[#33221C]">{totalHoje} registro(s) hoje</Badge>
        <Badge variant="outline" className="border-[#C9A46A] text-[#73574A]">
          {clientesComRegistroHoje} de {clientes.length} cliente(s) com registro hoje
        </Badge>
        {carregando && (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> atualizando...
          </span>
        )}
      </div>

      {/* Feed consolidado em tempo real */}
      <Card className="border-[#E2D4BF]" style={{ backgroundColor: SOUL_HTR.bg }}>
        <CardContent className="p-3">
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: SOUL_HTR.textoSuave }}
          >
            Feed em tempo real — lançamentos recentes de Saúde &amp; Bem-Estar
          </p>
          {feedOrdenado.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#8A6F58]">
              Nenhum lançamento ainda. Assim que um lançamento for criado (registro do cliente ou
              lembrete da clínica), ele aparece aqui na hora, do mais novo para o mais antigo.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {feedOrdenado.slice(0, 40).map((item) => {
                // ItemFeedSaude = SaudeRegistroRecord | SaudeLembreteRecord.
                // O lembrete NÃO tem `tipo` (tem titulo/descricao/data_hora):
                // `'tipo' in item` estreita a união sem precisar de casts.
                const ehRegistro = 'tipo' in item
                const Ico = iconeTipo(ehRegistro ? item.tipo : 'lembrete')
                const nomeCliente =
                  clientes.find((c) => c.id === item.cliente_id)?.nome || 'Cliente'
                const ts = getTimestampFeed(item)
                const quando = ts ? formatDataHoraPTBR(new Date(ts).toISOString()) : '—'
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5"
                    style={{ border: `1px solid ${SOUL_HTR.borda}` }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: SOUL_HTR.bgAlt }}
                    >
                      <Ico className="h-4 w-4" style={{ color: SOUL_HTR.marrom }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: SOUL_HTR.marromEscuro }}
                      >
                        {nomeCliente} —{' '}
                        {ehRegistro
                          ? labelTipoRegistro(item.tipo)
                          : `Lembrete: ${item.titulo || '—'}`}
                      </p>
                      <p className="truncate text-xs" style={{ color: SOUL_HTR.textoSuave }}>
                        {ehRegistro
                          ? resumoRegistro(item) || formatDataPTBR(item.data)
                          : item.descricao || formatDataPTBR(item.data_hora)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs" style={{ color: SOUL_HTR.textoFraco }}>
                      {quando}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Painel por cliente (estilo Health Tracker) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: SOUL_HTR.textoSuave }}
          >
            Por cliente — dados do SOUL Health Tracker
          </p>
          <Badge
            variant="outline"
            className="gap-1 text-[10px]"
            style={{ borderColor: SOUL_HTR.dourado, color: SOUL_HTR.marrom }}
          >
            <ExternalLink className="h-3 w-3" />
            Acesso Rápido Dra ou Prof.
          </Badge>
        </div>
        {clientesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-[#73574A]">
              Nenhum cliente de saúde encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {clientesFiltrados.map((c) => {
              const rs = (porCliente.get(c.id) || []).slice(0, 6)
              const abrirCliente = () =>
                (
                  onAbrirCliente ||
                  ((id: string) => {
                    window.location.href = `/saude-bem-estar?cliente=${id}`
                  })
                )(c.id)
              return (
                <Card
                  key={c.id}
                  className="border-[#E2D4BF] transition-colors hover:border-[#C9A063]"
                  style={{ backgroundColor: SOUL_HTR.card }}
                >
                  <CardContent className="p-4">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={abrirCliente}
                      aria-label={`Abrir painel clínico de ${c.nome}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className="font-semibold underline-offset-2 hover:underline"
                          style={{ color: SOUL_HTR.marromEscuro }}
                        >
                          {c.nome}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{ borderColor: SOUL_HTR.dourado, color: SOUL_HTR.marrom }}
                        >
                          {rs.length} recente(s)
                        </Badge>
                      </span>
                      <span className="block text-xs" style={{ color: SOUL_HTR.textoFraco }}>
                        {c.email || 'sem e-mail'}
                      </span>
                    </button>
                    <ResumoHealthTrackerCliente
                      estado={resumosHtr[c.id]}
                      clienteId={c.id}
                      onAbrirCliente={(id) =>
                        (
                          onAbrirCliente ||
                          ((vid: string) => {
                            window.location.href = `/saude-bem-estar?cliente=${vid}`
                          })
                        )(id)
                      }
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function CartaoMetricaHoje({
  icone,
  titulo,
  valor,
  cor,
}: {
  icone: React.ReactNode
  titulo: string
  valor: string
  cor: string
}) {
  return (
    <Card className="border-[#E2D4BF]" style={{ backgroundColor: SOUL_HTR.card }}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: `${cor}22`, color: cor }}
          >
            {icone}
          </span>
          <p className="text-xs" style={{ color: SOUL_HTR.textoSuave }}>
            {titulo}
          </p>
        </div>
        <p className="mt-1 text-xl font-bold" style={{ color: SOUL_HTR.marromEscuro }}>
          {valor}
        </p>
      </CardContent>
    </Card>
  )
}

export default PainelMonitorClinico
