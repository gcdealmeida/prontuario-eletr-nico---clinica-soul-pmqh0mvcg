import React, { useState, useEffect, useMemo } from 'react'
import {
  CalendarCheck2,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  Stethoscope,
  Calendar,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import { LogoSOUL } from '@/components/LogoSOUL'
import { getAllPacientes } from '@/services/pacientes'
import { getAllUsers } from '@/services/acessos'
import {
  getAllPresencas,
  createPresenca,
  updatePresenca,
  deletePresenca,
  type PresencasFilter,
  type PresencaPayload,
} from '@/services/presencas'
import type { PresencaRecord, PacienteRecord, UserRecord, StatusPresenca } from '@/types/database'
import { formatDataPTBR } from '@/lib/constants'

// Opções padrão de áreas/serviços SOUL
const SERVICOS_SUGERIDOS = [
  'Fisioterapia',
  'Personal',
  'Nutrição',
  'Médico',
  'Pilates',
  'Reabilitação',
  'Liberação Miofascial',
  'Avaliação Física',
  'Retorno / Consulta',
]

const STATUS_OPCOES: StatusPresenca[] = ['Presente', 'Confirmado', 'Justificado', 'Cancelado']

export default function Presencas() {
  const { user, isAdmin } = useAuth()

  // Dados carregados
  const [presencas, setPresencas] = useState<PresencaRecord[]>([])
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [profissionais, setProfissionais] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [selectedPacienteId, setSelectedPacienteId] = useState('Todos')
  const [selectedProfissionalId, setSelectedProfissionalId] = useState('Todos')
  const [selectedArea, setSelectedArea] = useState('Todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Visualização e agrupamento
  const [viewMode, setViewMode] = useState<'lista' | 'profissionais' | 'pacientes'>('lista')

  // Modais
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPresenca, setEditingPresenca] = useState<PresencaRecord | null>(null)
  const [saving, setSaving] = useState(false)

  // Modal Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<PresencaRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form de Lançamento / Edição
  const [formPacienteId, setFormPacienteId] = useState('')
  const [formPacienteBusca, setFormPacienteBusca] = useState('')
  const [formDataAtendimento, setFormDataAtendimento] = useState(
    () => new Date().toISOString().split('T')[0],
  )
  const [formAreaServico, setFormAreaServico] = useState('Fisioterapia')
  const [formAreaPersonalizada, setFormAreaPersonalizada] = useState('')
  const [formDetalheServico, setFormDetalheServico] = useState('')
  const [formProfissionalId, setFormProfissionalId] = useState('')
  const [formStatus, setFormStatus] = useState<StatusPresenca>('Presente')
  const [formObservacoes, setFormObservacoes] = useState('')

  // Carregar dados iniciais
  const carregarDados = async () => {
    try {
      setLoading(true)
      const [pacs, usersList, presList] = await Promise.all([
        getAllPacientes(),
        isAdmin ? getAllUsers() : Promise.resolve([]),
        getAllPresencas({}),
      ])
      setPacientes(pacs)
      setProfissionais(usersList.filter((u) => u.access_status === 'approved'))
      setPresencas(presList)
    } catch (err) {
      console.error('Erro ao carregar dados de presença:', err)
      toast({
        title: 'Erro ao carregar lançamentos',
        description: 'Não foi possível carregar as presenças.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [isAdmin])

  // Inscrição em tempo real na coleção de presenças
  useRealtime('presencas', () => {
    carregarDados()
  })

  // Lista filtrada no frontend para resposta instantânea
  const presencasFiltradas = useMemo(() => {
    return presencas.filter((item) => {
      // Escopo de visualização (garantia dupla frontend + backend)
      if (!isAdmin && user?.id && item.profissional_id && item.profissional_id !== user.id) {
        return false
      }

      // Filtro de data inicial
      if (dataInicio) {
        const itemDate = item.data_atendimento ? item.data_atendimento.split(' ')[0] : ''
        if (itemDate < dataInicio) return false
      }

      // Filtro de data final
      if (dataFim) {
        const itemDate = item.data_atendimento ? item.data_atendimento.split(' ')[0] : ''
        if (itemDate > dataFim) return false
      }

      // Filtro de Paciente
      if (selectedPacienteId !== 'Todos' && item.paciente_id !== selectedPacienteId) {
        return false
      }

      // Filtro de Profissional (apenas admin ou seleção)
      if (selectedProfissionalId !== 'Todos' && item.profissional_id !== selectedProfissionalId) {
        return false
      }

      // Filtro de Área / Serviço
      if (selectedArea !== 'Todos') {
        const areaNormalizada = (item.area_servico || '').toLowerCase()
        if (!areaNormalizada.includes(selectedArea.toLowerCase())) {
          return false
        }
      }

      // Filtro de Status
      if (selectedStatus !== 'Todos') {
        if (item.status !== selectedStatus) return false
      }

      // Busca textual livre
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const pacNome = (item.paciente_nome || item.expand?.paciente_id?.nome || '').toLowerCase()
        const profNome = (
          item.profissional_nome ||
          item.expand?.profissional_id?.name ||
          ''
        ).toLowerCase()
        const area = (item.area_servico || '').toLowerCase()
        const detalhe = (item.detalhe_servico || '').toLowerCase()
        const obs = (item.observacoes || '').toLowerCase()

        if (
          !pacNome.includes(q) &&
          !profNome.includes(q) &&
          !area.includes(q) &&
          !detalhe.includes(q) &&
          !obs.includes(q)
        ) {
          return false
        }
      }

      return true
    })
  }, [
    presencas,
    isAdmin,
    user?.id,
    dataInicio,
    dataFim,
    selectedPacienteId,
    selectedProfissionalId,
    selectedArea,
    selectedStatus,
    searchTerm,
  ])

  // Contagens e Agrupamento por Profissional
  const agrupamentoPorProfissional = useMemo(() => {
    const map = new Map<string, { nome: string; count: number; itens: PresencaRecord[] }>()

    presencasFiltradas.forEach((p) => {
      const id = p.profissional_id || 'sem_prof'
      const nome =
        p.profissional_nome ||
        p.expand?.profissional_id?.name ||
        p.expand?.profissional_id?.email ||
        'Profissional SOUL'

      if (!map.has(id)) {
        map.set(id, { nome, count: 0, itens: [] })
      }
      const entry = map.get(id)!
      entry.count += 1
      entry.itens.push(p)
    })

    return Array.from(map.entries())
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.count - a.count)
  }, [presencasFiltradas])

  // Contagens e Agrupamento por Paciente
  const agrupamentoPorPaciente = useMemo(() => {
    const map = new Map<string, { nome: string; count: number; itens: PresencaRecord[] }>()

    presencasFiltradas.forEach((p) => {
      const id = p.paciente_id || 'sem_pac'
      const nome = p.paciente_nome || p.expand?.paciente_id?.nome || 'Paciente SOUL'

      if (!map.has(id)) {
        map.set(id, { nome, count: 0, itens: [] })
      }
      const entry = map.get(id)!
      entry.count += 1
      entry.itens.push(p)
    })

    return Array.from(map.entries())
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.count - a.count)
  }, [presencasFiltradas])

  // Reset de filtros
  const handleResetFilters = () => {
    setDataInicio('')
    setDataFim('')
    setSelectedPacienteId('Todos')
    setSelectedProfissionalId('Todos')
    setSelectedArea('Todos')
    setSelectedStatus('Todos')
    setSearchTerm('')
  }

  // Abertura do Modal de Novo Lançamento
  const handleOpenNewModal = () => {
    setEditingPresenca(null)
    setFormPacienteId('')
    setFormPacienteBusca('')
    setFormDataAtendimento(new Date().toISOString().split('T')[0])
    setFormAreaServico('Fisioterapia')
    setFormAreaPersonalizada('')
    setFormDetalheServico('')
    // Profissional padrão: o próprio usuário logado
    setFormProfissionalId(user?.id || '')
    setFormStatus('Presente')
    setFormObservacoes('')
    setModalOpen(true)
  }

  // Abertura do Modal de Edição
  const handleOpenEditModal = (item: PresencaRecord) => {
    // Permissão: admin pode tudo; profissional só pode os seus
    if (!isAdmin && item.profissional_id && item.profissional_id !== user?.id) {
      toast({
        title: 'Acesso restrito',
        description: 'Você só pode editar lançamentos realizados por você mesmo.',
        variant: 'destructive',
      })
      return
    }

    setEditingPresenca(item)
    setFormPacienteId(item.paciente_id)
    const pacNome = item.paciente_nome || item.expand?.paciente_id?.nome || ''
    setFormPacienteBusca(pacNome)
    setFormDataAtendimento(
      item.data_atendimento
        ? item.data_atendimento.split(' ')[0]
        : new Date().toISOString().split('T')[0],
    )

    if (SERVICOS_SUGERIDOS.includes(item.area_servico)) {
      setFormAreaServico(item.area_servico)
      setFormAreaPersonalizada('')
    } else {
      setFormAreaServico('Outro')
      setFormAreaPersonalizada(item.area_servico)
    }

    setFormDetalheServico(item.detalhe_servico || '')
    setFormProfissionalId(item.profissional_id || user?.id || '')
    setFormStatus(item.status || 'Presente')
    setFormObservacoes(item.observacoes || '')
    setModalOpen(true)
  }

  // Salvar Lançamento (Criar ou Editar)
  const handleSavePresenca = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formPacienteId) {
      toast({
        title: 'Paciente obrigatório',
        description: 'Selecione um paciente para registrar o atendimento.',
        variant: 'destructive',
      })
      return
    }

    if (!formDataAtendimento) {
      toast({
        title: 'Data obrigatória',
        description: 'Informe a data do atendimento.',
        variant: 'destructive',
      })
      return
    }

    const areaFinal =
      formAreaServico === 'Outro' ? formAreaPersonalizada.trim() || 'Outro' : formAreaServico

    if (!areaFinal) {
      toast({
        title: 'Área / Serviço obrigatório',
        description: 'Informe a área ou serviço realizado.',
        variant: 'destructive',
      })
      return
    }

    // Validação de profissional
    const profIdFinal = isAdmin && formProfissionalId ? formProfissionalId : user?.id || ''
    if (!profIdFinal) {
      toast({
        title: 'Profissional não identificado',
        description: 'Não foi possível identificar o profissional responsável.',
        variant: 'destructive',
      })
      return
    }

    // Obter nomes denormalizados para buscas rápidas e relatórios limpos
    const pacienteObj = pacientes.find((p) => p.id === formPacienteId)
    const pacNomeFinal = pacienteObj?.nome || formPacienteBusca || 'Paciente'

    let profNomeFinal = user?.name || user?.email || 'Profissional SOUL'
    if (isAdmin && profIdFinal !== user?.id) {
      const pObj = profissionais.find((u) => u.id === profIdFinal)
      if (pObj) {
        profNomeFinal = pObj.name || pObj.email || 'Profissional SOUL'
      }
    }

    const payload: PresencaPayload = {
      paciente_id: formPacienteId,
      paciente_nome: pacNomeFinal,
      profissional_id: profIdFinal,
      profissional_nome: profNomeFinal,
      data_atendimento: `${formDataAtendimento} 12:00:00`,
      area_servico: areaFinal,
      detalhe_servico: formDetalheServico.trim() || undefined,
      observacoes: formObservacoes.trim() || undefined,
      status: formStatus,
    }

    try {
      setSaving(true)
      if (editingPresenca) {
        await updatePresenca(editingPresenca.id, payload)
        toast({
          title: 'Lançamento atualizado!',
          description: `Presença de ${pacNomeFinal} em ${areaFinal} editada com sucesso.`,
        })
      } else {
        await createPresenca(payload)
        toast({
          title: 'Presença confirmada!',
          description: `Atendimento de ${pacNomeFinal} em ${areaFinal} registrado com sucesso.`,
        })
      }
      setModalOpen(false)
      carregarDados()
    } catch (err: any) {
      console.error('Erro ao salvar presença:', err)
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Verifique as permissões ou os campos preenchidos.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Exclusão de Presença
  const handleRequestDelete = (item: PresencaRecord) => {
    if (!isAdmin && item.profissional_id && item.profissional_id !== user?.id) {
      toast({
        title: 'Acesso restrito',
        description: 'Você só pode excluir lançamentos realizados por você mesmo.',
        variant: 'destructive',
      })
      return
    }
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      setDeleting(true)
      await deletePresenca(itemToDelete.id)
      toast({
        title: 'Lançamento excluído',
        description: 'O registro de presença foi removido e a ação registrada na auditoria.',
      })
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
      carregarDados()
    } catch (err: any) {
      console.error('Erro ao excluir presença:', err)
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível excluir o lançamento.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Exportar XLSX externo via SheetJS
  const handleExportXLSX = () => {
    try {
      if (presencasFiltradas.length === 0) {
        toast({
          title: 'Sem lançamentos',
          description: 'Nenhum atendimento encontrado para os filtros selecionados.',
          variant: 'destructive',
        })
        return
      }

      // Preparar linhas da planilha
      const rows = presencasFiltradas.map((item, index) => {
        const rawDate = item.data_atendimento ? item.data_atendimento.split(' ')[0] : ''
        const dataFmt = rawDate ? formatDataPTBR(rawDate) : ''
        const pacNome = item.paciente_nome || item.expand?.paciente_id?.nome || 'Paciente'
        const profNome =
          item.profissional_nome ||
          item.expand?.profissional_id?.name ||
          item.expand?.profissional_id?.email ||
          'Profissional'

        return {
          Nº: index + 1,
          Data: dataFmt,
          Paciente: pacNome,
          'Área / Especialidade': item.area_servico || '',
          'Detalhe do Serviço': item.detalhe_servico || '',
          Status: item.status || 'Presente',
          'Profissional Responsável': profNome,
          Observações: item.observacoes || '',
          'Registrado Em': item.created ? formatDataPTBR(item.created.split(' ')[0]) : '',
        }
      })

      // Gerar planilha e workbook
      const worksheet = XLSX.utils.json_to_sheet(rows)

      // Ajuste de largura das colunas
      worksheet['!cols'] = [
        { wch: 5 }, // Nº
        { wch: 12 }, // Data
        { wch: 32 }, // Paciente
        { wch: 22 }, // Área
        { wch: 26 }, // Detalhe
        { wch: 14 }, // Status
        { wch: 26 }, // Profissional
        { wch: 30 }, // Observações
        { wch: 14 }, // Registrado
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Presenças e Confirmações')

      // Nome sugestivo com o mês atual ou período do filtro
      const agora = new Date()
      const ano = agora.getFullYear()
      const mes = String(agora.getMonth() + 1).padStart(2, '0')
      let fileName = `presencas_${ano}-${mes}.xlsx`

      if (dataInicio && dataFim) {
        fileName = `presencas_${dataInicio}_a_${dataFim}.xlsx`
      } else if (dataInicio) {
        fileName = `presencas_a_partir_de_${dataInicio}.xlsx`
      }

      XLSX.writeFile(workbook, fileName)

      toast({
        title: 'Planilha exportada com sucesso!',
        description: `Arquivo ${fileName} gerado com ${presencasFiltradas.length} lançamento(s).`,
      })
    } catch (err: any) {
      console.error('Erro ao exportar XLSX:', err)
      toast({
        title: 'Erro ao gerar arquivo Excel',
        description: err?.message || 'Falha ao converter dados para XLSX.',
        variant: 'destructive',
      })
    }
  }

  // Imprimir Relatório Limpo com Cabeçalho da Clínica
  const handlePrint = () => {
    window.print()
  }

  // Pacientes filtrados para o campo autocomplete no modal
  const pacientesFiltradosModal = useMemo(() => {
    if (!formPacienteBusca.trim()) return pacientes.slice(0, 8)
    const q = formPacienteBusca.toLowerCase().trim()
    return pacientes
      .filter((p) => p.nome.toLowerCase().includes(q) || (p.cpf && p.cpf.includes(q)))
      .slice(0, 8)
  }, [pacientes, formPacienteBusca])

  return (
    <div className="space-y-6 pb-12 print:m-0 print:p-0">
      {/* ============================================================== */}
      {/* CABEÇALHO OFICIAL EXCLUSIVO PARA IMPRESSÃO / PDF */}
      {/* ============================================================== */}
      <div className="hidden print:flex flex-col items-center justify-center pb-4 mb-4 border-b-2 border-[#E9E1D2] text-center gap-2 overflow-visible">
        <LogoSOUL variant="full" size="sm" theme="light" className="shrink-0 mx-auto" />
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xs uppercase tracking-[0.2em] text-[#8C6527] font-bold">
            Relatório de Presenças e Confirmações de Atendimentos
          </span>
          <span className="text-[#D4B278]">•</span>
          <span className="text-xs text-[#73574A]">Clínica SOUL</span>
        </div>
        <div className="text-[11px] text-gray-600 flex flex-wrap items-center justify-center gap-3 pt-1">
          <span>
            <strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {dataInicio && (
            <span>
              <strong>De:</strong> {formatDataPTBR(dataInicio)}
            </span>
          )}
          {dataFim && (
            <span>
              <strong>Até:</strong> {formatDataPTBR(dataFim)}
            </span>
          )}
          {selectedArea !== 'Todos' && (
            <span>
              <strong>Serviço:</strong> {selectedArea}
            </span>
          )}
          {selectedProfissionalId !== 'Todos' && (
            <span>
              <strong>Profissional:</strong>{' '}
              {profissionais.find((p) => p.id === selectedProfissionalId)?.name || 'Selecionado'}
            </span>
          )}
          <span>
            <strong>Total no relatório:</strong> {presencasFiltradas.length} atendimento(s)
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HEADER PRINCIPAL NA TELA (Oculto na impressão) */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-1">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            <span>Processo de Atendimentos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#4A322A]">
            Presença / Confirmação
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Registro e conferência de atendimentos realizados, filtros combinados, exportação XLSX e
            relatórios de presença.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleExportXLSX}
            variant="outline"
            className="border-[#D4B278] text-[#5C4033] hover:bg-[#FAF4EA] rounded-xl h-10 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs"
            title="Exportar dados filtrados para pasta de trabalho Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#8C6527]" />
            <span>Exportar Excel (.xlsx)</span>
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-[#E9E1D2] hover:bg-white text-[#4A322A] rounded-xl h-10 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs"
            title="Visualizar tela de impressão / gerar PDF limpo"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / PDF</span>
          </Button>

          <Button
            onClick={handleOpenNewModal}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-4 text-xs sm:text-sm flex items-center gap-2 shadow-md border border-[#DFBF8E]/50 transition-transform active:scale-98"
          >
            <Plus className="h-4 w-4 text-[#33221C]" />
            <span>Lançar Presença</span>
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CARDS DE RESUMO E CONTADORES */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Total Filtrado */}
        <div className="bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50 flex items-center justify-center shrink-0">
            <CalendarCheck2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Total no Filtro
            </p>
            <p className="text-2xl font-serif font-bold text-[#4A322A]">
              {presencasFiltradas.length}
            </p>
            <p className="text-[11px] text-[#8C6527] truncate">
              {presencasFiltradas.length === 1
                ? '1 atendimento registrado'
                : 'atendimentos localizados'}
            </p>
          </div>
        </div>

        {/* Presentes / Confirmados */}
        <div className="bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Confirmados / Presentes
            </p>
            <p className="text-2xl font-serif font-bold text-emerald-800">
              {
                presencasFiltradas.filter(
                  (p) => !p.status || p.status === 'Presente' || p.status === 'Confirmado',
                ).length
              }
            </p>
            <p className="text-[11px] text-emerald-600 truncate">Atendimentos efetivados</p>
          </div>
        </div>

        {/* Pacientes Atendidos */}
        <div className="bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-[#FDF2EE] text-[#B87355] border border-[#E7BFB0] flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Pacientes Únicos
            </p>
            <p className="text-2xl font-serif font-bold text-[#B87355]">
              {agrupamentoPorPaciente.length}
            </p>
            <p className="text-[11px] text-gray-500 truncate">Pessoas atendidas no período</p>
          </div>
        </div>

        {/* Profissionais Envolvidos */}
        <div className="bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-[#F0F5FA] text-[#3B82F6] border border-[#BFDBFE] flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Profissionais
            </p>
            <p className="text-2xl font-serif font-bold text-[#3B82F6]">
              {agrupamentoPorProfissional.length}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {isAdmin ? 'Equipe no filtro' : 'Lançamentos próprios'}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BARRA DE FILTROS COMBINÁVEIS */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-5 border border-[#E9E1D2] shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E9E1D2]/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#8C6527]" />
            <h3 className="font-serif font-bold text-sm text-[#4A322A]">Filtros de Presença</h3>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-[#73574A]">
              Combinar período, paciente, profissional e serviço
            </span>
          </div>

          {(dataInicio ||
            dataFim ||
            selectedPacienteId !== 'Todos' ||
            selectedProfissionalId !== 'Todos' ||
            selectedArea !== 'Todos' ||
            selectedStatus !== 'Todos' ||
            searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-[#8C6527] hover:text-[#5C4033] hover:bg-[#FAF4EA] h-8 px-2 flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Busca Textual */}
          <div>
            <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">Busca Textual</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Paciente, serviço, observação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8.5 h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
              />
            </div>
          </div>

          {/* Período: Data Inicial */}
          <div>
            <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">Data Inicial</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
            />
          </div>

          {/* Período: Data Final */}
          <div>
            <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">Data Final</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
            />
          </div>

          {/* Filtro: Área / Serviço */}
          <div>
            <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">
              Área / Serviço
            </Label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl">
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E9E1D2]">
                <SelectItem value="Todos">Todas as áreas</SelectItem>
                {SERVICOS_SUGERIDOS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Filtro: Paciente */}
          <div>
            <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">Paciente</Label>
            <Select value={selectedPacienteId} onValueChange={setSelectedPacienteId}>
              <SelectTrigger className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl">
                <SelectValue placeholder="Todos os pacientes" />
              </SelectTrigger>
              <SelectContent className="max-h-56 rounded-xl border-[#E9E1D2]">
                <SelectItem value="Todos">Todos os pacientes</SelectItem>
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro: Profissional (visível para Admin) */}
          {isAdmin ? (
            <div>
              <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">
                Profissional Atendente
              </Label>
              <Select value={selectedProfissionalId} onValueChange={setSelectedProfissionalId}>
                <SelectTrigger className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent className="max-h-56 rounded-xl border-[#E9E1D2]">
                  <SelectItem value="Todos">Todos os profissionais</SelectItem>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name || prof.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">
                Profissional Atendente
              </Label>
              <div className="h-9 px-3 flex items-center bg-[#FAF4EA]/60 border border-[#E3C89A]/40 rounded-xl text-xs font-medium text-[#4A322A]">
                {user?.name || user?.email || 'Seus lançamentos'}
              </div>
            </div>
          )}

          {/* Filtro: Status */}
          <div>
            <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E9E1D2]">
                <SelectItem value="Todos">Todos os status</SelectItem>
                {STATUS_OPCOES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TABS DE MODO DE VISUALIZAÇÃO: LISTA / POR PROFISSIONAL / POR PACIENTE */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <Tabs
          value={viewMode}
          onValueChange={(val) => setViewMode(val as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-white border border-[#E9E1D2] rounded-2xl p-1 h-auto flex shadow-xs">
            <TabsTrigger
              value="lista"
              className="rounded-xl text-xs font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-3.5 transition-all"
            >
              Lista Cronológica ({presencasFiltradas.length})
            </TabsTrigger>
            <TabsTrigger
              value="profissionais"
              className="rounded-xl text-xs font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-3.5 transition-all"
            >
              Por Profissional ({agrupamentoPorProfissional.length})
            </TabsTrigger>
            <TabsTrigger
              value="pacientes"
              className="rounded-xl text-xs font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-3.5 transition-all"
            >
              Por Paciente ({agrupamentoPorPaciente.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-xs text-[#73574A] font-medium">
          Exibindo <strong>{presencasFiltradas.length}</strong> registro(s)
        </div>
      </div>

      {/* ============================================================== */}
      {/* CORPO DE DADOS: LISTAGEM PRINCIPAL */}
      {/* ============================================================== */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-[#E9E1D2]">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
          <p className="text-xs text-[#73574A] font-medium">
            Carregando lançamentos de presença...
          </p>
        </div>
      ) : presencasFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E9E1D2] space-y-3">
          <CalendarCheck2 className="h-10 w-10 text-[#C9A46A]/60 mx-auto" />
          <h3 className="font-serif font-bold text-base text-[#4A322A]">
            Nenhum atendimento encontrado
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Não há registros de presença correspondentes aos filtros aplicados. Altere os filtros ou
            faça um novo lançamento de atendimento.
          </p>
          <Button
            onClick={handleOpenNewModal}
            size="sm"
            className="mt-2 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold text-xs rounded-xl h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Lançar Primeira Presença
          </Button>
        </div>
      ) : (
        <>
          {/* MODO 1: LISTA CRONOLÓGICA (TABELA RESPONSIVA) */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-3xl border border-[#E9E1D2] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F1] border-b border-[#E9E1D2] text-[#5C4033] uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Área / Serviço</th>
                      <th className="py-3 px-4">Profissional</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 print:hidden text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {presencasFiltradas.map((item) => {
                      const rawDate = item.data_atendimento
                        ? item.data_atendimento.split(' ')[0]
                        : ''
                      const dataFmt = rawDate ? formatDataPTBR(rawDate) : '—'
                      const pacNome =
                        item.paciente_nome || item.expand?.paciente_id?.nome || 'Paciente'
                      const profNome =
                        item.profissional_nome ||
                        item.expand?.profissional_id?.name ||
                        item.expand?.profissional_id?.email ||
                        'Profissional'

                      const isOwnerOrAdmin = isAdmin || item.profissional_id === user?.id

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF7F1]/60 transition-colors group">
                          <td className="py-3 px-4 font-mono font-medium text-[#4A322A] whitespace-nowrap">
                            {dataFmt}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#33221C] block">{pacNome}</span>
                            {item.observacoes && (
                              <span className="text-[11px] text-gray-400 line-clamp-1 italic">
                                "{item.observacoes}"
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#8C6527] inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A46A]" />
                              {item.area_servico}
                            </span>
                            {item.detalhe_servico && (
                              <p className="text-[11px] text-gray-500 line-clamp-1">
                                {item.detalhe_servico}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="h-5 w-5 rounded-full bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50 flex items-center justify-center text-[10px] font-bold">
                                {profNome.charAt(0).toUpperCase()}
                              </span>
                              <span>{profNome}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={
                                item.status === 'Confirmado' || item.status === 'Presente'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.status === 'Justificado'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : item.status === 'Cancelado'
                                      ? 'bg-red-50 text-red-800 border-red-200'
                                      : 'bg-[#FAF4EA] text-[#8C6527] border-[#E3C89A]'
                              }
                            >
                              {item.status || 'Presente'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right print:hidden whitespace-nowrap">
                            {isOwnerOrAdmin && (
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="h-8 w-8 p-0 text-[#8C6527] hover:bg-[#FAF4EA] rounded-lg"
                                  title="Editar presença"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRequestDelete(item)}
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Excluir presença"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODO 2: AGRUPAMENTO POR PROFISSIONAL */}
          {viewMode === 'profissionais' && (
            <div className="space-y-4">
              {agrupamentoPorProfissional.map((grupo) => (
                <div
                  key={grupo.id}
                  className="bg-white rounded-3xl border border-[#E9E1D2] shadow-xs overflow-hidden"
                >
                  <div className="p-4 bg-[#FAF7F1] border-b border-[#E9E1D2] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50 flex items-center justify-center font-bold text-sm">
                        {grupo.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#4A322A]">
                          {grupo.nome}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Profissional responsável pelos atendimentos
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] hover:bg-[#FAF4EA] text-xs font-bold px-3 py-1">
                      {grupo.count} atendimento(s)
                    </Badge>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {grupo.itens.map((item) => {
                      const rawDate = item.data_atendimento
                        ? item.data_atendimento.split(' ')[0]
                        : ''
                      const dataFmt = rawDate ? formatDataPTBR(rawDate) : '—'
                      const pacNome =
                        item.paciente_nome || item.expand?.paciente_id?.nome || 'Paciente'

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 px-4 flex items-center justify-between hover:bg-[#FAF7F1]/40 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="font-mono text-xs font-semibold text-[#5C4033] shrink-0">
                              {dataFmt}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#33221C] truncate">{pacNome}</p>
                              <p className="text-[11px] text-[#8C6527]">
                                {item.area_servico}
                                {item.detalhe_servico ? ` · ${item.detalhe_servico}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={
                                item.status === 'Confirmado' || item.status === 'Presente'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }
                            >
                              {item.status || 'Presente'}
                            </Badge>
                            {(isAdmin || item.profissional_id === user?.id) && (
                              <div className="flex items-center print:hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="h-7 w-7 p-0 text-[#8C6527] hover:bg-[#FAF4EA]"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRequestDelete(item)}
                                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODO 3: AGRUPAMENTO POR PACIENTE */}
          {viewMode === 'pacientes' && (
            <div className="space-y-4">
              {agrupamentoPorPaciente.map((grupo) => (
                <div
                  key={grupo.id}
                  className="bg-white rounded-3xl border border-[#E9E1D2] shadow-xs overflow-hidden"
                >
                  <div className="p-4 bg-[#FAF7F1] border-b border-[#E9E1D2] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-[#FDF2EE] text-[#B87355] border border-[#E7BFB0] flex items-center justify-center font-bold text-sm">
                        {grupo.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#4A322A]">
                          {grupo.nome}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Histórico de presenças do paciente
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] hover:bg-[#FAF4EA] text-xs font-bold px-3 py-1">
                      {grupo.count} atendimento(s)
                    </Badge>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {grupo.itens.map((item) => {
                      const rawDate = item.data_atendimento
                        ? item.data_atendimento.split(' ')[0]
                        : ''
                      const dataFmt = rawDate ? formatDataPTBR(rawDate) : '—'
                      const profNome =
                        item.profissional_nome ||
                        item.expand?.profissional_id?.name ||
                        item.expand?.profissional_id?.email ||
                        'Profissional'

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 px-4 flex items-center justify-between hover:bg-[#FAF7F1]/40 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="font-mono text-xs font-semibold text-[#5C4033] shrink-0">
                              {dataFmt}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#8C6527]">
                                {item.area_servico}
                                {item.detalhe_servico ? ` · ${item.detalhe_servico}` : ''}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Atendido por: <strong className="text-gray-700">{profNome}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={
                                item.status === 'Confirmado' || item.status === 'Presente'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }
                            >
                              {item.status || 'Presente'}
                            </Badge>
                            {(isAdmin || item.profissional_id === user?.id) && (
                              <div className="flex items-center print:hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="h-7 w-7 p-0 text-[#8C6527] hover:bg-[#FAF4EA]"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRequestDelete(item)}
                                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* MODAL DE NOVO LANÇAMENTO OU EDIÇÃO DE PRESENÇA */}
      {/* ============================================================== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-[#E9E1D2] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-xl text-[#4A322A] flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-[#8C6527]" />
              {editingPresenca ? 'Editar Lançamento de Presença' : 'Novo Lançamento de Presença'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {editingPresenca
                ? 'Atualize os dados do atendimento realizado. A alteração será registrada na auditoria.'
                : 'Registre a presença/confirmação do paciente na clínica para controle de atendimentos.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePresenca} className="space-y-4 pt-2">
            {/* SELEÇÃO DO PACIENTE (Autocomplete / Busca) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#4A322A]">
                Paciente <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Digite para buscar paciente por nome ou CPF..."
                  value={formPacienteBusca}
                  onChange={(e) => {
                    setFormPacienteBusca(e.target.value)
                    setFormPacienteId('')
                  }}
                  className="text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
                />
              </div>

              {/* Sugestões de pacientes se não tiver selecionado id */}
              {!formPacienteId && formPacienteBusca.trim() && (
                <div className="max-h-40 overflow-y-auto bg-white border border-[#E9E1D2] rounded-xl shadow-lg p-1 divide-y divide-gray-50 z-20">
                  {pacientesFiltradosModal.length === 0 ? (
                    <p className="p-2 text-center text-xs text-gray-400">
                      Nenhum paciente encontrado.
                    </p>
                  ) : (
                    pacientesFiltradosModal.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormPacienteId(p.id)
                          setFormPacienteBusca(p.nome)
                        }}
                        className="w-full text-left p-2 hover:bg-[#FAF4EA] rounded-lg transition-colors flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-[#33221C]">{p.nome}</span>
                        {p.cpf && (
                          <span className="text-[11px] text-gray-400 font-mono">{p.cpf}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Paciente selecionado Badge */}
              {formPacienteId && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF4EA] border border-[#E3C89A]/50 text-xs text-[#5C4033]">
                  <span className="font-semibold">Selecionado: {formPacienteBusca}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormPacienteId('')
                      setFormPacienteBusca('')
                    }}
                    className="text-gray-400 hover:text-red-600 p-0.5"
                    title="Remover seleção"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* DATA DO ATENDIMENTO & STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#4A322A]">
                  Data do Atendimento <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formDataAtendimento}
                  onChange={(e) => setFormDataAtendimento(e.target.value)}
                  className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#4A322A]">Status da Presença</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as StatusPresenca)}
                >
                  <SelectTrigger className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E9E1D2]">
                    {STATUS_OPCOES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ÁREA / SERVIÇO REALIZADO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#4A322A]">
                Área ou Serviço Realizado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formAreaServico}
                onValueChange={(val) => {
                  setFormAreaServico(val)
                  if (val !== 'Outro') setFormAreaPersonalizada('')
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E9E1D2]">
                  {SERVICOS_SUGERIDOS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  <SelectItem value="Outro">Outro (digitar manualmente)</SelectItem>
                </SelectContent>
              </Select>

              {formAreaServico === 'Outro' && (
                <Input
                  type="text"
                  placeholder="Especifique a área ou serviço..."
                  value={formAreaPersonalizada}
                  onChange={(e) => setFormAreaPersonalizada(e.target.value)}
                  className="mt-1.5 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
                  required
                />
              )}
            </div>

            {/* DETALHE DO SERVIÇO (Campo aberto para detalhamento) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#4A322A]">
                Detalhamento do Serviço (opcional)
              </Label>
              <Input
                type="text"
                placeholder="Ex: Treino de força MMII, sessão de ventosa, retorno pós-operatório..."
                value={formDetalheServico}
                onChange={(e) => setFormDetalheServico(e.target.value)}
                className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
              />
            </div>

            {/* PROFISSIONAL RESPONSÁVEL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#4A322A]">
                Profissional que Atendeu <span className="text-red-500">*</span>
              </Label>
              {isAdmin ? (
                <Select value={formProfissionalId} onValueChange={setFormProfissionalId}>
                  <SelectTrigger className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 rounded-xl border-[#E9E1D2]">
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name || p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#FAF4EA] border border-[#E3C89A]/50 text-xs text-[#5C4033] flex items-center justify-between">
                  <span className="font-semibold">{user?.name || user?.email}</span>
                  <span className="text-[10px] text-gray-400">Usuário Logado</span>
                </div>
              )}
              {!isAdmin && (
                <p className="text-[11px] text-gray-400 italic">
                  Profissionais comuns registram presenças em seu próprio nome.
                </p>
              )}
            </div>

            {/* OBSERVAÇÕES ADICIONAIS */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#4A322A]">Observações (opcional)</Label>
              <Textarea
                rows={2}
                placeholder="Notas sobre o atendimento, orientações dadas ao paciente, etc."
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                className="text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="border-[#E9E1D2] text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] text-[#33221C] font-bold text-xs rounded-xl px-5 h-9"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {editingPresenca ? 'Salvar Alterações' : 'Confirmar Presença'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ============================================================== */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white rounded-3xl border border-[#E9E1D2] p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif font-bold text-lg text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Excluir Registro de Presença?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-600">
              Tem certeza que deseja excluir o lançamento de presença de{' '}
              <strong>
                {itemToDelete?.paciente_nome || itemToDelete?.expand?.paciente_id?.nome}
              </strong>{' '}
              ({itemToDelete?.area_servico})? Esta ação será registrada no histórico de auditoria
              clínica.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-[#E9E1D2] text-xs rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl px-4"
            >
              {deleting ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
