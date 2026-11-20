import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, formatDataPTBR } from '@/lib/constants'
import { getPacientes } from '@/services/pacientes'
import type { PacienteRecord } from '@/types/database'
import {
  CAPA_CONFIG_PADRAO,
  calcularSubtotalItem,
  calcularTotalPrograma,
  createProgramaTratamento,
  deleteProgramaTratamento,
  exemploItensRehab,
  formatarMoedaBRL,
  getProgramaTratamento,
  nomeArquivoProposta,
  parseCapaConfig,
  parsePlanos,
  planosPadrao,
  listarModelosTratamento,
  listarProgramasTratamentoPorPaciente,
  listarServicosConhecidos,
  updateProgramaTratamento,
  type CapaFotoConfig,
  type ItemServicoProposta,
  type PlanoProposta,
  type ProgramaTratamentoRecord,
} from '@/services/programasTratamento'
import { DocumentoPropostaTratamento } from '@/components/DocumentoPropostaTratamento'
import { baixarPdfPropostaTratamento } from '@/lib/exportacaoProposta'
import { PainelCapaProposta } from '@/components/programas/PainelCapaProposta'
import { PainelPlanosProposta } from '@/components/programas/PainelPlanosProposta'
import { PainelTextosProposta } from '@/components/programas/PainelTextosProposta'
import {
  Trash2,
  Printer,
  Plus,
  Save,
  FileText,
  Search,
  History,
  Layers,
  Download,
  Bookmark,
  Eye,
} from 'lucide-react'

type ItemFormState = ItemServicoProposta

const ITEM_VAZIO: ItemFormState = {
  nome: '',
  quantidade: 1,
  valorUnitario: 0,
  tipoDesconto: 'nenhum',
  desconto: 0,
}

/** Prévia: 2 páginas A4 (794×1123 px) + gap de 24 px entre elas */
const ALTURA_LAYOUT_PREVIA = 2 * 1123 + 24
const ESCALA_PREVIA = 0.62
const ESCALA_PREVIA_DIALOGO = 0.72

interface PropsFormulario {
  pacienteId: string
  programa: ProgramaTratamentoRecord | null
  onSalvo: (registro: ProgramaTratamentoRecord) => void
  onCancelar: () => void
}

/** Formulário de montagem do programa (paciente, itens, capa, textos, desconto) */
const FormularioPrograma: React.FC<PropsFormulario> = ({
  pacienteId,
  programa,
  onSalvo,
  onCancelar,
}) => {
  const { toast } = useToast()
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteRecord | null>(null)
  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [listaPacientes, setListaPacientes] = useState<PacienteRecord[]>([])
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [duracaoSemanas, setDuracaoSemanas] = useState<number>(0)
  const [itens, setItens] = useState<ItemFormState[]>([{ ...ITEM_VAZIO }])
  const [descTipo, setDescTipo] = useState<'nenhum' | 'percentual' | 'valor'>('nenhum')
  const [descValor, setDescValor] = useState<number>(0)
  const [condicoes, setCondicoes] = useState('')
  const [status, setStatus] = useState<'rascunho' | 'finalizada'>('rascunho')
  const [salvando, setSalvando] = useState(false)
  const [servicosConhecidos, setServicosConhecidos] = useState<string[]>([])
  const [imprimindo, setImprimindo] = useState(false)

  // Liberdade de edição (capa com foto, textos livres, modelos)
  const [mesReferencia, setMesReferencia] = useState('')
  const [textoApresentacao, setTextoApresentacao] = useState('')
  const [textoIntroducao, setTextoIntroducao] = useState('')
  const [condicoesPagamento, setCondicoesPagamento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [capaConfig, setCapaConfig] = useState<CapaFotoConfig>({ ...CAPA_CONFIG_PADRAO })
  const [capaFotoArquivo, setCapaFotoArquivo] = useState<File | null>(null)
  const [capaFotoPreview, setCapaFotoPreview] = useState<string>('')
  const [removerCapaFoto, setRemoverCapaFoto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Página 2 da proposta: frase da capa, três planos e identidade/rodapé
  const [frasePaciente, setFrasePaciente] = useState('')
  const [planos, setPlanos] = useState<PlanoProposta[]>(() => planosPadrao())
  const [propsCab, setPropsCab] = useState('')
  const [propsPagina, setPropsPagina] = useState('')
  const [propsRodape, setPropsRodape] = useState('')
  const [modelos, setModelos] = useState<ProgramaTratamentoRecord[]>([])
  const [aplicandoModelo, setAplicandoModelo] = useState<string | null>(null)
  const [dialogModeloAberto, setDialogModeloAberto] = useState(false)
  const [nomeModelo, setNomeModelo] = useState('')
  const [salvandoModelo, setSalvandoModelo] = useState(false)
  const [dialogPreviaAberto, setDialogPreviaAberto] = useState(false)
  const refInputFoto = React.useRef<HTMLInputElement>(null)

  // Carrega lista de pacientes e dados do programa (edição)
  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const resposta = await getPacientes()
        if (!ativo) return
        const todos: PacienteRecord[] = resposta.items || []
        setListaPacientes(todos)
        if (programa) {
          const pac = programa.expand?.paciente_id
          if (pac) setPacienteSelecionado(pac as PacienteRecord)
          setTitulo(programa.titulo || '')
          setDataInicio(programa.data_inicio ? programa.data_inicio.slice(0, 10) : '')
          setDataFim(programa.data_fim ? programa.data_fim.slice(0, 10) : '')
          setDuracaoSemanas(Number(programa.duracao_semanas) || 0)
          const itensCarregados = Array.isArray(programa.itens)
            ? programa.itens.map((it) => ({ ...ITEM_VAZIO, ...it }))
            : []
          setItens(itensCarregados.length > 0 ? itensCarregados : [{ ...ITEM_VAZIO }])
          setDescTipo(
            (programa.desconto_geral_tipo || 'nenhum') as 'nenhum' | 'percentual' | 'valor',
          )
          setDescValor(Number(programa.desconto_geral_valor) || 0)
          setCondicoes(programa.condicoes || '')
          setStatus(programa.status || 'rascunho')
          // Liberdade de edição: textos e capa do registro salvo
          setMesReferencia(programa.mes_referencia || '')
          setTextoApresentacao(programa.texto_apresentacao || '')
          setTextoIntroducao(programa.texto_introducao || '')
          setCondicoesPagamento(programa.condicoes_pagamento || '')
          setObservacoes(programa.observacoes || '')
          setCapaConfig(parseCapaConfig(programa.capa_config))
          setFrasePaciente(programa.frase_paciente || '')
          setPlanos(parsePlanos(programa.planos))
          setPropsCab(programa.props_cab || '')
          setPropsPagina(programa.props_pagina || '')
          setPropsRodape(programa.props_rodape || '')
          const urlSalva = programa.id
            ? programa.capa_foto
              ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/programas_tratamento/${programa.id}/${programa.capa_foto}`
              : ''
            : ''
          setCapaFotoPreview(urlSalva)
        } else if (pacienteId) {
          const pac = todos.find((p) => p.id === pacienteId)
          if (pac) setPacienteSelecionado(pac)
        }
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err)
        toast({
          title: 'Erro ao carregar pacientes',
          description: 'Não foi possível carregar a lista de pacientes existentes.',
          variant: 'destructive',
        })
      }
    })()
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId, programa?.id])

  // Serviços conhecidos (sugestões rápidas da clínica)
  useEffect(() => {
    let ativo = true
    listarServicosConhecidos()
      .then((s) => {
        if (ativo) setServicosConhecidos(s)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  // Modelos salvos (is_modelo = true)
  const recarregarModelos = useCallback(() => {
    listarModelosTratamento()
      .then((m) => setModelos(m))
      .catch(() => setModelos([]))
  }, [])

  useEffect(() => {
    recarregarModelos()
  }, [recarregarModelos])

  const pacientesFiltrados = useMemo(() => {
    const termo = buscaPaciente.trim().toLowerCase()
    if (!termo) return listaPacientes.slice(0, 12)
    return listaPacientes
      .filter(
        (p) =>
          (p.nome || '').toLowerCase().includes(termo) ||
          (p.cpf || '').includes(termo.replace(/\D/g, '')),
      )
      .slice(0, 12)
  }, [buscaPaciente, listaPacientes])

  const totalGeral = useMemo(
    () => calcularTotalPrograma(itens, descTipo, descValor),
    [itens, descTipo, descValor],
  )
  const somaSubtotais = useMemo(
    () => itens.reduce((acc, it) => acc + calcularSubtotalItem(it), 0),
    [itens],
  )

  const atualizarItem = (idx: number, campo: keyof ItemFormState, valor: unknown) => {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)))
  }

  const adicionarItem = () => setItens((prev) => [...prev, { ...ITEM_VAZIO }])
  const removerItem = (idx: number) =>
    setItens((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))

  // ---- Capa: foto ----
  const selecionarCapaFoto = (file: File | null) => {
    if (!file) return
    setCapaFotoArquivo(file)
    setRemoverCapaFoto(false)
    setCapaFotoPreview(URL.createObjectURL(file))
  }

  const removerCapaFotoAgora = () => {
    setCapaFotoArquivo(null)
    setCapaFotoPreview('')
    setRemoverCapaFoto(true)
  }

  // ---- Página 2: planos e fotos por plano (data URL dentro do JSON 'planos') ----
  const aoMudarPlano = useCallback((indice: number, plano: PlanoProposta) => {
    setPlanos((prev) => prev.map((p, i) => (i === indice ? plano : p)))
  }, [])

  const aoFotoPlanoArquivo = useCallback((indice: number, file: File | null) => {
    if (file) return // a foto nova entra como data URL via aoFotosNovas
    setPlanos((prev) => prev.map((p, i) => (i === indice ? { ...p, foto: '' } : p)))
  }, [])

  const aoFotosNovas = useCallback((fotos: Record<number, string>) => {
    setPlanos((prev) => prev.map((p, i) => (i in fotos && fotos[i] ? { ...p, foto: fotos[i] } : p)))
  }, [])

  // ---- Modelos ----
  const aplicarModelo = async (modelo: ProgramaTratamentoRecord) => {
    setAplicandoModelo(modelo.id)
    try {
      const bruto = modelo
      // Itens, textos e capa do modelo (a foto NÃO copia — admin reenvia)
      const itensModelo: ItemFormState[] = Array.isArray(bruto.itens)
        ? bruto.itens.map((it) => ({ ...ITEM_VAZIO, ...it }))
        : []
      setItens(itensModelo.length > 0 ? itensModelo : [{ ...ITEM_VAZIO }])
      setTitulo(bruto.titulo || '')
      setDuracaoSemanas(Number(bruto.duracao_semanas) || 0)
      setDataInicio(bruto.data_inicio ? bruto.data_inicio.slice(0, 10) : '')
      setDataFim(bruto.data_fim ? bruto.data_fim.slice(0, 10) : '')
      setDescTipo((bruto.desconto_geral_tipo || 'nenhum') as 'nenhum' | 'percentual' | 'valor')
      setDescValor(Number(bruto.desconto_geral_valor) || 0)
      setCondicoes(bruto.condicoes || '')
      setMesReferencia(bruto.mes_referencia || '')
      setTextoApresentacao(bruto.texto_apresentacao || '')
      setTextoIntroducao(bruto.texto_introducao || '')
      setCondicoesPagamento(bruto.condicoes_pagamento || '')
      setObservacoes(bruto.observacoes || '')
      setCapaConfig(parseCapaConfig(bruto.capa_config))
      setFrasePaciente(bruto.frase_paciente || '')
      setPlanos(parsePlanos(bruto.planos))
      setPropsCab(bruto.props_cab || '')
      setPropsPagina(bruto.props_pagina || '')
      setPropsRodape(bruto.props_rodape || '')
      setCapaFotoArquivo(null)
      setCapaFotoPreview('')
      setRemoverCapaFoto(false)
      toast({
        title: 'Modelo aplicado',
        description: `"${bruto.modelo_nome || bruto.titulo}" carregado. Agora troque apenas o paciente da proposta.`,
      })
    } catch (err) {
      console.error('Erro ao aplicar modelo:', err)
      toast({
        title: 'Erro ao aplicar modelo',
        description: 'Não foi possível carregar os dados do modelo.',
        variant: 'destructive',
      })
    } finally {
      setAplicandoModelo(null)
    }
  }

  const salvarComoModelo = async () => {
    const nome = nomeModelo.trim() || titulo.trim()
    if (!nome) {
      toast({
        title: 'Dê um nome ao modelo',
        description: 'Ex.: SOUL REHAB Ombro — 8 semanas.',
        variant: 'destructive',
      })
      return
    }
    setSalvandoModelo(true)
    try {
      // O modelo guarda a montagem (itens/textos/capa) sem paciente próprio:
      // reutiliza o paciente atual como vínculo exigido pela coleção.
      const payload = montarPayload(status === 'finalizada' ? 'rascunho' : 'rascunho', true, nome)
      const salvo = await createProgramaTratamento(payload, capaFotoArquivo)
      toast({
        title: 'Modelo salvo',
        description: `"${nome}" está disponível na escolha de modelos das próximas propostas.`,
      })
      setDialogModeloAberto(false)
      setNomeModelo('')
      recarregarModelos()
      void salvo
    } catch (err: any) {
      console.error('Erro ao salvar modelo:', err)
      toast({
        title: 'Erro ao salvar modelo',
        description: err?.message || 'Não foi possível salvar o modelo.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoModelo(false)
    }
  }

  const montarPayload = (
    statusNovo: 'rascunho' | 'finalizada',
    comoModelo = false,
    nomeDoModelo = '',
  ) => {
    const itensValidos = itens.filter((it) => it.nome.trim() && it.quantidade > 0)
    return {
      paciente_id: pacienteSelecionado?.id || '',
      titulo: titulo.trim(),
      data_inicio: dataInicio || '',
      data_fim: dataFim || '',
      duracao_semanas: Number(duracaoSemanas) || 0,
      itens: itensValidos,
      desconto_geral_tipo: descTipo,
      desconto_geral_valor: descTipo === 'nenhum' ? 0 : Number(descValor) || 0,
      valor_total: totalGeral,
      condicoes: condicoes.trim(),
      status: statusNovo,
      paciente_nome: pacienteSelecionado?.nome || '',
      mes_referencia: mesReferencia.trim(),
      texto_apresentacao: textoApresentacao.trim(),
      texto_introducao: textoIntroducao.trim(),
      condicoes_pagamento: condicoesPagamento.trim(),
      observacoes: observacoes.trim(),
      capa_config: capaConfig,
      frase_paciente: frasePaciente.trim(),
      planos,
      props_cab: propsCab.trim(),
      props_pagina: propsPagina.trim(),
      props_rodape: propsRodape.trim(),
      is_modelo: comoModelo,
      modelo_nome: comoModelo ? nomeDoModelo : '',
    }
  }

  const salvar = async (statusNovo: 'rascunho' | 'finalizada') => {
    if (!pacienteSelecionado) {
      toast({
        title: 'Selecione um paciente',
        description: 'Escolha o paciente da proposta na lista de busca.',
        variant: 'destructive',
      })
      return
    }
    if (!titulo.trim()) {
      toast({
        title: 'Informe o título do programa',
        description: 'Ex.: Programa de Reabilitação de Joelho — 12 semanas.',
        variant: 'destructive',
      })
      return
    }
    const itensValidos = itens.filter((it) => it.nome.trim() && it.quantidade > 0)
    if (itensValidos.length === 0) {
      toast({
        title: 'Adicione ao menos um serviço',
        description: 'Cada item precisa de nome, quantidade e valor.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      setStatus(statusNovo)
      const payload = montarPayload(statusNovo)
      const salvo = programa
        ? await updateProgramaTratamento(programa.id, payload, capaFotoArquivo, removerCapaFoto)
        : await createProgramaTratamento(payload, capaFotoArquivo)
      toast({
        title: statusNovo === 'finalizada' ? 'Proposta finalizada' : 'Rascunho salvo',
        description: `Programa "${salvo.titulo}" salvo no histórico do paciente.`,
      })
      onSalvo(salvo)
    } catch (err: any) {
      console.error('Erro ao salvar programa de tratamento:', err)
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Não foi possível salvar o programa de tratamento.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const imprimir = useCallback(() => {
    if (!pacienteSelecionado || !titulo.trim()) {
      toast({
        title: 'Complete os dados antes de gerar a proposta',
        description: 'Selecione o paciente e informe o título do programa.',
        variant: 'destructive',
      })
      return
    }
    setImprimindo(true)
  }, [pacienteSelecionado, titulo, toast])

  const baixarPdf = async () => {
    if (!pacienteSelecionado || !titulo.trim()) {
      toast({
        title: 'Complete os dados antes de gerar o PDF',
        description: 'Selecione o paciente e informe o título do programa.',
        variant: 'destructive',
      })
      return
    }
    setGerandoPdf(true)
    try {
      await baixarPdfPropostaTratamento(registroPrevia)
      toast({
        title: 'PDF gerado',
        description: `Arquivo "${nomeArquivoProposta(
          pacienteSelecionado.nome || 'Cliente',
          mesReferencia,
        )}" baixado.`,
      })
    } catch (err: any) {
      console.error('Erro ao gerar PDF da proposta:', err)
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Não foi possível gerar o PDF da proposta.',
        variant: 'destructive',
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  // Fecha a sobreposição de impressão depois do diálogo de impressão do navegador
  useEffect(() => {
    if (!imprimindo) return
    const antes = () => {}
    const depois = () => setTimeout(() => setImprimindo(false), 400)
    window.addEventListener('beforeprint', antes)
    window.addEventListener('afterprint', depois)
    window.print()
    const t = setTimeout(() => setImprimindo(false), 1500)
    return () => {
      window.removeEventListener('beforeprint', antes)
      window.removeEventListener('afterprint', depois)
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imprimindo])

  const registroPrevia = useMemo<ProgramaTratamentoRecord>(
    () => ({
      id: programa?.id || 'previa',
      paciente_id: pacienteSelecionado?.id || '',
      titulo: titulo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      duracao_semanas: Number(duracaoSemanas) || 0,
      itens,
      desconto_geral_tipo: descTipo,
      desconto_geral_valor: Number(descValor) || 0,
      valor_total: totalGeral,
      condicoes,
      status,
      paciente_nome: pacienteSelecionado?.nome || '',
      criado_por: programa?.criado_por || '',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      capa_foto: capaFotoPreview,
      capa_config: capaConfig,
      frase_paciente: frasePaciente,
      planos,
      props_cab: propsCab,
      props_pagina: propsPagina,
      props_rodape: propsRodape,
      mes_referencia: mesReferencia,
      texto_apresentacao: textoApresentacao,
      texto_introducao: textoIntroducao,
      condicoes_pagamento: condicoesPagamento,
      observacoes: observacoes,
      is_modelo: false,
      modelo_nome: '',
      expand: {
        paciente_id: pacienteSelecionado || undefined,
      },
    }),
    [
      programa,
      pacienteSelecionado,
      titulo,
      dataInicio,
      dataFim,
      duracaoSemanas,
      itens,
      descTipo,
      descValor,
      totalGeral,
      condicoes,
      status,
      capaConfig,
      capaFotoPreview,
      mesReferencia,
      textoApresentacao,
      textoIntroducao,
      condicoesPagamento,
      observacoes,
      frasePaciente,
      planos,
      propsCab,
      propsPagina,
      propsRodape,
    ],
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Coluna principal: dados do programa (editor) */}
        <div className="space-y-6 min-w-0">
          {/* Resumo e ações (topo do editor) */}
          <Card style={{ borderTop: '3px solid #C9A46A' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="text-[#6A402D]">Resumo da Proposta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#5F544F] font-semibold">
                    Paciente
                  </p>
                  <p className="font-medium">{pacienteSelecionado?.nome || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#5F544F] font-semibold">
                    Programa
                  </p>
                  <p className="font-medium">{titulo || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#5F544F] font-semibold">
                    Referência
                  </p>
                  <p className="font-medium">{mesReferencia || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#5F544F] font-semibold">
                    Serviços
                  </p>
                  <p className="font-medium">
                    {itens.filter((it) => it.nome.trim()).length || '—'}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E9E1D2] flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#5F544F] font-semibold">
                    Total geral
                  </p>
                  <p className="text-2xl font-bold text-[#6A402D]">
                    R$ {formatarMoedaBRL(totalGeral)}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    className="bg-[#8C6527] hover:bg-[#6A402D] text-white"
                    onClick={() => salvar(status)}
                    disabled={salvando}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {salvando ? 'Salvando…' : programa ? 'Salvar alterações' : 'Salvar rascunho'}
                  </Button>
                  <Button
                    className="bg-[#6A402D] hover:bg-[#4A322A] text-white"
                    onClick={() => {
                      setStatus('finalizada')
                      salvar('finalizada')
                    }}
                    disabled={salvando}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Finalizar proposta
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                    onClick={baixarPdf}
                    disabled={gerandoPdf}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {gerandoPdf ? 'Gerando PDF…' : 'Baixar PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                    onClick={() => setDialogModeloAberto(true)}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Salvar como modelo
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                    onClick={imprimir}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Gerar Proposta (Imprimir)
                  </Button>
                  <Button variant="ghost" onClick={onCancelar}>
                    Voltar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#6A402D]">1. Paciente e Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pacienteSelecionado ? (
                <div
                  className="p-4 rounded-lg flex items-start justify-between gap-3"
                  style={{ backgroundColor: '#F7F3EB', border: '1px solid #E9E1D2' }}
                >
                  <div>
                    <p className="font-semibold text-[#6A402D]">{pacienteSelecionado.nome}</p>
                    <p className="text-sm text-[#5F544F]">
                      {pacienteSelecionado.cpf
                        ? `CPF: ${formatCPF(pacienteSelecionado.cpf)}`
                        : 'CPF: —'}
                      {' • '}
                      {pacienteSelecionado.telefone || 'Telefone: —'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPacienteSelecionado(null)}>
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Label htmlFor="busca-paciente">Buscar paciente existente</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F544F]" />
                    <Input
                      id="busca-paciente"
                      placeholder="Digite o nome ou CPF do paciente…"
                      value={buscaPaciente}
                      onChange={(e) => {
                        setBuscaPaciente(e.target.value)
                        setDropdownAberto(true)
                      }}
                      onFocus={() => setDropdownAberto(true)}
                      className="pl-9"
                    />
                  </div>
                  {dropdownAberto && pacientesFiltrados.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#E9E1D2] bg-white shadow-lg max-h-60 overflow-y-auto">
                      {pacientesFiltrados.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F7F3EB] transition-colors"
                          onClick={() => {
                            setPacienteSelecionado(p)
                            setDropdownAberto(false)
                            setBuscaPaciente('')
                          }}
                        >
                          <span className="font-medium text-[#33221C]">{p.nome}</span>
                          {p.cpf && (
                            <span className="text-[#5F544F] text-xs ml-2 font-mono">
                              {formatCPF(p.cpf)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Escolher modelo salvo */}
              {modelos.length > 0 && (
                <div
                  className="p-4 rounded-lg space-y-3"
                  style={{ backgroundColor: '#FAF6F0', border: '1px dashed #C9A46A' }}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-[#8C6527]" />
                    <p className="text-sm font-semibold text-[#6A402D]">Escolher modelo salvo</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {modelos.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={aplicandoModelo === m.id}
                        onClick={() => aplicarModelo(m)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#E9E1D2] bg-white text-[#5F544F] hover:bg-[#F7F3EB] hover:text-[#6A402D] transition-colors disabled:opacity-60"
                        title="Aplica itens, textos e capa do modelo — troque só o paciente depois"
                      >
                        {aplicandoModelo === m.id
                          ? 'Aplicando…'
                          : m.modelo_nome || m.titulo || 'Modelo'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#8A7A6E]">
                    Aplicar um modelo copia serviços, textos e ajustes da capa. A foto não é copiada
                    — envie-a novamente para a proposta nova. Depois troque apenas o paciente.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="titulo-programa">Título do programa</Label>
                <Input
                  id="titulo-programa"
                  placeholder="Ex.: Programa de Reabilitação de Joelho — 12 semanas"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="data-inicio">Início</Label>
                  <Input
                    id="data-inicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="data-fim">Fim</Label>
                  <Input
                    id="data-fim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duracao">Duração (semanas)</Label>
                  <Input
                    id="duracao"
                    type="number"
                    min={0}
                    value={duracaoSemanas || ''}
                    onChange={(e) => setDuracaoSemanas(Number(e.target.value) || 0)}
                    placeholder="Ex.: 12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itens de serviço */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#6A402D]">2. Serviços do Programa</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#8C6527] hover:bg-[#F7F3EB]"
                  onClick={() => {
                    setItens(exemploItensRehab().map((it) => ({ ...it })))
                    toast({
                      title: 'Exemplo carregado',
                      description:
                        'Itens do exemplo SOUL REHAB inseridos como ponto de partida — ajuste ou remova antes de salvar.',
                    })
                  }}
                  title="Preencher com o exemplo SOUL REHAB (ajuste antes de salvar)"
                >
                  <Layers className="h-4 w-4 mr-1" /> Começar do exemplo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={adicionarItem}
                  className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar serviço
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {itens.map((item, idx) => {
                const sugestoes = servicosConhecidos
                  .filter(
                    (s) =>
                      s.toLowerCase().includes((item.nome || '').toLowerCase()) &&
                      s.toLowerCase() !== (item.nome || '').toLowerCase(),
                  )
                  .slice(0, 4)
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg space-y-3"
                    style={{ backgroundColor: '#F7F3EB', border: '1px solid #E9E1D2' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#6A402D]">
                        Serviço {idx + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(idx)}
                        disabled={itens.length <= 1}
                        className="text-[#B86545] hover:text-red-600 hover:bg-red-50"
                        title="Remover serviço"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nome do serviço</Label>
                      <Input
                        placeholder="Ex.: Sessão de Fisioterapia"
                        value={item.nome}
                        onChange={(e) => atualizarItem(idx, 'nome', e.target.value)}
                        list={`sugestoes-servico-${idx}`}
                      />
                      <datalist id={`sugestoes-servico-${idx}`}>
                        {sugestoes.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                      {sugestoes.length > 0 && item.nome.trim().length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {sugestoes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => atualizarItem(idx, 'nome', s)}
                              className="text-xs px-2 py-0.5 rounded-full border border-[#E9E1D2] bg-white text-[#5F544F] hover:bg-[#F7F3EB] hover:text-[#6A402D] transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantidade || ''}
                          onChange={(e) =>
                            atualizarItem(idx, 'quantidade', Number(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Valor unitário (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.valorUnitario || ''}
                          onChange={(e) =>
                            atualizarItem(idx, 'valorUnitario', Number(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tipo de desconto</Label>
                        <Select
                          value={item.tipoDesconto}
                          onValueChange={(v) => atualizarItem(idx, 'tipoDesconto', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nenhum">Sem desconto</SelectItem>
                            <SelectItem value="percentual">Percentual (%)</SelectItem>
                            <SelectItem value="valor">Valor (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Desconto</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          disabled={item.tipoDesconto === 'nenhum'}
                          value={item.desconto || ''}
                          onChange={(e) =>
                            atualizarItem(idx, 'desconto', Number(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                    <p className="text-right text-sm font-semibold text-[#6A402D]">
                      Subtotal: R$ {formatarMoedaBRL(calcularSubtotalItem(item))}
                    </p>
                  </div>
                )
              })}

              {/* Desconto geral */}
              <div
                className="p-4 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                style={{ backgroundColor: '#F7F3EB', border: '1px solid #E9E1D2' }}
              >
                <div className="space-y-1.5">
                  <Label>Desconto geral</Label>
                  <Select value={descTipo} onValueChange={(v) => setDescTipo(v as typeof descTipo)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Sem desconto geral</SelectItem>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="valor">Valor (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor do desconto</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={descTipo === 'nenhum'}
                    value={descValor || ''}
                    onChange={(e) => setDescValor(Number(e.target.value) || 0)}
                  />
                </div>
                <p className="text-right text-sm text-[#5F544F] sm:col-span-1">
                  Subtotal dos serviços:{' '}
                  <strong className="text-[#33221C]">R$ {formatarMoedaBRL(somaSubtotais)}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Textos livres da proposta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#6A402D]">3. Textos da Proposta</CardTitle>
              <p className="text-sm text-[#5F544F]">
                Escreva livremente cada seção — só o que for preenchido aparece no documento.
              </p>
            </CardHeader>
            <CardContent>
              <PainelTextosProposta
                mesReferencia={mesReferencia}
                textoApresentacao={textoApresentacao}
                textoIntroducao={textoIntroducao}
                condicoesPagamento={condicoesPagamento}
                observacoes={observacoes}
                onChange={(campo, valor) => {
                  if (campo === 'mesReferencia') setMesReferencia(valor)
                  else if (campo === 'textoApresentacao') setTextoApresentacao(valor)
                  else if (campo === 'textoIntroducao') setTextoIntroducao(valor)
                  else if (campo === 'condicoesPagamento') setCondicoesPagamento(valor)
                  else setObservacoes(valor)
                }}
              />
            </CardContent>
          </Card>

          {/* Capa da proposta: foto + ajustes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#6A402D]">4. Capa da Proposta (Foto)</CardTitle>
              <p className="text-sm text-[#5F544F]">
                Envie a foto da capa e ajuste posição, zoom e intensidade — a prévia ao lado
                acompanha em tempo real.
              </p>
            </CardHeader>
            <CardContent>
              <PainelCapaProposta
                capaFotoPreview={capaFotoPreview}
                onSelecionarArquivo={selecionarCapaFoto}
                onRemoverFoto={removerCapaFotoAgora}
                capaConfig={capaConfig}
                onCapaConfigChange={setCapaConfig}
              />
            </CardContent>
          </Card>

          {/* Página 2 da proposta: planos Basic / Otimizado / Personalizado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#6A402D]">5. Planos da Página 2</CardTitle>
              <p className="text-sm text-[#5F544F]">
                Frase do paciente na capa e os três planos com itens, ícones, parcelas e foto por
                plano — a prévia ao lado acompanha em tempo real.
              </p>
            </CardHeader>
            <CardContent>
              <PainelPlanosProposta
                frasePaciente={frasePaciente}
                onFraseChange={setFrasePaciente}
                planos={planos}
                onPlanoChange={aoMudarPlano}
                onFotoPlanoArquivo={aoFotoPlanoArquivo}
                propsCab={propsCab}
                propsPagina={propsPagina}
                propsRodape={propsRodape}
                onPropsChange={(campo, valor) => {
                  if (campo === 'props_cab') setPropsCab(valor)
                  else if (campo === 'props_pagina') setPropsPagina(valor)
                  else setPropsRodape(valor)
                }}
                programaId={programa?.id || null}
                onFotosNovasChange={aoFotosNovas}
              />
            </CardContent>
          </Card>

          {/* Condições */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#6A402D]">6. Condições (campo antigo)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex.: Pagamento em até 3x sem juros. Proposta válida por 15 dias."
                rows={4}
                value={condicoes}
                onChange={(e) => setCondicoes(e.target.value)}
              />
              <p className="text-xs text-[#8A7A6E] mt-2">
                Se "Condições de pagamento" (seção Textos da Proposta) estiver preenchido, ele é
                usado no documento; este campo serve de compatibilidade com propostas antigas.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita: prévia fixa do documento (reage em tempo real) */}
        <div className="xl:sticky xl:top-6 self-start min-w-0">
          <Card style={{ borderTop: '3px solid #C9A46A' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="text-[#6A402D]">Prévia da Proposta</CardTitle>
              <p className="text-sm text-[#5F544F]">
                Documento A4 no padrão SOUL — reage em tempo real a serviços, foto, sliders e
                textos.
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-auto rounded-md border border-[#E9E1D2] bg-[#F7F3EB]"
                style={{ maxHeight: 'calc(100vh - 10rem)' }}
              >
                <div
                  style={{
                    width: 794,
                    transform: `scale(${ESCALA_PREVIA})`,
                    transformOrigin: 'top left',
                    marginBottom: -(ALTURA_LAYOUT_PREVIA * (1 - ESCALA_PREVIA)),
                  }}
                >
                  <DocumentoPropostaTratamento programa={registroPrevia} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Telas estreitas: prévia acessível por botão flutuante */}
      <button
        type="button"
        onClick={() => setDialogPreviaAberto(true)}
        className="xl:hidden fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-[#6A402D] hover:bg-[#4A322A] text-white px-4 py-3 flex items-center gap-2 text-sm font-medium"
      >
        <Eye className="h-4 w-4" />
        Ver prévia
      </button>

      <Dialog open={dialogPreviaAberto} onOpenChange={setDialogPreviaAberto}>
        <DialogContent className="max-w-[860px]">
          <DialogHeader>
            <DialogTitle className="text-[#6A402D]">Prévia da Proposta</DialogTitle>
            <DialogDescription>
              Documento A4 no padrão SOUL — atualizado com o que está no editor.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[65vh] rounded-md border border-[#E9E1D2] bg-[#F7F3EB]">
            <div
              style={{
                width: 794,
                transform: `scale(${ESCALA_PREVIA_DIALOGO})`,
                transformOrigin: 'top left',
                marginBottom: -(ALTURA_LAYOUT_PREVIA * (1 - ESCALA_PREVIA_DIALOGO)),
              }}
            >
              <DocumentoPropostaTratamento programa={registroPrevia} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: salvar como modelo */}
      <Dialog open={dialogModeloAberto} onOpenChange={setDialogModeloAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como modelo</DialogTitle>
            <DialogDescription>
              A montagem atual (serviços, textos e ajustes da capa) fica guardada como modelo
              reutilizável. Na próxima proposta, escolha o modelo e troque apenas o paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="nome-modelo">Nome do modelo</Label>
            <Input
              id="nome-modelo"
              placeholder="Ex.: SOUL REHAB Ombro — 8 semanas"
              value={nomeModelo}
              onChange={(e) => setNomeModelo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogModeloAberto(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-[#8C6527] hover:bg-[#6A402D] text-white"
              onClick={salvarComoModelo}
              disabled={salvandoModelo}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              {salvandoModelo ? 'Salvando…' : 'Salvar modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sobreposição de impressão A4 — mesma mecânica dos prontuários */}
      {imprimindo &&
        createPortal(
          <div id="container-impressao-prontuario-soul">
            <DocumentoPropostaTratamento programa={registroPrevia} />
          </div>,
          document.body,
        )}
    </div>
  )
}

interface PropsHistorico {
  pacienteId: string
  onEditar: (registro: ProgramaTratamentoRecord) => void
  onNovo: () => void
}

/** Histórico de propostas do paciente (reabrir, editar e reimprimir) */
const HistoricoProgramas: React.FC<PropsHistorico> = ({ pacienteId, onEditar, onNovo }) => {
  const { toast } = useToast()
  const [programas, setProgramas] = useState<ProgramaTratamentoRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<ProgramaTratamentoRecord | null>(null)
  const [imprimindo, setImprimindo] = useState<ProgramaTratamentoRecord | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await listarProgramasTratamentoPorPaciente(pacienteId)
      setProgramas(lista)
    } catch (err) {
      console.error('Erro ao carregar programas de tratamento:', err)
      toast({
        title: 'Erro ao carregar histórico',
        description: 'Não foi possível carregar os programas de tratamento deste paciente.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const excluir = async () => {
    if (!confirmarExclusao) return
    setExcluindo(confirmarExclusao.id)
    try {
      await deleteProgramaTratamento(confirmarExclusao.id)
      toast({ title: 'Programa excluído', description: 'O registro foi removido do histórico.' })
      setConfirmarExclusao(null)
      carregar()
    } catch (err: any) {
      console.error('Erro ao excluir programa:', err)
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível excluir o programa.',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(null)
    }
  }

  const reimprimir = useCallback((registro: ProgramaTratamentoRecord) => {
    setImprimindo(registro)
    const depois = () => setTimeout(() => setImprimindo(null), 400)
    window.addEventListener('afterprint', depois, { once: true })
    window.print()
    setTimeout(() => setImprimindo(null), 1500)
  }, [])

  if (carregando) {
    return <p className="text-center text-[#5F544F] py-10">Carregando histórico…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#6A402D] flex items-center gap-2">
          <History className="h-5 w-5" /> Histórico de Propostas do Paciente
        </h2>
        <Button className="bg-[#8C6527] hover:bg-[#6A402D] text-white" onClick={onNovo}>
          <Plus className="h-4 w-4 mr-2" /> Novo Programa
        </Button>
      </div>

      {programas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-[#5F544F]">
            Nenhum programa de tratamento registrado para este paciente ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {programas.map((prog) => (
            <Card key={prog.id} className="border-[#E9E1D2]">
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#33221C]">{prog.titulo}</p>
                    <Badge
                      className={
                        prog.status === 'finalizada'
                          ? 'bg-[#4A6741] text-white'
                          : 'bg-[#C9A46A] text-[#33221C]'
                      }
                    >
                      {prog.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
                    </Badge>
                    {prog.is_modelo && (
                      <Badge className="bg-[#F3E8D8] text-[#8C6527]">Modelo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#5F544F] mt-0.5">
                    {prog.data_inicio
                      ? `${formatDataPTBR(prog.data_inicio)}${
                          prog.data_fim ? ` a ${formatDataPTBR(prog.data_fim)}` : ''
                        }`
                      : 'Período: —'}
                    {prog.duracao_semanas ? ` • ${prog.duracao_semanas} semanas` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-[#6A402D] whitespace-nowrap">
                    R$ {formatarMoedaBRL(prog.valor_total)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                    onClick={() => reimprimir(prog)}
                  >
                    <Printer className="h-4 w-4 mr-1" /> Proposta
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditar(prog)}
                    className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#B86545] hover:text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmarExclusao(prog)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmação de exclusão */}
      <Dialog
        open={!!confirmarExclusao}
        onOpenChange={(open) => !open && setConfirmarExclusao(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir programa?</DialogTitle>
            <DialogDescription>
              O programa "{confirmarExclusao?.titulo}" será removido do histórico do paciente. Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmarExclusao(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={excluir}
              disabled={excluindo === confirmarExclusao?.id}
            >
              {excluindo === confirmarExclusao?.id ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sobreposição de impressão A4 para reemissão */}
      {imprimindo &&
        createPortal(
          <div id="container-impressao-prontuario-soul">
            <DocumentoPropostaTratamento programa={imprimindo} />
          </div>,
          document.body,
        )}
    </div>
  )
}

/**
 * Ferramenta admin "Montar Programa de Tratamento".
 * Rota /programas-tratamento (somente admin): lista de propostas por paciente,
 * montagem com cálculo automático e impressão A4 institucional SOUL.
 */
export const ProgramaTratamento: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [pacienteId, setPacienteId] = useState<string>(searchParams.get('paciente') || '')
  const [programaEdicao, setProgramaEdicao] = useState<ProgramaTratamentoRecord | null>(null)
  const [modo, setModo] = useState<'selecao' | 'form'>('selecao')
  const [carregandoPrograma, setCarregandoPrograma] = useState(false)

  // Modo direto por rota: /programas-tratamento/:id (editar ou novo para paciente)
  useEffect(() => {
    let ativo = true
    if (!id) return
    ;(async () => {
      if (id === 'novo') {
        setModo('form')
        return
      }
      setCarregandoPrograma(true)
      try {
        const registro = await getProgramaTratamento(id)
        if (!ativo) return
        setProgramaEdicao(registro)
        setPacienteId(registro.paciente_id)
        setModo('form')
      } catch (err) {
        console.error('Erro ao carregar programa:', err)
      } finally {
        if (ativo) setCarregandoPrograma(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [id])

  const aoSalvo = (registro: ProgramaTratamentoRecord) => {
    setProgramaEdicao(registro)
    navigate(`/programas-tratamento/${registro.id}`, { replace: true })
  }

  if (carregandoPrograma) {
    return <p className="text-center text-[#5F544F] py-10">Carregando programa…</p>
  }

  if (modo === 'form') {
    return (
      <FormularioPrograma
        pacienteId={pacienteId}
        programa={programaEdicao}
        onSalvo={aoSalvo}
        onCancelar={() => {
          setModo('selecao')
          setProgramaEdicao(null)
          setPacienteId('')
          navigate('/programas-tratamento', { replace: true })
        }}
      />
    )
  }

  return (
    <SelecaoPaciente
      onSelecionado={(pid) => {
        setPacienteId(pid)
        setProgramaEdicao(null)
        setModo('form')
      }}
    />
  )
}

interface PropsSelecao {
  onSelecionado: (pacienteId: string) => void
}

/** Etapa inicial: escolher o paciente a partir da lista existente */
const SelecaoPaciente: React.FC<PropsSelecao> = ({ onSelecionado }) => {
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        const resposta = await getPacientes()
        if (ativo) setPacientes(resposta.items || [])
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err)
      } finally {
        if (ativo) setCarregando(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return pacientes.slice(0, 30)
    return pacientes
      .filter(
        (p) =>
          (p.nome || '').toLowerCase().includes(termo) ||
          (p.cpf || '').includes(termo.replace(/\D/g, '')),
      )
      .slice(0, 30)
  }, [busca, pacientes])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#6A402D]">Montar Programa de Tratamento</CardTitle>
          <p className="text-sm text-[#5F544F]">
            Selecione o paciente para montar a proposta comercial do programa — serviços,
            quantidades, valores e descontos com total calculado automaticamente, capa com foto
            ajustável, textos livres e proposta A4 no modelo institucional SOUL.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F544F]" />
            <Input
              placeholder="Buscar paciente por nome ou CPF…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          {carregando ? (
            <p className="text-center text-[#5F544F] py-6">Carregando pacientes…</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-[#5F544F] py-6">
              Nenhum paciente encontrado com esse critério.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filtrados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelecionado(p.id)}
                  className="text-left p-3 rounded-lg border border-[#E9E1D2] bg-white hover:bg-[#F7F3EB] hover:border-[#C9A46A] transition-colors"
                >
                  <p className="font-medium text-[#33221C]">{p.nome}</p>
                  <p className="text-xs text-[#5F544F]">
                    {p.cpf ? `CPF: ${formatCPF(p.cpf)}` : 'CPF: —'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProgramaTratamento
