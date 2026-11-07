import React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PainelTextosPropostaProps {
  mesReferencia: string
  textoApresentacao: string
  textoIntroducao: string
  condicoesPagamento: string
  observacoes: string
  onChange: (campo: CampoTexto, valor: string) => void
}

export type CampoTexto =
  | 'mesReferencia'
  | 'textoApresentacao'
  | 'textoIntroducao'
  | 'condicoesPagamento'
  | 'observacoes'

interface CampoDef {
  campo: CampoTexto
  label: string
  placeholder: string
  hint?: string
  rows: number
}

const CAMPOS: CampoDef[] = [
  {
    campo: 'mesReferencia',
    label: 'Mês / Referência',
    placeholder: 'Ex.: Outubro 2026',
    hint: 'Aparece na capa, abaixo do título do programa. Também entra no nome do PDF.',
    rows: 1,
  },
  {
    campo: 'textoApresentacao',
    label: 'Apresentação',
    placeholder:
      'Ex.: A Clínica SOUL integra fisioterapia, bem-estar e acompanhamento próximo para devolver movimento e qualidade de vida.',
    rows: 4,
  },
  {
    campo: 'textoIntroducao',
    label: 'O Programa',
    placeholder:
      'Ex.: Este programa foi elaborado para reabilitar o joelho em 12 semanas, com evolução acompanhada sessão a sessão.',
    rows: 4,
  },
  {
    campo: 'condicoesPagamento',
    label: 'Condições de pagamento',
    placeholder: 'Ex.: Pagamento em até 3x sem juros. Proposta válida por 15 dias.',
    rows: 3,
  },
  {
    campo: 'observacoes',
    label: 'Observações',
    placeholder: 'Ex.: Sessões com duração de 50 minutos. Agendamento com a recepção.',
    rows: 3,
  },
]

/**
 * Painel "Textos da Proposta": campos de texto livre da proposta.
 * Só o que for preenchido aparece no documento — seções vazias são omitidas.
 */
export const PainelTextosProposta: React.FC<PainelTextosPropostaProps> = ({
  mesReferencia,
  textoApresentacao,
  textoIntroducao,
  condicoesPagamento,
  observacoes,
  onChange,
}) => {
  const valores: Record<CampoTexto, string> = {
    mesReferencia,
    textoApresentacao,
    textoIntroducao,
    condicoesPagamento,
    observacoes,
  }

  return (
    <div className="space-y-4">
      {CAMPOS.map(({ campo, label, placeholder, hint, rows }) => (
        <div key={campo} className="space-y-1.5">
          <Label className="text-sm font-medium">{label}</Label>
          <TextoLongo
            valor={valores[campo]}
            placeholder={placeholder}
            hint={hint}
            rows={rows}
            onChange={(v) => onChange(campo, v)}
          />
        </div>
      ))}
      <p className="text-xs text-[#8A7A6E]">
        Cada seção só entra no documento quando preenchida — nada de exemplo aparece na proposta
        real.
      </p>
    </div>
  )
}

/** Textarea de 1 linha para o mês (Enter desabilitado) e livre para os demais */
const TextoLongo: React.FC<{
  valor: string
  placeholder: string
  hint?: string
  rows: number
  onChange: (v: string) => void
}> = ({ valor, placeholder, hint, rows, onChange }) => (
  <div className="space-y-1">
    <Textarea
      value={valor}
      placeholder={placeholder}
      rows={Math.max(1, rows)}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault()
      }}
    />
    {hint && <p className="text-xs text-[#8A7A6E]">{hint}</p>}
  </div>
)

export default PainelTextosProposta
