import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buscarHealthTrackerSummary,
  mensagemErroHealthTracker,
  type HealthTrackerSummary,
} from '@/services/healthTracker'

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

function ResumoAreas({ dados }: { dados: Record<string, unknown> }) {
  const chaves = Object.keys(dados)
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
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    if (!clienteId) return
    let cancelado = false
    setCarregando(true)
    setErro('')
    setDados(null)
    buscarHealthTrackerSummary(clienteId)
      .then((resposta) => {
        if (cancelado) return
        setDados((resposta && resposta.health_tracker) || {})
      })
      .catch((err) => {
        if (cancelado) return
        setErro(mensagemErroHealthTracker(err))
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [clienteId, recarregar])

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
