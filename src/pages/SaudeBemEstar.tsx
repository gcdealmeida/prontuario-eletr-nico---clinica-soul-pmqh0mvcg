import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  Calendar,
  ClipboardList,
  Droplets,
  Plus,
  Search,
  Utensils,
  Moon,
  Stethoscope,
  Lightbulb,
  Bell,
  Pill,
  Salad,
  Smile,
  Sparkles,
  UserPlus,
  Dumbbell,
  HeartPulse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { formatDataPTBR, formatDataHoraPTBR } from '@/lib/constants'
import {
  listarSaudeClientes,
  listarSaudeRegistrosTodosClientes,
  criarSaudeCliente,
  criarContaClienteSoul,
  criarSaudeOrientacao,
  criarSaudeLembrete,
  criarSaudeRegistro,
  listarSaudeLembretes,
  listarSaudeOrientacoes,
  labelTipoRegistro,
  type SaudeClienteRecord,
  type SaudeRegistroRecord,
  type SaudeRegistroTipo,
  type SaudeOrientacaoRecord,
  type SaudeLembreteRecord,
} from '@/services/saudeBemEstar'
import { getAllPacientes } from '@/services/pacientes'
import { SaudeResumoIcones } from '@/components/saude/SaudeResumoIcones'
import { SaudeTimelineClinica } from '@/components/saude/SaudeTimelineClinica'
import { SaudeIntervencoes } from '@/components/saude/SaudeIntervencoes'
import { SaudePrescricaoTreinos } from '@/components/saude/SaudePrescricaoTreinos'
import type { PacienteRecord } from '@/types/database'

const iconesTipo: Record<SaudeRegistroTipo, typeof Activity> = {
  atividade_fisica: Activity,
  sono: Moon,
  bebida: Droplets,
  alimento: Utensils,
  exame: Stethoscope,
  dieta: Salad,
  sintoma: ClipboardList,
  medicacao: Pill,
  refeicao: Utensils,
  emocao: Smile,
  treino: Dumbbell,
  reabilitacao: HeartPulse,
}

const hojeYMD = () => {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

/** Converte um valor datetime-local / date em Date para exibição. */
const exibirData = (iso?: string) => {
  if (!iso) return '—'
  return formatDataPTBR(iso)
}

export default function SaudeBemEstar() {
  const { user, isProfissional } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  const clienteSelecionadoId = searchParams.get('cliente') || ''

  const [clientes, setClientes] = useState<SaudeClienteRecord[]>([])
  const [registros, setRegistros] = useState<SaudeRegistroRecord[]>([])
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalNovoCliente, setModalNovoCliente] = useState(false)

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

  /** Contagens por cliente e por tipo (para o resumo da visão geral). */
  const resumo = useMemo(() => {
    const porCliente: Record<
      string,
      { total: number; porTipo: Partial<Record<SaudeRegistroTipo, number>>; ultima: string }
    > = {}
    for (const r of registros) {
      const c = porCliente[r.cliente_id] || { total: 0, porTipo: {}, ultima: '' }
      c.total += 1
      c.porTipo[r.tipo] = (c.porTipo[r.tipo] || 0) + 1
      if (!c.ultima || (r.data && r.data > c.ultima)) c.ultima = r.data
      porCliente[r.cliente_id] = c
    }
    return porCliente
  }, [registros])

  /** Última visita da clínica: compara created do registro com ultima_visita_clinica. */
  const novosDesdeVisita = useMemo(() => {
    const out: Record<string, number> = {}
    for (const c of clientes) {
      const marco = c.ultima_visita_clinica ? new Date(c.ultima_visita_clinica).getTime() : 0
      out[c.id] = registros.filter(
        (r) => r.cliente_id === c.id && new Date(r.created || 0).getTime() > marco,
      ).length
    }
    return out
  }, [clientes, registros])

  const clientesFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.expand?.paciente_id?.nome || '').toLowerCase().includes(q),
    )
  }, [clientes, busca])

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

  /* ------------------------------------------------------------------ */
  /* Visão individual do cliente                                         */
  /* ------------------------------------------------------------------ */
  if (clienteSelecionado) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => selecionarCliente('')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
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
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Visão geral                                                         */
  /* ------------------------------------------------------------------ */
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#73574A]/60" />
        <Input
          placeholder="Buscar cliente por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {carregando ? (
        <p className="text-sm text-[#73574A]">Carregando...</p>
      ) : clientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[#73574A]">
            Nenhum cliente de saúde ainda. Clique em "Novo Cliente de Saúde" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clientesFiltrados.map((c) => {
            const r = resumo[c.id]
            const novos = novosDesdeVisita[c.id] || 0
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:border-[#C9A46A] transition-colors"
                onClick={() => navigate(`/saude-bem-estar?cliente=${c.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{c.nome}</CardTitle>
                    {novos > 0 && (
                      <Badge className="bg-[#C9A46A] text-[#33221C]">{novos} novo(s)</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#73574A]">
                    {c.email || 'sem e-mail'}
                    {c.ativo === false ? ' • inativo' : ''}
                  </p>
                </CardHeader>
                <CardContent>
                  {r ? (
                    <>
                      <SaudeResumoIcones porTipo={r.porTipo} icones={iconesTipo} />
                      <p className="text-xs text-[#73574A] mt-2">
                        Último registro: {exibirData(r.ultima)} • {r.total} registro(s)
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-[#73574A] italic">
                      Sem registros ainda — o cliente pode começar pelo app dele.
                    </p>
                  )}
                  {!c.user_id && !isProfissional && (
                    <Badge variant="outline" className="mt-2 border-[#C9A46A] text-[#73574A]">
                      conta de acesso ainda não criada
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
  )
}
