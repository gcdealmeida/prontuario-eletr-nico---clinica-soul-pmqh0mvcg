import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Pencil, Play, BookOpen, X, ImageOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import ModalEditarConteudoExercicio from '@/components/programas/ModalEditarConteudoExercicio'
import { getConteudoEditado, removerConteudoEditado } from '@/services/conteudoExercicios'
import type { ConteudoEditadoRecord } from '@/services/conteudoExercicios'
import type { ConteudoExercicio } from '@/lib/exerciciosConteudo/tipos'
import { normalizarNome } from '@/lib/exerciciosConteudo/tipos'

/** Extrai o ID do vídeo a partir de um ID puro ou de uma URL do YouTube. */
export function extrairYouTubeId(videoUrl?: string): string | null {
  if (!videoUrl) return null
  const url = videoUrl.trim()
  if (/^[\w-]{11}$/.test(url)) return url
  const m = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:.*&)?v=|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  return m ? m[1] : null
}

interface ModalDetalheExercicioProps {
  /** Nome do exercício tal como vem da coleção (ou do clique do usuário). */
  nome: string
  /** Conteúdo curado do dicionário — pode ser undefined (conteúdo em preparação). */
  conteudo?: ConteudoExercicio
  /** Registro de edição manual (conteudo_exercicios) — vence o curado. */
  editado?: ConteudoEditadoRecord | null
  categoria?: string
  subcategoria?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamado quando o usuário salva uma edição (a lista pode recarregar o selo). */
  onConteudoEditado?: (registro: ConteudoEditadoRecord) => void
  /** Chamado quando o usuário remove a edição manual. */
  onConteudoRemovido?: (nomeExercicio: string) => void
}

/**
 * Modal de detalhe do exercício da Biblioteca: explicação de execução,
 * foto/ilustração, erros comuns, músculos trabalhados e vídeo do YouTube
 * embutido. O conteúdo editado manualmente (coleção conteudo_exercicios)
 * vence o dicionário curado. Em qualquer exercício há o botão "Editar
 * conteúdo", que abre o formulário de correção.
 */
export const ModalDetalheExercicio: React.FC<ModalDetalheExercicioProps> = ({
  nome,
  conteudo,
  editado,
  categoria,
  subcategoria,
  open,
  onOpenChange,
  onConteudoEditado,
  onConteudoRemovido,
}) => {
  const { toast } = useToast()
  const [editando, setEditando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [editadoAtual, setEditadoAtual] = useState<ConteudoEditadoRecord | null>(editado ?? null)

  // Recarrega a edição do banco quando o modal abre (e quando o prop muda).
  useEffect(() => {
    setEditadoAtual(editado ?? null)
  }, [editado, open, nome])

  useEffect(() => {
    if (!open || editado) return
    let ativo = true
    getConteudoEditado(nome)
      .then((reg) => {
        if (ativo) setEditadoAtual(reg)
      })
      .catch(() => {
        /* sem edição manual — segue com o curado */
      })
    return () => {
      ativo = false
    }
  }, [open, nome, editado])

  const conteudoEfetivo: ConteudoExercicio | undefined = editadoAtual
    ? {
        descricao: editadoAtual.como_executar || '',
        errosComuns: (editadoAtual.erros_comuns || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        musculos: (editadoAtual.musculos || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        foto: editadoAtual.foto_url || undefined,
        videoUrl: editadoAtual.video_id
          ? `https://www.youtube-nocookie.com/watch?v=${editadoAtual.video_id}`
          : editadoAtual.video_url || undefined,
        fotoAlt: `Foto de execução do exercício ${nome}`,
      }
    : conteudo

  const videoId = extrairYouTubeId(conteudoEfetivo?.videoUrl)
  const semConteudo = !conteudoEfetivo

  const handleRemoverEdicao = async () => {
    if (!editadoAtual || removendo) return
    if (!confirm('Remover este conteúdo editado? O exercício volta ao conteúdo padrão.')) return
    try {
      setRemovendo(true)
      await removerConteudoEditado(editadoAtual.id)
      toast({ title: 'Conteúdo editado removido — exercício voltou ao padrão.' })
      setEditadoAtual(null)
      onConteudoRemovido?.(nome)
    } catch (err: any) {
      toast({
        title: 'Erro ao remover a edição',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setRemovendo(false)
    }
  }

  const handleSalvo = (registro: ConteudoEditadoRecord) => {
    setEditadoAtual(registro)
    onConteudoEditado?.(registro)
  }

  const temTexto = !!conteudoEfetivo?.descricao || (conteudoEfetivo?.errosComuns?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90dvh] p-0 overflow-hidden rounded-3xl border-[#E9E1D2] bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalhe do exercício {nome}</DialogTitle>
          <DialogDescription>
            Explicação de execução, foto, músculos trabalhados e vídeo do exercício.
          </DialogDescription>
        </DialogHeader>

        {/* Cabeçalho com nome, badges e botões de ação */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E9E1D2] px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FAF5EE] text-[#8C6527] flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-gray-900 leading-snug break-words">{nome}</h2>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {categoria && (
                  <Badge className="text-[10px] bg-[#FAF5EE] text-[#8C6527] border-[#E9E1D2] hover:bg-[#FAF5EE]">
                    {categoria}
                  </Badge>
                )}
                {subcategoria && (
                  <Badge className="text-[10px] bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50">
                    {subcategoria}
                  </Badge>
                )}
                {editadoAtual && (
                  <Badge className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50">
                    Editado
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditando(true)}
                className="h-7 px-2 text-[11px] font-semibold text-[#8C6527] hover:bg-[#FAF5EE] hover:text-[#8C6527] rounded-md"
                aria-label={`Editar conteúdo do exercício ${nome}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 rounded-md"
                aria-label="Fechar detalhe do exercício"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90dvh-88px)]">
          <div className="px-5 pb-6 space-y-5">
            {semConteudo ? (
              <div className="rounded-2xl border border-dashed border-[#DFBF8E] bg-[#FAF5EE]/60 p-4 text-center space-y-2">
                <p className="text-xs font-semibold text-[#8C6527]">
                  Conteúdo detalhado em preparação
                </p>
                <p className="text-[11px] text-gray-500">
                  Ainda não há explicação, foto ou vídeo para este exercício. Use o botão{' '}
                  <span className="font-semibold text-[#8C6527]">Editar</span> (no topo) para
                  cadastrar a foto, o vídeo e a execução agora mesmo.
                </p>
              </div>
            ) : (
              <>
                {/* Selo de edição manual com ação de desfazer */}
                {editadoAtual && (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/70 border border-emerald-200 px-3 py-2">
                    <p className="text-[10px] font-semibold text-emerald-800">
                      Conteúdo ajustado manualmente
                      {editadoAtual.atualizado_por ? ` por ${editadoAtual.atualizado_por}` : ''}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoverEdicao}
                      disabled={removendo}
                      className="h-6 px-2 text-[10px] text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 rounded-md"
                      aria-label={`Remover edição manual do exercício ${nome}`}
                    >
                      Voltar ao padrão
                    </Button>
                  </div>
                )}

                {/* Foto / ilustração */}
                {conteudoEfetivo.foto ? (
                  <img
                    src={conteudoEfetivo.foto}
                    alt={conteudoEfetivo.fotoAlt || `Foto de execução do exercício ${nome}`}
                    width={640}
                    height={360}
                    loading="lazy"
                    className="w-full aspect-video object-cover rounded-2xl border border-[#E9E1D2] bg-[#FAF5EE]"
                  />
                ) : (
                  temTexto && (
                    <div className="w-full aspect-video rounded-2xl border border-dashed border-[#E9E1D2] bg-[#FAF5EE]/50 flex flex-col items-center justify-center gap-1.5 text-[#8C6527]">
                      <ImageOff className="h-6 w-6" aria-hidden="true" />
                      <p className="text-[11px]">Sem foto cadastrada</p>
                    </div>
                  )
                )}

                {/* Vídeo YouTube embutido */}
                {videoId && (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#E9E1D2] bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                      title={`Vídeo do exercício ${nome}`}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Explicação */}
                {conteudoEfetivo.descricao && (
                  <section aria-labelledby="det-ex-desc-titulo" className="space-y-1.5">
                    <h3
                      id="det-ex-desc-titulo"
                      className="text-xs font-bold text-gray-900 flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A46A]" />
                      Como executar
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                      {conteudoEfetivo.descricao}
                    </p>
                  </section>
                )}

                {/* Erros comuns */}
                {(conteudoEfetivo.errosComuns?.length ?? 0) > 0 && (
                  <section aria-labelledby="det-ex-erros-titulo" className="space-y-1.5">
                    <h3
                      id="det-ex-erros-titulo"
                      className="text-xs font-bold text-gray-900 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Erros comuns
                    </h3>
                    <ul className="space-y-1">
                      {conteudoEfetivo.errosComuns.map((erro) => (
                        <li key={erro} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                          {erro}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Músculos trabalhados */}
                {(conteudoEfetivo.musculos?.length ?? 0) > 0 && (
                  <section aria-labelledby="det-ex-musc-titulo" className="space-y-1.5">
                    <h3
                      id="det-ex-musc-titulo"
                      className="text-xs font-bold text-gray-900 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Músculos trabalhados
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {conteudoEfetivo.musculos.map((m) => (
                        <Badge
                          key={m}
                          className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Link do vídeo, caso o ID não tenha sido reconhecido */}
                {conteudoEfetivo.videoUrl && !videoId && (
                  <a
                    href={conteudoEfetivo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6527] hover:underline"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Assistir ao vídeo do exercício
                  </a>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <ModalEditarConteudoExercicio
          nome={nome}
          conteudoAtual={conteudo}
          editado={editadoAtual}
          open={editando}
          onOpenChange={(v) => {
            setEditando(v)
            if (!v) onOpenChange(true)
          }}
          onSalvo={handleSalvo}
        />
      </DialogContent>
    </Dialog>
  )
}

export default ModalDetalheExercicio
