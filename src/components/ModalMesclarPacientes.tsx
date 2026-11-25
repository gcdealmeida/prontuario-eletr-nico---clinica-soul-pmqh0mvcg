import React, { useState, useEffect, useMemo } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GitMerge,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  UserCheck,
  UserX,
  FileText,
  Calendar,
  Activity,
  ArrowLeftRight,
} from 'lucide-react'
import { getAllPacientes, mergePacientes, type MergePacientesResponse } from '@/services/pacientes'
import type { PacienteRecord } from '@/types/database'
import { formatCPF, formatTelefone, formatDataPTBR } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'

interface ModalMesclarPacientesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Paciente pré-selecionado (se o modal for aberto a partir da tela de detalhe ou ação específica) */
  initialPacienteId?: string
  /** Se o initialPacienteId deve entrar como principal ('target') ou duplicado ('source') */
  initialRole?: 'target' | 'source'
  onSuccess?: (result: MergePacientesResponse) => void
}

export function ModalMesclarPacientes({
  open,
  onOpenChange,
  initialPacienteId,
  initialRole = 'source',
  onSuccess,
}: ModalMesclarPacientesProps) {
  const { toast } = useToast()

  const [loadingPacientes, setLoadingPacientes] = useState(false)
  const [pacientesList, setPacientesList] = useState<PacienteRecord[]>([])

  const [sourceId, setSourceId] = useState<string>('')
  const [targetId, setTargetId] = useState<string>('')

  const [searchSource, setSearchSource] = useState('')
  const [searchTarget, setSearchTarget] = useState('')

  const [isMerging, setIsMerging] = useState(false)
  const [confirmationChecked, setConfirmationChecked] = useState(false)
  const [result, setResult] = useState<MergePacientesResponse | null>(null)

  // Carrega pacientes ao abrir
  useEffect(() => {
    if (!open) {
      setResult(null)
      setConfirmationChecked(false)
      return
    }

    let isMounted = true
    setLoadingPacientes(true)

    getAllPacientes()
      .then((records) => {
        if (!isMounted) return
        setPacientesList(records)

        // Se houver pré-seleção
        if (initialPacienteId) {
          if (initialRole === 'target') {
            setTargetId(initialPacienteId)
          } else {
            setSourceId(initialPacienteId)
          }
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar lista de pacientes para mesclagem:', err)
        toast({
          title: 'Erro ao carregar pacientes',
          description: 'Não foi possível carregar a lista de pacientes.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (isMounted) setLoadingPacientes(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, initialPacienteId, initialRole, toast])

  const sourcePaciente = useMemo(
    () => pacientesList.find((p) => p.id === sourceId) || null,
    [pacientesList, sourceId],
  )

  const targetPaciente = useMemo(
    () => pacientesList.find((p) => p.id === targetId) || null,
    [pacientesList, targetId],
  )

  // Filtra opções
  const filteredSourceOptions = useMemo(() => {
    const q = searchSource.toLowerCase().trim()
    return pacientesList.filter((p) => {
      if (p.id === targetId) return false
      if (!q) return true
      return (
        p.nome.toLowerCase().includes(q) ||
        (p.cpf && p.cpf.includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.telefone && p.telefone.includes(q))
      )
    })
  }, [pacientesList, targetId, searchSource])

  const filteredTargetOptions = useMemo(() => {
    const q = searchTarget.toLowerCase().trim()
    return pacientesList.filter((p) => {
      if (p.id === sourceId) return false
      if (!q) return true
      return (
        p.nome.toLowerCase().includes(q) ||
        (p.cpf && p.cpf.includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.telefone && p.telefone.includes(q))
      )
    })
  }, [pacientesList, sourceId, searchTarget])

  // Inverter seleção (trocar principal por duplicado)
  const handleInvertRoles = () => {
    const prevSource = sourceId
    const prevTarget = targetId
    setSourceId(prevTarget)
    setTargetId(prevSource)
    setConfirmationChecked(false)
  }

  // Executar a mesclagem
  const handleExecuteMerge = async () => {
    if (!sourceId || !targetId) {
      toast({
        title: 'Seleção incompleta',
        description: 'Selecione tanto o paciente duplicado quanto o paciente principal.',
        variant: 'destructive',
      })
      return
    }

    if (sourceId === targetId) {
      toast({
        title: 'Seleção inválida',
        description: 'O paciente principal e o duplicado devem ser diferentes.',
        variant: 'destructive',
      })
      return
    }

    if (!confirmationChecked) {
      toast({
        title: 'Confirmação necessária',
        description: 'Marque a caixa de confirmação para autorizar a operação irreversível.',
        variant: 'destructive',
      })
      return
    }

    setIsMerging(true)
    try {
      const res = await mergePacientes({
        target_paciente_id: targetId,
        source_paciente_id: sourceId,
      })

      setResult(res)
      toast({
        title: 'Cadastros mesclados com sucesso!',
        description: `${res.total_registros_movidos} registros vinculados agora ao paciente ${res.target_paciente_nome}.`,
      })

      if (onSuccess) {
        onSuccess(res)
      }
    } catch (err: any) {
      console.error('Erro na mesclagem de pacientes:', err)
      toast({
        title: 'Falha na mesclagem',
        description: err?.message || 'Ocorreu um erro no servidor ao tentar unificar os cadastros.',
        variant: 'destructive',
      })
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-[#8C6527]">
            <GitMerge className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider bg-[#FAF5EE] px-2.5 py-0.5 rounded-full border border-[#E9D5B5]">
              Administração · Gestão de Prontuários
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-bold text-gray-900">
            Mesclar Cadastros Duplicados
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600">
            Transfere toda a história clínica (avaliações, laudos, evoluções assinadas, presenças,
            consultas, timeline) do cadastro duplicado para o cadastro principal definitivo.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-5 py-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-base">Unificação Concluída com Sucesso!</h4>
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                O cadastro duplicado <strong>"{result.source_paciente_nome}"</strong> foi absorvido
                e removido. Toda a história clínica foi consolidada no cadastro principal{' '}
                <strong>"{result.target_paciente_nome}"</strong>.
              </p>

              <div className="pt-2 border-t border-emerald-200/70 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-gray-500 block text-[11px]">Total movidos</span>
                  <span className="font-bold text-base text-emerald-700">
                    {result.total_registros_movidos} registros
                  </span>
                </div>
                {result.registros_movidos['avaliacoes_fisioterapia'] ? (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-gray-500 block text-[11px]">Avaliações Fisio</span>
                    <span className="font-bold text-sm text-gray-900">
                      {result.registros_movidos['avaliacoes_fisioterapia']}
                    </span>
                  </div>
                ) : null}
                {result.registros_movidos['evolucoes'] ? (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-gray-500 block text-[11px]">Evoluções</span>
                    <span className="font-bold text-sm text-gray-900">
                      {result.registros_movidos['evolucoes']}
                    </span>
                  </div>
                ) : null}
                {result.registros_movidos['presencas'] ? (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-gray-500 block text-[11px]">Presenças</span>
                    <span className="font-bold text-sm text-gray-900">
                      {result.registros_movidos['presencas']}
                    </span>
                  </div>
                ) : null}
                {result.registros_movidos['relatorios_ia'] ? (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-gray-500 block text-[11px]">Relatórios IA</span>
                    <span className="font-bold text-sm text-gray-900">
                      {result.registros_movidos['relatorios_ia']}
                    </span>
                  </div>
                ) : null}
              </div>

              {result.campos_herdados && result.campos_herdados.length > 0 && (
                <div className="pt-2 text-xs text-emerald-900">
                  <strong>Campos de cadastro herdados:</strong> {result.campos_herdados.join(', ')}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] text-[#33221C] font-bold rounded-xl"
              >
                Concluir e Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Aviso de Ação Irreversível */}
            <Alert className="bg-amber-50/90 border-amber-300 text-amber-950 rounded-2xl p-4">
              <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5" />
              <div className="ml-2">
                <AlertTitle className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Atenção: Ação Irreversível no Servidor
                </AlertTitle>
                <AlertDescription className="text-xs text-amber-900 leading-relaxed mt-1">
                  Ao confirmar, todos os vínculos clínicos do paciente duplicado serão transferidos
                  automaticamente para o paciente principal, e o registro duplicado será excluído.
                  As evoluções assinadas e relatórios permanecem imutáveis quanto ao conteúdo.
                </AlertDescription>
              </div>
            </Alert>

            {loadingPacientes ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin text-[#C9A46A]" />
                <span className="text-xs">Carregando pacientes cadastrados...</span>
              </div>
            ) : (
              <>
                {/* Seleção dos Dois Pacientes Lado a Lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative items-stretch">
                  {/* Paciente DUPLICADO (absorvido) */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
                          <UserX className="h-4 w-4" />
                          <span>1. Paciente DUPLICADO</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-red-100 text-red-800 border-red-200"
                        >
                          Será absorvido e excluído
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-2">
                        Selecione o cadastro secundário cujos dados e avaliações serão migrados.
                      </p>

                      <Select
                        value={sourceId}
                        onValueChange={(val) => {
                          setSourceId(val)
                          setConfirmationChecked(false)
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl bg-white border-red-200 text-xs">
                          <SelectValue placeholder="Escolha o paciente duplicado..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Buscar duplicado..."
                              value={searchSource}
                              onChange={(e) => setSearchSource(e.target.value)}
                              className="h-8 text-xs rounded-lg"
                            />
                          </div>
                          {filteredSourceOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">
                              {p.nome} {p.status ? `(${p.status})` : ''}{' '}
                              {p.cpf ? `• CPF: ${formatCPF(p.cpf)}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {sourcePaciente && (
                      <div className="mt-3 p-3 rounded-xl bg-white border border-red-200/80 text-xs space-y-1.5 text-gray-700">
                        <p className="font-bold text-red-950 flex items-center justify-between">
                          <span>{sourcePaciente.nome}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {sourcePaciente.status}
                          </Badge>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          CPF: {formatCPF(sourcePaciente.cpf)} • Tel:{' '}
                          {formatTelefone(sourcePaciente.telefone)}
                        </p>
                        {sourcePaciente.email && (
                          <p className="text-[11px] text-gray-500">
                            E-mail: {sourcePaciente.email}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400">
                          Criado em: {formatDataPTBR(sourcePaciente.created)} (ID:{' '}
                          {sourcePaciente.id})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botão de inversão central */}
                  <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleInvertRoles}
                      title="Inverter: tornar o duplicado em principal e vice-versa"
                      className="rounded-full h-9 w-9 p-0 bg-white shadow-md border-gray-300 hover:bg-gray-100 hover:scale-105 transition-transform"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-[#8C6527]" />
                    </Button>
                  </div>

                  {/* Paciente PRINCIPAL (permanece) */}
                  <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                          <UserCheck className="h-4 w-4" />
                          <span>2. Paciente PRINCIPAL</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                        >
                          Permanece no sistema
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-2">
                        Selecione o cadastro oficial definitivo que receberá todo o histórico.
                      </p>

                      <Select
                        value={targetId}
                        onValueChange={(val) => {
                          setTargetId(val)
                          setConfirmationChecked(false)
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl bg-white border-emerald-200 text-xs">
                          <SelectValue placeholder="Escolha o paciente principal..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Buscar principal..."
                              value={searchTarget}
                              onChange={(e) => setSearchTarget(e.target.value)}
                              className="h-8 text-xs rounded-lg"
                            />
                          </div>
                          {filteredTargetOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">
                              {p.nome} {p.status ? `(${p.status})` : ''}{' '}
                              {p.cpf ? `• CPF: ${formatCPF(p.cpf)}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {targetPaciente && (
                      <div className="mt-3 p-3 rounded-xl bg-white border border-emerald-200/80 text-xs space-y-1.5 text-gray-700">
                        <p className="font-bold text-emerald-950 flex items-center justify-between">
                          <span>{targetPaciente.nome}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {targetPaciente.status}
                          </Badge>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          CPF: {formatCPF(targetPaciente.cpf)} • Tel:{' '}
                          {formatTelefone(targetPaciente.telefone)}
                        </p>
                        {targetPaciente.email && (
                          <p className="text-[11px] text-gray-500">
                            E-mail: {targetPaciente.email}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400">
                          Criado em: {formatDataPTBR(targetPaciente.created)} (ID:{' '}
                          {targetPaciente.id})
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo da Ação e Regras de Negócio */}
                {sourcePaciente && targetPaciente && (
                  <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-2 text-xs text-[#5C4538]">
                    <div className="font-bold text-sm text-[#4A322A] flex items-center gap-2">
                      <GitMerge className="h-4 w-4 text-[#8C6527]" />
                      <span>Resumo da Operação de Unificação:</span>
                    </div>
                    <ul className="space-y-1 list-disc pl-5 leading-relaxed">
                      <li>
                        <strong>Todas as avaliações clínicas</strong> (Fisioterapia, Personal,
                        Nutrição, Medicina), laudos e exames anexados de{' '}
                        <em>"{sourcePaciente.nome}"</em> passam a pertencer a{' '}
                        <em>"{targetPaciente.nome}"</em>.
                      </li>
                      <li>
                        <strong>Todas as evoluções</strong> (inclusive assinadas{' '}
                        <code>EVO-XXXX</code> com imutabilidade legal preservada) passam a constar
                        no prontuário unificado.
                      </li>
                      <li>
                        <strong>
                          Presenças, consultas agendadas, programas de exercícios e timeline
                        </strong>{' '}
                        são consolidados no cadastro principal.
                      </li>
                      <li>
                        <strong>Dados cadastrais vazios</strong> no cadastro principal (como CPF,
                        e-mail ou endereço) serão preenchidos automaticamente com os dados do
                        duplicado antes da exclusão.
                      </li>
                      <li>
                        O cadastro <em>"{sourcePaciente.nome}"</em> (ID:{' '}
                        <code>{sourcePaciente.id}</code>) será removido do sistema e não aparecerá
                        mais em buscas.
                      </li>
                    </ul>

                    {/* Checkbox de Confirmação Explícita */}
                    <div className="pt-3 border-t border-[#E9E1D2] flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="confirm-merge"
                        checked={confirmationChecked}
                        onChange={(e) => setConfirmationChecked(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#8C6527] focus:ring-[#8C6527]"
                      />
                      <label
                        htmlFor="confirm-merge"
                        className="font-semibold text-xs text-gray-900 cursor-pointer"
                      >
                        Estou ciente de que esta ação é irreversível e confirmo a mesclagem de{' '}
                        <span className="text-red-700 font-bold">"{sourcePaciente.nome}"</span> em{' '}
                        <span className="text-emerald-700 font-bold">"{targetPaciente.nome}"</span>.
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isMerging}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!sourceId || !targetId || !confirmationChecked || isMerging}
                onClick={handleExecuteMerge}
                className="bg-gradient-to-r from-red-600 to-amber-700 hover:brightness-105 text-white font-bold rounded-xl h-10 px-5 flex items-center gap-2 shadow-sm"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Unificando Histórico...
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4" />
                    Confirmar e Mesclar Cadastros
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
