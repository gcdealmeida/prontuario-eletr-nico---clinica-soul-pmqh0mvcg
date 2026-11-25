import { useEffect, useState } from 'react'
import { AlertTriangle, ExternalLink, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  buscarHealthTrackerSummary,
  eh404HealthTracker,
  mensagemErroHealthTracker,
  type HealthTrackerSummary,
} from '@/services/healthTracker'
import { formatDataPTBR } from '@/lib/constants'
import { SOUL_HTR } from '@/lib/soulHtrTheme'
import type { SaudeClienteRecord } from '@/services/saudeBemEstar'

/* ------------------------------------------------------------------ */
/* Dados REAIS do SOUL Health Tracker no painel Clínica — Monitoramento */
/*                                                                      */
/* Para cada cliente de saude_clientes, busca o resumo via API de       */
/* confiança (GET /backend/v1/healthtracker/summary?cliente=<id>, que   */
/* fala com o outro projeto) e renderiza as áreas que o cliente lança   */
/* no app dele. Estados: carregando / ok / sem cadastro (404) / erro.   */
/* ------------------------------------------------------------------ */

export type EstadoResumoHtr =
  | { estado: 'carregando' }
  | { estado: 'ok'; dados: HealthTrackerSummary }
  | { estado: 'sem_cadastro'; email: string }
  | { estado: 'erro'; mensagem: string }

const ROTULOS_COLECAO: Record<string, string> = {
  health_metrics: 'Métricas',
  medical_records: 'Registros médicos',
  emotional_logs: 'Emoções',
  diets: 'Dietas',
  meals: 'Refeições',
  reminders: 'Lembretes',
  medications: 'Medicações',
  profile_biomarkers: 'Biomarcadores',
  profile_conditions: 'Condições',
  profile_allergies: 'Alergias',
  profile_vaccinations: 'Vacinas',
  profile_events: 'Eventos',
  profile_genetics: 'Genética',
  professionals: 'Profissionais',
  lifestyle: 'Estilo de vida',
  exams: 'Exames',
  workouts: 'Treinos',
  activities: 'Atividades',
  water: 'Água',
  sleep: 'Sono',
  ai_analyses: 'Análises de IA',
}

const rotuloColecao = (chave: string) =>
  ROTULOS_COLECAO[chave] ||
  chave
    .replace(/^profile_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

const ehRegistro = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Extrai a lista de "áreas" (coleções com itens) do resumo do Health Tracker. */
export function extrairAreasResumo(
  dados: HealthTrackerSummary,
): Array<{ chave: string; itens: Record<string, unknown>[] }> {
  const raiz = (dados || {}) as Record<string, unknown>
  const fonte =
    ehRegistro(raiz.collections) && raiz.collections
      ? (raiz.collections as Record<string, unknown>)
      : raiz
  const areas: Array<{ chave: string; itens: Record<string, unknown>[] }> = []
  for (const [chave, valor] of Object.entries(fonte)) {
    if (chave === 'collections' || chave === 'patient') continue
    if (Array.isArray(valor) && valor.length > 0) {
      areas.push({ chave, itens: valor.filter(ehRegistro) as Record<string, unknown>[] })
    }
  }
  areas.sort((a, b) => b.itens.length - a.itens.length)
  return areas
}

const CAMPOS_DATA = ['date', 'data', 'date_time', 'created', 'registrado_em']

function dataDoItem(item: Record<string, unknown>): Date | null {
  for (const k of CAMPOS_DATA) {
    const v = item[k]
    if (typeof v === 'string' && v.trim()) {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d
    }
  }
  return null
}

const CAMPOS_TITULO = [
  'title',
  'titulo',
  'nome',
  'name',
  'label',
  'tipo',
  'type',
  'medicacao',
  'medication',
  'alimento',
  'food',
  'exercicio',
  'exercise',
  'humor',
  'emocao',
  'sintoma',
  'observacao',
]

function tituloDoItem(item: Record<string, unknown>): string {
  for (const k of CAMPOS_TITULO) {
    const v = item[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

const CAMPOS_DETALHE = [
  'value',
  'valor',
  'quantidade',
  'copos',
  'minutos',
  'duracao_min',
  'peso_kg',
  'peso',
  'horas',
  'horas_dormidas',
  'notas',
  'notes',
  'observacao',
  'dose',
]

function detalheDoItem(item: Record<string, unknown>): string {
  const partes: string[] = []
  for (const k of CAMPOS_DETALHE) {
    const v = item[k]
    if (typeof v === 'number' && v > 0) partes.push(String(v))
    else if (typeof v === 'string' && v.trim() && !CAMPOS_TITULO.includes(k)) partes.push(v.trim())
  }
  return partes.join(' • ')
}

const mesmoDia = (d: Date, ymd: string) => {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10) === ymd
}

/**
 * Hook: busca o resumo real do Health Tracker de cada cliente (pelo e-mail,
 * no servidor) e devolve um mapa id → estado. Refaz a busca quando os ids
 * dos clientes mudam ou quando `tick` aumenta (botão atualizar).
 */
export function useResumosHealthTracker(
  clientes: SaudeClienteRecord[],
  tick: number,
): Record<string, EstadoResumoHtr> {
  const [mapa, setMapa] = useState<Record<string, EstadoResumoHtr>>({})

  const ids = clientes.map((c) => c.id).join('|')

  useEffect(() => {
    let cancelado = false
    if (!ids) {
      setMapa({})
      return
    }
    // Começa todos como carregando (visão imediata de skeletons).
    const inicial: Record<string, EstadoResumoHtr> = {}
    for (const c of clientes) inicial[c.id] = { estado: 'carregando' }
    setMapa(inicial)

    const rodar = async () => {
      // Sequencial: cada resumo passa pelo handshake de confiança no hook.
      for (const c of clientes) {
        if (!c.email) {
          if (!cancelado)
            setMapa((m) => ({
              ...m,
              [c.id]: {
                estado: 'erro',
                mensagem: 'Cliente sem e-mail cadastrado — não é possível buscar o Health Tracker.',
              },
            }))
          continue
        }
        try {
          const resposta = await buscarHealthTrackerSummary(c.id)
          if (cancelado) return
          setMapa((m) => ({
            ...m,
            [c.id]: { estado: 'ok', dados: (resposta && resposta.health_tracker) || {} },
          }))
        } catch (err) {
          if (cancelado) return
          if (eh404HealthTracker(err)) {
            setMapa((m) => ({ ...m, [c.id]: { estado: 'sem_cadastro', email: c.email || '' } }))
          } else {
            setMapa((m) => ({
              ...m,
              [c.id]: { estado: 'erro', mensagem: mensagemErroHealthTracker(err) },
            }))
          }
        }
      }
    }
    void rodar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, tick])

  return mapa
}

const horaCurta = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Bloco de dados reais do Health Tracker dentro do cartão do cliente. */
export function ResumoHealthTrackerCliente({
  estado,
  clienteId,
  onAbrirCliente,
}: {
  estado: EstadoResumoHtr | undefined
  clienteId: string
  onAbrirCliente: (id: string) => void
}) {
  if (!estado || estado.estado === 'carregando') {
    return (
      <div
        className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
        style={{ backgroundColor: SOUL_HTR.bgAlt, color: SOUL_HTR.textoSuave }}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando dados do SOUL Health Tracker...
      </div>
    )
  }

  if (estado.estado === 'sem_cadastro') {
    return (
      <div
        className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
        style={{ backgroundColor: SOUL_HTR.bgAlt, color: SOUL_HTR.marrom }}
      >
        <UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: SOUL_HTR.dourado }} />
        <span>
          Cliente sem cadastro no Health Tracker. Para ver os dados dele aqui, o cliente precisa
          criar a conta no app (aba Perfil → conta de acesso) usando o e-mail{' '}
          <span className="font-medium">{estado.email || 'cadastrado'}</span>.
        </span>
      </div>
    )
  }

  if (estado.estado === 'erro') {
    return (
      <div
        className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
        style={{ backgroundColor: SOUL_HTR.bgAlt, color: SOUL_HTR.marrom }}
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: '#B0714F' }} />
        <span>Falha ao conectar com o Health Tracker: {estado.mensagem}</span>
      </div>
    )
  }

  const areas = extrairAreasResumo(estado.dados)
  const hoje = new Date()
  const hojeYMD = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)

  // Itens recentes (todas as áreas) + contagem de itens de hoje.
  const recentes: Array<{ area: string; item: Record<string, unknown>; data: Date | null }> = []
  let totalHoje = 0
  for (const area of areas) {
    for (const item of area.itens) {
      const data = dataDoItem(item)
      if (data && mesmoDia(data, hojeYMD)) totalHoje++
      recentes.push({ area: area.chave, item, data })
    }
  }
  recentes.sort((a, b) => (b.data?.getTime() || 0) - (a.data?.getTime() || 0))

  return (
    <div
      className="mt-3 rounded-lg px-3 py-2.5"
      style={{ backgroundColor: SOUL_HTR.bgAlt, border: `1px solid ${SOUL_HTR.borda}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: SOUL_HTR.textoSuave }}
        >
          <ExternalLink className="h-3 w-3" style={{ color: SOUL_HTR.dourado }} />
          SOUL Health Tracker — dados reais do cliente
        </p>
        <Badge
          variant="outline"
          className="text-[10px]"
          style={{ borderColor: SOUL_HTR.dourado, color: SOUL_HTR.marrom }}
        >
          {totalHoje} hoje
        </Badge>
      </div>

      {areas.length === 0 ? (
        <p className="mt-2 text-xs italic" style={{ color: SOUL_HTR.textoFraco }}>
          Conta conectada, mas o cliente ainda não registrou nada no app dele.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {recentes.slice(0, 4).map(({ area, item, data }, i) => {
            const titulo = tituloDoItem(item)
            const detalhe = detalheDoItem(item)
            return (
              <li key={`${area}-${i}`} className="flex items-baseline gap-2 text-xs">
                <span
                  className="shrink-0 font-medium"
                  style={{ color: SOUL_HTR.dourado }}
                  title={rotuloColecao(area)}
                >
                  {rotuloColecao(area)}
                </span>
                <span className="min-w-0 flex-1 truncate" style={{ color: SOUL_HTR.marrom }}>
                  {titulo}
                  {detalhe ? ` — ${detalhe}` : ''}
                </span>
                <span className="shrink-0" style={{ color: SOUL_HTR.textoFraco }}>
                  {data
                    ? mesmoDia(data, hojeYMD)
                      ? horaCurta(data)
                      : formatDataPTBR(data.toISOString().slice(0, 10))
                    : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Acesso rápido Dra/Prof.: abre a visão individual com o resumo carregado */}
      <Button
        variant="outline"
        size="sm"
        className="mt-2.5 h-7 w-full gap-1.5 text-xs"
        style={{ borderColor: SOUL_HTR.dourado, color: SOUL_HTR.marrom }}
        onClick={(e) => {
          e.stopPropagation()
          onAbrirCliente(clienteId)
        }}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Acesso rápido Dra/Prof. — abrir painel clínico
      </Button>
    </div>
  )
}
