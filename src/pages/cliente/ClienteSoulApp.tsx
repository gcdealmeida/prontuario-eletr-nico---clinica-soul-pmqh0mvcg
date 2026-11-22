import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  ChartLine,
  ClipboardList,
  HeartPulse,
  Home,
  Salad,
  UserRound,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  atualizarSaudeDevPessoal,
  criarSaudeRegistro,
  atualizarSaudeRegistro,
  excluirSaudeRegistro,
  carregarMeuPainel,
  type MeuPerfilSaude,
  type SaudeClienteRecord,
  type SaudeRegistroTipo,
} from '@/services/saudeBemEstar'
import { VALORES_HUMOR, hojeYMD } from '@/lib/saudeAgregacoes'
import { ClienteHoje } from '@/components/cliente/ClienteHoje'
import { ClienteMetricas } from '@/components/cliente/ClienteMetricas'
import { ClienteRefeicoesMedicacoes } from '@/components/cliente/ClienteRefeicoesMedicacoes'
import { ClienteDiarioEmocional } from '@/components/cliente/ClienteDiarioEmocional'
import { ClienteExamesDietas } from '@/components/cliente/ClienteExamesDietas'
import { ClienteInsights } from '@/components/cliente/ClienteInsights'
import { ClientePerfil } from '@/components/cliente/ClientePerfil'
import {
  ModalRegistroMetrica,
  type ValoresRegistro,
} from '@/components/cliente/ModalRegistroMetrica'

export type AbaCliente =
  | 'hoje'
  | 'metricas'
  | 'refeicoes'
  | 'diario'
  | 'exames'
  | 'insights'
  | 'perfil'

const ABAS: { v: AbaCliente; l: string; curto: string; icone: typeof Home }[] = [
  { v: 'hoje', l: 'Hoje', curto: 'Hoje', icone: Home },
  { v: 'metricas', l: 'Métricas', curto: 'Métricas', icone: ChartLine },
  { v: 'refeicoes', l: 'Refeições & Medicações', curto: 'Refeições', icone: Salad },
  { v: 'diario', l: 'Diário', curto: 'Diário', icone: BookOpen },
  { v: 'exames', l: 'Exames & Dietas', curto: 'Exames', icone: ClipboardList },
  { v: 'insights', l: 'Insights', curto: 'Insights', icone: HeartPulse },
  { v: 'perfil', l: 'Perfil', curto: 'Perfil', icone: UserRound },
]

const rotuloRefeicao = (v: string) =>
  ({ cafe: 'Café da manhã', almoco: 'Almoço', janta: 'Jantar', lanche: 'Lanche' })[v] || 'Refeição'

/** Ambiente logado do Cliente Soul — shell de 7 abas (modelo do health-tracker de referência). */
export function ClienteSoulApp() {
  const { toast } = useToast()
  const [perfil, setPerfil] = useState<MeuPerfilSaude | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<AbaCliente>('hoje')

  // modal de registro (compartilhado pelas abas)
  const [modalRegistro, setModalRegistro] = useState(false)
  const [tipoInicial, setTipoInicial] = useState<SaudeRegistroTipo | undefined>(undefined)
  const [registroEdit, setRegistroEdit] = useState<MeuPerfilSaude['registros'][number] | null>(null)

  const carregar = async () => {
    try {
      setPerfil(await carregarMeuPainel())
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar seu painel',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrirRegistro = (tipo?: SaudeRegistroTipo) => {
    setRegistroEdit(null)
    setTipoInicial(tipo)
    setModalRegistro(true)
  }

  const salvarValores = async (v: ValoresRegistro) => {
    if (!perfil) return
    try {
      if (registroEdit) {
        await atualizarSaudeRegistro(registroEdit.id, {
          tipo: v.tipo,
          data: v.data,
          observacao: v.observacao || undefined,
          dados_json: v.dados,
        })
        toast({ title: 'Registro atualizado!' })
      } else {
        await criarSaudeRegistro({
          cliente_id: perfil.cliente.id,
          tipo: v.tipo,
          data: v.data,
          observacao: v.observacao || undefined,
          dados_json: v.dados,
        })
        toast({ title: 'Registro salvo! Sua clínica já pode vê-lo.' })
      }
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar registro.', variant: 'destructive' })
    }
  }

  const excluirRegistro = async (id: string) => {
    try {
      await excluirSaudeRegistro(id)
      toast({ title: 'Registro excluído.' })
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao excluir registro.', variant: 'destructive' })
    }
  }

  const salvarDiario = async (humor: string, notas: string) => {
    if (!perfil) return
    try {
      await criarSaudeRegistro({
        cliente_id: perfil.cliente.id,
        tipo: 'emocao',
        data: `${hojeYMD()} 12:00:00.000Z`,
        dados_json: {
          humor,
          notas,
          ...(VALORES_HUMOR.find((h) => h.v === humor)
            ? { emoji: VALORES_HUMOR.find((h) => h.v === humor)!.emoji }
            : {}),
        },
      })
      toast({ title: 'Registrado no diário!' })
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar no diário.', variant: 'destructive' })
    }
  }

  const registrarExameDieta = async (tipo: 'exame' | 'dieta', titulo?: string) => {
    if (!perfil) return
    try {
      await criarSaudeRegistro({
        cliente_id: perfil.cliente.id,
        tipo,
        data: `${hojeYMD()} 12:00:00.000Z`,
        dados_json: titulo ? { descricao: titulo } : undefined,
      })
      toast({ title: `${tipo === 'exame' ? 'Exame' : 'Dieta'} registrado!` })
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: `Erro ao registrar ${tipo}.`, variant: 'destructive' })
    }
  }

  const alternarIngerida = async (r: MeuPerfilSaude['registros'][number]) => {
    const d = { ...((r.dados_json || {}) as Record<string, unknown>) }
    const deHoje = (r.data || '').slice(0, 10) === hojeYMD()
    if (deHoje) {
      d.ingerida = d.ingerida === false
    } else {
      // nova dose hoje para a rotina
      d.ingerida = true
      await criarSaudeRegistro({
        cliente_id: perfil.cliente.id,
        tipo: 'medicacao',
        data: `${hojeYMD()} 12:00:00.000Z`,
        dados_json: d,
      })
      toast({ title: 'Dose registrada hoje!' })
      await carregar()
      return
    }
    try {
      await atualizarSaudeRegistro(r.id, { dados_json: d })
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao atualizar medicação.', variant: 'destructive' })
    }
  }

  const concluirDev = async (id: string, concluido: boolean) => {
    try {
      await atualizarSaudeDevPessoal(id, { status: concluido ? 'concluido' : 'ativo' })
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao atualizar.', variant: 'destructive' })
    }
  }

  const perfilAtualizado = (c: SaudeClienteRecord) => {
    setPerfil((p) => (p ? { ...p, cliente: c } : p))
  }

  const lembretes = useMemo(() => perfil?.lembretes ?? [], [perfil])
  const devAtivos = useMemo(
    () => (perfil?.devPessoal ?? []).filter((d) => d.status === 'ativo'),
    [perfil],
  )
  const devConcluidos = useMemo(
    () => (perfil?.devPessoal ?? []).filter((d) => d.status === 'concluido'),
    [perfil],
  )

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center">
        <p className="text-[#5C7263]">Carregando seu painel...</p>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center p-4">
        <p className="text-[#5C7263] text-center">
          Nenhum cadastro de Cliente Soul vinculado a esta conta.
          <br />
          Fale com a clínica.
        </p>
      </div>
    )
  }

  const { cliente, registros } = perfil

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF3EC] via-[#F6F1E7] to-[#FDFBF6] pb-24">
      {/* Header do cliente */}
      <header className="bg-[#2C4A3B] text-white px-4 py-6 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[#3E7C59] flex items-center justify-center">
              <span className="text-lg font-bold">{cliente.nome.slice(0, 1).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">Cliente Soul</p>
              <h1 className="text-lg font-semibold leading-tight">{cliente.nome}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação mobile-first: rolagem horizontal no celular, abas no desktop */}
      <nav className="sticky top-0 z-30 bg-[#2C4A3B] text-white shadow-md">
        <div className="max-w-3xl mx-auto flex overflow-x-auto scrollbar-none">
          {ABAS.map((t) => {
            const Icone = t.icone
            const ativa = aba === t.v
            return (
              <button
                key={t.v}
                onClick={() => setAba(t.v)}
                className={`flex min-w-fit flex-1 flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  ativa
                    ? 'bg-[#3E7C59] text-white'
                    : 'text-white/70 hover:bg-[#3E7C59]/40 hover:text-white'
                }`}
                title={t.l}
              >
                <Icone className="h-4 w-4" />
                <span className="md:hidden">{t.curto}</span>
                <span className="hidden md:inline">{t.l}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-5 space-y-6">
        {aba === 'hoje' && (
          <ClienteHoje
            cliente={cliente}
            registros={registros}
            lembretes={lembretes}
            devAtivos={devAtivos}
            devConcluidos={devConcluidos}
            onConcluirDev={concluirDev}
            onAbrirRegistro={abrirRegistro}
            onIrPara={(destino) => {
              const mapa: Record<string, AbaCliente> = {
                refeicoes: 'refeicoes',
                medicacoes: 'refeicoes',
                diario: 'diario',
                exames: 'exames',
                metricas: 'metricas',
                insights: 'insights',
                perfil: 'perfil',
              }
              setAba(mapa[destino] ?? 'hoje')
            }}
          />
        )}

        {aba === 'metricas' && (
          <ClienteMetricas
            registros={registros}
            onAbrirRegistro={abrirRegistro}
            onExcluir={excluirRegistro}
          />
        )}

        {aba === 'refeicoes' && (
          <ClienteRefeicoesMedicacoes
            registros={registros}
            onRegistrarRefeicao={() => abrirRegistro('refeicao')}
            onRegistrarMedicacao={() => abrirRegistro('medicacao')}
            onExcluir={excluirRegistro}
            onAlternarIngerida={alternarIngerida}
          />
        )}

        {aba === 'diario' && (
          <ClienteDiarioEmocional
            registros={registros}
            onSalvar={salvarDiario}
            onExcluir={excluirRegistro}
          />
        )}

        {aba === 'exames' && (
          <ClienteExamesDietas
            registros={registros}
            onRegistrar={registrarExameDieta}
            onExcluir={excluirRegistro}
          />
        )}

        {aba === 'insights' && <ClienteInsights registros={registros} />}

        {aba === 'perfil' && <ClientePerfil cliente={cliente} onAtualizado={perfilAtualizado} />}
      </main>

      {/* Modal registrar/editar (compartilhado) */}
      <ModalRegistroMetrica
        open={modalRegistro}
        onOpenChange={setModalRegistro}
        tipoInicial={tipoInicial}
        registro={registroEdit}
        onSalvar={salvarValores}
      />
    </div>
  )
}

export default ClienteSoulApp
