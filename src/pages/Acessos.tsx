import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  Shield,
  Activity,
  Calendar,
  FileText,
  FileCheck2,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllUsers,
  getAccessLogs,
  manageUserAccess,
  getClinicalUpdateLogs,
} from '@/services/acessos'
import type {
  UserRecord,
  AccessLogRecord,
  AccessStatus,
  ClinicalUpdateLogRecord,
  ClinicalUpdateAction,
} from '@/types/database'
import { formatDataHoraPTBR, getInitials, ESPECIALIDADE_COLORS } from '@/lib/constants'
import { useRealtime } from '@/hooks/use-realtime'

/** Sub-abas válidas do painel de Acessos & Governança. */
export type AcessosSubTab = 'pendentes' | 'ativos' | 'suspensos' | 'atualizacoes' | 'historico'

export function isAcessosSubTab(v: string | null | undefined): v is AcessosSubTab {
  return (
    v === 'pendentes' ||
    v === 'ativos' ||
    v === 'suspensos' ||
    v === 'atualizacoes' ||
    v === 'historico'
  )
}

interface AcessosPanelProps {
  /**
   * Modo embutido (dentro da aba Acesso da Gestão): sem o cabeçalho grande
   * da tela antiga e sem ler/escrever a URL — o estado da sub-aba vem da prop.
   */
  embedded?: boolean
  /** Sub-aba ativa no modo embutido (controlado pelo pai via query ?sub=). */
  subTab?: AcessosSubTab
  onSubTabChange?: (tab: AcessosSubTab) => void
}

/**
 * Painel de Acessos & Governança — controle de acessos de profissionais,
 * atualizações clínicas (auditoria completa) e trilha de auditoria de acessos.
 * Usado como tela independente (rota /acessos) e embutido na aba Acesso da
 * Gestão da Clínica (/gestao?tab=acesso).
 */
export default function Acessos({
  embedded = false,
  subTab,
  onSubTabChange,
}: AcessosPanelProps = {}) {
  const { toast } = useToast()
  const { user: currentUser, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [users, setUsers] = useState<UserRecord[]>([])
  const [logs, setLogs] = useState<AccessLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<AcessosSubTab>(() => {
    if (subTab !== undefined) return subTab
    const tabParam = searchParams.get('tab')
    if (isAcessosSubTab(tabParam)) return tabParam
    return 'pendentes'
  })

  // No modo embutido a sub-aba é controlada pelo pai; no modo tela, pela URL.
  useEffect(() => {
    if (subTab !== undefined) setActiveTab(subTab)
  }, [subTab])

  const handleTabChange = (t: string) => {
    const next = t as AcessosSubTab
    if (onSubTabChange) {
      onSubTabChange(next)
      return
    }
    setActiveTab(next)
    const params = new URLSearchParams(searchParams)
    if (t === 'pendentes') params.delete('tab')
    else params.set('tab', t)
    setSearchParams(params, { replace: true })
  }

  // Estado da aba Atualizações Clínicas
  const [clinicalLogs, setClinicalLogs] = useState<ClinicalUpdateLogRecord[]>([])
  const [clinicalTotal, setClinicalTotal] = useState(0)
  const [clinicalTotalPages, setClinicalTotalPages] = useState(1)
  const [clinicalPage, setClinicalPage] = useState(1)
  const [clinicalLoading, setClinicalLoading] = useState(false)
  const [filterTipo, setFilterTipo] = useState<string>('Todos')
  const [filterEspecialidade, setFilterEspecialidade] = useState<string>('Todos')
  const [filterProfissional, setFilterProfissional] = useState<string>('Todos')
  const [clinicalSearch, setClinicalSearch] = useState('')

  // Modal de confirmação de ação
  const [modalAction, setModalAction] = useState<{
    open: boolean
    user: UserRecord | null
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete' | null
    reason: string
    especialidade: string
    submitting: boolean
  }>({
    open: false,
    user: null,
    action: null,
    reason: '',
    especialidade: 'Fisioterapia',
    submitting: false,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [uList, lList] = await Promise.all([getAllUsers(), getAccessLogs(150)])
      setUsers(uList)
      setLogs(lList)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar acessos',
        description: err?.message || 'Falha ao buscar usuários ou histórico.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadClinicalLogs = useCallback(
    async (page: number = 1) => {
      try {
        setClinicalLoading(true)
        const res = await getClinicalUpdateLogs(page, 20, {
          tipo_entidade: filterTipo,
          especialidade: filterEspecialidade,
          user_email: filterProfissional,
          search: clinicalSearch,
        })
        setClinicalLogs(res.items)
        setClinicalTotal(res.totalItems)
        setClinicalTotalPages(res.totalPages)
        setClinicalPage(page)
      } catch (err: any) {
        console.error('Erro ao buscar logs clínicos:', err)
      } finally {
        setClinicalLoading(false)
      }
    },
    [filterTipo, filterEspecialidade, filterProfissional, clinicalSearch],
  )

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadClinicalLogs(1)
  }, [loadClinicalLogs])

  // Realtime em clinical_update_logs
  useRealtime('clinical_update_logs', () => {
    loadClinicalLogs(clinicalPage)
  })

  // Filtragem dos usuários por busca
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.especialidade || '').toLowerCase().includes(q),
    )
  }, [users, searchTerm])

  const isMasterAccount = (email?: string, role?: string) => {
    const norm = (email || '').toLowerCase().trim()
    return norm === 'gcdealmeida@gmail.com' || norm === 'guivemax@hotmail.com' || role === 'admin'
  }

  // Separar usuários por status
  const pendentes = useMemo(() => {
    return filteredUsers.filter((u) => {
      if (isMasterAccount(u.email, u.role)) return false
      return u.access_status === 'pending' || !u.access_status
    })
  }, [filteredUsers])

  const ativos = useMemo(() => {
    return filteredUsers.filter((u) => {
      if (isMasterAccount(u.email, u.role)) return true
      return u.access_status === 'approved'
    })
  }, [filteredUsers])

  const suspensos = useMemo(() => {
    return filteredUsers.filter((u) => {
      if (isMasterAccount(u.email, u.role)) return false
      return u.access_status === 'suspended'
    })
  }, [filteredUsers])

  // Confirmação de ação
  const handleOpenConfirm = (
    u: UserRecord,
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete',
  ) => {
    setModalAction({
      open: true,
      user: u,
      action,
      reason: '',
      especialidade: u.especialidade || 'Fisioterapia',
      submitting: false,
    })
  }

  const handleExecuteAction = async () => {
    const { user: target, action, reason, especialidade } = modalAction
    if (!target || !action) return

    try {
      setModalAction((prev) => ({ ...prev, submitting: true }))
      const res = await manageUserAccess({
        target_user_id: target.id,
        action,
        reason: reason.trim() || undefined,
        especialidade: action === 'approve' ? especialidade : undefined,
      })

      toast({
        title: 'Operação realizada com sucesso!',
        description: res.message,
      })

      setModalAction({
        open: false,
        user: null,
        action: null,
        reason: '',
        especialidade: 'Fisioterapia',
        submitting: false,
      })

      // Recarrega lista
      await loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao processar ação',
        description: err?.message || 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
      setModalAction((prev) => ({ ...prev, submitting: false }))
    }
  }

  const getActionLabel = (action: string | null) => {
    switch (action) {
      case 'approve':
        return 'Aprovar Acesso'
      case 'reject':
        return 'Recusar Solicitação'
      case 'suspend':
        return 'Suspender Acesso'
      case 'reactivate':
        return 'Reativar Acesso'
      case 'delete':
        return 'Remover do Sistema'
      default:
        return 'Confirmar'
    }
  }

  const getActionDescription = (action: string | null, userName: string) => {
    switch (action) {
      case 'approve':
        return `Deseja liberar o acesso de "${userName}" ao sistema? O profissional poderá acessar prontuários e a agenda da Clínica SOUL.`
      case 'reject':
        return `Deseja recusar a solicitação de "${userName}"? A conta será mantida suspensa.`
      case 'suspend':
        return `Atenção: Ao suspender "${userName}", todas as sessões ativas do usuário serão imediatamente invalidadas no servidor.`
      case 'reactivate':
        return `Deseja reativar o acesso de "${userName}" para que ele volte a utilizar o sistema?`
      case 'delete':
        return `Atenção extrema: Deseja excluir definitivamente o cadastro de "${userName}"? Esta ação não pode ser desfeita.`
      default:
        return ''
    }
  }

  const getBadgeForStatus = (status?: AccessStatus, email?: string, role?: string) => {
    if (isMasterAccount(email, role)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF4EA] text-[#5C4033] border border-[#C9A46A]/50">
          <Shield className="h-3 w-3 text-[#C9A46A]" />{' '}
          {role === 'admin' ? 'Administrador' : 'Admin Mestre'}
        </span>
      )
    }

    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" /> Ativo
        </span>
      )
    }

    if (status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="h-3 w-3" /> Suspenso
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
        <Clock className="h-3 w-3" /> Pendente
      </span>
    )
  }

  const renderLogActionBadge = (action: string) => {
    switch (action) {
      case 'access_approved':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Acesso Aprovado</Badge>
      case 'access_rejected':
        return <Badge variant="destructive">Acesso Recusado</Badge>
      case 'access_suspended':
        return <Badge className="bg-red-600 hover:bg-red-700">Acesso Suspenso</Badge>
      case 'access_reactivated':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Acesso Reativado</Badge>
      case 'login_success':
        return (
          <Badge variant="outline" className="text-emerald-700 border-emerald-300">
            Login com Sucesso
          </Badge>
        )
      case 'login_blocked_pending':
        return (
          <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50">
            Bloqueado: Pendente
          </Badge>
        )
      case 'login_blocked_suspended':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            Bloqueado: Suspenso
          </Badge>
        )
      case 'signup_requested':
        return <Badge className="bg-[#4A322A] text-[#FAF4EA]">Novo Pedido</Badge>
      default:
        return <Badge variant="secondary">{action}</Badge>
    }
  }

  const renderClinicalActionBadge = (acao: ClinicalUpdateAction) => {
    switch (acao) {
      case 'assinar':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF4EA] text-[#8C6527] border border-[#C9A46A]/50">
            <FileCheck2 className="h-3 w-3 text-[#8C6527]" />
            Assinatura Oficial
          </span>
        )
      case 'concluir':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Conclusão
          </span>
        )
      case 'editar':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="h-3 w-3 text-blue-600" />
            Edição
          </span>
        )
      case 'evolucao_corretiva':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <History className="h-3 w-3 text-purple-600" />
            Evolução Corretiva
          </span>
        )
      case 'criar':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <FileText className="h-3 w-3 text-amber-600" />
            Criação
          </span>
        )
      case 'excluir':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <Trash2 className="h-3 w-3 text-red-600" />
            Exclusão
          </span>
        )
      default:
        return <Badge variant="secondary">{acao}</Badge>
    }
  }

  const renderEntityTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'avaliacao':
        return (
          <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-300">
            Avaliação
          </Badge>
        )
      case 'evolucao':
        return (
          <Badge
            variant="outline"
            className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            Evolução
          </Badge>
        )
      case 'prontuario':
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
            Prontuário
          </Badge>
        )
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  // Conteúdo compartilhado entre tela independente e modo embutido.
  const conteudoPainel = (
    <>
      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E1D2] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Fila de Pendentes</p>
            <p className="text-2xl font-bold font-serif text-amber-700 mt-1">{pendentes.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Aguardando sua autorização</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E1D2] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Profissionais Ativos</p>
            <p className="text-2xl font-bold font-serif text-emerald-700 mt-1">{ativos.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Com permissão clínica</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E1D2] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Acessos Suspensos</p>
            <p className="text-2xl font-bold font-serif text-red-700 mt-1">{suspensos.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Sessões bloqueadas</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
            <UserX className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Buscar profissional por nome, e-mail ou especialidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-white border-[#E9E1D2] rounded-2xl text-xs sm:text-sm focus:border-[#C9A46A] focus:ring-1 focus:ring-[#C9A46A]"
        />
      </div>

      {/* Abas Principais: Pendentes, Ativos, Histórico */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
        <TabsList className="bg-white border border-[#E9E1D2] rounded-2xl p-1.5 h-auto flex flex-wrap shadow-xs">
          <TabsTrigger
            value="pendentes"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-4 flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Pendentes
            {pendentes.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendentes.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="ativos"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-4 flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Ativos ({ativos.length})
          </TabsTrigger>

          <TabsTrigger
            value="suspensos"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-4 flex items-center gap-2"
          >
            <UserX className="h-4 w-4" />
            Suspensos ({suspensos.length})
          </TabsTrigger>

          <TabsTrigger
            value="atualizacoes"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-4 flex items-center gap-2"
          >
            <Activity className="h-4 w-4 text-[#C9A46A]" />
            Atualizações Clínicas ({clinicalTotal})
          </TabsTrigger>

          <TabsTrigger
            value="historico"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-4 flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Auditoria de Acessos ({logs.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENDENTES */}
        <TabsContent value="pendentes" className="space-y-4">
          {pendentes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E9E1D2] space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#4A322A]">
                Fila de aprovação vazia
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No momento não há novas solicitações de acesso pendentes. Novos profissionais
                cadastrados aparecerão aqui imediatamente para sua decisão.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendentes.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs hover:shadow-md transition-all space-y-4 ring-1 ring-amber-300/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                        <AvatarFallback className="font-bold text-sm">
                          {getInitials(u.name || u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#4A322A] truncate">
                          {u.name || 'Sem nome informado'}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    {getBadgeForStatus(u.access_status, u.email)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF7F1] p-2.5 rounded-xl text-gray-600 border border-[#E9E1D2]/80">
                    <div>
                      <span className="text-gray-400 block">Especialidade:</span>
                      <span className="font-medium text-[#4A322A]">
                        {u.especialidade || 'Não informada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Solicitado em:</span>
                      <span className="font-medium text-[#4A322A]">
                        {formatDataHoraPTBR(u.requested_at || u.created)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <Button
                      size="sm"
                      onClick={() => handleOpenConfirm(u, 'approve')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aprovar Acesso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenConfirm(u, 'reject')}
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold h-9 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ATIVOS */}
        <TabsContent value="ativos" className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E9E1D2] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F1] border-b border-[#E9E1D2] text-[#73574A] font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-5">Profissional</th>
                    <th className="p-3.5">Função</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Aprovado Em</th>
                    <th className="p-3.5">Último Acesso</th>
                    <th className="p-3.5 pr-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ativos.map((u) => {
                    const isMaster = isMasterAccount(u.email, u.role)
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-xl bg-[#FAF4EA] text-[#5C4033] border border-[#C9A46A]/30">
                              <AvatarFallback className="font-bold text-xs">
                                {getInitials(u.name || u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-[#4A322A]">{u.name || 'Sem nome'}</p>
                              <p className="text-[11px] text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium text-gray-700">
                          {u.especialidade || (isMaster ? 'Administrador Master' : 'Profissional')}
                        </td>
                        <td className="p-3.5">
                          {getBadgeForStatus(u.access_status, u.email, u.role)}
                        </td>
                        <td className="p-3.5 text-gray-600 text-[11px]">
                          {u.approved_at ? formatDataHoraPTBR(u.approved_at) : 'Inicial'}
                        </td>
                        <td className="p-3.5 text-gray-600 text-[11px]">
                          {u.last_login_at ? formatDataHoraPTBR(u.last_login_at) : '—'}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          {isMaster ? (
                            <span className="text-[11px] text-[#C9A46A] font-semibold italic">
                              Dono da Clínica
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenConfirm(u, 'suspend')}
                                className="h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs rounded-lg"
                                title="Suspender acesso e revogar sessões ativas"
                              >
                                <Lock className="h-3 w-3 mr-1" />
                                Suspender
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
        </TabsContent>

        {/* TAB 3: SUSPENSOS */}
        <TabsContent value="suspensos" className="space-y-4">
          {suspensos.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#E9E1D2] space-y-2">
              <p className="text-sm font-semibold text-[#4A322A]">
                Nenhum acesso suspenso no momento
              </p>
              <p className="text-xs text-gray-500">
                Profissionais com acesso suspenso ou recusado serão listados aqui.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E9E1D2] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F1] border-b border-[#E9E1D2] text-[#73574A] font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-5">Profissional</th>
                      <th className="p-3.5">Função</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Data do Cadastro</th>
                      <th className="p-3.5 pr-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {suspensos.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-xl bg-red-50 text-red-700 border border-red-200">
                              <AvatarFallback className="font-bold text-xs">
                                {getInitials(u.name || u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-[#4A322A]">{u.name || 'Sem nome'}</p>
                              <p className="text-[11px] text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-gray-600">{u.especialidade || '—'}</td>
                        <td className="p-3.5">
                          {getBadgeForStatus(u.access_status, u.email, u.role)}
                        </td>
                        <td className="p-3.5 text-gray-600 text-[11px]">
                          {formatDataHoraPTBR(u.created)}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenConfirm(u, 'reactivate')}
                              className="h-8 px-2.5 text-emerald-700 hover:bg-emerald-50 border-emerald-300 text-xs rounded-lg"
                            >
                              <Unlock className="h-3 w-3 mr-1" />
                              Reativar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenConfirm(u, 'delete')}
                              className="h-8 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remover definitivamente"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 4: ATUALIZAÇÕES CLÍNICAS (AUDITORIA COMPLETA DE EDIÇÕES) */}
        <TabsContent value="atualizacoes" className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#E9E1D2] shadow-xs space-y-4">
            {/* Header com filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E9E1D2]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#C9A46A]" />
                  <h3 className="font-serif font-bold text-base text-[#4A322A]">
                    Controle de Atualizações Clínicas
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Histórico empilhado cronologicamente de toda criação, edição ou assinatura em
                  avaliações, prontuários e evoluções.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadClinicalLogs(1)}
                  disabled={clinicalLoading}
                  className="h-9 border-[#E9E1D2] text-[#4A322A] hover:bg-[#FAF7F1] rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${clinicalLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Badge
                  variant="outline"
                  className="bg-[#FAF7F1] text-[#73574A] border-[#E9E1D2] text-xs"
                >
                  {clinicalTotal} registro(s)
                </Badge>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FAF7F1] p-3 rounded-2xl border border-[#E9E1D2]">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Tipo de Entidade:
                </label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="w-full text-xs h-9 bg-white border border-[#E9E1D2] rounded-xl px-2.5 focus:border-[#C9A46A] focus:outline-hidden"
                >
                  <option value="Todos">Todas as entidades</option>
                  <option value="avaliacao">Avaliações</option>
                  <option value="evolucao">Evoluções</option>
                  <option value="prontuario">Prontuários (Ficha)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Especialidade:
                </label>
                <select
                  value={filterEspecialidade}
                  onChange={(e) => setFilterEspecialidade(e.target.value)}
                  className="w-full text-xs h-9 bg-white border border-[#E9E1D2] rounded-xl px-2.5 focus:border-[#C9A46A] focus:outline-hidden"
                >
                  <option value="Todos">Todas as especialidades</option>
                  <option value="Fisioterapia">Fisioterapia</option>
                  <option value="Personal">Personal Trainer</option>
                  <option value="Nutrição">Nutrição</option>
                  <option value="Médico">Médico</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Profissional:
                </label>
                <select
                  value={filterProfissional}
                  onChange={(e) => setFilterProfissional(e.target.value)}
                  className="w-full text-xs h-9 bg-white border border-[#E9E1D2] rounded-xl px-2.5 focus:border-[#C9A46A] focus:outline-hidden truncate"
                >
                  <option value="Todos">Todos os profissionais</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Buscar no histórico:
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Paciente, autor, notas..."
                    value={clinicalSearch}
                    onChange={(e) => setClinicalSearch(e.target.value)}
                    className="pl-8 text-xs h-9 bg-white border-[#E9E1D2] rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Tabela de logs clínicos */}
            <div className="bg-white rounded-2xl border border-[#E9E1D2] overflow-hidden shadow-xs">
              {clinicalLoading ? (
                <div className="p-12 text-center text-xs text-gray-500 space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#C9A46A] mx-auto" />
                  <p>Carregando registros de auditoria clínica...</p>
                </div>
              ) : clinicalLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 space-y-2">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="font-semibold text-gray-700 text-sm">
                    Nenhuma atualização clínica encontrada
                  </p>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    Toda vez que uma avaliação for criada/editada, ou uma evolução for assinada, o
                    evento será gravado aqui automaticamente com nome, e-mail, horário e dia.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F1] border-b border-[#E9E1D2] text-[#73574A] font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3.5 pl-5">Horário e Dia</th>
                        <th className="p-3.5">Profissional (Quem Fez)</th>
                        <th className="p-3.5">Ação</th>
                        <th className="p-3.5">O Que Foi Alterado</th>
                        <th className="p-3.5">Paciente</th>
                        <th className="p-3.5 pr-5 text-right">Acesso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clinicalLogs.map((log) => {
                        const espStyle =
                          ESPECIALIDADE_COLORS[
                            log.especialidade as keyof typeof ESPECIALIDADE_COLORS
                          ] || ESPECIALIDADE_COLORS.Fisioterapia

                        let targetUrl = ''
                        if (log.tipo_entidade === 'avaliacao') {
                          targetUrl = `/prontuarios/${log.entidade_id}?esp=${encodeURIComponent(
                            log.especialidade || 'Fisioterapia',
                          )}`
                        } else if (log.tipo_entidade === 'evolucao') {
                          if (log.paciente_id) {
                            targetUrl = `/pacientes/${log.paciente_id}`
                          } else {
                            targetUrl = `/prontuarios`
                          }
                        } else if (log.tipo_entidade === 'prontuario') {
                          targetUrl = `/pacientes/${log.entidade_id}`
                        }

                        return (
                          <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="p-3.5 pl-5 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                              {formatDataHoraPTBR(log.created)}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 rounded-lg bg-[#FAF4EA] text-[#5C4033] border border-[#C9A46A]/30">
                                  <AvatarFallback className="font-bold text-[10px]">
                                    {getInitials(log.user_name || log.user_email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#4A322A] truncate">
                                    {log.user_name || 'Profissional'}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {log.user_email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              {renderClinicalActionBadge(log.acao)}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {renderEntityTypeBadge(log.tipo_entidade)}
                                {log.especialidade && (
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${espStyle.badge}`}
                                  >
                                    {log.especialidade}
                                  </span>
                                )}
                              </div>
                              {log.detalhes && (
                                <p
                                  className="text-[11px] text-gray-600 mt-1 line-clamp-1"
                                  title={log.detalhes}
                                >
                                  {log.detalhes}
                                </p>
                              )}
                            </td>
                            <td className="p-3.5">
                              <p className="font-medium text-[#4A322A] truncate max-w-xs">
                                {log.paciente_nome || 'Paciente SOUL'}
                              </p>
                              {log.paciente_id && (
                                <p className="text-[10px] text-gray-400 font-mono">
                                  ID: {log.paciente_id.slice(0, 8)}...
                                </p>
                              )}
                            </td>
                            <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                              {targetUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(targetUrl)}
                                  className="h-8 px-2.5 text-xs text-[#8C6527] hover:text-[#4A322A] hover:bg-[#FAF4EA] rounded-lg"
                                >
                                  Ver Registro <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginação */}
              {clinicalTotalPages > 1 && (
                <div className="p-3 bg-[#FAF7F1] border-t border-[#E9E1D2] flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Página {clinicalPage} de {clinicalTotalPages} ({clinicalTotal} registros no
                    total)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={clinicalPage <= 1 || clinicalLoading}
                      onClick={() => loadClinicalLogs(clinicalPage - 1)}
                      className="h-8 px-2.5 rounded-lg text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={clinicalPage >= clinicalTotalPages || clinicalLoading}
                      onClick={() => loadClinicalLogs(clinicalPage + 1)}
                      className="h-8 px-2.5 rounded-lg text-xs"
                    >
                      Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: HISTÓRICO & AUDITORIA DE ACESSOS */}
        <TabsContent value="historico" className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E9E1D2] overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FAF7F1] border-b border-[#E9E1D2] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#4A322A]">
                  Trilha de Auditoria de Acessos
                </h3>
                <p className="text-[11px] text-gray-500">
                  Registro de quem aprovou, suspendeu ou tentou logar no sistema.
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-white text-gray-700 border-[#E9E1D2]">
                {logs.length} eventos
              </Badge>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Nenhum evento de auditoria registrado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F1]/80 sticky top-0 border-b border-[#E9E1D2] text-[#73574A] font-semibold uppercase text-[10px] tracking-wider z-10 backdrop-blur-xs">
                    <tr>
                      <th className="p-3 pl-5">Data / Hora</th>
                      <th className="p-3">Evento</th>
                      <th className="p-3">Usuário Alvo</th>
                      <th className="p-3">Responsável (Ator)</th>
                      <th className="p-3 pr-5">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3 pl-5 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {formatDataHoraPTBR(log.created)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {renderLogActionBadge(log.action)}
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-[#4A322A]">
                            {log.user_name || log.user_email}
                          </p>
                          <p className="text-[10px] text-gray-400">{log.user_email}</p>
                        </td>
                        <td className="p-3 text-[11px] text-gray-600 whitespace-nowrap">
                          {log.actor_email || 'Sistema'}
                        </td>
                        <td
                          className="p-3 pr-5 text-[11px] text-gray-600 max-w-xs truncate"
                          title={log.details}
                        >
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação de Ação */}
      <Dialog
        open={modalAction.open}
        onOpenChange={(open) => {
          if (!open) {
            setModalAction({
              open: false,
              user: null,
              action: null,
              reason: '',
              especialidade: 'Fisioterapia',
              submitting: false,
            })
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-[#E9E1D2]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-serif text-lg text-[#4A322A]">
              {getActionLabel(modalAction.action)}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 leading-relaxed">
              {getActionDescription(
                modalAction.action,
                modalAction.user?.name || modalAction.user?.email || 'o profissional',
              )}
            </DialogDescription>
          </DialogHeader>

          {modalAction.action === 'approve' && (
            <div className="space-y-3 py-2 border-y border-gray-100 my-2">
              <div className="bg-[#FAF7F1] p-3 rounded-xl border border-[#E9E1D2] text-xs space-y-1">
                <p className="font-semibold text-[#4A322A]">
                  Papel atribuído: <span className="text-[#8C6527]">Profissional da Clínica</span>
                </p>
                <p className="text-gray-500">
                  O profissional terá acesso restrito aos seus pacientes, consultas, avaliações e
                  evoluções (sem acesso às métricas financeiras e relatórios gerais da clínica).
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="especialidade" className="text-xs font-semibold text-gray-700">
                  Confirmar Especialidade do Profissional:
                </label>
                <select
                  id="especialidade"
                  value={modalAction.especialidade}
                  onChange={(e) =>
                    setModalAction((prev) => ({ ...prev, especialidade: e.target.value }))
                  }
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#C9A46A]"
                >
                  <option value="Fisioterapia">Fisioterapia</option>
                  <option value="Personal">Personal</option>
                  <option value="Nutrição">Nutrição</option>
                  <option value="Médico">Médico</option>
                </select>
              </div>
            </div>
          )}

          {(modalAction.action === 'suspend' || modalAction.action === 'reject') && (
            <div className="space-y-1.5 py-2">
              <label htmlFor="reason" className="text-xs font-semibold text-gray-700">
                Motivo / Justificativa interna (opcional):
              </label>
              <Input
                id="reason"
                type="text"
                placeholder="Ex.: Solicitação encerrada, encerramento de vínculo..."
                value={modalAction.reason}
                onChange={(e) => setModalAction((prev) => ({ ...prev, reason: e.target.value }))}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={modalAction.submitting}
              onClick={() =>
                setModalAction({
                  open: false,
                  user: null,
                  action: null,
                  reason: '',
                  especialidade: 'Fisioterapia',
                  submitting: false,
                })
              }
              className="flex-1 rounded-xl text-xs h-10 border-[#E9E1D2]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={modalAction.submitting}
              onClick={handleExecuteAction}
              className={`flex-1 rounded-xl text-xs h-10 font-bold text-white ${
                modalAction.action === 'approve' || modalAction.action === 'reactivate'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {modalAction.submitting ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processando...
                </>
              ) : (
                getActionLabel(modalAction.action)
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  // Tela independente (rota /acessos): cabeçalho SOUL completo.
  if (!embedded) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
        {/* Header com identidade SOUL */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E9E1D2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#C9A46A]" />
              <span className="text-[11px] uppercase tracking-widest text-[#73574A] font-semibold">
                Painel de Governança & Segurança
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#4A322A] tracking-tight">
              Controle de Acessos Profissionais
            </h1>
            <p className="text-xs sm:text-sm text-[#73574A] max-w-2xl">
              Somente pessoas autorizadas por você podem visualizar e registrar prontuários de
              pacientes. Monitore solicitações, aprove novos profissionais e acompanhe a auditoria
              completa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
              className="h-10 border-[#E9E1D2] text-[#4A322A] hover:bg-[#FAF7F1] rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {conteudoPainel}
      </div>
    )
  }

  // Modo embutido (aba Acesso da Gestão): painel sem o cabeçalho duplicado.
  return <div className="space-y-6 pb-12 animate-fade-in">{conteudoPainel}</div>
}
