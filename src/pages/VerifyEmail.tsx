import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { LogoSOUL } from '@/components/LogoSOUL'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Token de validação não informado.')
      return
    }

    pb.collection('users')
      .confirmVerification(token)
      .then(() => {
        setSuccess(true)
        setLoading(false)
        setTimeout(() => navigate('/'), 3000)
      })
      .catch((err) => {
        setError(err?.message || 'Token inválido ou expirado.')
        setLoading(false)
      })
  }, [token, navigate])

  return (
    <div className="min-h-screen w-full bg-[#FAF7F1] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E9E1D2] p-8 text-center space-y-4">
        <div className="flex justify-center mb-2">
          <LogoSOUL variant="compact" size="md" theme="light" />
        </div>

        {loading ? (
          <div className="py-8 space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#C9A46A] mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">Validando seu e-mail...</h3>
            <p className="text-sm text-gray-500">Aguarde um instante.</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-[#22C55E] mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">E-mail verificado!</h3>
            <p className="text-sm text-gray-600">
              Sua conta está ativada com sucesso. Redirecionando para o login...
            </p>
            <Link to="/">
              <Button className="w-full h-10 rounded-xl bg-gradient-to-r from-[#C9A46A] to-[#B88E52] text-[#33221C] font-bold">
                Fazer login agora
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">Falha na verificação</h3>
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
