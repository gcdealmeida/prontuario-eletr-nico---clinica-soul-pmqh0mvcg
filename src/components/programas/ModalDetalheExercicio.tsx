import React from 'react'
import { AlertTriangle, CheckCircle2, Play, BookOpen, X } from 'lucide-react'
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
import type { ConteudoExercicio } from '@/lib/exerciciosConteudo/tipos'

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
  categoria?: string
  subcategoria?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal de detalhe do exercício da Biblioteca: explicação de execução,
 * foto/ilustração, erros comuns, músculos trabalhados e vídeo do YouTube
 * embutido. Sem conteúdo curado, mostra o que existir + aviso discreto.
 */
export const ModalDetalheExercicio: React.FC<ModalDetalheExercicioProps> = ({
  nome,
  conteudo,
  categoria,
  subcategoria,
  open,
  onOpenChange,
}) => {
  const videoId = extrairYouTubeId(conteudo?.videoUrl)
  const semConteudo = !conteudo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90dvh] p-0 overflow-hidden rounded-3xl border-[#E9E1D2] bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalhe do exercício {nome}</DialogTitle>
          <DialogDescription>
            Explicação de execução, foto, músculos trabalhados e vídeo do exercício.
          </DialogDescription>
        </DialogHeader>

        {/* Cabeçalho com nome e badges */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E9E1D2] px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FAF5EE] text-[#8C6527] flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-gray-900 leading-snug break-words">{nome}</h2>
              {(categoria || subcategoria) && (
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
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 rounded-md shrink-0"
              aria-label="Fechar detalhe do exercício"
            >
              <X className="h-4 w-4" />
            </Button>
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
                  Ainda não há explicação, foto ou vídeo para este exercício na biblioteca curada.
                  Em breve estará disponível.
                </p>
              </div>
            ) : (
              <>
                {/* Foto / ilustração */}
                {conteudo.foto && (
                  <img
                    src={conteudo.foto}
                    alt={conteudo.fotoAlt || `Foto de execução do exercício ${nome}`}
                    width={640}
                    height={360}
                    loading="lazy"
                    className="w-full aspect-video object-cover rounded-2xl border border-[#E9E1D2] bg-[#FAF5EE]"
                  />
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
                {conteudo.descricao && (
                  <section aria-labelledby="det-ex-desc-titulo" className="space-y-1.5">
                    <h3
                      id="det-ex-desc-titulo"
                      className="text-xs font-bold text-gray-900 flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A46A]" />
                      Como executar
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                      {conteudo.descricao}
                    </p>
                  </section>
                )}

                {/* Erros comuns */}
                {conteudo.errosComuns?.length > 0 && (
                  <section aria-labelledby="det-ex-erros-titulo" className="space-y-1.5">
                    <h3
                      id="det-ex-erros-titulo"
                      className="text-xs font-bold text-gray-900 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Erros comuns
                    </h3>
                    <ul className="space-y-1">
                      {conteudo.errosComuns.map((erro) => (
                        <li key={erro} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                          {erro}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Músculos trabalhados */}
                {conteudo.musculos?.length > 0 && (
                  <section aria-labelledby="det-ex-musc-titulo" className="space-y-1.5">
                    <h3
                      id="det-ex-musc-titulo"
                      className="text-xs font-bold text-gray-900 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Músculos trabalhados
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {conteudo.musculos.map((m) => (
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
                {conteudo.videoUrl && !videoId && (
                  <a
                    href={conteudo.videoUrl}
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
      </DialogContent>
    </Dialog>
  )
}

export default ModalDetalheExercicio
