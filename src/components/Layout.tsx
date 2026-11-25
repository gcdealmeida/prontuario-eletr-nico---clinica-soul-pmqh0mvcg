import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  Calendar,
  FileText,
  BookOpen,
  Menu,
  X,
  Plus,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  CalendarCheck2,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { isGestorRole, isProfissionalRole } from '@/lib/roles'
import { getConsultasHoje } from '@/services/consultas'
import { NovaConsultaModal } from '@/components/NovaConsultaModal'
import { TopbarBuscaPaciente } from '@/components/TopbarBuscaPaciente'
import { ModalAcessoRapidoEvolucao } from '@/components/ModalAcessoRapidoEvolucao'
import { Activity } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { getInitials, formatDataHoraPTBR } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { LogoSOUL } from '@/components/LogoSOUL'
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications'
import type { NotificationRecord } from '@/types/database'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CheckCheck, ExternalLink, HeartPulse } from 'lucide-react'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const isGestor = isGestorRole(user?.role)
  const isProfissional = isProfissionalRole(user?.role)
  const navigate = useNavigate()
  const location = useLocation()

  // No Painel (/painel) o topbar fica clean: sem busca global nem botão de nova consulta
  const isPainel = location.pathname === '/painel'

  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [novaConsultaOpen, setNovaConsultaOpen] = useState(false)
  const [modalEvolucaoOpen, setModalEvolucaoOpen] = useState(false)
  const [consultasHojeCount, setConsultasHojeCount] = useState<number>(0)
  // Notificações in-app
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0)
  const [notifPopoverOpen, setNotifPopoverOpen] = useState<boolean>(false)

  const fetchConsultasCount = async () => {
    try {
      const res = await getConsultasHoje()
      setConsultasHojeCount(res.length)
    } catch {
      // ignore
    }
  }

  const fetchNotificationsData = async () => {
    try {
      const [list, count] = await Promise.all([getNotifications(20), getUnreadNotificationsCount()])
      setNotifications(list)
      setUnreadNotifsCount(count)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchConsultasCount()
    fetchNotificationsData()
  }, [])

  // Realtime em consultas e notifications
  useRealtime('consultas', () => {
    fetchConsultasCount()
  })

  useRealtime('notifications', () => {
    fetchNotificationsData()
  })

  useRealtime('clinical_update_logs', () => {
    fetchNotificationsData()
  })

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { name: 'Painel', path: '/painel', icon: Home },
    { name: 'Pacientes', path: '/pacientes', icon: Users },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    /* Painel administrativo de Presenças foi embutido na aba Presenças da
       Gestão (/gestao?tab=presencas) — item removido do menu lateral.
       O profissional segue com a visão individual em /presencas (fachada). */
    {
      name: 'Prontuários',
      path: '/prontuarios',
      icon: FileText,
      badge: consultasHojeCount > 0 ? consultasHojeCount : null,
    },
    {
      name: 'Programas de Exercícios',
      path: '/programas',
      icon: Dumbbell,
    },
    /* Saúde & Bem-Estar: ADM/Secretária veem todos os clientes com conta de
       saúde; Profissional vê apenas os clientes com vínculo ativo (a página
       aplica a restrição; regras do backend reforçam). */
    ...(isGestor || isProfissional
      ? [{ name: 'Saúde & Bem-Estar', path: '/saude-bem-estar', icon: HeartPulse }]
      : []),
    ...(isGestor ? [{ name: 'Gestão', path: '/gestao', icon: Settings2 }] : []),
    { name: 'Guia de Uso', path: '/guia', icon: BookOpen },
  ]

  const getPageTitle = () => {
    const path = location.pathname
    if (path.startsWith('/painel')) return 'Painel'
    if (path.startsWith('/pacientes/') && path !== '/pacientes') return 'Prontuário do Paciente'
    if (path.startsWith('/pacientes')) return 'Pacientes'
    if (path.startsWith('/agenda')) return 'Agenda de Consultas'
    // /presencas continua existindo como fachada (visão do profissional);
    // o título se mantém para ela e para /gestao?tab=presencas.
    if (path.startsWith('/presencas')) return 'Presença / Confirmação de Atendimentos'
    if (path.startsWith('/prontuarios/novo')) return 'Nova Avaliação Clínica'
    if (path.startsWith('/prontuarios/') && path !== '/prontuarios')
      return 'Visualização de Prontuário'
    if (path.startsWith('/programas/novo')) return 'Novo Programa de Exercícios'
    if (path.startsWith('/programas/') && path.endsWith('/cliente'))
      return 'Versão do Cliente - Programa'
    if (path.startsWith('/programas/') && path !== '/programas') return 'Programa de Acompanhamento'
    if (path.startsWith('/programas')) return 'Programas de Exercícios & Periodização'
    if (path.startsWith('/prontuarios')) return 'Prontuários'
    if (path.startsWith('/gestao')) return 'Gestão da Clínica'
    if (path.startsWith('/relatorios')) return 'Relatórios Clínicos'
    if (path.startsWith('/saude-bem-estar')) return 'Saúde & Bem-Estar'
    if (path.startsWith('/acessos')) return 'Acessos & Governança'
    if (path.startsWith('/guia')) return 'Guia de Uso & Ajuda'
    return 'Soul Clínica'
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1] flex flex-col antialiased text-[#33221C]">
      <div className="flex flex-1 relative overflow-hidden">
        {/* DESKTOP SIDEBAR (em marrom-café escuro #4A322A elegante com logo creme/dourado) */}
        <aside
          className={cn(
            'hidden lg:flex flex-col border-r border-[#5C4033]/30 bg-[#4A322A] text-[#FAF4EA] transition-all duration-300 z-30 fixed top-0 bottom-0 left-0 shadow-lg',
            collapsed ? 'w-[72px]' : 'w-[260px]',
          )}
        >
          {/* Logo & Collapse toggle */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#FAF4EA]/10">
            <div
              onClick={() => navigate('/painel')}
              className={cn(
                'flex items-center gap-2.5 cursor-pointer select-none transition-opacity hover:opacity-90',
                collapsed && 'justify-center w-full',
              )}
            >
              {collapsed ? (
                <LogoSOUL variant="symbol" size="xs" theme="dark" />
              ) : (
                <LogoSOUL variant="compact" size="sm" theme="dark" />
              )}
            </div>

            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="text-[#E3C89A]/70 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Recolher menu lateral"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <div className="flex justify-center py-2 border-b border-white/5">
              <button
                onClick={() => setCollapsed(false)}
                className="text-[#E3C89A]/70 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Expandir menu lateral"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                      isActive
                        ? 'bg-gradient-to-r from-[#C9A46A] to-[#B88E52] text-[#33221C] font-semibold shadow-sm'
                        : 'text-[#E3C89A]/80 hover:bg-white/10 hover:text-white',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-[#33221C]' : 'text-[#E3C89A]/70 group-hover:text-white',
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && item.badge !== null && item.badge !== undefined && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAF4EA] text-[#5C4033]">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== null && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C9A46A] ring-2 ring-[#4A322A]" />
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer User Info */}
          <div className="p-3 border-t border-white/10 bg-black/15">
            <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : '')}>
              <Avatar className="h-9 w-9 rounded-xl border border-[#C9A46A]/30 bg-[#5C4033] shrink-0">
                <AvatarFallback className="bg-[#C9A46A] text-[#33221C] font-bold text-xs">
                  {getInitials(user?.name || user?.email || 'Dr')}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Profissional SOUL'}
                  </p>
                  <p className="text-[11px] text-[#E3C89A]/70 truncate">
                    {user?.email || 'admin@soul.com'}
                  </p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={logout}
                  className="text-[#E3C89A]/70 hover:text-[#C9A46A] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  title="Sair do sistema"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
            {collapsed && (
              <button
                onClick={logout}
                className="w-full mt-2 flex justify-center text-[#E3C89A]/70 hover:text-[#C9A46A] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Sair do sistema"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-[#4A322A] text-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-250 border-r border-[#64473B]/40">
              <div className="relative pt-6 pb-5 px-5 border-b border-white/10 flex flex-col items-center text-center">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-4 right-4 text-[#E3C89A]/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Fechar menu"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
                <div
                  onClick={() => {
                    navigate('/painel')
                    setMobileMenuOpen(false)
                  }}
                  className="cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-95 flex flex-col items-center"
                  title="Ir para o Painel"
                >
                  <LogoSOUL variant="full" size="sm" theme="dark" className="overflow-visible" />
                </div>
              </div>

              <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-gradient-to-r from-[#C9A46A] to-[#B88E52] text-[#33221C] font-semibold shadow-sm'
                          : 'text-[#E3C89A]/80 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAF4EA] text-[#5C4033]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 rounded-xl bg-[#C9A46A] text-[#33221C]">
                    <AvatarFallback className="font-bold">
                      {getInitials(user?.name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.name || 'Profissional'}
                    </p>
                    <p className="text-[11px] text-[#E3C89A]/70 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-[#E3C89A]/70 hover:text-[#C9A46A] p-2 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN WRAPPER */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-300',
            collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]',
          )}
        >
          {/* STICKY TOPBAR */}
          <header className="sticky top-0 z-20 h-16 bg-[#FAF7F1]/95 backdrop-blur-md border-b border-[#E9E1D2] px-4 sm:px-8 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl text-[#5C4033] hover:bg-[#F0E3CC]/40 transition-colors"
                title="Abrir menu"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-[#4A322A] tracking-tight">
                {getPageTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Busca Global de Paciente com Dropdown Instantâneo & Atalhos Rápidos — oculta no Painel */}
              {!isPainel && <TopbarBuscaPaciente />}

              {/* Botão de Atalho Fixo Rápido de Evolução no Topbar */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalEvolucaoOpen(true)}
                className="hidden xl:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 text-xs font-bold transition-all shadow-2xs hover:scale-102 active:scale-98"
                title="Acesso rápido: registrar ou consultar evolução do paciente"
              >
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>Evolução</span>
              </Button>

              {/* Notificações in-app (Sino com popover e contagem de atualizações clínicas + consultas) */}
              <Popover open={notifPopoverOpen} onOpenChange={setNotifPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="relative p-2 rounded-xl text-[#5C4033] hover:bg-[#F0E3CC]/50 hover:text-[#33221C] transition-colors"
                    title={
                      unreadNotifsCount > 0
                        ? `${unreadNotifsCount} nova(s) atualização(ões) clínica(s)`
                        : `${consultasHojeCount} consultas hoje`
                    }
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifsCount > 0 ? (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                        {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                      </span>
                    ) : consultasHojeCount > 0 ? (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#B87355] text-[10px] font-bold text-white shadow-sm">
                        {consultasHojeCount}
                      </span>
                    ) : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-80 sm:w-96 p-0 bg-white border border-[#E9E1D2] rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="p-3.5 bg-[#FAF7F1] border-b border-[#E9E1D2] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#C9A46A]" />
                      <h4 className="font-serif font-bold text-sm text-[#4A322A]">
                        Notificações & Atualizações
                      </h4>
                      {unreadNotifsCount > 0 && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0">
                          {unreadNotifsCount} novas
                        </Badge>
                      )}
                    </div>
                    {unreadNotifsCount > 0 && (
                      <button
                        onClick={async () => {
                          await markAllNotificationsAsRead()
                          fetchNotificationsData()
                        }}
                        className="text-[11px] text-[#8C6527] hover:underline font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {/* Alerta de consultas hoje */}
                    {consultasHojeCount > 0 && (
                      <div
                        onClick={() => {
                          setNotifPopoverOpen(false)
                          navigate('/agenda')
                        }}
                        className="p-3 bg-amber-50/60 hover:bg-amber-50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-amber-900">Agenda do Dia</p>
                          <p className="text-[11px] text-amber-700">
                            Você tem {consultasHojeCount} consulta(s) programada(s) para hoje.
                          </p>
                        </div>
                      </div>
                    )}

                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500 space-y-1">
                        <Bell className="h-6 w-6 text-gray-300 mx-auto" />
                        <p className="font-medium text-gray-700">Nenhuma notificação clínica</p>
                        <p className="text-[11px] text-gray-400">
                          Edições em avaliações e evoluções assinadas aparecerão aqui em tempo real.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            if (!n.lida) {
                              await markNotificationAsRead(n.id)
                              fetchNotificationsData()
                            }
                            if (n.link) {
                              setNotifPopoverOpen(false)
                              navigate(n.link)
                            }
                          }}
                          className={cn(
                            'p-3 hover:bg-[#FAF7F1] transition-colors cursor-pointer flex items-start gap-3 text-left',
                            !n.lida ? 'bg-[#FAF4EA]/40' : 'bg-white',
                          )}
                        >
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full mt-1.5 shrink-0',
                              !n.lida ? 'bg-[#C9A46A]' : 'bg-transparent',
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-[#4A322A] truncate">
                                {n.titulo}
                              </p>
                              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                {formatDataHoraPTBR(n.created)}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                              {n.descricao}
                            </p>
                            {n.link && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#8C6527] font-semibold mt-1 hover:underline">
                                Ver registro <ExternalLink className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {isAdmin && (
                    <div className="p-2.5 bg-[#FAF7F1] border-t border-[#E9E1D2] text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNotifPopoverOpen(false)
                          navigate('/gestao?tab=acesso&sub=atualizacoes')
                        }}
                        className="w-full text-xs font-semibold text-[#4A322A] hover:text-[#8C6527] h-8"
                      >
                        Ver Histórico Completo de Atualizações →
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Nova Consulta Primary Button em dourado SOUL — oculto no Painel */}
              {!isPainel && (
                <Button
                  onClick={() => setNovaConsultaOpen(true)}
                  className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-semibold shadow-sm rounded-xl h-9 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-1.5 transition-transform active:scale-98 border border-[#DFBF8E]/40"
                >
                  <Plus className="h-4 w-4 text-[#33221C]" />
                  <span className="hidden sm:inline">Nova Consulta</span>
                  <span className="sm:hidden">Consulta</span>
                </Button>
              )}
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto pb-24 md:pb-12 animate-fade-in">
            <Outlet />
          </main>

          {/* FOOTER */}
          <footer className="py-4 border-t border-[#E9E1D2] bg-[#FAF7F1] text-center text-xs text-[#73574A]">
            © {new Date().getFullYear()} Clínica SOUL — Saúde e Bem-Estar · v0.0.85 · Avaliações &
            Prontuários
          </footer>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR (below 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FAF7F1] border-t border-[#E9E1D2] z-40 px-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors relative',
                isActive ? 'text-[#8C6527] font-bold' : 'text-[#73574A] hover:text-[#4A322A]',
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px] text-[#8C6527]')} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 h-3.5 min-w-3.5 px-0.5 rounded-full bg-[#B87355] text-[9px] font-bold text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1">{item.name}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Modal Nova Consulta Global */}
      <NovaConsultaModal
        open={novaConsultaOpen}
        onOpenChange={setNovaConsultaOpen}
        onSuccess={() => {
          fetchConsultasCount()
        }}
      />

      {/* Modal Global de Acesso Rápido a Evolução */}
      <ModalAcessoRapidoEvolucao open={modalEvolucaoOpen} onOpenChange={setModalEvolucaoOpen} />
    </div>
  )
}
