import { useState } from 'react'
import { Loader2, Lock, Mail } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { LogoSoulHtr } from '@/components/cliente/LogoSoulHtr'
import { NOME_APP_CLIENTE } from '@/lib/soulHtrTheme'

interface Props {
  onEntrou: () => void
}

/**
 * Tela de login do app do Cliente Soul (/cliente) — autentica na coleção users
 * (conta com role 'cliente' criada pela clínica). Mesma lógica de antes, apenas
 * re-estilizada na paleta SOUL (bege claro + marrons + dourado).
 */
export function ClienteSoulLogin({ onEntrou }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await pb.collection('users').authWithPassword(email.trim(), senha)
      onEntrou()
    } catch {
      setErro('E-mail ou senha incorretos. Verifique e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5EFE6] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <LogoSoulHtr />
          <p className="mt-4 text-center text-sm text-[#8A6F58]">{NOME_APP_CLIENTE}</p>
        </div>

        <form
          onSubmit={entrar}
          className="space-y-4 rounded-3xl border border-[#E2D4BF] bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="cliente-email" className="mb-1 block text-sm text-[#5C3A21]">
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A063]" />
              <input
                id="cliente-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-[#E2D4BF] bg-[#F5EFE6]/50 py-2.5 pl-9 pr-3 text-sm text-[#5C3A21] placeholder:text-[#C9B79E] focus:border-[#C9A063] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cliente-senha" className="mb-1 block text-sm text-[#5C3A21]">
              Senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A063]" />
              <input
                id="cliente-senha"
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#E2D4BF] bg-[#F5EFE6]/50 py-2.5 pl-9 pr-3 text-sm text-[#5C3A21] placeholder:text-[#C9B79E] focus:border-[#C9A063] focus:outline-none"
              />
            </div>
          </div>

          {erro && (
            <p className="rounded-xl bg-[#B0714F]/10 px-3 py-2 text-sm text-[#B0714F]">{erro}</p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#7B4B2A] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5C3A21] disabled:opacity-60"
          >
            {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </button>

          <p className="text-center text-xs text-[#A98D74]">
            Acesso exclusivo de clientes da Clínica Soul. Em caso de dúvida, fale com a clínica.
          </p>
        </form>
      </div>
    </div>
  )
}

export default ClienteSoulLogin
