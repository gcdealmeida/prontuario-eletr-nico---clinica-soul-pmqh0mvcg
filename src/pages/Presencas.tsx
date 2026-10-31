import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  X,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  User,
  Calendar,
  Clock,
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
  type PresencaPayload,
} from '@/services/presencas'
import type { PresencaRecord, PacienteRecord, UserRecord, StatusPresenca } from '@/types/database'
import {
  formatDataPTBR,
  formatHoraPTBR,
  getHojeBrasilYMD,
  getAgoraBrasilHora,
  SERVICOS_PRESENCA_PADRAO,
} from '@/lib/constants'

// Opções padrão de áreas/serviços SOUL (13 opções oficiais da clínica)
const SERVICOS_SUGERIDOS: readonly string[] = SERVICOS_PRESENCA_PADRAO

const STATUS_OPCOES: StatusPresenca[] = ['Presente', 'Confirmado', 'Justificado', 'Cancelado']

const MESES_PTBR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const MESES_SLUG = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

// Utilitário para formatar mês e ano ex: "Fevereiro de 2026"
function formatMesAno(date: Date): string {
  const mes = MESES_PTBR[date.getMonth()]
  const ano = date.getFullYear()
  return `${mes} de ${ano}`
}

// Utilitário para limites ISO do mês (YYYY-MM-01 até YYYY-MM-DD)
function getMesRange(date: Date): { inicio: string; fim: string; mesNome: string; ano: number } {
  const ano = date.getFullYear()
  const mesIndex = date.getMonth()
  const mesNum = String(mesIndex + 1).padStart(2, '0')
  const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate()
  const ultimoDiaNum = String(ultimoDia).padStart(2, '0')

  return {
    inicio: `${ano}-${mesNum}-01`,
    fim: `${ano}-${mesNum}-${ultimoDiaNum}`,
    mesNome: MESES_PTBR[mesIndex],
    ano,
  }
}

export default function Presencas() {
  const { user, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const lancarAutoAbertoRef = useRef(false)

  // Navegação mensal (compartilhada por todos)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Modo de período para Admin: 'mes' ou 'custom'
  const [periodoModo, setPeriodoModo] = useState<'mes' | 'custom'>('mes')

  // Intervalo personalizado ativo (aplicado)
  const [customRange, setCustomRange] = useState<{ inicio: string; fim: string }>(() => {
    const now = new Date()
    const mesIndex = now.getMonth()
    const ano = now.getFullYear()
    const mesNum = String(mesIndex + 1).padStart(2, '0')
    const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate()
    const ultimoDiaNum = String(ultimoDia).padStart(2, '0')
    return {
      inicio: `${ano}-${mesNum}-01`,
      fim: `${ano}-${mesNum}-${ultimoDiaNum}`,
    }
  })

  // Campos temporários dos inputs de data customizada antes de clicar "Aplicar"
  const [tempDataInicio, setTempDataInicio] = useState<string>(() => {
    const now = new Date()
    const mesNum = String(now.getMonth() + 1).padStart(2, '0')
    return `${now.getFullYear()}-${mesNum}-01`
  })
  const [tempDataFim, setTempDataFim] = useState<string>(() => {
    const now = new Date()
    const ano = now.getFullYear()
    const mesIndex = now.getMonth()
    const mesNum = String(mesIndex + 1).padStart(2, '0')
    const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate()
    const ultimoDiaNum = String(ultimoDia).padStart(2, '0')
    return `${ano}-${mesNum}-${ultimoDiaNum}`
  })
  const [dataError, setDataError] = useState<string>('')

  // Dados carregados do backend
  const [presencas, setPresencas] = useState<PresencaRecord[]>([])
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [profissionais, setProfissionais] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros complementares dentro do período (para Admin)
  const [selectedPacienteId, setSelectedPacienteId] = useState('Todos')
  const [selectedProfissionalId, setSelectedProfissionalId] = useState('Todos')
  const [selectedArea, setSelectedArea] = useState('Todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Visualização e agrupamento (Admin)
  const [viewMode, setViewMode] = useState<'lista' | 'profissionais' | 'pacientes' | 'servicos'>(
    'lista',
  )

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
  const [formDataAtendimento, setFormDataAtendimento] = useState(() => getHojeBrasilYMD())
  const [formHorario, setFormHorario] = useState(() => getAgoraBrasilHora())
  const [formAreaServico, setFormAreaServico] = useState<string>(SERVICOS_PRESENCA_PADRAO[0])
  const [formAreaPersonalizada, setFormAreaPersonalizada] = useState('')
  const [formDetalheServico, setFormDetalheServico] = useState('')
  const [formProfissionalId, setFormProfissionalId] = useState('')
  const [formStatus, setFormStatus] = useState<StatusPresenca>('Presente')
  const [formObservacoes, setFormObservacoes] = useState('')

  // Intervalo do mês selecionado
  const monthRange = useMemo(() => getMesRange(currentMonth), [currentMonth])

  // Intervalo ativo considerando o modo (se não for admin, é sempre mensal)
  const activeRange = useMemo(() => {
    if (!isAdmin || periodoModo === 'mes') {
      return {
        inicio: monthRange.inicio,
        fim: monthRange.fim,
        isCustom: false,
        label: `${monthRange.mesNome} de ${monthRange.ano}`,
        subLabel: `${formatDataPTBR(monthRange.inicio)} até ${formatDataPTBR(monthRange.fim)}`,
      }
    }
    return {
      inicio: customRange.inicio,
      fim: customRange.fim,
      isCustom: true,
      label: `${formatDataPTBR(customRange.inicio)} até ${formatDataPTBR(customRange.fim)}`,
      subLabel: `Período personalizado`,
    }
  }, [isAdmin, periodoModo, monthRange, customRange])

  // Navegar mês
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleCurrentMonth = () => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const isCurrentMonthNow = useMemo(() => {
    const now = new Date()
    return (
      now.getFullYear() === currentMonth.getFullYear() && now.getMonth() === currentMonth.getMonth()
    )
  }, [currentMonth])

  // Aplicar período personalizado
  const handleAplicarPeriodoCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setDataError('')

    if (!tempDataInicio || !tempDataFim) {
      setDataError('Preencha as datas inicial e final.')
      return
    }

    if (tempDataFim < tempDataInicio) {
      setDataError('A data final não pode ser anterior à data inicial.')
      return
    }

    setCustomRange({
      inicio: tempDataInicio,
      fim: tempDataFim,
    })

    toast({
      title: 'Período aplicado!',
      description: `Filtrando atendimentos de ${formatDataPTBR(tempDataInicio)} a ${formatDataPTBR(tempDataFim)}.`,
    })
  }

  // Atalho para voltar ao mês atual no seletor customizado
  const handleAtalhoMesAtualCustom = () => {
    const now = new Date()
    const ano = now.getFullYear()
    const mesIndex = now.getMonth()
    const mesNum = String(mesIndex + 1).padStart(2, '0')
    const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate()
    const ultimoDiaNum = String(ultimoDia).padStart(2, '0')
    const inicio = `${ano}-${mesNum}-01`
    const fim = `${ano}-${mesNum}-${ultimoDiaNum}`

    setTempDataInicio(inicio)
    setTempDataFim(fim)
    setDataError('')
    setCustomRange({ inicio, fim })

    toast({
      title: 'Mês atual aplicado',
      description: `Intervalo ajustado para ${formatDataPTBR(inicio)} até ${formatDataPTBR(fim)}.`,
    })
  }

  // Carregar dados respeitando o período ativo
  const carregarDados = async () => {
    try {
      setLoading(true)
      const [pacs, usersList, presList] = await Promise.all([
        getAllPacientes(),
        isAdmin ? getAllUsers() : Promise.resolve([]),
        getAllPresencas({
          dataInicio: activeRange.inicio,
          dataFim: activeRange.fim,
        }),
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
  }, [isAdmin, activeRange.inicio, activeRange.fim])

  // Inscrição em tempo real na coleção de presenças
  useRealtime('presencas', () => {
    carregarDados()
  })

  // Lista filtrada no frontend
  const presencasFiltradas = useMemo(() => {
    return presencas.filter((item) => {
      // Escopo de visualização (garantia dupla frontend + backend)
      if (!isAdmin && user?.id && item.profissional_id && item.profissional_id !== user.id) {
        return false
      }

      // Restrições de data (confirmação estrita dentro do período ativo)
      const itemDate = item.data_atendimento ? item.data_atendimento.split(' ')[0] : ''
      if (itemDate && (itemDate < activeRange.inicio || itemDate > activeRange.fim)) {
        return false
      }

      // Se não for admin, a página é simples e exibe direto os lançamentos dele no mês
      if (!isAdmin) {
        return true
      }

      // Filtros exclusivos de Admin dentro do mês:
      // Filtro de Paciente
      if (selectedPacienteId !== 'Todos' && item.paciente_id !== selectedPacienteId) {
        return false
      }

      // Filtro de Profissional
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
    activeRange.inicio,
    activeRange.fim,
    selectedPacienteId,
    selectedProfissionalId,
    selectedArea,
    selectedStatus,
    searchTerm,
  ])

  // Contagens e Agrupamento por Profissional (apenas Admin)
  const agrupamentoPorProfissional = useMemo(() => {
    if (!isAdmin) return []
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
  }, [isAdmin, presencasFiltradas])

  // Contagens e Agrupamento por Paciente (apenas Admin)
  const agrupamentoPorPaciente = useMemo(() => {
    if (!isAdmin) return []
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
  }, [isAdmin, presencasFiltradas])

  // Contagens e Agrupamento por Serviço/Área (Base para cobrança e faturamento futuro)
  const agrupamentoPorServico = useMemo(() => {
    if (!isAdmin) return []
    const map = new Map<
      string,
      { area: string; total: number; confirmados: number; itens: PresencaRecord[] }
    >()

    presencasFiltradas.forEach((p) => {
      const area = p.area_servico || 'Outro'
      if (!map.has(area)) {
        map.set(area, { area, total: 0, confirmados: 0, itens: [] })
      }
      const entry = map.get(area)!
      entry.total += 1
      if (!p.status || p.status === 'Presente' || p.status === 'Confirmado') {
        entry.confirmados += 1
      }
      entry.itens.push(p)
    })

    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [isAdmin, presencasFiltradas])

  // Reset de filtros (Admin)
  const handleResetFilters = () => {
    setSelectedPacienteId('Todos')
    setSelectedProfissionalId('Todos')
    setSelectedArea('Todos')
    setSelectedStatus('Todos')
    setSearchTerm('')
  }

  // Auto-abertura do modal de lançamento quando ?lancar=1 ou ?lancar=true
  useEffect(() => {
    const lancarParam = searchParams.get('lancar')
    if ((lancarParam === '1' || lancarParam === 'true') && !lancarAutoAbertoRef.current) {
      lancarAutoAbertoRef.current = true
      handleOpenNewModal()
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('lancar')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Abertura do Modal de Novo Lançamento
  const handleOpenNewModal = () => {
    setEditingPresenca(null)
    setFormPacienteId('')
    setFormPacienteBusca('')

    // Data padrão para novo lançamento: hoje no fuso do Brasil se estiver dentro do período ativo, ou o início do período
    const todayYMD = getHojeBrasilYMD()
    let defaultDate = todayYMD
    if (activeRange.inicio && activeRange.fim) {
      if (todayYMD >= activeRange.inicio && todayYMD <= activeRange.fim) {
        defaultDate = todayYMD
      } else {
        defaultDate = activeRange.inicio
      }
    }

    setFormDataAtendimento(defaultDate)
    setFormHorario(getAgoraBrasilHora())
    // Se o usuário logado tiver uma especialidade que corresponda diretamente a um dos serviços, usa ela; senão o 1º da lista padrão
    let defaultServico: string = SERVICOS_PRESENCA_PADRAO[0]
    if (user?.especialidade) {
      const match = SERVICOS_SUGERIDOS.find(
        (s) => s.toLowerCase() === user.especialidade?.toLowerCase(),
      )
      if (match) defaultServico = match
    }
    setFormAreaServico(defaultServico)
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
      item.data_atendimento ? item.data_atendimento.split(' ')[0] : getHojeBrasilYMD(),
    )
    setFormHorario(item.horario || getAgoraBrasilHora())

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
      horario: formHorario.trim() || undefined,
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

  // Exportar XLSX externo via SheetJS (apenas Admin)
  const handleExportXLSX = () => {
    try {
      if (presencasFiltradas.length === 0) {
        toast({
          title: 'Sem lançamentos',
          description: `Nenhum atendimento encontrado para ${activeRange.label}.`,
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
          Horário: item.horario || '',
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
        { wch: 10 }, // Horário
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

      // Nome do arquivo:
      // Se for personalizado: presencas_DD-MM-YYYY_a_DD-MM-YYYY.xlsx
      // Se for por mês: presencas_mes-ano.xlsx
      let fileName = ''
      if (activeRange.isCustom) {
        const [anoI, mesI, diaI] = activeRange.inicio.split('-')
        const [anoF, mesF, diaF] = activeRange.fim.split('-')
        fileName = `presencas_${diaI}-${mesI}-${anoI}_a_${diaF}-${mesF}-${anoF}.xlsx`
      } else {
        const mesSlug = MESES_SLUG[currentMonth.getMonth()]
        const anoNum = currentMonth.getFullYear()
        fileName = `presencas_${mesSlug}-${anoNum}.xlsx`
      }

      XLSX.writeFile(workbook, fileName)

      toast({
        title: 'Planilha exportada com sucesso!',
        description: `Arquivo ${fileName} gerado com ${presencasFiltradas.length} lançamento(s) de ${activeRange.label}.`,
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

  // Imprimir Relatório Limpo com Cabeçalho da Clínica (apenas Admin)
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

  // Componente unificado da barra de controle mensal (‹ Mês Anterior | Mês Ano | Próximo Mês › + Mês Atual)
  const renderNavegacaoMensal = () => (
    <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-[#E9E1D2] shadow-xs">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          className="h-9 w-9 p-0 rounded-xl border-[#E9E1D2] hover:bg-[#FAF4EA] text-[#5C4033]"
          title="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#FAF7F1] border border-[#E9E1D2] text-center min-w-[180px] sm:min-w-[220px]">
          <span className="text-xs sm:text-sm font-serif font-bold text-[#4A322A] block capitalize">
            {formatMesAno(currentMonth)}
          </span>
          <span className="text-[10px] text-gray-400">
            {formatDataPTBR(monthRange.inicio)} até {formatDataPTBR(monthRange.fim)}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-9 w-9 p-0 rounded-xl border-[#E9E1D2] hover:bg-[#FAF4EA] text-[#5C4033]"
          title="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {!isCurrentMonthNow && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCurrentMonth}
            className="text-xs font-semibold text-[#8C6527] border-[#D4B278] hover:bg-[#FAF4EA] rounded-xl h-9 px-3"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Mês atual
          </Button>
        )}
        <div className="text-xs text-[#73574A] font-medium hidden sm:block">
          Total de <strong>{presencasFiltradas.length}</strong> atendimento(s)
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-12 print:m-0 print:p-0">
      {/* ============================================================== */}
      {/* CABEÇALHO OFICIAL EXCLUSIVO PARA IMPRESSÃO / PDF (Admin) */}
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
          {activeRange.isCustom ? (
            <span>
              <strong>Período:</strong> {formatDataPTBR(activeRange.inicio)} a{' '}
              {formatDataPTBR(activeRange.fim)}
            </span>
          ) : (
            <span>
              <strong>Mês de Referência:</strong> {formatMesAno(currentMonth)}
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
      {/* CASO A: VISÃO DO ADMINISTRADOR */}
      {/* ============================================================== */}
      {isAdmin ? (
        <>
          {/* HEADER ADMIN NA TELA (Oculto na impressão) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold mb-1">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                <span>Painel Administrativo de Presenças</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#4A322A]">
                Presença / Confirmação
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Controle de atendimentos da clínica, estatísticas de quantidade, busca por mês ou
                período personalizado e exportações.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleExportXLSX}
                variant="outline"
                className="border-[#D4B278] text-[#5C4033] hover:bg-[#FAF4EA] rounded-xl h-10 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs"
                title="Exportar dados do mês selecionado para pasta de trabalho Excel (.xlsx)"
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

          {/* SELETOR DE MODO DE PERÍODO & NAVEGAÇÃO (Admin) */}
          <div className="space-y-3 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Tabs
                value={periodoModo}
                onValueChange={(val) => setPeriodoModo(val as 'mes' | 'custom')}
                className="w-full sm:w-auto"
              >
                <TabsList className="bg-[#FAF7F1] border border-[#E9E1D2] rounded-2xl p-1 h-auto flex">
                  <TabsTrigger
                    value="mes"
                    className="rounded-xl text-xs font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-1.5 px-3.5 transition-all"
                  >
                    Por Mês
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="rounded-xl text-xs font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-1.5 px-3.5 transition-all"
                  >
                    Período Personalizado
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {activeRange.isCustom && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF4EA] border border-[#E3C89A] text-xs font-semibold text-[#8C6527]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Período ativo: {formatDataPTBR(activeRange.inicio)} até{' '}
                    {formatDataPTBR(activeRange.fim)}
                  </span>
                </div>
              )}
            </div>

            {/* MODO 1: NAVEGAÇÃO POR MÊS */}
            {periodoModo === 'mes' ? (
              renderNavegacaoMensal()
            ) : (
              /* MODO 2: PERÍODO PERSONALIZADO */
              <div className="bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs space-y-3">
                <form
                  onSubmit={handleAplicarPeriodoCustom}
                  className="flex flex-col md:flex-row md:items-end justify-between gap-3"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-1">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs font-semibold text-[#4A322A]">
                        Data Inicial <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={tempDataInicio}
                        onChange={(e) => {
                          setTempDataInicio(e.target.value)
                          setDataError('')
                        }}
                        className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
                        required
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <Label className="text-xs font-semibold text-[#4A322A]">
                        Data Final <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={tempDataFim}
                        min={tempDataInicio || undefined}
                        onChange={(e) => {
                          setTempDataFim(e.target.value)
                          setDataError('')
                        }}
                        className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1 sm:pt-0">
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-9 px-4 text-xs shadow-xs"
                      >
                        Aplicar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAtalhoMesAtualCustom}
                        className="border-[#D4B278] text-[#8C6527] hover:bg-[#FAF4EA] rounded-xl h-9 px-3 text-xs font-semibold"
                        title="Redefinir para o mês atual"
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Mês atual
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-[#73574A] font-medium hidden lg:block self-center">
                    Total de <strong>{presencasFiltradas.length}</strong> atendimento(s) no período
                  </div>
                </form>

                {dataError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {dataError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CARDS DE RESUMO E CONTADORES DO PERÍODO (Admin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            {/* Total no Período */}
            <div className="bg-white rounded-2xl p-4 border border-[#E9E1D2] shadow-xs flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50 flex items-center justify-center shrink-0">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                  {activeRange.isCustom ? 'Total no Período' : 'Total no Mês'}
                </p>
                <p className="text-2xl font-serif font-bold text-[#4A322A]">
                  {presencasFiltradas.length}
                </p>
                <p className="text-[11px] text-[#8C6527] truncate">{activeRange.label}</p>
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

            {/* Pacientes Únicos */}
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
                <p className="text-[11px] text-gray-500 truncate">Pessoas atendidas</p>
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
                <p className="text-[11px] text-gray-500 truncate">Equipe ativa</p>
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS COMBINÁVEIS DENTRO DO PERÍODO (Admin) */}
          <div className="bg-white rounded-3xl p-5 border border-[#E9E1D2] shadow-xs space-y-4 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E9E1D2]/60 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#8C6527]" />
                <h3 className="font-serif font-bold text-sm text-[#4A322A]">
                  Filtros Complementares
                </h3>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-[#73574A]">
                  Refinar por paciente, profissional, serviço, status ou busca
                </span>
              </div>

              {(selectedPacienteId !== 'Todos' ||
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Busca Textual */}
              <div className="lg:col-span-1">
                <Label className="text-xs font-semibold text-[#5C4033] mb-1 block">
                  Busca Textual
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Nome, serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8.5 h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
                  />
                </div>
              </div>

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

              {/* Filtro: Profissional Atendente */}
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

          {/* TABS DE MODO DE VISUALIZAÇÃO (Admin: Lista / Por Profissional / Por Paciente) */}
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
                <TabsTrigger
                  value="servicos"
                  className="rounded-xl text-xs font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-3.5 transition-all"
                >
                  Por Serviço / Cobrança ({agrupamentoPorServico.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-xs text-[#73574A] font-medium">
              Exibindo <strong>{presencasFiltradas.length}</strong> registro(s) em{' '}
              {activeRange.label}
            </div>
          </div>

          {/* CORPO DE DADOS DO ADMIN */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-[#E9E1D2]">
              <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
              <p className="text-xs text-[#73574A] font-medium">
                Carregando lançamentos de {activeRange.label}...
              </p>
            </div>
          ) : presencasFiltradas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E9E1D2] space-y-3">
              <CalendarCheck2 className="h-10 w-10 text-[#C9A46A]/60 mx-auto" />
              <h3 className="font-serif font-bold text-base text-[#4A322A]">
                Nenhum atendimento em {activeRange.label}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Não há registros de presença correspondentes para este período com os filtros
                aplicados. Altere os filtros ou registre um novo atendimento.
              </p>
              <Button
                onClick={handleOpenNewModal}
                size="sm"
                className="mt-2 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold text-xs rounded-xl h-9"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Lançar Presença
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
                          <th className="py-3 px-4">Data / Hora</th>
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

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-[#FAF7F1]/60 transition-colors group"
                            >
                              <td className="py-3 px-4 font-mono font-medium text-[#4A322A] whitespace-nowrap">
                                <div>{dataFmt}</div>
                                {item.horario && (
                                  <div className="text-[11px] text-[#8C6527] font-semibold flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3 inline text-[#C9A46A]" />
                                    <span>{formatHoraPTBR(item.horario)}</span>
                                  </div>
                                )}
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
                              Atendimentos em {activeRange.label}
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
                                <div className="shrink-0 font-mono text-xs font-semibold text-[#5C4033]">
                                  <span>{dataFmt}</span>
                                  {item.horario && (
                                    <span className="block text-[10px] text-[#8C6527]">
                                      {formatHoraPTBR(item.horario)}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-[#33221C] truncate">
                                    {pacNome}
                                  </p>
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
                              Histórico de atendimentos em {activeRange.label}
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
                                <div className="shrink-0 font-mono text-xs font-semibold text-[#5C4033]">
                                  <span>{dataFmt}</span>
                                  {item.horario && (
                                    <span className="block text-[10px] text-[#8C6527]">
                                      {formatHoraPTBR(item.horario)}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-[#8C6527]">
                                    {item.area_servico}
                                    {item.detalhe_servico ? ` · ${item.detalhe_servico}` : ''}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    Atendido por:{' '}
                                    <strong className="text-gray-700">{profNome}</strong>
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
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MODO 4: AGRUPAMENTO POR SERVIÇO / COBRANÇA FUTURA */}
              {viewMode === 'servicos' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAF7F1] border border-[#E9E1D2] flex items-center justify-between text-xs text-[#73574A]">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-[#8C6527]" />
                      <span>
                        <strong>Base contábil para cobrança futura:</strong> cada registro de
                        presença contabiliza o serviço prestado, profissional e paciente.
                      </span>
                    </div>
                    <span className="font-bold text-[#8C6527]">
                      {agrupamentoPorServico.reduce((acc, s) => acc + s.confirmados, 0)} sessões
                      efetivadas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agrupamentoPorServico.map((grupo) => (
                      <div
                        key={grupo.area}
                        className="bg-white rounded-3xl border border-[#E9E1D2] shadow-xs overflow-hidden"
                      >
                        <div className="p-4 bg-[#FAF7F1] border-b border-[#E9E1D2] flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h4 className="font-serif font-bold text-sm text-[#4A322A]">
                              {grupo.area}
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              {grupo.confirmados} de {grupo.total} confirmados / presentes
                            </p>
                          </div>
                          <Badge className="bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] hover:bg-[#FAF4EA] text-xs font-bold px-3 py-1">
                            {grupo.total} lançamento(s)
                          </Badge>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                          {grupo.itens.map((item) => {
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

                            return (
                              <div
                                key={item.id}
                                className="p-3 px-4 flex items-center justify-between hover:bg-[#FAF7F1]/40 transition-colors text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-[#33221C] truncate">{pacNome}</p>
                                  <p className="text-[11px] text-gray-500">
                                    {dataFmt}
                                    {item.horario ? ` às ${formatHoraPTBR(item.horario)}` : ''} ·{' '}
                                    {profNome}
                                    {item.detalhe_servico ? ` · ${item.detalhe_servico}` : ''}
                                  </p>
                                </div>
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
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* ============================================================== */
        /* CASO B: VISÃO DO COLABORADOR (Simples e Direta) */
        /* ============================================================== */
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* TOPO COM BOTÃO DE DESTAQUE "+ Lançar Presença" */}
          <div className="bg-gradient-to-br from-[#FAF7F1] via-white to-[#FAF4EA] rounded-3xl p-6 sm:p-7 border border-[#E9E1D2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] text-xs font-semibold">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                <span>Atendimentos do Profissional</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#4A322A]">
                Presença / Confirmação
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Olá, <strong>{user?.name || user?.email}</strong>. Registre a presença dos pacientes
                e alunos atendidos por você e consulte seu histórico mensal.
              </p>
            </div>

            <Button
              onClick={handleOpenNewModal}
              size="lg"
              className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-2xl h-12 px-6 text-sm flex items-center gap-2.5 shadow-md border border-[#DFBF8E]/60 transition-transform active:scale-98 shrink-0"
            >
              <Plus className="h-5 w-5 text-[#33221C]" />
              <span>+ Lançar Presença</span>
            </Button>
          </div>

          {/* SELETOR DE MÊS SIMPLES (Navegação mensal para o colaborador) */}
          {renderNavegacaoMensal()}

          {/* LISTA CRONOLÓGICA SIMPLES DOS PACIENTES/ALUNOS QUE VIERAM COM ELE */}
          <div className="bg-white rounded-3xl border border-[#E9E1D2] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#FAF7F1] border-b border-[#E9E1D2] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50 flex items-center justify-center font-bold">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#4A322A]">
                    Pacientes e Alunos Atendidos por Você
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Sessões registradas em {monthRange.mesNome} de {monthRange.ano}
                  </p>
                </div>
              </div>

              <Badge className="bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] hover:bg-[#FAF4EA] text-xs font-bold px-3 py-1">
                {presencasFiltradas.length} atendimento(s)
              </Badge>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-[#C9A46A]" />
                <p className="text-xs text-[#73574A] font-medium">
                  Buscando seus atendimentos de {formatMesAno(currentMonth)}...
                </p>
              </div>
            ) : presencasFiltradas.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <CalendarCheck2 className="h-10 w-10 text-[#C9A46A]/50 mx-auto" />
                <h4 className="font-serif font-bold text-base text-[#4A322A]">
                  Nenhum atendimento registrado em {formatMesAno(currentMonth)}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Você ainda não registrou atendimentos neste mês. Clique no botão abaixo para
                  lançar a presença de um paciente.
                </p>
                <Button
                  onClick={handleOpenNewModal}
                  size="sm"
                  className="mt-2 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold text-xs rounded-xl h-9"
                >
                  <Plus className="h-4 w-4 mr-1.5" />+ Lançar Presença
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {presencasFiltradas.map((item) => {
                  const rawDate = item.data_atendimento ? item.data_atendimento.split(' ')[0] : ''
                  const dataFmt = rawDate ? formatDataPTBR(rawDate) : '—'
                  const pacNome = item.paciente_nome || item.expand?.paciente_id?.nome || 'Paciente'

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:px-6 flex items-center justify-between hover:bg-[#FAF7F1]/50 transition-colors gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/40 flex flex-col items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-[#8C6527]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#33221C] truncate">
                              {pacNome}
                            </span>
                            <span className="font-mono text-xs font-semibold text-[#8C6527] bg-[#FAF4EA] px-2 py-0.5 rounded-md border border-[#E3C89A]/40 inline-flex items-center gap-1">
                              <span>{dataFmt}</span>
                              {item.horario && (
                                <>
                                  <span className="text-[#C9A46A]">·</span>
                                  <Clock className="h-3 w-3 text-[#8C6527]" />
                                  <span>{formatHoraPTBR(item.horario)}</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#73574A] flex-wrap">
                            <span className="font-semibold text-[#8C6527]">
                              {item.area_servico}
                            </span>
                            {item.detalhe_servico && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-600 truncate">
                                  {item.detalhe_servico}
                                </span>
                              </>
                            )}
                            {item.observacoes && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-400 italic truncate max-w-xs">
                                  "{item.observacoes}"
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(item)}
                            className="h-8 w-8 p-0 text-[#8C6527] hover:bg-[#FAF4EA] rounded-lg"
                            title="Editar atendimento"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Excluir atendimento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE NOVO LANÇAMENTO OU EDIÇÃO DE PRESENÇA (Compartilhado) */}
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

            {/* DATA DO ATENDIMENTO, HORÁRIO & STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <Label className="text-xs font-semibold text-[#4A322A] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#8C6527]" />
                  <span>Horário (HH:mm)</span>
                </Label>
                <Input
                  type="time"
                  value={formHorario}
                  onChange={(e) => setFormHorario(e.target.value)}
                  className="h-9 text-xs bg-[#FAF7F1] border-[#E9E1D2] rounded-xl focus:bg-white"
                  placeholder="Ex: 14:30"
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

            {/* DETALHE DO SERVIÇO */}
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
                  <span className="text-[10px] text-gray-400">Você (Usuário Logado)</span>
                </div>
              )}
              {!isAdmin && (
                <p className="text-[11px] text-gray-400 italic">
                  O lançamento será atribuído automaticamente a você.
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
              <Trash2 className="h-5 w-5 text-red-600" />
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
