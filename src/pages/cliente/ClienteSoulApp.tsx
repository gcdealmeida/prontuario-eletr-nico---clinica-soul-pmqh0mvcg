import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  MessageCircleHeart,
  Sparkles,
  Stethoscope,
  Sun,
  UserRound,
  Utensils,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { carregarMeuPainel, type MeuPerfilSaude } from '@/services/saudeBemEstar'
import { ClienteDiarioEmocional } from '@/components/cliente/ClienteDiarioEmocional'
import { ClienteExamesDietas } from '@/components/cliente/ClienteExamesDietas'
import { ClienteHoje } from '@/components/cliente/ClienteHoje'
import { ClienteInsights } from '@/components/cliente/ClienteInsights'
import { ClienteMetricas } from '@/components/cliente/ClienteMetricas'
import { ClienteRefeicoesMedicacoes } from '@/components/cliente/ClienteRefeicoesMedicacoes'
import { ClientePerfil } from '@/components/cliente/ClientePerfil'
import {
  ModalRegistroMetrica,
  type ValoresRegistro,
} from '@/components/cliente/ModalRegistroMetrica'
import { LogoSoulHtr } from '@/components/cliente/LogoSoulHtr'
import { criarSaudeRegistro } from '@/services/saudeBemEstar'
import { NOME_APP_CLIENTE, NOME_APP_CLIENTE_CURTO } from '@/lib/soulHtrTheme'
import { cn } from '@/lib/utils'

export type AbaCliente =
  | 'hoje'
  | 'metricas'
  | 'refeicoes'
  | 'diario'
  | 'exames'
  | 'insights'
  | 'perfil'

const ABAS: { id: AbaCliente; label: string; curto: string; icone: typeof Sun }[] = [
  { id: 'hoje', label: 'Hoje', curto: 'Hoje', icone: Sun },
  { id: 'metricas', label: 'Métricas', curto: 'Métricas', icone: BarChart3 },
  { id: 'refeicoes', label: 'Refeições & Medicações', curto: 'Refeições', icone: Utensils },
  { id: 'diario', label: 'Diário', curto: 'Diário', icone: MessageCircleHeart },
  { id: 'exames', label: 'Exames & Dietas', curto: 'Exames', icone: Stethoscope },
  { id: 'insights', label: 'Insights', curto: 'Insights', icone: Sparkles },
  { id: 'perfil', label: 'Perfil', curto: 'Perfil', icone: UserRound },
]

function abaDaRota(h: string): AbaCliente {
  const ok = ABAS.some((a) => a.id === h)
  return ok ? (h as AbaCliente) : 'hoje'
}

export function ClienteSoulApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const aba = abaDaRota(location.hash.replace('#', ''))
  const [painel, setPainel] = useState<MeuPerfilSaude | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [tipoModal, setTipoModal] = useState<
    | 'atividade_fisica'
    | 'sono'
    | 'bebida'
    | 'refeicao'
    | 'medicacao'
    | 'emocao'
    | 'sintoma'
    | 'exame'
    | 'alimento'
  >('bebida')
  const [registroEdit, setRegistroEdit] = useState<ValoresRegistro | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const recarregar = useCallback(async () => {
    try {
      const p = await carregarMeuPainel()
      setPainel(p)
      setErro('')
    } catch {
      setErro('Não foi possível carregar seu painel. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar, reloadKey])

  const abrirRegistro = useCallback((tipo: Parameters<typeof setTipoModal>[0]) => {
    setRegistroEdit(null)
    setTipoModal(tipo)
    setModalAberto(true)
  }, [])

  const salvarRegistro = useCallback(
    async (valores: ValoresRegistro) => {
      if (!painel) return
      setSalvando(true)
      try {
        if (registroEdit) {
          // edição não usada ainda no fluxo do Hoje (apenas criar)
        }
        await criarSaudeRegistro({
          cliente_id: painel.cliente.id,
          tipo: valores.tipo,
          data: valores.data,
          observacao: valores.observacao,
          dados_json: valores.dados,
        })
        setModalAberto(false)
        setRegistroEdit(null)
        setReloadKey((k) => k + 1)
      } finally {
        setSalvando(false)
      }
    },
    [painel, registroEdit],
  )

  void pb

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      {/* Header fixo claro — logo à esquerda, abas ao lado, usuário à direita */}
      <header className="sticky top-0 z-40 border-b border-[#E2D4BF] bg-[#F5EFE6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-6">
          <LogoSoulHtr className="shrink-0" />
          <p className="sr-only">{NOME_APP_CLIENTE}</p>

          {/* Abas no header (desktop) */}
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {ABAS.map((a) => {
              const ativa = aba === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/cliente#${a.id}`)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm transition-colors',
                    ativa ? 'bg-[#7B4B2A] text-white' : 'text-[#7B4B2A] hover:bg-[#C9A063]/20',
                  )}
                >
                  {a.label}
                </button>
              )
            })}
          </nav>

          {/* Usuário à direita */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <span className="max-w-[140px] truncate text-sm font-medium text-[#5C3A21]">
              {painel?.cliente?.nome || 'Cliente'}
            </span>
            <button
              onClick={() => {
                pb.authStore.clear()
                localStorage.removeItem('cliente_soul_auth')
                window.location.reload()
              }}
              className="rounded-full border border-[#C9A063] px-3 py-1 text-xs text-[#7B4B2A] hover:bg-[#C9A063]/20"
            >
              Sair
            </button>
          </div>

          {/* Mobile: abreviação + sair */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <span className="text-xs font-semibold tracking-wide text-[#7B4B2A]">
              {NOME_APP_CLIENTE_CURTO}
            </span>
            <button
              onClick={() => {
                pb.authStore.clear()
                localStorage.removeItem('cliente_soul_auth')
                window.location.reload()
              }}
              className="rounded-full border border-[#C9A063] px-2.5 py-1 text-xs text-[#7B4B2A]"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Barra de abas scrollável (mobile) */}
        <nav className="flex gap-1.5 overflow-x-auto px-3 pb-2 lg:hidden">
          {ABAS.map((a) => {
            const ativa = aba === a.id
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/cliente#${a.id}`)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  ativa
                    ? 'bg-[#7B4B2A] text-white'
                    : 'border border-[#E2D4BF] bg-white text-[#7B4B2A]',
                )}
              >
                <a.icone className="h-3.5 w-3.5" />
                {a.curto}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
        {carregando && (
          <div className="flex min-h-[50vh] items-center justify-center text-[#8A6F58]">
            Carregando seu painel…
          </div>
        )}
        {!carregando && erro && (
          <div className="mx-auto max-w-md rounded-2xl border border-[#E2D4BF] bg-white p-6 text-center">
            <p className="font-medium text-[#5C3A21]">Erro ao carregar</p>
            <p className="mt-1 text-sm text-[#8A6F58]">{erro}</p>
            <button
              onClick={() => void recarregar()}
              className="mt-4 rounded-full bg-[#7B4B2A] px-4 py-2 text-sm text-white hover:bg-[#5C3A21]"
            >
              Tentar novamente
            </button>
          </div>
        )}
        {!carregando && !erro && painel && (
          <>
            {aba === 'hoje' && (
              <ClienteHoje
                painel={painel}
                aoAbrirRegistro={abrirRegistro}
                registroEdit={registroEdit}
                setRegistroEdit={setRegistroEdit}
              />
            )}
            {aba === 'metricas' && (
              <ClienteMetricas painel={painel} aoAbrirRegistro={abrirRegistro} />
            )}
            {aba === 'refeicoes' && (
              <ClienteRefeicoesMedicacoes painel={painel} aoAbrirRegistro={abrirRegistro} />
            )}
            {aba === 'diario' && (
              <ClienteDiarioEmocional painel={painel} aoAbrirRegistro={abrirRegistro} />
            )}
            {aba === 'exames' && (
              <ClienteExamesDietas painel={painel} aoAbrirRegistro={abrirRegistro} />
            )}
            {aba === 'insights' && <ClienteInsights painel={painel} />}
            {aba === 'perfil' && <ClientePerfil painel={painel} aoRecarregar={recarregar} />}
          </>
        )}
      </main>

      <ModalRegistroMetrica
        open={modalAberto}
        onOpenChange={setModalAberto}
        tipoInicial={tipoModal}
        registro={null}
        onSalvar={salvarRegistro}
      />
    </div>
  )
}

export default ClienteSoulApp
