import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Upload,
  X,
  BookOpen,
  Filter,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  getCatalogoExercicios,
  createExercicioCatalogo,
  updateExercicioCatalogo,
  deleteExercicioCatalogo,
  getFotoExercicioUrl,
} from '@/services/programas'
import { useToast } from '@/hooks/use-toast'
import type { ExercicioCatalogoRecord } from '@/types/database'

export interface ModalBancoExerciciosProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectExercicio: (ex: ExercicioCatalogoRecord) => void
}

export const ModalBancoExercicios: React.FC<ModalBancoExerciciosProps> = ({
  open,
  onOpenChange,
  onSelectExercicio,
}) => {
  const { toast } = useToast()
  const [exercicios, setExercicios] = useState<ExercicioCatalogoRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')

  // Estado para Criar / Editar exercício no Banco
  const [editando, setEditando] = useState<ExercicioCatalogoRecord | null>(null)
  const [modalFormAberto, setModalFormAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Campos do formulário
  const [formNome, setFormNome] = useState('')
  const [formCategoria, setFormCategoria] = useState('')
  const [formSubcategoria, setFormSubcategoria] = useState('')
  const [formLink, setFormLink] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formFotoArquivo, setFormFotoArquivo] = useState<File | null>(null)
  const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null)

  // Carregar catálogo quando o modal abre
  useEffect(() => {
    if (open) {
      carregarCatalogo()
    }
  }, [open])

  const carregarCatalogo = async () => {
    try {
      setLoading(true)
      const data = await getCatalogoExercicios()
      setExercicios(data)
    } catch (err: any) {
      console.error('Erro ao carregar catálogo de exercícios:', err)
      toast({
        title: 'Erro ao carregar banco de exercícios',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Lista única de categorias
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set<string>()
    exercicios.forEach((e) => {
      if (e.categoria) cats.add(e.categoria)
    })
    return Array.from(cats).sort()
  }, [exercicios])

  // Filtro por texto e categoria
  const exerciciosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return exercicios.filter((e) => {
      const matchCat =
        categoriaFiltro === 'todos' || e.categoria.toLowerCase() === categoriaFiltro.toLowerCase()
      if (!matchCat) return false
      if (!q) return true
      return (
        e.nome.toLowerCase().includes(q) ||
        (e.subcategoria && e.subcategoria.toLowerCase().includes(q)) ||
        (e.descricao && e.descricao.toLowerCase().includes(q))
      )
    })
  }, [exercicios, busca, categoriaFiltro])

  const abrirFormCriar = () => {
    setEditando(null)
    setFormNome('')
    setFormCategoria(
      categoriasDisponiveis[0] ||
        'Membros Inferiores — Musculação e Pesos Livres (Cadeia Anterior e Posterior)',
    )
    setFormSubcategoria('')
    setFormLink('')
    setFormDescricao('')
    setFormFotoArquivo(null)
    setFormFotoPreview(null)
    setModalFormAberto(true)
  }

  const abrirFormEditar = (ex: ExercicioCatalogoRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditando(ex)
    setFormNome(ex.nome)
    setFormCategoria(ex.categoria)
    setFormSubcategoria(ex.subcategoria || '')
    setFormLink(ex.link || '')
    setFormDescricao(ex.descricao || '')
    setFormFotoArquivo(null)
    setFormFotoPreview(getFotoExercicioUrl(ex))
    setModalFormAberto(true)
  }

  const handleExcluir = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente remover este exercício do catálogo?')) return
    try {
      await deleteExercicioCatalogo(id)
      setExercicios((prev) => prev.filter((item) => item.id !== id))
      toast({
        title: 'Exercício removido',
        description: 'O exercício foi excluído do catálogo.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível excluir o exercício.',
        variant: 'destructive',
      })
    }
  }

  const handleSalvarExercicioBanco = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNome.trim() || !formCategoria.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe ao menos o nome e o grupo/categoria.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSalvando(true)
      const formData = new FormData()
      formData.append('nome', formNome.trim())
      formData.append('categoria', formCategoria.trim())
      formData.append('subcategoria', formSubcategoria.trim())
      formData.append('link', formLink.trim())
      formData.append('descricao', formDescricao.trim())

      if (formFotoArquivo) {
        formData.append('foto', formFotoArquivo)
      }

      if (editando) {
        const atualizado = await updateExercicioCatalogo(editando.id, formData)
        setExercicios((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
        toast({
          title: 'Exercício atualizado',
          description: 'Alterações salvas no banco com sucesso.',
        })
      } else {
        const novo = await createExercicioCatalogo(formData)
        setExercicios((prev) => [novo, ...prev])
        toast({
          title: 'Exercício cadastrado',
          description: 'Novo exercício adicionado ao catálogo.',
        })
      }

      setModalFormAberto(false)
    } catch (err: any) {
      console.error('Erro ao salvar exercício no banco:', err)
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem válida (JPG, PNG, WebP).',
        variant: 'destructive',
      })
      return
    }
    setFormFotoArquivo(file)
    const reader = new FileReader()
    reader.onload = (evt) => {
      setFormFotoPreview(evt.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white border-[#E9E1D2] rounded-3xl shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-3 border-b border-[#E9E1D2] bg-gradient-to-r from-[#FAF5EE] via-white to-[#FAF5EE] flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#E9D5B5]/60 border border-[#C9A46A]/50 flex items-center justify-center text-[#8C6527]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                  Banco de Exercícios da Clínica SOUL
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 font-medium">
                  Selecione um exercício do catálogo para preencher a prescrição ou gerencie foto e
                  link de acesso.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={abrirFormCriar}
              className="bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs h-8 px-3 rounded-xl shadow-2xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo Exercício
            </Button>
          </DialogHeader>

          {/* Filtros e Busca */}
          <div className="p-4 border-b border-gray-100 bg-[#FAF7F1] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, subcategoria ou observação..."
                className="pl-9 h-9 text-xs rounded-xl bg-white border-gray-200"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="sm:w-72 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="h-9 w-full text-xs font-semibold rounded-xl border border-gray-200 bg-white px-2.5 text-gray-700 truncate"
              >
                <option value="todos">Todos os Grupos / Categorias ({exercicios.length})</option>
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista com scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Carregando catálogo completo de exercícios...
              </div>
            ) : exerciciosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                <p className="font-semibold text-gray-600">Nenhum exercício encontrado</p>
                <p>Tente ajustar a busca ou o grupo selecionado.</p>
              </div>
            ) : (
              exerciciosFiltrados.map((ex) => {
                const fotoUrl = getFotoExercicioUrl(ex)

                return (
                  <div
                    key={ex.id}
                    onClick={() => {
                      onSelectExercicio(ex)
                      onOpenChange(false)
                    }}
                    className="p-3 rounded-2xl bg-white border border-gray-150 hover:border-[#C9A46A] hover:bg-[#FAF8F3]/60 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Miniatura ou ícone */}
                      <div className="h-12 w-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {fotoUrl ? (
                          <img src={fotoUrl} alt={ex.nome} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#8C6527] transition-colors truncate">
                            {ex.nome}
                          </h4>
                          {ex.link && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                              <ExternalLink className="h-2.5 w-2.5" /> Com link
                            </span>
                          )}
                          {ex.foto && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                              <ImageIcon className="h-2.5 w-2.5" /> Com foto
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                          <strong className="text-gray-700">{ex.categoria}</strong>
                          {ex.subcategoria && ` • ${ex.subcategoria}`}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => abrirFormEditar(ex, e)}
                        className="h-8 px-2 text-[11px] text-[#8C6527] hover:bg-[#FAF5EE] rounded-xl flex items-center gap-1"
                        title="Editar foto, link ou detalhes"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleExcluir(ex.id, e)}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-xl"
                        title="Excluir do catálogo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3 bg-[#FAF5EE] hover:bg-[#C9A46A] text-[#8C6527] hover:text-[#33221C] border border-[#E9E1D2] font-bold text-xs rounded-xl group-hover:bg-[#C9A46A] group-hover:text-[#33221C] transition-all flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Selecionar
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#E9E1D2] bg-[#FAF7F1] flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>
              Total no banco: <strong>{exercicios.length}</strong> exercícios
            </span>
            <span>Clique em um exercício para inseri-lo na prescrição</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Modal: Formulário para Criar / Editar Exercício no Banco (Foto + Link) */}
      <Dialog open={modalFormAberto} onOpenChange={setModalFormAberto}>
        <DialogContent className="max-w-lg p-5 bg-white border-[#E9E1D2] rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-gray-900 tracking-tight">
              {editando ? 'Editar Exercício do Banco' : 'Novo Exercício no Banco'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Configure o nome, link para vídeo ou página e anexe uma foto/ilustração para o aluno
              visualizar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarExercicioBanco} className="space-y-3.5 mt-2 text-xs">
            {/* Nome */}
            <div>
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                Nome do Exercício *
              </Label>
              <Input
                required
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Agachamento búlgaro com halteres"
                className="h-9 text-xs rounded-xl mt-1"
              />
            </div>

            {/* Grupo / Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-[10px] text-gray-600 font-bold uppercase">
                  Grupo / Categoria *
                </Label>
                <Input
                  required
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  placeholder="Ex: Membros Inferiores — Musculação..."
                  className="h-9 text-xs rounded-xl mt-1"
                />
              </div>

              <div>
                <Label className="text-[10px] text-gray-600 font-bold uppercase">
                  Subcategoria (opcional)
                </Label>
                <Input
                  value={formSubcategoria}
                  onChange={(e) => setFormSubcategoria(e.target.value)}
                  placeholder="Ex: Agachamentos e Joelho-Dominantes"
                  className="h-9 text-xs rounded-xl mt-1"
                />
              </div>
            </div>

            {/* Link do Exercício para o paciente acessar */}
            <div>
              <Label className="text-[10px] text-[#8C6527] font-bold uppercase flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Link do Exercício (URL para paciente acessar)
              </Label>
              <Input
                type="url"
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou https://clinicasoul.com/..."
                className="h-9 text-xs rounded-xl mt-1"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                O aluno verá um botão "Acessar exercício" e a URL completa no PDF de entrega.
              </p>
            </div>

            {/* Foto do Exercício */}
            <div>
              <Label className="text-[10px] text-gray-600 font-bold uppercase flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Foto / Ilustração do Exercício
              </Label>
              <div className="mt-1 flex items-center gap-3">
                {formFotoPreview ? (
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <img
                      src={formFotoPreview}
                      alt="Prévia"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormFotoArquivo(null)
                        setFormFotoPreview(null)
                      }}
                      className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xs"
                      title="Remover foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E9E1D2] bg-[#FAF5EE] text-[#8C6527] font-bold text-xs cursor-pointer hover:bg-[#E9D5B5]/60 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {formFotoPreview ? 'Trocar Imagem' : 'Anexar Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Formatos JPG, PNG ou WebP (máx. 10MB).
                  </p>
                </div>
              </div>
            </div>

            {/* Descrição / Instruções */}
            <div>
              <Label className="text-[10px] text-gray-600 font-bold uppercase">
                Descrição / Execução
              </Label>
              <Textarea
                rows={2}
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Instruções de posicionamento, cadência e cuidados posturais..."
                className="text-xs rounded-xl mt-1 resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalFormAberto(false)}
                className="h-8 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="h-8 bg-gradient-to-r from-[#C9A46A] to-[#B88E52] hover:brightness-105 text-[#33221C] font-bold text-xs rounded-xl shadow-2xs"
              >
                {salvando ? 'Salvando...' : editando ? 'Atualizar Exercício' : 'Salvar no Catálogo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
