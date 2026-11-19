import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2, User, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ReguaEva } from '@/components/ReguaEva'
import type { PacienteRecord } from '@/types/database'
import { getInitials, formatCPF } from '@/lib/constants'
import { SERVICOS_PRESENCA_PADRAO } from '@/lib/constants'
import type { EvaDorItem, ModeloRegistroAtendimento } from '@/services/registrosAtendimento'

export type StatusForm = 'Finalizada' | 'Ausência' | 'Desmarcada'

export interface DadosForm {
  data: string
  horario: string
  servico: string
  status: StatusForm
  motivoDesmarque: string
  modelo: ModeloRegistroAtendimento | ''
  evas: EvaDorItem[]
  avaliacaoReport: string
  condutaRealizada: string
  evolucaoDescricao: string
}

export const DADOS_INICIAIS: DadosForm = {
  data: '',
  horario: '',
  servico: 'Sessão Fisioterapia',
  status: 'Finalizada',
  motivoDesmarque: '',
  modelo: '',
  evas: [],
  avaliacaoReport: '',
  condutaRealizada: '',
  evolucaoDescricao: '',
}

/** Bloco de uma EVA (queixa + régua 0-10 + descrição da dor) */
export function BlocoEva({
  eva,
  index,
  onChange,
  onRemover,
}: {
  eva: EvaDorItem
  index: number
  onChange: (e: EvaDorItem) => void
  onRemover: () => void
}) {
  return (
    <div className="rounded-2xl border border-[#E9E1D2] bg-white p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-bold text-[#4A322A]">
          Queixa / Área da dor {index + 1 > 1 ? `(${index + 1}ª queixa)` : ''}
        </Label>
        {index > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemover}
            className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
          </Button>
        )}
      </div>

      <Input
        value={eva.queixa}
        onChange={(e) => onChange({ ...eva, queixa: e.target.value })}
        placeholder="Ex: Lombalgia à direita, ombro, joelho..."
        className="h-10 text-sm bg-white border-[#E9E1D2] rounded-xl focus:border-[#C9A46A]"
      />

      <ReguaEva value={eva.valor} onChange={(v) => onChange({ ...eva, valor: v ?? 0 })} />

      <div>
        <Label className="text-xs font-semibold text-[#73574A]">
          Descrição da dor (movimento, amplitude, o que alivia...)
        </Label>
        <Textarea
          value={eva.descricao}
          onChange={(e) => onChange({ ...eva, descricao: e.target.value })}
          rows={3}
          placeholder="Ex: dor ao movimento de flexão de tronco, piora na amplitude final; alivia com calor local e repouso..."
          className="mt-1.5 text-sm bg-white border-[#E9E1D2] rounded-xl focus:border-[#C9A46A] min-h-[70px]"
        />
      </div>
    </div>
  )
}

/** Seletor de paciente com busca (mesmo padrão do ModalAcessoRapidoEvolucao) */
export function SeletorPaciente({
  pacientes,
  loading,
  query,
  onQueryChange,
  onSelect,
  navigatingId,
}: {
  pacientes: PacienteRecord[]
  loading: boolean
  query: string
  onQueryChange: (q: string) => void
  onSelect: (p: PacienteRecord) => void
  navigatingId: string | null
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar paciente por nome, CPF ou e-mail..."
          className="pl-4 h-10 text-xs sm:text-sm bg-white border-[#E9E1D2] rounded-xl focus:border-[#C9A46A] shadow-2xs"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-[#C9A46A]" />
        )}
      </div>
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {loading && pacientes.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#C9A46A]" />
            <span>Buscando pacientes...</span>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="py-10 text-center space-y-1.5">
            <User className="h-8 w-8 text-gray-300 mx-auto" />
            <p className="text-xs font-semibold text-[#4A322A]">Nenhum paciente encontrado</p>
            <p className="text-[11px] text-gray-400">Ajuste a busca ou cadastre o paciente.</p>
          </div>
        ) : (
          pacientes.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelect(p)}
              className="p-3 rounded-2xl border border-gray-100 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold text-xs">
                    {getInitials(p.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-[#33221C] truncate">{p.nome}</p>
                  <p className="text-[11px] text-gray-400 font-mono truncate">
                    {p.cpf ? `CPF: ${formatCPF(p.cpf)}` : p.email || 'Sem contato'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className="text-[10px] hidden sm:inline-flex bg-white/70 text-gray-600 border-gray-200"
                >
                  {p.status}
                </Badge>
                <Button
                  size="sm"
                  disabled={navigatingId === p.id}
                  className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  {navigatingId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <span>Atender</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/** Escolha entre Modelo Completo e Modelo Rápido */
export function EscolhaModelo({
  modelo,
  onChange,
}: {
  modelo: ModeloRegistroAtendimento | ''
  onChange: (m: ModeloRegistroAtendimento) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('Completo')}
        className={`text-left p-4 rounded-2xl border-2 transition-all ${
          modelo === 'Completo'
            ? 'border-[#C9A46A] bg-[#FAF4EA] shadow-sm'
            : 'border-[#E9E1D2] bg-white hover:border-[#C9A46A]/60'
        }`}
      >
        <p className="text-sm font-bold text-[#4A322A]">Modelo Completo</p>
        <p className="text-[11px] text-[#73574A] mt-1">
          EVAs de dor (várias queixas) + Avaliação/Report + Conduta Realizada
        </p>
      </button>
      <button
        type="button"
        onClick={() => onChange('Rápido')}
        className={`text-left p-4 rounded-2xl border-2 transition-all ${
          modelo === 'Rápido'
            ? 'border-[#C9A46A] bg-[#FAF4EA] shadow-sm'
            : 'border-[#E9E1D2] bg-white hover:border-[#C9A46A]/60'
        }`}
      >
        <p className="text-sm font-bold text-[#4A322A]">Modelo Rápido</p>
        <p className="text-[11px] text-[#73574A] mt-1">
          Somente Evolução e Descrição Geral em texto livre
        </p>
      </button>
    </div>
  )
}

/** Campos do Modelo Completo: EVAs múltiplas + Avaliação/Report + Conduta */
export function CamposModeloCompleto({
  evas,
  avaliacaoReport,
  condutaRealizada,
  onEvasChange,
  onAvaliacaoReportChange,
  onCondutaChange,
}: {
  evas: EvaDorItem[]
  avaliacaoReport: string
  condutaRealizada: string
  onEvasChange: (evas: EvaDorItem[]) => void
  onAvaliacaoReportChange: (v: string) => void
  onCondutaChange: (v: string) => void
}) {
  const adicionarEva = () => onEvasChange([...evas, { queixa: '', valor: 0, descricao: '' }])
  const removerEva = (i: number) => onEvasChange(evas.filter((_, idx) => idx !== i))
  const atualizarEva = (i: number, nova: EvaDorItem) =>
    onEvasChange(evas.map((e, idx) => (idx === i ? nova : e)))

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold text-[#4A322A]">
            Escala Visual Analógica de Dor (0 a 10)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarEva}
            className="h-8 text-xs rounded-xl border-[#C9A46A]/50 text-[#8C6527] hover:bg-[#FAF4EA]"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar EVA
          </Button>
        </div>
        {evas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E9E1D2] bg-[#FAF7F1]/50 p-6 text-center">
            <p className="text-xs text-[#73574A]">
              Nenhuma EVA adicionada. Clique em <strong>Adicionar EVA</strong> para registrar a
              primeira queixa/área de dor.
            </p>
          </div>
        ) : (
          evas.map((eva, i) => (
            <BlocoEva
              key={i}
              eva={eva}
              index={i}
              onChange={(nova) => atualizarEva(i, nova)}
              onRemover={() => removerEva(i)}
            />
          ))
        )}
      </div>

      <div>
        <Label className="text-sm font-bold text-[#4A322A]">Avaliação / Report</Label>
        <Textarea
          value={avaliacaoReport}
          onChange={(e) => onAvaliacaoReportChange(e.target.value)}
          rows={4}
          placeholder="Como o paciente chegou, como ficou após a última semana, como se comportou no período..."
          className="mt-1.5 text-sm bg-white border-[#E9E1D2] rounded-xl focus:border-[#C9A46A] min-h-[90px]"
        />
      </div>

      <div>
        <Label className="text-sm font-bold text-[#4A322A]">Conduta Realizada</Label>
        <Textarea
          value={condutaRealizada}
          onChange={(e) => onCondutaChange(e.target.value)}
          rows={4}
          placeholder="Procedimentos, técnicas e exercícios aplicados nesta sessão..."
          className="mt-1.5 text-sm bg-white border-[#E9E1D2] rounded-xl focus:border-[#C9A46A] min-h-[90px]"
        />
      </div>
    </div>
  )
}

/** Card de item do histórico unificado (somente leitura) */
export function ItemHistorico({
  icone,
  cor,
  titulo,
  subtitulo,
  badges,
  conteudo,
}: {
  icone: React.ReactNode
  cor: string
  titulo: string
  subtitulo: string
  badges?: React.ReactNode
  conteudo?: string
}) {
  return (
    <Card className="border-[#E9E1D2] shadow-2xs bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`p-2 rounded-xl shrink-0 ${cor}`}>{icone}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#33221C] truncate">{titulo}</p>
              <p className="text-[11px] text-gray-500">{subtitulo}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">{badges}</div>
        </div>
        {conteudo && (
          <p className="text-[11px] text-[#73574A] whitespace-pre-wrap line-clamp-4 pl-[42px]">
            {conteudo}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export { SERVICOS_PRESENCA_PADRAO }

export function useServicos() {
  return useMemo(() => [...SERVICOS_PRESENCA_PADRAO], [])
}

export const servicosLista = SERVICOS_PRESENCA_PADRAO

export const useStableServicos = () => useMemo(() => SERVICOS_PRESENCA_PADRAO, [])
