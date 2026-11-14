import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { CheckCircle2, Pencil, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AnexoDadosExtraidos } from '@/services/avaliacoes'

/**
 * Revisão estruturada dos dados extraídos pela IA (ferramenta "Leitor de Documentos").
 *
 * Mostra tipo de exame, data, laboratório, achados, valores de referência e conclusão
 * para o profissional conferir. Ao confirmar, os campos do anexo no prontuário são
 * preenchidos automaticamente (o formulário recebe via onConfirmar).
 */
export interface RevisaoDadosExtraidosHandle {
  /** Devolve os dados como editados pelo profissional (para o "confirmar" ler o estado local). */
  getDadosEditados: () => AnexoDadosExtraidos | null
}

interface RevisaoDadosExtraidosProps {
  nomeArquivo: string
  dados: AnexoDadosExtraidos | null
  confirmado: boolean
  onConfirmar: (nomeArquivo: string, dados: AnexoDadosExtraidos | null) => void
  /** Texto atual do campo de destino (para o aviso de sobreposição). */
  valorAtualCampo?: string
}

type ChaveDado = Exclude<keyof AnexoDadosExtraidos, 'campo_sugerido'>

const ROTULOS: Array<{ chave: ChaveDado; rotulo: string; multiline?: boolean }> = [
  { chave: 'tipo_exame', rotulo: 'Tipo de exame' },
  { chave: 'data_exame', rotulo: 'Data do exame' },
  { chave: 'laboratorio', rotulo: 'Laboratório / clínica' },
  { chave: 'achados', rotulo: 'Achados', multiline: true },
  { chave: 'valores_referencia', rotulo: 'Valores de referência', multiline: true },
  { chave: 'conclusao', rotulo: 'Conclusão', multiline: true },
]

const CAMPO_DESTINO_ROTULO: Record<string, string> = {
  historico_medico: 'Histórico Médico (Etapa 1 — Anamnese)',
}

export const RevisaoDadosExtraidos = forwardRef<
  RevisaoDadosExtraidosHandle,
  RevisaoDadosExtraidosProps
>(function RevisaoDadosExtraidos(
  { nomeArquivo, dados, confirmado, onConfirmar, valorAtualCampo = '' },
  ref,
) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState<AnexoDadosExtraidos | null>(dados)
  const rascunhoRef = useRef<AnexoDadosExtraidos | null>(dados)
  rascunhoRef.current = rascunho

  useImperativeHandle(ref, () => ({
    getDadosEditados: () => rascunhoRef.current,
  }))

  // Dados ainda não extraídos (ou extração vazia): nada a mostrar — o resumo em texto
  // já aparece no card acima e o profissional pode preencher manualmente como antes.
  const temConteudo = !!dados && Object.values(dados).some((v) => typeof v === 'string' && v.trim())
  if (!temConteudo) return null

  const visuais = rascunho || dados || {}

  const iniciarEdicao = () => {
    setRascunho({ ...dados })
    setEditando(true)
  }

  const confirmar = () => {
    onConfirmar(nomeArquivo, rascunhoRef.current || dados)
    setEditando(false)
  }

  const campoDestino = visuais.campo_sugerido || 'historico_medico'
  const rotuloDestino =
    CAMPO_DESTINO_ROTULO[campoDestino] || 'Histórico Médico (Etapa 1 — Anamnese)'
  const vaiSobrescrever = confirmado && valorAtualCampo.trim().length > 0

  return (
    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-950 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          Dados extraídos pela IA — confira antes de preencher
        </div>
        {confirmado && !editando && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Preenchido no prontuário
          </span>
        )}
      </div>

      {editando ? (
        <div className="space-y-2">
          {ROTULOS.map(({ chave, rotulo, multiline }) => (
            <div key={chave} className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                {rotulo}
              </label>
              {multiline ? (
                <Textarea
                  rows={2}
                  value={String(visuais[chave] || '')}
                  onChange={(e) =>
                    setRascunho((prev) => ({ ...(prev || {}), [chave]: e.target.value }))
                  }
                  className="text-xs bg-white rounded-lg border-gray-300"
                />
              ) : (
                <Input
                  value={String(visuais[chave] || '')}
                  onChange={(e) =>
                    setRascunho((prev) => ({ ...(prev || {}), [chave]: e.target.value }))
                  }
                  className="text-xs bg-white rounded-lg border-gray-300 h-8"
                />
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={confirmar}
              className="rounded-xl h-8 px-3 text-[11px] font-semibold bg-blue-700 text-white hover:bg-blue-800"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Preencher o prontuário
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setRascunho({ ...dados })
                setEditando(false)
              }}
              className="rounded-xl h-8 px-3 text-[11px] font-semibold"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
            {ROTULOS.map(({ chave, rotulo }) => {
              const valor = String(visuais[chave] || '').trim()
              if (!valor) return null
              const longo =
                chave === 'achados' || chave === 'valores_referencia' || chave === 'conclusao'
              return (
                <div key={chave} className={longo ? 'sm:col-span-2' : ''}>
                  <dt className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    {rotulo}
                  </dt>
                  <dd className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {valor}
                  </dd>
                </div>
              )
            })}
          </dl>

          {vaiSobrescrever && (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              Já existe conteúdo no campo de destino ({rotuloDestino}). Confirmar novamente vai
              acrescentar os dados extraídos ao que já está lá.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {confirmado ? (
              <>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Dados lançados em: {rotuloDestino}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditando(true)}
                  className="rounded-xl h-7 px-3 text-[11px] font-semibold"
                >
                  <Pencil className="h-3 w-3" /> Ajustar dados
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={confirmar}
                  className="rounded-xl h-8 px-3 text-[11px] font-semibold bg-blue-700 text-white hover:bg-blue-800"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Preencher o prontuário
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={iniciarEdicao}
                  className="rounded-xl h-8 px-3 text-[11px] font-semibold"
                >
                  <Pencil className="h-3 w-3" /> Corrigir antes de preencher
                </Button>
              </>
            )}
          </div>

          <p className="text-[10px] text-gray-500 flex items-center gap-1">
            <RotateCcw className="h-3 w-3" />
            Confira os dados extraídos — a IA pode errar. Você também pode editar a síntese clínica
            acima ou preencher os campos manualmente.
          </p>
        </>
      )}
    </div>
  )
})
