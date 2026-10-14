import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Search,
  User,
  ArrowRight,
  Loader2,
  CalendarCheck2,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getPacientes } from '@/services/pacientes'
import { getPacienteQuickLinks } from '@/services/quickLinks'
import { useAuth } from '@/contexts/AuthContext'
import type { PacienteRecord } from '@/types/database'
import { formatCPF, getInitials } from '@/lib/constants'

interface ModalAcessoRapidoEvolucaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPaciente?: (paciente: PacienteRecord) => void
}

export const ModalAcessoRapidoEvolucao: React.FC<ModalAcessoRapidoEvolucaoProps> = ({
  open,
  onOpenChange,
  onSelectPaciente,
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [navigatingId, setNavigatingId] = useState<string | null>(null)

  // Carrega lista inicial de pacientes recentes ao abrir
  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }

    let active = true
    const fetchIniciais = async () => {
      try {
        setLoading(true)
        const res = await getPacientes('status = "Ativo"', '-updated', 12, 1)
        if (active) {
          setPacientes(res.items)
        }
      } catch (err) {
        console.warn('Erro ao listar pacientes iniciais:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchIniciais()
    return () => {
      active = false
    }
  }, [open])

  // Busca debounced ao digitar pesquisa
  useEffect(() => {
    if (!open) return
    const term = query.trim()
    if (!term) return

    let active = true
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const filter = `(nome ~ "${term}" || cpf ~ "${term}" || email ~ "${term}")`
        const res = await getPacientes(filter, 'nome', 12, 1)
        if (active) {
          setPacientes(res.items)
        }
      } catch (err) {
        console.warn('Erro ao buscar pacientes:', err)
      } finally {
        if (active) setLoading(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, open])

  const handleIrParaEvolucao = async (paciente: PacienteRecord) => {
    if (onSelectPaciente) {
      onSelectPaciente(paciente)
    }
    setNavigatingId(paciente.id)
    try {
      // Resolve rota inteligente (se tiver avaliação, vai para a aba de evoluções do prontuário; senão aba de evoluções do perfil)
      const links = await getPacienteQuickLinks(paciente.id, user?.especialidade, true)
      onOpenChange(false)
      navigate(links.evolucao.url)
    } catch {
      // Fallback seguro: perfil do paciente na aba de evoluções com flag para abrir nova evolução direto
      onOpenChange(false)
      navigate(`/pacientes/${paciente.id}?tab=evolucoes&nova=1`)
    } finally {
      setNavigatingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col bg-white rounded-3xl border border-[#E9E1D2] p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-[#FAF7F1] to-white border-b border-[#E9E1D2]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <Activity className="h-5 w-5 text-emerald-700" />
            </span>
            <div>
              <DialogTitle className="font-serif font-bold text-lg text-[#4A322A]">
                Acesso Rápido a Evolução Clínica
              </DialogTitle>
              <DialogDescription className="text-xs text-[#73574A] mt-0.5">
                Selecione o paciente para abrir diretamente o histórico ou nova sessão SOAP.
              </DialogDescription>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C6527]/70 pointer-events-none" />
            <Input
              type="search"
              placeholder="Digite o nome, CPF ou e-mail do paciente..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="pl-10 pr-4 h-10 text-xs sm:text-sm bg-white border-[#E9E1D2] rounded-xl focus:border-[#C9A46A] focus:ring-1 focus:ring-[#C9A46A] shadow-2xs"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 min-h-[260px] max-h-[380px]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#73574A] px-1 mb-1">
            <span>
              {query.trim()
                ? `Resultados para "${query}" (${pacientes.length})`
                : 'Pacientes recentes e ativos:'}
            </span>
            <span className="text-[10px] text-gray-400">1 clique para registrar sessão</span>
          </div>

          {loading && pacientes.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#C9A46A]" />
              <span>Buscando pacientes...</span>
            </div>
          ) : pacientes.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <User className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-xs font-semibold text-[#4A322A]">Nenhum paciente encontrado</p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                Verifique se o nome ou CPF foi digitado corretamente ou cadastre o paciente.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  navigate('/pacientes')
                }}
                className="mt-2 text-xs rounded-xl border-[#E9E1D2] text-[#8C6527] hover:bg-[#FAF4EA]"
              >
                Abrir Lista de Pacientes
              </Button>
            </div>
          ) : (
            pacientes.map((p) => {
              const isThisNavigating = navigatingId === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => handleIrParaEvolucao(p)}
                  className="p-3 sm:p-3.5 rounded-2xl border border-gray-100 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-xs shrink-0 shadow-2xs">
                      <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                        {getInitials(p.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-[#33221C] group-hover:text-emerald-900 transition-colors truncate">
                        {p.nome}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono truncate">
                        {p.cpf ? `CPF: ${formatCPF(p.cpf)}` : p.email || 'Sem CPF cadastrado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] hidden sm:inline-flex bg-white/70 text-gray-600 border-gray-200"
                    >
                      {p.status}
                    </Badge>
                    <Button
                      size="sm"
                      disabled={isThisNavigating}
                      className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      {isThisNavigating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Activity className="h-3.5 w-3.5" />
                      )}
                      <span>Evoluir</span>
                      <ChevronRight className="h-3 w-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-3 bg-[#FAF7F1] border-t border-[#E9E1D2] flex items-center justify-between text-xs text-[#73574A] px-5">
          <span className="text-[11px]">
            💡 Funciona independente de haver avaliação ou prontuário prévio.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-gray-500 hover:text-gray-800 h-8"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
