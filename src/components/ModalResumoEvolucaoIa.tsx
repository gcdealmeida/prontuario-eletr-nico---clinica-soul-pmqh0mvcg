import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Printer,
  Copy,
  RotateCcw,
  Check,
  History,
  FileText,
  Loader2,
  User,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  Edit3,
  Calendar,
  Activity,
  TrendingDown,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  gerarRelatorioIa,
  getRelatoriosByPaciente,
  updateRelatorioIa,
  type GerarRelatorioIaResponse,
} from '@/services/relatoriosIa'
import { getEvolucoesByPaciente } from '@/services/evolucoes'
import { getAvaliacoesByPaciente } from '@/services/avaliacoes'
import type { Especialidade, RelatorioIaRecord, EvolucaoRecord } from '@/types/database'
import { LogoSOUL } from '@/components/LogoSOUL'
import { createPortal } from 'react-dom'
import { formatDataHoraPTBR, formatDataPTBR } from '@/lib/constants'
import { normalizarConteudoRelatorio, normalizarParaTextoPuro } from '@/lib/normalizadorRelatorioIa'

interface ModalResumoEvolucaoIaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pacienteId: string
  pacienteNome: string
  pacienteCpf?: string
  avaliacaoId: string
  especialidade: Especialidade | 'Geral'
  dadosProntuario: Record<string, unknown>
  profissionalResponsavel?: string
}

function calcularIdade(dataNascStr?: string): string {
  if (!dataNascStr) return ''
  try {
    const hoje = new Date()
    const nasc = new Date(dataNascStr)
    if (isNaN(nasc.getTime())) return ''
    let anos = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      anos--
    }
    return anos >= 0 ? `${anos} anos` : ''
  } catch {
    return ''
  }
}

function formatarDataVinhedoExtenso(dataStr?: string): string {
  try {
    const data = dataStr ? new Date(dataStr) : new Date()
    if (isNaN(data.getTime())) {
      const hoje = new Date()
      const dia = hoje.getDate()
      const meses = [
        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
      ]
      return `Vinhedo, ${dia} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}.`
    }
    const dia = data.getDate()
    const meses = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ]
    return `Vinhedo, ${dia} de ${meses[data.getMonth()]} de ${data.getFullYear()}.`
  } catch {
    return 'Vinhedo, Clínica SOUL.'
  }
}

function RenderizadorMarkdownInstitucional({ conteudo }: { conteudo: string }) {
  if (!conteudo) return null
  const textoNormalizado = normalizarConteudoRelatorio(conteudo)
  const linhas = textoNormalizado.split('\n')
  const blocos: { tipo: 'header' | 'sub' | 'bullet' | 'p' | 'empty'; texto: string }[] = []

  for (let i = 0; i < linhas.length; i++) {
    const raw = linhas[i].trim()
    if (!raw) {
      blocos.push({ tipo: 'empty', texto: '' })
      continue
    }

    // Títulos das seções numeradas (1 a 6)
    const matchSecaoNumerada = raw.match(
      /^(?:#+\s*|\*\*)?(\d\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ/\s-]+)(?:\*\*)?:?$/i,
    )
    if (matchSecaoNumerada) {
      blocos.push({ tipo: 'header', texto: matchSecaoNumerada[1].replace(/\*\*/g, '').trim() })
      continue
    }

    if (raw.startsWith('###') || raw.startsWith('##') || raw.startsWith('#')) {
      blocos.push({
        tipo: 'sub',
        texto: raw
          .replace(/^#+\s*/, '')
          .replace(/\*\*/g, '')
          .trim(),
      })
      continue
    }

    if (raw.startsWith('• ') || raw.startsWith('- ') || raw.startsWith('* ')) {
      blocos.push({
        tipo: 'bullet',
        texto: raw.replace(/^[•\-*]\s+/, '').trim(),
      })
      continue
    }

    blocos.push({ tipo: 'p', texto: raw })
  }

  return (
    <div className="space-y-3.5 font-montserrat text-[#1F1B18] text-[10pt] sm:text-[10.5pt] leading-relaxed">
      {blocos.map((bloco, idx) => {
        if (bloco.tipo === 'header') {
          return (
            <div
              key={idx}
              className="pt-5 first:pt-0 pb-1 border-b border-[#D5AE6F]/40 page-break-inside-avoid"
            >
              <h3
                className="font-soul font-bold text-[13pt] sm:text-[14pt] tracking-wide text-[#6A402D]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {bloco.texto}
              </h3>
            </div>
          )
        }
        if (bloco.tipo === 'sub') {
          return (
            <h4
              key={idx}
              className="font-montserrat font-bold text-[10pt] uppercase tracking-wide text-[#B86545] pt-2"
            >
              {bloco.texto}
            </h4>
          )
        }
        if (bloco.tipo === 'bullet') {
          const partes = bloco.texto.split(/(\*\*[^*]+\*\*)/g)
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#D5AE6F] font-bold select-none leading-relaxed">•</span>
              <p className="leading-relaxed text-[#1F1B18] flex-1">
                {partes.map((p, pIdx) => {
                  if (p.startsWith('**') && p.endsWith('**')) {
                    return (
                      <strong key={pIdx} className="font-semibold text-[#6A402D]">
                        {p.slice(2, -2)}
                      </strong>
                    )
                  }
                  return <span key={pIdx}>{p}</span>
                })}
              </p>
            </div>
          )
        }
        if (bloco.tipo === 'p') {
          const partes = bloco.texto.split(/(\*\*[^*]+\*\*)/g)
          return (
            <p key={idx} className="leading-relaxed text-[#1F1B18] whitespace-pre-wrap">
              {partes.map((p, pIdx) => {
                if (p.startsWith('**') && p.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-semibold text-[#6A402D]">
                      {p.slice(2, -2)}
                    </strong>
                  )
                }
                return <span key={pIdx}>{p}</span>
              })}
            </p>
          )
        }
        return null
      })}
    </div>
  )
}

export function ModalResumoEvolucaoIa({
  open,
  onOpenChange,
  pacienteId,
  pacienteNome,
  pacienteCpf,
  avaliacaoId,
  especialidade,
  dadosProntuario,
  profissionalResponsavel,
}: ModalResumoEvolucaoIaProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [abaInterna, setAbaInterna] = useState<'gerador' | 'historico'>('gerador')
  const [modoVisualizacao, setModoVisualizacao] = useState<'modelo' | 'edicao'>('modelo')
  const [focoPersonalizado, setFocoPersonalizado] = useState('')
  const [titulo, setTitulo] = useState('RESUMO DE EVOLUÇÃO CLÍNICA')
  const [subtitulo, setSubtitulo] = useState('Síntese Longitudinal Multidisciplinar com IA')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)
  const [relatorioAtual, setRelatorioAtual] = useState<GerarRelatorioIaResponse | null>(null)
  const [conteudoEditavel, setConteudoEditavel] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Estatísticas do histórico do paciente para alimentar e informar
  const [totalEvolucoes, setTotalEvolucoes] = useState<number | null>(null)
  const [totalAvaliacoes, setTotalAvaliacoes] = useState<number | null>(null)
  const [dataPrimeiraSessao, setDataPrimeiraSessao] = useState<string | null>(null)
  const [dataUltimaSessao, setDataUltimaSessao] = useState<string | null>(null)
  const [evaInicial, setEvaInicial] = useState<number | null>(null)
  const [evaAtual, setEvaAtual] = useState<number | null>(null)

  // Histórico salvo
  const [historicoResumos, setHistoricoResumos] = useState<RelatorioIaRecord[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  // Carregar dados longitudinais do paciente (todas as evoluções e avaliações)
  const carregarDadosLongitudinais = async () => {
    if (!pacienteId) return
    try {
      const [todasEv, avaliacoesMap, todosRelatorios] = await Promise.all([
        getEvolucoesByPaciente(pacienteId),
        getAvaliacoesByPaciente(pacienteId),
        getRelatoriosByPaciente(pacienteId),
      ])

      const totalAvs =
        (avaliacoesMap.fisio?.length || 0) +
        (avaliacoesMap.personal?.length || 0) +
        (avaliacoesMap.nutri?.length || 0) +
        (avaliacoesMap.medico?.length || 0)

      setTotalEvolucoes(todasEv.length)
      setTotalAvaliacoes(totalAvs)

      // Filtrar histórico apenas de resumos de evolução
      const resumos = todosRelatorios.filter(
        (r) =>
          r.tipo_relatorio === 'Resumo de Evolução' ||
          (r.titulo && r.titulo.toLowerCase().includes('resumo de evolu')),
      )
      setHistoricoResumos(resumos)

      // Identificar datas cronológicas e trajetórias de EVA
      if (todasEv.length > 0) {
        // Ordenar cronologicamente
        const evOrdenadas = [...todasEv].sort((a, b) => {
          const tA = new Date(a.data_evolucao || a.created).getTime()
          const tB = new Date(b.data_evolucao || b.created).getTime()
          return tA - tB
        })
        const primeira = evOrdenadas[0]
        const ultima = evOrdenadas[evOrdenadas.length - 1]
        setDataPrimeiraSessao(primeira.data_evolucao || primeira.created)
        setDataUltimaSessao(ultima.data_evolucao || ultima.created)

        const evComEva = evOrdenadas.filter((e) => typeof e.eva_dor === 'number')
        if (evComEva.length > 0) {
          setEvaInicial(evComEva[0].eva_dor ?? null)
          setEvaAtual(evComEva[evComEva.length - 1].eva_dor ?? null)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados longitudinais do paciente:', err)
    }
  }

  useEffect(() => {
    if (open) {
      carregarDadosLongitudinais()
    }
  }, [open, pacienteId])

  const handleGerarResumo = async () => {
    setGerando(true)
    setErroGeracao(null)
    try {
      // 1. Carrega todas as avaliações e evoluções em formato enxuto para o LLM
      const [todasEv, avaliacoesMap] = await Promise.all([
        getEvolucoesByPaciente(pacienteId),
        getAvaliacoesByPaciente(pacienteId),
      ])

      const evolucoesCruas = todasEv
        .sort(
          (a, b) =>
            new Date(a.data_evolucao || a.created).getTime() -
            new Date(b.data_evolucao || b.created).getTime(),
        )
        .map((ev) => ({
          data: formatDataPTBR(ev.data_evolucao || ev.created),
          especialidade: ev.especialidade,
          profissional: ev.assinado_por_nome || ev.profissional,
          subjetivo: ev.subjetivo,
          eva_dor: ev.eva_dor,
          objetivo: ev.objetivo,
          avaliacao: ev.avaliacao_clinica,
          conduta: ev.conduta_procedimentos,
          plano: ev.plano,
          numero: ev.numero_registro,
        }))

      const listaTodasAv = [
        ...(avaliacoesMap.fisio || []).map((a) => ({ ...a, esp: 'Fisioterapia' })),
        ...(avaliacoesMap.personal || []).map((a) => ({ ...a, esp: 'Personal' })),
        ...(avaliacoesMap.nutri || []).map((a) => ({ ...a, esp: 'Nutrição' })),
        ...(avaliacoesMap.medico || []).map((a) => ({ ...a, esp: 'Médico' })),
      ]

      const avaliacoesCruas = listaTodasAv.map((av: any) => ({
        data: formatDataPTBR(av.data_avaliacao || av.created),
        especialidade: av.especialidade || av.esp,
        queixa_principal: av.queixa_principal || av.objetivo_principal,
        diagnostico_medico: av.diagnostico_medico,
        diagnostico_disfuncional:
          av.diagnostico_disfuncional || av.diagnostico_fisioterapeutico || av.hipotese_diagnostica,
        objetivo: av.objetivos_tratamento || av.objetivo_principal,
      }))

      const necessidadeFinal = focoPersonalizado.trim()
        ? `Resumo longitudinal de síntese de todas as avaliações e evoluções do paciente com IA da Clínica SOUL. Foco adicional do profissional: ${focoPersonalizado.trim()}`
        : 'Gerar resumo longitudinal de síntese de todas as avaliações e evoluções do paciente com IA da Clínica SOUL, destacando queixas tratadas, data de início, incidência de lesões, evolução funcional/dor e saúde geral.'

      const tituloFinal = subtitulo.trim()
        ? `${titulo.trim()} — ${subtitulo.trim()}`
        : titulo.trim()

      const res = await gerarRelatorioIa({
        paciente_id: pacienteId,
        avaliacao_id: avaliacaoId,
        especialidade,
        tipo_relatorio: 'Resumo de Evolução',
        necessidade: necessidadeFinal,
        titulo: tituloFinal || 'RESUMO DE EVOLUÇÃO CLÍNICA',
        publico_alvo: publicoAlvo.trim() || 'Equipe Multidisciplinar / Médico / Paciente',
        dados_prontuario: dadosProntuario,
        historico_evolucoes: evolucoesCruas,
        historico_avaliacoes: avaliacoesCruas,
      })

      const conteudoLimpo = normalizarConteudoRelatorio(res.conteudo)
      setRelatorioAtual({
        ...res,
        conteudo: conteudoLimpo,
      })
      setConteudoEditavel(conteudoLimpo)
      setModoVisualizacao('modelo')

      toast({
        title: '✨ Resumo de Evolução gerado pela IA!',
        description:
          res.aviso ||
          'Síntese longitudinal de todas as sessões e avaliações pronta no Modelo Institucional.',
      })

      // Recarrega histórico
      carregarDadosLongitudinais()
    } catch (err: any) {
      console.error('Erro ao gerar resumo de evolução com IA:', err)
      const msgErro =
        err?.message ||
        'Falha ao gerar o resumo com IA. Tente novamente — seus dados e prontuário continuam 100% seguros.'
      setErroGeracao(msgErro)
      toast({
        title: 'Falha ao sintetizar evolução',
        description: 'Tente novamente — sua avaliação e prontuário estão salvos e intactos.',
        variant: 'destructive',
      })
    } finally {
      setGerando(false)
    }
  }

  const handleCopiar = async () => {
    if (!conteudoEditavel) return
    try {
      const textoParaCopiar = normalizarParaTextoPuro(conteudoEditavel)
      await navigator.clipboard.writeText(textoParaCopiar)
      setCopiado(true)
      toast({
        title: 'Copiado para a área de transferência!',
        description: 'Texto limpo pronto para WhatsApp, e-mail ou prontuário.',
      })
      setTimeout(() => setCopiado(false), 2500)
    } catch (_) {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione o texto manualmente para copiar.',
        variant: 'destructive',
      })
    }
  }

  const handleSalvarAjustes = async () => {
    if (!relatorioAtual?.id || !conteudoEditavel) return
    setSalvandoEdicao(true)
    try {
      const tituloFinal = subtitulo.trim()
        ? `${titulo.trim()} — ${subtitulo.trim()}`
        : titulo.trim()
      await updateRelatorioIa(relatorioAtual.id, {
        titulo: tituloFinal,
        conteudo: conteudoEditavel,
      })
      toast({
        title: 'Ajustes salvos no Resumo de Evolução!',
        description: 'O histórico foi atualizado com a sua edição.',
      })
      carregarDadosLongitudinais()
    } catch (err: any) {
      toast({
        title: 'Não foi possível salvar as alterações',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const handleSelecionarDoHistorico = (item: RelatorioIaRecord) => {
    const conteudoLimpo = normalizarConteudoRelatorio(item.conteudo)
    setRelatorioAtual({
      id: item.id,
      paciente_id: item.paciente_id,
      avaliacao_id: item.avaliacao_id,
      especialidade: item.especialidade,
      tipo_relatorio: item.tipo_relatorio,
      titulo: item.titulo,
      necessidade: item.necessidade,
      conteudo: conteudoLimpo,
      autor_id: item.autor_id,
      autor_nome: item.autor_nome || item.expand?.autor_id?.name || 'Profissional SOUL',
      created: item.created,
    })

    if (item.titulo.includes(' — ')) {
      const [t, ...sub] = item.titulo.split(' — ')
      setTitulo(t)
      setSubtitulo(sub.join(' — '))
    } else {
      setTitulo(item.titulo || 'RESUMO DE EVOLUÇÃO CLÍNICA')
      setSubtitulo('')
    }

    setPublicoAlvo(item.publico_alvo || '')
    setConteudoEditavel(conteudoLimpo)
    setModoVisualizacao('modelo')
    setAbaInterna('gerador')
    toast({
      title: 'Resumo de Evolução carregado',
      description: `Exibindo versão emitida em ${formatDataHoraPTBR(item.created)}.`,
    })
  }

  const handleImprimir = () => {
    document.body.classList.add('imprimindo-relatorio-ia')
    const cleanup = () => {
      document.body.classList.remove('imprimindo-relatorio-ia')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)

    setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          window.print()
        } finally {
          setTimeout(cleanup, 3000)
        }
      })
    }, 150)
  }

  const dataNascStr =
    (dadosProntuario?.data_nascimento as string) ||
    (dadosProntuario?.expand as any)?.paciente_id?.data_nascimento ||
    ''
  const idadeCalculada = calcularIdade(dataNascStr)

  const nomeProfissionalEmissor =
    relatorioAtual?.autor_nome ||
    user?.name ||
    profissionalResponsavel ||
    'Profissional Responsável SOUL'

  const registroProfissionalEmissor =
    (user as any)?.registro_profissional ||
    (dadosProntuario as any)?.registro_profissional ||
    `${especialidade} • Registro Profissional Ativo`

  const dataEmissaoFormatada = formatDataPTBR(relatorioAtual?.created || new Date().toISOString())

  return (
    <>
      {/* ======================================================================== */}
      {/* CONTAINER DEDICADO DE IMPRESSÃO A4 (renderizado direto no document.body) */}
      {/* ======================================================================== */}
      {typeof document !== 'undefined' &&
        document.body &&
        conteudoEditavel &&
        createPortal(
          <div
            id="container-impressao-relatorio-ia"
            className="bg-white text-[#1F1B18] p-0 m-0 w-full font-montserrat"
          >
            {/* CABEÇALHO OFICIAL: Logo SOUL no topo com respiro + linha dourada fina */}
            <header className="pt-2 pb-5 text-center space-y-3">
              <div className="flex justify-center items-center py-2">
                <LogoSOUL variant="full" size="md" theme="light" className="mx-auto" />
              </div>
              <div className="w-full h-[1px] my-2" style={{ backgroundColor: '#D5AE6F' }} />
            </header>

            {/* TÍTULO PRINCIPAL E SUBTÍTULO */}
            <div className="text-center space-y-1 mb-6">
              <h1
                className="font-soul font-semibold tracking-wide text-[#6A402D]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '22pt',
                  lineHeight: 1.2,
                }}
              >
                {titulo || 'RESUMO DE EVOLUÇÃO CLÍNICA'}
              </h1>
              {subtitulo && (
                <p className="font-montserrat italic text-[#B86545]" style={{ fontSize: '10.5pt' }}>
                  {subtitulo}
                </p>
              )}
              <div className="w-16 h-[1px] mx-auto mt-2" style={{ backgroundColor: '#D5AE6F' }} />
            </div>

            {/* BLOCO PACIENTE: Caixa bege claro (#F7F2EC) com borda suave (#E9E1D2) */}
            <div
              className="p-4 mb-6 rounded-lg text-[9.5pt] leading-relaxed page-break-inside-avoid"
              style={{
                backgroundColor: '#F7F2EC',
                border: '1px solid #E9E1D2',
              }}
            >
              <div className="font-montserrat font-bold text-[10pt] uppercase tracking-wider text-[#6A402D] mb-2 pb-1 border-b border-[#D5AE6F]/30">
                PACIENTE
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[#5F544F]">
                <div>
                  <strong className="text-[#6A402D]">Nome:</strong>{' '}
                  <span className="text-[#1F1B18] font-medium">
                    {pacienteNome.replace(/^CAMPO:\s*(?:Nome:\s*)?/i, '')}
                  </span>
                  {pacienteCpf && (
                    <span className="text-gray-500 font-mono text-[8.5pt]">
                      {' '}
                      (CPF: {pacienteCpf})
                    </span>
                  )}
                </div>
                <div>
                  <strong className="text-[#6A402D]">Data de nascimento:</strong>{' '}
                  <span className="text-[#1F1B18]">
                    {dataNascStr ? formatDataPTBR(dataNascStr) : '—'}
                  </span>
                  {idadeCalculada && (
                    <span>
                      {' '}
                      | <strong className="text-[#6A402D]">Idade:</strong> {idadeCalculada}
                    </span>
                  )}
                </div>
                <div>
                  <strong className="text-[#6A402D]">Data de emissão:</strong>{' '}
                  <span className="text-[#1F1B18]">{dataEmissaoFormatada}</span>
                  {dataPrimeiraSessao && (
                    <span className="text-gray-500 text-[8.5pt]">
                      {' '}
                      (Início: {formatDataPTBR(dataPrimeiraSessao)})
                    </span>
                  )}
                </div>
                <div>
                  <strong className="text-[#6A402D]">Profissional emissor:</strong>{' '}
                  <span className="text-[#1F1B18] font-medium">{nomeProfissionalEmissor}</span>
                  <span className="text-[8.5pt] text-gray-500 block sm:inline">
                    {' '}
                    ({registroProfissionalEmissor})
                  </span>
                </div>
              </div>
            </div>

            {/* CONTEÚDO DAS 6 SEÇÕES NUMERADAS NO MODELO OFICIAL */}
            <main className="space-y-4 mb-10 text-[10pt] leading-relaxed">
              <RenderizadorMarkdownInstitucional conteudo={conteudoEditavel} />
            </main>

            {/* BLOCO DE ASSINATURA INSTITUCIONAL COM CIDADE VINHEDO */}
            <section className="pt-8 mt-8 text-left page-break-inside-avoid space-y-1 max-w-sm">
              <div className="w-64 border-b border-[#6A402D] mb-3" />
              <p className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
                {nomeProfissionalEmissor}
              </p>
              <p className="font-montserrat text-[9pt] text-[#5F544F]">
                {registroProfissionalEmissor}
              </p>
              <p className="font-montserrat font-semibold text-[9pt] text-[#6A402D]">
                Clínica SOUL — Saúde e Bem Estar
              </p>
              <p className="font-montserrat text-[9pt] text-[#5F544F] pt-0.5">
                {formatarDataVinhedoExtenso(relatorioAtual?.created)}
              </p>
            </section>

            {/* RODAPÉ INSTITUCIONAL */}
            <footer className="pt-8 mt-12 border-t border-[#D5AE6F]/60 text-center text-[8.5pt] text-[#5F544F] font-montserrat">
              <p className="tracking-wide">
                Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar
              </p>
            </footer>
          </div>,
          document.body,
        )}

      {/* DIALOG PRINCIPAL */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-4 sm:p-7 border border-[#D5AE6F]/40 bg-[#FAF7F1] shadow-2xl print:hidden">
          <div className="space-y-5">
            {/* Header com Identidade SOUL */}
            <DialogHeader className="space-y-2 border-b border-[#D5AE6F]/40 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#6A402D] text-[#D5AE6F] flex items-center justify-center shrink-0 shadow-sm border border-[#D5AE6F]/40">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-lg sm:text-xl font-soul font-bold text-[#6A402D]">
                        Resumo de Evolução com IA
                      </DialogTitle>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D5AE6F] text-[#4A322A] px-2 py-0.5 rounded-full shadow-xs">
                        Síntese Longitudinal SOUL
                      </span>
                    </div>
                    <DialogDescription className="text-xs text-[#5F544F] mt-0.5">
                      A IA analisa todas as avaliações e evoluções SOAP do paciente e sintetiza as
                      principais queixas, data de início, incidência de lesões, trajetória da dor
                      (EVA) e estado geral de saúde.
                    </DialogDescription>
                  </div>
                </div>

                {/* Alternador Gerador vs Histórico */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D5AE6F]/40 self-start sm:self-auto shadow-xs">
                  <button
                    type="button"
                    onClick={() => setAbaInterna('gerador')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      abaInterna === 'gerador'
                        ? 'bg-[#6A402D] text-white shadow-xs'
                        : 'text-[#5F544F] hover:text-[#1F1B18] hover:bg-[#F7F2EC]'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#D5AE6F]" />
                    <span>Gerar Síntese</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAbaInterna('historico')
                      carregarDadosLongitudinais()
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      abaInterna === 'historico'
                        ? 'bg-[#6A402D] text-white shadow-xs'
                        : 'text-[#5F544F] hover:text-[#1F1B18] hover:bg-[#F7F2EC]'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Histórico ({historicoResumos.length})</span>
                  </button>
                </div>
              </div>

              {/* Badges de Dados Longitudinais do Paciente */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#5F544F]">
                <span className="font-semibold text-[#1F1B18] flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#6A402D]" />
                  {pacienteNome}
                </span>
                <span>•</span>
                <Badge variant="outline" className="border-[#D5AE6F] text-[#6A402D] bg-[#F7F2EC]">
                  <Activity className="h-3 w-3 mr-1 text-[#8C6527]" />
                  {totalEvolucoes !== null
                    ? `${totalEvolucoes} sessões registradas`
                    : 'Carregando sessões...'}
                </Badge>
                {totalAvaliacoes !== null && (
                  <Badge variant="outline" className="border-[#E9E1D2] text-[#5F544F] bg-white">
                    {totalAvaliacoes} avaliações
                  </Badge>
                )}
                {dataPrimeiraSessao && (
                  <Badge variant="outline" className="border-[#E9E1D2] text-[#5F544F] bg-white">
                    <Calendar className="h-3 w-3 mr-1 text-[#6A402D]" />
                    Início: {formatDataPTBR(dataPrimeiraSessao)}
                  </Badge>
                )}
                {evaInicial !== null && evaAtual !== null && (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-800 bg-emerald-50"
                  >
                    <TrendingDown className="h-3 w-3 mr-1 text-emerald-600" />
                    EVA: {evaInicial}/10 → {evaAtual}/10
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {/* ABA GERADOR */}
            {abaInterna === 'gerador' && (
              <div className="space-y-4">
                {/* Painel de Configuração do Resumo */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D5AE6F]/40 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#6A402D]">
                      Foco ou Orientação Específica para a IA (Opcional)
                    </Label>
                    <span className="text-[10px] text-gray-400">
                      Caso queira enfatizar alguma queixa, período ou objetivo específico
                    </span>
                  </div>

                  <Textarea
                    rows={2}
                    value={focoPersonalizado}
                    onChange={(e) => setFocoPersonalizado(e.target.value)}
                    placeholder="Ex: Enfatize a melhora do ombro direito comparando as primeiras sessões de abril com as atuais, e mencione o retorno ao tênis..."
                    className="rounded-xl border-[#E9E1D2] text-xs sm:text-sm focus-visible:ring-[#D5AE6F] bg-[#FAF7F1]/60 text-[#1F1B18]"
                  />

                  {/* Informação sobre os 5 eixos que a IA analisa */}
                  <div className="p-3 rounded-xl bg-[#F7F2EC]/80 border border-[#E9E1D2] text-[11px] text-[#5F544F] space-y-1">
                    <span className="font-bold text-[#6A402D] block">
                      A IA da Clínica SOUL compilará automaticamente:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-disc pl-4 text-[10.5px]">
                      <li>Principais queixas tratadas em cada período</li>
                      <li>Data de início do tratamento e linha do tempo</li>
                      <li>Incidência de lesões e histórico de recidivas</li>
                      <li>Evolução funcional e de dor (EVA inicial vs. atual)</li>
                      <li>Dados pertinentes sobre saúde geral e hábitos</li>
                      <li>Considerações finais e diretrizes de continuidade</li>
                    </ul>
                  </div>

                  {erroGeracao && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in-50">
                      <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-[#6A402D]">
                          Não foi possível gerar a síntese com a IA no momento.
                        </p>
                        <p className="text-gray-600 text-[11px] leading-relaxed">
                          Nenhum dado do prontuário foi alterado. {erroGeracao}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleGerarResumo}
                      disabled={gerando}
                      className="bg-[#6A402D] hover:bg-[#523122] text-[#F7F2EC] font-semibold rounded-xl h-10 px-5 text-xs shadow-md border border-[#D5AE6F]/50 flex items-center gap-2 transition-all"
                    >
                      {gerando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#D5AE6F]" />
                          <span>Sintetizando todas as avaliações e evoluções...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-[#D5AE6F]" />
                          <span>
                            {conteudoEditavel
                              ? 'Regenerar Resumo com IA'
                              : 'Gerar Resumo de Evolução com IA'}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* RESULTADO GERADO */}
                {conteudoEditavel ? (
                  <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#D5AE6F]/40 space-y-4 shadow-sm animate-in fade-in-50 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-[#F7F2EC] text-[#6A402D] flex items-center justify-center font-bold text-xs border border-[#D5AE6F]/50">
                          <FileText className="h-4 w-4 text-[#6A402D]" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#6A402D]">
                            {titulo}
                            {subtitulo && (
                              <span className="font-normal text-[#5F544F]"> — {subtitulo}</span>
                            )}
                          </h4>
                          <span className="text-[10px] text-gray-400">
                            {relatorioAtual?.created
                              ? `Gerado em ${formatDataHoraPTBR(relatorioAtual.created)}`
                              : 'Pronto para revisão, edição e impressão'}
                          </span>
                        </div>
                      </div>

                      {/* Alternador Modelo vs Edição */}
                      <div className="flex items-center gap-1 bg-[#FAF7F1] p-1 rounded-xl border border-[#E9E1D2]">
                        <button
                          type="button"
                          onClick={() => setModoVisualizacao('modelo')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                            modoVisualizacao === 'modelo'
                              ? 'bg-[#6A402D] text-white shadow-xs'
                              : 'text-[#5F544F] hover:text-[#1F1B18]'
                          }`}
                        >
                          <Eye className="h-3 w-3" />
                          <span>Modelo Oficial</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoVisualizacao('edicao')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                            modoVisualizacao === 'edicao'
                              ? 'bg-[#6A402D] text-white shadow-xs'
                              : 'text-[#5F544F] hover:text-[#1F1B18]'
                          }`}
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Editar Texto</span>
                        </button>
                      </div>

                      {/* Barra de Ações */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopiar}
                          className="rounded-xl h-8 px-2.5 text-xs font-semibold border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
                        >
                          {copiado ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-gray-600" />
                              <span>Copiar</span>
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleImprimir}
                          className="bg-[#6A402D] hover:bg-[#523122] text-white rounded-xl h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-xs border border-[#D5AE6F]/40"
                        >
                          <Printer className="h-3.5 w-3.5 text-[#D5AE6F]" />
                          <span>Imprimir / PDF A4</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGerarResumo}
                          disabled={gerando}
                          className="rounded-xl h-8 px-2.5 text-xs font-semibold border-[#D5AE6F]/60 text-[#6A402D] bg-[#F7F2EC] hover:bg-[#EFE8DD] flex items-center gap-1.5"
                          title="Regenerar síntese"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Regenerar</span>
                        </Button>

                        {relatorioAtual?.id && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSalvarAjustes}
                            disabled={salvandoEdicao}
                            className="rounded-xl h-8 px-2.5 text-xs font-semibold border-[#6A402D] text-[#6A402D] bg-white hover:bg-[#F7F2EC]"
                          >
                            {salvandoEdicao ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span>Salvar Ajustes</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* MODO MODELO OFICIAL */}
                    {modoVisualizacao === 'modelo' ? (
                      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#D5AE6F]/40 shadow-xs space-y-6 font-montserrat">
                        <div className="text-center pb-4 border-b border-[#D5AE6F]/40 space-y-3">
                          <LogoSOUL variant="full" size="sm" theme="light" className="mx-auto" />
                          <div
                            className="w-full h-[1px] my-2"
                            style={{ backgroundColor: '#D5AE6F' }}
                          />
                          <div>
                            <h2
                              className="font-soul font-bold text-xl sm:text-2xl text-[#6A402D] tracking-wide uppercase"
                              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                              {titulo}
                            </h2>
                            {subtitulo && (
                              <p className="font-montserrat italic text-xs sm:text-sm text-[#B86545] mt-0.5">
                                {subtitulo}
                              </p>
                            )}
                            <div
                              className="w-16 h-[1px] mx-auto mt-2"
                              style={{ backgroundColor: '#D5AE6F' }}
                            />
                          </div>
                        </div>

                        {/* Bloco Paciente */}
                        <div className="p-4 rounded-xl bg-[#F7F2EC] border border-[#E9E1D2] text-xs leading-relaxed">
                          <div className="font-montserrat font-semibold text-[11px] uppercase tracking-wider text-[#6A402D] mb-1.5 pb-1 border-b border-[#D5AE6F]/30">
                            PACIENTE
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#5F544F]">
                            <div>
                              <strong className="text-[#6A402D]">Nome:</strong>{' '}
                              <span className="text-[#1F1B18] font-medium">
                                {pacienteNome.replace(/^CAMPO:\s*(?:Nome:\s*)?/i, '')}
                              </span>
                              {pacienteCpf && (
                                <span className="text-gray-400 font-mono">
                                  {' '}
                                  (CPF: {pacienteCpf})
                                </span>
                              )}
                            </div>
                            <div>
                              <strong className="text-[#6A402D]">Data de nascimento:</strong>{' '}
                              <span className="text-[#1F1B18]">
                                {dataNascStr ? formatDataPTBR(dataNascStr) : '—'}
                              </span>
                              {idadeCalculada && (
                                <span>
                                  {' '}
                                  | <strong className="text-[#6A402D]">Idade:</strong>{' '}
                                  {idadeCalculada}
                                </span>
                              )}
                            </div>
                            <div>
                              <strong className="text-[#6A402D]">Período analisado:</strong>{' '}
                              <span className="text-[#1F1B18]">
                                {dataPrimeiraSessao ? formatDataPTBR(dataPrimeiraSessao) : 'Início'}{' '}
                                até{' '}
                                {dataUltimaSessao
                                  ? formatDataPTBR(dataUltimaSessao)
                                  : 'Sessão atual'}
                              </span>
                            </div>
                            <div>
                              <strong className="text-[#6A402D]">Profissional emissor:</strong>{' '}
                              <span className="text-[#1F1B18] font-medium">
                                {nomeProfissionalEmissor}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo das seções */}
                        <div className="py-2">
                          <RenderizadorMarkdownInstitucional conteudo={conteudoEditavel} />
                        </div>

                        {/* Assinatura */}
                        <div className="pt-6 border-t border-[#D5AE6F]/40 text-center space-y-1">
                          <div className="w-56 mx-auto border-b border-[#6A402D] mb-2" />
                          <p className="font-semibold text-xs text-[#6A402D]">
                            {nomeProfissionalEmissor}
                          </p>
                          <p className="text-[11px] text-[#5F544F]">
                            {registroProfissionalEmissor}
                          </p>
                          <p className="text-[11px] text-[#6A402D] font-medium">
                            Clínica SOUL — Saúde e Bem Estar
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* MODO EDIÇÃO LIVRE */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#5F544F]">
                          <span>Edite livremente o texto antes de imprimir ou salvar:</span>
                          <span className="font-mono text-[10px]">
                            {conteudoEditavel.length} caracteres
                          </span>
                        </div>
                        <Textarea
                          rows={16}
                          value={conteudoEditavel}
                          onChange={(e) => setConteudoEditavel(e.target.value)}
                          className="font-montserrat text-xs leading-relaxed rounded-xl border-[#E9E1D2] focus-visible:ring-[#D5AE6F] bg-white p-3.5 text-[#1F1B18]"
                        />
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-[#F7F2EC] border border-[#D5AE6F]/40 flex items-start gap-2.5 text-xs text-[#6A402D]">
                      <ShieldCheck className="h-4 w-4 text-[#6A402D] shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Modelo Institucional Oficial:</strong> A síntese de evolução segue o
                        padrão oficial timbrado da Clínica SOUL. Use o botão{' '}
                        <strong>"Imprimir / PDF A4"</strong> para gerar o PDF institucional com
                        quebra de página limpa e rodapés oficiais de Vinhedo-SP.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D5AE6F]/50 space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-[#F7F2EC] text-[#6A402D] flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6A402D]">
                      Pronto para sintetizar o histórico
                    </h4>
                    <p className="text-xs text-[#5F544F] max-w-md mx-auto">
                      Clique no botão acima para acionar o agente especialista da Clínica SOUL. Ele
                      analisará as avaliações e evoluções SOAP para consolidar a evolução completa
                      do paciente.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ABA HISTÓRICO */}
            {abaInterna === 'historico' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#6A402D]">
                      Resumos Anteriores Salvos
                    </h4>
                    <p className="text-[11px] text-[#5F544F]">
                      Histórico dos resumos de evolução emitidos para este paciente.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={carregarDadosLongitudinais}
                    disabled={carregandoHistorico}
                    className="rounded-xl h-8 text-xs border-gray-200"
                  >
                    {carregandoHistorico ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Atualizar</span>
                  </Button>
                </div>

                {historicoResumos.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D5AE6F]/50">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-[#5F544F] font-medium">
                      Nenhum resumo de evolução emitido ainda para este paciente.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setAbaInterna('gerador')}
                      className="mt-3 bg-[#6A402D] text-white text-xs rounded-xl"
                    >
                      Gerar Primeiro Resumo de Evolução
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historicoResumos.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white rounded-2xl border border-[#D5AE6F]/30 hover:border-[#D5AE6F] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-[#6A402D]">
                              {item.titulo}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-[#F7F2EC] text-[#6A402D] border border-[#E9E1D2]"
                            >
                              Resumo com IA
                            </Badge>
                          </div>
                          <p className="text-xs text-[#5F544F] line-clamp-1 italic">
                            "{item.necessidade}"
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400">
                            <span>
                              Emissor:{' '}
                              <strong className="text-gray-600">
                                {item.autor_nome || item.expand?.autor_id?.name || 'Profissional'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>{formatDataHoraPTBR(item.created)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSelecionarDoHistorico(item)}
                            className="bg-[#6A402D] hover:bg-[#523122] text-white rounded-xl h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-[#D5AE6F]" />
                            <span>Abrir / Imprimir</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ModalResumoEvolucaoIa
