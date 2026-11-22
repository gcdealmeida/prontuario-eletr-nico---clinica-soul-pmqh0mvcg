import { useMemo, useState } from 'react'
import { Activity, Droplet, HeartPulse, Moon, Plus, Smile, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDataHoraPTBR } from '@/lib/constants'
import {
  descreverRegistro,
  hojeYMD,
  registrosDoDia,
  seriesSonoPorDia,
  serieUltimosDias,
  horasSonoDeRegistro,
  VALORES_HUMOR,
  rotuloHumor,
} from '@/lib/saudeAgregacoes'
import { ICONES_TIPO } from '@/components/saude/SaudeResumoIcones'
import type { SaudeRegistroRecord } from '@/services/saudeBemEstar'

interface Props {
  registros: SaudeRegistroRecord[]
  onAbrirRegistro: (tipo?: 'sono' | 'bebida' | 'emocao' | 'sintoma' | 'atividade_fisica') => void
  onExcluir: (id: string) => void
}

type SubAba = 'sono' | 'atividade' | 'bebidas' | 'emocoes' | 'sintomas'

const SUB_ABAS: { v: SubAba; l: string }[] = [
  { v: 'sono', l: 'Sono' },
  { v: 'atividade', l: 'Atividade' },
  { v: 'bebidas', l: 'Bebidas' },
  { v: 'emocoes', l: 'Emoções' },
  { v: 'sintomas', l: 'Sintomas' },
]

const CORES_FASES: Record<string, string> = {
  deep: '#2C4A3B',
  rem: '#3E7C59',
  light: '#7FA98F',
  awake: '#C9A46A',
}

/** Métricas do cliente — Sono (fases Deep/REM/Light/Awake), Atividade, Bebidas, Emoções, Sintomas. */
export function ClienteMetricas({ registros, onAbrirRegistro, onExcluir }: Props) {
  const [sub, setSub] = useState<SubAba>('sono')
  const [detalheSono, setDetalheSono] = useState<string | null>(null)
  const hoje = hojeYMD()

  const registrosSub = useMemo(
    () => registros.filter((r) => registrosDaSub(sub).includes(r.tipo)),
    [registros, sub],
  )

  const serie = useMemo(() => serieUltimosDias(registros, 14), [registros])
  const serieSono = useMemo(() => seriesSonoPorDia(registros, 14), [registros])

  const sonoHoje = useMemo(
    () =>
      registros.filter((r) => r.tipo === 'sono' && (r.data || '').slice(0, 10) === hoje)[0] || null,
    [registros, hoje],
  )

  const sonoSelecionado = useMemo(
    () => registros.find((r) => r.id === detalheSono) || null,
    [registros, detalheSono],
  )

  const sonoDetalhe = sonoSelecionado || sonoHoje

  // totais por bebida nos últimos 14 dias
  const porBebida = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const r of registros.filter((x) => x.tipo === 'bebida')) {
      const b = String(((r.dados_json || {}) as Record<string, unknown>).bebida || 'agua')
      const copos = Number(((r.dados_json || {}) as Record<string, unknown>).copos || 1)
      acc[b] = (acc[b] || 0) + copos
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  }, [registros])

  const distribuicaoHumor = useMemo(() => {
    const emo = registros.filter((x) => x.tipo === 'emocao')
    const total = emo.length || 1
    const acc: Record<string, number> = {}
    for (const r of emo) {
      const h = String(((r.dados_json || {}) as Record<string, unknown>).humor || 'neutro')
      acc[h] = (acc[h] || 0) + 1
    }
    return Object.entries(acc).map(([k, n]) => ({
      humor: k,
      pct: Math.round((n / total) * 100),
    }))
  }, [registros])

  return (
    <div className="space-y-4">
      {/* Sub-abas + botão registrar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {SUB_ABAS.map((s) => (
            <button
              key={s.v}
              onClick={() => setSub(s.v)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                sub === s.v
                  ? 'bg-[#3E7C59] text-white'
                  : 'bg-white text-[#5C7263] border border-[#3E7C59]/20 hover:border-[#3E7C59]/50'
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() =>
            onAbrirRegistro(
              sub === 'bebidas'
                ? 'bebida'
                : sub === 'emocoes'
                  ? 'emocao'
                  : sub === 'sintomas'
                    ? 'sintoma'
                    : (sub as 'sono' | 'atividade_fisica'),
            )
          }
          className="bg-[#3E7C59] hover:bg-[#33684A] text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </div>

      {/* ===== Sono ===== */}
      {sub === 'sono' && (
        <div className="space-y-4">
          <Card className="bg-white/85 border-[#3E7C59]/15">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Moon className="h-4 w-4 text-[#3E7C59]" />
              <CardTitle className="text-sm">Últimas noites (horas dormidas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serieSono}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3E7C5922" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) => v.slice(8, 10)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v}h`, 'Sono']} />
                    <Bar dataKey="horas" fill="#3E7C59" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {sonoDetalhe && (
            <Card className="bg-white/85 border-[#3E7C59]/15">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="h-4 w-4 text-[#3E7C59]" /> Detalhe da noite
                </CardTitle>
                {sonoHoje && (
                  <Button variant="ghost" size="sm" onClick={() => onAbrirRegistro('sono')}>
                    Editar hoje
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <SonoFasesVisual dados={sonoDetalhe} />
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/85 border-[#3E7C59]/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Histórico de sono</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {registros.filter((r) => r.tipo === 'sono').length === 0 && (
                <p className="text-sm text-[#5C7263] italic">Nenhuma noite registrada.</p>
              )}
              {registros
                .filter((r) => r.tipo === 'sono')
                .slice(0, 20)
                .map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setDetalheSono(r.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-colors ${
                      detalheSono === r.id ? 'bg-[#3E7C59]/10' : 'bg-[#F0F5F0] hover:bg-[#E4EEE6]'
                    }`}
                  >
                    <span className="text-sm text-[#2C4A3B]">
                      {formatDataHoraPTBR(r.data)} · {horasSonoDeRegistro(r)}
                    </span>
                    <span className="text-xs text-[#5C7263]">ver detalhe</span>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== Atividade ===== */}
      {sub === 'atividade' && (
        <div className="space-y-4">
          <Card className="bg-white/85 border-[#3E7C59]/15">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Activity className="h-4 w-4 text-[#3E7C59]" />
              <CardTitle className="text-sm">Minutos de atividade (14 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={serie.map((d) => ({ dia: d.dia, minutos: d.atividade_min || 0 }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#3E7C5922" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) => v.slice(8, 10)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} min`, 'Atividade']} />
                    <Bar dataKey="minutos" fill="#3E7C59" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <ListaRegistros registros={registrosSub} onExcluir={onExcluir} />
        </div>
      )}

      {/* ===== Bebidas ===== */}
      {sub === 'bebidas' && (
        <div className="space-y-4">
          <Card className="bg-white/85 border-[#3E7C59]/15">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Droplet className="h-4 w-4 text-[#3E7C59]" />
              <CardTitle className="text-sm">Copos por bebida (histórico)</CardTitle>
            </CardHeader>
            <CardContent>
              {porBebida.length === 0 ? (
                <p className="text-sm text-[#5C7263] italic">Nenhuma bebida registrada.</p>
              ) : (
                <div className="space-y-2">
                  {porBebida.map(([b, n]) => (
                    <div key={b} className="flex items-center gap-2">
                      <span className="w-28 text-xs capitalize text-[#2C4A3B]">
                        {rotuloBebida(b)}
                      </span>
                      <div className="h-2.5 flex-1 rounded-full bg-[#3E7C59]/10">
                        <div
                          className="h-2.5 rounded-full bg-[#3E7C59]"
                          style={{
                            width: `${Math.min(100, (n / Math.max(...porBebida.map((x) => x[1]))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#5C7263] w-12 text-right">{n}x</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <ListaRegistros registros={registrosSub} onExcluir={onExcluir} />
        </div>
      )}

      {/* ===== Emoções ===== */}
      {sub === 'emocoes' && (
        <div className="space-y-4">
          <Card className="bg-white/85 border-[#3E7C59]/15">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Smile className="h-4 w-4 text-[#3E7C59]" />
              <CardTitle className="text-sm">Como você tem se sentido</CardTitle>
            </CardHeader>
            <CardContent>
              {distribuicaoHumor.length === 0 ? (
                <p className="text-sm text-[#5C7263] italic">Nenhum humor registrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {distribuicaoHumor.map(({ humor, pct }) => (
                    <div key={humor} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-[#2C4A3B]">{rotuloHumor(humor)}</span>
                      <div className="h-2.5 flex-1 rounded-full bg-[#3E7C59]/10">
                        <div
                          className="h-2.5 rounded-full bg-[#3E7C59]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#5C7263] w-10 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <ListaRegistros registros={registrosSub} onExcluir={onExcluir} />
        </div>
      )}

      {/* ===== Sintomas ===== */}
      {sub === 'sintomas' && (
        <div className="space-y-4">
          <Card className="bg-white/85 border-[#3E7C59]/15">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <HeartPulse className="h-4 w-4 text-[#3E7C59]" />
              <CardTitle className="text-sm">Sintomas recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {registrosSub.length === 0 ? (
                <p className="text-sm text-[#5C7263] italic">Nenhum sintoma registrado.</p>
              ) : (
                <div className="space-y-2">
                  {registrosSub.slice(0, 15).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg bg-[#FDF6E9] border border-[#C9A46A]/30 p-3"
                    >
                      <p className="text-sm text-[#33221C]">{descreverRegistro(r)}</p>
                      <p className="text-[10px] text-[#73574A]/70 mt-1">
                        {formatDataHoraPTBR(r.data)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <ListaRegistros registros={registrosSub} onExcluir={onExcluir} />
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={() => onAbrirRegistro()}
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-[#3E7C59] hover:bg-[#33684A] text-white shadow-lg md:bottom-8"
        title="Registrar métrica"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  )
}

function ListaRegistros({
  registros,
  onExcluir,
}: {
  registros: SaudeRegistroRecord[]
  onExcluir: (id: string) => void
}) {
  if (registros.length === 0) {
    return <p className="text-sm text-[#5C7263] italic">Nada registrado ainda.</p>
  }
  return (
    <div className="space-y-2">
      {registros.slice(0, 30).map((r) => {
        const Icone = ICONES_TIPO[r.tipo]
        return (
          <div key={r.id} className="flex items-start gap-3 rounded-lg bg-white/80 p-3">
            <div className="rounded-full bg-[#3E7C59]/10 p-2 shrink-0">
              <Icone className="h-3.5 w-3.5 text-[#3E7C59]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#2C4A3B]">{descreverRegistro(r)}</p>
              <p className="text-[10px] text-[#5C7263]/70">{formatDataHoraPTBR(r.data)}</p>
            </div>
            <button
              onClick={() => onExcluir(r.id)}
              className="text-[#5C7263]/60 hover:text-red-500"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function SonoFasesVisual({ dados }: { dados: SaudeRegistroRecord }) {
  const d = (dados.dados_json || {}) as Record<string, unknown>
  const fases = (d.fases || {}) as Record<string, unknown>
  const deitar = String(d.hora_deitar || '')
  const acordar = String(d.hora_acordar || '')

  const celulas: { chave: string; l: string; v: number | null; cor: string }[] = [
    { chave: 'deep', l: 'Deep', v: (fases.deep as number) ?? null, cor: CORES_FASES.deep },
    { chave: 'rem', l: 'REM', v: (fases.rem as number) ?? null, cor: CORES_FASES.rem },
    { chave: 'light', l: 'Light', v: (fases.light as number) ?? null, cor: CORES_FASES.light },
    { chave: 'awake', l: 'Awake', v: (fases.awake as number) ?? null, cor: CORES_FASES.awake },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {celulas.map((c) => (
          <div
            key={c.chave}
            className="rounded-xl p-3 text-white"
            style={{ backgroundColor: c.cor }}
          >
            <p className="text-[10px] opacity-80">{c.l}</p>
            <p className="text-lg font-bold leading-tight">{c.v != null ? `${c.v}h` : '—'}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#5C7263]">
        <span>
          Deitou-se: <strong className="text-[#2C4A3B]">{deitar || '—'}</strong>
        </span>
        <span>
          Acordou: <strong className="text-[#2C4A3B]">{acordar || '—'}</strong>
        </span>
        <span>
          Qualidade: <strong className="text-[#2C4A3B]">{String(d.qualidade || '—')}/5</strong>
        </span>
        <span>
          Total: <strong className="text-[#2C4A3B]">{horasSonoDeRegistro(dados)}</strong>
        </span>
      </div>
      <p className="text-[10px] text-[#5C7263]/60">
        Bedtime {deitar || '—'} · Wakeup {acordar || '—'}
      </p>
    </div>
  )
}

function registrosDaSub(sub: SubAba): string[] {
  switch (sub) {
    case 'sono':
      return ['sono']
    case 'atividade':
      return ['atividade_fisica']
    case 'bebidas':
      return ['bebida']
    case 'emocoes':
      return ['emocao']
    case 'sintomas':
      return ['sintoma']
    default:
      return []
  }
}

function rotuloBebida(v: string): string {
  return (
    (
      {
        agua: 'Água',
        cafe: 'Café',
        cha: 'Chá',
        suco: 'Suco',
        refrigerante: 'Refrigerante',
        alcool: 'Álcool',
      } as Record<string, string>
    )[v] || v
  )
}

export default ClienteMetricas
