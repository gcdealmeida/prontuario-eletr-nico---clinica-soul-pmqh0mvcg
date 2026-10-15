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
  ChevronRight,
  ShieldCheck,
  Eye,
  Edit3,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  gerarRelatorioIa,
  getRelatoriosByAvaliacao,
  updateRelatorioIa,
  type GerarRelatorioIaResponse,
} from '@/services/relatoriosIa'
import type { Especialidade, RelatorioIaRecord } from '@/types/database'
import { LogoSOUL } from '@/components/LogoSOUL'
import { createPortal } from 'react-dom'
import { formatDataHoraPTBR, formatDataPTBR } from '@/lib/constants'
import { normalizarConteudoRelatorio, normalizarParaTextoPuro } from '@/lib/normalizadorRelatorioIa'

interface ModalRelatorioIaProps {
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

/**
 * Utilitário para calcular a idade do paciente a partir da data de nascimento
 */
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

/**
 * Parser inteligente de Markdown para renderizar seções e parágrafos
 * no padrão editorial institucional da Clínica SOUL.
 * Títulos das seções em Cormorant Garamond marrom (#6A402D),
 * e o corpo das seções/parágrafos em Montserrat (#1F1B18).
 */
function RenderizadorMarkdownInstitucional({ conteudo }: { conteudo: string }) {
  if (!conteudo) return null

  // Normaliza previamente tabelas markdown e separadores crus
  const textoNormalizado = normalizarConteudoRelatorio(conteudo)

  // Quebrar em linhas e processar títulos numerados (ex: "1. OBJETIVO DO RELATÓRIO" ou "### 1. OBJETIVO")
  const linhas = textoNormalizado.split('\n')
  const blocos: { tipo: 'header' | 'sub' | 'bullet' | 'p' | 'empty'; texto: string }[] = []

  for (let i = 0; i < linhas.length; i++) {
    const raw = linhas[i].trim()
    if (!raw) {
      blocos.push({ tipo: 'empty', texto: '' })
      continue
    }

    // Identificar títulos principais numerados das 6 seções (ex: "1. OBJETIVO", "## 1. OBJETIVO", "**1. OBJETIVO**")
    const matchSecaoNumerada = raw.match(
      /^(?:#+\s*|\*\*)?(\d\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ/\s-]+)(?:\*\*)?:?$/i,
    )
    if (matchSecaoNumerada) {
      blocos.push({ tipo: 'header', texto: matchSecaoNumerada[1].replace(/\*\*/g, '').trim() })
      continue
    }

    // Identificar outros títulos Markdown (### ...)
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

    // Identificar marcadores de lista (• ou - ou *)
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
          // Tratar negrito inline simples (**termo**)
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

export function ModalRelatorioIa({
  open,
  onOpenChange,
  pacienteId,
  pacienteNome,
  pacienteCpf,
  avaliacaoId,
  especialidade,
  dadosProntuario,
  profissionalResponsavel,
}: ModalRelatorioIaProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  // Estados principais
  const [abaInterna, setAbaInterna] = useState<'gerador' | 'historico'>('gerador')
  const [modoVisualizacao, setModoVisualizacao] = useState<'modelo' | 'edicao'>('modelo')
  const [necessidade, setNecessidade] = useState('')
  const [titulo, setTitulo] = useState('RELATÓRIO CLÍNICO / FUNCIONAL')
  const [subtitulo, setSubtitulo] = useState('')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)
  const [relatorioAtual, setRelatorioAtual] = useState<GerarRelatorioIaResponse | null>(null)
  const [conteudoEditavel, setConteudoEditavel] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Histórico
  const [historico, setHistorico] = useState<RelatorioIaRecord[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  // Sugestões de necessidades padronizadas para a Clínica SOUL
  const sugestoesNecessidade = [
    {
      label: 'Médico Ortopedista',
      descricao:
        'Relatório técnico detalhado para o médico ortopedista assistente com queixa, goniometria (ADM), testes especiais positivos/negativos, hipótese diagnóstica e plano semanal de tratamento.',
      publico: 'Médico Ortopedista / Assistente',
      titulo: 'RELATÓRIO CLÍNICO / FUNCIONAL',
      subtitulo: 'Avaliação Funcional e Encaminhamento Médico',
    },
    {
      label: 'Evolução para o Personal',
      descricao:
        'Parecer biomecânico com ênfase nas assimetrias encontradas, faixas de movimento articular seguras, tolerância de carga e diretrizes para o treino integrado.',
      publico: 'Personal Trainer / Educador Físico',
      titulo: 'RELATÓRIO CLÍNICO / FUNCIONAL',
      subtitulo: 'Parecer Biomecânico e Diretrizes de Treinamento Integrado',
    },
    {
      label: 'Resumo para Paciente / Familiar',
      descricao:
        'Resumo em linguagem clara, didática e acolhedora explicando os achados da avaliação, objetivos terapêuticos e orientações para o dia a dia.',
      publico: 'Paciente e Familiares',
      titulo: 'RELATÓRIO CLÍNICO / FUNCIONAL',
      subtitulo: 'Resumo da Avaliação e Plano de Cuidado Integrado',
    },
    {
      label: 'Relatório Pericial / Jurídico / Alta',
      descricao:
        'Parecer formal com dados objetivos, datas de exames, limitações funcionais mensuradas e fundamentação documental detalhada.',
      publico: 'Perícia Médica / Documental / Alta Clínica',
      titulo: 'RELATÓRIO CLÍNICO / FUNCIONAL',
      subtitulo: 'Relatório Técnico Pericial e de Conclusão Funcional',
    },
  ]

  const carregarHistorico = async () => {
    if (!avaliacaoId) return
    setCarregandoHistorico(true)
    try {
      const lista = await getRelatoriosByAvaliacao(avaliacaoId)
      setHistorico(lista)
    } catch (err) {
      console.error('Erro ao listar histórico de relatórios:', err)
    } finally {
      setCarregandoHistorico(false)
    }
  }

  useEffect(() => {
    if (open) {
      carregarHistorico()
    }
  }, [open, avaliacaoId])

  const handleAplicarSugestao = (sug: (typeof sugestoesNecessidade)[0]) => {
    setNecessidade(sug.descricao)
    setPublicoAlvo(sug.publico)
    setTitulo(sug.titulo)
    setSubtitulo(sug.subtitulo)
  }

  const handleGerar = async () => {
    if (!necessidade.trim()) {
      toast({
        title: 'Descreva o que você precisa',
        description: 'Informe em linguagem livre para quem ou qual o foco do relatório.',
        variant: 'destructive',
      })
      return
    }

    setGerando(true)
    setErroGeracao(null)
    try {
      const tituloFinal = subtitulo.trim()
        ? `${titulo.trim()} — ${subtitulo.trim()}`
        : titulo.trim()

      const res = await gerarRelatorioIa({
        paciente_id: pacienteId,
        avaliacao_id: avaliacaoId,
        especialidade,
        necessidade: necessidade.trim(),
        titulo: tituloFinal || 'RELATÓRIO CLÍNICO / FUNCIONAL',
        publico_alvo: publicoAlvo.trim(),
        dados_prontuario: dadosProntuario,
      })

      const conteudoLimpo = normalizarConteudoRelatorio(res.conteudo)
      setRelatorioAtual({
        ...res,
        conteudo: conteudoLimpo,
      })
      setConteudoEditavel(conteudoLimpo)
      setModoVisualizacao('modelo')
      if (res.falha_historico || res.aviso) {
        toast({
          title: '✨ Relatório gerado com sucesso no modelo oficial!',
          description:
            res.aviso ||
            'Relatório pronto no Modelo Institucional da Clínica SOUL. Sua avaliação segue 100% intacta.',
        })
      } else {
        toast({
          title: '✨ Relatório gerado no Modelo Institucional!',
          description:
            'Pronto para visualização oficial, cópia ou impressão A4 limpa sem sobreposições.',
        })
      }
      carregarHistorico()
    } catch (err: any) {
      console.error('Erro ao gerar relatório com IA:', err)
      const msgErro =
        err?.message ||
        'Falha ao gerar o relatório. Tente novamente — sua avaliação está salva e intacta.'
      setErroGeracao(msgErro)
      toast({
        title: 'Falha ao gerar o relatório',
        description: 'Tente novamente — sua avaliação está salva.',
        variant: 'destructive',
      })
    } finally {
      setGerando(false)
    }
  }

  const handleCopiar = async () => {
    if (!conteudoEditavel) return
    try {
      // Normaliza para texto puro e legível, sem markdown cru (**, ##, pipes)
      const textoParaCopiar = normalizarParaTextoPuro(conteudoEditavel)
      await navigator.clipboard.writeText(textoParaCopiar)
      setCopiado(true)
      toast({
        title: 'Copiado para a área de transferência!',
        description: 'Texto limpo e estruturado pronto para WhatsApp, e-mail ou prontuário.',
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
        title: 'Ajustes salvos no relatório!',
        description: 'O histórico foi atualizado com sua edição no padrão institucional.',
      })
      carregarHistorico()
    } catch (err: any) {
      toast({
        title:
          'Não foi possível salvar as alterações do relatório. Seus dados de avaliação continuam intactos.',
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
      titulo: item.titulo,
      necessidade: item.necessidade,
      conteudo: conteudoLimpo,
      autor_id: item.autor_id,
      autor_nome: item.autor_nome || item.expand?.autor_id?.name || 'Profissional SOUL',
      created: item.created,
    })

    // Separar título e subtítulo se houver delimitador " — "
    if (item.titulo.includes(' — ')) {
      const [t, ...sub] = item.titulo.split(' — ')
      setTitulo(t)
      setSubtitulo(sub.join(' — '))
    } else {
      setTitulo(item.titulo || 'RELATÓRIO CLÍNICO / FUNCIONAL')
      setSubtitulo('')
    }

    setNecessidade(item.necessidade)
    setPublicoAlvo(item.publico_alvo || '')
    setConteudoEditavel(conteudoLimpo)
    setModoVisualizacao('modelo')
    setAbaInterna('gerador')
    toast({
      title: 'Relatório carregado',
      description: `Exibindo versão de ${formatDataHoraPTBR(item.created)}.`,
    })
  }

  /**
   * Aciona a impressão nativa adicionando a classe 'imprimindo-relatorio-ia'
   * ao body para que o restante da tela seja 100% ocultado e nada sobreponha o documento A4.
   */
  const handleImprimir = () => {
    document.body.classList.add('imprimindo-relatorio-ia')
    window.print()
    // Event listener para remoção segura após a impressão
    const cleanup = () => {
      document.body.classList.remove('imprimindo-relatorio-ia')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    // Fallback de timeout caso o navegador não emita afterprint
    setTimeout(() => {
      document.body.classList.remove('imprimindo-relatorio-ia')
    }, 2000)
  }

  // Dados cadastrais derivados
  const dataNascStr =
    (dadosProntuario?.data_nascimento as string) ||
    (dadosProntuario?.expand as any)?.paciente_id?.data_nascimento ||
    ''
  const idadeCalculada = calcularIdade(dataNascStr)

  const dataAvaliacaoFormatada = formatDataPTBR(
    (dadosProntuario?.data_avaliacao as string) ||
      (dadosProntuario?.created as string) ||
      new Date().toISOString(),
  )

  const nomeProfissionalEmissor =
    relatorioAtual?.autor_nome ||
    user?.name ||
    profissionalResponsavel ||
    'Profissional Responsável SOUL'

  const registroProfissionalEmissor =
    (user as any)?.registro_profissional ||
    (dadosProntuario as any)?.registro_profissional ||
    `${especialidade} • Registro Profissional Ativo`

  return (
    <>
      {/* ======================================================================== */}
      {/* CONTAINER DEDICADO DE IMPRESSÃO A4 (renderizado direto no document.body) */}
      {/* Totalmente desacoplado do modal e do #root para impressão 100% fiel     */}
      {/* ======================================================================== */}
      {typeof document !== 'undefined' &&
        conteudoEditavel &&
        createPortal(
          <div
            id="container-impressao-relatorio-ia"
            className="hidden print:block bg-white text-[#1F1B18] p-0 m-0 w-full font-montserrat"
          >
            {/* CABEÇALHO OFICIAL: Logo SOUL no topo com respiro + linha dourada fina */}
            <header className="pt-2 pb-5 text-center space-y-3">
              <div className="flex justify-center items-center py-2">
                <LogoSOUL variant="full" size="md" theme="light" className="mx-auto" />
              </div>
              {/* Linha dourada fina separando o cabeçalho do documento */}
              <div className="w-full h-[1px] my-2" style={{ backgroundColor: '#D5AE6F' }} />
            </header>

            {/* TÍTULO PRINCIPAL (Cormorant Garamond) E SUBTÍTULO (Montserrat) */}
            <div className="text-center space-y-1 mb-6">
              <h1
                className="font-soul font-semibold tracking-wide text-[#6A402D]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '22pt',
                  lineHeight: 1.2,
                }}
              >
                {titulo || 'RELATÓRIO CLÍNICO / FUNCIONAL'}
              </h1>
              {subtitulo && (
                <p className="font-montserrat italic text-[#B86545]" style={{ fontSize: '10.5pt' }}>
                  {subtitulo}
                </p>
              )}
              <div className="w-16 h-[1px] mx-auto mt-2" style={{ backgroundColor: '#D5AE6F' }} />
            </div>

            {/* BLOCO PACIENTE: Caixa bege claro (#F7F2EC) com borda suave e campos organizados */}
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
                  <strong className="text-[#6A402D]">Data da avaliação:</strong>{' '}
                  <span className="text-[#1F1B18]">{dataAvaliacaoFormatada}</span>
                </div>
                <div>
                  <strong className="text-[#6A402D]">Profissional responsável:</strong>{' '}
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

            {/* BLOCO DE ASSINATURA NO RODAPÉ DO CONTEÚDO */}
            <section className="pt-8 mt-8 text-center space-y-1.5 page-break-inside-avoid">
              <div className="w-64 mx-auto border-b border-[#6A402D] mb-3" />
              <p className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
                {nomeProfissionalEmissor}
              </p>
              <p className="font-montserrat text-[9pt] text-[#5F544F]">
                {especialidade} • {registroProfissionalEmissor}
              </p>
              <p className="font-montserrat font-semibold text-[9pt] text-[#6A402D] mt-1">
                Clínica SOUL — Saúde e Bem Estar
              </p>
            </section>

            {/* RODAPÉ INSTITUCIONAL */}
            <footer className="pt-8 mt-12 border-t border-[#D5AE6F]/60 text-center text-[8.5pt] text-[#5F544F] font-montserrat">
              <p className="tracking-wide">
                Clínica SOUL • Saúde e Bem Estar | Atendimento Integrado • Belo Horizonte / MG •
                @clinica.soul
              </p>
            </footer>
          </div>,
          document.body,
        )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-4 sm:p-7 border border-[#D5AE6F]/40 bg-[#FAF7F1] shadow-2xl print:hidden">
          {/* ============================================================== */}
          {/* CONTEÚDO DA INTERFACE MODAL EM TELA (oculto no print)          */}
          {/* ============================================================== */}
          <div className="space-y-5">
            {/* Header do Modal com Identidade Visual SOUL */}
            <DialogHeader className="space-y-2 border-b border-[#D5AE6F]/40 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#6A402D] text-[#D5AE6F] flex items-center justify-center shrink-0 shadow-sm border border-[#D5AE6F]/40">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-lg sm:text-xl font-soul font-bold text-[#6A402D]">
                        Relatório Clínico / Funcional Oficial
                      </DialogTitle>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D5AE6F] text-[#4A322A] px-2 py-0.5 rounded-full shadow-xs">
                        Modelo Institucional SOUL
                      </span>
                    </div>
                    <DialogDescription className="text-xs text-[#5F544F] mt-0.5">
                      Gere laudos e relatórios no padrão institucional oficial da Clínica SOUL com 6
                      seções numeradas, pronto para visualização elegante e impressão A4 perfeita.
                    </DialogDescription>
                  </div>
                </div>

                {/* Botões de alternância: Gerador vs Histórico */}
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
                    <span>Emitir Relatório</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAbaInterna('historico')
                      carregarHistorico()
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      abaInterna === 'historico'
                        ? 'bg-[#6A402D] text-white shadow-xs'
                        : 'text-[#5F544F] hover:text-[#1F1B18] hover:bg-[#F7F2EC]'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Histórico ({historico.length})</span>
                  </button>
                </div>
              </div>

              {/* Identificação rápida do paciente */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#5F544F]">
                <span className="font-semibold text-[#1F1B18] flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-[#6A402D]" />
                  {pacienteNome}
                </span>
                <span>•</span>
                <Badge variant="outline" className="border-[#D5AE6F] text-[#6A402D] bg-[#F7F2EC]">
                  {especialidade}
                </Badge>
                <span>•</span>
                <span className="text-gray-500">
                  Prontuário #{avaliacaoId.slice(0, 8)} | Emissor: {nomeProfissionalEmissor}
                </span>
              </div>
            </DialogHeader>

            {/* ABA 1: GERADOR DE RELATÓRIO */}
            {abaInterna === 'gerador' && (
              <div className="space-y-4">
                {/* Formulário de Instrução e Necessidade */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D5AE6F]/40 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#6A402D] flex items-center gap-1.5">
                      <span>O que você precisa no momento? (Linguagem livre) *</span>
                    </Label>
                    <span className="text-[10px] text-gray-400">
                      Ex: médico, personal, paciente...
                    </span>
                  </div>

                  <Textarea
                    rows={3}
                    value={necessidade}
                    onChange={(e) => setNecessidade(e.target.value)}
                    placeholder="Ex: Elabore um relatório para o médico ortopedista assistente resumindo os achados de amplitude articular, testes especiais positivos e plano terapêutico proposto..."
                    className="rounded-xl border-[#E9E1D2] text-xs sm:text-sm focus-visible:ring-[#D5AE6F] bg-[#FAF7F1]/60 text-[#1F1B18]"
                  />

                  {/* Sugestões Rápidas de Modelos */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6A402D] block mb-1.5">
                      Modelos rápidos recomendados:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sugestoesNecessidade.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAplicarSugestao(sug)}
                          className="p-2.5 rounded-xl border border-[#E9E1D2] bg-[#F7F2EC]/60 hover:bg-[#F7F2EC] hover:border-[#D5AE6F] text-left transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#6A402D] group-hover:text-[#B86545]">
                              {sug.label}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#6A402D] transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <p className="text-[11px] text-[#5F544F] line-clamp-1 mt-0.5">
                            {sug.descricao}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campos de Título e Subtítulo (Modelo Institucional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] text-[#5F544F] font-semibold">
                        Título Principal
                      </Label>
                      <Input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="RELATÓRIO CLÍNICO / FUNCIONAL"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] text-[#5F544F] font-semibold">
                        Subtítulo (Opcional)
                      </Label>
                      <Input
                        value={subtitulo}
                        onChange={(e) => setSubtitulo(e.target.value)}
                        placeholder="Ex: Avaliação Funcional, Evolução, Alta"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-[11px] text-[#5F544F] font-semibold">
                        Público-Alvo / Destinatário
                      </Label>
                      <Input
                        value={publicoAlvo}
                        onChange={(e) => setPublicoAlvo(e.target.value)}
                        placeholder="Ex: Médico Ortopedista ou Paciente"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Alerta de erro defensivo: usuário continua no modal, sem perder contexto nem redirecionar */}
                  {erroGeracao && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in-50">
                      <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-[#6A402D]">
                          Falha ao gerar o relatório. Tente novamente — sua avaliação está salva.
                        </p>
                        <p className="text-gray-600 text-[11px] leading-relaxed">
                          Nenhum dado do prontuário foi alterado ou perdido. {erroGeracao}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botão de Ação para Gerar com IA */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleGerar}
                      disabled={gerando || !necessidade.trim()}
                      className="bg-[#6A402D] hover:bg-[#523122] text-[#F7F2EC] font-semibold rounded-xl h-10 px-5 text-xs shadow-md border border-[#D5AE6F]/50 flex items-center gap-2 transition-all"
                    >
                      {gerando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#D5AE6F]" />
                          <span>Gerando no Modelo Institucional...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-[#D5AE6F]" />
                          <span>
                            {conteudoEditavel ? 'Regenerar Relatório' : 'Gerar Relatório Oficial'}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* ÁREA DE RESULTADO GERADO COM O MODELO INSTITUCIONAL DA CLÍNICA SOUL */}
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
                              ? `Criado em ${formatDataHoraPTBR(relatorioAtual.created)}`
                              : 'Pronto para visualização, revisão e impressão'}
                          </span>
                        </div>
                      </div>

                      {/* Alternador de visualização: Modelo Institucional vs Edição de Texto */}
                      <div className="flex items-center gap-1 bg-[#FAF7F1] p-1 rounded-xl border border-[#E9E1D2]">
                        <button
                          type="button"
                          onClick={() => setModoVisualizacao('modelo')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                            modoVisualizacao === 'modelo'
                              ? 'bg-[#6A402D] text-white shadow-xs'
                              : 'text-[#5F544F] hover:text-[#1F1B18]'
                          }`}
                          title="Ver layout institucional formatado"
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
                          title="Editar texto do relatório livremente"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Editar Texto</span>
                        </button>
                      </div>

                      {/* Barra de Ações: Copiar, Imprimir A4, Salvar */}
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
                          onClick={handleGerar}
                          disabled={gerando}
                          className="rounded-xl h-8 px-2.5 text-xs font-semibold border-[#D5AE6F]/60 text-[#6A402D] bg-[#F7F2EC] hover:bg-[#EFE8DD] flex items-center gap-1.5"
                          title="Regenerar relatório com o mesmo contexto"
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

                    {/* VISUALIZAÇÃO 1: O MODELO INSTITUCIONAL EXATO NA TELA */}
                    {modoVisualizacao === 'modelo' ? (
                      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#D5AE6F]/40 shadow-xs space-y-6 font-montserrat">
                        {/* Cabeçalho Oficial no topo com respiro */}
                        <div className="text-center pb-4 border-b border-[#D5AE6F]/40 space-y-3">
                          <LogoSOUL variant="full" size="sm" theme="light" className="mx-auto" />
                          <div
                            className="w-full h-[1px] my-2"
                            style={{ backgroundColor: '#D5AE6F' }}
                          />
                          <div>
                            <h2
                              className="font-soul font-bold text-xl sm:text-2xl text-[#6A402D] tracking-wide"
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

                        {/* Bloco PACIENTE */}
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
                              <strong className="text-[#6A402D]">Data da avaliação:</strong>{' '}
                              <span className="text-[#1F1B18]">{dataAvaliacaoFormatada}</span>
                            </div>
                            <div>
                              <strong className="text-[#6A402D]">Profissional responsável:</strong>{' '}
                              <span className="text-[#1F1B18] font-medium">
                                {nomeProfissionalEmissor}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo das 6 seções numeradas */}
                        <div className="py-2">
                          <RenderizadorMarkdownInstitucional conteudo={conteudoEditavel} />
                        </div>

                        {/* Bloco de assinatura no rodapé do conteúdo */}
                        <div className="pt-6 border-t border-[#D5AE6F]/40 text-center space-y-1">
                          <div className="w-56 mx-auto border-b border-[#6A402D] mb-2" />
                          <p className="font-semibold text-xs text-[#6A402D]">
                            {nomeProfissionalEmissor}
                          </p>
                          <p className="text-[11px] text-[#5F544F]">
                            {especialidade} • {registroProfissionalEmissor}
                          </p>
                          <p className="text-[11px] text-[#6A402D] font-medium">
                            Clínica SOUL — Saúde e Bem Estar
                          </p>
                        </div>

                        {/* Rodapé padrão */}
                        <div className="pt-4 border-t border-gray-100 text-center text-[10px] text-[#5F544F]">
                          Clínica SOUL • Saúde e Bem Estar | Atendimento Integrado • Belo Horizonte
                          / MG • @clinica.soul
                        </div>
                      </div>
                    ) : (
                      /* VISUALIZAÇÃO 2: EDITOR LIVRE DE TEXTO */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#5F544F]">
                          <span>Edite livremente o texto das seções antes de imprimir:</span>
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
                        <strong>Modelo Institucional Oficial:</strong> Este documento segue
                        rigorosamente a paleta Marrom SOUL (#6A402D), Dourado Champagne (#D5AE6F),
                        Bege Claro (#F7F2EC) e fontes institucionais. Ao clicar em{' '}
                        <strong>"Imprimir / PDF A4"</strong>, a impressão sai limpa e formatada sem
                        qualquer sobreposição visual.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D5AE6F]/50 space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-[#F7F2EC] text-[#6A402D] flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6A402D]">
                      Nenhum relatório gerado ainda
                    </h4>
                    <p className="text-xs text-[#5F544F] max-w-md mx-auto">
                      Descreva o objetivo ou escolha uma sugestão acima para que o agente
                      especialista da SOUL redija o documento com base nas 6 seções numeradas do
                      Modelo Institucional.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: HISTÓRICO DE RELATÓRIOS DO PRONTUÁRIO */}
            {abaInterna === 'historico' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#6A402D]">
                      Relatórios Anteriores Gerados
                    </h4>
                    <p className="text-[11px] text-[#5F544F]">
                      Todos os relatórios criados com IA para esta avaliação ficam salvos e
                      acessíveis aqui no padrão institucional.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={carregarHistorico}
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

                {carregandoHistorico ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D5AE6F] mx-auto" />
                    <span className="text-xs text-gray-500 mt-2 block">
                      Carregando histórico...
                    </span>
                  </div>
                ) : historico.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#D5AE6F]/50">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-[#5F544F] font-medium">
                      Ainda não há relatórios emitidos para este prontuário.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setAbaInterna('gerador')}
                      className="mt-3 bg-[#6A402D] text-white text-xs rounded-xl"
                    >
                      Emitir Primeiro Relatório
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historico.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white rounded-2xl border border-[#D5AE6F]/30 hover:border-[#D5AE6F] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-[#6A402D]">
                              {item.titulo}
                            </span>
                            {item.publico_alvo && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-[#F7F2EC] text-[#6A402D] border border-[#E9E1D2]"
                              >
                                {item.publico_alvo}
                              </Badge>
                            )}
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
export default ModalRelatorioIa
