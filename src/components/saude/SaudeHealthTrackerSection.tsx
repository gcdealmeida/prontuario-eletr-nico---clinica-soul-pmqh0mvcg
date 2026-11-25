import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, ExternalLink, RefreshCw, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buscarHealthTrackerSummary,
  eh404HealthTracker,
  mensagemErroHealthTracker,
  type HealthTrackerSummary,
} from '@/services/healthTracker'
import { extrairAreasResumo } from '@/components/saude/ResumoHealthTrackerCliente'
import { formatDataPTBR } from '@/lib/constants'

const SOUL = {
  marrom: '#6B4F3A',
  areia: '#F4EDE4',
  borda: '#E5D9C9',
  textoSuave: '#8C7A68',
  dourado: '#B08D57',
}

const ROTULOS_AREA: Record<string, string> = {
  agua: 'Água',
  agua_mililitros: 'Água (ml)',
  sono: 'Sono',
  refeicoes: 'Refeições',
  dieta: 'Dieta',
  medicacoes: 'Medicações',
  emocoes: 'Emoções',
  humor: 'Humor',
  atividades: 'Atividades',
  exercicios: 'Exercícios',
  bebida: 'Bebidas',
  energia: 'Energia',
  cardio: 'Cardio',
  peso: 'Peso',
  exames: 'Exames',
  treinos: 'Treinos',
  metas: 'Metas',
  lembretes: 'Lembretes',
  metrics: 'Métricas',
  metrics_list: 'Métricas',
  summary: 'Resumo',
  records: 'Registros',
  areas: 'Áreas',
}

function rotuloArea(chave: string): string {
  return ROTULOS_AREA[chave] || chave.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatarValor(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return String(v)
  if (Array.isArray(v)) return String(v.length) + ' registro(s)'
  return ''
}

/** Título curto de um item do Health Tracker (mesmos campos do cartão "Por Cliente"). */
const CAMPOS_TITULO_ITEM = [
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

function tituloDoItemHtr(item: Record<string, unknown>): string {
  for (const k of CAMPOS_TITULO_ITEM) {
    const v = item[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

const CAMPOS_DATA_ITEM = ['date', 'data', 'date_time', 'created', 'registrado_em']

function dataDoItemHtr(item: Record<string, unknown>): Date | null {
  for (const k of CAMPOS_DATA_ITEM) {
    const v = item[k]
    if (typeof v === 'string' && v.trim()) {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d
    }
  }
  return null
}

function ResumoAreas({ dados }: { dados: Record<string, unknown> }) {
  const areas = extrairAreasResumo(dados as HealthTrackerSummary)
  if (areas.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map(({ chave, itens }) => {
          const ultimo = itens[0]
          const titulo = tituloDoItemHtr(ultimo)
          const data = dataDoItemHtr(ultimo)
          return (
            <div
              key={chave}
              className="rounded-xl border bg-white/70 p-3"
              style={{ borderColor: SOUL.borda }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: SOUL.textoSuave }}
                >
                  {rotuloArea(chave)}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px]"
                  style={{ borderColor: SOUL.dourado, color: SOUL.marrom }}
                >
                  {itens.length}
                </Badge>
              </div>
              {titulo ? (
                <p className="mt-1 truncate text-sm font-medium" style={{ color: SOUL.marrom }}>
                  {titulo}
                </p>
              ) : (
                <p className="mt-1 text-sm" style={{ color: SOUL.textoSuave }}>
                  {itens.length} registro(s)
                </p>
              )}
              {data && !isNaN(data.getTime()) && (
                <p className="mt-0.5 text-xs" style={{ color: SOUL.textoSuave }}>
                  Último: {formatDataPTBR(data.toISOString().slice(0, 10))}
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }
  const chaves = Object.keys(dados).filter((k) => k !== 'not_found' && k !== 'message')
  if (chaves.length === 0) {
    return (
      <p className="text-sm text-[#8C7A68]">
        O Health Tracker não devolveu dados para este cliente ainda.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {chaves.map((chave) => {
        const valor = formatarValor(dados[chave])
        const ehObjeto =
          dados[chave] !== null && typeof dados[chave] === 'object' && !Array.isArray(dados[chave])
        const ehArray = Array.isArray(dados[chave])
        const itens = ehArray ? (dados[chave] as unknown[]) : []
        const subChaves = ehObjeto
          ? Object.keys(dados[chave] as Record<string, unknown>).slice(0, 4)
          : []
        return (
          <div
            key={chave}
            className="rounded-xl border bg-white/70 p-3"
            style={{ borderColor: SOUL.borda }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: SOUL.textoSuave }}
              >
                {rotuloArea(chave)}
              </span>
              {ehArray && itens.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px]"
                  style={{ borderColor: SOUL.dourado, color: SOUL.marrom }}
                >
                  {itens.length}
                </Badge>
              )}
            </div>
            {valor && (
              <p className="mt-1 text-sm font-medium" style={{ color: SOUL.marrom }}>
                {valor}
              </p>
            )}
            {!valor && ehArray && itens.length === 0 && (
              <p className="mt-1 text-sm" style={{ color: SOUL.textoSuave }}>
                Nenhum registro.
              </p>
            )}
            {!valor && subChaves.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {subChaves.map((sub) => (
                  <li key={sub} className="flex items-baseline justify-between gap-2 text-xs">
                    <span style={{ color: SOUL.textoSuave }}>{rotuloArea(sub)}</span>
                    <span className="font-medium" style={{ color: SOUL.marrom }}>
                      {formatarValor((dados[chave] as Record<string, unknown>)[sub]) || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  /** id do registro em saude_clientes */
  clienteId: string
  /** e-mail do cadastro (já validado no servidor via vínculo) */
  emailCliente: string
}

export function SaudeHealthTrackerSection({ clienteId, emailCliente }: Props) {
  const [carregando, setCarregando] = useState(true)
  const [dados, setDados] = useState<HealthTrackerSummary | null>(null)
  const [erro, setErro] = useState('')
  const [semCadastro, setSemCadastro] = useState(false)
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    if (!clienteId) return
    let cancelado = false
    setCarregando(true)
    setErro('')
    setSemCadastro(false)
    setDados(null)
    buscarHealthTrackerSummary(clienteId)
      .then((resposta) => {
        if (cancelado) return
        const resp = (resposta || {}) as Record<string, unknown>
        const ht = (resp.health_tracker || {}) as Record<string, unknown>
        // Alguns caminhos devolvem o "não encontrado" com 200 e um corpo
        // {not_found: true} — tratar como "sem cadastro", nunca como vazio.
        if (resp.not_found === true || ht.not_found === true) {
          setSemCadastro(true)
          return
        }
        setDados(ht as HealthTrackerSummary)
      })
      .catch((err) => {
        if (cancelado) return
        const nf = eh404HealthTracker(err)
        setSemCadastro(nf)
        setErro(nf ? '' : mensagemErroHealthTracker(err))
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [clienteId, recarregar])

  // Recarrega quando o cadastro de saúde do cliente muda (ex.: e-mail corrigido).
  useEffect(() => {
    if (emailCliente) setRecarregar((n) => n + 1)
  }, [emailCliente])

  if (!clienteId) return null

  return (
    <Card
      className="overflow-hidden"
      style={{ backgroundColor: SOUL.areia, borderColor: SOUL.borda }}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: SOUL.marrom }}>
            <ExternalLink className="h-4 w-4" style={{ color: SOUL.dourado }} />
            Health Tracker
          </CardTitle>
          <p className="mt-1 text-xs" style={{ color: SOUL.textoSuave }}>
            Dados do app SOUL Health Tracker do cliente
            {emailCliente ? <span title={emailCliente}> ({emailCliente})</span> : null} — somente
            leitura.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          style={{ color: SOUL.marrom }}
          disabled={carregando}
          onClick={() => setRecarregar((n) => n + 1)}
        >
          <RefreshCw className={'h-3.5 w-3.5' + (carregando ? ' animate-spin' : '')} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {carregando && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}
        {/* Estado vazio: cliente existe no nosso app mas não tem conta no Health Tracker. */}
        {!carregando && semCadastro && (
          <div
            className="flex items-start gap-3 rounded-xl border p-4 text-sm"
            style={{ borderColor: SOUL.borda, backgroundColor: '#FAF6F0', color: SOUL.marrom }}
          >
            <UserPlus className="mt-0.5 h-4 w-4 shrink-0" style={{ color: SOUL.dourado }} />
            <div className="space-y-1">
              <p className="font-medium">Cliente sem cadastro no Health Tracker</p>
              <p className="text-xs" style={{ color: SOUL.textoSuave }}>
                Não encontramos uma conta deste cliente no app SOUL Health Tracker (SOUL HTR){' '}
                {emailCliente ? (
                  <>
                    para o e-mail <span className="font-medium">{emailCliente}</span>
                  </>
                ) : null}
                . Para acompanhar os dados dele aqui, o cliente precisa criar a conta no app (aba
                Perfil → conta de acesso) usando este e-mail.
              </p>
            </div>
          </div>
        )}
        {!carregando && erro && (
          <div
            className="flex items-start gap-2 rounded-xl border p-3 text-sm"
            style={{ borderColor: SOUL.borda, backgroundColor: '#FAF6F0', color: SOUL.marrom }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: SOUL.dourado }} />
            <span>{erro}</span>
          </div>
        )}
        {!carregando && !erro && dados && <ResumoAreas dados={dados as Record<string, unknown>} />}
      </CardContent>
    </Card>
  )
}

export default SaudeHealthTrackerSection
