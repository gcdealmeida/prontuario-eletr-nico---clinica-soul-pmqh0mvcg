import { useMemo } from 'react'
import { Dumbbell, HeartPulse, Sparkles, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDataHoraPTBR } from '@/lib/constants'
import { dadosPrescricao } from '@/lib/saudeAgregacoes'
import type { SaudeRegistroRecord } from '@/services/saudeBemEstar'

interface Props {
  registros: SaudeRegistroRecord[]
}

/**
 * Seção "Treinos & Reabilitação" do app do cliente (SOUL HTR): mostra o que a
 * clínica prescreveu — treinos físicos, exercícios de reabilitação e exames —
 * com o conteúdo exato escrito pelo profissional. Integrada à aba Exames &
 * Dietas (mesma paleta bege/marrom/dourado).
 */
export function ClienteTreinosReabilitacao({ registros }: Props) {
  const treinos = useMemo(() => registros.filter((r) => r.tipo === 'treino'), [registros])
  const reabilitacao = useMemo(
    () => registros.filter((r) => r.tipo === 'reabilitacao'),
    [registros],
  )
  const examesClinica = useMemo(
    () => registros.filter((r) => r.tipo === 'exame' && dadosPrescricao(r)._origem === 'clinica'),
    [registros],
  )

  const temConteudo = treinos.length > 0 || reabilitacao.length > 0 || examesClinica.length > 0
  if (!temConteudo) return null

  const renderPrescricao = (r: SaudeRegistroRecord) => {
    const d = dadosPrescricao(r)
    return (
      <div key={r.id} className="rounded-xl bg-[#F5EFE6] border border-[#E2D4BF] p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#5C3A21]">
            {r.observacao || d.titulo || 'Prescrição da clínica'}
          </span>
        </div>
        {d.descricao && (
          <p className="text-sm text-[#8A6F58] mt-1 whitespace-pre-wrap">{d.descricao}</p>
        )}
        {Array.isArray(d.exercicios) && d.exercicios.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {d.exercicios.map((ex, i) => (
              <li key={i} className="text-sm text-[#5C3A21] flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{ex.nome}</span>
                {(ex.series || ex.repeticoes) && (
                  <span className="text-xs text-[#8A6F58]">
                    {[ex.series && `${ex.series} séries`, ex.repeticoes && `${ex.repeticoes} reps`]
                      .filter(Boolean)
                      .join(' × ')}
                  </span>
                )}
                {ex.carga && <span className="text-xs text-[#8A6F58]">carga: {ex.carga}</span>}
                {ex.observacao && (
                  <span className="text-xs text-[#8A6F58]/80">— {ex.observacao}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {d.resultado && <p className="text-xs text-[#8A6F58] mt-2">Resultado: {d.resultado}</p>}
        <p className="text-[10px] text-[#8A6F58]/70 mt-2">{formatDataHoraPTBR(r.data)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Card className="bg-white border-[#E2D4BF] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-[#7B4B2A]" /> Treinos & Reabilitação
            <span className="ml-auto flex items-center gap-1 text-[10px] font-normal text-[#8A6F58]">
              <Sparkles className="h-3 w-3 text-[#C9A063]" /> enviado pela clínica
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-[#8A6F58] flex items-center gap-1">
              <Dumbbell className="h-3 w-3" /> Treinos físicos
            </p>
            {treinos.length === 0 ? (
              <p className="text-sm text-[#8A6F58] italic">Nenhum treino enviado ainda.</p>
            ) : (
              treinos.map(renderPrescricao)
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-[#8A6F58] flex items-center gap-1">
              <HeartPulse className="h-3 w-3" /> Reabilitação
            </p>
            {reabilitacao.length === 0 ? (
              <p className="text-sm text-[#8A6F58] italic">
                Nenhum exercício de reabilitação ainda.
              </p>
            ) : (
              reabilitacao.map(renderPrescricao)
            )}
          </div>
        </CardContent>
      </Card>

      {examesClinica.length > 0 && (
        <Card className="bg-white border-[#E2D4BF] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#7B4B2A]" /> Exames solicitados pela clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">{examesClinica.map(renderPrescricao)}</CardContent>
        </Card>
      )}
    </div>
  )
}

export default ClienteTreinosReabilitacao
