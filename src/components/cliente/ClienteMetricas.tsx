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
  deep: '#5C3A21',
  rem: '#7B4B2A',
  light: '#C9A063',
  awake: '#E7CFA0',
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
                  ? 'bg-[#7B4B2A] text-white'
                  : 'bg-white text-[#7B4B2A] border border-[#7B4B2A]/20 hover:border-[#C9A063]'
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
          className="bg-[#7B4B2A] hover:bg-[#5C3A21] text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </div>

      {/* ===== Sono ===== */}
      {sub === 'sono' && (
        <div className="space-y-4">
          <Card className="bg-white border-[#E2D4BF] shadow-sm">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Moon className="h-4 w-4 text-[#7B4B2A]" />
              <CardTitle className="text-sm text-[#5C3A21]">
                Últimas noites (horas dormidas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serieSono}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C9A06333" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) => v.slice(8, 10)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v}h`, 'Sono']} />
                    <Bar dataKey="horas" fill="#C9A063" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {sonoDetalhe && (
            <Card className="bg-white border-[#E2D4BF] shadow-sm">
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-2 text-[#5C3A21]">
                  <Moon className="h-4 w-4 text-[#7B4B2A]" /> Detalhe da noite
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

          <Card className="bg-white border-[#E2D4BF] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#5C3A21]">Histórico de sono</CardTitle>
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
                    className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors ${
                      detalheSono === r.id
                        ? 'bg-[#C9A063]/20 ring-1 ring-[#C9A063]'
                        : 'bg-[#F5EFE6] hover:bg-[#EFE6D8]'
                    }`}
                  >
                    <span className="text-sm text-[#5C3A21]">
                      {formatDataHoraPTBR(r.data)} · {horasSonoDeRegistro(r)}
                    </span>
                    <span className="text-xs text-[#8A6F58]">ver detalhe</span>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== Atividade ===== */}
      {sub === 'atividade' && (
        <div className="space-y-4">
          <Card className="bg-white border-[#E2D4BF] shadow-sm">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Activity className="h-4 w-4 text-[#7B4B2A]" />
              <CardTitle className="text-sm text-[#5C3A21]">
                Minutos de atividade (14 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={serie.map((d) => ({ dia: d.dia, minutos: d.atividade_min || 0 }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#C9A06333" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) => v.slice(8, 10)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v} min`, 'Atividade']} />
                    <Bar dataKey="minutos" fill="#C9A063" radius={[4, 4, 0, 0]} />
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
          <Card className="bg-white border-[#E2D4BF] shadow-sm">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Droplet className="h-4 w-4 text-[#7B4B2A]" />
              <CardTitle className="text-sm text-[#5C3A21]">Copos por bebida (histórico)</CardTitle>
            </CardHeader>
            <CardContent>
              {porBebida.length === 0 ? (
                <p className="text-sm text-[#8A6F58] italic">Nenhuma bebida registrada.</p>
              ) : (
                <div className="space-y-2">
                  {porBebida.map(([b, n]) => (
                    <div key={b} className="flex items-center gap-2">
                      <span className="w-28 text-xs capitalize text-[#5C3A21]">
                        {rotuloBebida(b)}
                      </span>
                      <div className="h-2.5 flex-1 rounded-full bg-[#EFE6D8]">
                        <div
                          className="h-2.5 rounded-full bg-[#C9A063]"
                          style={{
                            width: `${Math.min(100, (n / Math.max(...porBebida.map((x) => x[1]))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#8A6F58] w-12 text-right">{n}x</span>
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
          <Card className="bg-white border-[#E2D4BF] shadow-sm">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Smile className="h-4 w-4 text-[#7B4B2A]" />
              <CardTitle className="text-sm text-[#5C3A21]">Como você tem se sentido</CardTitle>
            </CardHeader>
            <CardContent>
              {distribuicaoHumor.length === 0 ? (
                <p className="text-sm text-[#8A6F58] italic">Nenhum humor registrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {distribuicaoHumor.map(({ humor, pct }) => (
                    <div key={humor} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-[#5C3A21]">{rotuloHumor(humor)}</span>
                      <div className="h-2.5 flex-1 rounded-full bg-[#EFE6D8]">
                        <div
                          className="h-2.5 rounded-full bg-[#7B4B2A]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#8A6F58] w-10 text-right">{pct}%</span>
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
          <Card className="bg-white border-[#E2D4BF] shadow-sm">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <HeartPulse className="h-4 w-4 text-[#7B4B2A]" />
              <CardTitle className="text-sm text-[#5C3A21]">Sintomas recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {registrosSub.length === 0 ? (
                <p className="text-sm text-[#8A6F58] italic">Nenhum sintoma registrado.</p>
              ) : (
                <div className="space-y-2">
                  {registrosSub.slice(0, 15).map((r) => (
                    <div key={r.id} className="rounded-xl bg-[#F5EFE6] border border-[#E2D4BF] p-3">
                      <p className="text-sm text-[#5C3A21]">{descreverRegistro(r)}</p>
                      <p className="text-[10px] text-[#8A6F58]/80 mt-1">
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
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-[#7B4B2A] hover:bg-[#5C3A21] text-white shadow-lg md:bottom-8"
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
    return <p className="text-sm text-[#8A6F58] italic">Nada registrado ainda.</p>
  }
  return (
    <div className="space-y-2">
      {registros.slice(0, 30).map((r) => {
        const Icone = ICONES_TIPO[r.tipo]
        return (
          <div
            key={r.id}
            className="flex items-start gap-3 rounded-xl border border-[#E2D4BF] bg-white p-3 shadow-sm"
          >
            <div className="rounded-full bg-[#C9A063]/15 p-2 shrink-0">
              <Icone className="h-3.5 w-3.5 text-[#7B4B2A]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#5C3A21]">{descreverRegistro(r)}</p>
              <p className="text-[10px] text-[#8A6F58]/80">{formatDataHoraPTBR(r.data)}</p>
            </div>
            <button
              onClick={() => onExcluir(r.id)}
              className="text-[#8A6F58]/70 hover:text-red-500"
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
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#8A6F58]">
        <span>
          Deitou-se: <strong className="text-[#5C3A21]">{deitar || '—'}</strong>
        </span>
        <span>
          Acordou: <strong className="text-[#5C3A21]">{acordar || '—'}</strong>
        </span>
        <span>
          Qualidade: <strong className="text-[#5C3A21]">{String(d.qualidade || '—')}/5</strong>
        </span>
        <span>
          Total: <strong className="text-[#5C3A21]">{horasSonoDeRegistro(dados)}</strong>
        </span>
      </div>
      <p className="text-[10px] text-[#8A6F58]/70">
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
