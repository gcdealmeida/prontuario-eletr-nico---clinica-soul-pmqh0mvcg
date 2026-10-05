import React, { useState } from 'react'
import {
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  QrCode,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface ModalLinkPreCadastroProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalLinkPreCadastro({ open, onOpenChange }: ModalLinkPreCadastroProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  // Gerar URL pública completa usando window.location.origin
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicLink = `${origin}/pre-cadastro`

  const mensagemWhatsApp = `Olá! Seja bem-vindo(a) à Clínica SOUL. ✨\n\nPara agilizar seu atendimento e preparar o seu prontuário clínico personalizado, por favor preencha seu pré-cadastro no link abaixo:\n${publicLink}\n\nLeva apenas 2 minutos e nossa equipe já terá suas informações prontas para a sua consulta!`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
      toast({
        title: 'Link copiado com sucesso!',
        description: 'Envie o link para o paciente preencher os dados cadastrais.',
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast({
        title: 'Não foi possível copiar automaticamente',
        description: 'Selecione e copie o endereço manualmente.',
        variant: 'destructive',
      })
    }
  }

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(mensagemWhatsApp)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl p-6 sm:p-7 bg-white border border-[#E9E1D2] shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF5EE] text-[#8C6527] border border-[#E3C89A]/60 shadow-2xs">
              <LinkIcon className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Link de Pré-Cadastro do Paciente
              </DialogTitle>
              <DialogDescription className="text-xs text-[#73574A]">
                Compartilhe com o paciente para que ele mesmo preencha dados cadastrais e anamnese
                prévia.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Como Funciona Card */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E9E1D2] space-y-2 text-xs text-[#5C4033]">
            <span className="font-bold text-[#8C6527] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="h-3.5 w-3.5" /> Como funciona o fluxo
            </span>
            <ol className="list-decimal list-inside space-y-1 text-[#73574A] leading-relaxed">
              <li>Você copia o link ou envia pelo WhatsApp diretamente para o paciente.</li>
              <li>
                O paciente responde na página pública da SOUL (sem precisar de login ou senha).
              </li>
              <li>
                O cadastro chega automaticamente na lista de pacientes com o badge{' '}
                <strong className="text-[#8C6527]">"Pré-cadastro"</strong>.
              </li>
              <li>Ao abrir o prontuário, as respostas já estarão disponíveis para a anamnese.</li>
            </ol>
          </div>

          {/* Input com Link e Botão Copiar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Link público direto</label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={publicLink}
                className="h-11 rounded-xl font-mono text-xs bg-gray-50/80 border-[#E9E1D2] text-[#33221C] select-all"
              />
              <Button
                type="button"
                onClick={handleCopy}
                className={`h-11 px-4 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  copied
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#C9A46A] hover:bg-[#B88E52] text-[#33221C]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" /> Copiar Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Ações de Compartilhamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="h-11 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              Enviar pelo WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(publicLink, '_blank')}
              className="h-11 rounded-xl border-[#E9E1D2] hover:bg-[#FAF8F5] text-xs font-semibold text-[#73574A] flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4 text-[#8C6527]" />
              Abrir Página Pública
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs text-gray-500 hover:text-gray-800"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
