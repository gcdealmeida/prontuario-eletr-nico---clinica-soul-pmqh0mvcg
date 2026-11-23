import { useMemo, useState } from 'react'
import { Plus, Trash2, Utensils, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDataHoraPTBR } from '@/lib/constants'
import {
  caloriasNoDia,
  descreverRegistro,
  hojeYMD,
  metasDoPerfil,
  registrosDoDia,
  totalCaloriasDeRegistro,
} from '@/lib/saudeAgregacoes'
import type { SaudeRegistroRecord } from '@/services/saudeBemEstar'

interface Props {
  registros: SaudeRegistroRecord[]
  onRegistrarRefeicao: () => void
  onRegistrarMedicacao: () => void
  onExcluir: (id: string) => void
  onAlternarIngerida: (r: SaudeRegistroRecord) => void
}

const REF_LABEL: Record<string, string> = {
  cafe: 'Café da manhã',
  almoco: 'Almoço',
  janta: 'Jantar',
  lanche: 'Lanche',
}

/** Refeições (modelo Meals.tsx) e Medicações/rotinas (modelo Medications.tsx). */
export function ClienteRefeicoesMedicacoes({
  registros,
  onRegistrarRefeicao,
  onRegistrarMedicacao,
  onExcluir,
  onAlternarIngerida,
}: Props) {
  const hoje = hojeYMD()
  const hoje0 = useMemo(() => registrosDoDia(registros, hoje), [registros, hoje])
  const refeicoesHoje = hoje0.filter((r) => r.tipo === 'refeicao' || r.tipo === 'alimento')
  const metas = metasDoPerfil({} as Record<string, unknown>)

  const refeicoes = useMemo(
    () => registros.filter((r) => r.tipo === 'refeicao' || r.tipo === 'alimento'),
    [registros],
  )
  const medicacoes = useMemo(() => registros.filter((r) => r.tipo === 'medicacao'), [registros])

  // agrupa medicações por nome (rotina) mostrando se já foi ingerida hoje
  const rotinas = useMemo(() => {
    const map = new Map<
      string,
      {
        nome: string
        dose: string
        horario: string
        hojeIngerida: boolean
        ultimo?: SaudeRegistroRecord
      }
    >()
    for (const r of medicacoes) {
      const d = (r.dados_json || {}) as Record<string, unknown>
      const nome = String(d.nome || 'Medicação')
      const atual = map.get(nome)
      const deHoje = (r.data || '').slice(0, 10) === hoje
      const ingerida = d.ingerida !== false && deHoje
      if (!atual) {
        map.set(nome, {
          nome,
          dose: String(d.dose || ''),
          horario: String(d.horario || ''),
          hojeIngerida: ingerida,
          ultimo: r,
        })
      } else {
        if (deHoje) {
          atual.hojeIngerida = atual.hojeIngerida || ingerida
          if (deHoje) atual.ultimo = r
        }
      }
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [medicacoes, hoje])

  return (
    <div className="space-y-5">
      {/* ===== Refeições ===== */}
      <Card className="bg-white border-[#E2D4BF] shadow-sm">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Utensils className="h-4 w-4 text-[#7B4B2A]" /> Refeições de hoje
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8A6F58]">
              {caloriasNoDia(registros, hoje)} / {metas.calorias} kcal
            </span>
            <Button
              size="sm"
              onClick={onRegistrarRefeicao}
              className="bg-[#7B4B2A] hover:bg-[#5C3A21] text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Refeição
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {refeicoesHoje.length === 0 ? (
            <p className="text-sm text-[#8A6F58] italic">Nenhuma refeição registrada hoje.</p>
          ) : (
            refeicoesHoje.map((r) => {
              const d = (r.dados_json || {}) as Record<string, unknown>
              const tot = totalCaloriasDeRegistro(r)
              return (
                <div
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl bg-[#F5EFE6] border border-[#E2D4BF] p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#5C3A21]">
                      {REF_LABEL[String(d.refeicao || '')] || 'Refeição'}
                      {tot != null && (
                        <span className="ml-2 text-xs font-normal text-[#8A6F58]">{tot} kcal</span>
                      )}
                    </p>
                    {String(d.itens || '') && (
                      <p className="text-xs text-[#8A6F58] whitespace-pre-wrap">
                        {String(d.itens)}
                      </p>
                    )}
                    <p className="text-[10px] text-[#8A6F58]/70">{formatDataHoraPTBR(r.data)}</p>
                  </div>
                  <button
                    onClick={() => onExcluir(r.id)}
                    className="text-[#5C7263]/60 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })
          )}
          {refeicoes.length > refeicoesHoje.length && (
            <p className="text-xs text-[#8A6F58]/80">
              + {refeicoes.length - refeicoesHoje.length} refeições em dias anteriores (veja em
              Registros).
            </p>
          )}
        </CardContent>
      </Card>

      {/* ===== Medicações ===== */}
      <Card className="bg-white border-[#E2D4BF] shadow-sm">
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#7B4B2A]" /> Minhas medicações & rotinas
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={onRegistrarMedicacao}
            className="border-[#7B4B2A]/30 text-[#5C3A21] hover:border-[#C9A063]"
          >
            <Plus className="h-4 w-4 mr-1" /> Registrar dose
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {rotinas.length === 0 ? (
            <p className="text-sm text-[#8A6F58] italic">
              Nenhuma medicação registrada. Registre a primeira dose para criar a rotina.
            </p>
          ) : (
            rotinas.map((m) => (
              <div
                key={m.nome}
                className="flex items-center gap-3 rounded-xl bg-[#F5EFE6] border border-[#E2D4BF] p-3"
              >
                <button
                  onClick={() => m.ultimo && onAlternarIngerida(m.ultimo)}
                  className={`rounded-full p-1.5 transition-colors ${
                    m.hojeIngerida
                      ? 'bg-[#7B4B2A] text-white'
                      : 'bg-white border border-[#7B4B2A]/30 text-[#7B4B2A]'
                  }`}
                  title={m.hojeIngerida ? 'Já ingerida hoje' : 'Marcar como ingerida'}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    {m.hojeIngerida ? (
                      <path d="M20 6L9 17l-5-5" />
                    ) : (
                      <circle cx="12" cy="12" r="5" />
                    )}
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#5C3A21]">{m.nome}</p>
                  <p className="text-xs text-[#8A6F58]">
                    {[m.dose, m.horario].filter(Boolean).join(' · ') || 'sem dose/horário'}
                  </p>
                </div>
                <span
                  className={`text-[10px] ${m.hojeIngerida ? 'text-[#7B4B2A]' : 'text-[#C9A063]'}`}
                >
                  {m.hojeIngerida ? 'ingerida hoje' : 'pendente'}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ClienteRefeicoesMedicacoes
