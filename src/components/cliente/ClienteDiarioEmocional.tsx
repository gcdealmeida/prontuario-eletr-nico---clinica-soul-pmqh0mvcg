import { useMemo, useState } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDataHoraPTBR } from '@/lib/constants'
import { rotuloHumor, VALORES_HUMOR } from '@/lib/saudeAgregacoes'
import type { SaudeRegistroRecord } from '@/services/saudeBemEstar'

interface Props {
  registros: SaudeRegistroRecord[]
  onSalvar: (humor: string, notas: string) => Promise<void>
  onExcluir: (id: string) => void
}

/** Diário emocional (modelo EmotionalDiary.tsx): quadro de humores + legendas com percentuais. */
export function ClienteDiarioEmocional({ registros, onSalvar, onExcluir }: Props) {
  const [humor, setHumor] = useState('bom')
  const [notas, setNotas] = useState('')
  const [salvando, setSalvando] = useState(false)

  const emocoes = useMemo(() => registros.filter((r) => r.tipo === 'emocao'), [registros])

  const distribuicao = useMemo(() => {
    const total = emocoes.length || 1
    const acc: Record<string, number> = {}
    for (const r of emocoes) {
      const h = String(((r.dados_json || {}) as Record<string, unknown>).humor || 'neutro')
      acc[h] = (acc[h] || 0) + 1
    }
    return VALORES_HUMOR.map((h) => ({
      ...h,
      n: acc[h.v] || 0,
      pct: Math.round(((acc[h.v] || 0) / total) * 100),
    }))
  }, [emocoes])

  const salvar = async () => {
    setSalvando(true)
    try {
      await onSalvar(humor, notas.trim())
      setNotas('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-[#E2D4BF] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#7B4B2A]" /> Como você está hoje?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {VALORES_HUMOR.map((h) => (
              <button
                key={h.v}
                type="button"
                onClick={() => setHumor(h.v)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors ${
                  humor === h.v
                    ? 'border-[#C9A063] bg-[#C9A063]/15 ring-1 ring-[#C9A063]'
                    : 'border-[#E2D4BF] bg-[#F5EFE6] hover:border-[#C9A063]/50'
                }`}
              >
                <span className="text-2xl">{h.emoji}</span>
                <span className="text-[10px] text-[#8A6F58]">{h.l}</span>
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="O que aconteceu hoje? (opcional)"
            className="rounded-xl border-[#E2D4BF] focus-visible:ring-[#C9A063]"
          />
          <Button
            onClick={salvar}
            disabled={salvando}
            className="w-full bg-[#7B4B2A] hover:bg-[#5C3A21] text-white"
          >
            {salvando ? 'Salvando...' : 'Salvar no diário'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E2D4BF] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#5C3A21]">Resumo dos humores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {distribuicao.map((h) => (
            <div key={h.v} className="flex items-center gap-2">
              <span className="text-base w-7">{h.emoji}</span>
              <span className="w-16 text-xs text-[#5C3A21]">{h.l}</span>
              <div className="h-2.5 flex-1 rounded-full bg-[#EFE6D8]">
                <div
                  className="h-2.5 rounded-full"
                  style={{ width: `${h.pct}%`, backgroundColor: h.cor }}
                />
              </div>
              <span className="w-10 text-right text-xs text-[#8A6F58]">{h.pct}%</span>
            </div>
          ))}
          {emocoes.length === 0 && (
            <p className="text-xs text-[#8A6F58] italic">
              Nenhum registro ainda — as percentuais aparecem após o primeiro dia.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E2D4BF] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#5C3A21]">Histórico do diário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {emocoes.length === 0 ? (
            <p className="text-sm text-[#8A6F58] italic">Nenhuma anotação ainda.</p>
          ) : (
            emocoes.slice(0, 20).map((r) => {
              const d = (r.dados_json || {}) as Record<string, unknown>
              const h = VALORES_HUMOR.find((x) => x.v === String(d.humor || ''))
              return (
                <div
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl bg-[#F5EFE6] border border-[#E2D4BF] p-3"
                >
                  <span className="text-xl">{h?.emoji || '🙂'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#5C3A21]">{rotuloHumor(String(d.humor || ''))}</p>
                    {String(d.notas || '') && (
                      <p className="text-xs text-[#8A6F58] whitespace-pre-wrap">
                        {String(d.notas)}
                      </p>
                    )}
                    <p className="text-[10px] text-[#8A6F58]/70">{formatDataHoraPTBR(r.data)}</p>
                  </div>
                  <button
                    onClick={() => onExcluir(r.id)}
                    className="text-[#8A6F58]/70 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ClienteDiarioEmocional
