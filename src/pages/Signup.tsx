import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function Signup() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Informe seu nome completo'
    if (!email.trim()) newErrors.email = 'Informe seu e-mail'
    if (password.length < 8) newErrors.password = 'A senha deve ter no mínimo 8 caracteres'
    if (password !== passwordConfirm) newErrors.passwordConfirm = 'As senhas não coincidem'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setLoading(true)
      // Create user in PocketBase
      await pb.collection('users').create({
        email: email.trim(),
        name: name.trim(),
        password,
        passwordConfirm,
      })

      // Request verification email
      try {
        await pb.collection('users').requestVerification(email.trim())
      } catch {
        // Verification email request is best-effort
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu e-mail para ativar sua conta ou faça login.',
      })

      navigate('/')
    } catch (err: any) {
      const dataErrors = err?.data?.data
      if (dataErrors?.email) {
        setErrors((prev) => ({ ...prev, email: dataErrors.email.message }))
      } else if (dataErrors?.password) {
        setErrors((prev) => ({ ...prev, password: dataErrors.password.message }))
      } else {
        setErrors((prev) => ({
          ...prev,
          general: err?.message || 'Erro ao criar conta. Tente novamente.',
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F5F2] flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Voltar para login"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#E85C64] to-[#F97316] flex items-center justify-center shadow-md">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900">SOUL Clínica</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Criar nova conta</h2>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre-se para gerenciar pacientes e prontuários clínicos.
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
              Nome completo *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Dr. João Silva"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
              }}
              className="h-10 rounded-xl bg-gray-50/50 border-gray-200"
            />
            {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
              E-mail profissional *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="drjoao@soul.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
              }}
              className="h-10 rounded-xl bg-gray-50/50 border-gray-200"
            />
            {errors.email && <p className="text-xs text-red-600 font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
              Senha (mínimo 8 caracteres) *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                }}
                className="h-10 pr-10 rounded-xl bg-gray-50/50 border-gray-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 font-medium">{errors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-gray-700">
              Confirmar senha *
            </Label>
            <Input
              id="passwordConfirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value)
                if (errors.passwordConfirm) setErrors((prev) => ({ ...prev, passwordConfirm: '' }))
              }}
              className="h-10 rounded-xl bg-gray-50/50 border-gray-200"
            />
            {errors.passwordConfirm && (
              <p className="text-xs text-red-600 font-medium">{errors.passwordConfirm}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#E85C64] to-[#C9444C] hover:opacity-95 text-white font-semibold rounded-xl shadow-md transition-all mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/" className="font-semibold text-[#E85C64] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
