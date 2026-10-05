import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { LogoSOUL } from '@/components/LogoSOUL'

export default function Signup() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [especialidade, setEspecialidade] = useState<string>('Fisioterapia')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [signupSuccess, setSignupSuccess] = useState(false)

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
      // Create user in PocketBase (access_status='pending' é setado pelo hook do backend)
      await pb.collection('users').create({
        email: email.trim(),
        name: name.trim(),
        especialidade: especialidade || 'Fisioterapia',
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
        title: 'Solicitação de acesso enviada!',
        description: 'Verifique seu e-mail e aguarde a aprovação da administração.',
      })

      setSignupSuccess(true)
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
    <div className="min-h-screen w-full bg-[#FAF7F1] flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E9E1D2] p-8 sm:p-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Voltar para login"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <LogoSOUL variant="compact" size="sm" theme="light" />
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-serif font-bold text-[#4A322A]">Criar nova conta</h2>
          <p className="text-xs text-[#73574A] mt-1">
            Cadastre-se para gerenciar pacientes e prontuários clínicos.
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {errors.general}
          </div>
        )}

        {signupSuccess ? (
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-[#4A322A]">
                Solicitação Recebida com Sucesso!
              </h3>
              <p className="text-xs text-[#73574A] leading-relaxed">
                Por motivos de segurança e sigilo clínico, o acesso de novos profissionais precisa
                ser <strong>autorizado pela administração da Clínica SOUL</strong>.
              </p>
              <div className="p-3 bg-[#FAF7F1] border border-[#E9E1D2] rounded-xl text-left text-xs space-y-1.5 text-gray-700">
                <p className="flex items-center gap-1.5 font-medium text-[#4A322A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A46A]" />
                  Passos seguintes:
                </p>
                <p>
                  1. Verifique o link de confirmação enviado para <strong>{email}</strong>.
                </p>
                <p>2. O administrador da clínica receberá a notificação de acesso.</p>
                <p>3. Assim que aprovado, você poderá acessar todos os prontuários normalmente.</p>
              </div>
            </div>

            <Button
              onClick={() => navigate('/')}
              className="w-full h-11 bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl shadow-md transition-all"
            >
              Voltar para o Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
                Nome completo *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Dr(a). Maria Silva"
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
                placeholder="dra.maria@soul.com"
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
              <Label htmlFor="especialidade" className="text-xs font-semibold text-gray-700">
                Especialidade / Função Principal *
              </Label>
              <select
                id="especialidade"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl bg-gray-50/50 border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C9A46A]"
              >
                <option value="Fisioterapia">Fisioterapia</option>
                <option value="Personal">Personal Trainer / Ed. Física</option>
                <option value="Nutrição">Nutrição</option>
                <option value="Médico">Médico / Especialista</option>
                <option value="Geral">Recepção / Gestão Clínica</option>
              </select>
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
                  if (errors.passwordConfirm)
                    setErrors((prev) => ({ ...prev, passwordConfirm: '' }))
                }}
                className="h-10 rounded-xl bg-gray-50/50 border-gray-200"
              />
              {errors.passwordConfirm && (
                <p className="text-xs text-red-600 font-medium">{errors.passwordConfirm}</p>
              )}
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <span className="font-semibold">Política de Acesso Restrito:</span> O cadastro ficará
              em fila de aprovação e será liberado após a validação do administrador responsável
              pela Clínica SOUL.
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl shadow-md transition-all mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Solicitando acesso...
                </>
              ) : (
                'Solicitar Acesso Profissional'
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link
            to="/"
            className="font-semibold text-[#5C4033] hover:text-[#C9A46A] hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
