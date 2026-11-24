import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Smartphone, Sparkles, UserPlus, HeartPulse } from 'lucide-react'
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
import { SaudeAcessoHealthTracker } from '@/components/saude/SaudeAcessoHealthTracker'
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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  const clienteSelecionadoId = searchParams.get('cliente') || ''

  const [clientes, setClientes] = useState<SaudeClienteRecord[]>([])
  const [registros, setRegistros] = useState<SaudeRegistroRecord[]>([])
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovoCliente, setModalNovoCliente] = useState(false)

  // Modo da área: 'clinica' (padrão — monitoramento em tempo real) ou
  // 'health_tracker' (acesso ao app do cliente p/ testes).
  const [modo, setModo] = useState<ModoSaude>('clinica')
  const realtime = useSaudeRealtime(modo === 'clinica' && !clienteSelecionadoId)

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
        onClick={() => setModo('clinica')}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        style={
          modo === 'clinica'
            ? { backgroundColor: SOUL_HTR.marrom, color: '#FFF8ED' }
            : { color: SOUL_HTR.marrom, backgroundColor: 'transparent' }
        }
        aria-pressed={modo === 'clinica'}
      >
        <HeartPulse className="h-4 w-4" />
        Clínica — Monitoramento em tempo real
      </button>
      <button
        type="button"
        onClick={() => setModo('health_tracker')}
        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        style={
          modo === 'health_tracker'
            ? { backgroundColor: SOUL_HTR.marrom, color: '#FFF8ED' }
            : { color: SOUL_HTR.marrom, backgroundColor: 'transparent' }
        }
        aria-pressed={modo === 'health_tracker'}
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
        </div>
        {modo === 'health_tracker' && (
          <SaudeAcessoHealthTracker clientes={clientes} isAdmin={isAdmin} />
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

      {modo === 'health_tracker' ? (
        <SaudeAcessoHealthTracker clientes={clientes} isAdmin={isAdmin} />
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
            onAbrirCliente={(id) => navigate(`/saude-bem-estar?cliente=${id}`)}
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
