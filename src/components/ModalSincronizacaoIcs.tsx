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
  ArrowDownCircle,
  ArrowUpCircle,
  Link2,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Globe,
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  getOrGenerateCalendarToken,
  regenerateCalendarToken,
  getCalendarFeedUrl,
  getGoogleCalendarSyncStatus,
  saveAndSyncGoogleCalendar,
  syncNowGoogleCalendar,
  disconnectGoogleCalendar,
} from '@/services/consultas'
import type { GoogleCalendarSyncStatus } from '@/types/database'

interface ModalSincronizacaoIcsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSyncComplete?: () => void
}

export function ModalSincronizacaoIcs({
  open,
  onOpenChange,
  onSyncComplete,
}: ModalSincronizacaoIcsProps) {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'importar' | 'exportar'>('importar')

  // Estado Exportação (Feed .ics de saída)
  const [loadingExport, setLoadingExport] = useState(false)
  const [token, setToken] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // Estado Importação (Endereço Secreto iCal do Google de entrada)
  const [loadingImport, setLoadingImport] = useState(false)
  const [importStatus, setImportStatus] = useState<GoogleCalendarSyncStatus | null>(null)
  const [googleIcsUrl, setGoogleIcsUrl] = useState('')
  const [savingSync, setSavingSync] = useState(false)
  const [syncingNow, setSyncingNow] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const feedUrl = token ? getCalendarFeedUrl(token) : ''

  const loadData = async () => {
    try {
      setLoadingExport(true)
      setLoadingImport(true)

      // Carregar Feed de Saída
      const t = await getOrGenerateCalendarToken()
      setToken(t)

      // Carregar Status da Importação Google
      const status = await getGoogleCalendarSyncStatus()
      setImportStatus(status)
      if (status.configured && !googleIcsUrl) {
        setGoogleIcsUrl('')
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de sincronização:', err)
    } finally {
      setLoadingExport(false)
      setLoadingImport(false)
    }
  }

  useEffect(() => {
    if (open) {
      setConfirmRegenerate(false)
      setConfirmDisconnect(false)
      loadData()
    }
  }, [open])

  // Ações Feed de Saída (Exportação)
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

  // Ações Importação Google Calendar
  const handleSaveAndSync = async () => {
    const urlToUse = googleIcsUrl.trim()
    if (!urlToUse) {
      toast({
        title: 'Cole o endereço iCal',
        description: 'Preencha o campo com o endereço secreto em iCal do seu Google Agenda.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSavingSync(true)
      const result = await saveAndSyncGoogleCalendar(urlToUse)
      const inWindow = result.in_window ?? (result.imported || 0) + (result.updated || 0)
      const totalFeed = result.total_in_feed ?? inWindow

      let msg = `${inWindow} eventos no período relevante da agenda (${result.imported || 0} novos, ${result.updated || 0} atualizados).`
      if (inWindow === 0 && totalFeed > 0) {
        msg = `O arquivo possui ${totalFeed} eventos no total, porém nenhum cai nos próximos meses ou últimos 90 dias.`
      } else if (totalFeed === 0) {
        msg = 'O calendário informado está vazio (0 eventos encontrados no Google).'
      }

      toast({
        title: 'Google Agenda Vinculado!',
        description: msg,
      })
      setGoogleIcsUrl('')
      // Recarregar status
      const updatedStatus = await getGoogleCalendarSyncStatus()
      setImportStatus(updatedStatus)
      if (onSyncComplete) onSyncComplete()
    } catch (err: any) {
      const backendMessage =
        err?.response?.error ||
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Não foi possível conectar ao Google Agenda. Verifique se o endereço secreto iCal está completo.'
      toast({
        title: 'Erro ao sincronizar Google Agenda',
        description: backendMessage,
        variant: 'destructive',
      })
    } finally {
      setSavingSync(false)
    }
  }

  const handleSyncNow = async () => {
    try {
      setSyncingNow(true)
      const result = await syncNowGoogleCalendar()
      const inWindow = result.in_window ?? (result.imported || 0) + (result.updated || 0)
      const totalFeed = result.total_in_feed ?? inWindow

      let msg = `${inWindow} eventos sincronizados na grade (${result.imported || 0} novos, ${result.updated || 0} atualizados).`
      if (inWindow === 0 && totalFeed > 0) {
        msg = `O arquivo tem ${totalFeed} eventos no histórico, mas nenhum está dentro do período operacional da agenda.`
      }

      toast({
        title: 'Sincronização concluída!',
        description: msg,
      })
      const updatedStatus = await getGoogleCalendarSyncStatus()
      setImportStatus(updatedStatus)
      if (onSyncComplete) onSyncComplete()
    } catch (err: any) {
      const backendMessage =
        err?.response?.error ||
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        'Não foi possível sincronizar no momento. Tente novamente em instantes.'
      toast({
        title: 'Falha na sincronização',
        description: backendMessage,
        variant: 'destructive',
      })
    } finally {
      setSyncingNow(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      await disconnectGoogleCalendar()
      toast({
        title: 'Vínculo removido',
        description:
          'O Google Agenda foi desconectado e os eventos externos foram removidos da visualização.',
      })
      setConfirmDisconnect(false)
      const updatedStatus = await getGoogleCalendarSyncStatus()
      setImportStatus(updatedStatus)
      if (onSyncComplete) onSyncComplete()
    } catch (err: any) {
      toast({
        title: 'Erro ao desconectar',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setDisconnecting(false)
    }
  }

  const formatDataHoraBrasil = (iso?: string) => {
    if (!iso) return 'Nunca sincronizado'
    try {
      const d = new Date(iso.replace(' ', 'T'))
      if (isNaN(d.getTime())) return iso
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (_) {
      return iso
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-7 border border-[#E9E1D2] bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#FAF4EA] border border-[#E3C89A]/60 text-[#8C6527] flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-serif font-bold text-[#4A322A]">
                Integração com Google Agenda (iCal / .ics)
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Transfira compromissos automaticamente e unifique seus horários na Clínica SOUL.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-2">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'importar' | 'exportar')}
            className="w-full space-y-5"
          >
            <TabsList className="grid grid-cols-2 bg-[#FAF5EE] p-1 rounded-2xl border border-[#E9E1D2] h-auto">
              <TabsTrigger
                value="importar"
                className="rounded-xl py-2 text-xs sm:text-sm font-bold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] data-[state=checked]:shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <ArrowDownCircle className="h-4 w-4 text-[#E3C89A]" />
                <span>Importar Google para SOUL</span>
              </TabsTrigger>
              <TabsTrigger
                value="exportar"
                className="rounded-xl py-2 text-xs sm:text-sm font-bold data-[state=checked]:bg-[#4A322A] data-[state=checked]:text-[#FAF4EA] data-[state=checked]:shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <ArrowUpCircle className="h-4 w-4 text-[#E3C89A]" />
                <span>Exportar SOUL para Celular</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: IMPORTAR GOOGLE CALENDAR PARA A AGENDA SOUL */}
            <TabsContent value="importar" className="space-y-5 mt-0 focus-visible:outline-none">
              {/* Card de Status da Conexão */}
              {importStatus?.configured ? (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-emerald-950">
                            {importStatus.calendar_name || 'Google Agenda Vinculada'}
                          </h4>
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] py-0 px-2 rounded-full font-bold">
                            Ativo
                          </Badge>
                        </div>
                        <p className="text-xs text-emerald-800/90 mt-0.5">
                          {importStatus.events_count || 0} eventos sincronizados automaticamente a
                          cada 15 min.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSyncNow}
                        disabled={syncingNow}
                        className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${syncingNow ? 'animate-spin' : ''}`} />
                        {syncingNow ? 'Sincronizando...' : 'Sincronizar agora'}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-900/90">
                    <div>
                      <span className="font-semibold">Última sincronização:</span>{' '}
                      {formatDataHoraBrasil(importStatus.last_sync)}
                    </div>
                    <div>
                      <span className="font-semibold">Endereço configurado:</span>{' '}
                      <span className="font-mono text-[10px] text-emerald-800">
                        {importStatus.masked_url || '••••••••••••••••'}
                      </span>
                    </div>
                  </div>

                  {importStatus.last_error && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{importStatus.last_error}</span>
                    </div>
                  )}

                  {/* Botão de Desconectar com confirmação */}
                  <div className="pt-2 flex justify-end">
                    {!confirmDisconnect ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDisconnect(true)}
                        className="text-xs text-gray-500 hover:text-red-700 hover:bg-red-50 h-7 px-2.5 rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remover vínculo
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-200">
                        <span className="text-[11px] text-red-900 font-medium pl-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-600" /> Desvincular e remover
                          eventos externos?
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={handleDisconnect}
                          disabled={disconnecting}
                          className="h-7 px-2.5 text-[11px] rounded-lg"
                        >
                          {disconnecting ? 'Removendo...' : 'Sim, remover'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDisconnect(false)}
                          className="h-7 px-2 text-[11px] text-gray-600 hover:bg-white rounded-lg"
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-[#FAF4EA] border border-[#E3C89A] text-[#8C6527] flex items-center justify-center shrink-0 mt-0.5">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#4A322A]">
                        Lançar automaticamente sua Google Agenda aqui
                      </h4>
                      <p className="text-xs text-[#73574A] mt-0.5 leading-relaxed">
                        Cole o <strong>endereço secreto em formato iCal</strong> do Google Agenda. O
                        sistema SOUL baixará seus compromissos e manterá tudo atualizado de forma
                        100% automática a cada 15 minutos, sem exigir senhas ou integrações OAuth
                        complexas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo para colar ou atualizar o Endereço Secreto iCal */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A322A] flex items-center justify-between">
                  <span>
                    {importStatus?.configured
                      ? 'Atualizar endereço secreto iCal'
                      : 'Endereço secreto em formato iCal do Google'}
                  </span>
                  <span className="text-[10px] font-normal text-[#8C6527] bg-[#FAF4EA] border border-[#E3C89A] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Conexão Privada via Token
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="https://calendar.google.com/calendar/ical/seu-email%40gmail.com/secret-.../basic.ics"
                      value={googleIcsUrl}
                      onChange={(e) => setGoogleIcsUrl(e.target.value)}
                      className="font-mono text-xs h-10 rounded-xl bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-[#C9A46A]"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveAndSync}
                    disabled={savingSync || !googleIcsUrl.trim()}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs border border-[#DFBF8E]/40"
                  >
                    {savingSync ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Salvando & Sincronizando...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Salvar e Sincronizar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Importante: use o <strong>endereço secreto</strong> (não o público), pois o
                  calendário da maioria dos usuários é privado.
                </p>
              </div>

              {/* Guia Passo a Passo Como obter o endereço secreto no Google Calendar */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4A322A]">
                  <span className="h-5 w-5 rounded-full bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] flex items-center justify-center text-[10px]">
                    ?
                  </span>
                  <span>
                    Como obter seu Endereço Secreto no Google Calendar (leva menos de 1 minuto):
                  </span>
                </div>

                <ol className="text-xs text-gray-600 space-y-2.5 list-decimal list-inside pl-1 leading-relaxed">
                  <li>
                    Acesse o <strong>Google Agenda</strong> pelo computador:{' '}
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
                    No canto superior direito, clique na engrenagem de{' '}
                    <strong>Configurações</strong> e escolha <strong>"Configurações"</strong>.
                  </li>
                  <li>
                    Na coluna lateral esquerda (em <em>"Configurações dos meus calendários"</em>),
                    clique no seu calendário principal (seu nome ou e-mail).
                  </li>
                  <li>
                    Role a página até a seção <strong>"Integrar calendário"</strong>.
                  </li>
                  <li>
                    Localize o campo <strong>"Endereço secreto em formato iCal"</strong> (Secret
                    address in iCal format).
                  </li>
                  <li>
                    Clique no botão de <strong>copiar</strong> ou revele o link e copie a URL
                    completa (que termina em <code>.ics</code>).
                  </li>
                  <li>
                    Cole o link no campo acima e clique no botão dourado{' '}
                    <strong>"Salvar e Sincronizar"</strong>!
                  </li>
                </ol>

                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Como eles aparecem na Agenda:</strong> Os compromissos importados do
                    Google serão identificados com a tag dourada{' '}
                    <span className="font-semibold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded text-[10px]">
                      Google
                    </span>{' '}
                    e borda destacada, sendo exibidos em modo <em>somente leitura</em> para você
                    visualizar seus horários ocupados sem misturar com as avaliações clínicas
                    internas.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: EXPORTAR CONSULTAS DO SOUL PARA O CELULAR (FEED .ICS) */}
            <TabsContent value="exportar" className="space-y-5 mt-0 focus-visible:outline-none">
              {/* Caixa de URL do Feed */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A322A] flex items-center justify-between">
                  <span>Seu Link Pessoal de Feed de Saída (.ics)</span>
                  <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Token Pessoal Seguro
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      readOnly
                      value={loadingExport ? 'Gerando link seguro...' : feedUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="font-mono text-xs pr-10 h-10 rounded-xl bg-gray-50 border-gray-200 text-gray-800 selection:bg-[#E3C89A]/50 focus-visible:ring-[#C9A46A]"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleCopy}
                    disabled={loadingExport || !feedUrl}
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
                  Adicione esse endereço no Google Agenda para ver suas consultas da Clínica SOUL no
                  celular.
                </p>
              </div>

              {/* Destaque: O que está incluído no feed */}
              <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4A322A]">
                  <Sparkles className="h-3.5 w-3.5 text-[#8C6527]" />
                  <span>O que é exportado para o seu calendário:</span>
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

              {/* Passo a passo Google Agenda */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <span className="h-5 w-5 rounded-full bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A] flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Como adicionar o feed no Google Agenda (fazer apenas uma vez):</span>
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
                    Na barra lateral esquerda, localize <strong>"Outros calendários"</strong> e
                    clique no botão <strong>+</strong>
                  </li>
                  <li>
                    Selecione a opção <strong>"Do URL"</strong> (ou "Por URL")
                  </li>
                  <li>
                    Cole o link acima no campo <strong>URL do calendário</strong> e clique em{' '}
                    <strong>"Adicionar calendário"</strong>
                  </li>
                </ol>
              </div>

              {/* Botões de Ação Secundários */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-gray-100">
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
