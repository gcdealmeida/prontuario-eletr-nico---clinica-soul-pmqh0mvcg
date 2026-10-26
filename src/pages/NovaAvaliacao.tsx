import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  HeartPulse,
  ArrowLeft,
  User,
  Activity,
  Dumbbell,
  Apple,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAllPacientes } from '@/services/pacientes'
import {
  createAvaliacao,
  updateAvaliacao,
  getAvaliacaoById,
  getRascunhoAbertoPorPaciente,
  createTimelineEvent,
  getCollectionNameByEspecialidade,
  normalizeAvaliacaoFisioterapiaPayload,
} from '@/services/avaliacoes'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  garantirPresencaAutomatica,
  mapearEspecialidadeParaServicoPresenca,
} from '@/services/presencas'
import {
  salvarRascunhoLocal,
  carregarRascunhoLocal,
  limparRascunhoLocal,
  type RascunhoLocalItem,
} from '@/services/rascunhoLocal'
import { useNavigationBlocker } from '@/hooks/use-navigation-blocker'
import { ModalAlertaSaida } from '@/components/ModalAlertaSaida'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import type { PacienteRecord, Especialidade, StatusAvaliacao } from '@/types/database'
import { ESPECIALIDADE_COLORS, formatDataHoraPTBR } from '@/lib/constants'
import { FormFisioterapia } from '@/components/fisioterapia/FormFisioterapia'
import { FormPersonal } from '@/components/personal/FormPersonal'

export default function NovaAvaliacao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const prePacienteId = searchParams.get('paciente') || ''
  const preEspecialidade = searchParams.get('especialidade') as Especialidade | null
  const editId = searchParams.get('edit') || ''

  const [step, setStep] = useState<number>(prePacienteId && preEspecialidade ? 2 : 1)
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>(prePacienteId)
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<Especialidade>(
    preEspecialidade || 'Fisioterapia',
  )

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [etapaFisio, setEtapaFisio] = useState(1)
  const [etapaPersonal, setEtapaPersonal] = useState(1)
  const [activeRecordId, setActiveRecordId] = useState<string>(editId)
  const [submitting, setSubmitting] = useState(false)
  const [savingRascunho, setSavingRascunho] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const isSavingServerRef = useRef(false)

  // Controle de rascunho local e restauração
  const [rascunhoEncontrado, setRascunhoEncontrado] = useState<RascunhoLocalItem | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [ultimoSalvoLocal, setUltimoSalvoLocal] = useState<Date | null>(null)
  const isSuccessfullySavedRef = useRef(false)

  // Form State genérico
  const [formData, setFormData] = useState<Record<string, any>>({
    status: 'Concluída',
    profissional_responsavel: user?.name || 'Dr. Guilherme (Admin)',
    data_avaliacao: new Date().toISOString().substring(0, 10),
  })

  useEffect(() => {
    getAllPacientes()
      .then((all) => {
        setPacientes(all)
        // Se já houver um paciente pré-selecionado via URL, verificar se possui dados de pré-cadastro
        if (prePacienteId && !editId) {
          const found = all.find((p) => p.id === prePacienteId)
          if (
            found &&
            (found.motivo_procura || found.limitacoes_incomodo || found.diagnostico_medico)
          ) {
            setFormData((prev) => ({
              ...prev,
              queixa_principal: prev.queixa_principal || found.motivo_procura || '',
              anamnese_detalhada: {
                ...(prev.anamnese_detalhada || {}),
                motivo_principal:
                  prev.anamnese_detalhada?.motivo_principal || found.motivo_procura || '',
                impacto_dia_a_dia:
                  prev.anamnese_detalhada?.impacto_dia_a_dia || found.limitacoes_incomodo || '',
                o_que_evita_fazer:
                  prev.anamnese_detalhada?.o_que_evita_fazer || found.limitacoes_incomodo || '',
                tentativas_anteriores:
                  prev.anamnese_detalhada?.tentativas_anteriores ||
                  found.tratamentos_anteriores ||
                  '',
                resultado_valeu_a_pena:
                  prev.anamnese_detalhada?.resultado_valeu_a_pena || found.resultado_esperado || '',
                desejo_voltar_fazer:
                  prev.anamnese_detalhada?.desejo_voltar_fazer || found.resultado_esperado || '',
                diagnostico_medico:
                  prev.anamnese_detalhada?.diagnostico_medico || found.diagnostico_medico || '',
                frase_chave_paciente:
                  prev.anamnese_detalhada?.frase_chave_paciente || found.resultado_esperado || '',
              },
              historia_doenca_atual:
                prev.historia_doenca_atual ||
                `[Pré-cadastro] Motivo: ${found.motivo_procura || 'Não informado'}\nLimitações: ${found.limitacoes_incomodo || 'Não informado'}\nTratamentos prévios: ${found.tratamentos_anteriores || 'Não informado'}`,
              diagnostico_fisioterapeutico:
                prev.diagnostico_fisioterapeutico ||
                (found.diagnostico_medico !== 'Não tenho / não sei'
                  ? found.diagnostico_medico
                  : ''),
              diagnostico_medico: prev.diagnostico_medico || found.diagnostico_medico || '',
              objetivos_tratamento: prev.objetivos_tratamento || found.resultado_esperado || '',
            }))
          }
        }
      })
      .catch(() => {})

    if (editId && preEspecialidade) {
      setLoadingInitial(true)
      const col = getCollectionNameByEspecialidade(preEspecialidade)
      getAvaliacaoById(col, editId)
        .then((res: any) => {
          setSelectedPacienteId(res.paciente_id)
          setSelectedEspecialidade(preEspecialidade)
          setFormData(res)
          setActiveRecordId(editId)
          setStep(2)
        })
        .catch(() => {
          toast({ title: 'Erro ao carregar prontuário para edição', variant: 'destructive' })
        })
        .finally(() => setLoadingInitial(false))
    } else if (prePacienteId && preEspecialidade && !editId) {
      // Se não veio editId na URL mas veio paciente + especialidade, verificar se já existe rascunho aberto no servidor
      getRascunhoAbertoPorPaciente(preEspecialidade, prePacienteId)
        .then((rascunhoAberto: any) => {
          if (rascunhoAberto && rascunhoAberto.id) {
            setActiveRecordId(rascunhoAberto.id)
            setFormData((prev) => ({
              ...rascunhoAberto,
              ...prev,
              // Preservar dados preenchidos
              id: rascunhoAberto.id,
            }))
          }
        })
        .catch(() => {})
    }
  }, [editId, preEspecialidade, prePacienteId])

  // Guarda de navegação quando houver dados preenchidos não salvos
  const shouldBlockNavigation = isFormDirty && !isSuccessfullySavedRef.current && !submitting
  const { isBlocked, confirmLeave, cancelLeave } = useNavigationBlocker({
    when: shouldBlockNavigation,
    message:
      'Você possui uma avaliação preenchida que ainda não foi salva no servidor. Se sair agora, seus dados não salvos poderão ser perdidos. Deseja realmente sair?',
  })

  // Checar se há rascunho local disponível ao definir paciente e especialidade
  useEffect(() => {
    if (!selectedPacienteId || editId) {
      setRascunhoEncontrado(null)
      return
    }

    const rascunho = carregarRascunhoLocal('avaliacao', selectedPacienteId, selectedEspecialidade)

    if (rascunho && rascunho.data) {
      // Se tiver dados relevantes preenchidos
      const temDados =
        Object.keys(rascunho.data).length > 3 ||
        Boolean(rascunho.data.queixa_principal || rascunho.data.anamnese_detalhada)
      if (temDados) {
        setRascunhoEncontrado(rascunho)
      } else {
        setRascunhoEncontrado(null)
      }
    } else {
      setRascunhoEncontrado(null)
    }
  }, [selectedPacienteId, selectedEspecialidade, editId])

  // Função para salvar rascunho local
  const dispararSalvamentoLocal = (novoFormData: Record<string, any>, etapaNum?: number) => {
    if (!selectedPacienteId || isSuccessfullySavedRef.current) return
    const pacienteAtual = pacientes.find((p) => p.id === selectedPacienteId)
    // Remove uploads de arquivos nativos do JSON (pois File não serializa em JSON)
    // Mantém resumos_anexos salvo no rascunho para não perder texto lido/editado por IA
    const dadosParaSalvar = { ...novoFormData }
    delete dadosParaSalvar._pending_exames_files
    delete dadosParaSalvar._pending_dinamometro_files
    delete dadosParaSalvar._pending_postura_files

    salvarRascunhoLocal('avaliacao', selectedPacienteId, selectedEspecialidade, dadosParaSalvar, {
      pacienteNome: pacienteAtual?.nome,
      especialidade: selectedEspecialidade,
      step,
      sectionIndex:
        selectedEspecialidade === 'Fisioterapia'
          ? (etapaNum ?? etapaFisio)
          : selectedEspecialidade === 'Personal'
            ? (etapaNum ?? etapaPersonal)
            : currentSectionIndex,
    })
    setUltimoSalvoLocal(new Date())
  }

  // Autosave a cada ~20 segundos quando o formulário estiver sujo
  useEffect(() => {
    if (!isFormDirty || !selectedPacienteId || isSuccessfullySavedRef.current) return

    const interval = setInterval(() => {
      dispararSalvamentoLocal(formData)
    }, 20000)

    return () => clearInterval(interval)
  }, [
    isFormDirty,
    selectedPacienteId,
    selectedEspecialidade,
    formData,
    etapaFisio,
    etapaPersonal,
    currentSectionIndex,
  ])

  const handleFieldChange = (field: string, value: any) => {
    setIsFormDirty(true)
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      // Auto-compute IMC se peso e altura presentes
      if (field === 'peso' || field === 'altura') {
        const p = parseFloat(field === 'peso' ? value : prev.peso)
        const a = parseFloat(field === 'altura' ? value : prev.altura)
        if (p > 0 && a > 0) {
          const imcCalc = Number((p / (a * a)).toFixed(1))
          updated.imc = imcCalc
        }
      }
      return updated
    })
  }

  // Ao mudar de etapa, salva o rascunho local imediatamente
  // Salvar no servidor em segundo plano sem sair da página (page-by-page auto-save)
  const salvarRascunhoServidorSilencioso = async (novoFormData: Record<string, any>) => {
    if (!selectedPacienteId || isSavingServerRef.current) return
    isSavingServerRef.current = true
    try {
      const col = getCollectionNameByEspecialidade(selectedEspecialidade)
      const queixaPrincipal =
        novoFormData.queixa_principal ||
        novoFormData.queixas_multiplas?.[0]?.queixa ||
        novoFormData.anamnese_detalhada?.motivo_principal ||
        (selectedEspecialidade === 'Personal'
          ? `Avaliação Física Physical Test - ${novoFormData.objetivo_principal || 'Condicionamento'}`
          : 'Avaliação Fisioterapêutica')

      let basePayload: Record<string, any> = {
        ...novoFormData,
        paciente_id: selectedPacienteId,
        especialidade: selectedEspecialidade,
        status: 'Rascunho',
        queixa_principal: queixaPrincipal,
        profissional_responsavel:
          novoFormData.profissional_responsavel || user?.name || 'Dr. Guilherme (Admin)',
        data_avaliacao: novoFormData.data_avaliacao || new Date().toISOString().substring(0, 10),
      }

      const pendingExames: File[] = (novoFormData._pending_exames_files || []).filter(
        (f: unknown): f is File => typeof File !== 'undefined' && f instanceof File,
      )
      const pendingDinamometro: File[] = (novoFormData._pending_dinamometro_files || []).filter(
        (f: unknown): f is File => typeof File !== 'undefined' && f instanceof File,
      )
      const pendingPostura: File[] = (novoFormData._pending_postura_files || []).filter(
        (f: unknown): f is File => typeof File !== 'undefined' && f instanceof File,
      )

      delete basePayload._pending_exames_files
      delete basePayload._pending_dinamometro_files
      delete basePayload._pending_postura_files

      // Strip arrays de strings/nomes de arquivos pré-existentes dos campos FILE
      // para nunca enviar strings como upload
      delete basePayload.anexos_exames
      delete basePayload.anexos_dinamometro
      delete basePayload.anexos_postura

      if (selectedEspecialidade === 'Fisioterapia') {
        basePayload = normalizeAvaliacaoFisioterapiaPayload(basePayload, 'Rascunho')
      }

      let requestData: any = basePayload
      if (pendingExames.length > 0 || pendingDinamometro.length > 0 || pendingPostura.length > 0) {
        const fd = new FormData()
        Object.entries(basePayload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              fd.append(key, JSON.stringify(value))
            } else {
              fd.append(key, String(value))
            }
          }
        })
        for (const f of pendingExames) {
          fd.append('anexos_exames', f)
        }
        for (const f of pendingDinamometro) {
          fd.append('anexos_dinamometro', f)
        }
        for (const f of pendingPostura) {
          fd.append('anexos_postura', f)
        }
        requestData = fd
      }

      let targetRecordId = activeRecordId || editId || novoFormData.id
      if (!targetRecordId) {
        // Checar se já existe rascunho no servidor antes de criar
        const rascunhoExistente = await getRascunhoAbertoPorPaciente(
          selectedEspecialidade,
          selectedPacienteId,
        )
        if (rascunhoExistente?.id) {
          targetRecordId = rascunhoExistente.id
          setActiveRecordId(rascunhoExistente.id)
        }
      }

      if (targetRecordId) {
        await updateAvaliacao(col, targetRecordId, requestData)
      } else {
        const created = await createAvaliacao(col, requestData)
        if (created?.id) {
          setActiveRecordId(created.id)
        }
      }
    } catch (errSilent) {
      console.warn('Salvamento silencioso no servidor (fallback mantido no local):', errSilent)
    } finally {
      isSavingServerRef.current = false
    }
  }

  // Ao mudar de etapa, salva o rascunho local e sincroniza no servidor (page-by-page)
  const handleEtapaFisioChange = (novaEtapa: number) => {
    setEtapaFisio(novaEtapa)
    if (isFormDirty) {
      dispararSalvamentoLocal(formData, novaEtapa)
      salvarRascunhoServidorSilencioso(formData)
    }
  }

  const handleEtapaPersonalChange = (novaEtapa: number) => {
    setEtapaPersonal(novaEtapa)
    if (isFormDirty) {
      dispararSalvamentoLocal(formData, novaEtapa)
      salvarRascunhoServidorSilencioso(formData)
    }
  }

  // Restaurar rascunho local encontrado
  const handleRestaurarRascunho = () => {
    if (!rascunhoEncontrado) return
    setFormData(rascunhoEncontrado.data)
    setIsFormDirty(true)
    if (rascunhoEncontrado.meta.step) {
      setStep(rascunhoEncontrado.meta.step)
    }
    if (typeof rascunhoEncontrado.meta.sectionIndex === 'number') {
      if (selectedEspecialidade === 'Fisioterapia') {
        setEtapaFisio(rascunhoEncontrado.meta.sectionIndex || 1)
      } else if (selectedEspecialidade === 'Personal') {
        setEtapaPersonal(rascunhoEncontrado.meta.sectionIndex || 1)
      } else {
        setCurrentSectionIndex(rascunhoEncontrado.meta.sectionIndex || 0)
      }
    }
    toast({
      title: 'Rascunho local restaurado!',
      description: `Os dados salvos em ${formatDataHoraPTBR(rascunhoEncontrado.meta.updatedAt)} foram carregados com sucesso.`,
    })
    setRascunhoEncontrado(null)
  }

  // Descartar rascunho local encontrado
  const handleDescartarRascunho = () => {
    if (!selectedPacienteId) return
    limparRascunhoLocal('avaliacao', selectedPacienteId, selectedEspecialidade)
    setRascunhoEncontrado(null)
    toast({
      title: 'Rascunho descartado',
      description: 'O rascunho não salvo anterior foi removido.',
    })
  }

  // Definições de seções e campos por especialidade
  const getSectionsConfig = () => {
    switch (selectedEspecialidade) {
      case 'Fisioterapia':
        return [
          {
            title: 'Anamnese',
            description: 'Histórico da queixa do paciente e antecedentes clínicos',
            fields: [
              {
                name: 'queixa_principal',
                label: 'Queixa Principal *',
                type: 'text',
                required: true,
              },
              {
                name: 'historia_doenca_atual',
                label: 'História da Doença Atual (HDA)',
                type: 'textarea',
              },
              { name: 'historico_medico', label: 'Histórico Médico Pregresso', type: 'text' },
              { name: 'medicamentos', label: 'Medicamentos em Uso', type: 'text' },
              { name: 'cirurgias', label: 'Cirurgias Anteriores', type: 'text' },
            ],
          },
          {
            title: 'Exame Físico & Mobilidade',
            description: 'Postura, amplitude articular (0-180°) e força muscular (1-5)',
            fields: [
              { name: 'postura', label: 'Avaliação Postural', type: 'textarea' },
              { name: 'adm_ombro', label: 'ADM Ombro (0 a 180°)', type: 'slider', max: 180 },
              { name: 'adm_joelho', label: 'ADM Joelho (0 a 180°)', type: 'slider', max: 180 },
              { name: 'adm_quadril', label: 'ADM Quadril (0 a 180°)', type: 'slider', max: 180 },
              { name: 'adm_coluna', label: 'ADM Coluna (0 a 180°)', type: 'slider', max: 180 },
              {
                name: 'forca_mmss',
                label: 'Força MMSS (Escala 1 a 5)',
                type: 'select',
                options: ['1', '2', '3', '4', '5'],
              },
              {
                name: 'forca_mmii',
                label: 'Força MMII (Escala 1 a 5)',
                type: 'select',
                options: ['1', '2', '3', '4', '5'],
              },
              {
                name: 'forca_core',
                label: 'Força Core (Escala 1 a 5)',
                type: 'select',
                options: ['1', '2', '3', '4', '5'],
              },
              { name: 'palpacao', label: 'Palpação e Pontos-Gatilho', type: 'text' },
              { name: 'testes_especiais', label: 'Testes Especiais / Manobras', type: 'text' },
            ],
          },
          {
            title: 'Diagnóstico & Tratamento',
            description: 'Conclusão funcional, metas terapêuticas e plano de sessões',
            fields: [
              {
                name: 'diagnostico_fisioterapeutico',
                label: 'Diagnóstico Fisioterapêutico',
                type: 'text',
              },
              { name: 'objetivos_tratamento', label: 'Objetivos do Tratamento', type: 'textarea' },
              {
                name: 'plano_tratamento',
                label: 'Plano de Tratamento (Conduta)',
                type: 'textarea',
              },
              { name: 'evolucao_nota', label: 'Nota de Evolução (Opcional)', type: 'textarea' },
            ],
          },
        ]

      case 'Personal':
        return [
          {
            title: 'Dados & Objetivos',
            description: 'Metas de treino, nível de experiência e restrições',
            fields: [
              {
                name: 'objetivo_principal',
                label: 'Objetivo Principal *',
                type: 'select',
                options: [
                  'Hipertrofia',
                  'Emagrecimento',
                  'Condicionamento',
                  'Reabilitação',
                  'Performance',
                ],
              },
              {
                name: 'nivel_experiencia',
                label: 'Nível de Experiência',
                type: 'select',
                options: ['Iniciante', 'Intermediário', 'Avançado'],
              },
              {
                name: 'frequencia_semanal',
                label: 'Frequência Semanal Desejada (dias)',
                type: 'number',
              },
              { name: 'restricoes_treino', label: 'Restrições ou Lesões Prévias', type: 'text' },
            ],
          },
          {
            title: 'Avaliação Física & Antropometria',
            description: 'Composição corporal, perímetros e índice IMC',
            fields: [
              { name: 'peso', label: 'Peso Atual (kg)', type: 'number' },
              { name: 'altura', label: 'Altura (m, ex: 1.75)', type: 'number' },
              { name: 'imc', label: 'IMC Calculado', type: 'imc-badge' },
              { name: 'percentual_gordura', label: '% Gordura Corporal Estimada', type: 'number' },
              { name: 'circ_cintura', label: 'Circunferência Cintura (cm)', type: 'number' },
              { name: 'circ_abdomen', label: 'Circunferência Abdômen (cm)', type: 'number' },
              { name: 'circ_quadril', label: 'Circunferência Quadril (cm)', type: 'number' },
              { name: 'flexibilidade_sit_reach', label: 'Teste Sit & Reach (cm)', type: 'number' },
            ],
          },
          {
            title: 'Testes de Carga & Prescrição',
            description: '1RM, capacidade cardiorrespiratória e montagem de treino',
            fields: [
              {
                name: 'teste_1rm',
                label: 'Teste 1RM (Ex: Supino 80kg, Agachamento 100kg)',
                type: 'text',
              },
              { name: 'vo2max', label: 'VO2max Referência (mL/kg/min)', type: 'number' },
              {
                name: 'resistencia_muscular',
                label: 'Teste de Resistência Muscular',
                type: 'text',
              },
              {
                name: 'plano_treino',
                label: 'Prescrição do Treino (Divisão A/B/C/D)',
                type: 'textarea',
              },
              { name: 'observacoes', label: 'Observações Finais', type: 'text' },
            ],
          },
        ]

      case 'Nutrição':
        return [
          {
            title: 'Anamnese Nutricional',
            description: 'Dados corporais, histórico ponderal e saúde clínica',
            fields: [
              { name: 'peso', label: 'Peso Atual (kg)', type: 'number' },
              { name: 'altura', label: 'Altura (m)', type: 'number' },
              { name: 'imc', label: 'IMC Calculado', type: 'imc-badge' },
              { name: 'historico_peso', label: 'Histórico de Peso e Oscilações', type: 'text' },
              { name: 'patologias', label: 'Patologias / Diagnósticos Clínicos', type: 'text' },
              { name: 'medicamentos', label: 'Medicamentos & Suplementos em uso', type: 'text' },
              { name: 'cirurgias', label: 'Cirurgias prévias', type: 'text' },
              {
                name: 'historico_familiar',
                label: 'Histórico Familiar (Diabetes, Hipertensão)',
                type: 'text',
              },
            ],
          },
          {
            title: 'Recordatório Alimentar & Rotina',
            description: 'Refeições habituais de 24 horas, hidratação e estilo de vida',
            fields: [
              { name: 'rec_cafe_manha', label: 'Café da Manhã', type: 'text' },
              { name: 'rec_almoco', label: 'Almoço', type: 'text' },
              { name: 'rec_lanches', label: 'Lanches Intermediários', type: 'text' },
              { name: 'rec_jantar', label: 'Jantar e Ceia', type: 'text' },
              { name: 'consumo_agua_l', label: 'Consumo de Água (Litros/dia)', type: 'number' },
              {
                name: 'consumo_alcool',
                label: 'Consumo de Bebidas Alcoólicas',
                type: 'select',
                options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'],
              },
              { name: 'atividade_fisica', label: 'Atividade Física Praticada', type: 'text' },
              { name: 'sono_horas', label: 'Horas Médias de Sono/noite', type: 'number' },
              {
                name: 'estresse_nivel',
                label: 'Nível de Estresse (1 a 5)',
                type: 'select',
                options: ['1', '2', '3', '4', '5'],
              },
              {
                name: 'tabagismo',
                label: 'Tabagismo',
                type: 'select',
                options: ['Não', 'Sim'],
              },
            ],
          },
          {
            title: 'Plano Nutricional & Metas',
            description: 'Distribuição calórica, cardápio orientativo e objetivos',
            fields: [
              { name: 'objetivos', label: 'Objetivos Nutricionais Principais', type: 'text' },
              {
                name: 'plano_alimentar',
                label: 'Conduta e Plano Alimentar Detalhado',
                type: 'textarea',
              },
              { name: 'metas', label: 'Metas para o Próximo Retorno', type: 'textarea' },
            ],
          },
        ]

      case 'Médico':
        return [
          {
            title: 'Anamnese Médica',
            description: 'Queixa, história atual, alergias e antecedentes',
            fields: [
              {
                name: 'queixa_principal',
                label: 'Queixa Principal *',
                type: 'text',
                required: true,
              },
              { name: 'hda', label: 'História da Doença Atual (HDA)', type: 'textarea' },
              { name: 'historico_medico', label: 'Histórico Médico Pregresso', type: 'text' },
              { name: 'medicamentos', label: 'Medicamentos em Uso Contínuo', type: 'text' },
              { name: 'alergias', label: 'Alergias Medicamentosas / Alimentares', type: 'text' },
              { name: 'antecedentes_familiares', label: 'Antecedentes Familiares', type: 'text' },
            ],
          },
          {
            title: 'Exame Físico Geral',
            description: 'Sinais vitais e exame segmentar',
            fields: [
              {
                name: 'pressao_arterial',
                label: 'Pressão Arterial (ex: 120x80 mmHg)',
                type: 'text',
              },
              { name: 'fc', label: 'Frequência Cardíaca (bpm)', type: 'number' },
              { name: 'fr', label: 'Frequência Respiratória (irpm)', type: 'number' },
              { name: 'temperatura', label: 'Temperatura Axilar (°C)', type: 'number' },
              { name: 'peso', label: 'Peso (kg)', type: 'number' },
              { name: 'altura', label: 'Altura (m)', type: 'number' },
              { name: 'ausculta', label: 'Ausculta Cardíaca e Pulmonar', type: 'text' },
              { name: 'abdome', label: 'Exame do Abdome', type: 'text' },
              { name: 'aparelho_osteomuscular', label: 'Aparelho Osteomuscular', type: 'text' },
            ],
          },
          {
            title: 'Conduta & Prescrição',
            description: 'Hipótese diagnóstica, exames e conduta terapêutica',
            fields: [
              {
                name: 'hipotese_diagnostica',
                label: 'Hipótese Diagnóstica (CID / Descritiva)',
                type: 'text',
              },
              {
                name: 'exames_complementares',
                label: 'Exames Complementares Solicitados',
                type: 'textarea',
              },
              {
                name: 'conduta_terapeutica',
                label: 'Conduta Terapêutica / Orientações',
                type: 'textarea',
              },
              { name: 'prescricao', label: 'Prescrição Médica (Receituário)', type: 'textarea' },
              { name: 'evolucao_nota', label: 'Nota de Evolução Clínica', type: 'textarea' },
            ],
          },
        ]
    }
  }

  const sections = getSectionsConfig()
  const currentSection = sections[currentSectionIndex]

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextIdx = currentSectionIndex + 1
      setCurrentSectionIndex(nextIdx)
      if (isFormDirty) {
        dispararSalvamentoLocal(formData, nextIdx)
        salvarRascunhoServidorSilencioso(formData)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      const prevIdx = currentSectionIndex - 1
      setCurrentSectionIndex(prevIdx)
      if (isFormDirty) {
        dispararSalvamentoLocal(formData, prevIdx)
        salvarRascunhoServidorSilencioso(formData)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSaveEvaluation = async (statusFinal: StatusAvaliacao) => {
    if (!selectedPacienteId) {
      toast({
        title: 'Selecione um paciente',
        description: 'É necessário vincular um paciente à avaliação.',
        variant: 'destructive',
      })
      return
    }

    const isApenasRascunho = statusFinal === 'Rascunho'

    // Guard anti-corrida: serializar salvamento
    if (isSavingServerRef.current || submitting || savingRascunho) {
      console.warn('Salvamento já em processamento. Bloqueando chamada concorrente.')
      return
    }

    try {
      isSavingServerRef.current = true
      if (isApenasRascunho) {
        setSavingRascunho(true)
      } else {
        setSubmitting(true)
      }

      const col = getCollectionNameByEspecialidade(selectedEspecialidade)

      const pendingExames: File[] = (formData._pending_exames_files || []).filter(
        (f: unknown): f is File => typeof File !== 'undefined' && f instanceof File,
      )
      const pendingDinamometro: File[] = (formData._pending_dinamometro_files || []).filter(
        (f: unknown): f is File => typeof File !== 'undefined' && f instanceof File,
      )
      const pendingPostura: File[] = (formData._pending_postura_files || []).filter(
        (f: unknown): f is File => typeof File !== 'undefined' && f instanceof File,
      )

      // Garantir compatibilidade de queixa_principal para Fisioterapia
      const queixaPrincipal =
        formData.queixa_principal ||
        formData.queixas_multiplas?.[0]?.queixa ||
        formData.anamnese_detalhada?.motivo_principal ||
        (selectedEspecialidade === 'Personal'
          ? `Avaliação Física Physical Test - ${formData.objetivo_principal || 'Condicionamento'}`
          : 'Avaliação Fisioterapêutica')

      let basePayload: Record<string, any> = {
        ...formData,
        paciente_id: selectedPacienteId,
        especialidade: selectedEspecialidade,
        status: statusFinal,
        queixa_principal: queixaPrincipal,
        profissional_responsavel:
          formData.profissional_responsavel || user?.name || 'Dr. Guilherme (Admin)',
        data_avaliacao: formData.data_avaliacao || new Date().toISOString().substring(0, 10),
        resumos_anexos: formData.resumos_anexos || {},
      }

      // Limpar campos de estado temporário do form
      delete basePayload._pending_exames_files
      delete basePayload._pending_dinamometro_files
      delete basePayload._pending_postura_files

      // Strip arrays de strings/nomes de arquivos pré-existentes dos campos FILE
      // para nunca enviar strings como upload
      delete basePayload.anexos_exames
      delete basePayload.anexos_dinamometro
      delete basePayload.anexos_postura

      // Se for Fisioterapia, normalizar completamente antes do envio
      if (selectedEspecialidade === 'Fisioterapia') {
        basePayload = normalizeAvaliacaoFisioterapiaPayload(basePayload, statusFinal)
      } else if (selectedEspecialidade !== 'Personal') {
        // Convert numbers para especialidades clássicas (Nutrição, Médico)
        for (const sec of sections) {
          for (const f of sec.fields) {
            if (f.type === 'number' && basePayload[f.name] !== undefined) {
              basePayload[f.name] = basePayload[f.name] === '' ? null : Number(basePayload[f.name])
            }
            if (f.type === 'slider' && basePayload[f.name] !== undefined) {
              basePayload[f.name] = Number(basePayload[f.name])
            }
          }
        }
      }

      // Sincronizar campos legados de Personal se preenchidos no Physical Test
      if (selectedEspecialidade === 'Personal') {
        if (basePayload.composicao_corporal?.percentual_gordura !== undefined) {
          basePayload.percentual_gordura = basePayload.composicao_corporal.percentual_gordura
        }
        if (basePayload.composicao_corporal?.perimetros?.cintura) {
          basePayload.circ_cintura = basePayload.composicao_corporal.perimetros.cintura
        }
        if (basePayload.composicao_corporal?.perimetros?.abdomen) {
          basePayload.circ_abdomen = basePayload.composicao_corporal.perimetros.abdomen
        }
        if (basePayload.composicao_corporal?.perimetros?.quadril) {
          basePayload.circ_quadril = basePayload.composicao_corporal.perimetros.quadril
        }
        if (
          basePayload.plano_semanal_detalhado &&
          !basePayload.ia_plano_treino?.plano_tratamento_semanal
        ) {
          basePayload.ia_plano_treino = {
            ...(basePayload.ia_plano_treino || {}),
            hipotese_diagnostica: basePayload.hipotese_diagnostica_ia,
            diagnostico_funcional: basePayload.diagnostico_funcional,
            objetivos_treinamento: basePayload.objetivos_treinamento,
            plano_tratamento_semanal: basePayload.plano_semanal_detalhado,
          }
        }
      }

      // Se houver uploads pendentes, empacotar em FormData para PocketBase
      let requestData: Record<string, any> | FormData = basePayload
      if (pendingExames.length > 0 || pendingDinamometro.length > 0 || pendingPostura.length > 0) {
        const fd = new FormData()
        for (const [k, v] of Object.entries(basePayload)) {
          if (v === undefined || v === null) continue
          if (typeof v === 'object' && !(v instanceof File) && !(v instanceof Blob)) {
            fd.append(k, JSON.stringify(v))
          } else {
            fd.append(k, String(v))
          }
        }
        for (const f of pendingExames) {
          fd.append('anexos_exames', f)
        }
        for (const f of pendingDinamometro) {
          fd.append('anexos_dinamometro', f)
        }
        for (const f of pendingPostura) {
          fd.append('anexos_postura', f)
        }
        requestData = fd
      }

      let savedRecordId = activeRecordId || editId || (formData.id ? String(formData.id) : '')
      if (!savedRecordId) {
        // Antes de criar, verificar se existe rascunho aberto no backend para este paciente/especialidade
        const rascunhoExistente = await getRascunhoAbertoPorPaciente(
          selectedEspecialidade,
          selectedPacienteId,
        )
        if (rascunhoExistente?.id) {
          savedRecordId = rascunhoExistente.id
          setActiveRecordId(rascunhoExistente.id)
        }
      }

      if (savedRecordId) {
        await updateAvaliacao(col, savedRecordId, requestData)
      } else {
        const created = await createAvaliacao(col, requestData)
        savedRecordId = created.id
        setActiveRecordId(created.id)
      }

      // Manter rascunho local sincronizado
      dispararSalvamentoLocal(formData)

      // SE FOR RASCUNHO: PERMANECER NA PÁGINA (NÃO SAIR!)
      if (isApenasRascunho) {
        setIsFormDirty(false)
        toast({
          title: 'Rascunho salvo no servidor!',
          description:
            'Todos os dados foram gravados com sucesso. Você pode continuar preenchendo normalmente.',
        })
        return
      }

      // SE FOR CONCLUSÃO FINAL:
      isSuccessfullySavedRef.current = true
      setIsFormDirty(false)
      limparRascunhoLocal('avaliacao', selectedPacienteId, selectedEspecialidade)
      toast({
        title: 'Avaliação concluída com sucesso!',
        description: 'O prontuário foi oficializado e salvo no servidor.',
      })

      // If Concluída, create a snapshot in timeline and ensure presenca
      const resumoTexto =
        basePayload.queixa_principal ||
        basePayload.objetivo_principal ||
        basePayload.objetivos ||
        basePayload.hipotese_diagnostica ||
        'Avaliação clínica multidisciplinar finalizada.'

      await createTimelineEvent({
        paciente_id: selectedPacienteId,
        tipo: 'Avaliação',
        especialidade: selectedEspecialidade,
        titulo: `Avaliação de ${selectedEspecialidade}`,
        conteudo: `Avaliação concluída por ${basePayload.profissional_responsavel}.\nResumo/Queixa: ${resumoTexto}`,
        data_evento: new Date().toISOString(),
      }).catch(() => {})

      // Garantir presença automática de avaliação no frontend caso o hook backend ainda não tenha rodado
      try {
        const { area, detalhe } = mapearEspecialidadeParaServicoPresenca(
          selectedEspecialidade,
          'avaliacao',
        )
        const origemId = `AVAL-${savedRecordId}`
        await garantirPresencaAutomatica({
          pacienteId: selectedPacienteId,
          pacienteNome: selectedPaciente?.nome,
          profissionalId: user?.id,
          profissionalNome: basePayload.profissional_responsavel || user?.name,
          dataAtendimento: basePayload.data_avaliacao || new Date().toISOString(),
          areaServico: area,
          detalheServico: detalhe,
          identificadorOrigem: origemId,
          observacaoOrigem: `Gerado automaticamente pela conclusão da avaliação (${origemId})`,
        })
      } catch (errPres) {
        console.warn('Fallback de presença após avaliação:', errPres)
      }

      navigate(`/prontuarios/${savedRecordId}?esp=${encodeURIComponent(selectedEspecialidade)}`)
    } catch (err: any) {
      console.error('Erro salvando avaliação:', err)
      const userMessage = getErrorMessage(err)
      toast({
        title: 'Não foi possível salvar a avaliação',
        description: userMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
      setSavingRascunho(false)
      isSavingServerRef.current = false
    }
  }

  const selectedPaciente = pacientes.find((p) => p.id === selectedPacienteId)

  // Ao trocar de paciente manualmente no select, pré-preencher com dados do pré-cadastro se existirem e formData estiver limpo
  const handleSelectPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId)
    // Verificar se já existe rascunho aberto desse paciente para a especialidade selecionada
    getRascunhoAbertoPorPaciente(selectedEspecialidade, pacienteId)
      .then((rascunho: any) => {
        if (rascunho?.id) {
          setActiveRecordId(rascunho.id)
          setFormData(rascunho)
          toast({
            title: 'Rascunho aberto carregado!',
            description:
              'Carregamos o rascunho em andamento deste paciente para que você continue de onde parou.',
          })
          return
        }
      })
      .catch(() => {})

    const found = pacientes.find((p) => p.id === pacienteId)
    if (
      found &&
      !editId &&
      (found.motivo_procura || found.limitacoes_incomodo || found.diagnostico_medico)
    ) {
      setFormData((prev) => ({
        ...prev,
        queixa_principal: prev.queixa_principal || found.motivo_procura || '',
        anamnese_detalhada: {
          ...(prev.anamnese_detalhada || {}),
          motivo_principal: prev.anamnese_detalhada?.motivo_principal || found.motivo_procura || '',
          impacto_dia_a_dia:
            prev.anamnese_detalhada?.impacto_dia_a_dia || found.limitacoes_incomodo || '',
          o_que_evita_fazer:
            prev.anamnese_detalhada?.o_que_evita_fazer || found.limitacoes_incomodo || '',
          tentativas_anteriores:
            prev.anamnese_detalhada?.tentativas_anteriores || found.tratamentos_anteriores || '',
          resultado_valeu_a_pena:
            prev.anamnese_detalhada?.resultado_valeu_a_pena || found.resultado_esperado || '',
          desejo_voltar_fazer:
            prev.anamnese_detalhada?.desejo_voltar_fazer || found.resultado_esperado || '',
          diagnostico_medico:
            prev.anamnese_detalhada?.diagnostico_medico || found.diagnostico_medico || '',
          frase_chave_paciente:
            prev.anamnese_detalhada?.frase_chave_paciente || found.resultado_esperado || '',
        },
        historia_doenca_atual:
          prev.historia_doenca_atual ||
          `[Pré-cadastro] Motivo: ${found.motivo_procura || 'Não informado'}\nLimitações: ${found.limitacoes_incomodo || 'Não informado'}\nTratamentos prévios: ${found.tratamentos_anteriores || 'Não informado'}`,
        diagnostico_fisioterapeutico:
          prev.diagnostico_fisioterapeutico ||
          (found.diagnostico_medico !== 'Não tenho / não sei' ? found.diagnostico_medico : ''),
        diagnostico_medico: prev.diagnostico_medico || found.diagnostico_medico || '',
        objetivos_tratamento: prev.objetivos_tratamento || found.resultado_esperado || '',
      }))
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Modal de bloqueio de navegação interna com dados não salvos */}
      <ModalAlertaSaida
        open={isBlocked}
        title="Avaliação não salva"
        description="Você possui dados preenchidos desta avaliação que ainda não foram gravados no servidor. Se sair agora, as informações não salvas serão perdidas. Deseja realmente sair desta tela?"
        confirmText="Sim, sair sem salvar"
        cancelText="Continuar editando"
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />

      {/* Top back & banner de segurança se cair na tela sem intenção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/prontuarios')}
          className="text-xs text-gray-500 hover:text-gray-900 -ml-2 rounded-xl self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para Prontuários
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pacientes')}
          className="text-xs text-[#8C6527] hover:text-[#704F1D] hover:bg-[#FAF5EE] rounded-xl self-start sm:self-auto"
        >
          Ir para Lista de Pacientes
        </Button>
      </div>

      {/* Aviso suave para acalmar o profissional se caiu aqui por engano */}
      {!editId && step === 1 && (
        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E9E1D2] text-xs text-gray-600 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Suas avaliações salvas e rascunhos anteriores continuam 100% preservados e seguros.
            </span>
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => navigate('/pacientes')}
            className="text-xs text-[#8C6527] p-0 h-auto font-bold underline shrink-0"
          >
            Ver pacientes
          </Button>
        </div>
      )}

      {/* STEP 1: Seleção de Paciente & Especialidade */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Nova Avaliação Clínica
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Etapa 1: Selecione o paciente e a área de atendimento especializada.
            </p>
          </div>

          {/* Selecionar Paciente */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <User className="h-4 w-4 text-[#8C6527]" /> Paciente do Atendimento *
            </Label>
            <Select value={selectedPacienteId} onValueChange={handleSelectPaciente}>
              <SelectTrigger className="h-12 rounded-xl border-gray-200 text-sm">
                <SelectValue placeholder="Selecione um paciente cadastrado..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {pacientes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} {p.cpf ? `— CPF: ${p.cpf}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selecionar Especialidade (4 Cards) */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Especialidade *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fisio */}
              <div
                onClick={() => setSelectedEspecialidade('Fisioterapia')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  selectedEspecialidade === 'Fisioterapia'
                    ? 'border-[#3B82F6] bg-blue-50/40 shadow-xs'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shrink-0">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Fisioterapia</h4>
                  <p className="text-xs text-gray-500">
                    Anamnese funcional, ADM articular, força muscular e diagnóstico
                  </p>
                </div>
              </div>

              {/* Personal */}
              <div
                onClick={() => setSelectedEspecialidade('Personal')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  selectedEspecialidade === 'Personal'
                    ? 'border-[#F97316] bg-orange-50/40 shadow-xs'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center shrink-0">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Personal Trainer</h4>
                  <p className="text-xs text-gray-500">
                    Avaliação física, IMC, perímetros, teste 1RM e prescrição de treino
                  </p>
                </div>
              </div>

              {/* Nutrição */}
              <div
                onClick={() => setSelectedEspecialidade('Nutrição')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  selectedEspecialidade === 'Nutrição'
                    ? 'border-[#22C55E] bg-green-50/40 shadow-xs'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                  <Apple className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Nutrição</h4>
                  <p className="text-xs text-gray-500">
                    Recordatório 24h, antropometria, hábitos e plano nutricional
                  </p>
                </div>
              </div>

              {/* Médico */}
              <div
                onClick={() => setSelectedEspecialidade('Médico')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  selectedEspecialidade === 'Médico'
                    ? 'border-[#8B5CF6] bg-purple-50/40 shadow-xs'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center shrink-0">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Médico</h4>
                  <p className="text-xs text-gray-500">
                    Exame clínico, sinais vitais, hipótese diagnóstica e conduta
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              disabled={!selectedPacienteId}
              onClick={() => setStep(2)}
              className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-11 px-6 shadow-sm flex items-center gap-2 border border-[#DFBF8E]/40"
            >
              Prosseguir para Formulário
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Formulário Dinâmico da Especialidade */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Alerta de Restauração de Rascunho Local */}
          {rascunhoEncontrado && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-2xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-amber-700" />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-amber-950">
                    Rascunho não salvo encontrado!
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Encontramos um rascunho salvo localmente em{' '}
                    <strong>{formatDataHoraPTBR(rascunhoEncontrado.meta.updatedAt)}</strong> para
                    este atendimento. Deseja restaurar o que foi preenchido anteriormente?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDescartarRascunho}
                  className="rounded-xl h-9 text-xs border-amber-200 text-amber-900 hover:bg-amber-100/60"
                >
                  Descartar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRestaurarRascunho}
                  className="rounded-xl h-9 px-4 text-xs font-bold bg-[#8C6527] hover:bg-[#704F1D] text-white shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurar Rascunho
                </Button>
              </div>
            </div>
          )}

          {/* Header Card do Paciente e Especialidade */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  ESPECIALIDADE_COLORS[selectedEspecialidade]?.badge
                }`}
              >
                {selectedEspecialidade}
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedPaciente?.nome || 'Paciente Selecionado'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">
                    Profissional:{' '}
                    {formData.profissional_responsavel || user?.name || 'Clínica SOUL'}
                  </p>
                  {ultimoSalvoLocal && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Salvo localmente às{' '}
                      {ultimoSalvoLocal.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="text-xs rounded-xl self-start sm:self-auto"
            >
              Trocar Paciente / Especialidade
            </Button>
          </div>

          {/* Se for Fisioterapia: Renderizar estrutura completa clínica */}
          {selectedEspecialidade === 'Fisioterapia' ? (
            <FormFisioterapia
              formData={formData}
              onChange={handleFieldChange}
              onSave={handleSaveEvaluation}
              submitting={submitting}
              paciente={selectedPaciente}
              existingRecordId={activeRecordId || editId}
              etapaAtual={etapaFisio}
              onEtapaChange={handleEtapaFisioChange}
            />
          ) : selectedEspecialidade === 'Personal' ? (
            /* Formulário da Avaliação Física do PHYSICAL TEST para Personal */
            <FormPersonal
              formData={formData}
              onChange={handleFieldChange}
              onSave={handleSaveEvaluation}
              submitting={submitting}
              paciente={selectedPaciente}
              existingRecordId={activeRecordId || editId}
              etapaAtual={etapaPersonal}
              onEtapaChange={handleEtapaPersonalChange}
            />
          ) : (
            /* Formulário padrão para outras especialidades (Nutrição, Médico) */
            <div className="space-y-6">
              {/* Stepper Progress Bar */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>
                    Etapa {currentSectionIndex + 1} de {sections.length}: {currentSection.title}
                  </span>
                  <span>
                    {Math.round(((currentSectionIndex + 1) / sections.length) * 100)}% concluído
                  </span>
                </div>

                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C9A46A] to-[#B87355] transition-all duration-300"
                    style={{ width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {sections.map((sec, idx) => (
                    <button
                      key={sec.title}
                      onClick={() => setCurrentSectionIndex(idx)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                        currentSectionIndex === idx
                          ? 'bg-[#1E2530] text-white shadow-xs'
                          : idx < currentSectionIndex
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {idx + 1}. {sec.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields Section Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{currentSection.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{currentSection.description}</p>
                </div>

                <div className="space-y-4">
                  {currentSection.fields.map((field: any) => {
                    const val = formData[field.name] ?? ''

                    if (field.type === 'textarea') {
                      return (
                        <div key={field.name} className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-700">
                            {field.label}
                          </Label>
                          <Textarea
                            rows={3}
                            value={val}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={`Preencha ${field.label.toLowerCase()}...`}
                            className="rounded-xl border-gray-200 text-xs sm:text-sm"
                          />
                        </div>
                      )
                    }

                    if (field.type === 'slider') {
                      const numVal = Number(val) || 0
                      return (
                        <div
                          key={field.name}
                          className="space-y-2 p-3 rounded-2xl bg-gray-50/70 border border-gray-100"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                            <span>{field.label}</span>
                            <span className="font-mono text-[#8C6527] font-bold text-sm">
                              {numVal}°
                            </span>
                          </div>
                          <Slider
                            value={[numVal]}
                            max={field.max || 180}
                            step={1}
                            onValueChange={(vals) => handleFieldChange(field.name, vals[0])}
                            className="py-1"
                          />
                        </div>
                      )
                    }

                    if (field.type === 'select') {
                      return (
                        <div key={field.name} className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-700">
                            {field.label}
                          </Label>
                          <Select
                            value={val ? String(val) : ''}
                            onValueChange={(v) => handleFieldChange(field.name, v)}
                          >
                            <SelectTrigger className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm">
                              <SelectValue placeholder="Selecione uma opção..." />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    }

                    if (field.type === 'imc-badge') {
                      const imc = formData.imc || '—'
                      let classificacao = 'Aguardando peso e altura'
                      if (typeof imc === 'number') {
                        if (imc < 18.5) classificacao = 'Abaixo do peso'
                        else if (imc < 24.9) classificacao = 'Peso adequado'
                        else if (imc < 29.9) classificacao = 'Sobrepeso'
                        else classificacao = 'Obesidade'
                      }

                      return (
                        <div
                          key={field.name}
                          className="p-3.5 rounded-2xl bg-[#FAF4EA] border border-[#E3C89A] flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-[#8C6527] block">
                              Índice IMC Calculado
                            </span>
                            <span className="text-xs text-gray-600">{classificacao}</span>
                          </div>
                          <div className="text-xl font-black text-[#8C6527] font-mono">
                            {imc} {typeof imc === 'number' ? 'kg/m²' : ''}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={field.name} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">{field.label}</Label>
                        <Input
                          type={field.type === 'number' ? 'number' : 'text'}
                          step={field.type === 'number' ? 'any' : undefined}
                          value={val}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={`Informe ${field.label.toLowerCase()}...`}
                          className="h-10 rounded-xl border-gray-200 text-xs sm:text-sm"
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    disabled={currentSectionIndex === 0}
                    onClick={handlePrevSection}
                    className="rounded-xl h-10 px-4 text-xs font-semibold w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Etapa Anterior
                  </Button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      disabled={submitting || savingRascunho}
                      onClick={() => handleSaveEvaluation('Rascunho')}
                      className="rounded-xl h-10 px-4 text-xs font-semibold border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      {savingRascunho ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                      ) : (
                        <Save className="h-3.5 w-3.5 text-gray-500" />
                      )}
                      Salvar Rascunho
                    </Button>

                    {currentSectionIndex < sections.length - 1 ? (
                      <Button
                        onClick={handleNextSection}
                        className="bg-gray-900 hover:bg-black text-white rounded-xl h-10 px-5 text-xs font-semibold flex items-center gap-1"
                      >
                        Próxima Etapa <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        disabled={submitting}
                        onClick={() => handleSaveEvaluation('Concluída')}
                        className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-6 text-xs shadow-sm flex items-center gap-1.5 border border-[#DFBF8E]/40"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Concluir Avaliação
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
