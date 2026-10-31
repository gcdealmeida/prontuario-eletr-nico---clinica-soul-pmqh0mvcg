import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Activity,
  Plus,
  Clock,
  User,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  Bell,
  Stethoscope,
  Dumbbell,
  Apple,
  Eye,
  X,
  FileCheck,
  ShieldCheck,
  Lock,
  RotateCcw,
  Printer,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getEvolucoesByPaciente,
  createEvolucao,
  updateEvolucao,
  deleteEvolucao,
} from '@/services/evolucoes'
import {
  garantirPresencaAutomatica,
  mapearEspecialidadeParaServicoPresenca,
} from '@/services/presencas'
import type { EvolucaoRecord, Especialidade, StatusEvolucao } from '@/types/database'
import {
  ESPECIALIDADE_COLORS,
  formatDataPTBR,
  formatHoraPTBR,
  formatDataHoraPTBR,
  getHojeBrasilYMD,
  getAgoraBrasilHora,
} from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { ReguaEva, EvaBadge } from '@/components/ReguaEva'
import { TrajetoriaEvaGrafico } from '@/components/TrajetoriaEvaGrafico'
import {
  salvarRascunhoLocal,
  carregarRascunhoLocal,
  limparRascunhoLocal,
  type RascunhoLocalItem,
} from '@/services/rascunhoLocal'
import { useNavigationBlocker } from '@/hooks/use-navigation-blocker'
import { ModalAlertaSaida } from '@/components/ModalAlertaSaida'

interface SecaoEvolucoesProps {
  pacienteId: string
  avaliacaoId: string
  especialidade: Especialidade
  pacienteNome?: string
  profissionalPadrao?: string
  onOpenAlerta?: (itemSugerido?: string) => void
}

export function SecaoEvolucoes({
  pacienteId,
  avaliacaoId,
  especialidade,
  pacienteNome,
  profissionalPadrao,
  onOpenAlerta,
}: SecaoEvolucoesProps) {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const novaAutoAbertaRef = useRef(false)

  const [evolucoes, setEvolucoes] = useState<EvolucaoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Modal formulário (Criar / Editar)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Modal confirmação de exclusão
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [formTipo, setFormTipo] = useState<'soap' | 'rapida'>('soap')
  const [formEspecialidade, setFormEspecialidade] = useState<Especialidade>(especialidade)
  const [formData, setFormData] = useState(() => `${getHojeBrasilYMD()}T${getAgoraBrasilHora()}`)
  const [formHorario, setFormHorario] = useState(() => getAgoraBrasilHora())
  const [formProfissional, setFormProfissional] = useState(profissionalPadrao || 'SOUL Clínica')
  const [formStatus, setFormStatus] = useState<StatusEvolucao>('Finalizada')
  const [tipoEvolucao, setTipoEvolucao] = useState<'Rotina' | 'Corretiva'>('Rotina')
  const [evolucaoReferenciaId, setEvolucaoReferenciaId] = useState<string | null>(null)

  // SOAP fields
  const [subjetivo, setSubjetivo] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [avaliacaoClinica, setAvaliacaoClinica] = useState('')
  const [plano, setPlano] = useState('')
  const [condutaProcedimentos, setCondutaProcedimentos] = useState('')

  // EVA (Escala Visual Analógica de Dor)
  const [evaDor, setEvaDor] = useState<number | null>(null)

  // Evolução rápida
  const [textoLivre, setTextoLivre] = useState('')

  // Controle de rascunho local e proteção contra perda de dados na evolução
  const [isModalDirty, setIsModalDirty] = useState(false)
  const [rascunhoEvolucaoEncontrado, setRascunhoEvolucaoEncontrado] =
    useState<RascunhoLocalItem | null>(null)
  const [modalLeaveConfirmOpen, setModalLeaveConfirmOpen] = useState(false)
  const isSuccessfullySavedRef = useRef(false)

  // Guarda de navegação interna da página caso modal esteja aberto com dados digitados
  const shouldBlockPage = modalOpen && isModalDirty && !isSuccessfullySavedRef.current && !saving
  const { isBlocked, confirmLeave, cancelLeave } = useNavigationBlocker({
    when: shouldBlockPage,
    message:
      'Você possui uma evolução clínica preenchida e ainda não salva. Se você sair agora, os dados não salvos poderão ser perdidos. Deseja realmente sair?',
  })

  // Checar se há rascunho local quando modal abre para nova evolução (não em edição de ID existente)
  useEffect(() => {
    if (!modalOpen || editingId || !pacienteId) {
      setRascunhoEvolucaoEncontrado(null)
      return
    }

    const rascunho = carregarRascunhoLocal('evolucao', pacienteId, formEspecialidade)
    if (rascunho && rascunho.data) {
      const d = rascunho.data
      const temConteudo = Boolean(
        d.subjetivo ||
        d.objetivo ||
        d.avaliacaoClinica ||
        d.plano ||
        d.condutaProcedimentos ||
        d.textoLivre,
      )
      if (temConteudo) {
        setRascunhoEvolucaoEncontrado(rascunho)
      } else {
        setRascunhoEvolucaoEncontrado(null)
      }
    }
  }, [modalOpen, editingId, pacienteId, formEspecialidade])

  // Autosave a cada ~20 segundos do formulário SOAP de evolução enquanto aberto e sujo
  useEffect(() => {
    if (!modalOpen || !isModalDirty || !pacienteId || isSuccessfullySavedRef.current) return

    const interval = setInterval(() => {
      const payloadDraft = {
        formTipo,
        formEspecialidade,
        formData,
        formProfissional,
        subjetivo,
        objetivo,
        avaliacaoClinica,
        plano,
        condutaProcedimentos,
        textoLivre,
        evaDor,
      }
      salvarRascunhoLocal('evolucao', pacienteId, formEspecialidade, payloadDraft, {
        pacienteNome,
        especialidade: formEspecialidade,
      })
    }, 20000)

    return () => clearInterval(interval)
  }, [
    modalOpen,
    isModalDirty,
    pacienteId,
    formEspecialidade,
    formTipo,
    formData,
    formProfissional,
    subjetivo,
    objetivo,
    avaliacaoClinica,
    plano,
    condutaProcedimentos,
    textoLivre,
    evaDor,
    pacienteNome,
  ])

  const restaurarRascunhoEvolucao = () => {
    if (!rascunhoEvolucaoEncontrado) return
    const d = rascunhoEvolucaoEncontrado.data
    if (d.formTipo) setFormTipo(d.formTipo)
    if (d.formData) setFormData(d.formData)
    if (d.formProfissional) setFormProfissional(d.formProfissional)
    if (d.subjetivo !== undefined) setSubjetivo(d.subjetivo)
    if (d.objetivo !== undefined) setObjetivo(d.objetivo)
    if (d.avaliacaoClinica !== undefined) setAvaliacaoClinica(d.avaliacaoClinica)
    if (d.plano !== undefined) setPlano(d.plano)
    if (d.condutaProcedimentos !== undefined) setCondutaProcedimentos(d.condutaProcedimentos)
    if (d.textoLivre !== undefined) setTextoLivre(d.textoLivre)
    if (typeof d.evaDor === 'number') setEvaDor(d.evaDor)

    setIsModalDirty(true)
    toast({
      title: 'Rascunho de evolução restaurado!',
      description: `Conteúdo de ${formatDataHoraPTBR(rascunhoEvolucaoEncontrado.meta.updatedAt)} restaurado.`,
    })
    setRascunhoEvolucaoEncontrado(null)
  }

  const descartarRascunhoEvolucao = () => {
    if (!pacienteId) return
    limparRascunhoLocal('evolucao', pacienteId, formEspecialidade)
    setRascunhoEvolucaoEncontrado(null)
    toast({
      title: 'Rascunho descartado',
      description: 'O rascunho anterior de evolução foi removido.',
    })
  }

  const carregarEvolucoes = async () => {
    if (!pacienteId) return
    try {
      setLoading(true)
      const res = await getEvolucoesByPaciente(pacienteId)
      setEvolucoes(res)
      // Expandir a mais recente por padrão se houver
      if (res.length > 0 && !expandedId) {
        setExpandedId(res[0].id)
      }
    } catch (err) {
      console.error('Erro ao carregar evoluções:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEvolucoes()
  }, [pacienteId])

  useRealtime('evolucoes', () => {
    carregarEvolucoes()
  })

  // Encontra a última evolução do paciente que tenha EVA preenchida para referência e pré-carga
  const ultimaEvolucaoComEva = evolucoes.find((e) => typeof e.eva_dor === 'number')
  const referenciaUltimaEva = ultimaEvolucaoComEva
    ? {
        valor: ultimaEvolucaoComEva.eva_dor as number,
        data: formatDataPTBR(ultimaEvolucaoComEva.data_evolucao || ultimaEvolucaoComEva.created),
      }
    : null

  const resetForm = () => {
    setEditingId(null)
    setTipoEvolucao('Rotina')
    setEvolucaoReferenciaId(null)
    setFormTipo('soap')
    setFormEspecialidade(especialidade)
    const hojeYmd = getHojeBrasilYMD()
    const agoraHora = getAgoraBrasilHora()
    setFormData(`${hojeYmd}T${agoraHora}`)
    setFormHorario(agoraHora)
    setFormProfissional(profissionalPadrao || 'SOUL Clínica')
    setFormStatus('Finalizada')
    setSubjetivo('')
    setObjetivo('')
    setAvaliacaoClinica('')
    setPlano('')
    setCondutaProcedimentos('')
    setTextoLivre('')
    setIsModalDirty(false)
    isSuccessfullySavedRef.current = false
    setRascunhoEvolucaoEncontrado(null)
    // Pré-carrega o valor da última EVA registrada (se houver) para agilizar o atendimento
    setEvaDor(referenciaUltimaEva ? referenciaUltimaEva.valor : null)
  }

  const handleOpenNova = () => {
    resetForm()
    setModalOpen(true)
  }

  // Auto-abertura da nova evolução quando URL possui ?nova=1 ou ?nova=true e o carregamento terminou
  useEffect(() => {
    const novaParam = searchParams.get('nova')
    if (!loading && (novaParam === '1' || novaParam === 'true') && !novaAutoAbertaRef.current) {
      novaAutoAbertaRef.current = true
      handleOpenNova()
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('nova')
      setSearchParams(newParams, { replace: true })
    }
  }, [loading, searchParams, setSearchParams])

  const handleOpenEdit = (evo: EvolucaoRecord) => {
    if (evo.documento_fechado || evo.status === 'Finalizada') {
      toast({
        title: 'Documento Clínico Fechado',
        description:
          'Esta evolução foi assinada digitalmente e não pode ser alterada. Utilize a opção "Nova Evolução Corretiva".',
        variant: 'destructive',
      })
      return
    }

    setEditingId(evo.id)
    setTipoEvolucao(evo.tipo_evolucao || 'Rotina')
    setEvolucaoReferenciaId(evo.evolucao_referencia_id || null)
    setFormEspecialidade(evo.especialidade)
    const rawDataEvo = evo.data_evolucao || ''
    let dataYmd = ''
    let horaExtraida = evo.horario || ''
    if (rawDataEvo.includes('T')) {
      const p = rawDataEvo.split('T')
      dataYmd = p[0]
      if (!horaExtraida && p[1]) {
        horaExtraida = p[1].substring(0, 5)
      }
    } else if (rawDataEvo.includes(' ')) {
      const p = rawDataEvo.split(' ')
      dataYmd = p[0]
      if (!horaExtraida && p[1] && p[1] !== '12:00:00' && p[1] !== '00:00:00') {
        horaExtraida = p[1].substring(0, 5)
      }
    } else if (rawDataEvo.length >= 10) {
      dataYmd = rawDataEvo.substring(0, 10)
    }
    if (!dataYmd) dataYmd = getHojeBrasilYMD()
    if (!horaExtraida) horaExtraida = getAgoraBrasilHora()

    setFormData(`${dataYmd}T${horaExtraida}`)
    setFormHorario(horaExtraida)
    setFormProfissional(evo.profissional || profissionalPadrao || 'SOUL Clínica')
    setFormStatus(evo.status || 'Rascunho')

    setSubjetivo(evo.subjetivo || '')
    setObjetivo(evo.objetivo || '')
    setAvaliacaoClinica(evo.avaliacao_clinica || '')
    setPlano(evo.plano || '')
    setCondutaProcedimentos(evo.conduta_procedimentos || '')
    setTextoLivre(evo.texto_livre || '')
    setEvaDor(typeof evo.eva_dor === 'number' ? evo.eva_dor : null)

    if (evo.texto_livre && !evo.subjetivo && !evo.objetivo && !evo.avaliacao_clinica) {
      setFormTipo('rapida')
    } else {
      setFormTipo('soap')
    }

    setModalOpen(true)
  }

  // Abre formulário para criar uma NOVA evolução corretiva vinculada à evolução assinada anterior
  const handleOpenNovaCorretiva = (evoAnterior: EvolucaoRecord) => {
    resetForm()
    setTipoEvolucao('Corretiva')
    setEvolucaoReferenciaId(evoAnterior.id)
    setFormEspecialidade(evoAnterior.especialidade)
    setFormProfissional(
      profissionalPadrao ||
        evoAnterior.assinado_por_nome ||
        evoAnterior.profissional ||
        'SOUL Clínica',
    )
    setFormStatus('Finalizada')
    setEvaDor(typeof evoAnterior.eva_dor === 'number' ? evoAnterior.eva_dor : null)

    const refInfo = evoAnterior.numero_registro
      ? `Registro ${evoAnterior.numero_registro}`
      : `Sessão de ${formatDataHoraPTBR(evoAnterior.assinado_em || evoAnterior.data_evolucao)}`

    const cabecalhoNota = `[NOTA CORRETIVA referente à evolução anterior ${refInfo}]\nMotivo da retificação: `

    if (evoAnterior.texto_livre && !evoAnterior.subjetivo && !evoAnterior.objetivo) {
      setFormTipo('rapida')
      setTextoLivre(`${cabecalhoNota}\n\n--- Texto retificado ---\n${evoAnterior.texto_livre}`)
    } else {
      setFormTipo('soap')
      setSubjetivo(evoAnterior.subjetivo ? `[Retificação] ${evoAnterior.subjetivo}` : '')
      setObjetivo(evoAnterior.objetivo || '')
      setAvaliacaoClinica(`${cabecalhoNota}\n${evoAnterior.avaliacao_clinica || ''}`)
      setPlano(evoAnterior.plano || '')
      setCondutaProcedimentos(evoAnterior.conduta_procedimentos || '')
    }
    setModalOpen(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formProfissional.trim()) {
      toast({
        title: 'Profissional obrigatório',
        description: 'Informe o nome do profissional responsável pela sessão.',
        variant: 'destructive',
      })
      return
    }

    // Validação mínima de conteúdo
    const hasSoap =
      subjetivo.trim() ||
      objetivo.trim() ||
      avaliacaoClinica.trim() ||
      plano.trim() ||
      condutaProcedimentos.trim()
    const hasRapida = textoLivre.trim()

    if (!hasSoap && !hasRapida) {
      toast({
        title: 'Evolução sem conteúdo',
        description: 'Preencha pelo menos um campo da evolução clínica.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      // Extrai data YYYY-MM-DD e horário HH:mm garantindo fuso local
      let dataYmd = ''
      let horaStr = formHorario.trim()
      if (formData.includes('T')) {
        const partes = formData.split('T')
        dataYmd = partes[0]
        if (!horaStr && partes[1]) {
          horaStr = partes[1].substring(0, 5)
        }
      } else {
        dataYmd = formData.substring(0, 10)
      }
      if (!dataYmd) dataYmd = getHojeBrasilYMD()
      if (!horaStr) horaStr = getAgoraBrasilHora()

      // Para data_evolucao (campo date do PocketBase), gravamos no meio-dia local 'YYYY-MM-DD 12:00:00'
      // para NUNCA sofrer deslocamento de fuso de dia
      const dataHoraPocketBase = `${dataYmd} 12:00:00`

      const payload: Partial<EvolucaoRecord> = {
        paciente_id: pacienteId,
        avaliacao_id: avaliacaoId,
        especialidade: formEspecialidade,
        data_evolucao: dataHoraPocketBase,
        horario: horaStr || undefined,
        profissional: formProfissional.trim(),
        subjetivo: subjetivo.trim() || undefined,
        objetivo: objetivo.trim() || undefined,
        avaliacao_clinica: avaliacaoClinica.trim() || undefined,
        plano: plano.trim() || undefined,
        conduta_procedimentos: condutaProcedimentos.trim() || undefined,
        texto_livre: textoLivre.trim() || undefined,
        eva_dor: typeof evaDor === 'number' ? evaDor : null,
        status: formStatus,
        tipo_evolucao: tipoEvolucao,
        evolucao_referencia_id: evolucaoReferenciaId || undefined,
      }

      let evolucaoSalva: EvolucaoRecord | null = null
      if (editingId) {
        evolucaoSalva = await updateEvolucao(editingId, payload)
        isSuccessfullySavedRef.current = true
        setIsModalDirty(false)
        limparRascunhoLocal('evolucao', pacienteId, formEspecialidade)
        toast({
          title:
            formStatus === 'Finalizada' ? 'Evolução Assinada com Sucesso!' : 'Rascunho Atualizado',
          description:
            formStatus === 'Finalizada'
              ? 'O documento clínico foi assinado digitalmente e a presença foi confirmada.'
              : 'O rascunho da sessão foi atualizado.',
        })
      } else {
        evolucaoSalva = await createEvolucao(payload, {
          addToTimeline: formStatus === 'Finalizada',
          assinarImediatamente: formStatus === 'Finalizada',
        })
        isSuccessfullySavedRef.current = true
        setIsModalDirty(false)
        limparRascunhoLocal('evolucao', pacienteId, formEspecialidade)
        toast({
          title:
            formStatus === 'Finalizada'
              ? 'Documento Clínico Assinado e Fechado!'
              : 'Rascunho de Evolução Salvo',
          description:
            formStatus === 'Finalizada'
              ? 'Assinatura digital aplicada com data, hora e presença confirmada automaticamente na lista de Presenças.'
              : 'A evolução foi salva como rascunho e permanece editável até a assinatura.',
        })
      }

      // Garantia de lançamento de presença caso a evolução tenha sido finalizada/assinada
      if (formStatus === 'Finalizada' && evolucaoSalva) {
        try {
          const { area, detalhe } = mapearEspecialidadeParaServicoPresenca(
            formEspecialidade,
            'evolucao',
          )
          const regNum = evolucaoSalva.numero_registro || `EVO-${evolucaoSalva.id}`
          await garantirPresencaAutomatica({
            pacienteId,
            pacienteNome,
            profissionalNome: formProfissional.trim(),
            dataAtendimento: dataYmd,
            horario: horaStr,
            areaServico: area,
            detalheServico: detalhe,
            identificadorOrigem: regNum,
            observacaoOrigem: `Gerado automaticamente pela evolução ${regNum}`,
          })
        } catch (errPres) {
          console.warn('Fallback de presença após evolução:', errPres)
        }
      }

      setModalOpen(false)
      resetForm()
      await carregarEvolucoes()
    } catch (err: any) {
      console.error('Erro salvando evolução:', err)
      toast({
        title: 'Erro ao processar evolução',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvolucao = async () => {
    if (!deleteConfirmId) return
    const alvo = evolucoes.find((e) => e.id === deleteConfirmId)
    if (alvo?.documento_fechado || alvo?.status === 'Finalizada') {
      toast({
        title: 'Exclusão Bloqueada',
        description: 'Documentos clínicos assinados e fechados não podem ser excluídos.',
        variant: 'destructive',
      })
      setDeleteConfirmId(null)
      return
    }

    try {
      setDeleting(true)
      await deleteEvolucao(deleteConfirmId)
      toast({
        title: 'Rascunho excluído',
        description: 'O registro de rascunho foi removido com sucesso.',
      })
      setDeleteConfirmId(null)
      await carregarEvolucoes()
    } catch (err: any) {
      console.error('Erro excluindo evolução:', err)
      toast({
        title: 'Erro ao excluir',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* Modal de confirmação ao tentar sair da rota com evolução suja */}
      <ModalAlertaSaida
        open={isBlocked}
        title="Evolução clínica não salva"
        description="Você possui dados preenchidos nesta sessão que ainda não foram gravados no servidor. Se sair agora, o que digitou poderá ser perdido. Deseja realmente sair desta tela?"
        confirmText="Sim, sair sem salvar"
        cancelText="Continuar editando"
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />

      {/* Modal de confirmação ao tentar fechar o modal de evolução com dados preenchidos */}
      <ModalAlertaSaida
        open={modalLeaveConfirmOpen}
        title="Descartar evolução em andamento?"
        description="Você possui anotações preenchidas nesta evolução. Se fechar a janela agora sem salvar, as alterações não salvas serão perdidas."
        confirmText="Sim, fechar sem salvar"
        cancelText="Continuar preenchendo"
        onConfirm={() => {
          setModalLeaveConfirmOpen(false)
          setModalOpen(false)
          resetForm()
        }}
        onCancel={() => setModalLeaveConfirmOpen(false)}
      />

      {/* Topo da Aba Evoluções */}
      <div className="bg-[#FAF5EE] rounded-3xl p-6 sm:p-7 border border-[#E9E1D2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFE3CF] text-[#8C6527] uppercase tracking-wider">
              Prontuário Eletrônico Padrão Brasileiro
            </span>
            <Badge variant="outline" className="border-[#C9A46A]/40 text-[#8C6527] text-xs">
              {evolucoes.length} {evolucoes.length === 1 ? 'sessão' : 'sessões'}
            </Badge>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#4A322A]">
            Evolução Clínica do Paciente (Sessões)
          </h2>
          <p className="text-xs text-[#73574A] max-w-xl">
            Acompanhe o dia a dia das sessões no modelo SOAP padronizado (Subjetivo, Objetivo,
            Avaliação, Plano) ou evolução rápida, com histórico cronológico unificado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenAlerta && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenAlerta('Reavaliar itens da evolução')}
              className="rounded-xl h-10 px-3.5 text-xs font-bold border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 flex items-center gap-1.5 shadow-2xs"
            >
              <Bell className="h-4 w-4 text-amber-600 fill-amber-500/20" />
              Lembrar Reavaliação
            </Button>
          )}

          <Button
            type="button"
            onClick={handleOpenNova}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-4 text-xs flex items-center gap-2 shadow-md border border-[#DFBF8E]/40"
          >
            <Plus className="h-4 w-4 text-[#33221C]" />
            Nova Evolução
          </Button>
        </div>
      </div>

      {/* Mini-Gráfico de Trajetória da Dor (EVA ao longo das sessões) */}
      {!loading && evolucoes.some((e) => typeof e.eva_dor === 'number') && (
        <TrajetoriaEvaGrafico evolucoes={evolucoes} className="print:hidden" />
      )}

      {/* Conteúdo da Timeline de Evoluções */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#C9A46A]" />
          <span className="text-xs text-gray-500 font-medium">
            Carregando histórico de sessões...
          </span>
        </div>
      ) : evolucoes.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-[#FAF5EE] border border-[#E9E1D2] text-[#8C6527] flex items-center justify-center mx-auto">
            <Activity className="h-8 w-8 text-[#8C6527]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-base text-gray-900">
              Nenhuma evolução clínica registrada ainda
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Registre a evolução das sessões de fisioterapia, treinos de personal, consultas
              nutricionais ou atendimentos médicos para manter a linha do tempo organizada.
            </p>
          </div>
          <Button
            onClick={handleOpenNova}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-5 text-xs shadow-sm border border-[#DFBF8E]/40"
          >
            <Plus className="h-4 w-4 mr-1 text-[#33221C]" /> Registrar Primeira Sessão
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline de cards */}
          <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#E9E1D2]">
            {evolucoes.map((evo, index) => {
              const espStyle =
                ESPECIALIDADE_COLORS[evo.especialidade] || ESPECIALIDADE_COLORS.Fisioterapia
              const isExpanded = expandedId === evo.id
              const isVinculadaEstaAvaliacao = evo.avaliacao_id === avaliacaoId

              return (
                <div key={evo.id} className="relative group">
                  {/* Dot da Timeline */}
                  <span
                    className="absolute -left-6 sm:-left-8 top-3 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: espStyle.hex }}
                  />

                  {/* Card da Evolução */}
                  <div
                    className={`bg-white rounded-2xl border transition-all shadow-xs ${
                      isExpanded
                        ? 'border-[#C9A46A]/60 shadow-md ring-1 ring-[#C9A46A]/20'
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Header do Card (clicável para expandir) */}
                    <div
                      onClick={() => toggleExpand(evo.id)}
                      className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${espStyle.badge}`}
                          >
                            {evo.especialidade}
                          </span>

                          {evo.documento_fechado || evo.status === 'Finalizada' ? (
                            <Badge className="bg-[#FAF5EE] text-[#8C6527] border-[#C9A46A]/50 text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                              <Lock className="h-3 w-3 text-[#8C6527]" />
                              Documento Fechado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold flex items-center gap-1">
                              <Edit2 className="h-2.5 w-2.5 text-amber-600" />
                              Rascunho Editável
                            </Badge>
                          )}

                          {evo.tipo_evolucao === 'Corretiva' && (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold flex items-center gap-1">
                              <RotateCcw className="h-2.5 w-2.5 text-purple-600" />
                              Evolução Corretiva
                            </Badge>
                          )}

                          {evo.numero_registro && (
                            <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/60">
                              {evo.numero_registro}
                            </span>
                          )}

                          {/* Badge de EVA da dor se houver */}
                          {typeof evo.eva_dor === 'number' && (
                            <EvaBadge valor={evo.eva_dor} tamanho="sm" />
                          )}

                          {isVinculadaEstaAvaliacao && (
                            <span className="text-[10px] font-semibold text-[#8C6527] bg-[#FAF5EE] border border-[#E9E1D2] px-2 py-0.5 rounded-full">
                              Deste Prontuário
                            </span>
                          )}

                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatDataPTBR(evo.data_evolucao || evo.created)}</span>
                            {evo.horario ? (
                              <span className="inline-flex items-center gap-0.5 text-[#8C6527] font-semibold ml-1">
                                <Clock className="h-3 w-3 text-[#C9A46A]" />
                                {formatHoraPTBR(evo.horario)}
                              </span>
                            ) : null}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 pt-0.5">
                          <span>
                            Profissional:{' '}
                            <strong className="text-gray-800">
                              {evo.assinado_por_nome || evo.profissional}
                            </strong>
                          </span>
                          {evo.assinado_em && (
                            <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              Assinado em {formatDataHoraPTBR(evo.assinado_em)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação do Header */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto"
                      >
                        {onOpenAlerta && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onOpenAlerta(
                                evo.conduta_procedimentos
                                  ? `Reavaliar conduta: ${evo.conduta_procedimentos.slice(0, 30)}`
                                  : 'Reavaliar evolução clínica',
                              )
                            }
                            className="h-8 px-2 text-[11px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg flex items-center gap-1"
                            title="Criar alerta de reavaliação a partir desta evolução"
                          >
                            <Bell className="h-3.5 w-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Alerta</span>
                          </Button>
                        )}

                        {/* Se estiver fechado: opção de Nova Evolução Corretiva */}
                        {evo.documento_fechado || evo.status === 'Finalizada' ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenNovaCorretiva(evo)}
                              className="h-8 px-2.5 text-[11px] font-semibold text-[#8C6527] border-[#C9A46A]/50 bg-[#FAF5EE] hover:bg-[#F3E7D3] rounded-lg flex items-center gap-1 shadow-2xs"
                              title="Registrar nova evolução retificando ou complementando esta sessão"
                            >
                              <RotateCcw className="h-3.5 w-3.5 text-[#8C6527]" />
                              <span>Evolução Corretiva</span>
                            </Button>

                            {/* Botão de status bloqueado explicativo */}
                            <div
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-[11px] cursor-not-allowed select-none"
                              title="Documento assinado e fechado — não pode ser alterado ou excluído (exigência de conformidade clínica)."
                            >
                              <Lock className="h-3 w-3 text-gray-400" />
                              <span className="hidden md:inline">Imutável</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(evo)}
                              className="h-8 px-2 text-[11px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(evo.id)}
                              className="h-8 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Excluir</span>
                            </Button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleExpand(evo.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Resumo quando recolhido */}
                    {!isExpanded && (
                      <div
                        onClick={() => toggleExpand(evo.id)}
                        className="px-4 sm:px-5 pb-4 cursor-pointer text-xs text-gray-600 line-clamp-2"
                      >
                        {evo.conduta_procedimentos ? (
                          <span className="font-medium text-gray-800">
                            Conduta: {evo.conduta_procedimentos}
                          </span>
                        ) : evo.avaliacao_clinica ? (
                          <span className="font-medium text-gray-800">
                            Análise: {evo.avaliacao_clinica}
                          </span>
                        ) : evo.texto_livre ? (
                          evo.texto_livre
                        ) : (
                          'Clique para ver o conteúdo completo desta sessão.'
                        )}
                      </div>
                    )}

                    {/* Conteúdo completo quando expandido */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 space-y-4 bg-gray-50/40 rounded-b-2xl border-t border-gray-100">
                        {/* Modelo SOAP em 4 blocos */}
                        {(evo.subjetivo ||
                          evo.objetivo ||
                          evo.avaliacao_clinica ||
                          evo.plano ||
                          typeof evo.eva_dor === 'number') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* S - Subjetivo com destaque de EVA */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="h-5 w-5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                    S
                                  </span>
                                  <span className="text-xs font-bold text-gray-900">
                                    Subjetivo (Relato do Paciente)
                                  </span>
                                </div>
                                {typeof evo.eva_dor === 'number' && (
                                  <EvaBadge valor={evo.eva_dor} tamanho="sm" />
                                )}
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {typeof evo.eva_dor === 'number' &&
                                  !evo.subjetivo?.includes('EVA') && (
                                    <span className="font-semibold text-[#8C6527] block mb-1">
                                      Nível de Dor: EVA {evo.eva_dor}/10
                                    </span>
                                  )}
                                {evo.subjetivo || '—'}
                              </p>
                            </div>

                            {/* O - Objetivo */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                  O
                                </span>
                                <span className="text-xs font-bold text-gray-900">
                                  Objetivo (Exame / Sinais / Medições)
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {evo.objetivo || '—'}
                              </p>
                            </div>

                            {/* A - Avaliação */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="h-5 w-5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                  A
                                </span>
                                <span className="text-xs font-bold text-gray-900">
                                  Avaliação / Análise Clínica
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {evo.avaliacao_clinica || '—'}
                              </p>
                            </div>

                            {/* P - Plano */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="h-5 w-5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                  P
                                </span>
                                <span className="text-xs font-bold text-gray-900">
                                  Plano Terapêutico / Próximos Passos
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {evo.plano || '—'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Conduta e Procedimentos Realizados */}
                        {evo.conduta_procedimentos && (
                          <div className="bg-white p-3.5 rounded-xl border border-[#E9E1D2] shadow-2xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6527] block mb-1">
                              Conduta / Procedimentos Realizados nesta Sessão:
                            </span>
                            <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {evo.conduta_procedimentos}
                            </p>
                          </div>
                        )}

                        {/* Texto livre se houver */}
                        {evo.texto_livre && (
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                              Anotações Gerais da Sessão:
                            </span>
                            <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {evo.texto_livre}
                            </p>
                          </div>
                        )}

                        {/* Bloco de Assinatura Digital e Selo de Documento Fechado (Padrão Visual SOUL Dourado/Marrom) */}
                        {evo.documento_fechado || evo.status === 'Finalizada' ? (
                          <div className="mt-4 pt-4 border-t-2 border-[#E9E1D2] bg-gradient-to-r from-[#FAF5EE] via-[#FDFBF7] to-[#FAF5EE] p-4 rounded-xl border border-[#E9E1D2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-[#EFE3CF] text-[#8C6527] flex items-center justify-center shrink-0">
                                  <ShieldCheck className="h-4 w-4 text-[#8C6527]" />
                                </span>
                                <div>
                                  <span className="text-xs font-serif font-bold text-[#4A322A] block leading-tight">
                                    Documento Clínico Assinado Digitalmente — Clínica SOUL
                                  </span>
                                  <span className="text-[10px] text-[#8C6527] font-semibold uppercase tracking-wider">
                                    Documento Fechado • Imutável • Válido para Prontuário
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-[#73574A] pl-8 space-y-0.5">
                                <p>
                                  <strong>Responsável Técnico:</strong>{' '}
                                  {evo.assinado_por_nome || evo.profissional} —{' '}
                                  <span className="text-[#8C6527]">
                                    {evo.assinado_por_especialidade || evo.especialidade}
                                  </span>
                                </p>
                                <p>
                                  <strong>Carimbo Temporal da Assinatura:</strong>{' '}
                                  {formatDataPTBR(evo.data_evolucao || evo.assinado_em)}
                                  {evo.horario ? ` às ${formatHoraPTBR(evo.horario)}` : ''}
                                </p>
                                {evo.numero_registro && (
                                  <p className="font-mono text-[10px] text-gray-500">
                                    Identificador Único: <strong>{evo.numero_registro}</strong>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end sm:items-end w-full sm:w-auto text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E9E1D2]">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE3CF]/80 border border-[#D4B278] text-[10px] font-bold text-[#4A322A] shadow-2xs">
                                <Lock className="h-3 w-3 text-[#8C6527]" />
                                <span>Autenticidade SOUL</span>
                              </div>
                              <span className="text-[9px] text-gray-400 mt-1 max-w-[200px] text-right">
                                Registro eletrônico inalterável com rastro de auditoria.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-amber-700 shrink-0" />
                              <span>
                                Esta sessão está salva como <strong>Rascunho</strong> e ainda não
                                possui assinatura digital válida.
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleOpenEdit(evo)}
                              className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0"
                            >
                              Assinar Agora
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL CRIAR / EDITAR EVOLUÇÃO */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (isModalDirty && !isSuccessfullySavedRef.current) {
              setModalLeaveConfirmOpen(true)
            } else {
              setModalOpen(false)
              resetForm()
            }
          } else {
            setModalOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 border border-[#E9E1D2] bg-white shadow-xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#8C6527] font-semibold">
              <Activity className="h-4 w-4" />
              <span>{editingId ? 'Editar Evolução Clínica' : 'Nova Sessão de Evolução'}</span>
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#4A322A]">
              {editingId ? 'Atualizar Registro Clínico' : 'Evolução de Prontuário'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {pacienteNome
                ? `Paciente: ${pacienteNome}`
                : 'Registre os achados e condutas desta sessão.'}
            </DialogDescription>
          </DialogHeader>

          {/* Banner de restauração de rascunho de evolução se encontrado */}
          {rascunhoEvolucaoEncontrado && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Rascunho não salvo de{' '}
                  <strong>{formatDataHoraPTBR(rascunhoEvolucaoEncontrado.meta.updatedAt)}</strong>{' '}
                  encontrado.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={descartarRascunhoEvolucao}
                  className="h-7 px-2.5 text-[11px] rounded-lg border-amber-200"
                >
                  Descartar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={restaurarRascunhoEvolucao}
                  className="h-7 px-3 text-[11px] font-bold rounded-lg bg-[#8C6527] text-white hover:bg-[#704F1D] flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Restaurar
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            {/* Metadados da Sessão */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] font-semibold text-gray-700">
                  Data e Hora da Sessão *
                </Label>
                <Input
                  type="datetime-local"
                  required
                  value={formData}
                  onChange={(e) => {
                    setIsModalDirty(true)
                    setFormData(e.target.value)
                    if (e.target.value && e.target.value.includes('T')) {
                      setFormHorario(e.target.value.split('T')[1].substring(0, 5))
                    }
                  }}
                  className="h-9 rounded-xl border-gray-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#8C6527]" />
                  <span>Horário (HH:mm)</span>
                </Label>
                <Input
                  type="time"
                  value={formHorario}
                  onChange={(e) => {
                    setIsModalDirty(true)
                    setFormHorario(e.target.value)
                    if (formData.includes('T')) {
                      const dataPart = formData.split('T')[0]
                      setFormData(`${dataPart}T${e.target.value}`)
                    }
                  }}
                  className="h-9 rounded-xl border-gray-200 text-xs"
                  placeholder="14:30"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-700">Especialidade *</Label>
                <Select
                  value={formEspecialidade}
                  onValueChange={(val) => setFormEspecialidade(val as Especialidade)}
                >
                  <SelectTrigger className="h-9 rounded-xl border-gray-200 text-xs">
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

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-700">Status *</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as StatusEvolucao)}
                >
                  <SelectTrigger className="h-9 rounded-xl border-gray-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Finalizada">Finalizada</SelectItem>
                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">
                Profissional Responsável *
              </Label>
              <Input
                required
                value={formProfissional}
                onChange={(e) => {
                  setIsModalDirty(true)
                  setFormProfissional(e.target.value)
                }}
                placeholder="Ex: Dr. Roberto / Fisio Beatriz / Coach Lucas"
                className="h-9 rounded-xl border-gray-200 text-xs"
              />
            </div>

            {/* Régua de EVA de Dor (0 a 10) no padrão SOUL */}
            <div className="pt-1">
              <ReguaEva
                value={evaDor}
                onChange={(val) => {
                  setIsModalDirty(true)
                  setEvaDor(val)
                }}
                referenciaAnterior={referenciaUltimaEva}
              />
            </div>

            {/* Alternador de Formato: SOAP vs Evolução Rápida */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-800">Formato da Evolução:</span>
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormTipo('soap')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    formTipo === 'soap'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Modelo SOAP (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => setFormTipo('rapida')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    formTipo === 'rapida'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Evolução Rápida (Texto Único)
                </button>
              </div>
            </div>

            {/* MODO 1: MODELO SOAP PADRÃO DE MERCADO */}
            {formTipo === 'soap' && (
              <div className="space-y-3.5">
                {/* S - Subjetivo */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">
                        S
                      </span>
                      Subjetivo
                    </Label>
                    <span className="text-[10px] text-gray-400">
                      Como o paciente relata estar se sentindo, nível de dor (EVA), queixas
                    </span>
                  </div>
                  <Textarea
                    rows={2}
                    value={subjetivo}
                    onChange={(e) => {
                      setIsModalDirty(true)
                      setSubjetivo(e.target.value)
                    }}
                    placeholder={
                      typeof evaDor === 'number'
                        ? `[EVA ${evaDor}/10 selecionada na régua acima] Ex: Paciente relata melhora das dores ao acordar...`
                        : 'Ex: Paciente relata diminuição da dor no ombro direito. Conseguiu dormir sem analgésico...'
                    }
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                {/* O - Objetivo */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                        O
                      </span>
                      Objetivo
                    </Label>
                    <span className="text-[10px] text-gray-400">
                      Dados mensuráveis: testes físicos, ADM, força, palpação, edema
                    </span>
                  </div>
                  <Textarea
                    rows={2}
                    value={objetivo}
                    onChange={(e) => {
                      setIsModalDirty(true)
                      setObjetivo(e.target.value)
                    }}
                    placeholder="Ex: Flexão de ombro atingiu 150° (ganho de 15°). Teste de Neer negativo hoje. Dinamometria: 22 kgf..."
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                {/* A - Avaliação */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                        A
                      </span>
                      Avaliação / Análise Clínica
                    </Label>
                    <span className="text-[10px] text-gray-400">
                      Raciocínio clínico do profissional sobre a resposta ao tratamento
                    </span>
                  </div>
                  <Textarea
                    rows={2}
                    value={avaliacaoClinica}
                    onChange={(e) => {
                      setIsModalDirty(true)
                      setAvaliacaoClinica(e.target.value)
                    }}
                    placeholder="Ex: Boa evolução do arco de movimento sem compensação escapular. Resposta favorável à terapia manual..."
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                {/* P - Plano */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded bg-purple-100 text-purple-800 font-bold text-[10px] flex items-center justify-center">
                        P
                      </span>
                      Plano
                    </Label>
                    <span className="text-[10px] text-gray-400">
                      Metas para a próxima sessão, orientações domiciliares, reavaliações
                    </span>
                  </div>
                  <Textarea
                    rows={2}
                    value={plano}
                    onChange={(e) => {
                      setIsModalDirty(true)
                      setPlano(e.target.value)
                    }}
                    placeholder="Ex: Iniciar fortalecimento excêntrico com elástico amarelo na próxima sessão. Manter gelo pós-treino..."
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                  />
                </div>

                {/* Conduta e Procedimentos */}
                <div className="space-y-1 pt-1">
                  <Label className="text-xs font-bold text-[#8C6527] flex items-center justify-between">
                    <span>Conduta / Procedimentos Realizados nesta Sessão</span>
                    <span className="text-[10px] font-normal text-gray-400">
                      Exercícios, técnicas manuais, eletroterapia, carga utilizada
                    </span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={condutaProcedimentos}
                    onChange={(e) => {
                      setIsModalDirty(true)
                      setCondutaProcedimentos(e.target.value)
                    }}
                    placeholder="Ex: Terapia manual glenoumeral grau III (10 min) + Fortalecimento manguito com theraband verde 3x12 + Crioterapia..."
                    className="rounded-xl border-[#E9E1D2] text-xs sm:text-sm focus-visible:ring-[#C9A46A]"
                  />
                </div>
              </div>
            )}

            {/* MODO 2: EVOLUÇÃO RÁPIDA (TEXTO ÚNICO) */}
            {formTipo === 'rapida' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">
                  Texto da Evolução Clínica *
                </Label>
                <Textarea
                  rows={7}
                  value={textoLivre}
                  onChange={(e) => {
                    setIsModalDirty(true)
                    setTextoLivre(e.target.value)
                  }}
                  placeholder="Descreva o atendimento completo: relato do paciente, condutas realizadas na sessão, resposta fisiológica e orientações..."
                  className="rounded-xl border-gray-200 text-xs sm:text-sm"
                />
              </div>
            )}

            {/* Aviso explicativo sobre documento fechado */}
            <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] text-xs text-[#73574A] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#4A322A]">
                <ShieldCheck className="h-4 w-4 text-[#8C6527]" />
                <span>Política de Documento Clínico Fechado (Clínica SOUL)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Ao optar por <strong>"Salvar e Assinar"</strong>, a evolução recebe imediatamente o
                selo de assinatura digital com o nome do profissional, especialidade, carimbo
                temporal oficial do servidor e código de registro único. O documento torna-se
                imutável no banco de dados. Se precisar de ajustes futuros, utilize a emissão de uma{' '}
                <em>Nova Evolução Corretiva</em>.
              </p>
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100 flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (isModalDirty && !isSuccessfullySavedRef.current) {
                    setModalLeaveConfirmOpen(true)
                  } else {
                    setModalOpen(false)
                    resetForm()
                  }
                }}
                className="rounded-xl h-10 text-xs text-gray-500 hover:text-gray-800"
              >
                Cancelar
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Opção 1: Salvar apenas como Rascunho */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={(e) => {
                    setFormStatus('Rascunho')
                    // Força o submit
                    setTimeout(() => {
                      const form = (e.target as HTMLElement).closest('form')
                      if (form) form.requestSubmit()
                    }, 50)
                  }}
                  className="rounded-xl h-10 text-xs border-amber-300 text-amber-800 bg-amber-50/60 hover:bg-amber-100/70"
                >
                  Salvar como Rascunho
                </Button>

                {/* Opção 2: Padrão Principal "Salvar e Assinar" */}
                <Button
                  type="submit"
                  disabled={saving}
                  onClick={() => setFormStatus('Finalizada')}
                  className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-5 text-xs shadow-md border border-[#DFBF8E]/40 flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-[#33221C]" />
                      <span>Salvar e Assinar (Documento Fechado)</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900">
              Excluir esta evolução clínica?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
              Esta ação removerá este registro de sessão do prontuário. Esta operação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvolucao}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
            >
              {deleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
