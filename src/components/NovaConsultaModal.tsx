import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAllPacientes } from '@/services/pacientes'
import { createConsulta } from '@/services/consultas'
import { createTimelineEvent } from '@/services/avaliacoes'
import type { PacienteRecord, Especialidade } from '@/types/database'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, Loader2, User } from 'lucide-react'

interface NovaConsultaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  defaultPacienteId?: string
  defaultEspecialidade?: Especialidade
}

export function NovaConsultaModal({
  open,
  onOpenChange,
  onSuccess,
  defaultPacienteId,
  defaultEspecialidade,
}: NovaConsultaModalProps) {
  const { toast } = useToast()
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [loadingPacientes, setLoadingPacientes] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [pacienteId, setPacienteId] = useState<string>(defaultPacienteId || '')
  const [especialidade, setEspecialidade] = useState<Especialidade>(
    defaultEspecialidade || 'Fisioterapia',
  )
  const [data, setData] = useState<string>('')
  const [hora, setHora] = useState<string>('09:00')
  const [duracao, setDuracao] = useState<string>('45')
  const [notas, setNotas] = useState<string>('')

  useEffect(() => {
    if (open) {
      setLoadingPacientes(true)
      getAllPacientes()
        .then((res) => {
          setPacientes(res)
          if (defaultPacienteId) {
            setPacienteId(defaultPacienteId)
          } else if (res.length > 0 && !pacienteId) {
            setPacienteId(res[0].id)
          }
        })
        .finally(() => setLoadingPacientes(false))

      if (defaultEspecialidade) {
        setEspecialidade(defaultEspecialidade)
      }

      // Default to today
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      setData(`${yyyy}-${mm}-${dd}`)
    }
  }, [open, defaultPacienteId, defaultEspecialidade])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pacienteId) {
      toast({
        title: 'Selecione um paciente',
        description: 'É obrigatório selecionar um paciente para agendar.',
        variant: 'destructive',
      })
      return
    }
    if (!data || !hora) {
      toast({
        title: 'Data e hora obrigatórias',
        description: 'Informe a data e o horário da consulta.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      const dataHoraIso = new Date(`${data}T${hora}:00`).toISOString()

      const created = await createConsulta({
        paciente_id: pacienteId,
        especialidade,
        data_hora: dataHoraIso,
        duracao_min: parseInt(duracao, 10),
        status: 'Agendada',
        notas,
      })

      // Add timeline event
      await createTimelineEvent({
        paciente_id: pacienteId,
        tipo: 'Consulta',
        especialidade,
        titulo: `Consulta Agendada: ${especialidade}`,
        conteudo: `Agendada para ${data} às ${hora} (${duracao} min). ${notas ? `Obs: ${notas}` : ''}`,
        data_evento: dataHoraIso,
      }).catch(() => {})

      toast({
        title: 'Consulta agendada!',
        description: 'A consulta foi cadastrada com sucesso na agenda.',
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({
        title: 'Erro ao agendar consulta',
        description: err?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl p-6 bg-white border border-gray-100 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-[#4A322A] flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
              <Calendar className="h-5 w-5" />
            </span>
            Nova Consulta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Paciente */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-gray-400" /> Paciente *
            </Label>
            {loadingPacientes ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando pacientes...
              </div>
            ) : (
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger className="w-full h-10 border-gray-200 rounded-lg">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} {p.cpf ? `(${p.cpf})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Especialidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Especialidade *</Label>
            <Select
              value={especialidade}
              onValueChange={(val) => setEspecialidade(val as Especialidade)}
            >
              <SelectTrigger className="w-full h-10 border-gray-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                <SelectItem value="Personal">Personal Trainer</SelectItem>
                <SelectItem value="Nutrição">Nutrição</SelectItem>
                <SelectItem value="Médico">Médico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Data *</Label>
              <Input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-10 border-gray-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Horário *</Label>
              <Input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="h-10 border-gray-200 rounded-lg"
              />
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" /> Duração
            </Label>
            <Select value={duracao} onValueChange={setDuracao}>
              <SelectTrigger className="w-full h-10 border-gray-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">60 minutos (1 hora)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Notas / Observações</Label>
            <Textarea
              rows={2}
              placeholder="Queixa relatada, recomendações prévias..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="resize-none border-gray-200 rounded-lg text-sm"
            />
          </div>

          <DialogFooter className="pt-2 sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg h-10"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-lg h-10 shadow-sm transition-all border border-[#DFBF8E]/40"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Agendando...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </Button>{' '}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
