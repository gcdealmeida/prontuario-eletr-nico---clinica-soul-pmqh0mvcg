/**
 * Painel ACESSO — cartão de "Acesso Público do Cliente" com o link de
 * Pré-Avaliação via Link (copiar, WhatsApp e opções de compartilhamento).
 * Originalmente exibido no Painel Geral (/painel); movido para a tela
 * de Gestão da Clínica (/gestao) como aba dedicada.
 */
import { useState } from 'react'
import { Link as LinkIcon, Copy, Check, MessageCircle, Share2 } from 'lucide-react'

import { ModalLinkPreCadastro } from '@/components/ModalLinkPreCadastro'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CLINICA_WHATSAPP } from '@/lib/constants'

export default function PainelAcesso() {
  const [copiedLink, setCopiedLink] = useState(false)
  const [modalLinkPreCadastroOpen, setModalLinkPreCadastroOpen] = useState(false)
  const { toast } = useToast()

  // Link público direto de pré-avaliação/pré-cadastro (padrão com versão de cache)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicPreCadastroLink = `${origin}/pre-cadastro?v=0.0.55`

  const handleCopyPreCadastroLink = async () => {
    try {
      await navigator.clipboard.writeText(publicPreCadastroLink)
      setCopiedLink(true)
      toast({
        title: 'Link copiado com sucesso!',
        description: 'Repasse o link para o cliente preencher o cadastro e anamnese.',
      })
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      toast({
        title: 'Não foi possível copiar automaticamente',
        description: 'Abra as opções de compartilhamento para copiar o link.',
        variant: 'destructive',
      })
    }
  }

  const handleSharePreCadastroWhatsApp = () => {
    const mensagem = `Olá! Seja bem-vindo(a) à Clínica SOUL. ✨\n\n*Pré-Cadastro - Clínica Soul*\nPara agilizar seu atendimento e preparar o seu prontuário clínico personalizado, por favor preencha seu pré-cadastro no link abaixo:\n${publicPreCadastroLink}\n\nLeva apenas 2 minutos e seus dados chegam diretamente à nossa equipe clínica!`
    const encoded = encodeURIComponent(mensagem)
    // Com número da clínica configurado (VITE_CLINICA_WHATSAPP), abre direto a conversa;
    // sem número, abre o WhatsApp com a mensagem pronta para o usuário escolher o contato.
    window.open(
      CLINICA_WHATSAPP
        ? `https://wa.me/${CLINICA_WHATSAPP}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`,
      '_blank',
    )
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#FAF5EE] via-white to-[#F6EDE0] border-2 border-[#E3C89A] hover:border-[#C9A46A] shadow-xs transition-all duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#8C6527] to-[#B88E52] text-white flex items-center justify-center shrink-0 shadow-md">
              <LinkIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] bg-[#E3C89A]/50 px-2.5 py-0.5 rounded-full inline-block">
                  Acesso Público do Cliente
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 hidden sm:inline-block">
                  Sem necessidade de login
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#4A322A] mt-1">
                Pré-Avaliação via Link
              </h2>
              <p className="text-xs text-[#73574A] mt-0.5">
                Copie o link público para repassar ao cliente preencher o cadastro e anamnese
                prévia.
              </p>
            </div>
          </div>

          {/* Visualização do Link e Ações Rápidas de Cópia e Compartilhamento */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:shrink-0 pt-2 lg:pt-0 border-t border-[#E9E1D2]/80 lg:border-t-0">
            {/* Badge/Pill do link encurtado visualmente */}
            <div
              onClick={handleCopyPreCadastroLink}
              title="Clique para copiar o link completo"
              className="flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 rounded-xl bg-white/90 border border-[#E9E1D2] hover:border-[#C9A46A] text-[#73574A] cursor-pointer group/link transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="font-mono text-xs font-semibold text-[#4A322A] group-hover/link:text-[#8C6527] truncate max-w-[220px] sm:max-w-[260px]">
                  .../pre-cadastro
                </span>
              </div>
              <span className="text-[11px] text-[#8C6527] font-medium underline sm:no-underline sm:text-gray-400 group-hover/link:text-[#8C6527] shrink-0">
                {copiedLink ? 'Copiado!' : 'Copiar'}
              </span>
            </div>

            {/* Botão Principal: Copiar Link */}
            <Button
              type="button"
              onClick={handleCopyPreCadastroLink}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                copiedLink
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] border border-[#DFBF8E]/60'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5" />
                  Copiar Link
                </>
              )}
            </Button>

            {/* Botão WhatsApp direto */}
            <Button
              type="button"
              onClick={handleSharePreCadastroWhatsApp}
              title="Compartilhar via WhatsApp com mensagem pronta"
              className="h-10 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            {/* Botão Modal de Compartilhamento Completo */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalLinkPreCadastroOpen(true)}
              title="Abrir opções completas de compartilhamento e QR Code"
              className="h-10 px-3 rounded-xl border-[#E3C89A] hover:bg-[#FAF4EA] text-[#8C6527] text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Mais Opções</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento do Link de Pré-Avaliação */}
      <ModalLinkPreCadastro
        open={modalLinkPreCadastroOpen}
        onOpenChange={setModalLinkPreCadastroOpen}
      />
    </>
  )
}
