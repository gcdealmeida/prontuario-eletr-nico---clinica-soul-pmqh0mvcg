import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Menu,
  X,
  Plus,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { getConsultasHoje } from '@/services/consultas'
import { NovaConsultaModal } from '@/components/NovaConsultaModal'
import { useRealtime } from '@/hooks/use-realtime'
import { getInitials } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [novaConsultaOpen, setNovaConsultaOpen] = useState(false)
  const [consultasHojeCount, setConsultasHojeCount] = useState<number>(0)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const fetchConsultasCount = async () => {
    try {
      const res = await getConsultasHoje()
      setConsultasHojeCount(res.length)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchConsultasCount()
  }, [])

  // Realtime em consultas
  useRealtime('consultas', () => {
    fetchConsultasCount()
  })

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { name: 'Painel', path: '/painel', icon: Home },
    { name: 'Pacientes', path: '/pacientes', icon: Users },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    {
      name: 'Prontuários',
      path: '/prontuarios',
      icon: FileText,
      badge: consultasHojeCount > 0 ? consultasHojeCount : null,
    },
    { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
  ]

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) {
      navigate(`/pacientes?busca=${encodeURIComponent(globalSearch.trim())}`)
    }
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path.startsWith('/painel')) return 'Painel'
    if (path.startsWith('/pacientes/') && path !== '/pacientes') return 'Prontuário do Paciente'
    if (path.startsWith('/pacientes')) return 'Pacientes'
    if (path.startsWith('/agenda')) return 'Agenda de Consultas'
    if (path.startsWith('/prontuarios/novo')) return 'Nova Avaliação Clínica'
    if (path.startsWith('/prontuarios/') && path !== '/prontuarios')
      return 'Visualização de Prontuário'
    if (path.startsWith('/prontuarios')) return 'Prontuários & Avaliações'
    if (path.startsWith('/relatorios')) return 'Relatórios Clínicos'
    return 'Soul Clínica'
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col antialiased text-[#1F2937]">
      <div className="flex flex-1 relative overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={cn(
            'hidden lg:flex flex-col border-r border-[#E5E0D8] bg-[#1E2530] text-white transition-all duration-300 z-30 fixed top-0 bottom-0 left-0',
            collapsed ? 'w-[72px]' : 'w-[260px]',
          )}
        >
          {/* Logo & Collapse toggle */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            <div
              onClick={() => navigate('/painel')}
              className={cn(
                'flex items-center gap-2.5 cursor-pointer select-none transition-opacity hover:opacity-90',
                collapsed && 'justify-center w-full',
              )}
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#E85C64] to-[#F97316] flex items-center justify-center shadow-md">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                    SOUL{' '}
                    <span className="text-xs font-normal text-[#E85C64] uppercase tracking-wider">
                      Clínica
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-400 -mt-1 font-medium">
                    Avaliações & Prontuários
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
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
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
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
                        ? 'bg-gradient-to-r from-[#E85C64] to-[#C9444C] text-white shadow-sm'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && item.badge !== null && item.badge !== undefined && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-[#C9444C]">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== null && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E85C64] ring-2 ring-[#1E2530]" />
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer User Info */}
          <div className="p-3 border-t border-white/10 bg-black/10">
            <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : '')}>
              <Avatar className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 shrink-0">
                <AvatarFallback className="bg-[#E85C64] text-white font-semibold text-xs">
                  {getInitials(user?.name || user?.email || 'Dr')}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Profissional SOUL'}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {user?.email || 'admin@soul.com'}
                  </p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-[#E85C64] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  title="Sair do sistema"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
            {collapsed && (
              <button
                onClick={logout}
                className="w-full mt-2 flex justify-center text-gray-400 hover:text-[#E85C64] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
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
            <div className="fixed inset-y-0 left-0 w-[280px] bg-[#1E2530] text-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-250">
              <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#E85C64] to-[#F97316] flex items-center justify-center">
                    <HeartPulse className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-white tracking-tight">
                      SOUL Clínica
                    </span>
                    <p className="text-[10px] text-gray-400">Avaliações & Prontuários</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
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
                          ? 'bg-gradient-to-r from-[#E85C64] to-[#C9444C] text-white shadow-sm'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-[#C9444C]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 rounded-xl bg-[#E85C64] text-white">
                    <AvatarFallback>{getInitials(user?.name || user?.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.name || 'Profissional'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-[#E85C64] p-2 rounded-lg"
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
          <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8] px-4 sm:px-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                title="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search input (expand on focus) */}
              <form onSubmit={handleGlobalSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Buscar paciente, especialidade..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={cn(
                    'pl-9 pr-3 h-9 text-xs sm:text-sm bg-gray-50 border-gray-200 rounded-xl transition-all duration-300 focus:bg-white focus:border-[#E85C64] focus:ring-1 focus:ring-[#E85C64]',
                    searchFocused ? 'w-48 sm:w-72' : 'w-36 sm:w-56',
                  )}
                />
              </form>

              {/* Notification bell with badge count for today's appointments */}
              <button
                onClick={() => navigate('/agenda')}
                className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title={`${consultasHojeCount} consultas hoje`}
              >
                <Bell className="h-5 w-5" />
                {consultasHojeCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#E85C64] text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {consultasHojeCount}
                  </span>
                )}
              </button>

              {/* Nova Consulta Primary Button */}
              <Button
                onClick={() => setNovaConsultaOpen(true)}
                className="bg-gradient-to-r from-[#E85C64] to-[#C9444C] hover:opacity-95 text-white font-medium shadow-sm rounded-xl h-9 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-1.5 transition-transform active:scale-98"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Consulta</span>
                <span className="sm:hidden">Consulta</span>
              </Button>
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto pb-24 md:pb-12 animate-fade-in">
            <Outlet />
          </main>

          {/* FOOTER */}
          <footer className="py-4 border-t border-[#E5E0D8] bg-white text-center text-xs text-gray-500">
            © 2025 Soul Clínica — Sistema de Avaliação e Prontuários
          </footer>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR (below 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 px-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors relative',
                isActive ? 'text-[#E85C64]' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 h-3.5 min-w-3.5 px-0.5 rounded-full bg-[#E85C64] text-[9px] font-bold text-white flex items-center justify-center">
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
    </div>
  )
}
