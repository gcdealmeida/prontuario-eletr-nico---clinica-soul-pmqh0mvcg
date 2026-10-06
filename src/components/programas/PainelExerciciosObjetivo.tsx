import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Dumbbell,
  Clock,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink,
  Image as ImageIcon,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CurvaCargaGrafico } from './CurvaCargaGrafico'
import { ModalBancoExercicios } from './ModalBancoExercicios'
import { getFotoExercicioUrl } from '@/services/programas'
import type {
  ProgramaExercicioRecord,
  ProgramaMetaRecord,
  ProgramaRegistroCargaRecord,
  ProgramaTreinoRecord,
  TipoRepeticaoExercicio,
  ExercicioCatalogoRecord,
} from '@/types/database'

interface PainelExerciciosObjetivoProps {
  semanaIndice: number
  rotuloPeriodo: string
  metasDaSemana: ProgramaMetaRecord[]
  exercicios: ProgramaExercicioRecord[]
  treinos: ProgramaTreinoRecord[]
  treinoAtivoId?: string
  registrosCarga: Record<string, ProgramaRegistroCargaRecord[]> // chave: exercicio_id
  onSelecionarTreino: (treinoId: string) => void
  onCriarTreino: (nome: string, foco?: string) => Promise<ProgramaTreinoRecord | void>
  onRenomearTreino: (treinoId: string, novoNome: string) => Promise<void>
  onExcluirTreino: (treinoId: string) => Promise<void>
  onSalvarExercicio: (ex: Partial<ProgramaExercicioRecord>) => Promise<void>
  onExcluirExercicio: (id: string) => Promise<void>
  onAdicionarCarga: (
    exercicioId: string,
    valorKg: number,
    dataIso: string,
    reps?: string,
  ) => Promise<void>
}

export const PainelExerciciosObjetivo: React.FC<PainelExerciciosObjetivoProps> = ({
  semanaIndice,
  rotuloPeriodo,
  metasDaSemana,
  exercicios,
  treinos,
  treinoAtivoId,
  registrosCarga,
  onSelecionarTreino,
  onCriarTreino,
  onRenomearTreino,
  onExcluirTreino,
  onSalvarExercicio,
  onExcluirExercicio,
  onAdicionarCarga,
}) => {
  // Treinos desta semana
  const treinosDaSemana = treinos.filter((t) => t.semana_indice === semanaIndice)

  // Treino ativo selecionado
  const treinoSelecionado =
    treinosDaSemana.find((t) => t.id === treinoAtivoId) || treinosDaSemana[0]

  // Estado para criação rápida de novo treino
  const [modalNovoTreino, setModalNovoTreino] = useState(false)
  const [nomeNovoTreino, setNomeNovoTreino] = useState('')
  const [focoNovoTreino, setFocoNovoTreino] = useState('')
  const [salvandoTreino, setSalvandoTreino] = useState(false)

  // Estado para renomear treino
  const [editandoTreinoId, setEditandoTreinoId] = useState<string | null>(null)
  const [nomeEditado, setNomeEditado] = useState('')

  // Formulário de Exercício
  const [novoExNome, setNovoExNome] = useState('')
  const [novoExMetaId, setNovoExMetaId] = useState('')
  const [novoExSeries, setNovoExSeries] = useState<number | ''>(3)
  const [novoExTipo, setNovoExTipo] = useState<TipoRepeticaoExercicio>('reps')
  const [novoExQtd, setNovoExQtd] = useState('10-12')
  const [novoExIntervalo, setNovoExIntervalo] = useState('60s')
  const [novoExCarga, setNovoExCarga] = useState('')
  const [novoExObs, setNovoExObs] = useState('')
  const [novoExExercicioId, setNovoExExercicioId] = useState<string | undefined>(undefined)
  const [novoExLink, setNovoExLink] = useState('')
  const [novoExFotoUrl, setNovoExFotoUrl] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [modalBancoAberto, setModalBancoAberto] = useState(false)

  // Estado para modal / input rápido de nova carga
  const [exercicioCargaAberto, setExercicioCargaAberto] = useState<string | null>(null)
  const [novaCargaKg, setNovaCargaKg] = useState<number | ''>('')
  const [novaCargaData, setNovaCargaData] = useState(new Date().toISOString().substring(0, 10))
  const [novaCargaReps, setNovaCargaReps] = useState('')
  const [salvandoCarga, setSalvandoCarga] = useState(false)

  // Sugestão de próximo nome de treino (Treino A, Treino B, Treino C...)
  const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const proximaLetra = letras[treinosDaSemana.length] || `${treinosDaSemana.length + 1}`
  const sugestaoNome = `Treino ${proximaLetra}`

  // Efeito para garantir que ao trocar de semana, se o treinoAtivoId não pertencer à semana,
  // selecione automaticamente o primeiro treino da semana
  useEffect(() => {
    if (treinosDaSemana.length > 0) {
      const existeNestaSemana = treinosDaSemana.some((t) => t.id === treinoAtivoId)
      if (!existeNestaSemana) {
        onSelecionarTreino(treinosDaSemana[0].id)
      }
    }
  }, [semanaIndice, treinosDaSemana.length, treinoAtivoId])

  // Exercícios filtrados por esta semana e por este treino
  const exerciciosDesteTreino = exercicios.filter((e) => {
    if (e.semana_indice !== semanaIndice) return false
    if (treinoSelecionado) {
      return e.treino_id === treinoSelecionado.id || (!e.treino_id && treinosDaSemana.length <= 1)
    }
    return true
  })

  const handleSubmeterNovoTreino = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const nomeFinal = (nomeNovoTreino || sugestaoNome).trim()
    if (!nomeFinal) return
    try {
      setSalvandoTreino(true)
      await onCriarTreino(nomeFinal, focoNovoTreino.trim() || undefined)
      setNomeNovoTreino('')
      setFocoNovoTreino('')
      setModalNovoTreino(false)
    } finally {
      setSalvandoTreino(false)
    }
  }

  const handleSalvarRenomear = async (treinoId: string) => {
    if (!nomeEditado.trim()) {
      setEditandoTreinoId(null)
      return
    }
    await onRenomearTreino(treinoId, nomeEditado.trim())
    setEditandoTreinoId(null)
  }

  const handleCriarExercicio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoExNome.trim()) return

    try {
      setAdicionando(true)

      // Se ainda não existir nenhum treino nesta semana, cria automaticamente o "Treino A"
      let treinoDestinoId = treinoSelecionado?.id
      let treinoDestinoNome = treinoSelecionado?.nome || 'Treino A'

      if (!treinoDestinoId && treinosDaSemana.length === 0) {
        const treinoCriado = await onCriarTreino('Treino A')
        if (treinoCriado) {
          treinoDestinoId = treinoCriado.id
          treinoDestinoNome = treinoCriado.nome
        }
      }

      await onSalvarExercicio({
        semana_indice: semanaIndice,
        treino_id: treinoDestinoId,
        treino_nome: treinoDestinoNome,
        meta_id: novoExMetaId || (metasDaSemana[0]?.id ?? ''),
        exercicio_id: novoExExercicioId,
        nome: novoExNome.trim(),
        series: typeof novoExSeries === 'number' ? novoExSeries : 3,
        tipo_repeticao: novoExTipo,
        quantidade: novoExQtd || (novoExTipo === 'reps' ? '12' : '30s'),
        intervalo: novoExIntervalo || '60s',
        carga_prescrita: novoExCarga || '',
        observacao: novoExObs || '',
        link: novoExLink || '',
        foto_url: novoExFotoUrl || '',
        ordem: exerciciosDesteTreino.length + 1,
      })

      // Reset
      setNovoExNome('')
      setNovoExCarga('')
      setNovoExObs('')
      setNovoExExercicioId(undefined)
      setNovoExLink('')
      setNovoExFotoUrl('')
    } finally {
      setAdicionando(false)
    }
  }

  const handleRegistrarCarga = async (exercicioId: string) => {
    if (typeof novaCargaKg !== 'number' || isNaN(novaCargaKg)) return
    try {
      setSalvandoCarga(true)
      await onAdicionarCarga(
        exercicioId,
        novaCargaKg,
        new Date(novaCargaData).toISOString(),
        novaCargaReps,
      )
      setNovaCargaKg('')
      setNovaCargaReps('')
    } finally {
      setSalvandoCarga(false)
    }
  }

  const handleSelecionarExercicioCatalogo = (ex: ExercicioCatalogoRecord) => {
    setNovoExNome(ex.nome)
    setNovoExExercicioId(ex.id)
    if (ex.link) setNovoExLink(ex.link)
    if (ex.descricao && !novoExObs) setNovoExObs(ex.descricao)
    const url = getFotoExercicioUrl(ex)
    if (url) setNovoExFotoUrl(url)
  }

  return (
    <div className="space-y-5">
      {/* Modal Catálogo de Exercícios */}
      <ModalBancoExercicios
        open={modalBancoAberto}
        onOpenChange={setModalBancoAberto}
        onSelectExercicio={handleSelecionarExercicioCatalogo}
      />

      {/* CABEÇALHO DA SEMANA + SELETOR DE TREINOS (A, B, C...) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F1] border border-[#E9E1D2] space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl bg-orange-600 text-white font-bold text-xs uppercase tracking-wide">
              {rotuloPeriodo}
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Divisão de Treinos da Semana
              </h4>
              <p className="text-[11px] text-gray-500">
                Prescreva sessões divididas (ex: Treino A e B, ou dias específicos)
              </p>
            </div>
          </div>

          {/* Botão de Adicionar Treino à Semana */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setNomeNovoTreino(sugestaoNome)
                setModalNovoTreino(true)
              }}
              className="h-8 px-3 rounded-xl border-[#C9A46A] bg-white text-[#8C6527] hover:bg-[#FAF5EE] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-[#8C6527]" />
              Novo Treino ({sugestaoNome})
            </Button>
          </div>
        </div>

        {/* Modal Inline: Novo Treino */}
        {modalNovoTreino && (
          <form
            onSubmit={handleSubmeterNovoTreino}
            className="p-3.5 rounded-2xl bg-white border border-[#C9A46A] shadow-xs space-y-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <span className="text-xs font-bold text-[#8C6527] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Adicionar Treino à {rotuloPeriodo}
              </span>
              <button
                type="button"
                onClick={() => setModalNovoTreino(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-6">
                <Label className="text-[10px] font-bold text-gray-600 uppercase">
                  Nome do Treino (ex: Treino A, Treino B, Superiores, Pernas...) *
                </Label>
                <Input
                  required
                  value={nomeNovoTreino}
                  onChange={(e) => setNomeNovoTreino(e.target.value)}
                  placeholder={`Ex: ${sugestaoNome}`}
                  className="h-8 text-xs font-bold rounded-xl mt-0.5"
                />
              </div>
              <div className="sm:col-span-6">
                <Label className="text-[10px] font-bold text-gray-600 uppercase">
                  Foco do Treino (opcional)
                </Label>
                <Input
                  value={focoNovoTreino}
                  onChange={(e) => setFocoNovoTreino(e.target.value)}
                  placeholder="Ex: Quadríceps e Panturrilha, Peito e Tríceps..."
                  className="h-8 text-xs rounded-xl mt-0.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalNovoTreino(false)}
                className="h-7 text-xs rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoTreino}
                className="h-7 bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs rounded-lg px-3 shadow-2xs"
              >
                {salvandoTreino ? 'Criando...' : 'Criar Treino'}
              </Button>
            </div>
          </form>
        )}

        {/* ABAS / BOTÕES DOS TREINOS DA SEMANA */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {treinosDaSemana.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
              <span>Nenhum treino específico ainda.</span>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSubmeterNovoTreino()}
                className="h-7 text-xs bg-[#C9A46A] text-[#33221C] font-bold rounded-lg"
              >
                Criar Treino A Padrão
              </Button>
            </div>
          ) : (
            treinosDaSemana.map((t) => {
              const ativo = treinoSelecionado?.id === t.id
              const exCount = exercicios.filter(
                (e) =>
                  e.semana_indice === semanaIndice &&
                  (e.treino_id === t.id || (!e.treino_id && treinosDaSemana.length === 1)),
              ).length
              const editando = editandoTreinoId === t.id

              if (editando) {
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-1 bg-white border border-[#C9A46A] rounded-xl px-2 py-1 shadow-2xs"
                  >
                    <Input
                      autoFocus
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSalvarRenomear(t.id)
                        if (e.key === 'Escape') setEditandoTreinoId(null)
                      }}
                      className="h-7 text-xs font-bold w-36 px-1.5"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSalvarRenomear(t.id)}
                      className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50 rounded-md"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditandoTreinoId(null)}
                      className="h-6 w-6 p-0 text-gray-400 hover:bg-gray-100 rounded-md"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              }

              return (
                <div
                  key={t.id}
                  className={`group inline-flex items-center gap-1.5 rounded-2xl border transition-all text-xs font-bold pl-3 pr-1.5 py-1 ${
                    ativo
                      ? 'bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] text-[#33221C] border-[#B88E52] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#C9A46A] hover:bg-amber-50/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelecionarTreino(t.id)}
                    className="flex items-center gap-1.5 text-left py-0.5"
                  >
                    <Dumbbell
                      className={`h-3.5 w-3.5 ${ativo ? 'text-[#33221C]' : 'text-[#8C6527]'}`}
                    />
                    <span className="truncate max-w-[150px]">{t.nome}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        ativo ? 'bg-[#33221C]/20 text-[#33221C]' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {exCount}
                    </span>
                  </button>

                  <div className="flex items-center opacity-80 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditandoTreinoId(t.id)
                        setNomeEditado(t.nome)
                      }}
                      title="Renomear treino"
                      className={`h-6 w-6 p-0 rounded-md ${
                        ativo
                          ? 'text-[#33221C] hover:bg-black/10'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>

                    {treinosDaSemana.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (
                            confirm(
                              `Excluir o "${t.nome}"? Os exercícios deste treino também serão excluídos.`,
                            )
                          ) {
                            onExcluirTreino(t.id)
                          }
                        }}
                        title="Excluir treino"
                        className={`h-6 w-6 p-0 rounded-md ${
                          ativo
                            ? 'text-[#33221C] hover:bg-black/10'
                            : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Foco e Objetivos do Treino Selecionado */}
        {treinoSelecionado && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                Visualizando: <span className="text-[#8C6527]">{treinoSelecionado.nome}</span>
              </span>
              {treinoSelecionado.foco && (
                <span className="text-[11px] bg-white px-2 py-0.5 rounded-lg border border-gray-200 text-gray-700">
                  Foco: {treinoSelecionado.foco}
                </span>
              )}
            </div>

            {/* Metas da semana */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-400">Metas ativas:</span>
              {metasDaSemana.length === 0 ? (
                <span className="text-[11px] text-gray-400 italic">Nenhuma meta associada</span>
              ) : (
                metasDaSemana.map((m) => (
                  <span
                    key={m.id}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E9E1D2] text-[#8C6527] shadow-2xs"
                  >
                    {m.ordem}º {m.titulo}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE EXERCÍCIOS DO TREINO ATIVO */}
      {exerciciosDesteTreino.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-gray-200 text-center text-xs text-gray-400 space-y-2">
          <Dumbbell className="h-8 w-8 text-gray-300 mx-auto" />
          <p className="font-bold text-gray-700 text-sm">
            Nenhum exercício montado para o {treinoSelecionado?.nome || 'Treino A'}.
          </p>
          <p className="text-gray-400 max-w-md mx-auto">
            Utilize o formulário abaixo para prescrever exercícios específicos desta divisão (com
            séries, reps/tempo, intervalo, carga e link/foto).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exerciciosDesteTreino.map((ex) => {
            const metaRelacionada = metasDaSemana.find((m) => m.id === ex.meta_id)
            const cargas = registrosCarga[ex.id] || []
            const aberto = exercicioCargaAberto === ex.id

            return (
              <div
                key={ex.id}
                className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-3 hover:border-[#C9A46A]/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527] font-bold text-xs shrink-0">
                      <Dumbbell className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{ex.nome}</h4>
                        {treinoSelecionado && (
                          <span className="text-[10px] font-bold bg-[#FAF5EE] text-[#8C6527] border border-[#E9E1D2] px-2 py-0.5 rounded-full">
                            {treinoSelecionado.nome}
                          </span>
                        )}
                        {ex.link && (
                          <a
                            href={ex.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6527] hover:underline bg-[#FAF5EE] border border-[#E9E1D2] px-2 py-0.5 rounded-full"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            Acessar exercício
                          </a>
                        )}
                        {(ex.foto_url || ex.expand?.exercicio_id?.foto) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <ImageIcon className="h-2.5 w-2.5" /> Foto inclusa
                          </span>
                        )}
                      </div>
                      {metaRelacionada && (
                        <span className="text-[10px] font-bold text-[#8C6527] block mt-0.5">
                          Objetivo: {metaRelacionada.ordem}º {metaRelacionada.titulo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExercicioCargaAberto(aberto ? null : ex.id)}
                      className={`h-7 px-2.5 text-[11px] font-bold rounded-lg border flex items-center gap-1 ${
                        cargas.length > 0
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      Cargas ({cargas.length})
                      {aberto ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onExcluirExercicio(ex.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Métricas Prescritas do Exercício */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-gray-100">
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">
                      Séries
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {ex.series || '—'} séries
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">
                      {ex.tipo_repeticao === 'segundos' ? 'Duração (tempo)' : 'Repetições'}
                    </span>
                    <span className="font-bold text-gray-800 text-sm">
                      {ex.quantidade || '—'}{' '}
                      {ex.tipo_repeticao === 'segundos' ? 'segundos' : 'reps'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">
                      Intervalo
                    </span>
                    <span className="font-bold text-gray-800 text-sm">{ex.intervalo || '—'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/80">
                    <span className="text-[10px] font-bold text-[#8C6527] uppercase block">
                      Carga Prescrita / Atual
                    </span>
                    <span className="font-bold text-amber-950 text-sm">
                      {ex.carga_atual_kg !== undefined && ex.carga_atual_kg !== null
                        ? `${ex.carga_atual_kg} kg`
                        : ex.carga_prescrita || 'Livre / Peso do corpo'}
                    </span>
                  </div>
                </div>

                {/* Prévia da Foto do Exercício Prescrito */}
                {(ex.foto_url ||
                  (ex.expand?.exercicio_id && getFotoExercicioUrl(ex.expand.exercicio_id))) && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E9E1D2]/80">
                    <img
                      src={
                        ex.foto_url ||
                        (ex.expand?.exercicio_id
                          ? getFotoExercicioUrl(ex.expand.exercicio_id)!
                          : '')
                      }
                      alt={ex.nome}
                      className="h-16 w-24 object-cover rounded-lg border border-gray-200 shadow-2xs shrink-0"
                    />
                    <div className="text-xs space-y-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#8C6527] block">
                        Guia Visual de Execução
                      </span>
                      {ex.link && (
                        <a
                          href={ex.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#8C6527] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Acessar vídeo/página explicativa
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {ex.observacao && (
                  <p className="text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                    <strong>Obs/Pedido Específico:</strong> {ex.observacao}
                  </p>
                )}

                {/* Painel Expandido: Curva de Carga & Registro */}
                {aberto && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-white border border-[#E9E1D2] space-y-4 animate-in fade-in duration-150">
                    {/* Gráfico da Curva */}
                    <CurvaCargaGrafico registros={cargas} nomeExercicio={ex.nome} />

                    {/* Formulário Rápido de Registro de Nova Carga */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2 text-xs">
                      <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase">
                        <TrendingUp className="h-3.5 w-3.5 text-[#8C6527]" />
                        Adicionar Registro de Carga Realizada ({ex.nome})
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                        <div>
                          <Label className="text-[10px] text-gray-500 font-semibold">
                            Carga (kg)
                          </Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={novaCargaKg}
                            onChange={(e) =>
                              setNovaCargaKg(
                                e.target.value === '' ? '' : parseFloat(e.target.value),
                              )
                            }
                            placeholder="Ex: 40"
                            className="h-8 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 font-semibold">Data</Label>
                          <Input
                            type="date"
                            value={novaCargaData}
                            onChange={(e) => setNovaCargaData(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 font-semibold">
                            Reps feitas (opcional)
                          </Label>
                          <Input
                            value={novaCargaReps}
                            onChange={(e) => setNovaCargaReps(e.target.value)}
                            placeholder="Ex: 10, 10, 8"
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          disabled={salvandoCarga || typeof novaCargaKg !== 'number'}
                          onClick={() => handleRegistrarCarga(ex.id)}
                          className="h-8 bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-bold text-xs rounded-xl shadow-2xs"
                        >
                          Salvar Carga
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* FORMULÁRIO: ADICIONAR NOVO EXERCÍCIO AO TREINO SELECIONADO */}
      <form
        onSubmit={handleCriarExercicio}
        className="p-5 rounded-2xl bg-white border border-[#E9E1D2] shadow-xs space-y-3.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div>
            <Label className="text-xs font-bold text-[#8C6527] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Adicionar Exercício ao{' '}
              <span className="underline decoration-[#C9A46A]">
                {treinoSelecionado?.nome || 'Treino A'}
              </span>
            </Label>
            <p className="text-[10px] text-gray-400">
              Prescreva para {rotuloPeriodo} — {treinoSelecionado?.nome || 'Treino A'}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalBancoAberto(true)}
            className="h-8 px-3 rounded-xl border-[#C9A46A] bg-[#FAF5EE] text-[#8C6527] hover:bg-[#E9D5B5]/60 font-bold text-xs flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#8C6527]" />
            Buscar no Banco de Exercícios
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
          {/* Nome do exercício */}
          <div className="sm:col-span-4">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">
              Nome do Exercício *
            </Label>
            <Input
              required
              value={novoExNome}
              onChange={(e) => setNovoExNome(e.target.value)}
              placeholder="Ex: Agachamento Búlgaro, Supino Reto..."
              className="h-8 text-xs font-semibold rounded-xl mt-0.5"
            />
          </div>

          {/* Objetivo/Meta Vinculada */}
          <div className="sm:col-span-3">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">Objetivo / Meta</Label>
            <select
              value={novoExMetaId}
              onChange={(e) => setNovoExMetaId(e.target.value)}
              className="h-8 w-full text-xs font-semibold rounded-xl border border-gray-200 bg-white px-2 mt-0.5"
            >
              <option value="">Selecione a meta...</option>
              {metasDaSemana.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.ordem}º {m.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* Séries */}
          <div className="sm:col-span-2">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">Séries</Label>
            <Input
              type="number"
              min="1"
              value={novoExSeries}
              onChange={(e) =>
                setNovoExSeries(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              className="h-8 text-xs rounded-xl mt-0.5 font-bold"
            />
          </div>

          {/* Alternância Reps / Segundos */}
          <div className="sm:col-span-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                {novoExTipo === 'reps' ? 'Repetições' : 'Tempo (seg)'}
              </Label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNovoExTipo('reps')}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    novoExTipo === 'reps'
                      ? 'bg-[#C9A46A] text-[#33221C]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Reps
                </button>
                <button
                  type="button"
                  onClick={() => setNovoExTipo('segundos')}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    novoExTipo === 'segundos'
                      ? 'bg-[#C9A46A] text-[#33221C]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Segundos
                </button>
              </div>
            </div>
            <Input
              value={novoExQtd}
              onChange={(e) => setNovoExQtd(e.target.value)}
              placeholder={novoExTipo === 'reps' ? 'Ex: 10-12' : 'Ex: 45'}
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Intervalo */}
          <div className="sm:col-span-3">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">
              Intervalo (Descanso)
            </Label>
            <Input
              value={novoExIntervalo}
              onChange={(e) => setNovoExIntervalo(e.target.value)}
              placeholder="Ex: 60s, 90s, 2 min"
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Carga Prescrita */}
          <div className="sm:col-span-4">
            <Label className="text-[10px] text-[#8C6527] font-bold uppercase">
              Mensuração de Carga (kg)
            </Label>
            <Input
              value={novoExCarga}
              onChange={(e) => setNovoExCarga(e.target.value)}
              placeholder="Ex: 20kg halter, peso corporal..."
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Link para o Aluno Acessar */}
          <div className="sm:col-span-5">
            <Label className="text-[10px] text-[#8C6527] font-bold uppercase flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Link do Exercício (para paciente)
            </Label>
            <Input
              type="url"
              value={novoExLink}
              onChange={(e) => setNovoExLink(e.target.value)}
              placeholder="https://youtube.com/... ou link de vídeo"
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Foto URL */}
          <div className="sm:col-span-6">
            <Label className="text-[10px] text-gray-600 font-bold uppercase flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Foto / Ilustração (URL ou banco)
            </Label>
            <Input
              type="url"
              value={novoExFotoUrl}
              onChange={(e) => setNovoExFotoUrl(e.target.value)}
              placeholder="Preenchido do banco ou URL da imagem"
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>

          {/* Observações / Descrição */}
          <div className="sm:col-span-6">
            <Label className="text-[10px] text-gray-600 font-bold uppercase">
              Observações / Pedido Específico
            </Label>
            <Input
              value={novoExObs}
              onChange={(e) => setNovoExObs(e.target.value)}
              placeholder="Ex: Cadência 3010, foco em estabilização de pelve..."
              className="h-8 text-xs rounded-xl mt-0.5"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={adicionando || !novoExNome.trim()}
            className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs h-8 px-4 rounded-xl shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {adicionando ? 'Salvando...' : `Adicionar ao ${treinoSelecionado?.nome || 'Treino A'}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
