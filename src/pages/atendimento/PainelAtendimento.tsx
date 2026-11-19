import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarCheck2,
  ClipboardList,
  Loader2,
  Save,
  Stethoscope,
  Activity,
  FileText,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getAllPacientes } from '@/services/pacientes'
import { getPresencas } from '@/services/presencas'
import { getEvolucoesByPaciente } from '@/services/evolucoes'
import {
  salvarRegistroAtendimento,
  getRegistrosAtendimentoByPaciente,
  parseEvasDor,
  type RegistroAtendimentoRecord,
} from '@/services/registrosAtendimento'
import {
  getHojeBrasilYMD,
  getAgoraBrasilHora,
  formatDataPTBR,
  formatHoraPTBR,
} from '@/lib/constants'
import type { PacienteRecord, PresencaRecord, EvolucaoRecord } from '@/types/database'
import {
  DADOS_INICIAIS,
  SeletorPaciente,
  EscolhaModelo,
  CamposModeloCompleto,
  ItemHistorico,
  type DadosForm,
  type StatusForm,
} from './PainelAtendimentoPartes'
import { HistoricoAtendimento } from './HistoricoAtendimento'

const SERVICOS = [
  'Assessoria Esportiva',
  'Assessoria Fisioterapia',
  'Avaliação Física e Funcional',
  'Avaliação Inicial',
  'Massagem Terapêutica',
  'Nutricionista',
  'Personal Individual',
  'Personal em Grupo',
  'Pilates Performance',
  'Reavaliação',
  'Sessão Fisioterapia',
  'Sessão Osteopatia',
  'Sessão Spa & Recovery',
]

interface ItemHistoricoUnificado {
  id: string
  origem: 'registro' | 'presenca' | 'evolucao'
  titulo: string
  subtitulo: string
  badges: string[]
  conteudo: string
  data: string
}

export default function PainelAtendimento() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ===== Seletor de paciente =====
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [busca, setBusca] = useState('')
  const [paciente, setPaciente] = useState<PacienteRecord | null>(null)

  // ===== Form =====
  const [dados, setDados] = useState<DadosForm>({
    ...DADOS_INICIAIS,
    data: getHojeBrasilYMD(),
    horario: getAgoraBrasilHora(),
    servico: 'Sessão Fisioterapia',
  })
  const [salvando, setSalvando] = useState(false)

  // ===== Histórico =====
  const [historico, setHistorico] = useState<ItemHistoricoUnificado[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  const set = <K extends keyof DadosForm>(key: K, valor: DadosForm[K]) =>
    setDados((d) => ({ ...d, [key]: valor }))

  // Carrega pacientes (busca debounced)
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      try {
        setLoadingPacientes(true)
        const term = busca.trim()
        const filter = term
          ? `(nome ~ "${term}" || cpf ~ "${term}" || email ~ "${term}")`
          : 'status = "Ativo"'
        const res = await getAllPacientes()
        const filtrados = term
          ? res.filter((p) => {
              const t = term.toLowerCase()
              return (
                p.nome?.toLowerCase().includes(t) ||
                p.cpf?.toLowerCase().includes(t) ||
                p.email?.toLowerCase().includes(t)
              )
            })
          : res.filter((p) => p.status === 'Ativo')
        if (active) {
          setPacientes(filtrados.slice(0, 30))
          void filter
        }
      } catch (err) {
        console.warn('Erro ao listar pacientes:', err)
      } finally {
        if (active) setLoadingPacientes(false)
      }
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [busca])

  // Paciente via querystring (?paciente=<id>)
  useEffect(() => {
    const pid = searchParams.get('paciente')
    if (!pid) return
    let active = true
    ;(async () => {
      try {
        const { getPacienteById } = await import('@/services/pacientes')
        const p = await getPacienteById(pid)
        if (active && p) {
          setPaciente(p)
        }
      } catch (err) {
        console.warn('Paciente da querystring não encontrado:', err)
      }
    })()
    return () => {
      active = false
    }
  }, [searchParams])

  const carregarHistorico = useCallback(async (pacienteId: string) => {
    try {
      setLoadingHistorico(true)
      const [registros, presencas, evolucoes] = await Promise.all([
        getRegistrosAtendimentoByPaciente(pacienteId).catch(
          () => [] as RegistroAtendimentoRecord[],
        ),
        getPresencas({ pacienteId }, 1, 100)
          .then((r) => r.items)
          .catch(() => [] as PresencaRecord[]),
        getEvolucoesByPaciente(pacienteId).catch(() => [] as EvolucaoRecord[]),
      ])

      const itens: ItemHistoricoUnificado[] = []

      for (const r of registros) {
        const evas = parseEvasDor(r.evaluacoes_dor)
        itens.push({
          id: `reg-${r.id}`,
          origem: 'registro',
          titulo: `Atendimento — ${r.area_servico}`,
          subtitulo: `${r.data_atendimento.split('-').reverse().join('/')} às ${r.horario} • ${r.modelo} • ${r.profissional_nome}`,
          badges: [r.status],
          conteudo: [
            evas.length > 0
              ? `EVA: ${evas.map((e) => `${e.queixa || 'Queixa'} ${e.valor}/10${e.descricao ? ` (${e.descricao})` : ''}`).join(' | ')}`
              : '',
            r.avaliacao_report ? `Avaliação/Report: ${r.avaliacao_report}` : '',
            r.conduta_realizada ? `Conduta: ${r.conduta_realizada}` : '',
            r.evolucao_descricao ? `Evolução: ${r.evolucao_descricao}` : '',
            r.motivo_desmarque ? `Motivo: ${r.motivo_desmarque}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          data: r.created,
        })
      }

      for (const p of presencas) {
        itens.push({
          id: `pres-${p.id}`,
          origem: 'presenca',
          titulo: `Presença — ${p.area_servico}`,
          subtitulo: `${formatDataPTBR(p.data_atendimento)}${p.horario ? ` às ${formatHoraPTBR(p.horario)}` : ''}${p.profissional_nome ? ` • ${p.profissional_nome}` : ''}`,
          badges: [p.status || 'Presente'],
          conteudo: p.observacoes || '',
          data: p.created,
        })
      }

      for (const e of evolucoes) {
        itens.push({
          id: `evo-${e.id}`,
          origem: 'evolucao',
          titulo: `Evolução Clínica — ${e.especialidade}`,
          subtitulo: `${formatDataPTBR(e.data_evolucao)}${e.horario ? ` às ${formatHoraPTBR(e.horario)}` : ''} • ${e.profissional}`,
          badges: [e.status],
          conteudo:
            e.conduta_procedimentos ||
            e.avaliacao_clinica ||
            e.subjetivo ||
            e.texto_livre ||
            'Sessão registrada.',
          data: e.created,
        })
      }

      itens.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
      setHistorico(itens)
    } finally {
      setLoadingHistorico(false)
    }
  }, [])

  useEffect(() => {
    if (paciente?.id) {
      carregarHistorico(paciente.id)
    } else {
      setHistorico([])
    }
  }, [paciente?.id, carregarHistorico])

  const validar = (): string | null => {
    if (!paciente) return 'Selecione o paciente.'
    if (!dados.data) return 'Informe a data do atendimento.'
    if (!dados.horario) return 'Informe o horário.'
    if (!dados.servico) return 'Informe o serviço/área.'
    if (dados.status === 'Desmarcada' && !dados.motivoDesmarque.trim()) {
      return 'Descreva o motivo/justificativa do desmarque.'
    }
    if (!dados.modelo) return 'Escolha o Modelo Completo ou o Modelo Rápido.'
    if (dados.modelo === 'Completo') {
      const temConteudo =
        dados.evas.some((e) => e.queixa || e.descricao || e.valor > 0) ||
        dados.avaliacaoReport.trim() ||
        dados.condutaRealizada.trim()
      if (!temConteudo) {
        return 'Preencha ao menos uma EVA, a Avaliação/Report ou a Conduta Realizada.'
      }
    } else if (!dados.evolucaoDescricao.trim()) {
      return 'Preencha a Evolução e Descrição Geral.'
    }
    return null
  }

  const handleSalvar = async () => {
    const erro = validar()
    if (erro) {
      toast({ title: erro, variant: 'destructive' })
      return
    }
    try {
      setSalvando(true)
      const resultado = await salvarRegistroAtendimento({
        paciente_id: paciente!.id,
        paciente_nome: paciente!.nome,
        data_atendimento: dados.data,
        horario: dados.horario,
        area_servico: dados.servico,
        status: dados.status,
        motivo_desmarque: dados.status === 'Desmarcada' ? dados.motivoDesmarque.trim() : '',
        modelo: dados.modelo as 'Completo' | 'Rápido',
        evaluacoes_dor: dados.modelo === 'Completo' ? dados.evas : [],
        avaliacao_report: dados.modelo === 'Completo' ? dados.avaliacaoReport : '',
        conduta_realizada: dados.modelo === 'Completo' ? dados.condutaRealizada : '',
        evolucao_descricao: dados.modelo === 'Rápido' ? dados.evolucaoDescricao : '',
      })

      toast({
        title: 'Atendimento registrado com sucesso!',
        description:
          'O registro entrou no prontuário do paciente, na lista de presença e no controle do mês. Ele não pode mais ser editado nem excluído.',
      })

      // Recarrega histórico e limpa o form para novo registro do mesmo paciente
      await carregarHistorico(paciente!.id)
      setDados((d) => ({
        ...DADOS_INICIAIS,
        data: getHojeBrasilYMD(),
        horario: getAgoraBrasilHora(),
        servico: d.servico,
      }))
      void resultado
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar registro.'
      toast({ title: 'Erro ao registrar', description: msg, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const statusBotao = (s: StatusForm) =>
    dados.status === s
      ? 'border-[#C9A46A] bg-[#FAF4EA] text-[#4A322A] shadow-sm'
      : 'border-[#E9E1D2] bg-white text-[#73574A] hover:border-[#C9A46A]/60'

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/painel')}
            className="rounded-xl border-[#E9E1D2]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#4A322A]">
              Registro de Atendimento
            </h1>
            <p className="text-xs text-[#73574A]">
              Presença + Evolução em um único lugar — ao salvar, entra automaticamente no prontuário
              e no controle do mês.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <Card className="border-[#E9E1D2] shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* 1. Paciente */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-[#4A322A] flex items-center gap-2">
              <span className="h-5 w-5 rounded-lg bg-[#4A322A] text-white text-[10px] font-black flex items-center justify-center">
                1
              </span>
              Paciente
            </h2>
            {paciente ? (
              <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#33221C]">{paciente.nome}</p>
                  <p className="text-[11px] text-gray-500">
                    {paciente.cpf || paciente.email || '—'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaciente(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <SeletorPaciente
                pacientes={pacientes}
                loading={loadingPacientes}
                query={busca}
                onQueryChange={setBusca}
                onSelect={(p) => {
                  setPaciente(p)
                  setBusca('')
                }}
                navigatingId={null}
              />
            )}
          </section>

          {/* 2. Dados do atendimento */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-[#4A322A] flex items-center gap-2">
              <span className="h-5 w-5 rounded-lg bg-[#4A322A] text-white text-[10px] font-black flex items-center justify-center">
                2
              </span>
              Dados do Atendimento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#73574A]">Data</Label>
                <Input
                  type="date"
                  value={dados.data}
                  onChange={(e) => set('data', e.target.value)}
                  className="h-10 text-sm bg-white border-[#E9E1D2] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#73574A]">Horário</Label>
                <Input
                  type="time"
                  value={dados.horario}
                  onChange={(e) => set('horario', e.target.value)}
                  className="h-10 text-sm bg-white border-[#E9E1D2] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#73574A]">Serviço / Área</Label>
                <select
                  value={dados.servico}
                  onChange={(e) => set('servico', e.target.value)}
                  className="h-10 w-full text-sm bg-white border border-[#E9E1D2] rounded-xl px-3 focus:border-[#C9A46A] focus:outline-none"
                >
                  {SERVICOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#73574A]">
                  Profissional Responsável
                </Label>
                <Input
                  value={user?.name || user?.email || ''}
                  readOnly
                  disabled
                  className="h-10 text-sm bg-[#FAF7F1] border-[#E9E1D2] rounded-xl text-[#73574A]"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#73574A]">Status do Atendimento</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => set('status', 'Finalizada')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-sm font-semibold transition-all ${statusBotao('Finalizada')}`}
                >
                  <CalendarCheck2 className="h-4 w-4 text-emerald-700" /> Finalizada
                </button>
                <button
                  type="button"
                  onClick={() => set('status', 'Ausência')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-sm font-semibold transition-all ${statusBotao('Ausência')}`}
                >
                  <UserX className="h-4 w-4 text-amber-700" /> Ausência
                </button>
                <button
                  type="button"
                  onClick={() => set('status', 'Desmarcada')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-sm font-semibold transition-all ${statusBotao('Desmarcada')}`}
                >
                  <Stethoscope className="h-4 w-4 text-rose-700" /> Desmarcada
                </button>
              </div>
            </div>

            {/* Motivo do desmarque */}
            {dados.status === 'Desmarcada' && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-200">
                <Label className="text-xs font-bold text-rose-900">
                  Motivo / Justificativa do desmarque (obrigatório)
                </Label>
                <Textarea
                  value={dados.motivoDesmarque}
                  onChange={(e) => set('motivoDesmarque', e.target.value)}
                  rows={2}
                  placeholder="Ex: paciente viajou a trabalho; imprevisto familiar; reagendou para sexta..."
                  className="text-sm bg-white border-rose-200 rounded-xl focus:border-rose-400"
                />
              </div>
            )}
          </section>

          {/* 3. Modelo */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-[#4A322A] flex items-center gap-2">
              <span className="h-5 w-5 rounded-lg bg-[#4A322A] text-white text-[10px] font-black flex items-center justify-center">
                3
              </span>
              Modelo de Registro
            </h2>
            <EscolhaModelo modelo={dados.modelo} onChange={(m) => set('modelo', m)} />
          </section>

          {/* 4. Conteúdo */}
          {dados.modelo && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[#4A322A] flex items-center gap-2">
                <span className="h-5 w-5 rounded-lg bg-[#4A322A] text-white text-[10px] font-black flex items-center justify-center">
                  4
                </span>
                {dados.modelo === 'Completo' ? 'EVA, Avaliação e Conduta' : 'Evolução'}
              </h2>
              {dados.modelo === 'Completo' ? (
                <CamposModeloCompleto
                  evas={dados.evas}
                  avaliacaoReport={dados.avaliacaoReport}
                  condutaRealizada={dados.condutaRealizada}
                  onEvasChange={(evas) => set('evas', evas)}
                  onAvaliacaoReportChange={(v) => set('avaliacaoReport', v)}
                  onCondutaChange={(v) => set('condutaRealizada', v)}
                />
              ) : (
                <div>
                  <Label className="text-sm font-bold text-[#4A322A]">
                    Evolução e Descrição Geral
                  </Label>
                  <Textarea
                    value={dados.evolucaoDescricao}
                    onChange={(e) => set('evolucaoDescricao', e.target.value)}
                    rows={5}
                    placeholder="Descreva a evolução e as observações gerais desta sessão..."
                    className="mt-1.5 text-sm bg-white border-[#E9E1D2] rounded-xl focus:border-[#C9A46A] min-h-[110px]"
                  />
                </div>
              )}
            </section>
          )}

          {/* Salvar */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E9E1D2]">
            <p className="text-[11px] text-[#73574A] mr-auto hidden sm:block">
              ⚠️ Ao salvar, o registro é imutável — não pode ser editado nem excluído.
            </p>
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              className="h-11 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Registrar Atendimento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico unificado */}
      <HistoricoAtendimento
        itens={historico}
        loading={loadingHistorico}
        pacienteNome={paciente?.nome}
      />
    </div>
  )
}

// Evita avisos de imports não usados em builds estritos
void ClipboardList
void FileText
void Activity
void Badge
void Input
