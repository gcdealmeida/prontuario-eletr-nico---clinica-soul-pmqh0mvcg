import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Activity, Stethoscope, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getPacienteQuickLinks, type PacienteQuickLinks } from '@/services/quickLinks'
import { useAuth } from '@/contexts/AuthContext'

interface PacienteAcoesRapidasProps {
  pacienteId: string
  pacienteNome: string
  compact?: boolean
  className?: string
}

export const PacienteAcoesRapidas: React.FC<PacienteAcoesRapidasProps> = ({
  pacienteId,
  pacienteNome,
  compact = false,
  className = '',
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [links, setLinks] = useState<PacienteQuickLinks | null>(null)
  const [loading, setLoading] = useState(false)
  const [navigatingAction, setNavigatingAction] = useState<string | null>(null)

  const ensureLinksLoaded = async () => {
    if (links) return links
    try {
      setLoading(true)
      const data = await getPacienteQuickLinks(pacienteId, user?.especialidade)
      setLinks(data)
      return data
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (
    tipo: 'avaliacao' | 'prontuario' | 'evolucao',
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    setNavigatingAction(tipo)
    try {
      let currentLinks = links
      if (!currentLinks) {
        currentLinks = await ensureLinksLoaded()
      }
      if (currentLinks) {
        navigate(currentLinks[tipo].url)
      } else {
        // Fallback imediato
        if (tipo === 'avaliacao') {
          navigate(`/prontuarios/novo?paciente=${pacienteId}`)
        } else if (tipo === 'evolucao') {
          navigate(`/pacientes/${pacienteId}?tab=evolucoes`)
        } else {
          navigate(`/pacientes/${pacienteId}?tab=avaliacoes`)
        }
      }
    } finally {
      setNavigatingAction(null)
    }
  }

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 ${className}`}
        onMouseEnter={() => {
          if (!links && !loading) {
            ensureLinksLoaded()
          }
        }}
      >
        {/* Atalho Avaliação */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => handleAction('avaliacao', e)}
              className="inline-flex items-center justify-center h-7 px-2 rounded-lg bg-amber-50/80 hover:bg-amber-100/90 text-[#8C6527] border border-amber-200/70 text-[11px] font-bold transition-all shadow-2xs active:scale-95"
            >
              {navigatingAction === 'avaliacao' ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Stethoscope className="h-3 w-3 mr-1 text-[#8C6527]" />
              )}
              Avaliação
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#1E2530] text-white">
            <p className="font-bold">
              {links?.avaliacao.tipo === 'existente'
                ? 'Abrir Avaliação mais recente'
                : 'Iniciar Nova Avaliação'}
            </p>
            <p className="text-[10px] text-gray-300">
              {pacienteNome}{' '}
              {links?.avaliacao.especialidade ? `(${links.avaliacao.especialidade})` : ''}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Atalho Prontuário */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => handleAction('prontuario', e)}
              className="inline-flex items-center justify-center h-7 px-2 rounded-lg bg-[#FAF4EA] hover:bg-[#F3EAD9] text-[#4A322A] border border-[#E3C89A]/60 text-[11px] font-bold transition-all shadow-2xs active:scale-95"
            >
              {navigatingAction === 'prontuario' ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <FileText className="h-3 w-3 mr-1 text-[#8C6527]" />
              )}
              Prontuário
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#1E2530] text-white">
            <p className="font-bold">Acessar Prontuário Oficial</p>
            <p className="text-[10px] text-gray-300">
              {links?.prontuario.sublabel || 'Fichas clínicas e histórico'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Atalho Evolução */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => handleAction('evolucao', e)}
              className="inline-flex items-center justify-center h-7 px-2 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all shadow-2xs active:scale-95"
            >
              {navigatingAction === 'evolucao' ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Activity className="h-3 w-3 mr-1 text-emerald-600" />
              )}
              Evolução
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-[#1E2530] text-white">
            <p className="font-bold">{links?.evolucao.label || 'Evolução Clínica'}</p>
            <p className="text-[10px] text-gray-300">
              {links?.evolucao.sublabel || 'Registrar / consultar sessões SOAP'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  // Versão expandida em botões de ação com ícones
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      onMouseEnter={() => {
        if (!links && !loading) {
          ensureLinksLoaded()
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => handleAction('avaliacao', e)}
            className="h-8 px-2 rounded-lg hover:bg-[#FAF4EA] text-[#8C6527] transition-all flex items-center gap-1 text-xs font-semibold"
          >
            {navigatingAction === 'avaliacao' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Stethoscope className="h-3.5 w-3.5" />
            )}
            <span className="hidden xl:inline">Avaliação</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs bg-[#1E2530] text-white">
          <p className="font-bold">
            {links?.avaliacao.tipo === 'existente'
              ? 'Abrir Avaliação mais recente'
              : 'Iniciar Nova Avaliação'}
          </p>
          <p className="text-[10px] text-gray-300">
            {pacienteNome}{' '}
            {links?.avaliacao.especialidade ? `(${links.avaliacao.especialidade})` : ''}
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => handleAction('prontuario', e)}
            className="h-8 px-2 rounded-lg hover:bg-gray-100 text-[#4A322A] transition-all flex items-center gap-1 text-xs font-semibold"
          >
            {navigatingAction === 'prontuario' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-[#5C4033]" />
            )}
            <span className="hidden xl:inline">Prontuário</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs bg-[#1E2530] text-white">
          <p className="font-bold">Acessar Prontuário</p>
          <p className="text-[10px] text-gray-300">
            {links?.prontuario.sublabel || 'Fichas clínicas e histórico'}
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => handleAction('evolucao', e)}
            className="h-8 px-2 rounded-lg hover:bg-emerald-50 text-emerald-800 transition-all flex items-center gap-1 text-xs font-semibold"
          >
            {navigatingAction === 'evolucao' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            ) : (
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className="hidden xl:inline">Evolução</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs bg-[#1E2530] text-white">
          <p className="font-bold">{links?.evolucao.label || 'Evolução Clínica'}</p>
          <p className="text-[10px] text-gray-300">
            {links?.evolucao.sublabel || 'Registrar / consultar sessões SOAP'}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
