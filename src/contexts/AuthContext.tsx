import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/types/database'
import {
  isGestorRole,
  isProfissionalRole,
  isSecretariaRole,
  normalizeRole,
  type AppRole,
} from '@/lib/roles'

interface AuthContextType {
  user: UserRecord | null
  token: string | null
  /** role normalizado: adm | admin | secretaria | profissional | professional */
  role: AppRole | null
  isLoading: boolean
  isAuthenticated: boolean
  /** ADM ou Secretária (acesso total). Inclui os e-mails master. */
  isAdmin: boolean
  isSecretaria: boolean
  /** Profissional com acesso limitado (inclui o legado 'professional'). */
  isProfissional: boolean
  isApproved: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const EMAILS_MASTER = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']

const isMasterEmail = (email?: string | null) => EMAILS_MASTER.includes((email || '').toLowerCase())

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(
    (pb.authStore.record as unknown as UserRecord) || null,
  )
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Initial check
    if (pb.authStore.isValid && pb.authStore.record) {
      setUser(pb.authStore.record as unknown as UserRecord)
      setToken(pb.authStore.token)
    } else {
      setUser(null)
      setToken(null)
    }
    setIsLoading(false)

    // Listen to store changes
    const unsubscribe = pb.authStore.onChange((tokenVal, model) => {
      setToken(tokenVal || null)
      setUser((model as unknown as UserRecord) || null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword(email, pass)
    const rec = authData.record as unknown as UserRecord

    // Se o usuário não for admin e seu access_status for pending ou suspended,
    // garantimos logout local caso chegue até aqui
    const status =
      isMasterEmail(rec.email) || isGestorRole(rec.role)
        ? 'approved'
        : rec.access_status || 'pending'
    if (status !== 'approved') {
      pb.authStore.clear()
      setUser(null)
      setToken(null)
      if (status === 'suspended') {
        throw new Error('Seu acesso está suspenso pela administração da Clínica SOUL.')
      }
      throw new Error('Sua conta aguarda aprovação da administração da clínica.')
    }

    setUser(rec)
    setToken(authData.token)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      try {
        const authData = await pb.collection('users').authRefresh()
        setUser(authData.record as unknown as UserRecord)
        setToken(authData.token)
      } catch {
        logout()
      }
    }
  }

  // E-mails master + perfis gestores (adm/admin legado + secretaria) = acesso total.
  // Usuários antigos criados antes da migration 0060 podem ter role vazio:
  // se access_status = approved e role não reconhecido, tratamos como gestor
  // para não travar ninguém que já usava o sistema.
  const role = normalizeRole(user?.role)
  const gestor = isMasterEmail(user?.email) || (user ? isGestorRole(user.role) : false)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin: gestor || (!role && !!user && user.access_status === 'approved'),
        isSecretaria: isSecretariaRole(user?.role),
        isProfissional: !!user && !gestor && isProfissionalRole(user.role),
        isApproved:
          isMasterEmail(user?.email) ||
          (user ? isGestorRole(user.role) : false) ||
          user?.access_status === 'approved',
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
