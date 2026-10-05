import { useState } from 'react'
import { Bell, Calendar, Clock, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createConsulta } from '@/services/consultas'
import { createTimelineEvent } from '@/services/avaliacoes'
import { useToast } from '@/hooks/use-toast'
import type { Especialidade } from '@/types/database'

interface ModalAlertaReavaliacaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacienteId: string
  pacienteNome?: string
  especialidade?: Especialidade
  itemSugerido?: string
  onSuccess?: () => void
}

export function ModalAlertaReavaliacao({
  open,
  onOpenChange,
  pacienteId,
  pacienteNome,
  especialidade = 'Fisioterapia',
  itemSugerido = '',
  onSuccess,
}: ModalAlertaReavaliacaoProps) {
  const { toast } = useToast()

  // Calcular data de 30 dias a partir de hoje
  const get30DaysDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  const [tipoData, setTipoData] = useState<'30dias' | 'especifica'>('30dias')
  const [dataEscolhida, setDataEscolhida] = useState<string>(get30DaysDate())
  const [horario, setHorario] = useState('09:00')
  const [textoAlerta, setTextoAlerta] = useState(itemSugerido || '')
  const [submitting, setSubmitting] = useState(false)

  // Sugestões rápidas padrão SOUL
  const sugestoes = [
    'Reavaliar goniometria articular e ADM',
    'Refazer cirtometria — Fase 2',
    'Reaplicar testes de força no dinamômetro',
    'Reavaliar testes funcionais (FMS / Core McGill)',
    'Reavaliação de bioimpedância / dobras cutâneas',
    'Verificar adaptação da palmilha postural',
  ]

  const handleSelectSugestao = (sug: string) => {
    setTextoAlerta(sug)
  }

  const handleTipoDataChange = (tipo: '30dias' | 'especifica') => {
    setTipoData(tipo)
    if (tipo === '30dias') {
      setDataEscolhida(get30DaysDate())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textoAlerta.trim()) {
      toast({
        title: 'Informe o que avaliar',
        description: 'Digite o item ou teste que você deseja ser lembrado de reavaliar.',
        variant: 'destructive',
      })
      return
    }

    if (!dataEscolhida) {
      toast({
        title: 'Selecione uma data',
        description: 'A data do alerta é obrigatória.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      const dataHoraIso = `${dataEscolhida}T${horario}:00.000Z`

      // 1. Criar agendamento especial na agenda de consultas
      // Usamos notas com prefixo [ALERTA] para exibição destacada
      await createConsulta({
        paciente_id: pacienteId,
        especialidade,
        data_hora: dataHoraIso,
        duracao_min: 30,
        status: 'Agendada',
        notas: `[ALERTA DE REAVALIAÇÃO] ${textoAlerta.trim()}`,
      })

      // 2. Registrar na Timeline do Paciente para rastreabilidade
      try {
        const [ano, mes, dia] = dataEscolhida.split('-')
        const dataFormatada = `${dia}/${mes}/${ano}`
        await createTimelineEvent({
          paciente_id: pacienteId,
          tipo: 'Nota',
          especialidade,
          titulo: `Alerta Programado: Reavaliar ${textoAlerta.slice(0, 40)}`,
          conteudo: `Lembrete automático agendado para ${dataFormatada} às ${horario}: "${textoAlerta.trim()}". Lançado na Agenda Clínica.`,
          data_evento: new Date().toISOString(),
        })
      } catch (errTimeline) {
        console.warn('Erro ao salvar evento de alerta na timeline:', errTimeline)
      }

      const [ano, mes, dia] = dataEscolhida.split('-')
      const dataFormatada = `${dia}/${mes}/${ano}`

      toast({
        title: '🔔 Alerta criado com sucesso!',
        description: `Alerta criado para ${dataFormatada} — aparecerá na Agenda.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      console.error('Erro ao agendar alerta:', err)
      toast({
        title: 'Erro ao criar alerta',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const [ano, mes, dia] = dataEscolhida ? dataEscolhida.split('-') : ['', '', '']
  const dataFormatadaExibicao = dia && mes && ano ? `${dia}/${mes}/${ano}` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 border border-[#E9E1D2] bg-white shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 fill-amber-500/20 text-amber-600 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-lg font-serif font-bold text-[#4A322A]">
                Agendar Alerta de Reavaliação
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {pacienteNome
                  ? `Criar lembrete automático na Agenda para ${pacienteNome}.`
                  : 'Criar lembrete automático na Agenda Clínica.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* O que lembrar de avaliar */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span>O que lembrar de avaliar? *</span>
              <span className="text-[10px] text-gray-400 font-normal">Ex: teste, item, fase</span>
            </Label>
            <Textarea
              required
              rows={2}
              value={textoAlerta}
              onChange={(e) => setTextoAlerta(e.target.value)}
              placeholder="Ex: Reavaliar goniometria de ombro, Refazer cirtometria — Fase 2, Reaplicar FMS..."
              className="rounded-xl border-gray-200 text-xs sm:text-sm focus-visible:ring-amber-500"
            />

            {/* Sugestões rápidas em chips */}
            <div className="pt-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C6527] block mb-1">
                Sugestões rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sugestoes.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSugestao(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#FAF5EE] border border-[#E9E1D2] text-[#73574A] hover:bg-[#F3EAD9] hover:text-[#4A322A] hover:border-[#D4B278] transition-all text-left"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seleção de Data */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="text-xs font-semibold text-gray-700 block">Quando lembrar? *</Label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTipoDataChange('30dias')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  tipoData === '30dias'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 text-[#4A322A]'
                    : 'border-gray-200 bg-gray-50/40 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">Daqui a 30 dias</span>
                  {tipoData === '30dias' && (
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-gray-500 mt-1 font-mono">
                  {get30DaysDate().split('-').reverse().join('/')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTipoDataChange('especifica')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  tipoData === 'especifica'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 text-[#4A322A]'
                    : 'border-gray-200 bg-gray-50/40 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">Data específica</span>
                  {tipoData === 'especifica' && (
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-gray-500 mt-1">Escolher no calendário</span>
              </button>
            </div>

            {/* Inputs de Data e Horário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" /> Data do Lembrete
                </Label>
                <Input
                  type="date"
                  required
                  value={dataEscolhida}
                  onChange={(e) => {
                    setDataEscolhida(e.target.value)
                    setTipoData('especifica')
                  }}
                  className="h-9 rounded-xl border-gray-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" /> Horário na Agenda
                </Label>
                <Input
                  type="time"
                  required
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="h-9 rounded-xl border-gray-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Banner Informativo */}
          <div className="p-3 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-start gap-2.5 text-xs text-[#73574A]">
            <Sparkles className="h-4 w-4 text-[#8C6527] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#4A322A]">Lançamento automático na Agenda:</p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Um compromisso especial marcado como{' '}
                <strong>ALERTA: {dataFormatadaExibicao}</strong> será inserido para o paciente, sem
                bloquear consultas regulares.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:brightness-105 text-white font-bold rounded-xl h-10 px-5 text-xs shadow-md border border-amber-400/40"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Agendando Alerta...
                </>
              ) : (
                <>
                  <Bell className="mr-1.5 h-4 w-4 fill-white/20" /> Confirmar Alerta
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
