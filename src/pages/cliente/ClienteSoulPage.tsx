import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { ClienteSoulLogin } from '@/pages/cliente/ClienteSoulLogin'
import { ClienteSoulApp } from '@/pages/cliente/ClienteSoulApp'

/**
 * Rota pública /cliente — app do Cliente Soul.
 * Autenticação independente do painel da clínica: autentica direto na coleção
 * users (conta com role 'cliente' criada pela clínica) e guarda a sessão em
 * sessionStorage separada, para não tocar no auth do app da clínica.
 */
const CHAVE_SESSAO = 'cliente_soul_auth'

export function ClienteSoulPage() {
  const [autenticado, setAutenticado] = useState(() => {
    return !!localStorage.getItem(CHAVE_SESSAO) && !!pb.authStore.isValid
  })

  useEffect(() => {
    const onChange = () => {
      setAutenticado(!!localStorage.getItem(CHAVE_SESSAO) && !!pb.authStore.isValid)
    }
    pb.authStore.onChange(onChange)
    return () => {
      // nothing extra
    }
  }, [])

  const aoEntrar = () => {
    localStorage.setItem(CHAVE_SESSAO, '1')
    setAutenticado(true)
  }

  const sair = () => {
    pb.authStore.clear()
    localStorage.removeItem(CHAVE_SESSAO)
    setAutenticado(false)
  }

  if (!autenticado) return <ClienteSoulLogin onEntrou={aoEntrar} />
  return (
    <div className="relative">
      <button
        onClick={sair}
        className="absolute top-4 right-4 z-50 rounded-full bg-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/30"
      >
        Sair
      </button>
      <ClienteSoulApp />
    </div>
  )
}

export default ClienteSoulPage
