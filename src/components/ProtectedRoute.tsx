import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isGestorRole } from '@/lib/roles'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, isApproved, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF7F1]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
          <p className="text-sm text-[#73574A] font-medium">Carregando Clínica SOUL...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (!isApproved) {
    return <Navigate to="/aguardando-aprovacao" replace />
  }

  return <Outlet />
}

export function AdminOnlyRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF7F1]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/painel" replace />
  }

  return <Outlet />
}

export function GestorOnlyRoute() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF7F1]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (!isGestorRole(user?.role)) {
    return <Navigate to="/painel" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF7F1]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A46A]" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/painel" replace />
  }

  return children
}
