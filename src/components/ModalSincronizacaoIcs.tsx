import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Bell,
  Clock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  getOrGenerateCalendarToken,
  regenerateCalendarToken,
  getCalendarFeedUrl,
} from '@/services/consultas'

interface ModalSincronizacaoIcsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalSincronizacaoIcs({ open, onOpenChange }: ModalSincronizacaoIcsProps) {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const feedUrl = token ? getCalendarFeedUrl(token) : ''

  const loadToken = async () => {
    try {
      setLoading(true)
      const t = await getOrGenerateCalendarToken()
      setToken(t)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar link',
        description: err?.message || 'Não foi possível obter seu link de calendário.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setConfirmRegenerate(false)
      loadToken()
    }
  }, [open])

  const handleCopy = async () => {
    if (!feedUrl) return
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      toast({
        title: 'Link copiado!',
        description: 'URL do feed .ics copiada para a área de transferência.',
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast({
        title: 'Não foi possível copiar',
        description: 'Selecione e copie o endereço manualmente no campo.',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async () => {
    if (!feedUrl) return
    try {
      setDownloading(true)
      const res = await fetch(feedUrl)
      if (!res.ok) throw new Error('Falha ao baixar arquivo .ics')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'agenda-soul.ics'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: 'Arquivo .ics baixado',
        description: 'Você pode importá-lo no Google Agenda, Apple Calendar ou Outlook.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao baixar arquivo',
        description: err?.message || 'Tente copiar o link em vez do download.',
        variant: 'destructive',
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleRegenerate = async () => {
    try {
      setRegenerating(true)
      const newToken = await regenerateCalendarToken()
      setToken(newToken)
      setConfirmRegenerate(false)
      toast({
        title: 'Link de calendário renovado!',
        description:
          'O link anterior foi invalidado por segurança. Atualize o endereço nos seus aplicativos de calendário.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao regenerar link',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl p-6 sm:p-7 border border-[#E9E1D2] bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#FAF4EA] border border-[#E3C89A]/60 text-[#8C6527] flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-serif font-bold text-[#4A322A]">
                Sincronizar com Google Agenda (via feed .ics)
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Acompanhe suas consultas da Clínica SOUL e alertas de reavaliação diretamente no seu
                celular ou computador.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Caixa de URL do Feed */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#4A322A] flex items-center justify-between">
              <span>Seu Link Pessoal de Feed (.ics)</span>
              <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Token Pessoal Seguro
              </span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={loading ? 'Gerando link seguro...' : feedUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="font-mono text-xs pr-10 h-10 rounded-xl bg-gray-50 border-gray-200 text-gray-800 selection:bg-[#E3C89A]/50 focus-visible:ring-[#C9A46A]"
                />
              </div>

              <Button
                type="button"
                onClick={handleCopy}
                disabled={loading || !feedUrl}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs border border-[#DFBF8E]/40"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Link
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-gray-500">
              Não compartilhe esse endereço publicamente: ele concede acesso de visualização à sua
              agenda de atendimentos.
            </p>
          </div>

          {/* Destaque: O que está incluído no feed */}
          <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4A322A]">
              <Sparkles className="h-3.5 w-3.5 text-[#8C6527]" />
              <span>O que é sincronizado no seu calendário:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#73574A]">
              <div className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-[#E9E1D2]/60">
                <Clock className="h-3.5 w-3.5 text-[#8C6527] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#4A322A]">Consultas Multidisciplinares</p>
                  <p className="text-gray-500 text-[10px]">
                    Nome do paciente, especialidade, horário (America/Sao_Paulo) e duração.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-amber-200">
                <Bell className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Alertas de Reavaliação</p>
                  <p className="text-amber-800/80 text-[10px]">
                    Lembretes criados pelo botão ALERTA (30 dias ou data específica).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Passo a passo simples Google Agenda */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <span className="h-5 w-5 rounded-full bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Passo a passo no Google Agenda (fazer apenas uma vez):</span>
            </div>

            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                Abra o <strong>Google Agenda</strong> no computador:{' '}
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-[#8C6527] font-semibold underline hover:text-[#5C4033]"
                >
                  calendar.google.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                Na barra lateral esquerda, localize <strong>"Outros calendários"</strong> e clique
                no botão <strong>+</strong>
              </li>
              <li>
                Selecione a opção <strong>"Do URL"</strong> (ou "Por URL")
              </li>
              <li>
                Cole o link acima no campo <strong>URL do calendário</strong> e clique em{' '}
                <strong>"Adicionar calendário"</strong>
              </li>
            </ol>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Importante:</strong> Esta integração é <em>somente leitura</em> (o Google
                Agenda busca os eventos da clínica). O Google Agenda pode levar de algumas horas a
                até 24 horas para atualizar automaticamente novas alterações devido à frequência de
                busca dos servidores do Google.
              </p>
            </div>
          </div>

          {/* Botões de Ação Secundários */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-gray-100">
            {/* Download direto */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              disabled={downloading || !feedUrl}
              className="h-9 px-3.5 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-gray-500" />
              {downloading ? 'Baixando...' : 'Baixar arquivo .ics'}
            </Button>

            {/* Regenerar link com confirmação */}
            {!confirmRegenerate ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmRegenerate(true)}
                className="h-9 px-3 text-xs text-gray-500 hover:text-amber-800 hover:bg-amber-50/60 rounded-xl flex items-center gap-1.5 self-end sm:self-auto"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerar link
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-xl border border-amber-200">
                <span className="text-[11px] text-amber-900 font-medium pl-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-600" /> Invalidar link atual?
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="h-7 px-2.5 text-[11px] rounded-lg"
                >
                  {regenerating ? 'Gerando...' : 'Sim, renovar'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmRegenerate(false)}
                  className="h-7 px-2 text-[11px] text-gray-600 hover:bg-white rounded-lg"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
