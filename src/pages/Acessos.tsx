import { useState, useEffect, useMemo } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUsers, getAccessLogs, manageUserAccess } from '@/services/acessos'
import type { UserRecord, AccessLogRecord, AccessStatus } from '@/types/database'
import { formatDataHoraPTBR, getInitials } from '@/lib/constants'

export default function Acessos() {
  const { toast } = useToast()
  const { user: currentUser, isAdmin } = useAuth()

  const [users, setUsers] = useState<UserRecord[]>([])
  const [logs, setLogs] = useState<AccessLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pendentes')

  // Modal de confirmação de ação
  const [modalAction, setModalAction] = useState<{
    open: boolean
    user: UserRecord | null
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete' | null
    reason: string
    submitting: boolean
  }>({
    open: false,
    user: null,
    action: null,
    reason: '',
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

  useEffect(() => {
    loadData()
  }, [])

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
      submitting: false,
    })
  }

  const handleExecuteAction = async () => {
    const { user: target, action, reason } = modalAction
    if (!target || !action) return

    try {
      setModalAction((prev) => ({ ...prev, submitting: true }))
      const res = await manageUserAccess({
        target_user_id: target.id,
        action,
        reason: reason.trim() || undefined,
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

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#E9E1D2] space-y-4 max-w-md mx-auto my-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-serif font-bold text-[#4A322A]">
          Acesso Restrito ao Administrador
        </h2>
        <p className="text-xs text-gray-600">
          Esta página é exclusiva para a gestão e autorização de acessos profissionais da Clínica
          SOUL.
        </p>
      </div>
    )
  }

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
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
            value="historico"
            className="rounded-xl text-xs sm:text-sm font-semibold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] py-2 px-4 flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Histórico & Auditoria ({logs.length})
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

        {/* TAB 4: HISTÓRICO & AUDITORIA */}
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
    </div>
  )
}
