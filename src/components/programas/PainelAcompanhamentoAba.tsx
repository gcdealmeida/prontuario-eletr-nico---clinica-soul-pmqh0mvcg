import React, { useMemo, useState } from 'react'
import { CheckCircle2, Circle, ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ProgramaAcompanhamentoNotaRecord, ProgramaSemanaRecord } from '@/types/database'
import { createNotaAcompanhamento, deleteNotaAcompanhamento } from '@/services/programas'

interface PainelAcompanhamentoAbaProps {
  programaId: string
  semanas: ProgramaSemanaRecord[]
  notas: ProgramaAcompanhamentoNotaRecord[]
  onNotasChange: (notas: ProgramaAcompanhamentoNotaRecord[]) => void
}

const ROTULO_CUMPRIMENTO: Record<string, string> = {
  pleno: 'Cumprimento pleno',
  parcial: 'Cumprimento parcial',
  nao: 'Não cumprido',
}

const COR_CUMPRIMENTO: Record<string, string> = {
  pleno: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  parcial: 'bg-amber-100 text-amber-800 border-amber-200',
  nao: 'bg-red-100 text-red-800 border-red-200',
}

export const PainelAcompanhamentoAba: React.FC<PainelAcompanhamentoAbaProps> = ({
  programaId,
  semanas,
  notas,
  onNotasChange,
}) => {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [semanaIndice, setSemanaIndice] = useState('')
  const [cumprimento, setCumprimento] = useState<'pleno' | 'parcial' | 'nao'>('pleno')
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const semanasCompletas = useMemo(
    () =>
      semanas.length > 0
        ? semanas
        : Array.from({ length: 12 }, (_, i) => ({ indice: i + 1 }) as ProgramaSemanaRecord),
    [semanas],
  )

  const totalSemanas = semanasCompletas.length
  const cumpridas = semanas.filter((s) => s.cumprida).length
  const pct = totalSemanas > 0 ? Math.round((cumpridas / totalSemanas) * 100) : 0

  const handleAdicionarNota = async () => {
    if (!titulo.trim()) return
    setSalvando(true)
    try {
      const criada = await createNotaAcompanhamento({
        programa_id: programaId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        semana_indice: semanaIndice ? Number(semanaIndice) : undefined,
        cumprimento,
      })
      onNotasChange([criada, ...notas])
      setTitulo('')
      setDescricao('')
      setSemanaIndice('')
      setCumprimento('pleno')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluirNota = async (id: string) => {
    setExcluindoId(id)
    try {
      await deleteNotaAcompanhamento(id)
      onNotasChange(notas.filter((n) => n.id !== id))
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Resumo do cumprimento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#8C6527]" />
            Evolução do cliente no programa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8C6527] transition-all"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Percentual de semanas cumpridas"
              />
            </div>
            <span className="text-sm font-black text-[#1E2530]">{pct}%</span>
          </div>
          <p className="text-xs text-gray-500">
            {cumpridas} de {totalSemanas} {'semanas/dias/meses'} cumpridas — marque a semana como
            "Concluída" na aba Periodização para atualizar aqui.
          </p>

          <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
            {semanasCompletas.map((s) => (
              <li
                key={s.indice}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold',
                  s.cumprida
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-gray-50 border-gray-200 text-gray-500',
                )}
              >
                {s.cumprida ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {s.indice}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Histórico de observações do profissional */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Observações do profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-2xl border border-dashed border-[#E9E1D2] bg-[#FAF5EE]/40 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="nota-titulo" className="text-xs text-gray-600">
                  Título
                </Label>
                <Input
                  id="nota-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Progresso de carga no agachamento"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nota-semana" className="text-xs text-gray-600">
                  Semana
                </Label>
                <Select value={semanaIndice} onValueChange={setSemanaIndice}>
                  <SelectTrigger id="nota-semana" className="mt-1 w-full">
                    <SelectValue placeholder="Geral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Geral</SelectItem>
                    {semanasCompletas.map((s) => (
                      <SelectItem key={s.indice} value={String(s.indice)}>
                        {s.indice}ª
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <Label htmlFor="nota-descricao" className="text-xs text-gray-600">
                  Descrição
                </Label>
                <Textarea
                  id="nota-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: paciente relatou menos dor; aumentamos 2 kg na perna."
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nota-cumprimento" className="text-xs text-gray-600">
                  Cumprimento
                </Label>
                <Select
                  value={cumprimento}
                  onValueChange={(v) => setCumprimento(v as 'pleno' | 'parcial' | 'nao')}
                >
                  <SelectTrigger id="nota-cumprimento" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pleno">Pleno</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="nao">Não cumprido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAdicionarNota}
              disabled={salvando || !titulo.trim()}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Adicionar observação
            </Button>
          </div>

          {notas.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Nenhuma observação registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {notas.map((n) => (
                <li
                  key={n.id}
                  className="p-3 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{n.titulo}</p>
                      {n.semana_indice ? (
                        <Badge variant="outline" className="border-[#E9E1D2] text-[#8C6527]">
                          {n.semana_indice}ª semana
                        </Badge>
                      ) : null}
                      {n.cumprimento ? (
                        <Badge
                          variant="outline"
                          className={cn('border', COR_CUMPRIMENTO[n.cumprimento])}
                        >
                          {ROTULO_CUMPRIMENTO[n.cumprimento]}
                        </Badge>
                      ) : null}
                    </div>
                    {n.descricao && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                        {n.descricao}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {n.autor_nome ? `${n.autor_nome} • ` : ''}
                      {new Date(n.created).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                    onClick={() => handleExcluirNota(n.id)}
                    disabled={excluindoId === n.id}
                    aria-label={`Remover observação ${n.titulo}`}
                  >
                    {excluindoId === n.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
