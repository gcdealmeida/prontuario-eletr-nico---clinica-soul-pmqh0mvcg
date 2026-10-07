import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Calendar,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getPacientes, createPaciente, updatePaciente } from '@/services/pacientes'
import type { PacienteRecord, Especialidade, StatusPaciente } from '@/types/database'
import { formatCPF, formatTelefone, formatDataPTBR, getInitials } from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { NovaConsultaModal } from '@/components/NovaConsultaModal'
import { ModalLinkPreCadastro } from '@/components/ModalLinkPreCadastro'
import { ModalImportarPacientes } from '@/components/ModalImportarPacientes'
import { ModalImportarAvaliacaoPlanilha } from '@/components/ModalImportarAvaliacaoPlanilha'
import { useAuth } from '@/contexts/AuthContext'
import { Link as LinkIcon, Sparkles, FileSpreadsheet } from 'lucide-react'

export default function Pacientes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filtros e Ordenação
  const [search, setSearch] = useState(searchParams.get('busca') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [statusFilter, setStatusFilter] = useState<'Todas' | 'Ativo' | 'Inativo' | 'Pré-cadastro'>(
    'Todas',
  )
  // Opções de ordenação:
  // 'nome_asc' = Alfabético A-Z
  // 'nome_desc' = Alfabético Z-A
  // 'created_desc' = Mais recente para mais antigo (maior para menor)
  // 'created_asc' = Mais antigo para mais recente (menor para maior)
  // 'nasc_desc' = Idade: mais jovem primeiro (data de nascimento mais recente)
  // 'nasc_asc' = Idade: mais velho primeiro (data de nascimento mais antiga)
  const [sortBy, setSortBy] = useState<string>('nome_asc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // Modal Novo Paciente / Editar Paciente
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPaciente, setEditingPaciente] = useState<PacienteRecord | null>(null)
  const [savingPaciente, setSavingPaciente] = useState(false)

  // Form Fields
  const [formNome, setFormNome] = useState('')
  const [formCpf, setFormCpf] = useState('')
  const [formDataNasc, setFormDataNasc] = useState('')
  const [formTelefone, setFormTelefone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formEndereco, setFormEndereco] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')
  const [formStatus, setFormStatus] = useState<StatusPaciente>('Ativo')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Modal Link de Pré-cadastro
  const [linkPreCadastroOpen, setLinkPreCadastroOpen] = useState(false)

  // Modal Nova Consulta a partir de paciente
  const [consultaModalOpen, setConsultaModalOpen] = useState(false)
  const [selectedPacienteForConsulta, setSelectedPacienteForConsulta] = useState<string>('')

  // Modal Importar Pacientes (Admin only)
  const { isAdmin } = useAuth()
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Modal Importar Avaliação Planilha (.xlsx)
  const [importAvaliacaoModalOpen, setImportAvaliacaoModalOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const fetchPacientesList = async () => {
    try {
      setLoading(true)
      let filter = ''
      const parts: string[] = []

      if (debouncedSearch.trim()) {
        parts.push(
          `(nome ~ "${debouncedSearch.trim()}" || cpf ~ "${debouncedSearch.trim()}" || email ~ "${debouncedSearch.trim()}")`,
        )
      }

      if (statusFilter !== 'Todas') {
        parts.push(`status = "${statusFilter}"`)
      }

      if (parts.length > 0) {
        filter = parts.join(' && ')
      }

      // Mapear opção de ordenação para a sintaxe do PocketBase
      let sortExpression = 'nome'
      switch (sortBy) {
        case 'nome_asc':
          sortExpression = 'nome'
          break
        case 'nome_desc':
          sortExpression = '-nome'
          break
        case 'created_desc':
          sortExpression = '-created'
          break
        case 'created_asc':
          sortExpression = 'created'
          break
        case 'nasc_desc':
          sortExpression = '-data_nascimento'
          break
        case 'nasc_asc':
          sortExpression = 'data_nascimento'
          break
        default:
          sortExpression = 'nome'
      }

      const res = await getPacientes(filter, sortExpression, perPage, page)
      setPacientes(res.items)
      setTotalItems(res.totalItems)
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacientesList()
  }, [debouncedSearch, statusFilter, sortBy, page, perPage])

  // Realtime
  useRealtime('pacientes', () => {
    fetchPacientesList()
  })

  const openNewPacienteModal = () => {
    setEditingPaciente(null)
    setFormNome('')
    setFormCpf('')
    setFormDataNasc('')
    setFormTelefone('')
    setFormEmail('')
    setFormEndereco('')
    setFormObservacoes('')
    setFormStatus('Ativo')
    setFormErrors({})
    setModalOpen(true)
  }

  const openEditPacienteModal = (p: PacienteRecord) => {
    setEditingPaciente(p)
    setFormNome(p.nome)
    setFormCpf(p.cpf || '')
    setFormDataNasc(p.data_nascimento ? p.data_nascimento.substring(0, 10) : '')
    setFormTelefone(p.telefone || '')
    setFormEmail(p.email || '')
    setFormEndereco(p.endereco || '')
    setFormObservacoes(p.observacoes || '')
    setFormStatus(p.status || 'Ativo')
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    if (!formNome.trim()) {
      setFormErrors({ nome: 'Nome completo é obrigatório' })
      return
    }

    try {
      setSavingPaciente(true)
      const payload: Partial<PacienteRecord> = {
        nome: formNome.trim(),
        cpf: formCpf.trim() || undefined,
        data_nascimento: formDataNasc ? `${formDataNasc} 00:00:00.000Z` : undefined,
        telefone: formTelefone.trim() || undefined,
        email: formEmail.trim() || undefined,
        endereco: formEndereco.trim() || undefined,
        observacoes: formObservacoes.trim() || undefined,
        status: formStatus,
      }

      if (editingPaciente) {
        await updatePaciente(editingPaciente.id, payload)
        toast({
          title: 'Paciente atualizado!',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        await createPaciente(payload)
        toast({
          title: 'Paciente cadastrado com sucesso!',
          description: 'O novo prontuário foi criado.',
        })
      }

      setModalOpen(false)
      fetchPacientesList()
    } catch (err: any) {
      console.error('Erro salvando paciente:', err)
      const dataErrors = err?.data?.data
      if (dataErrors?.cpf) {
        setFormErrors({ cpf: 'Este CPF já está cadastrado para outro paciente.' })
      } else {
        toast({
          title: 'Erro ao salvar paciente',
          description: err?.message || 'Verifique as informações digitadas.',
          variant: 'destructive',
        })
      }
    } finally {
      setSavingPaciente(false)
    }
  }

  const totalPages = Math.ceil(totalItems / perPage) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">
            Gerenciamento completo da base de pacientes e prontuários da SOUL.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setImportAvaliacaoModalOpen(true)}
            className="rounded-xl h-10 px-3.5 text-xs font-semibold border-[#C9A46A]/80 bg-[#FAF7F1] text-[#73574A] hover:bg-[#F3EAD9] flex items-center gap-2 shadow-2xs"
            title="Importar avaliação clínica e evoluções de Fisioterapia a partir de pasta de trabalho .xlsx"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#8C6527]" />
            Importar Avaliação (Planilha)
          </Button>

          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="rounded-xl h-10 px-3.5 text-xs font-semibold border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100/70 flex items-center gap-2 shadow-2xs"
              title="Importar pacientes a partir de planilha Google Forms (.xlsx / .csv)"
            >
              <FileSpreadsheet className="h-4 w-4 text-amber-700" />
              Importar Pacientes
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => setLinkPreCadastroOpen(true)}
            className="rounded-xl h-10 px-3.5 text-xs font-semibold border-[#C9A46A]/60 bg-[#FAF5EE] text-[#8C6527] hover:bg-[#F3EAD9] flex items-center gap-2 shadow-2xs"
          >
            <LinkIcon className="h-4 w-4 text-[#8C6527]" />
            Pré-Cadastro via Link
          </Button>

          <Button
            onClick={openNewPacienteModal}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-semibold rounded-xl h-10 px-4 text-sm flex items-center gap-2 shadow-sm border border-[#DFBF8E]/40"
          >
            <Plus className="h-4 w-4 text-[#33221C]" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl border-gray-200 bg-gray-50/50 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span className="hidden sm:inline">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as any)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-32 h-9 rounded-xl border-gray-200 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pré-cadastro">Pré-cadastro</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <span className="hidden sm:inline">Ordenar:</span>
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48 sm:w-52 h-9 rounded-xl border-gray-200 text-xs bg-white">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="nome_asc">Nome (A → Z)</SelectItem>
                <SelectItem value="nome_desc">Nome (Z → A)</SelectItem>
                <SelectItem value="created_desc">Cadastro: Mais recente (maior)</SelectItem>
                <SelectItem value="created_asc">Cadastro: Mais antigo (menor)</SelectItem>
                <SelectItem value="nasc_desc">Idade: Mais jovem primeiro</SelectItem>
                <SelectItem value="nasc_asc">Idade: Mais idoso primeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#73574A]">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
            <span className="text-xs font-medium">Carregando lista de pacientes...</span>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="h-10 w-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">Nenhum paciente encontrado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Nenhum paciente atende aos filtros atuais ou a base ainda está vazia.
            </p>
            <Button
              onClick={openNewPacienteModal}
              size="sm"
              className="mt-2 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-semibold rounded-lg text-xs"
            >
              Cadastrar primeiro paciente
            </Button>{' '}
          </div>
        ) : (
          <>
            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4 pl-6">Nome / Contato</th>
                    <th className="py-3.5 px-4">CPF</th>
                    <th className="py-3.5 px-4">Telefone</th>
                    <th className="py-3.5 px-4">Cadastro</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {pacientes.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-xs shrink-0 shadow-xs">
                            <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                              {getInitials(p.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 group-hover:text-[#8C6527] transition-colors">
                              {p.nome}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {p.email || 'Sem e-mail'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-gray-600">
                        {formatCPF(p.cpf)}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {formatTelefone(p.telefone)}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {formatDataPTBR(p.created)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={
                            p.status === 'Pré-cadastro'
                              ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold text-xs shadow-2xs'
                              : p.status === 'Ativo'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                                : 'bg-gray-100 text-gray-600 border-gray-200 text-xs'
                          }
                        >
                          {p.status === 'Pré-cadastro' ? '⚡ Pré-cadastro' : p.status}
                        </Badge>
                      </td>

                      <td
                        className="py-3.5 px-4 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl">
                            {p.status === 'Pré-cadastro' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/prontuarios/novo?paciente=${p.id}&especialidade=Fisioterapia`,
                                  )
                                }
                                className="text-xs cursor-pointer flex items-center gap-2 font-bold text-[#8C6527] bg-[#FAF5EE]"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-[#8C6527]" /> Abrir Prontuário
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => navigate(`/pacientes/${p.id}`)}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-gray-500" /> Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPacienteForConsulta(p.id)
                                setConsultaModalOpen(true)
                              }}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <Calendar className="h-3.5 w-3.5 text-blue-500" /> Agendar Consulta
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/prontuarios/novo?paciente=${p.id}`)}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <FileText className="h-3.5 w-3.5 text-[#8C6527]" /> Nova Avaliação
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditPacienteModal(p)}
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-gray-500" /> Editar Dados
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-gray-100">
              {pacientes.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/pacientes/${p.id}`)}
                  className="p-4 space-y-3 cursor-pointer active:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-xs shrink-0 shadow-xs">
                        <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                          {getInitials(p.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{p.nome}</h4>
                        <p className="text-xs text-gray-500">{formatTelefone(p.telefone)}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        p.status === 'Pré-cadastro'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold text-xs'
                          : p.status === 'Ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                            : 'bg-gray-100 text-gray-600 border-gray-200 text-xs'
                      }
                    >
                      {p.status === 'Pré-cadastro' ? '⚡ Pré-cadastro' : p.status}
                    </Badge>
                  </div>

                  {p.status === 'Pré-cadastro' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#8C6527] font-semibold">
                        Aguardando abertura de prontuário
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/prontuarios/novo?paciente=${p.id}&especialidade=Fisioterapia`)
                        }}
                        className="h-7 px-2.5 text-[11px] bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-bold rounded-lg"
                      >
                        Abrir Prontuário →
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 flex justify-between pt-1 border-t border-gray-50">
                    <span>CPF: {formatCPF(p.cpf)}</span>
                    <span>Criado: {formatDataPTBR(p.created)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="py-3 px-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div>
                Mostrando{' '}
                <span className="font-semibold text-gray-800">
                  {pacientes.length === 0 ? 0 : (page - 1) * perPage + 1}
                </span>{' '}
                a{' '}
                <span className="font-semibold text-gray-800">
                  {Math.min(page * perPage, totalItems)}
                </span>{' '}
                de <span className="font-semibold text-gray-800">{totalItems}</span> pacientes
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={String(perPage)}
                  onValueChange={(val) => {
                    setPerPage(Number(val))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-24 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / pág</SelectItem>
                    <SelectItem value="20">20 / pág</SelectItem>
                    <SelectItem value="50">50 / pág</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-gray-700 font-medium">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Novo / Editar Paciente */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl p-6 bg-white border border-gray-100 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]/50">
                <Users className="h-5 w-5" />
              </span>
              {editingPaciente ? 'Editar Dados do Paciente' : 'Novo Paciente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePaciente} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Nome completo *</Label>
              <Input
                required
                placeholder="Ex: Maria Fernandes Oliveira"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                className="h-10 rounded-xl border-gray-200"
              />
              {formErrors.nome && <p className="text-xs text-red-600">{formErrors.nome}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">CPF</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={formCpf}
                  onChange={(e) => setFormCpf(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
                {formErrors.cpf && <p className="text-xs text-red-600">{formErrors.cpf}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Data de Nascimento</Label>
                <Input
                  type="date"
                  value={formDataNasc}
                  onChange={(e) => setFormDataNasc(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Telefone / WhatsApp</Label>
                <Input
                  placeholder="(11) 98765-4321"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">E-mail</Label>
                <Input
                  type="email"
                  placeholder="paciente@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Endereço Completo</Label>
              <Input
                placeholder="Rua, número, complemento, bairro, cidade - UF"
                value={formEndereco}
                onChange={(e) => setFormEndereco(e.target.value)}
                className="h-10 rounded-xl border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as StatusPaciente)}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Pré-cadastro">Pré-cadastro</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Observações Gerais</Label>
              <Textarea
                rows={2}
                placeholder="Alergias, convênio, preferências..."
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                className="resize-none rounded-xl border-gray-200 text-xs sm:text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-xl h-10"
                disabled={savingPaciente}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingPaciente}
                className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 shadow-sm border border-[#DFBF8E]/40"
              >
                {savingPaciente ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar Paciente'
                )}
              </Button>{' '}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Consulta para o paciente selecionado */}
      <NovaConsultaModal
        open={consultaModalOpen}
        onOpenChange={setConsultaModalOpen}
        defaultPacienteId={selectedPacienteForConsulta}
        onSuccess={() => {
          fetchPacientesList()
        }}
      />

      {/* Modal Link de Pré-cadastro */}
      <ModalLinkPreCadastro open={linkPreCadastroOpen} onOpenChange={setLinkPreCadastroOpen} />

      {/* Modal Importar Pacientes da Planilha (Admin only) */}
      {isAdmin && (
        <ModalImportarPacientes
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onSuccess={() => {
            fetchPacientesList()
          }}
        />
      )}

      {/* Modal Importar Avaliação Planilha */}
      <ModalImportarAvaliacaoPlanilha
        open={importAvaliacaoModalOpen}
        onOpenChange={setImportAvaliacaoModalOpen}
        onSuccess={(res) => {
          fetchPacientesList()
          navigate(`/pacientes/${res.pacienteId}`)
        }}
      />
    </div>
  )
}
