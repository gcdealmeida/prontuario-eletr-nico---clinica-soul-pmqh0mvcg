import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HeartPulse, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Token de redefinição inválido ou expirado.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }
    if (password !== passwordConfirm) {
      setError('As senhas não conferem')
      return
    }

    try {
      setLoading(true)
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      toast({
        title: 'Senha redefinida com sucesso!',
        description: 'Você já pode acessar o sistema com sua nova senha.',
      })
      setTimeout(() => navigate('/'), 2500)
    } catch (err: any) {
      setError(err?.message || 'Erro ao redefinir senha. O link pode ter expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F5F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-[#E85C64] flex items-center justify-center text-white">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-xl font-black text-gray-900">SOUL Clínica</span>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-[#22C55E] mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">Senha alterada!</h3>
            <p className="text-sm text-gray-600">Redirecionando para a tela de login...</p>
            <Link to="/">
              <Button className="mt-4 w-full h-10 rounded-xl bg-gray-900 text-white">
                Ir para o Login
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nova Senha</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Digite e confirme sua nova senha de acesso.
            </p>

            {error && (
              <div className="mb-4 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            {!token && (
              <div className="mb-4 p-3 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl">
                Nenhum token encontrado na URL. Verifique o link enviado por e-mail.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Nova senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Confirmar nova senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !token}
                className="w-full h-11 bg-gradient-to-r from-[#E85C64] to-[#C9444C] text-white font-semibold rounded-xl shadow-md transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Definir nova senha'
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
