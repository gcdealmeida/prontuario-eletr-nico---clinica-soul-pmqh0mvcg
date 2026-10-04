import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { LogoSOUL } from '@/components/LogoSOUL'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Informe seu e-mail')
      return
    }
    setError('')
    try {
      setLoading(true)
      await pb.collection('users').requestPasswordReset(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Erro ao solicitar redefinição de senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#FAF7F1] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E9E1D2] p-8 sm:p-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <LogoSOUL variant="compact" size="sm" theme="light" />
        </div>

        {sent ? (
          <div className="text-center py-4 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#22C55E]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Link de redefinição enviado!</h3>
            <p className="text-sm text-gray-600">
              Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá instruções para
              redefinir sua senha em instantes.
            </p>
            <Link to="/">
              <Button className="mt-4 w-full h-10 rounded-xl bg-gray-900 text-white">
                Voltar para o Login
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#4A322A]">Esqueceu sua senha?</h2>
            <p className="text-xs text-[#73574A] mt-1 mb-6">
              Informe seu e-mail cadastrado para receber o link seguro de recuperação de senha.
            </p>

            {error && (
              <div className="mb-4 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seuemail@soul.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border-gray-200"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl shadow-md transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  'Enviar link de redefinição'
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
