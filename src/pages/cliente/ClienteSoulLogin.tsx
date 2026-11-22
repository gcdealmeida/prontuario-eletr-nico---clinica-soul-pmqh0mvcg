import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { carregarMeuPainel, type MeuPerfilSaude } from '@/services/saudeBemEstar'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, Leaf, Loader2, Lock } from 'lucide-react'

/**
 * Login do Cliente Soul (rota pública /cliente).
 * Layout EXCLUSIVO — visual diferente do painel da clínica (verde/creme, sem
 * topbar administrativa). Conta criada pela clínica (usuário users com role
 * 'cliente'); autentica na coleção users e verifica o cadastro saude_clientes.
 */
export function ClienteSoulLogin({ onEntrou }: { onEntrou: () => void }) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    try {
      await pb.collection('users').authWithPassword(email.trim(), senha)
      onEntrou()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Não foi possível entrar',
        description: 'Verifique seu e-mail e senha. Se ainda não tem acesso, fale com a clínica.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF3EC] via-[#F6F1E7] to-[#FDFBF6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#3E7C59] mb-4">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#2C4A3B]">Cliente Soul</h1>
          <p className="text-sm text-[#5C7263] mt-1">Seu espaço de saúde e bem-estar</p>
        </div>

        <form
          onSubmit={entrar}
          className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 space-y-4 border border-[#3E7C59]/10"
        >
          <div className="space-y-1.5">
            <Label htmlFor="cliente-email" className="text-[#2C4A3B]">
              E-mail
            </Label>
            <Input
              id="cliente-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11 rounded-xl border-[#3E7C59]/20 focus-visible:ring-[#3E7C59]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cliente-senha" className="text-[#2C4A3B]">
              Senha
            </Label>
            <Input
              id="cliente-senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl border-[#3E7C59]/20 focus-visible:ring-[#3E7C59]"
            />
          </div>
          <Button
            type="submit"
            disabled={carregando}
            className="w-full h-11 rounded-xl bg-[#3E7C59] hover:bg-[#33684A] text-white font-medium"
          >
            {carregando ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Heart className="h-4 w-4 mr-2" />
            )}
            Entrar
          </Button>
          <p className="text-[11px] text-center text-[#5C7263] flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Acesso criado pela Clínica Soul. Dúvidas? Fale com a recepção.
          </p>
        </form>
      </div>
    </div>
  )
}

export default ClienteSoulLogin
