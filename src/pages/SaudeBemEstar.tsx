import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  Activity,
  Smartphone,
  Sparkles,
  UserPlus,
  HeartPulse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useSaudeRealtime } from '@/hooks/useSaudeRealtime'
import { PainelMonitorClinico } from '@/components/saude/PainelMonitorClinico'
import {
  SaudeAcessoHealthTracker,
  URL_HEALTH_TRACKER,
} from '@/components/saude/SaudeAcessoHealthTracker'
import { SOUL_HTR } from '@/lib/soulHtrTheme'
import {
  listarSaudeClientes,
  listarSaudeRegistrosTodosClientes,
  criarSaudeCliente,
  type SaudeClienteRecord,
  type SaudeRegistroRecord,
} from '@/services/saudeBemEstar'
import { getAllPacientes } from '@/services/pacientes'
import { SaudeTimelineClinica } from '@/components/saude/SaudeTimelineClinica'
import { SaudeIntervencoes } from '@/components/saude/SaudeIntervencoes'
import { SaudePrescricaoTreinos } from '@/components/saude/SaudePrescricaoTreinos'
import { SaudeHealthTrackerSection } from '@/components/saude/SaudeHealthTrackerSection'
import type { PacienteRecord } from '@/types/database'

export type ModoSaude = 'clinica' | 'health_tracker'

export default function SaudeBemEstar() {
  const { user, isProfissional } = useAuth()
  const isAdmin = user?.role === 'adm' || user?.role === 'admin'
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  const clienteSelecionadoId = searchParams.get('cliente') || ''

  const [clientes, setClientes] = useState<SaudeClienteRecord[]>([])
  const [registros, setRegistros] = useState<SaudeRegistroRecord[]>([])
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovoCliente, setModalNovoCliente] = useState(false)

  // Fonte única de verdade: a query string.
  // - "Clínica — Monitoramento em tempo real" (clique principal): REDIRECIONA
  //   (mesma aba) ao app externo SOUL Health Tracker, onde a Dra./Prof. entra
  //   com o login dela. Nada renderiza localmente nesse clique.
  // - ?interno=1: painel de monitoramento interno (v0.0.173) — caminho
  //   secundário claro, acessível pelo botão "Painel de monitoramento interno".
  // - ?modo=health_tracker: acesso ao app do cliente (para testes).
  // - ?cliente=<id>: visão individual do cliente.
  const modoHealthTracker = searchParams.get('modo') === 'health_tracker'
  const painelInterno = searchParams.get('interno') === '1'
  const realtime = useSaudeRealtime(painelInterno && !clienteSelecionadoId)

  /** Clique principal em "Clínica": redireciona (mesma aba) ao app externo. */
  const irParaClinica = () => {
    window.location.href = URL_HEALTH_TRACKER
  }

  /** Caminho secundário: abre o painel de monitoramento interno. */
  const abrirPainelInterno = () => {
    const next = new URLSearchParams(searchParams)
    next.set('interno', '1')
    setSearchParams(next, { replace: true })
  }

  /** Abre o acesso ao app do cliente (Health Tracker) dentro da página. */
  const abrirSaudeAcesso = () => {
    const next = new URLSearchParams(searchParams)
    next.set('modo', 'health_tracker')
    setSearchParams(next, { replace: true })
  }

  /** Abre a visão individual de um cliente preservando o painel interno. */
  const abrirClienteInterno = (id: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('cliente', id)
    next.set('interno', '1')
    setSearchParams(next, { replace: false })
  }

  // Form novo cliente
  const [formNome, setFormNome] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formNascimento, setFormNascimento] = useState('')
  const [formPaciente, setFormPaciente] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')
  const [salvandoCliente, setSalvandoCliente] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [cs, rs] = await Promise.all([
        listarSaudeClientes(),
        listarSaudeRegistrosTodosClientes(),
      ])
      setClientes(cs)
      setRegistros(rs)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados de Saúde & Bem-Estar.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    if (!isProfissional) {
      getAllPacientes()
        .then(setPacientes)
        .catch(() => setPacientes([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clienteSelecionado = clientes.find((c) => c.id === clienteSelecionadoId) || null

  const selecionarCliente = (id: string) => {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('cliente', id)
    else next.delete('cliente')
    setSearchParams(next, { replace: true })
  }

  const salvarNovoCliente = async () => {
    if (!formNome.trim()) {
      toast({ title: 'Informe o nome do cliente.', variant: 'destructive' })
      return
    }
    setSalvandoCliente(true)
    try {
      await criarSaudeCliente({
        nome: formNome.trim(),
        email: formEmail.trim() || undefined,
        data_nascimento: formNascimento || undefined,
        observacoes: formObservacoes.trim() || undefined,
        paciente_id: formPaciente || undefined,
        ativo: true,
      })
      toast({ title: 'Cliente de saúde criado!' })
      setModalNovoCliente(false)
      setFormNome('')
      setFormEmail('')
      setFormNascimento('')
      setFormPaciente('')
      setFormObservacoes('')
      await carregar()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao criar cliente',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoCliente(false)
    }
  }

  /** Alternador Clínica / Health Tracker — visível no topo da área. */
  const AlternadorModos = (
    <div
      className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl border border-[#E2D4BF]"
      style={{ backgroundColor: SOUL_HTR.bg }}
    >
      <button
        type="button"
        onClick={irParaClinica}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        style={{ backgroundColor: SOUL_HTR.marrom, color: '#FFF8ED' }}
        title="Redireciona ao app externo Health Tracker (entrar como Dra./Prof.)"
      >
        <HeartPulse className="h-4 w-4" />
        Clínica — Monitoramento em tempo real
        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
      </button>
      <button
        type="button"
        onClick={abrirPainelInterno}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        style={
          painelInterno
            ? { backgroundColor: SOUL_HTR.marrom, color: '#FFF8ED' }
            : { color: SOUL_HTR.marrom, backgroundColor: 'transparent' }
        }
        aria-pressed={painelInterno}
        title="Painel de monitoramento interno (dentro do app da clínica)"
      >
        <Activity className="h-4 w-4" />
        Painel de monitoramento interno
      </button>
      <button
        type="button"
        onClick={abrirSaudeAcesso}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        style={
          modoHealthTracker
            ? { backgroundColor: SOUL_HTR.marrom, color: '#FFF8ED' }
            : { color: SOUL_HTR.marrom, backgroundColor: 'transparent' }
        }
        aria-pressed={modoHealthTracker}
      >
        <Smartphone className="h-4 w-4" />
        Health Tracker (App do Cliente)
      </button>
    </div>
  )

  /* ------------------------------------------------------------------ */
  /* Visão individual do cliente                                         */
  /* ------------------------------------------------------------------ */
  if (clienteSelecionado) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        {AlternadorModos}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => selecionarCliente('')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <span className="text-xs" style={{ color: SOUL_HTR.textoSuave }}>
            Botão "Clínica" abre o app Health Tracker (entrar como Dra./Prof.) — o painel interno
            fica no caminho "Painel de monitoramento interno".
          </span>
        </div>
        {modoHealthTracker && <SaudeAcessoHealthTracker clientes={clientes} isAdmin={isAdmin} />}
        {painelInterno && (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            style={{ borderColor: SOUL_HTR.dourado, color: SOUL_HTR.marrom }}
            onClick={() => selecionarCliente('')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao painel de monitoramento interno
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#33221C]">{clienteSelecionado.nome}</h1>
          <p className="text-sm text-[#73574A]">
            {clienteSelecionado.email || 'sem e-mail'}
            {clienteSelecionado.expand?.paciente_id
              ? ` • paciente vinculado: ${clienteSelecionado.expand.paciente_id.nome}`
              : ''}
            {isProfissional ? ' • visão de profissional (somente seus designados)' : ''}
          </p>
        </div>

        <SaudePrescricaoTreinos
          cliente={clienteSelecionado}
          registros={registros}
          onAtualizado={carregar}
        />

        <SaudeTimelineClinica clienteId={clienteSelecionado.id} />

        <SaudeIntervencoes cliente={clienteSelecionado} onContaCriada={carregar} />

        <SaudeHealthTrackerSection
          clienteId={clienteSelecionado.id}
          emailCliente={clienteSelecionado.email || ''}
        />
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Visão geral                                                         */
  /* ------------------------------------------------------------------ */
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      {AlternadorModos}

      {modoHealthTracker ? (
        <SaudeAcessoHealthTracker clientes={clientes} isAdmin={isAdmin} />
      ) : painelInterno ? (
        <PainelMonitorClinico
          clientes={realtime.clientes}
          registros={realtime.registros}
          carregando={realtime.carregando}
          notificacoes={realtime.notificacoes}
          recarregar={realtime.recarregar}
          naoLidas={realtime.naoLidas}
          sinoAberto={realtime.sinoAberto}
          setSinoAberto={realtime.setSinoAberto}
          conectado={realtime.conectado}
          onAbrirCliente={abrirClienteInterno}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#33221C] flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-[#C9A46A]" /> Saúde & Bem-Estar
              </h1>
              <p className="text-sm text-[#73574A]">
                {isProfissional
                  ? 'Acompanhe o dia a dia de saúde dos pacientes designados a você.'
                  : 'Acompanhe o que cada cliente registra: atividade física, sono, bebidas, alimentos, exames e sintomas.'}
              </p>
            </div>
            {!isProfissional && (
              <Button onClick={() => setModalNovoCliente(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Novo Cliente de Saúde
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={abrirPainelInterno}
              style={{ borderColor: SOUL_HTR.dourado, color: SOUL_HTR.marrom }}
            >
              <Activity className="h-4 w-4 mr-1.5" /> Painel de monitoramento interno
            </Button>
            <span style={{ color: SOUL_HTR.textoSuave }}>
              O botão "Clínica" agora abre o app Health Tracker externo — o monitoramento em tempo
              real dentro da clínica fica aqui.
            </span>
          </div>

          {/* O PainelMonitorClinico é a ÚNICA lista de cartões de clientes
              (seção "Por Cliente") — alimentada exclusivamente por
              saude_clientes via useSaudeRealtime. Não há uma segunda grade
              de cartões abaixo dela. */}
          <PainelMonitorClinico
            clientes={realtime.clientes}
            registros={realtime.registros}
            carregando={realtime.carregando}
            notificacoes={realtime.notificacoes}
            recarregar={realtime.recarregar}
            naoLidas={realtime.naoLidas}
            sinoAberto={realtime.sinoAberto}
            setSinoAberto={realtime.setSinoAberto}
            conectado={realtime.conectado}
            onAbrirCliente={abrirClienteInterno}
          />

          {/* Modal novo cliente de saúde */}
          <Dialog open={modalNovoCliente} onOpenChange={setModalNovoCliente}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cliente de Saúde</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome *</Label>
                  <Input value={formNome} onChange={(e) => setFormNome(e.target.value)} />
                </div>
                <div>
                  <Label>E-mail (para o acesso do cliente)</Label>
                  <Input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <Label>Data de nascimento</Label>
                  <Input
                    type="date"
                    value={formNascimento}
                    onChange={(e) => setFormNascimento(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Vincular a paciente cadastrado</Label>
                  <Select value={formPaciente} onValueChange={setFormPaciente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional — permite designar profissionais" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    rows={3}
                    value={formObservacoes}
                    onChange={(e) => setFormObservacoes(e.target.value)}
                  />
                </div>
                <p className="text-xs text-[#73574A]">
                  Depois de criar, abra o cliente para gerar a conta de acesso do app Cliente Soul
                  (e-mail + senha).
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalNovoCliente(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarNovoCliente} disabled={salvandoCliente}>
                  {salvandoCliente ? 'Salvando...' : 'Criar cliente'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
