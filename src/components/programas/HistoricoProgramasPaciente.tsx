import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatDataPTBR } from '@/lib/constants'
import {
  deleteProgramaTratamento,
  formatarMoedaBRL,
  listarProgramasTratamentoPorPaciente,
  type ProgramaTratamentoRecord,
} from '@/services/programasTratamento'
import { DocumentoPropostaTratamento } from '@/components/DocumentoPropostaTratamento'
import { FileText, History, Pencil, Printer, Trash2 } from 'lucide-react'

/**
 * Histórico de Programas de Tratamento (propostas comerciais) do paciente,
 * exibido na aba "Programas de Treino" do perfil do paciente — seção
 * "Propostas Comerciais (Programa de Tratamento)". Permite reabrir/editar
 * no painel admin e reimprimir a proposta no documento institucional SOUL.
 */
export const HistoricoProgramasPaciente: React.FC<{
  pacienteId: string
  isAdmin: boolean
}> = ({ pacienteId, isAdmin }) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [programas, setProgramas] = useState<ProgramaTratamentoRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [imprimindo, setImprimindo] = useState<ProgramaTratamentoRecord | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<ProgramaTratamentoRecord | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await listarProgramasTratamentoPorPaciente(pacienteId)
      setProgramas(lista)
    } catch (err) {
      console.warn('Erro ao carregar programas de tratamento do paciente:', err)
      setProgramas([])
    } finally {
      setCarregando(false)
    }
  }, [pacienteId])

  useEffect(() => {
    if (pacienteId) carregar()
  }, [pacienteId, carregar])

  const reimprimir = useCallback((registro: ProgramaTratamentoRecord) => {
    setImprimindo(registro)
    const depois = () => setTimeout(() => setImprimindo(null), 400)
    window.addEventListener('afterprint', depois, { once: true })
    window.print()
    setTimeout(() => setImprimindo(null), 1500)
  }, [])

  const excluir = async () => {
    if (!confirmarExclusao) return
    setExcluindo(true)
    try {
      await deleteProgramaTratamento(confirmarExclusao.id)
      toast({
        title: 'Proposta excluída',
        description: 'O programa foi removido do histórico do paciente.',
      })
      setConfirmarExclusao(null)
      carregar()
    } catch (err: any) {
      console.error('Erro ao excluir programa de tratamento:', err)
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível excluir a proposta.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }

  const abrirFerramenta = (registro?: ProgramaTratamentoRecord) => {
    navigate(
      registro
        ? `/programas-tratamento/${registro.id}`
        : `/programas-tratamento/novo?paciente=${pacienteId}`,
    )
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#4A322A]">
            <History className="h-4 w-4 text-[#8C6527]" /> Propostas Comerciais (Programa de
            Tratamento)
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Propostas comerciais deste paciente geradas no painel administrador.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => abrirFerramenta()}
          className="border border-[#C9A46A] bg-white text-[#6A402D] hover:bg-[#F7F3EB] text-xs font-semibold rounded-xl h-8 px-3 flex items-center gap-1.5 shadow-2xs"
        >
          <FileText className="h-3.5 w-3.5" /> Nova Proposta
        </Button>
      </div>

      {carregando ? (
        <p className="text-xs text-gray-400 py-4 text-center">Carregando propostas…</p>
      ) : programas.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          Nenhuma proposta comercial registrada para este paciente ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {programas.map((prog) => (
            <div
              key={prog.id}
              className="p-4 rounded-2xl border border-[#E9E1D2] bg-white hover:border-[#C9A46A] hover:shadow-xs transition-all space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={
                      prog.status === 'finalizada'
                        ? 'bg-[#4A6741] text-white'
                        : 'bg-[#C9A46A] text-[#33221C]'
                    }
                  >
                    {prog.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatDataPTBR(prog.created)}</span>
                </div>
                <span className="text-sm font-bold text-[#6A402D] whitespace-nowrap">
                  R$ {formatarMoedaBRL(prog.valor_total)}
                </span>
              </div>
              <h5 className="text-sm font-bold text-gray-900">{prog.titulo || 'Proposta'}</h5>
              <p className="text-xs text-gray-500">
                {prog.data_inicio
                  ? `${formatDataPTBR(prog.data_inicio)}${
                      prog.data_fim ? ` a ${formatDataPTBR(prog.data_fim)}` : ''
                    }`
                  : 'Período: —'}
                {prog.duracao_semanas ? ` • ${prog.duracao_semanas} semanas` : ''}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                  onClick={() => reimprimir(prog)}
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Proposta
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                  onClick={() => abrirFerramenta(prog)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-[#B86545] hover:text-red-600 hover:bg-red-50"
                  onClick={() => setConfirmarExclusao(prog)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmação de exclusão */}
      <Dialog
        open={!!confirmarExclusao}
        onOpenChange={(open) => !open && setConfirmarExclusao(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir proposta?</DialogTitle>
            <DialogDescription>
              O programa "{confirmarExclusao?.titulo}" será removido do histórico do paciente. Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmarExclusao(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={excluir} disabled={excluindo}>
              {excluindo ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sobreposição de impressão A4 — mesmo container dos prontuários */}
      {imprimindo &&
        createPortal(
          <div id="container-impressao-prontuario-soul">
            <DocumentoPropostaTratamento programa={imprimindo} />
          </div>,
          document.body,
        )}
    </div>
  )
}

export default HistoricoProgramasPaciente
