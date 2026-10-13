import { useState, useEffect } from 'react'
import {
  Sparkles,
  Printer,
  Copy,
  RotateCcw,
  Check,
  History,
  FileText,
  Loader2,
  Calendar,
  User,
  Send,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
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
import { formatDataHoraPTBR, formatDataPTBR } from '@/lib/constants'

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
  const [necessidade, setNecessidade] = useState('')
  const [titulo, setTitulo] = useState('Relatório Clínico Otimizado')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [gerando, setGerando] = useState(false)
  const [relatorioAtual, setRelatorioAtual] = useState<GerarRelatorioIaResponse | null>(null)
  const [conteudoEditavel, setConteudoEditavel] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Histórico
  const [historico, setHistorico] = useState<RelatorioIaRecord[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  // Sugestões de necessidades conforme especialidade
  const sugestoesNecessidade = [
    {
      label: 'Médico Ortopedista',
      descricao:
        'Relatório técnico detalhado para o médico ortopedista resumindo queixa, amplitude de movimento, testes especiais e proposta terapêutica.',
      publico: 'Médico Ortopedista / Especialista',
      titulo: 'Relatório de Encaminhamento e Avaliação para Ortopedista',
    },
    {
      label: 'Evolução para o Personal',
      descricao:
        'Relatório com ênfase em biomecânica, assimetrias encontradas, faixas de movimento seguras e diretrizes de progressão de carga.',
      publico: 'Personal Trainer / Educador Físico',
      titulo: 'Parecer Biomecânico e Diretrizes de Treinamento Integrado',
    },
    {
      label: 'Resumo para Paciente / Familiar',
      descricao:
        'Resumo em linguagem clara, acolhedora e didática explicando a condição encontrada, os objetivos do tratamento e os cuidados domiciliares.',
      publico: 'Paciente e Familiares',
      titulo: 'Resumo da Avaliação e Plano de Cuidado do Paciente',
    },
    {
      label: 'Relatório Pericial / Jurídico',
      descricao:
        'Parecer formal e cronológico com dados objetivos, datas dos exames, limitações funcionais mensuradas e fundamentação documental.',
      publico: 'Perícia Médica / Fins Documentais Legais',
      titulo: 'Relatório Técnico Pericial de Avaliação Funcional',
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
    try {
      const res = await gerarRelatorioIa({
        paciente_id: pacienteId,
        avaliacao_id: avaliacaoId,
        especialidade,
        necessidade: necessidade.trim(),
        titulo: titulo.trim() || 'Relatório Clínico Otimizado',
        publico_alvo: publicoAlvo.trim(),
        dados_prontuario: dadosProntuario,
      })

      setRelatorioAtual(res)
      setConteudoEditavel(res.conteudo)
      toast({
        title: '✨ Relatório gerado com sucesso!',
        description: 'Você pode revisar o texto, copiar ou imprimir em folha A4 timbrada.',
      })
      // Recarregar histórico em segundo plano
      carregarHistorico()
    } catch (err: any) {
      console.error('Erro ao gerar relatório com IA:', err)
      toast({
        title: 'Não foi possível gerar o relatório',
        description:
          err?.message ||
          'O assistente de relatórios está temporariamente indisponível. Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGerando(false)
    }
  }

  const handleCopiar = async () => {
    if (!conteudoEditavel) return
    try {
      await navigator.clipboard.writeText(conteudoEditavel)
      setCopiado(true)
      toast({
        title: 'Copiado para a área de transferência!',
        description: 'Você já pode colar no WhatsApp, e-mail ou editor de texto.',
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
      await updateRelatorioIa(relatorioAtual.id, {
        titulo: titulo.trim(),
        conteudo: conteudoEditavel,
      })
      toast({
        title: 'Ajustes salvos no relatório!',
        description: 'O histórico foi atualizado com sua edição.',
      })
      carregarHistorico()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar alterações',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const handleSelecionarDoHistorico = (item: RelatorioIaRecord) => {
    setRelatorioAtual({
      id: item.id,
      paciente_id: item.paciente_id,
      avaliacao_id: item.avaliacao_id,
      especialidade: item.especialidade,
      titulo: item.titulo,
      necessidade: item.necessidade,
      conteudo: item.conteudo,
      autor_id: item.autor_id,
      autor_nome: item.autor_nome || item.expand?.autor_id?.name || 'Profissional SOUL',
      created: item.created,
    })
    setTitulo(item.titulo)
    setNecessidade(item.necessidade)
    setPublicoAlvo(item.publico_alvo || '')
    setConteudoEditavel(item.conteudo)
    setAbaInterna('gerador')
    toast({
      title: 'Relatório carregado',
      description: `Exibindo versão de ${formatDataHoraPTBR(item.created)}.`,
    })
  }

  const handleImprimir = () => {
    window.print()
  }

  const nomeProfissionalEmissor =
    relatorioAtual?.autor_nome ||
    user?.name ||
    profissionalResponsavel ||
    'Profissional Responsável SOUL'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border border-[#E9E1D2] bg-[#FAF8F5] shadow-2xl print:max-w-none print:max-h-none print:overflow-visible print:border-none print:shadow-none print:bg-white print:p-0 print:m-0">
        {/* CABEÇALHO TIMBRADO PARA IMPRESSÃO A4 (visível apenas na impressão) */}
        <div className="hidden print:block pb-6 mb-6 border-b-2 border-[#E9E1D2] text-center space-y-3">
          <LogoSOUL variant="full" size="md" theme="light" className="mx-auto" />
          <div className="flex items-center justify-center gap-3 text-[11px] text-[#73574A]">
            <span className="font-bold text-[#8C6527] uppercase tracking-wider">
              {titulo || 'Relatório Clínico Oficial'}
            </span>
            <span>•</span>
            <span>Clínica SOUL — Saúde e Bem-Estar</span>
            <span>•</span>
            <span>Emitido em {new Date().toLocaleDateString('pt-BR')}</span>
          </div>

          <div className="bg-[#FAF5EE] p-3 rounded-xl border border-[#E9E1D2] text-left grid grid-cols-2 gap-2 text-xs text-gray-700 mt-2">
            <div>
              <strong>Paciente:</strong> {pacienteNome}
              {pacienteCpf && (
                <span className="text-gray-500 font-mono"> (CPF: {pacienteCpf})</span>
              )}
            </div>
            <div>
              <strong>Especialidade:</strong> {especialidade}
            </div>
            <div>
              <strong>Profissional Emissor:</strong> {nomeProfissionalEmissor}
            </div>
            <div>
              <strong>Data da Avaliação:</strong>{' '}
              {formatDataPTBR(
                (dadosProntuario?.data_avaliacao as string) || (dadosProntuario?.created as string),
              )}
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO IMPRESSO (visível apenas no print) */}
        <div className="hidden print:block text-xs leading-relaxed text-gray-900 whitespace-pre-wrap font-sans">
          {conteudoEditavel}
          <div className="pt-10 mt-10 border-t border-gray-300 flex justify-between text-xs text-gray-500">
            <div>
              <strong>{nomeProfissionalEmissor}</strong>
              <p className="text-[10px]">Clínica SOUL Saúde e Bem-Estar</p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-gray-400 mb-1" />
              <p className="text-[10px]">Assinatura / Carimbo</p>
            </div>
          </div>
        </div>

        {/* CONTEÚDO DA INTERFACE MODAL EM TELA (oculto no print) */}
        <div className="space-y-5 print:hidden">
          {/* Header do Modal com Destaque SOUL */}
          <DialogHeader className="space-y-2 border-b border-[#E9E1D2] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#8C6527] to-[#C9A46A] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="h-6 w-6 text-amber-100 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg sm:text-xl font-serif font-bold text-[#4A322A]">
                      Emissão de Relatório com IA
                    </DialogTitle>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-[#C9A46A] text-white px-2 py-0.5 rounded-full shadow-xs">
                      SOUL IA Nativa
                    </span>
                  </div>
                  <DialogDescription className="text-xs text-gray-600 mt-0.5">
                    Gere laudos, pareceres e resumos sob medida para médicos, personal trainers ou
                    pacientes a partir dos dados reais do prontuário.
                  </DialogDescription>
                </div>
              </div>

              {/* Botões de alternância: Gerador vs Histórico */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E9E1D2] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAbaInterna('gerador')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    abaInterna === 'gerador'
                      ? 'bg-[#4A322A] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A46A]" />
                  <span>Novo Relatório</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAbaInterna('historico')
                    carregarHistorico()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    abaInterna === 'historico'
                      ? 'bg-[#4A322A] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Histórico ({historico.length})</span>
                </button>
              </div>
            </div>

            {/* Identificação rápida do paciente */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
              <span className="font-semibold text-gray-800 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-[#8C6527]" />
                {pacienteNome}
              </span>
              <span>•</span>
              <Badge variant="outline" className="border-[#C9A46A]/50 text-[#8C6527] bg-[#FAF5EE]">
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
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E1D2] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#4A322A] flex items-center gap-1.5">
                    <span>O que você precisa no momento? (Linguagem livre) *</span>
                  </Label>
                  <span className="text-[10px] text-gray-400">Ex: médico, personal, leigo...</span>
                </div>

                <Textarea
                  rows={3}
                  value={necessidade}
                  onChange={(e) => setNecessidade(e.target.value)}
                  placeholder="Ex: Elabore um relatório para o médico ortopedista resumindo a anamnese, os achados da goniometria, testes especiais e o plano semanal de reabilitação..."
                  className="rounded-xl border-gray-200 text-xs sm:text-sm focus-visible:ring-[#8C6527] bg-[#FAF8F5]/50"
                />

                {/* Sugestões Rápidas de Necessidades */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] block mb-1.5">
                    Sugestões rápidas de modelos:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sugestoesNecessidade.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAplicarSugestao(sug)}
                        className="p-2.5 rounded-xl border border-[#E9E1D2] bg-[#FAF5EE]/70 hover:bg-[#F3EAD9] hover:border-[#C9A46A] text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#4A322A] group-hover:text-[#8C6527]">
                            {sug.label}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#8C6527] transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {sug.descricao}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campos adicionais opcionais (Título e Destinatário) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-600 font-semibold">
                      Título do Relatório
                    </Label>
                    <Input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Relatório Clínico de Fisioterapia"
                      className="h-8 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-gray-600 font-semibold">
                      Destinatário / Público-Alvo (opcional)
                    </Label>
                    <Input
                      value={publicoAlvo}
                      onChange={(e) => setPublicoAlvo(e.target.value)}
                      placeholder="Ex: Dr. Marcelo (Ortopedista) ou Paciente"
                      className="h-8 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Botão de Ação para Gerar com IA */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleGerar}
                    disabled={gerando || !necessidade.trim()}
                    className="bg-gradient-to-r from-[#8C6527] via-[#A87B32] to-[#C9A46A] hover:brightness-105 text-white font-bold rounded-xl h-10 px-5 text-xs shadow-md border border-amber-400/30 flex items-center gap-2"
                  >
                    {gerando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Gerando Relatório com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>{conteudoEditavel ? 'Regenerar Relatório' : 'Gerar Relatório'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* ÁREA DE RESULTADO GERADO (EDITÁVEL, COPIAR, IMPRIMIR) */}
              {conteudoEditavel ? (
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E1D2] space-y-3 shadow-sm animate-in fade-in-50 duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#4A322A]">
                          {titulo || 'Relatório Gerado'}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {relatorioAtual?.created
                            ? `Criado em ${formatDataHoraPTBR(relatorioAtual.created)}`
                            : 'Pronto para revisão e emissão'}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Ações: Copiar, Imprimir/PDF, Regenerar, Salvar */}
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
                        className="bg-[#1E2530] hover:bg-black text-white rounded-xl h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Imprimir / PDF</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGerar}
                        disabled={gerando}
                        className="rounded-xl h-8 px-2.5 text-xs font-semibold border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/50 flex items-center gap-1.5"
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
                          className="rounded-xl h-8 px-2.5 text-xs font-semibold border-[#C9A46A] text-[#8C6527] bg-[#FAF5EE] hover:bg-[#F3EAD9]"
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

                  {/* Textarea editável com texto do relatório */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Texto editável (ajuste livremente antes de imprimir ou enviar):</span>
                      <span className="font-mono text-[10px]">
                        {conteudoEditavel.length} caracteres
                      </span>
                    </div>
                    <Textarea
                      rows={14}
                      value={conteudoEditavel}
                      onChange={(e) => setConteudoEditavel(e.target.value)}
                      className="font-mono text-xs leading-relaxed rounded-xl border-gray-200 focus-visible:ring-[#8C6527] bg-white p-3.5"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Documento salvo no prontuário:</strong> Este relatório já foi
                      registrado no histórico e na auditoria clínica da Clínica SOUL. Ao clicar em{' '}
                      <strong>"Imprimir / PDF"</strong>, a página abre a caixa nativa de impressão
                      já configurada em papel A4 timbrado oficial.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#E9E1D2] space-y-2">
                  <div className="h-10 w-10 mx-auto rounded-full bg-[#FAF5EE] text-[#8C6527] flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#4A322A]">
                    Nenhum relatório gerado ainda
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Descreva o objetivo ou escolha uma sugestão acima para que o agente especialista
                    da SOUL monte o documento com base nas avaliações e evoluções deste prontuário.
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
                  <h4 className="text-xs sm:text-sm font-bold text-[#4A322A]">
                    Relatórios Anteriores Gerados
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Todos os relatórios criados com IA para esta avaliação ficam salvos e acessíveis
                    aqui.
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
                  <Loader2 className="h-6 w-6 animate-spin text-[#C9A46A] mx-auto" />
                  <span className="text-xs text-gray-500 mt-2 block">Carregando histórico...</span>
                </div>
              ) : historico.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#E9E1D2]">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 font-medium">
                    Ainda não há relatórios emitidos para este prontuário.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAbaInterna('gerador')}
                    className="mt-3 bg-[#4A322A] text-white text-xs rounded-xl"
                  >
                    Criar Primeiro Relatório
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historico.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white rounded-2xl border border-[#E9E1D2] hover:border-[#C9A46A] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#4A322A]">
                            {item.titulo}
                          </span>
                          {item.publico_alvo && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-[#FAF5EE] text-[#8C6527] border border-[#E9E1D2]"
                            >
                              {item.publico_alvo}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1 italic">
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
                          className="bg-[#4A322A] hover:bg-[#33221C] text-white rounded-xl h-8 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
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
  )
}
