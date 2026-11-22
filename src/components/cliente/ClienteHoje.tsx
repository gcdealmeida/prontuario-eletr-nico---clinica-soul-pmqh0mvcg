import { useMemo } from 'react'
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Droplet,
  Flame,
  Footprints,
  Moon,
  Plus,
  Stethoscope,
  Utensils,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDataHoraPTBR } from '@/lib/constants'
import {
  caloriasNoDia,
  coposAguaNoDia,
  descreverRegistro,
  hojeYMD,
  minutosAtividadeNoDia,
  horasSonoNoDia,
  metasDoPerfil,
  registrosDoDia,
} from '@/lib/saudeAgregacoes'
import { ICONES_TIPO } from '@/components/saude/SaudeResumoIcones'
import type { SaudeClienteRecord, SaudeRegistroRecord } from '@/services/saudeBemEstar'

interface Props {
  cliente: SaudeClienteRecord
  registros: SaudeRegistroRecord[]
  lembretes: {
    id: string
    titulo: string
    descricao?: string
    data_hora: string
    repeticao?: string
  }[]
  devAtivos: { id: string; titulo: string; descricao?: string }[]
  devConcluidos: { id: string; titulo: string }[]
  onConcluirDev: (id: string, concluido: boolean) => void
  onAbrirRegistro: (
    tipo?:
      | 'atividade_fisica'
      | 'sono'
      | 'bebida'
      | 'refeicao'
      | 'medicacao'
      | 'emocao'
      | 'sintoma'
      | 'exame'
      | 'alimento',
  ) => void
  onIrPara: (aba: string) => void
}

/** Painel "Hoje" do app do cliente (modelo Home.tsx da referência). */
export function ClienteHoje({
  cliente,
  registros,
  lembretes,
  devAtivos,
  devConcluidos,
  onConcluirDev,
  onAbrirRegistro,
  onIrPara,
}: Props) {
  const dia = hojeYMD()
  const deHoje = useMemo(() => registrosDoDia(registros, dia), [registros, dia])

  const metas = metasDoPerfil(cliente as unknown as Record<string, unknown>)
  const agua = coposAguaNoDia(registros, dia)
  const calorias = caloriasNoDia(registros, dia)
  const atividade = minutosAtividadeNoDia(registros, dia)
  const sono = horasSonoNoDia(registros, dia)

  const anel = (atual: number, meta: number) =>
    Math.min(100, Math.round((atual / Math.max(1, meta)) * 100))

  const cartoes = [
    {
      chave: 'sono',
      titulo: 'Sono',
      icone: Moon,
      atual: sono ? `${sono}h` : '—',
      meta: `meta ${metas.sono_horas}h`,
      pct: sono ? anel(sono, metas.sono_horas || 8) : 0,
      acao: () => onAbrirRegistro('sono'),
    },
    {
      chave: 'agua',
      titulo: 'Água',
      icone: Droplet,
      atual: `${agua} copos`,
      meta: `meta ${metas.agua_copos}`,
      pct: anel(agua, metas.agua_copos || 8),
      acao: () => onAbrirRegistro('bebida'),
    },
    {
      chave: 'calorias',
      titulo: 'Calorias',
      icone: Flame,
      atual: `${calorias} kcal`,
      meta: `meta ${metas.calorias}`,
      pct: anel(calorias, metas.calorias || 2000),
      acao: () => onAbrirRegistro('refeicao'),
    },
    {
      chave: 'atividade',
      titulo: 'Atividade',
      icone: Footprints,
      atual: `${atividade} min`,
      meta: `meta ${metas.atividade_min} min`,
      pct: anel(atividade, metas.atividade_min || 30),
      acao: () => onAbrirRegistro('atividade_fisica'),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Ações rápidas do dia */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cartoes.map((c) => {
          const Icone = c.icone
          return (
            <Card key={c.chave} className="bg-white/85 border-[#3E7C59]/15">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="rounded-full bg-[#3E7C59]/10 p-2">
                    <Icone className="h-4 w-4 text-[#3E7C59]" />
                  </div>
                  <button
                    onClick={c.acao}
                    className="rounded-full bg-[#3E7C59] p-1.5 text-white hover:bg-[#33684A]"
                    title={`Registrar ${c.titulo.toLowerCase()}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-xl font-bold text-[#2C4A3B] leading-none">{c.atual}</p>
                <p className="text-xs text-[#5C7263] mt-1">
                  {c.titulo} · {c.meta}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-[#3E7C59]/10">
                  <div className="h-1.5 rounded-full bg-[#3E7C59]" style={{ width: `${c.pct}%` }} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Lembretes da clínica */}
      {lembretes.length > 0 && (
        <Card className="border-[#C9A46A] bg-white/90">
          <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
            <Stethoscope className="h-4 w-4 text-[#C9A46A]" />
            <CardTitle className="text-sm">Lembretes da clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lembretes.slice(0, 3).map((l) => (
              <div key={l.id} className="rounded-lg bg-[#FDF6E9] border border-[#C9A46A]/30 p-3">
                <p className="text-sm font-medium text-[#33221C]">{l.titulo}</p>
                {l.descricao && (
                  <p className="text-xs text-[#73574A] mt-0.5 whitespace-pre-wrap">{l.descricao}</p>
                )}
                <p className="text-[10px] text-[#73574A]/60 mt-1">
                  {formatDataHoraPTBR(l.data_hora)}
                  {l.repeticao && l.repeticao !== 'nenhuma' ? ` • repete: ${l.repeticao}` : ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Linha do tempo do dia */}
      <Card className="bg-white/85 border-[#3E7C59]/15">
        <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
          <Clock className="h-4 w-4 text-[#3E7C59]" />
          <CardTitle className="text-sm">Linha do tempo de hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deHoje.length === 0 ? (
            <p className="text-sm text-[#5C7263] italic">
              Nada registrado hoje ainda. Use os botões + acima ou "Registrar meu dia".
            </p>
          ) : (
            deHoje.map((r) => {
              const Icone = ICONES_TIPO[r.tipo]
              const hora = (r.data || '').slice(11, 16)
              return (
                <div key={r.id} className="flex items-start gap-3">
                  <div className="rounded-full bg-[#3E7C59]/10 p-2 shrink-0">
                    <Icone className="h-3.5 w-3.5 text-[#3E7C59]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#2C4A3B]">{descreverRegistro(r)}</p>
                    <p className="text-[10px] text-[#5C7263]/70">
                      {hora ? `${hora} · ` : ''}
                      {formatDataHoraPTBR(r.data)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Atalhos para as outras áreas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <button onClick={() => onIrPara('refeicoes')} className="text-left">
          <Card className="bg-white/70 hover:bg-white transition-colors h-full">
            <CardContent className="flex items-center gap-3 py-4">
              <Utensils className="h-5 w-5 text-[#3E7C59]" />
              <p className="text-sm font-medium text-[#2C4A3B]">Refeições</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => onIrPara('medicacoes')} className="text-left">
          <Card className="bg-white/70 hover:bg-white transition-colors h-full">
            <CardContent className="flex items-center gap-3 py-4">
              <Zap className="h-5 w-5 text-[#3E7C59]" />
              <p className="text-sm font-medium text-[#2C4A3B]">Medicações</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => onIrPara('diario')} className="text-left">
          <Card className="bg-white/70 hover:bg-white transition-colors h-full">
            <CardContent className="flex items-center gap-3 py-4">
              <BookOpen className="h-5 w-5 text-[#3E7C59]" />
              <p className="text-sm font-medium text-[#2C4A3B]">Diário emocional</p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => onIrPara('exames')} className="text-left">
          <Card className="bg-white/70 hover:bg-white transition-colors h-full">
            <CardContent className="flex items-center gap-3 py-4">
              <Stethoscope className="h-5 w-5 text-[#3E7C59]" />
              <p className="text-sm font-medium text-[#2C4A3B]">Exames & Dietas</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Desenvolvimento pessoal */}
      <Card className="bg-white/85 border-[#3E7C59]/15">
        <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
          <BookOpen className="h-4 w-4 text-[#3E7C59]" />
          <CardTitle className="text-sm">Meu desenvolvimento pessoal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {devAtivos.length === 0 && devConcluidos.length === 0 ? (
            <p className="text-sm text-[#5C7263] italic">Nenhum desafio ou meta no momento.</p>
          ) : (
            <>
              {devAtivos.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onConcluirDev(d.id, true)}
                  className="flex w-full items-start gap-3 rounded-lg bg-[#F0F5F0] p-3 text-left hover:bg-[#E4EEE6]"
                >
                  <Circle className="h-4 w-4 mt-0.5 text-[#3E7C59] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#2C4A3B]">{d.titulo}</p>
                    {d.descricao && (
                      <p className="text-xs text-[#5C7263] whitespace-pre-wrap">{d.descricao}</p>
                    )}
                  </div>
                </button>
              ))}
              {devConcluidos.slice(0, 3).map((d) => (
                <button
                  key={d.id}
                  onClick={() => onConcluirDev(d.id, false)}
                  className="flex w-full items-start gap-3 rounded-lg bg-white p-3 text-left opacity-70 hover:opacity-100"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-[#3E7C59] shrink-0" />
                  <p className="text-sm text-[#2C4A3B] line-through">{d.titulo}</p>
                </button>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={() => onAbrirRegistro()}
        className="w-full h-12 rounded-xl bg-[#3E7C59] hover:bg-[#33684A] text-white"
      >
        <Plus className="h-5 w-5 mr-2" /> Registrar meu dia
      </Button>
    </div>
  )
}

export default ClienteHoje
