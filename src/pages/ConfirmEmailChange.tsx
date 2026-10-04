import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HeartPulse, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Token de alteração de e-mail não informado.')
      return
    }

    pb.collection('users')
      .confirmEmailChange(token, '')
      .then(() => {
        setSuccess(true)
        setLoading(false)
        logout()
        toast({
          title: 'E-mail alterado com sucesso!',
          description: 'Por favor, faça login com seu novo e-mail.',
        })
        setTimeout(() => navigate('/'), 3000)
      })
      .catch((err) => {
        setError(err?.message || 'Token de alteração inválido ou expirado.')
        setLoading(false)
      })
  }, [token, navigate, logout, toast])

  return (
    <div className="min-h-screen w-full bg-[#F7F5F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center space-y-4">
        <div className="flex justify-center mb-2">
          <div className="h-10 w-10 rounded-2xl bg-[#E85C64] flex items-center justify-center text-white">
            <HeartPulse className="h-6 w-6" />
          </div>
        </div>

        {loading ? (
          <div className="py-8 space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#E85C64] mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">Confirmando alteração de e-mail...</h3>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-[#22C55E] mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">E-mail alterado com sucesso!</h3>
            <p className="text-sm text-gray-600">
              Sua sessão foi encerrada por segurança. Redirecionando para login...
            </p>
            <Link to="/">
              <Button className="w-full h-10 rounded-xl bg-gray-900 text-white">
                Fazer login agora
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">Falha ao confirmar</h3>
            <p className="text-sm text-gray-600">{error}</p>
            <Link to="/">
              <Button variant="outline" className="w-full h-10 rounded-xl">
                Voltar para o login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
