import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

export interface NavigationBlockerOptions {
  when: boolean
  message?: string
}

/**
 * Hook para interceptar navegação interna da SPA (rotas do React Router)
 * e fechamento/refresh da aba (evento beforeunload do navegador).
 */
export function useNavigationBlocker({
  when,
  message = 'Existem dados clínicos preenchidos e não salvos neste prontuário. Se você sair agora, as alterações não salvas serão perdidas. Deseja realmente sair da página?',
}: NavigationBlockerOptions) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const pendingProceedRef = useRef<(() => void) | null>(null)
  const pendingResetRef = useRef<(() => void) | null>(null)

  // 1. Interceptar beforeunload (fechamento de aba, F5, reload)
  useEffect(() => {
    if (!when) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Padrão de navegadores modernos
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [when, message])

  // 2. Interceptar navegação interna do React Router (useBlocker no RouterProvider)
  let blocker: any = null
  try {
    // BlockerFunction: deve bloquear apenas quando `when` for verdadeiro e a navegação mudar o pathname/search
    // eslint-disable-next-line react-hooks/rules-of-hooks
    blocker = useBlocker(({ currentLocation, nextLocation }) => {
      if (!when) return false
      // Se navegar para a mesmíssima URL completa, não precisa bloquear
      const currentFull = `${currentLocation.pathname}${currentLocation.search}`
      const nextFull = `${nextLocation.pathname}${nextLocation.search}`
      return currentFull !== nextFull
    })
  } catch (err) {
    // Se o componente for renderizado fora de um Data Router, useBlocker pode lançar exceção
    console.warn('[useNavigationBlocker] useBlocker indisponível:', err)
  }

  useEffect(() => {
    if (blocker?.state === 'blocked') {
      pendingProceedRef.current = () => blocker.proceed?.()
      pendingResetRef.current = () => blocker.reset?.()
      setDialogOpen(true)
    }
  }, [blocker?.state])

  const confirmLeave = () => {
    setDialogOpen(false)
    if (pendingProceedRef.current) {
      const fn = pendingProceedRef.current
      pendingProceedRef.current = null
      pendingResetRef.current = null
      fn()
    }
  }

  const cancelLeave = () => {
    setDialogOpen(false)
    if (pendingResetRef.current) {
      const fn = pendingResetRef.current
      pendingProceedRef.current = null
      pendingResetRef.current = null
      fn()
    }
  }

  return {
    isBlocked: dialogOpen,
    confirmLeave,
    cancelLeave,
    message,
  }
}
