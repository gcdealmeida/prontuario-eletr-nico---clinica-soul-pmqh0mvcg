import React, { useEffect, useId, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { extrairYouTubeId } from '@/components/programas/ModalDetalheExercicio'
import { salvarConteudoEditado } from '@/services/conteudoExercicios'
import type { ConteudoEditadoRecord } from '@/services/conteudoExercicios'
import type { ConteudoExercicio } from '@/lib/exerciciosConteudo/tipos'

interface ModalEditarConteudoExercicioProps {
  nome: string
  /** Conteúdo atualmente em exibição (editado ou curado) para pré-preencher. */
  conteudoAtual?: ConteudoExercicio
  /** Registro de edição manual já existente (tem prioridade no preenchimento). */
  editado?: ConteudoEditadoRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamado após salvar, com o registro gravado — a tela passa a exibi-lo. */
  onSalvo: (registro: ConteudoEditadoRecord) => void
}

/**
 * Formulário de edição do conteúdo de um exercício: foto (URL), vídeo do
 * YouTube (cole/cola o link), como executar, erros comuns e músculos.
 * Grava em `conteudo_exercicios` (1 registro por exercício).
 */
export const ModalEditarConteudoExercicio: React.FC<ModalEditarConteudoExercicioProps> = ({
  nome,
  conteudoAtual,
  editado,
  open,
  onOpenChange,
  onSalvo,
}) => {
  const { toast } = useToast()
  const idPrefix = useId()
  const [fotoUrl, setFotoUrl] = useState('')
  const [videoLink, setVideoLink] = useState('')
  const [comoExecutar, setComoExecutar] = useState('')
  const [errosComuns, setErrosComuns] = useState('')
  const [musculos, setMusculos] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Pré-preenche sempre que abre (conteúdo editado vence o curado).
  useEffect(() => {
    if (!open) return
    setFotoUrl(editado?.foto_url || conteudoAtual?.foto || '')
    setVideoLink(editado?.video_url || conteudoAtual?.videoUrl || '')
    setComoExecutar(editado?.como_executar ?? conteudoAtual?.descricao ?? '')
    setErrosComuns(editado?.erros_comuns ?? (conteudoAtual?.errosComuns ?? []).join('\n'))
    setMusculos(editado?.musculos ?? (conteudoAtual?.musculos ?? []).join(', '))
  }, [open, editado, conteudoAtual])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (salvando) return
    try {
      setSalvando(true)
      const videoId = extrairYouTubeId(videoLink)
      const registro = await salvarConteudoEditado({
        exercicio: nome,
        foto_url: fotoUrl.trim() || undefined,
        video_url: videoLink.trim() || undefined,
        video_id: videoId || undefined,
        como_executar: comoExecutar.trim() || undefined,
        erros_comuns: errosComuns.trim() || undefined,
        musculos: musculos.trim() || undefined,
      })
      toast({ title: 'Conteúdo do exercício atualizado.' })
      onSalvo(registro)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar o conteúdo',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[calc(100%-2rem)] max-h-[90dvh] p-0 overflow-hidden rounded-3xl border-[#E9E1D2] bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Editar conteúdo do exercício {nome}</DialogTitle>
          <DialogDescription>
            Corrija a foto, o vídeo e a explicação de execução deste exercício da biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-5 pb-3 border-b border-[#E9E1D2]">
          <h2 className="text-sm font-bold text-gray-900 break-words">Editar conteúdo — {nome}</h2>
          <p className="text-[11px] text-gray-500 mt-1">
            As alterações valem para toda a clínica e substituem o conteúdo padrão.
          </p>
        </div>

        <ScrollArea className="max-h-[calc(90dvh-160px)]">
          <form
            noValidate
            onSubmit={handleSalvar}
            className="px-5 py-4 space-y-4"
            aria-label={`Formulário de edição do exercício ${nome}`}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-foto`} className="text-xs font-semibold text-gray-700">
                Foto (URL da imagem)
              </Label>
              <Input
                id={`${idPrefix}-foto`}
                type="url"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://img.youtube.com/vi/.../hqdefault.jpg"
                className="h-9 text-xs rounded-xl"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
              <p className="text-[10px] text-gray-400">
                Cole o endereço (URL) de uma imagem da execução. Deixe vazio para manter a padrão.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-video`} className="text-xs font-semibold text-gray-700">
                Vídeo do YouTube
              </Label>
              <Input
                id={`${idPrefix}-video`}
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-9 text-xs rounded-xl"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
              <p className="text-[10px] text-gray-400">
                Cole o link do vídeo (watch, youtu.be ou shorts). Deixe vazio para remover o vídeo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor={`${idPrefix}-executar`}
                className="text-xs font-semibold text-gray-700"
              >
                Como executar
              </Label>
              <textarea
                id={`${idPrefix}-executar`}
                value={comoExecutar}
                onChange={(e) => setComoExecutar(e.target.value)}
                rows={5}
                className="w-full min-h-[100px] text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A46A]/40"
                placeholder="Descreva a execução passo a passo (um passo por linha)..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-erros`} className="text-xs font-semibold text-gray-700">
                Erros comuns <span className="font-normal text-gray-400">(um por linha)</span>
              </Label>
              <textarea
                id={`${idPrefix}-erros`}
                value={errosComuns}
                onChange={(e) => setErrosComuns(e.target.value)}
                rows={3}
                className="w-full min-h-[64px] text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A46A]/40"
                placeholder="Ex: Lombar arredondada ao descer a carga..."
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor={`${idPrefix}-musculos`}
                className="text-xs font-semibold text-gray-700"
              >
                Músculos trabalhados{' '}
                <span className="font-normal text-gray-400">(separados por vírgula)</span>
              </Label>
              <Input
                id={`${idPrefix}-musculos`}
                value={musculos}
                onChange={(e) => setMusculos(e.target.value)}
                placeholder="Ex: Peitoral maior, Deltoide anterior, Tríceps"
                className="h-9 text-xs rounded-xl"
                autoComplete="off"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={salvando}
                className="h-8 px-3 text-xs rounded-xl text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C] font-bold text-xs h-8 px-4 rounded-xl flex items-center gap-1.5"
              >
                {salvando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {salvando ? 'Salvando...' : 'Salvar conteúdo'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default ModalEditarConteudoExercicio
