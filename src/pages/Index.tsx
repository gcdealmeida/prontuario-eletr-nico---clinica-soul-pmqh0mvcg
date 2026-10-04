import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HeartPulse,
  Eye,
  EyeOff,
  Loader2,
  Users,
  Calendar,
  Layers,
  Smile,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('guivemax@hotmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  // Erros por campo inline
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    let hasErr = false
    const newErrors: { email?: string; password?: string; general?: string } = {}

    if (!email.trim()) {
      newErrors.email = 'Informe seu e-mail'
      hasErr = true
    }
    if (!password) {
      newErrors.password = 'Informe sua senha'
      hasErr = true
    }

    if (hasErr) {
      setErrors(newErrors)
      return
    }

    try {
      setLoading(true)
      await login(email.trim(), password)
      toast({
        title: 'Bem-vindo(a) à clínica SOUL!',
        description: 'Login realizado com sucesso.',
      })
      navigate('/painel')
    } catch (err: any) {
      console.error('Login error:', err)
      const dataErrors = err?.data?.data
      if (dataErrors?.identity) {
        setErrors((prev) => ({ ...prev, email: dataErrors.identity.message }))
      } else if (dataErrors?.password) {
        setErrors((prev) => ({ ...prev, password: dataErrors.password.message }))
      } else {
        setErrors((prev) => ({
          ...prev,
          general: 'E-mail ou senha incorretos. Tente novamente ou use os dados de teste.',
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialMock = (provider: string) => {
    toast({
      title: `Login com ${provider}`,
      description:
        'Use o e-mail guivemax@hotmail.com / Skip@Pass para entrar diretamente no sistema.',
    })
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F5F2] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative floating blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#E85C64]/10 blur-3xl pointer-events-none animate-float" />
      <div
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#3B82F6]/10 blur-3xl pointer-events-none animate-float"
        style={{ animationDelay: '3s' }}
      />

      {/* Main card */}
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 transition-all">
        {/* Left Side: Brand Showcase (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#1E2530] via-[#242D3A] to-[#161C24] p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#E85C64]/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#3B82F6]/20 blur-2xl" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#E85C64] to-[#F97316] flex items-center justify-center shadow-lg">
                <HeartPulse className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white">SOUL</span>
                <span className="ml-1 text-xs uppercase tracking-widest text-[#E85C64] font-semibold">
                  Clínica
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-300 leading-relaxed">
              Gestão completa para sua clínica multi-especialidade. Avaliações clínicas, prontuários
              integrados e agenda inteligente.
            </p>
          </div>

          {/* 4 Mini Stat Cards */}
          <div className="relative z-10 grid grid-cols-2 gap-3 my-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="h-8 w-8 rounded-xl bg-[#E85C64]/20 flex items-center justify-center text-[#E85C64] mb-2">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-white">100%</div>
              <div className="text-[11px] text-gray-400">Pacientes Ativos</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="h-8 w-8 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] mb-2">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-white">Hoje</div>
              <div className="text-[11px] text-gray-400">Consultas & Fila</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="h-8 w-8 rounded-xl bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E] mb-2">
                <Layers className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-white">4 Áreas</div>
              <div className="text-[11px] text-gray-400">Especialidades</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="h-8 w-8 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] mb-2">
                <Smile className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-white">94%</div>
              <div className="text-[11px] text-gray-400">Satisfação Média</div>
            </div>
          </div>

          {/* Bottom security pill */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-gray-400 bg-white/5 py-2 px-3 rounded-xl border border-white/5">
            <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
            <span>Dados médicos em conformidade e criptografados</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#E85C64] to-[#F97316] flex items-center justify-center shadow-md">
                  <HeartPulse className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-black text-gray-900 tracking-tight">
                  SOUL Clínica
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h2>
              <p className="text-sm text-gray-500 mt-1">
                Acesse seu painel clínico de prontuários e avaliações.
              </p>
            </div>

            {/* General Error Banner */}
            {errors.general && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {errors.general}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                  E-mail profissional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@soul.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  className={`h-11 rounded-xl bg-gray-50/50 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200'}`}
                />
                {errors.email && <p className="text-xs text-red-600 font-medium">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pass" className="text-xs font-semibold text-gray-700">
                    Senha
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#E85C64] hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="pass"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                    className={`h-11 pr-10 rounded-xl bg-gray-50/50 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200'}`}
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

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(c) => setRememberMe(!!c)}
                    className="data-[state=checked]:bg-[#E85C64] border-gray-300"
                  />
                  <label
                    htmlFor="remember"
                    className="text-xs text-gray-600 cursor-pointer select-none"
                  >
                    Lembrar-me neste navegador
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-[#E85C64] to-[#C9444C] hover:opacity-95 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Social Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-medium">ou continue com</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialMock('Google')}
                className="h-10 rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-medium text-gray-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialMock('Microsoft')}
                className="h-10 rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-medium text-gray-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Microsoft
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialMock('GitHub')}
                className="h-10 rounded-xl border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-medium text-gray-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>

            {/* Links footer */}
            <div className="text-center space-y-2 pt-2 text-xs text-gray-500">
              <div>
                Ainda não tem conta?{' '}
                <Link to="/signup" className="font-semibold text-[#E85C64] hover:underline">
                  Criar conta
                </Link>
              </div>
              <div className="text-[11px] text-gray-400">
                Acesso de demonstração:{' '}
                <span className="font-mono text-gray-600">guivemax@hotmail.com</span> /{' '}
                <span className="font-mono text-gray-600">Skip@Pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
