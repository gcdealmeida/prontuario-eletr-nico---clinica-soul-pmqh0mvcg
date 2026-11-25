import React, { useMemo, useState } from 'react'
import { Loader2, Plus, Save, Trash2, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProgramaExercicioRecord, ProgramaTreinoRecord } from '@/types/database'
import {
  createExercicio,
  createTreino,
  deleteExercicio,
  deleteTreino,
  updateTreino,
} from '@/services/programas'

interface PainelExerciciosAbaProps {
  programaId: string
  exercicios: ProgramaExercicioRecord[]
  treinos: ProgramaTreinoRecord[]
  onTreinosChange: (treinos: ProgramaTreinoRecord[]) => void
  onExerciciosChange: (exercicios: ProgramaExercicioRecord[]) => void
}

interface FormExercicio {
  nome: string
  series: string
  quantidade: string
  observacao: string
}

const FORM_VAZIO: FormExercicio = { nome: '', series: '', quantidade: '', observacao: '' }

export const PainelExerciciosAba: React.FC<PainelExerciciosAbaProps> = ({
  programaId,
  exercicios,
  treinos,
  onTreinosChange,
  onExerciciosChange,
}) => {
  const [nomeNovoTreino, setNomeNovoTreino] = useState('')
  const [criandoTreino, setCriandoTreino] = useState(false)
  const [treinoAtivoId, setTreinoAtivoId] = useState<string | null>(treinos[0]?.id ?? null)
  const [formPorTreino, setFormPorTreino] = useState<Record<string, FormExercicio>>({})
  const [salvandoEx, setSalvandoEx] = useState<string | null>(null)
  const [renomeandoId, setRenomeandoId] = useState<string | null>(null)
  const [nomeRenomeado, setNomeRenomeado] = useState('')

  const treinoAtivo = treinos.find((t) => t.id === treinoAtivoId) ?? treinos[0] ?? null
  const exerciciosDoTreino = useMemo(
    () => exercicios.filter((e) => e.treino_id === treinoAtivo?.id),
    [exercicios, treinoAtivo],
  )

  const formAtual = (treinoId: string): FormExercicio => formPorTreino[treinoId] ?? FORM_VAZIO

  const atualizarForm = (treinoId: string, patch: Partial<FormExercicio>) => {
    setFormPorTreino((prev) => ({
      ...prev,
      [treinoId]: { ...formAtual(treinoId), ...patch },
    }))
  }

  const handleCriarTreino = async () => {
    const nome = nomeNovoTreino.trim()
    if (!nome) return
    setCriandoTreino(true)
    try {
      const novo = await createTreino({
        programa_id: programaId,
        nome,
        ordem: treinos.length + 1,
        semana_indice: 1,
      })
      onTreinosChange([...treinos, novo])
      setTreinoAtivoId(novo.id)
      setNomeNovoTreino('')
    } finally {
      setCriandoTreino(false)
    }
  }

  const handleRenomear = async (treinoId: string) => {
    const nome = nomeRenomeado.trim()
    if (!nome) return
    await updateTreino(treinoId, { nome })
    onTreinosChange(treinos.map((t) => (t.id === treinoId ? { ...t, nome } : t)))
    setRenomeandoId(null)
  }

  const handleExcluirTreino = async (treinoId: string) => {
    await deleteTreino(treinoId)
    const restantes = treinos.filter((t) => t.id !== treinoId)
    onTreinosChange(restantes)
    if (treinoAtivoId === treinoId) setTreinoAtivoId(restantes[0]?.id ?? null)
  }

  const handleAdicionarExercicio = async (treinoId: string) => {
    const form = formAtual(treinoId)
    if (!form.nome.trim()) return
    setSalvandoEx(treinoId)
    try {
      const existentes = exercicios.filter((e) => e.treino_id === treinoId)
      const criado = await createExercicio({
        programa_id: programaId,
        treino_id: treinoId,
        nome: form.nome.trim(),
        series: form.series.trim() ? Number(form.series) : undefined,
        tipo_repeticao: 'reps',
        quantidade: form.quantidade.trim() || undefined,
        observacao: form.observacao.trim() || undefined,
        ordem: existentes.length + 1,
        semana_indice: 1,
      })
      onExerciciosChange([...exercicios, criado])
      atualizarForm(treinoId, FORM_VAZIO)
    } finally {
      setSalvandoEx(null)
    }
  }

  const handleExcluirExercicio = async (id: string) => {
    await deleteExercicio(id)
    onExerciciosChange(exercicios.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-[#8C6527]" />
            Treinos do programa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="novo-treino-nome" className="text-xs text-gray-600">
                Nome do novo treino
              </Label>
              <Input
                id="novo-treino-nome"
                value={nomeNovoTreino}
                onChange={(e) => setNomeNovoTreino(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCriarTreino()
                  }
                }}
                placeholder="Ex.: Treino A — Superiores"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleCriarTreino}
                disabled={criandoTreino || !nomeNovoTreino.trim()}
              >
                {criandoTreino ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Criar treino
              </Button>
            </div>
          </div>

          {treinos.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Nenhum treino definido ainda. Crie o primeiro treino acima ou importe um programa na
              aba Importação.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {treinos.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTreinoAtivoId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    treinoAtivo?.id === t.id
                      ? 'bg-[#1E2530] text-white border-[#1E2530]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.nome}
                  <span className="ml-1.5 font-normal opacity-70">
                    ({exercicios.filter((e) => e.treino_id === t.id).length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {treinoAtivo && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {renomeandoId === treinoAtivo.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nomeRenomeado}
                    onChange={(e) => setNomeRenomeado(e.target.value)}
                    className="h-8 w-56"
                    aria-label="Novo nome do treino"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRenomear(treinoAtivo.id)}
                  >
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenomeandoId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  {treinoAtivo.nome}
                </CardTitle>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRenomeandoId(treinoAtivo.id)
                    setNomeRenomeado(treinoAtivo.nome)
                  }}
                >
                  Renomear
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleExcluirTreino(treinoAtivo.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exercícios existentes */}
            <div className="space-y-2">
              {exerciciosDoTreino.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum exercício neste treino ainda.</p>
              ) : (
                exerciciosDoTreino.map((ex, i) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-2xl border border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {i + 1}. {ex.nome}
                      </p>
                      {ex.observacao && (
                        <p className="text-xs text-gray-500 mt-0.5">{ex.observacao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="border-[#E9E1D2] text-[#8C6527]">
                        {ex.series ?? '—'} séries
                      </Badge>
                      <Badge variant="outline" className="border-[#E9E1D2] text-[#8C6527]">
                        {ex.quantidade || '—'} reps
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleExcluirExercicio(ex.id)}
                        aria-label={`Remover exercício ${ex.nome}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Novo exercício */}
            <div className="p-4 rounded-2xl border border-dashed border-[#E9E1D2] bg-[#FAF5EE]/40 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#8C6527]">
                Adicionar exercício ao treino
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <Label htmlFor={`ex-nome-${treinoAtivo.id}`} className="text-xs text-gray-600">
                    Exercício
                  </Label>
                  <Input
                    id={`ex-nome-${treinoAtivo.id}`}
                    value={formAtual(treinoAtivo.id).nome}
                    onChange={(e) => atualizarForm(treinoAtivo.id, { nome: e.target.value })}
                    placeholder="Ex.: Supino reto com barra"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`ex-series-${treinoAtivo.id}`} className="text-xs text-gray-600">
                    Séries
                  </Label>
                  <Input
                    id={`ex-series-${treinoAtivo.id}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={formAtual(treinoAtivo.id).series}
                    onChange={(e) => atualizarForm(treinoAtivo.id, { series: e.target.value })}
                    placeholder="3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`ex-reps-${treinoAtivo.id}`} className="text-xs text-gray-600">
                    Repetições
                  </Label>
                  <Input
                    id={`ex-reps-${treinoAtivo.id}`}
                    value={formAtual(treinoAtivo.id).quantidade}
                    onChange={(e) => atualizarForm(treinoAtivo.id, { quantidade: e.target.value })}
                    placeholder="10-12"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`ex-obs-${treinoAtivo.id}`} className="text-xs text-gray-600">
                  Observações
                </Label>
                <Textarea
                  id={`ex-obs-${treinoAtivo.id}`}
                  value={formAtual(treinoAtivo.id).observacao}
                  onChange={(e) => atualizarForm(treinoAtivo.id, { observacao: e.target.value })}
                  placeholder="Ex.: controlar a fase excêntrica; pausa de 2s abaixo"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAdicionarExercicio(treinoAtivo.id)}
                disabled={salvandoEx === treinoAtivo.id || !formAtual(treinoAtivo.id).nome.trim()}
              >
                {salvandoEx === treinoAtivo.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Adicionar exercício
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
