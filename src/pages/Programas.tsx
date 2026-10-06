import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dumbbell,
  Plus,
  Search,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  Share2,
  Trash2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getProgramas, deletePrograma } from '@/services/programas'
import { formatDataPTBR } from '@/lib/constants'
import { ModalBancoExercicios } from '@/components/programas/ModalBancoExercicios'
import type { ProgramaAcompanhamentoRecord } from '@/types/database'

export const Programas: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [programas, setProgramas] = useState<ProgramaAcompanhamentoRecord[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [modalBancoAberto, setModalBancoAberto] = useState(false)

  const carregar = async () => {
    try {
      setLoading(true)
      const data = await getProgramas()
      setProgramas(data)
    } catch (err: any) {
      console.error('Erro ao carregar programas:', err)
      toast({
        title: 'Erro ao listar programas',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleExcluir = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente excluir este programa de periodização?')) return

    try {
      await deletePrograma(id)
      setProgramas(programas.filter((p) => p.id !== id))
      toast({ title: 'Programa excluído com sucesso.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  // Filtros
  const filtrados = programas.filter((p) => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.expand?.paciente_id?.nome?.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
    return matchBusca && matchStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Topo / Título & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#C9A46A] to-[#E9D5B5] flex items-center justify-center text-[#33221C] shadow-2xs">
              <Dumbbell className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Programas de Acompanhamento
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Montagem de periodização de treino para alunos do Personal Trainer SOUL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setModalBancoAberto(true)}
            className="h-9 px-3.5 rounded-xl border-[#C9A46A] bg-[#FAF5EE] text-[#8C6527] hover:bg-[#E9D5B5]/60 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <BookOpen className="h-4 w-4 text-[#8C6527]" />
            Banco de Exercícios
          </Button>

          <Button
            onClick={() => navigate('/programas/novo')}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold text-xs h-9 px-4 rounded-xl shadow-sm flex items-center gap-2 border border-[#DFBF8E]/40"
          >
            <Plus className="h-4 w-4 text-[#33221C]" />
            Novo Programa de Treino
          </Button>
        </div>
      </div>

      <ModalBancoExercicios
        open={modalBancoAberto}
        onOpenChange={setModalBancoAberto}
        onSelectExercicio={() => {}}
      />

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por aluno ou nome do programa..."
            className="pl-9 h-9 text-xs rounded-xl bg-white border-gray-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-9 text-xs font-semibold rounded-xl border border-gray-200 bg-white px-3 shadow-2xs"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="rascunho">Rascunho</option>
            <option value="concluido">Concluídos</option>
          </select>
        </div>
      </div>

      {/* Grid de Programas */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Carregando programas...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[#E9E1D2] text-center space-y-3 shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-[#FAF5EE] text-[#8C6527] flex items-center justify-center mx-auto">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Nenhum programa encontrado</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Crie um novo programa de acompanhamento para planejar as semanas de treino do aluno.
          </p>
          <Button
            onClick={() => navigate('/programas/novo')}
            className="bg-[#C9A46A] text-[#33221C] font-bold text-xs rounded-xl h-8 px-4"
          >
            Criar Primeiro Programa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((prog) => {
            const alunoNome = prog.expand?.paciente_id?.nome || 'Aluno'
            const statusCor =
              prog.status === 'ativo'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : prog.status === 'rascunho'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'

            return (
              <div
                key={prog.id}
                onClick={() => navigate(`/programas/${prog.id}`)}
                className="p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs hover:shadow-sm hover:border-[#C9A46A] transition-all cursor-pointer space-y-4 group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCor}`}
                    >
                      {prog.status}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleExcluir(prog.id, e)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#8C6527] transition-colors leading-snug">
                      {prog.nome}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      Aluno: <strong className="text-gray-700">{alunoNome}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="px-2.5 py-1 rounded-xl bg-[#FAF5EE] text-[#8C6527] font-bold border border-[#E9E1D2]">
                      {prog.total_periodos} {prog.unidade_duracao}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Criado em {formatDataPTBR(prog.created)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600 group-hover:text-[#8C6527]">
                  <span>Abrir Periodização</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
