import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/types/database'

interface AuthContextType {
  user: UserRecord | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isApproved: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
    const isMaster = (rec.email || '').toLowerCase() === 'guivemax@hotmail.com'
    const status = isMaster ? 'approved' : rec.access_status || 'pending'
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin:
          (user?.email || '').toLowerCase() === 'guivemax@hotmail.com' || user?.role === 'admin',
        isApproved:
          (user?.email || '').toLowerCase() === 'guivemax@hotmail.com' ||
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
