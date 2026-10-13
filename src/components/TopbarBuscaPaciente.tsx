import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  User,
  Stethoscope,
  FileText,
  Activity,
  ArrowRight,
  Loader2,
  X,
  Calendar,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getPacientes } from '@/services/pacientes'
import type { PacienteRecord } from '@/types/database'
import { formatCPF, getInitials } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { PacienteAcoesRapidas } from './PacienteAcoesRapidas'

interface TopbarBuscaPacienteProps {
  className?: string
}

export const TopbarBuscaPaciente: React.FC<TopbarBuscaPacienteProps> = ({ className = '' }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<PacienteRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce da busca (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  // Busca instantânea quando query >= 2 letras
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let active = true
    const search = async () => {
      try {
        setLoading(true)
        const filter = `(nome ~ "${debouncedQuery}" || cpf ~ "${debouncedQuery}" || email ~ "${debouncedQuery}")`
        const res = await getPacientes(filter, 'nome', 6, 1)
        if (active) {
          setResults(res.items)
          setIsOpen(true)
        }
      } catch (err) {
        console.warn('Erro ao buscar pacientes no topbar:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    search()
    return () => {
      active = false
    }
  }, [debouncedQuery])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Enter navega para perfil ou para lista de pacientes com filtro
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length === 1) {
        setIsOpen(false)
        navigate(`/pacientes/${results[0].id}`)
      } else if (query.trim()) {
        setIsOpen(false)
        navigate(`/pacientes?busca=${encodeURIComponent(query.trim())}`)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C6527]/70 pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar paciente, avaliação, prontuário..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim().length >= 2) {
              setIsOpen(true)
            }
          }}
          onFocus={() => {
            setIsFocused(true)
            if (query.trim().length >= 2) {
              setIsOpen(true)
            }
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className={cn(
            'pl-9 pr-8 h-9 text-xs sm:text-sm bg-white border-[#E9E1D2] rounded-xl transition-all duration-300 focus:bg-white focus:border-[#C9A46A] focus:ring-1 focus:ring-[#C9A46A]',
            isFocused || query ? 'w-56 sm:w-80 md:w-96 shadow-sm' : 'w-40 sm:w-64',
          )}
        />
        {loading ? (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C6527] animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-md"
            title="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Instantâneo de Resultados */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute right-0 sm:left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#E9E1D2] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-2.5 bg-[#FAF7F1] border-b border-[#E9E1D2] flex items-center justify-between text-xs">
            <span className="font-bold text-[#4A322A] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#8C6527]" />
              Pacientes ({results.length})
            </span>
            <span className="text-[11px] text-[#73574A]">Enter para abrir</span>
          </div>

          <div className="max-h-84 overflow-y-auto divide-y divide-gray-100">
            {loading && results.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#C9A46A]" />
                <span>Buscando pacientes...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center space-y-1 text-xs text-gray-500">
                <p className="font-medium text-gray-700">Nenhum paciente encontrado</p>
                <p className="text-[11px] text-gray-400">
                  Tente digitar o nome completo, CPF ou e-mail.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/pacientes')
                  }}
                  className="mt-2 text-[11px] font-bold text-[#8C6527] hover:underline block mx-auto"
                >
                  Abrir lista de Pacientes →
                </button>
              </div>
            ) : (
              results.map((p) => (
                <div
                  key={p.id}
                  className="p-3 hover:bg-[#FAF7F1] transition-colors group cursor-pointer"
                  onClick={() => {
                    setIsOpen(false)
                    navigate(`/pacientes/${p.id}`)
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-xs shrink-0 shadow-2xs">
                        <AvatarFallback className="bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-[#33221C] font-bold">
                          {getInitials(p.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#33221C] group-hover:text-[#8C6527] transition-colors truncate">
                          {p.nome}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate font-mono">
                          {p.cpf ? `CPF: ${formatCPF(p.cpf)}` : p.email || 'Sem CPF'}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0 shrink-0',
                        p.status === 'Pré-cadastro'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      )}
                    >
                      {p.status}
                    </Badge>
                  </div>

                  {/* Ações Rápidas Diretas no Dropdown: Avaliação, Prontuário, Evolução */}
                  <div
                    className="flex items-center justify-between pt-1.5 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-semibold text-gray-400">Ir direto:</span>
                    <PacienteAcoesRapidas pacienteId={p.id} pacienteNome={p.nome} compact={true} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer com link Ver todos os resultados */}
          {results.length > 0 && (
            <div className="p-2 bg-[#FAF7F1] border-t border-[#E9E1D2] text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate(`/pacientes?busca=${encodeURIComponent(query.trim())}`)
                }}
                className="text-xs font-bold text-[#8C6527] hover:underline flex items-center justify-center gap-1 w-full py-1"
              >
                Ver todos os resultados na página de Pacientes
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
