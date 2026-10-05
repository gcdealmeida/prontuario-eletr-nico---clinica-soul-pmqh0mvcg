import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Loader2,
  Users,
  Calendar,
  Layers,
  Smile,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { LogoSOUL } from '@/components/LogoSOUL'

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
    <div className="min-h-screen w-full bg-[#FAF7F1] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative floating blobs em dourado champagne e rosé */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-[#C9A46A]/15 blur-3xl pointer-events-none animate-float" />
      <div
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#B87355]/12 blur-3xl pointer-events-none animate-float"
        style={{ animationDelay: '3s' }}
      />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[#F0E3CC]/40 blur-2xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-[1020px] bg-white rounded-3xl shadow-xl border border-[#E9E1D2] overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 transition-all">
        {/* Left Side: Brand Showcase (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-[#4A322A] via-[#3D2922] to-[#2B1B15] p-8 text-white flex-col justify-between relative overflow-hidden border-r border-[#64473B]/30">
          <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-[#C9A46A]/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-[#B87355]/25 blur-2xl pointer-events-none" />

          {/* Top Logo Oficial */}
          <div className="relative z-10 flex flex-col items-center pt-2 text-center overflow-visible">
            <LogoSOUL variant="full" size="md" theme="dark" className="overflow-visible" />
            <p className="mt-5 text-xs text-[#FAF4EA]/80 leading-relaxed max-w-[280px]">
              Gestão clínica integrada multi-especialidade. Avaliações completas, prontuários
              eletrônicos e agenda inteligente em um só lugar.
            </p>
          </div>

          {/* 4 Mini Stat Cards adaptados para a paleta SOUL */}
          <div className="relative z-10 grid grid-cols-2 gap-3 my-6">
            <div className="bg-white/5 border border-[#C9A46A]/25 rounded-2xl p-3 backdrop-blur-sm">
              <div className="h-7 w-7 rounded-xl bg-[#C9A46A]/20 flex items-center justify-center text-[#E3C89A] mb-1.5">
                <Users className="h-3.5 w-3.5" />
              </div>
              <div className="text-base font-bold text-white">100%</div>
              <div className="text-[10px] text-[#E3C89A]">Pacientes Ativos</div>
            </div>

            <div className="bg-white/5 border border-[#C9A46A]/25 rounded-2xl p-3 backdrop-blur-sm">
              <div className="h-7 w-7 rounded-xl bg-[#B87355]/25 flex items-center justify-center text-[#D6957B] mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div className="text-base font-bold text-white">Hoje</div>
              <div className="text-[10px] text-[#E3C89A]">Agenda & Fila</div>
            </div>

            <div className="bg-white/5 border border-[#C9A46A]/25 rounded-2xl p-3 backdrop-blur-sm">
              <div className="h-7 w-7 rounded-xl bg-[#477A53]/30 flex items-center justify-center text-[#9FD4AB] mb-1.5">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="text-base font-bold text-white">4 Áreas</div>
              <div className="text-[10px] text-[#E3C89A]">Especialidades</div>
            </div>

            <div className="bg-white/5 border border-[#C9A46A]/25 rounded-2xl p-3 backdrop-blur-sm">
              <div className="h-7 w-7 rounded-xl bg-[#C9A46A]/20 flex items-center justify-center text-[#E3C89A] mb-1.5">
                <Smile className="h-3.5 w-3.5" />
              </div>
              <div className="text-base font-bold text-white">94%</div>
              <div className="text-[10px] text-[#E3C89A]">Satisfação Média</div>
            </div>
          </div>

          {/* Bottom security pill */}
          <div className="relative z-10 flex items-center gap-2 text-[11px] text-[#FAF4EA]/70 bg-black/20 py-2 px-3 rounded-xl border border-white/5">
            <ShieldCheck className="h-4 w-4 text-[#C9A46A] shrink-0" />
            <span>Prontuários seguros e em conformidade ética</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-[#FAF7F1]/30">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-6 overflow-visible">
                <LogoSOUL variant="full" size="sm" theme="light" className="overflow-visible" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C9A46A]" />
                <span className="text-[11px] uppercase tracking-widest text-[#73574A] font-semibold">
                  Acesso Profissional
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#4A322A] tracking-tight">
                Entrar na sua conta
              </h2>
              <p className="text-xs sm:text-sm text-[#73574A] mt-1">
                Acesse o painel clínico de prontuários, avaliações e agenda.
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
                    className="text-xs font-medium text-[#5C4033] hover:text-[#C9A46A] hover:underline transition-colors"
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
                    className="data-[state=checked]:bg-[#C9A46A] data-[state=checked]:border-[#C9A46A] border-[#D9C8BE]"
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
                className="w-full h-11 bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl shadow-md transition-all active:scale-[0.99] border border-[#DFBF8E]/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando...
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#33221C]" /> Entrar no Sistema
                  </span>
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
                <Link
                  to="/signup"
                  className="font-semibold text-[#5C4033] hover:text-[#C9A46A] hover:underline"
                >
                  Criar conta
                </Link>
              </div>
              <div className="text-[11px] text-gray-400">
                Acesso de demonstração:{' '}
                <span className="font-mono text-[#5C4033] font-semibold">guivemax@hotmail.com</span>{' '}
                / <span className="font-mono text-[#5C4033] font-semibold">Skip@Pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
