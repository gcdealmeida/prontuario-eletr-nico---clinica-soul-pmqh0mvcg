import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Dumbbell,
  FileSpreadsheet,
  HeartPulse,
  Library,
  Loader2,
  Plus,
  UserRound,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ResultadoImportacaoPrograma } from '@/lib/importacaoProgramas'
import { getPacientes } from '@/services/pacientes'
import {
  createPrograma,
  createExercicio,
  createTreino,
  getExerciciosByPrograma,
  getNotasByPrograma,
  getSemanasByPrograma,
  getTreinosByPrograma,
  getProgramasPorModalidade,
  saveSemanaPeriodo,
  deletePrograma,
  type ModalidadePrograma,
} from '@/services/programas'
import type {
  PacienteRecord,
  ProgramaAcompanhamentoNotaRecord,
  ProgramaAcompanhamentoRecord,
  ProgramaExercicioRecord,
  ProgramaSemanaRecord,
  ProgramaTreinoRecord,
  UnidadeDuracaoPrograma,
} from '@/types/database'
import { PainelImportacaoAba } from '@/components/programas/PainelImportacaoAba'
import { PainelPeriodizacaoAba } from '@/components/programas/PainelPeriodizacaoAba'
import { PainelExerciciosAba } from '@/components/programas/PainelExerciciosAba'
import { BibliotecaExerciciosAba } from '@/components/programas/BibliotecaExerciciosAba'
import { PainelAcompanhamentoAba } from '@/components/programas/PainelAcompanhamentoAba'
import { FerramentaPeriodizacaoIframe } from '@/components/programas/FerramentaPeriodizacaoIframe'

type AbaArea =
  | 'importacao'
  | 'periodizacao'
  | 'exercicios'
  | 'biblioteca'
  | 'acompanhamento'
  | 'ferramenta'

const ABAS: { id: AbaArea; rotulo: string; icone: React.ElementType }[] = [
  { id: 'importacao', rotulo: 'Importação', icone: FileSpreadsheet },
  { id: 'periodizacao', rotulo: 'Periodização', icone: BarChart3 },
  { id: 'exercicios', rotulo: 'Exercícios', icone: Dumbbell },
  { id: 'biblioteca', rotulo: 'Biblioteca de Exercícios', icone: Library },
  { id: 'acompanhamento', rotulo: 'Acompanhamento', icone: ClipboardList },
  { id: 'ferramenta', rotulo: 'Ferramenta de Periodização', icone: Wrench },
]

interface ProgramaCriado {
  id: string
  nome: string
}

export const Programas: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  const modalidade = (searchParams.get('modalidade') as ModalidadePrograma | null) ?? null
  const programaId = searchParams.get('programa')
  const aba = (searchParams.get('aba') as AbaArea | null) ?? 'importacao'

  const [programas, setProgramas] = useState<ProgramaAcompanhamentoRecord[]>([])
  const [carregando, setCarregando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [dialogoNovo, setDialogoNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoPacienteId, setNovoPacienteId] = useState('')
  const [novoPacientes, setNovoPacientes] = useState<{ id: string; nome: string }[]>([])
  const [criando, setCriando] = useState(false)

  // Estados carregados quando um programa está aberto
  const [semanas, setSemanas] = useState<ProgramaSemanaRecord[]>([])
  const [treinos, setTreinos] = useState<ProgramaTreinoRecord[]>([])
  const [exercicios, setExercicios] = useState<ProgramaExercicioRecord[]>([])
  const [notas, setNotas] = useState<ProgramaAcompanhamentoNotaRecord[]>([])

  const programaAtual = useMemo(
    () => programas.find((p) => p.id === programaId) ?? null,
    [programas, programaId],
  )

  const carregarProgramas = useCallback(async () => {
    if (!modalidade) return
    setCarregando(true)
    try {
      const lista = await getProgramasPorModalidade(modalidade)
      setProgramas(lista)
      setProgramaIdSeValido(lista, programaId)
    } finally {
      setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidade, programaId])

  useEffect(() => {
    carregarProgramas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalidade])

  const setProgramaIdSeValido = (lista: ProgramaAcompanhamentoRecord[], id: string | null) => {
    if (id && !lista.some((p) => p.id === id)) {
      irPara({ programa: null })
    }
  }

  const irPara = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next)
  }

  // ===== ESCOLHA DE MODALIDADE =====
  if (!modalidade) {
    return (
      <div className="min-h-dvh bg-[#FAF5EE] py-10 px-4">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-[#1E2530] sm:text-3xl">
              Programas de Exercícios
            </h1>
            <p className="text-sm text-gray-600">
              Área dedicada a periodizações de treino e reabilitação, programas e fichas de
              exercícios. Escolha a modalidade:
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => irPara({ modalidade: 'reabilitacao', programa: null, aba: null })}
              className="group rounded-3xl border-2 border-[#E9E1D2] bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#8C6527] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C6527]"
            >
              <HeartPulse className="mx-auto h-12 w-12 text-[#8C6527]" aria-hidden="true" />
              <span className="mt-4 block text-xl font-black text-[#1E2530] group-hover:text-[#8C6527]">
                Reabilitação
              </span>
              <span className="mt-2 block text-sm text-gray-600">
                Programas clínicos, evolutivos e reabilitação física
              </span>
            </button>
            <button
              type="button"
              onClick={() => irPara({ modalidade: 'personal', programa: null, aba: null })}
              className="group rounded-3xl border-2 border-[#E9E1D2] bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#1E2530] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E2530]"
            >
              <UserRound className="mx-auto h-12 w-12 text-[#1E2530]" aria-hidden="true" />
              <span className="mt-4 block text-xl font-black text-[#1E2530] group-hover:text-[#8C6527]">
                Personal
              </span>
              <span className="mt-2 block text-sm text-gray-600">
                Treinos personalizados, condicionamento e performance
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== ÁREA DA MODALIDADE =====
  return (
    <div className="min-h-dvh bg-[#FAF5EE] py-6 px-4">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => irPara({ modalidade: null, programa: null, aba: null })}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Trocar modalidade
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black tracking-tight text-[#1E2530]">
              {modalidade === 'reabilitacao' ? 'Reabilitação' : 'Personal'} — Programas de
              Exercícios
            </h1>
            {programaAtual && (
              <p className="text-xs text-gray-500 truncate">
                Programa: <span className="font-bold">{programaAtual.nome}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!programaId && (
              <Button size="sm" onClick={() => abrirDialogoNovoPrograma()}>
                <Plus className="h-4 w-4 mr-1" /> Novo programa
              </Button>
            )}
          </div>
        </div>

        {/* Sem programa selecionado: lista de programas */}
        {!programaId ? (
          <ListaProgramasModalidade
            programas={programas}
            modalidade={modalidade}
            carregando={carregando}
            onAbrir={(id) => irPara({ programa: id, aba: null })}
            onImportar={handleImportarNovo}
            onNovo={abrirDialogoNovoPrograma}
            onExcluir={handleExcluirPrograma}
          />
        ) : (
          <>
            {/* Abas da área */}
            <Tabs value={aba} onValueChange={(v) => irPara({ aba: v })}>
              <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-white border border-[#E9E1D2] rounded-2xl p-1">
                {ABAS.map(({ id, rotulo, icone: Icone }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="flex-1 min-w-[130px] rounded-xl data-[state=active]:bg-[#1E2530] data-[state=active]:text-white"
                  >
                    <Icone className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    {rotulo}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Conteúdo da aba */}
            <div>
              {aba === 'importacao' && (
                <PainelImportacaoAba
                  onImportado={handleProgramaImportado}
                  modalidade={modalidade}
                  importando={importando}
                />
              )}
              {aba === 'periodizacao' && programaAtual && (
                <PainelPeriodizacaoAba
                  programaId={programaAtual.id}
                  unidadeDuracao={programaAtual.unidade_duracao || 'semanas'}
                  totalPeriodos={programaAtual.total_periodos || 12}
                  semanas={semanas}
                  onSemanasChange={setSemanas}
                />
              )}
              {aba === 'exercicios' && programaAtual && (
                <PainelExerciciosAba
                  programaId={programaAtual.id}
                  treinos={treinos}
                  exercicios={exercicios}
                  onTreinosChange={setTreinos}
                  onExerciciosChange={setExercicios}
                />
              )}
              {aba === 'biblioteca' && <BibliotecaExerciciosAba modalidade={modalidade} />}
              {aba === 'acompanhamento' && programaAtual && (
                <PainelAcompanhamentoAba
                  programaId={programaAtual.id}
                  semanas={semanas}
                  notas={notas}
                  onNotasChange={setNotas}
                />
              )}
              {aba === 'ferramenta' && <FerramentaPeriodizacaoIframe />}
            </div>
          </>
        )}
      </div>

      {/* Diálogo novo programa */}
      <Dialog open={dialogoNovo} onOpenChange={setDialogoNovo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo programa de exercícios</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="novo-prog-nome">Nome do programa</Label>
              <Input
                id="novo-prog-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex.: Reabilitação de joelho — Maria"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="novo-prog-paciente">Paciente / Cliente</Label>
              <select
                id="novo-prog-paciente"
                value={novoPacienteId}
                onChange={(e) => setNovoPacienteId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Sem paciente vinculado</option>
                {novoPacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoNovo(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarPrograma} disabled={criando || !novoNome.trim()}>
              {criando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function abrirDialogoNovoPrograma() {
    setNovoNome('')
    setNovoPacienteId('')
    setDialogoNovo(true)
    getPacientes()
      .then((res) => {
        const itens = 'items' in res ? res.items : (res as unknown as PacienteRecord[])
        setNovoPacientes(itens.map((p) => ({ id: p.id, nome: p.nome || p.id })))
      })
      .catch(() => setNovoPacientes([]))
  }

  async function handleCriarPrograma() {
    if (!modalidade || !novoNome.trim()) return
    setCriando(true)
    try {
      const rec = await createPrograma({
        nome: novoNome.trim(),
        modalidade,
        unidade_duracao: 'semanas',
        duracao: 12,
        paciente_id: novoPacienteId || undefined,
      } as Partial<ProgramaAcompanhamentoRecord>)
      await carregarProgramas()
      setDialogoNovo(false)
      irPara({ programa: rec.id, aba: 'periodizacao' })
    } finally {
      setCriando(false)
    }
  }

  async function handleImportarNovo() {
    setDialogoNovo(false)
    irPara({ programa: null, aba: 'importacao' })
  }

  async function handleExcluirPrograma(id: string) {
    await deletePrograma(id)
    await carregarProgramas()
  }

  async function handleProgramaImportado(resumo: ResultadoImportacaoPrograma) {
    if (!modalidade) return
    setImportando(true)
    try {
      // 1. Programa
      const rec = await createPrograma({
        nome: resumo.nome || 'Programa importado',
        modalidade,
        unidade_duracao: 'semanas',
        total_periodos: Math.max(resumo.semanas.length, 1),
      } as Partial<ProgramaAcompanhamentoRecord>)

      // 2. Semanas (periodização)
      for (const s of resumo.semanas) {
        if (s.indice == null) continue
        await saveSemanaPeriodo({
          programa_id: rec.id,
          indice: s.indice,
          rotulo: s.rotulo,
          carga_planejada_kg: s.carga,
          horas_treino: s.horas,
        })
      }

      // 3. Treinos + exercícios
      for (let i = 0; i < resumo.treinos.length; i++) {
        const t = resumo.treinos[i]
        const treino = await createTreino({
          programa_id: rec.id,
          nome: t.nome,
          ordem: i + 1,
          semana_indice: 1,
        })
        for (let j = 0; j < t.exercicios.length; j++) {
          const ex = t.exercicios[j]
          await createExercicio({
            programa_id: rec.id,
            treino_id: treino.id,
            nome: ex.nome,
            series: ex.series,
            tipo_repeticao: 'reps',
            quantidade: ex.repeticoes,
            observacao: ex.observacoes,
            ordem: j + 1,
            semana_indice: 1,
          })
        }
      }

      await carregarProgramas()
      toast({ title: 'Programa importado', description: 'Semanas, treinos e exercícios criados.' })
      irPara({ programa: rec.id, aba: 'periodizacao' })
    } catch (err) {
      console.error('Erro ao salvar programa importado:', err)
      toast({
        title: 'Erro ao salvar o programa',
        description:
          err instanceof Error ? err.message : 'Tente novamente ou crie o programa manualmente.',
        variant: 'destructive',
      })
    } finally {
      setImportando(false)
    }
  }

  useEffect(() => {
    if (!programaId) return
    let vivo = true
    getSemanasByPrograma(programaId).then((s) => vivo && setSemanas(s))
    getTreinosByPrograma(programaId).then((t) => vivo && setTreinos(t))
    getExerciciosByPrograma(programaId).then((e) => vivo && setExercicios(e))
    getNotasByPrograma(programaId).then((n) => vivo && setNotas(n))
    return () => {
      vivo = false
    }
  }, [programaId])
}

// ===== Lista de programas da modalidade =====
const ListaProgramasModalidade: React.FC<{
  programas: ProgramaAcompanhamentoRecord[]
  modalidade: ModalidadePrograma
  carregando: boolean
  onAbrir: (id: string) => void
  onImportar: () => void
  onNovo: () => void
  onExcluir: (id: string) => void
}> = ({ programas, modalidade, carregando, onAbrir, onImportar, onNovo, onExcluir }) => {
  const { toast } = useToast()
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="flex-1 text-sm text-gray-600">
            {carregando
              ? 'Carregando programas…'
              : programas.length === 0
                ? `Nenhum programa de ${modalidade === 'reabilitacao' ? 'reabilitação' : 'personal'} ainda. Crie um novo ou importe uma planilha.`
                : `${programas.length} programa(s) de ${modalidade === 'reabilitacao' ? 'reabilitação' : 'personal'}.`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onImportar}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Importar planilha
            </Button>
            <Button size="sm" onClick={onNovo}>
              <Plus className="h-4 w-4 mr-1" /> Novo programa
            </Button>
          </div>
        </div>
        <ul className="divide-y divide-gray-100">
          {programas.map((p) => (
            <li key={p.id} className="py-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAbrir(p.id)}
                className="flex-1 text-left text-sm font-bold text-gray-800 hover:text-[#8C6527] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C6527] rounded-lg px-2 py-1.5 hover:bg-[#FAF5EE]"
              >
                {p.nome}
              </button>
              <span className="text-xs text-gray-400">
                {p.unidade_duracao === 'dias'
                  ? 'dias'
                  : p.unidade_duracao === 'meses'
                    ? 'meses'
                    : 'semanas'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => onExcluir(p.id)}
                aria-label={`Excluir programa ${p.nome}`}
              >
                excluir
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
