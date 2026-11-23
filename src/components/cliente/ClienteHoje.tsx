import { useMemo, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Bell, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  hojeYMD,
  ymdDoRegistro,
  registrosDoDia,
  horasSonoNoDia,
  coposAguaNoDia,
  caloriasNoDia,
  minutosAtividadeNoDia,
  dadosMedicacao,
  descreverRegistro,
} from '@/lib/saudeAgregacoes'
import type {
  MeuPerfilSaude,
  SaudeRegistroRecord,
  SaudeRegistroTipo,
} from '@/services/saudeBemEstar'
import {
  listarSaudeLembretes,
  criarSaudeLembrete,
  excluirSaudeLembrete,
  atualizarSaudeRegistro,
} from '@/services/saudeBemEstar'

interface Props {
  painel: MeuPerfilSaude
  aoAbrirRegistro: (tipo?: SaudeRegistroTipo) => void
}

/** Paleta SOUL HTR (Clínica Soul): bege claro + marrons + dourado. */
const C = {
  fundo: '#F5EFE6',
  card: '#FFFFFF',
  borda: '#E4D8C6',
  texto: '#5C3A21',
  textoSuave: '#8A6A4F',
  acento: '#C9A063',
  acentoEscuro: '#A87E3F',
}

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function somarDias(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function rotuloDia(ymd: string): string {
  const hoje = hojeYMD()
  if (ymd === hoje) return 'HOJE'
  if (ymd === somarDias(hoje, -1)) return 'ONTEM'
  if (ymd === somarDias(hoje, 1)) return 'AMANHÃ'
  return new Date(`${ymd}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .toUpperCase()
}

const ICONES: Partial<Record<SaudeRegistroTipo, string>> = {
  medicacao: '💊',
  bebida: '💧',
  refeicao: '🍽️',
  alimento: '🍎',
  sintoma: '🩺',
  atividade_fisica: '⚡',
  sono: '🌙',
  emocao: '🙂',
  exame: '🧪',
  dieta: '🥗',
}

const ROTULO_CURTO: Partial<Record<SaudeRegistroTipo, string>> = {
  medicacao: 'Meds',
  bebida: 'Água',
  sintoma: 'Sintomas',
  alimento: 'Alimentos',
  atividade_fisica: 'Energia',
  sono: 'Sono',
  emocao: 'Humor',
}

const TIPOS_PILULAS: SaudeRegistroTipo[] = [
  'medicacao',
  'bebida',
  'sintoma',
  'alimento',
  'atividade_fisica',
  'sono',
  'emocao',
]

function fracDia(dt: string): number {
  const hhmm = (dt || '').slice(11, 16)
  const [h, m] = hhmm.split(':').map(Number)
  if (isNaN(h)) return 0.5
  return (h * 60 + (m || 0)) / (24 * 60)
}

interface LembreteForm {
  titulo: string
  data_hora: string
}

export function ClienteHoje({ painel, aoAbrirRegistro }: Props) {
  const { toast } = useToast()
  const [dia, setDia] = useState(hojeYMD())
  const [lembretes, setLembretes] = useState(painel.lembretes || [])
  const [modalLembretes, setModalLembretes] = useState(false)
  const [formLembrete, setFormLembrete] = useState<LembreteForm>({ titulo: '', data_hora: '' })
  const [salvandoLembrete, setSalvandoLembrete] = useState(false)

  const registrosDia = useMemo(() => registrosDoDia(painel.registros, dia), [painel.registros, dia])

  const lembretesDia = useMemo(
    () =>
      lembretes
        .filter((l) => (l.data_hora || '').slice(0, 10) === dia)
        .sort((a, b) => (a.data_hora || '').localeCompare(b.data_hora || '')),
    [lembretes, dia],
  )

  const cartoes = [
    {
      id: 'sono',
      titulo: 'Sono',
      valor: (() => {
        const h = horasSonoNoDia(painel.registros, dia)
        if (h == null) return '—'
        const hh = Math.floor(h)
        const mm = Math.round((h - hh) * 60)
        return mm ? `${hh}h ${mm}m` : `${hh}h`
      })(),
      quando: rotuloDia(dia).toLowerCase(),
      icone: '🌙',
    },
    {
      id: 'atividade',
      titulo: 'Atividade',
      valor: `${minutosAtividadeNoDia(painel.registros, dia)} min`,
      quando: rotuloDia(dia).toLowerCase(),
      icone: '⚡',
    },
    {
      id: 'agua',
      titulo: 'Água',
      valor: `${coposAguaNoDia(painel.registros, dia)} copos`,
      quando: rotuloDia(dia).toLowerCase(),
      icone: '💧',
    },
    {
      id: 'calorias',
      titulo: 'Calorias',
      valor: `${caloriasNoDia(painel.registros, dia)} kcal`,
      quando: rotuloDia(dia).toLowerCase(),
      icone: '🍽️',
    },
  ]

  // Tabela semanal de medicações (linhas = med, colunas = dias da semana)
  const tabelaMed = useMemo(() => {
    const base = new Date(`${dia}T12:00:00`)
    const segunda = new Date(base.getTime() - ((base.getDay() + 6) % 7) * 86400000)
    const diasSemana: string[] = []
    for (let i = 0; i < 7; i++) {
      diasSemana.push(new Date(segunda.getTime() + i * 86400000).toISOString().slice(0, 10))
    }
    const porNome = new Map<
      string,
      { dias: Set<string>; dose: string; horario: string; registroHoje?: SaudeRegistroRecord }
    >()
    for (const r of painel.registros) {
      if (r.tipo !== 'medicacao') continue
      const d = dadosMedicacao(r)
      const nome = d.nome || 'Medicação'
      if (!porNome.has(nome)) {
        porNome.set(nome, { dias: new Set(), dose: d.dose || '', horario: d.horario || '' })
      }
      const item = porNome.get(nome)!
      item.dias.add(ymdDoRegistro(r))
      if (ymdDoRegistro(r) === dia) item.registroHoje = r
    }
    return { diasSemana, linhas: [...porNome.entries()] }
  }, [painel.registros, dia])

  const alternarIngerida = async (r: SaudeRegistroRecord) => {
    const d = { ...(r.dados_json || {}) }
    d.ingerida = d.ingerida === false
    try {
      await atualizarSaudeRegistro(r.id, { dados_json: d })
      toast({ title: d.ingerida ? 'Dose marcada como tomada' : 'Dose desmarcada' })
    } catch {
      toast({ title: 'Não foi possível atualizar a dose', variant: 'destructive' })
    }
  }

  const salvarLembrete = async () => {
    if (!formLembrete.titulo.trim() || !formLembrete.data_hora) return
    setSalvandoLembrete(true)
    try {
      const criado = await criarSaudeLembrete({
        cliente_id: painel.cliente.id,
        titulo: formLembrete.titulo.trim(),
        data_hora: new Date(formLembrete.data_hora).toISOString(),
      })
      setLembretes((prev) =>
        [...prev, criado].sort((a, b) => a.data_hora.localeCompare(b.data_hora)),
      )
      setFormLembrete({ titulo: '', data_hora: '' })
      toast({ title: 'Lembrete criado' })
    } catch {
      toast({ title: 'Erro ao criar lembrete', variant: 'destructive' })
    } finally {
      setSalvandoLembrete(false)
    }
  }

  const removerLembrete = async (id: string) => {
    try {
      await excluirSaudeLembrete(id)
      setLembretes((prev) => prev.filter((l) => l.id !== id))
    } catch {
      toast({ title: 'Erro ao excluir lembrete', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-5">
      {/* ===== Cabeçalho da data + lembretes ===== */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Dia anterior"
          onClick={() => setDia((d) => somarDias(d, -1))}
          className="rounded-full p-2 hover:bg-white/70"
          style={{ color: C.texto }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold tracking-[0.2em]" style={{ color: C.texto }}>
          {rotuloDia(dia)}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Próximo dia"
            onClick={() => setDia((d) => somarDias(d, 1))}
            className="rounded-full p-2 hover:bg-white/70"
            style={{ color: C.texto }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setModalLembretes(true)}
            className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-white/70"
            style={{ borderColor: C.borda, color: C.texto, backgroundColor: C.card }}
          >
            <Bell className="mr-1 inline h-3.5 w-3.5" /> Lembretes
          </button>
        </div>
      </div>

      {/* ===== Linha do tempo 00:00–23:59 ===== */}
      <Card style={{ backgroundColor: C.card, borderColor: C.borda }}>
        <CardContent className="py-4">
          <div className="relative h-10">
            <div
              className="absolute left-0 right-0 top-4 h-1 rounded-full"
              style={{ backgroundColor: '#EFE6D8' }}
            />
            {registrosDia.map((r) => (
              <span
                key={r.id}
                title={`${(r.data || '').slice(11, 16)} — ${descreverRegistro(r)}`}
                className="absolute -translate-x-1/2 text-sm"
                style={{ left: `${fracDia(r.data) * 100}%`, top: 2 }}
              >
                {ICONES[r.tipo] || '•'}
              </span>
            ))}
            {lembretesDia.map((l) => (
              <span
                key={l.id}
                title={`${(l.data_hora || '').slice(11, 16)} — ${l.titulo}`}
                className="absolute -translate-x-1/2"
                style={{ left: `${fracDia(l.data_hora) * 100}%`, top: 26 }}
              >
                <Bell className="h-3.5 w-3.5" style={{ color: C.acentoEscuro }} />
              </span>
            ))}
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: C.textoSuave }}>
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </CardContent>
      </Card>

      {/* ===== Pílulas de ação rápida ===== */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => aoAbrirRegistro()}
          className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-[#F5EFE6]"
          style={{ borderColor: C.borda, backgroundColor: C.card, color: C.texto }}
        >
          <Plus className="h-4 w-4" style={{ color: C.acentoEscuro }} /> Adicionar registro
        </button>
        {TIPOS_PILULAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => aoAbrirRegistro(t)}
            className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-[#F5EFE6]"
            style={{ borderColor: C.borda, backgroundColor: C.card, color: C.texto }}
          >
            <span aria-hidden>{ICONES[t]}</span> {ROTULO_CURTO[t]}
          </button>
        ))}
      </div>

      {/* ===== Cartões de métricas ===== */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: C.texto }}>
            Métricas
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cartoes.map((c) => (
            <Card key={c.id} style={{ backgroundColor: C.card, borderColor: C.borda }}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs" style={{ color: C.textoSuave }}>
                      {c.titulo}
                    </p>
                    <p className="mt-1 text-xl font-semibold" style={{ color: C.texto }}>
                      {c.valor}
                    </p>
                    <p className="text-[10px]" style={{ color: C.textoSuave }}>
                      {c.quando}
                    </p>
                  </div>
                  <span className="text-xl" aria-hidden>
                    {c.icone}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ===== Medicamentos tomados — tabela semanal ===== */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: C.texto }}>
            Medicamentos tomados
          </h3>
        </div>
        <Card style={{ backgroundColor: C.card, borderColor: C.borda }}>
          <CardContent className="overflow-x-auto py-4">
            {tabelaMed.linhas.length === 0 ? (
              <p className="text-sm italic" style={{ color: C.textoSuave }}>
                Nenhuma medicação registrada nesta semana.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-1 text-left font-medium" style={{ color: C.textoSuave }} />
                    {tabelaMed.diasSemana.map((d) => (
                      <th
                        key={d}
                        className="py-1 text-center font-medium"
                        style={{
                          color: d === dia ? C.acentoEscuro : C.textoSuave,
                          fontWeight: d === dia ? 700 : 500,
                        }}
                      >
                        {DIAS_CURTOS[new Date(`${d}T12:00:00`).getDay()]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabelaMed.linhas.map(([nome, info]) => (
                    <tr key={nome} className="border-t" style={{ borderColor: '#EFE6D8' }}>
                      <td className="py-2 pr-2" style={{ color: C.texto }}>
                        {nome}
                        {info.dose ? (
                          <span className="ml-1 text-[10px]" style={{ color: C.textoSuave }}>
                            {info.dose}
                          </span>
                        ) : null}
                      </td>
                      {tabelaMed.diasSemana.map((d) => {
                        const tomou = info.dias.has(d)
                        const ehDiaSelecionado = d === dia
                        return (
                          <td key={d} className="py-2 text-center">
                            {tomou ? (
                              <span style={{ color: C.acentoEscuro, fontWeight: 700 }}>1×</span>
                            ) : (
                              <span style={{ color: '#D8C9B4' }}>•</span>
                            )}
                            {ehDiaSelecionado && info.registroHoje ? (
                              <button
                                type="button"
                                onClick={() => void alternarIngerida(info.registroHoje!)}
                                className="ml-1 text-[10px] underline"
                                style={{ color: C.textoSuave }}
                              >
                                desmarcar
                              </button>
                            ) : null}
                            {!tomou && ehDiaSelecionado ? (
                              <button
                                type="button"
                                onClick={() => aoAbrirRegistro('medicacao')}
                                className="ml-1 text-[10px] underline"
                                style={{ color: C.acentoEscuro }}
                              >
                                + Tomei
                              </button>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Modal de lembretes ===== */}
      <Dialog open={modalLembretes} onOpenChange={setModalLembretes}>
        <DialogContent className="max-w-md rounded-3xl border-[#E4D8C6] bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5C3A21]">Lembretes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="lembrete-titulo" className="text-[#5C3A21]">
                Novo lembrete
              </Label>
              <Input
                id="lembrete-titulo"
                value={formLembrete.titulo}
                onChange={(e) => setFormLembrete((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex.: Tomar remédio"
                className="border-[#E4D8C6] bg-[#F5EFE6]/50 text-[#5C3A21] focus-visible:ring-[#C9A063]"
              />
              <Input
                type="datetime-local"
                value={formLembrete.data_hora}
                onChange={(e) => setFormLembrete((f) => ({ ...f, data_hora: e.target.value }))}
                className="border-[#E4D8C6] bg-[#F5EFE6]/50 text-[#5C3A21] focus-visible:ring-[#C9A063]"
              />
              <Button
                type="button"
                onClick={() => void salvarLembrete()}
                disabled={
                  salvandoLembrete || !formLembrete.titulo.trim() || !formLembrete.data_hora
                }
                className="w-full rounded-full bg-[#7B4B2A] text-white hover:bg-[#5C3A21]"
              >
                Criar lembrete
              </Button>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {lembretes.length === 0 ? (
                <p className="text-sm italic text-[#8A6A4F]">Nenhum lembrete criado.</p>
              ) : (
                lembretes.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-xl border border-[#E4D8C6] bg-[#F5EFE6]/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#5C3A21]">{l.titulo}</p>
                      <p className="text-[11px] text-[#8A6A4F]">
                        {new Date(l.data_hora).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Excluir lembrete"
                      onClick={() => void removerLembrete(l.id)}
                      className="rounded-full p-1.5 text-[#B0714F] hover:bg-[#B0714F]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClienteHoje
