import { useNavigate } from 'react-router-dom'
import { Clock, ShieldAlert, ArrowLeft, RefreshCw, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoSOUL } from '@/components/LogoSOUL'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function AguardandoAprovacao() {
  const navigate = useNavigate()
  const { user, logout, refreshUser } = useAuth()
  const [checking, setChecking] = useState(false)

  const handleRefresh = async () => {
    try {
      setChecking(true)
      await refreshUser()
      // Se agora foi aprovado, navega para o painel
      if (user?.access_status === 'approved') {
        navigate('/painel')
      }
    } catch {
      // ignore
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isSuspended = user?.access_status === 'suspended'

  return (
    <div className="min-h-screen w-full bg-[#FAF7F1] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-[#C9A46A]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#B87355]/12 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#E9E1D2] p-8 sm:p-10 relative z-10 text-center space-y-6">
        {/* Logo SOUL oficial empilhado intacto */}
        <div className="flex justify-center mb-2 overflow-visible">
          <LogoSOUL variant="full" size="md" theme="light" className="overflow-visible" />
        </div>

        {isSuspended ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
                Acesso Suspenso
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#4A322A]">
                Acesso Temporariamente Suspenso
              </h2>
              <p className="text-sm text-[#73574A] leading-relaxed max-w-md mx-auto">
                O acesso desta conta à Clínica SOUL foi suspenso pela administração. Se você
                acredita que isso é um equívoco, entre em contato diretamente com o responsável.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                Aguardando Aprovação
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#4A322A]">
                Conta em Análise de Acesso
              </h2>
              <p className="text-sm text-[#73574A] leading-relaxed max-w-md mx-auto">
                Sua conta foi criada com sucesso, mas para proteger os prontuários e dados clínicos
                dos pacientes, o acesso depende da autorização da administração da{' '}
                <strong>Clínica SOUL</strong>.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F1] border border-[#E9E1D2] rounded-2xl text-left text-xs space-y-2 text-gray-700">
              <div className="flex items-center justify-between pb-2 border-b border-[#E9E1D2]">
                <span className="text-gray-500">Usuário conectado:</span>
                <span className="font-semibold text-[#4A322A]">{user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#E9E1D2]">
                <span className="text-gray-500">Função solicitada:</span>
                <span className="font-semibold text-[#4A322A]">
                  {user?.especialidade || 'Profissional'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status atual:</span>
                <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Pendente de liberação
                </span>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleRefresh}
            disabled={checking}
            variant="outline"
            className="flex-1 h-11 border-[#E9E1D2] text-[#4A322A] hover:bg-gray-50 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            Verificar se fui aprovado
          </Button>

          <Button
            onClick={handleLogout}
            className="flex-1 h-11 bg-[#4A322A] hover:bg-[#3D2922] text-[#FAF4EA] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Button>
        </div>

        <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-gray-400" />
          <span>
            Dúvidas ou urgências: <strong>guivemax@hotmail.com</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
