import { useState, useEffect } from 'react'
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
import type { EvolucaoRecord, Especialidade, StatusEvolucao } from '@/types/database'
import { ESPECIALIDADE_COLORS, formatDataPTBR, formatDataHoraPTBR } from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

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
  const [formData, setFormData] = useState(new Date().toISOString().substring(0, 16))
  const [formProfissional, setFormProfissional] = useState(profissionalPadrao || 'SOUL Clínica')
  const [formStatus, setFormStatus] = useState<StatusEvolucao>('Finalizada')

  // SOAP fields
  const [subjetivo, setSubjetivo] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [avaliacaoClinica, setAvaliacaoClinica] = useState('')
  const [plano, setPlano] = useState('')
  const [condutaProcedimentos, setCondutaProcedimentos] = useState('')

  // Evolução rápida
  const [textoLivre, setTextoLivre] = useState('')

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

  const resetForm = () => {
    setEditingId(null)
    setFormTipo('soap')
    setFormEspecialidade(especialidade)
    setFormData(new Date().toISOString().substring(0, 16))
    setFormProfissional(profissionalPadrao || 'SOUL Clínica')
    setFormStatus('Finalizada')
    setSubjetivo('')
    setObjetivo('')
    setAvaliacaoClinica('')
    setPlano('')
    setCondutaProcedimentos('')
    setTextoLivre('')
  }

  const handleOpenNova = () => {
    resetForm()
    setModalOpen(true)
  }

  const handleOpenEdit = (evo: EvolucaoRecord) => {
    setEditingId(evo.id)
    setFormEspecialidade(evo.especialidade)
    setFormData(
      evo.data_evolucao
        ? new Date(evo.data_evolucao).toISOString().substring(0, 16)
        : new Date().toISOString().substring(0, 16),
    )
    setFormProfissional(evo.profissional || profissionalPadrao || 'SOUL Clínica')
    setFormStatus(evo.status || 'Finalizada')

    setSubjetivo(evo.subjetivo || '')
    setObjetivo(evo.objetivo || '')
    setAvaliacaoClinica(evo.avaliacao_clinica || '')
    setPlano(evo.plano || '')
    setCondutaProcedimentos(evo.conduta_procedimentos || '')
    setTextoLivre(evo.texto_livre || '')

    if (evo.texto_livre && !evo.subjetivo && !evo.objetivo && !evo.avaliacao_clinica) {
      setFormTipo('rapida')
    } else {
      setFormTipo('soap')
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
      const dataHoraIso = new Date(formData).toISOString()

      const payload: Partial<EvolucaoRecord> = {
        paciente_id: pacienteId,
        avaliacao_id: avaliacaoId,
        especialidade: formEspecialidade,
        data_evolucao: dataHoraIso,
        profissional: formProfissional.trim(),
        subjetivo: subjetivo.trim() || undefined,
        objetivo: objetivo.trim() || undefined,
        avaliacao_clinica: avaliacaoClinica.trim() || undefined,
        plano: plano.trim() || undefined,
        conduta_procedimentos: condutaProcedimentos.trim() || undefined,
        texto_livre: textoLivre.trim() || undefined,
        status: formStatus,
      }

      if (editingId) {
        await updateEvolucao(editingId, payload)
        toast({
          title: 'Evolução atualizada',
          description: 'A sessão de evolução clínica foi atualizada.',
        })
      } else {
        await createEvolucao(payload, { addToTimeline: formStatus === 'Finalizada' })
        toast({
          title: 'Evolução registrada!',
          description: 'A nova sessão foi adicionada ao prontuário.',
        })
      }

      setModalOpen(false)
      resetForm()
      await carregarEvolucoes()
    } catch (err: any) {
      console.error('Erro salvando evolução:', err)
      toast({
        title: 'Erro ao salvar evolução',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvolucao = async () => {
    if (!deleteConfirmId) return
    try {
      setDeleting(true)
      await deleteEvolucao(deleteConfirmId)
      toast({
        title: 'Evolução excluída',
        description: 'O registro foi removido com sucesso.',
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

                          <Badge
                            className={
                              evo.status === 'Finalizada'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]'
                                : 'bg-amber-50 text-amber-800 border-amber-200 text-[10px]'
                            }
                          >
                            {evo.status || 'Finalizada'}
                          </Badge>

                          {isVinculadaEstaAvaliacao && (
                            <span className="text-[10px] font-semibold text-[#8C6527] bg-[#FAF5EE] border border-[#E9E1D2] px-2 py-0.5 rounded-full">
                              Deste Prontuário
                            </span>
                          )}

                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDataHoraPTBR(evo.data_evolucao || evo.created)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-0.5">
                          <span>
                            Profissional:{' '}
                            <strong className="text-gray-800">{evo.profissional}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação do Header */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 self-end sm:self-auto"
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
                        {(evo.subjetivo || evo.objetivo || evo.avaliacao_clinica || evo.plano) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* S - Subjetivo */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="h-5 w-5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                                  S
                                </span>
                                <span className="text-xs font-bold text-gray-900">
                                  Subjetivo (Relato do Paciente)
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
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
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
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

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            {/* Metadados da Sessão */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-700">Data e Hora *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  className="h-9 rounded-xl border-gray-200 text-xs"
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
                onChange={(e) => setFormProfissional(e.target.value)}
                placeholder="Ex: Dr. Roberto / Fisio Beatriz / Coach Lucas"
                className="h-9 rounded-xl border-gray-200 text-xs"
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
                    onChange={(e) => setSubjetivo(e.target.value)}
                    placeholder="Ex: Paciente relata diminuição da dor no ombro direito (EVA 3/10). Conseguiu dormir sem analgésico..."
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
                    onChange={(e) => setObjetivo(e.target.value)}
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
                    onChange={(e) => setAvaliacaoClinica(e.target.value)}
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
                    onChange={(e) => setPlano(e.target.value)}
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
                    onChange={(e) => setCondutaProcedimentos(e.target.value)}
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
                  onChange={(e) => setTextoLivre(e.target.value)}
                  placeholder="Descreva o atendimento completo: relato do paciente, condutas realizadas na sessão, resposta fisiológica e orientações..."
                  className="rounded-xl border-gray-200 text-xs sm:text-sm"
                />
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-gray-100 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-xl h-10 text-xs border-gray-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-5 text-xs shadow-md border border-[#DFBF8E]/40"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {editingId ? 'Salvar Alterações' : 'Concluir Evolução'}
                  </>
                )}
              </Button>
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
