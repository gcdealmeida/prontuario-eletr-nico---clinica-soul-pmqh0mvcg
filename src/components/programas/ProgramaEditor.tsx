import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar,
  Dumbbell,
  Target,
  ArrowLeft,
  Save,
  Share2,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getAllPacientes } from '@/services/pacientes'
import {
  getProgramaById,
  createPrograma,
  updatePrograma,
  getMetasByPrograma,
  createMeta,
  updateMeta,
  deleteMeta,
  getSemanasByPrograma,
  saveSemanaPeriodo,
  getTreinosByPrograma,
  createTreino,
  updateTreino,
  deleteTreino,
  getExerciciosByPrograma,
  createExercicio,
  updateExercicio,
  deleteExercicio,
  getRegistrosCargaPorPrograma,
  createRegistroCarga,
  toggleLinkPublico,
  regenerarTokenCompartilhamento,
} from '@/services/programas'
import { getAvaliacoesByPaciente } from '@/services/avaliacoes'
import { GradePeriodizacao } from '@/components/programas/GradePeriodizacao'
import { PainelExerciciosObjetivo } from '@/components/programas/PainelExerciciosObjetivo'
import type {
  PacienteRecord,
  ProgramaAcompanhamentoRecord,
  ProgramaMetaRecord,
  ProgramaSemanaRecord,
  ProgramaTreinoRecord,
  ProgramaExercicioRecord,
  ProgramaRegistroCargaRecord,
  UnidadeDuracaoPrograma,
  StatusPrograma,
} from '@/types/database'

interface ProgramaEditorProps {
  programaId?: string
}

export const ProgramaEditor: React.FC<ProgramaEditorProps> = ({ programaId }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pacienteParam = searchParams.get('paciente')
  const { toast } = useToast()

  // Estados principais
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])

  // Dados do Programa
  const [idAtual, setIdAtual] = useState<string | undefined>(programaId)
  const [pacienteId, setPacienteId] = useState(pacienteParam || '')
  const [nomePrograma, setNomePrograma] = useState('')
  const [unidadeDuracao, setUnidadeDuracao] = useState<UnidadeDuracaoPrograma>('semanas')
  const [totalPeriodos, setTotalPeriodos] = useState<number>(8)
  const [statusPrograma, setStatusPrograma] = useState<StatusPrograma>('ativo')
  const [observacoes, setObservacoes] = useState('')
  const [tokenCompartilhamento, setTokenCompartilhamento] = useState('')
  const [linkPublicoAtivo, setLinkPublicoAtivo] = useState(true)

  // Metas do programa
  const [metas, setMetas] = useState<ProgramaMetaRecord[]>([])
  const [novaMetaTitulo, setNovaMetaTitulo] = useState('')
  const [novaMetaDuracao, setNovaMetaDuracao] = useState<number | ''>(4)
  const [novaMetaDescricao, setNovaMetaDescricao] = useState('')
  const [novaMetaFragilidade, setNovaMetaFragilidade] = useState('')

  // Semanas / Períodos
  const [semanas, setSemanas] = useState<ProgramaSemanaRecord[]>([])
  const [semanaAtiva, setSemanaAtiva] = useState<number>(1)

  // Treinos (Divisão A, B, C...)
  const [treinos, setTreinos] = useState<ProgramaTreinoRecord[]>([])
  const [treinoAtivoId, setTreinoAtivoId] = useState<string | undefined>(undefined)

  // Exercícios & Cargas
  const [exercicios, setExercicios] = useState<ProgramaExercicioRecord[]>([])
  const [registrosCarga, setRegistrosCarga] = useState<
    Record<string, ProgramaRegistroCargaRecord[]>
  >({})

  // Fragilidades da avaliação do paciente (para importação rápida)
  const [fragilidadesPaciente, setFragilidadesPaciente] = useState<
    Array<{ descricao: string; medida: string }>
  >([])

  // Sincronizar idAtual caso o prop programaId mude
  useEffect(() => {
    if (programaId !== idAtual) {
      setIdAtual(programaId)
    }
  }, [programaId])

  // Carregar dados iniciais
  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true)
        const todosPac = await getAllPacientes()
        setPacientes(todosPac)

        if (idAtual) {
          try {
            const prog = await getProgramaById(idAtual)
            setPacienteId(prog.paciente_id)
            setNomePrograma(prog.nome)
            setUnidadeDuracao(prog.unidade_duracao)
            setTotalPeriodos(prog.total_periodos)
            setStatusPrograma(prog.status)
            setObservacoes(prog.observacoes || '')
            setTokenCompartilhamento(prog.token_compartilhamento || '')
            setLinkPublicoAtivo(prog.link_publico_ativo ?? true)

            // Carregar sub-recursos com tolerância a falhas parciais
            const [metasDb, semanasDb, treinosDb, exDb, cargasDb] = await Promise.all([
              getMetasByPrograma(idAtual).catch(() => []),
              getSemanasByPrograma(idAtual).catch(() => []),
              getTreinosByPrograma(idAtual).catch(() => []),
              getExerciciosByPrograma(idAtual).catch(() => []),
              getRegistrosCargaPorPrograma(idAtual).catch(() => []),
            ])

            setMetas(metasDb)
            setSemanas(semanasDb)
            setTreinos(treinosDb)
            setExercicios(exDb)

            // Agrupar cargas por exercicio_id
            const mapaCargas: Record<string, ProgramaRegistroCargaRecord[]> = {}
            cargasDb.forEach((c) => {
              if (!mapaCargas[c.exercicio_id]) {
                mapaCargas[c.exercicio_id] = []
              }
              mapaCargas[c.exercicio_id].push(c)
            })
            setRegistrosCarga(mapaCargas)
          } catch (err: any) {
            console.error('Erro ao buscar programa por id:', err)
            toast({
              title: 'Programa indisponível',
              description: err?.message || 'Não foi possível carregar o programa solicitado.',
              variant: 'destructive',
            })
          }
        } else if (pacienteParam) {
          // Pre-seleção do paciente pelo query param
          const pac = todosPac.find((p) => p.id === pacienteParam)
          if (pac) {
            setNomePrograma(`Programa do Aluno ${pac.nome}`)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar lista de pacientes ou dados:', err)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as informações necessárias.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [idAtual, pacienteParam])

  // Se o paciente mudar, carregar histórico de avaliações para sugerir fragilidades medidas
  useEffect(() => {
    async function carregarFragilidades() {
      if (!pacienteId) {
        setFragilidadesPaciente([])
        return
      }
      try {
        const { personal } = await getAvaliacoesByPaciente(pacienteId)
        if (personal && personal.length > 0) {
          const ultima = personal[0]
          const list: Array<{ descricao: string; medida: string }> = []

          // Cruzamento prévio salvo
          if (ultima.cruzamento_objetivos_fragilidades?.fragilidades_medidas) {
            ultima.cruzamento_objetivos_fragilidades.fragilidades_medidas.forEach((f: any) => {
              list.push({
                descricao: `${f.area}: ${f.descricao}`,
                medida: f.medida_exata,
              })
            })
          }

          // FMS
          if (ultima.fms_dados?.score_total !== undefined) {
            list.push({
              descricao: 'FMS Score Total',
              medida: `${ultima.fms_dados.score_total}/21 (Assimetrias: ${ultima.fms_dados.assimetrias_total || 0})`,
            })
          }

          // Wells
          if (ultima.flexibilidade_dados?.banco_wells?.melhor_medida_cm) {
            list.push({
              descricao: 'Flexibilidade Banco de Wells',
              medida: `${ultima.flexibilidade_dados.banco_wells.melhor_medida_cm} cm`,
            })
          }

          // %Gordura
          if (ultima.percentual_gordura) {
            list.push({
              descricao: 'Composição Corporal (%G)',
              medida: `${ultima.percentual_gordura}%`,
            })
          }

          setFragilidadesPaciente(list)
        }
      } catch (err) {
        console.log('Aviso ao buscar fragilidades do paciente:', err)
      }
    }
    carregarFragilidades()
  }, [pacienteId])

  // 1. SALVAR DADOS DO PROGRAMA (CABEÇALHO)
  const handleSalvarCabecalho = async () => {
    if (!pacienteId) {
      toast({
        title: 'Selecione o paciente',
        description: 'Todo programa deve pertencer a um paciente da clínica.',
        variant: 'destructive',
      })
      return
    }
    if (!nomePrograma.trim()) {
      toast({
        title: 'Defina o nome do programa',
        description: 'Ex: "Programa do Aluno Marcelo Passarelli"',
        variant: 'destructive',
      })
      return
    }

    try {
      setSalvando(true)
      if (idAtual) {
        const updated = await updatePrograma(idAtual, {
          nome: nomePrograma.trim(),
          unidade_duracao: unidadeDuracao,
          total_periodos: totalPeriodos,
          status: statusPrograma,
          observacoes: observacoes.trim(),
        })
        toast({ title: 'Programa atualizado com sucesso!' })
      } else {
        const novo = await createPrograma({
          paciente_id: pacienteId,
          nome: nomePrograma.trim(),
          unidade_duracao: unidadeDuracao,
          total_periodos: totalPeriodos,
          status: statusPrograma,
          observacoes: observacoes.trim(),
        })
        setIdAtual(novo.id)
        setTokenCompartilhamento(novo.token_compartilhamento || '')
        toast({
          title: 'Programa criado com sucesso!',
          description: 'Agora adicione as metas e distribua nas semanas.',
        })
        navigate(`/programas/${novo.id}`, { replace: true })
      }
    } catch (err: any) {
      console.error('Erro ao salvar programa:', err)
      toast({
        title: 'Falha ao salvar programa',
        description: err?.message || 'Verifique sua conexão ou permissões.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // 2. METAS CRUD
  const handleAdicionarMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idAtual) {
      toast({
        title: 'Salve o programa primeiro',
        description: 'Clique em "Salvar Programa" antes de cadastrar metas.',
        variant: 'destructive',
      })
      return
    }
    if (!novaMetaTitulo.trim()) return

    try {
      const nova = await createMeta({
        programa_id: idAtual,
        ordem: metas.length + 1,
        titulo: novaMetaTitulo.trim(),
        duracao_periodos: typeof novaMetaDuracao === 'number' ? novaMetaDuracao : undefined,
        descricao: novaMetaDescricao.trim(),
        fragilidade_ref: novaMetaFragilidade.trim(),
      })
      setMetas([...metas, nova])
      setNovaMetaTitulo('')
      setNovaMetaDescricao('')
      setNovaMetaFragilidade('')
      toast({ title: 'Meta adicionada ao programa!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao criar meta',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const handleExcluirMeta = async (metaId: string) => {
    try {
      await deleteMeta(metaId)
      setMetas(metas.filter((m) => m.id !== metaId))
      // Atualizar nas semanas locais
      setSemanas(
        semanas.map((s) => ({
          ...s,
          metas_ids: (s.metas_ids || []).filter((id) => id !== metaId),
        })),
      )
      toast({ title: 'Meta removida.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao remover meta',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  // 3. GRADE PERIODIZAÇÃO (TOGGLE & REPLICAR)
  const handleToggleMetaNaSemana = async (semanaIndice: number, metaId: string) => {
    if (!idAtual) return

    const semanaExistente = semanas.find((s) => s.indice === semanaIndice)
    const metasAtuais = Array.isArray(semanaExistente?.metas_ids)
      ? [...semanaExistente!.metas_ids]
      : []

    let novosMetasIds: string[]
    if (metasAtuais.includes(metaId)) {
      novosMetasIds = metasAtuais.filter((id) => id !== metaId)
    } else {
      novosMetasIds = [...metasAtuais, metaId]
    }

    try {
      const salvo = await saveSemanaPeriodo({
        programa_id: idAtual,
        indice: semanaIndice,
        metas_ids: novosMetasIds,
      })

      // Atualizar estado local
      const outras = semanas.filter((s) => s.indice !== semanaIndice)
      setSemanas([...outras, salvo])
    } catch (err: any) {
      console.error('Erro ao atualizar semana:', err)
    }
  }

  const handleAplicarProximasSemanas = async (
    semanaOrigemIndice: number,
    quantidadeSemanas: number,
  ) => {
    if (!idAtual) return

    const semanaOrigem = semanas.find((s) => s.indice === semanaOrigemIndice)
    const metasOrigem = semanaOrigem?.metas_ids || []

    const promessas = []
    for (let i = 1; i <= quantidadeSemanas; i++) {
      const targetIndice = semanaOrigemIndice + i
      if (targetIndice <= totalPeriodos) {
        promessas.push(
          saveSemanaPeriodo({
            programa_id: idAtual,
            indice: targetIndice,
            metas_ids: metasOrigem,
          }),
        )
      }
    }

    try {
      const atualizadas = await Promise.all(promessas)
      const mapaAtualizadas = new Map(atualizadas.map((s) => [s.indice, s]))
      const outras = semanas.filter((s) => !mapaAtualizadas.has(s.indice))
      setSemanas([...outras, ...atualizadas])
      toast({
        title: 'Periodização replicada!',
        description: `Metas da semana ${semanaOrigemIndice} aplicadas nas próximas ${promessas.length} semanas.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao replicar semanas',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  // 3.1 GESTÃO DE TREINOS (TREINO A, TREINO B, ETC.)
  const handleCriarTreino = async (nome: string, foco?: string) => {
    if (!idAtual) {
      toast({
        title: 'Salve o programa primeiro',
        description: 'Clique em "Salvar Programa" antes de criar treinos divididos.',
        variant: 'destructive',
      })
      return
    }

    try {
      const treinosSemana = treinos.filter((t) => t.semana_indice === semanaAtiva)
      const novo = await createTreino({
        programa_id: idAtual,
        semana_indice: semanaAtiva,
        nome: nome.trim(),
        foco: foco?.trim(),
        ordem: treinosSemana.length + 1,
      })
      setTreinos([...treinos, novo])
      setTreinoAtivoId(novo.id)
      toast({
        title: 'Treino adicionado!',
        description: `"${novo.nome}" criado para a ${semanaAtiva}ª semana.`,
      })
      return novo
    } catch (err: any) {
      toast({
        title: 'Erro ao criar treino',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const handleRenomearTreino = async (treinoId: string, novoNome: string) => {
    try {
      const updated = await updateTreino(treinoId, { nome: novoNome })
      setTreinos(treinos.map((t) => (t.id === treinoId ? updated : t)))
      toast({ title: 'Treino renomeado com sucesso!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao renomear treino',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const handleExcluirTreino = async (treinoId: string) => {
    try {
      await deleteTreino(treinoId)
      setTreinos(treinos.filter((t) => t.id !== treinoId))
      // Remover exercícios deste treino
      setExercicios(exercicios.filter((e) => e.treino_id !== treinoId))
      toast({ title: 'Treino e seus exercícios foram excluídos.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir treino',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  // 4. EXERCÍCIOS & CARGAS
  const handleSalvarExercicio = async (ex: Partial<ProgramaExercicioRecord>) => {
    if (!idAtual) return
    try {
      const novo = await createExercicio({
        ...ex,
        programa_id: idAtual,
      })
      setExercicios([...exercicios, novo])
      toast({ title: 'Exercício adicionado à semana!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar exercício',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const handleExcluirExercicio = async (exId: string) => {
    try {
      await deleteExercicio(exId)
      setExercicios(exercicios.filter((e) => e.id !== exId))
      toast({ title: 'Exercício removido.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir exercício',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const handleAdicionarCarga = async (
    exercicioId: string,
    valorKg: number,
    dataIso: string,
    reps?: string,
  ) => {
    try {
      const reg = await createRegistroCarga({
        exercicio_id: exercicioId,
        valor_kg: valorKg,
        data: dataIso,
        repeticoes_feitas: reps,
      })

      // Atualiza local
      const atual = registrosCarga[exercicioId] || []
      setRegistrosCarga({
        ...registrosCarga,
        [exercicioId]: [...atual, reg],
      })

      // Atualiza carga_atual_kg no exercício local
      setExercicios(
        exercicios.map((e) => (e.id === exercicioId ? { ...e, carga_atual_kg: valorKg } : e)),
      )

      toast({
        title: 'Carga registrada!',
        description: `${valorKg} kg adicionado à curva de evolução.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar carga',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  // Copiar link público
  const handleCopiarLinkPublico = () => {
    if (!tokenCompartilhamento) return
    const link = `${window.location.origin}/programa-cliente/${tokenCompartilhamento}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copiado!',
      description: 'Envie o link para o cliente acessar no celular.',
    })
  }

  const handleRegenerarToken = async () => {
    if (!idAtual) return
    try {
      const updated = await regenerarTokenCompartilhamento(idAtual)
      setTokenCompartilhamento(updated.token_compartilhamento || '')
      toast({ title: 'Novo link gerado com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao gerar novo link', description: err?.message })
    }
  }

  const pacienteSelecionado = pacientes.find((p) => p.id === pacienteId)

  // Metas ativas na semana selecionada
  const semanaAtualObj = semanas.find((s) => s.indice === semanaAtiva)
  const metasAtivasNaSemana = metas.filter((m) => (semanaAtualObj?.metas_ids || []).includes(m.id))

  const singular = unidadeDuracao === 'dias' ? 'Dia' : unidadeDuracao === 'meses' ? 'Mês' : 'Semana'
  const plural =
    unidadeDuracao === 'dias' ? 'Dias' : unidadeDuracao === 'meses' ? 'Meses' : 'Semanas'

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header / Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/programas')}
            className="rounded-xl text-gray-600 hover:text-gray-900 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Programas
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {idAtual ? 'Editar Programa de Acompanhamento' : 'Novo Programa de Acompanhamento'}
            </h2>
            <p className="text-xs text-gray-500">
              Montagem de periodização de treino inteligente para alunos do Personal SOUL
            </p>
          </div>
        </div>

        {/* Ações superiores */}
        <div className="flex flex-wrap items-center gap-2">
          {idAtual && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/programas/${idAtual}/cliente`)}
                className="rounded-xl text-xs font-semibold border-[#E9E1D2] hover:bg-[#FAF7F1] text-[#8C6527] h-9 flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4" /> Versão do Cliente
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopiarLinkPublico}
                className="rounded-xl text-xs font-semibold border-gray-200 hover:bg-gray-50 h-9 flex items-center gap-1.5"
              >
                <Share2 className="h-4 w-4 text-blue-600" /> Link Público
              </Button>
            </>
          )}
          <Button
            type="button"
            disabled={salvando}
            onClick={handleSalvarCabecalho}
            className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl text-xs h-9 px-4 shadow-sm flex items-center gap-1.5 border border-[#DFBF8E]/40"
          >
            <Save className="h-4 w-4 text-[#33221C]" />
            {salvando ? 'Salvando...' : 'Salvar Programa'}
          </Button>
        </div>
      </div>

      {/* 1. CRIAÇÃO / DADOS DO PROGRAMA */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="h-7 w-7 rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527] font-bold text-xs">
            1
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Identificação do Aluno & Duração da Periodização
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
          {/* Paciente */}
          <div className="sm:col-span-4 space-y-1">
            <Label className="text-xs font-semibold text-gray-700">Aluno / Paciente *</Label>
            <select
              disabled={!!idAtual}
              value={pacienteId}
              onChange={(e) => {
                setPacienteId(e.target.value)
                const pac = pacientes.find((p) => p.id === e.target.value)
                if (pac && !nomePrograma) {
                  setNomePrograma(`Programa do Aluno ${pac.nome}`)
                }
              }}
              className="h-10 w-full text-xs font-semibold rounded-xl border border-gray-300 bg-white px-3"
            >
              <option value="">Selecione o paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Nome do programa */}
          <div className="sm:col-span-5 space-y-1">
            <Label className="text-xs font-semibold text-gray-700">
              Nome do Programa de Periodização *
            </Label>
            <Input
              value={nomePrograma}
              onChange={(e) => setNomePrograma(e.target.value)}
              placeholder="Ex: Programa do Aluno Marcelo Passarelli"
              className="h-10 text-xs font-semibold rounded-xl"
            />
          </div>

          {/* Status */}
          <div className="sm:col-span-3 space-y-1">
            <Label className="text-xs font-semibold text-gray-700">Status</Label>
            <select
              value={statusPrograma}
              onChange={(e) => setStatusPrograma(e.target.value as StatusPrograma)}
              className="h-10 w-full text-xs font-bold rounded-xl border border-gray-300 bg-white px-3"
            >
              <option value="ativo">Ativo</option>
              <option value="rascunho">Rascunho</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>

          {/* Duração e Unidade */}
          <div className="sm:col-span-4 space-y-1">
            <Label className="text-xs font-semibold text-gray-700">Duração Numérica *</Label>
            <Input
              type="number"
              min="1"
              max="52"
              value={totalPeriodos}
              onChange={(e) =>
                setTotalPeriodos(e.target.value === '' ? 8 : parseInt(e.target.value, 10))
              }
              className="h-10 text-xs font-bold rounded-xl"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <Label className="text-xs font-semibold text-gray-700">Unidade de Período *</Label>
            <div className="grid grid-cols-3 gap-1.5 h-10">
              {(['dias', 'semanas', 'meses'] as UnidadeDuracaoPrograma[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnidadeDuracao(u)}
                  className={`rounded-xl text-xs font-bold capitalize transition-all border ${
                    unidadeDuracao === u
                      ? 'bg-gradient-to-r from-[#C9A46A] to-[#B88E52] text-[#33221C] border-[#DFBF8E]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="sm:col-span-12 space-y-1">
            <Label className="text-xs font-semibold text-gray-700">
              Observações Gerais do Programa / Combinados
            </Label>
            <Textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Foco nos primeiros 2 meses em mobilidade de tornozelo e força de membros inferiores..."
              className="text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* 2. METAS / OBJETIVOS COM TEMPO */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527] font-bold text-xs">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Metas & Objetivos do Programa (com Duração Fatiada)
              </h3>
              <p className="text-[11px] text-gray-500">
                Cada meta possui título, tempo estimado e opcionalmente ataca uma fragilidade medida
                da avaliação
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#8C6527]">{metas.length} cadastrados</span>
        </div>

        {/* Lista das metas atuais */}
        {metas.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#FAF5EE]/60 border border-dashed border-[#E9E1D2] text-center text-xs text-gray-500 space-y-1">
            <Target className="h-6 w-6 text-gray-400 mx-auto" />
            <p className="font-semibold text-gray-700">Nenhum objetivo cadastrado ainda.</p>
            <p className="text-gray-400">
              Adicione os objetivos no formulário abaixo (ex: "1º Objetivo: Estabilização Core e
              Controle pélvico — 4 semanas").
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metas.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-1.5 text-xs hover:border-[#C9A46A]/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] font-bold text-[#8C6527] text-xs">
                      {m.ordem}º
                    </span>
                    <h5 className="font-bold text-gray-900 text-xs sm:text-sm">{m.titulo}</h5>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcluirMeta(m.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {m.duracao_periodos && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold text-[10px] border border-amber-200">
                      ⏱ {m.duracao_periodos} {plural.toLowerCase()}
                    </span>
                  )}
                  {m.fragilidade_ref && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 text-[10px] font-semibold border border-blue-200">
                      Fragilidade: {m.fragilidade_ref}
                    </span>
                  )}
                </div>

                {m.descricao && <p className="text-gray-600 text-[11px] pt-1">{m.descricao}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Formulário: Adicionar Nova Meta */}
        <form
          onSubmit={handleAdicionarMeta}
          className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-white border border-[#E9E1D2] space-y-3"
        >
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-[#8C6527] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Cadastrar Novo Objetivo / Meta
            </Label>
            {fragilidadesPaciente.length > 0 && (
              <span className="text-[10px] text-[#8C6527] font-semibold">
                {fragilidadesPaciente.length} fragilidades da avaliação detectadas
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-6">
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                Título da Meta *
              </Label>
              <Input
                required
                value={novaMetaTitulo}
                onChange={(e) => setNovaMetaTitulo(e.target.value)}
                placeholder="Ex: Ganho de Mobilidade de Quadril, Ganho de Força Potência..."
                className="h-8 text-xs font-semibold rounded-lg mt-0.5 bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                Tempo ({plural})
              </Label>
              <Input
                type="number"
                min="1"
                value={novaMetaDuracao}
                onChange={(e) =>
                  setNovaMetaDuracao(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                placeholder="Ex: 4"
                className="h-8 text-xs font-semibold rounded-lg mt-0.5 bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                Vincular a Fragilidade
              </Label>
              {fragilidadesPaciente.length > 0 ? (
                <select
                  value={novaMetaFragilidade}
                  onChange={(e) => setNovaMetaFragilidade(e.target.value)}
                  className="h-8 w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-2 mt-0.5"
                >
                  <option value="">Selecione ou deixe livre...</option>
                  {fragilidadesPaciente.map((f, i) => (
                    <option key={i} value={`${f.descricao} (${f.medida})`}>
                      {f.descricao} — [{f.medida}]
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={novaMetaFragilidade}
                  onChange={(e) => setNovaMetaFragilidade(e.target.value)}
                  placeholder="Ex: FMS ombro D=1, Assimetria 18%..."
                  className="h-8 text-xs rounded-lg mt-0.5 bg-white"
                />
              )}
            </div>

            <div className="sm:col-span-12">
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                Descrição Opcional
              </Label>
              <Input
                value={novaMetaDescricao}
                onChange={(e) => setNovaMetaDescricao(e.target.value)}
                placeholder="Detalhes adicionais do objetivo no período..."
                className="h-8 text-xs rounded-lg mt-0.5 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={!novaMetaTitulo.trim()}
              className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs h-8 px-4 rounded-xl shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Meta
            </Button>
          </div>
        </form>
      </div>

      {/* 3. MONTAGEM SEMANA A SEMANA (GRADE DE PERIODIZAÇÃO) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
          <div className="h-7 w-7 rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527] font-bold text-xs">
            3
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Montagem Semana a Semana (Grade de Periodização)
            </h3>
            <p className="text-[11px] text-gray-500">
              Selecione quais metas atuam em cada semana e replique com um clique
            </p>
          </div>
        </div>

        <GradePeriodizacao
          unidadeDuracao={unidadeDuracao}
          totalPeriodos={totalPeriodos}
          metas={metas}
          semanas={semanas}
          semanaSelecionada={semanaAtiva}
          onSelecionarSemana={(indice) => setSemanaAtiva(indice)}
          onToggleMetaNaSemana={handleToggleMetaNaSemana}
          onAplicarProximasSemanas={handleAplicarProximasSemanas}
        />
      </div>

      {/* 4. PAINEL DE MONTAGEM DOS OBJETIVOS & EXERCÍCIOS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
          <div className="h-7 w-7 rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527] font-bold text-xs">
            4
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Prescrição de Exercícios & Mensuração de Cargas
            </h3>
            <p className="text-[11px] text-gray-500">
              Séries, repetições ou segundos, descansos e acompanhamento da curva de carga
            </p>
          </div>
        </div>

        <PainelExerciciosObjetivo
          semanaIndice={semanaAtiva}
          rotuloPeriodo={`${semanaAtiva}ª ${singular}`}
          metasDaSemana={metasAtivasNaSemana}
          exercicios={exercicios}
          treinos={treinos}
          treinoAtivoId={treinoAtivoId}
          registrosCarga={registrosCarga}
          onSelecionarTreino={(id) => setTreinoAtivoId(id)}
          onCriarTreino={handleCriarTreino}
          onRenomearTreino={handleRenomearTreino}
          onExcluirTreino={handleExcluirTreino}
          onSalvarExercicio={handleSalvarExercicio}
          onExcluirExercicio={handleExcluirExercicio}
          onAdicionarCarga={handleAdicionarCarga}
        />
      </div>
    </div>
  )
}
