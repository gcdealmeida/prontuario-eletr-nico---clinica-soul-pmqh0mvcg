import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Trash2, BookOpen, Dumbbell, PencilLine } from 'lucide-react'
import ModalDetalheExercicio from '@/components/programas/ModalDetalheExercicio'
import { buscarConteudo } from '@/lib/exerciciosConteudo'
import { normalizarNome } from '@/lib/exerciciosConteudo/tipos'
import { getConteudosEditados } from '@/services/conteudoExercicios'
import type { ConteudoEditadoRecord } from '@/services/conteudoExercicios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  getCatalogoExercicios,
  createExercicioCatalogo,
  deleteExercicioCatalogo,
} from '@/services/programas'
import type { ExercicioCatalogoRecord } from '@/types/database'

interface BibliotecaExerciciosAbaProps {
  /** Modalidade da área: usado como categoria sugerida no cadastro. */
  modalidade: 'reabilitacao' | 'personal'
}

/**
 * Biblioteca de Exercícios — catálogo reutilizável (coleção `exercicios` do
 * backend), compartilhado entre as áreas Reabilitação e Personal. O conteúdo
 * editado manualmente (coleção `conteudo_exercicios`) vence o dicionário
 * curado e recebe selo "Editado".
 */
export const BibliotecaExerciciosAba: React.FC<BibliotecaExerciciosAbaProps> = ({ modalidade }) => {
  const { toast } = useToast()
  // Edições manuais (conteudo_exercicios): chave = nome normalizado do exercício.
  const [editados, setEditados] = useState<Map<string, ConteudoEditadoRecord>>(new Map())
  const [itens, setItens] = useState<ExercicioCatalogoRecord[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Detalhe do exercício: modal aberto com o exercício clicado no card.
  const [detalhe, setDetalhe] = useState<ExercicioCatalogoRecord | null>(null)
  const abrirDetalhe = (ex: ExercicioCatalogoRecord) => setDetalhe(ex)
  const fecharDetalhe = (open: boolean) => {
    if (!open) setDetalhe(null)
  }
  const edicaoDe = useCallback(
    (nome: string): ConteudoEditadoRecord | null => editados.get(normalizarNome(nome)) ?? null,
    [editados],
  )

  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [descricao, setDescricao] = useState('')

  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      const lista = await getCatalogoExercicios()
      // Conteúdos editados manualmente vencem o dicionário curado: carrega em lote.
      getConteudosEditados(lista.map((i) => i.nome))
        .then((mapa) => setEditados(mapa))
        .catch(() => {
          /* sem edições — segue com o conteúdo curado */
        })
      setItens(lista)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar biblioteca',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }, [toast])

  useEffect(() => {
    carregar()
  }, [carregar])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast({ title: 'Informe o nome do exercício.', variant: 'destructive' })
      return
    }
    try {
      setSalvando(true)
      await createExercicioCatalogo({
        nome: nome.trim(),
        categoria:
          categoria.trim() || (modalidade === 'reabilitacao' ? 'Reabilitação' : 'Personal'),
        subcategoria: subcategoria.trim() || undefined,
        descricao: descricao.trim() || undefined,
      })
      toast({ title: 'Exercício adicionado à biblioteca.' })
      setNome('')
      setCategoria('')
      setSubcategoria('')
      setDescricao('')
      setMostrarForm(false)
      carregar()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar exercício',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir este exercício da biblioteca?')) return
    try {
      await deleteExercicioCatalogo(id)
      setItens(itens.filter((i) => i.id !== id))
      toast({ title: 'Exercício removido da biblioteca.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const filtrados = itens.filter(
    (i) =>
      i.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (i.categoria || '').toLowerCase().includes(busca.toLowerCase()) ||
      (i.subcategoria || '').toLowerCase().includes(busca.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar exercício por nome ou grupo muscular..."
            className="pl-9 h-9 text-xs rounded-xl bg-white border-gray-200"
            aria-label="Buscar exercício na biblioteca"
          />
        </div>
        <Button
          type="button"
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold text-xs h-9 px-4 rounded-xl shadow-sm flex items-center gap-2 border border-[#DFBF8E]/40"
        >
          <Plus className="h-4 w-4" />
          {mostrarForm ? 'Fechar formulário' : 'Novo Exercício'}
        </Button>
      </div>

      {mostrarForm && (
        <form
          onSubmit={handleSalvar}
          className="p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-xs space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bib-ex-nome" className="text-xs font-semibold text-gray-700">
                Nome do exercício *
              </Label>
              <Input
                id="bib-ex-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Agachamento Livre"
                className="h-9 text-xs rounded-xl"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bib-ex-categoria" className="text-xs font-semibold text-gray-700">
                Grupo muscular / categoria
              </Label>
              <Input
                id="bib-ex-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder={
                  modalidade === 'reabilitacao' ? 'Ex: Reabilitação — Joelho' : 'Ex: Peito'
                }
                className="h-9 text-xs rounded-xl"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bib-ex-sub" className="text-xs font-semibold text-gray-700">
                Subcategoria
              </Label>
              <Input
                id="bib-ex-sub"
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                placeholder="Ex: Acessório, Máquina, Livre"
                className="h-9 text-xs rounded-xl"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bib-ex-desc" className="text-xs font-semibold text-gray-700">
              Descrição / observações de execução
            </Label>
            <textarea
              id="bib-ex-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full min-h-[60px] text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A46A]/40"
              placeholder="Como executar, cuidados, progressões..."
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={salvando}
              className="bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-bold text-xs h-8 px-4 rounded-xl"
            >
              {salvando ? 'Salvando...' : 'Salvar na Biblioteca'}
            </Button>
          </div>
        </form>
      )}

      {carregando ? (
        <div className="p-10 text-center text-xs text-gray-400">Carregando biblioteca...</div>
      ) : filtrados.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[#E9E1D2] text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-[#FAF5EE] text-[#8C6527] flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {busca ? 'Nenhum exercício encontrado' : 'Biblioteca vazia'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Cadastre exercícios reutilizáveis — eles ficam disponíveis ao montar os treinos nas abas
            de Exercícios de Reabilitação e de Personal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((ex) => (
            <button
              type="button"
              key={ex.id}
              onClick={() => abrirDetalhe(ex)}
              className="text-left w-full p-4 rounded-2xl bg-white border border-[#E9E1D2] shadow-xs space-y-2 hover:border-[#C9A46A]/60 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A46A]/60 transition-colors"
              aria-label={`Ver detalhes do exercício ${ex.nome}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-[#FAF5EE] text-[#8C6527] flex items-center justify-center shrink-0">
                    <Dumbbell className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 truncate">{ex.nome}</h4>
                </div>
                <Button
                  type="button"
                  tabIndex={-1}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExcluir(ex.id)}
                  className="h-6 w-6 p-0 text-gray-300 hover:text-red-600 rounded-md shrink-0"
                  aria-label={`Excluir exercício ${ex.nome} da biblioteca`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ex.categoria && (
                  <Badge className="text-[10px] bg-[#FAF5EE] text-[#8C6527] border-[#E9E1D2] hover:bg-[#FAF5EE]">
                    {ex.categoria}
                  </Badge>
                )}
                {ex.subcategoria && (
                  <Badge className="text-[10px] bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
                    {ex.subcategoria}
                  </Badge>
                )}
                {edicaoDe(ex.nome) && (
                  <Badge className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50 gap-1">
                    <PencilLine className="h-2.5 w-2.5" aria-hidden="true" />
                    Editado
                  </Badge>
                )}
              </div>
              {ex.descricao && (
                <p className="text-[11px] text-gray-500 line-clamp-2">{ex.descricao}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <ModalDetalheExercicio
        nome={detalhe?.nome ?? ''}
        conteudo={detalhe ? buscarConteudo(detalhe.nome) : undefined}
        editado={detalhe ? edicaoDe(detalhe.nome) : null}
        categoria={detalhe?.categoria}
        subcategoria={detalhe?.subcategoria}
        open={detalhe !== null}
        onOpenChange={fecharDetalhe}
        onConteudoEditado={(registro) => {
          const chave = normalizarNome(
            registro.exercicio_normalizado || registro.exercicio || detalhe?.nome || '',
          )
          if (!chave) return
          setEditados((prev) => new Map(prev).set(chave, registro))
        }}
        onConteudoRemovido={(nomeExercicio) => {
          const chave = normalizarNome(nomeExercicio)
          setEditados((prev) => {
            const proximo = new Map(prev)
            proximo.delete(chave)
            return proximo
          })
        }}
      />
    </div>
  )
}
