import React, { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Paperclip,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { getFileUrl, analisarAnexoIa } from '@/services/avaliacoes'
import type { AnexoDadosExtraidos } from '@/services/avaliacoes'
import { useToast } from '@/hooks/use-toast'
import type { ResumoAnexoIaItem } from '@/types/database'
import { RevisaoDadosExtraidos, type RevisaoDadosExtraidosHandle } from './AnexosIaRevisao'

interface Etapa6AnexosProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  existingRecordId?: string
  pacienteId?: string
}

export const Etapa6Anexos: React.FC<Etapa6AnexosProps> = ({
  formData,
  onChange,
  existingRecordId,
  pacienteId,
}) => {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de processamento de IA por arquivo
  const [analisandoMap, setAnalisandoMap] = useState<Record<string, boolean>>({})
  const [erroMap, setErroMap] = useState<Record<string, string>>({})
  const [editandoMap, setEditandoMap] = useState<Record<string, boolean>>({})
  const [expandidoMap, setExpandidoMap] = useState<Record<string, boolean>>({})
  const [dadosExtraidosMap, setDadosExtraidosMap] = useState<
    Record<string, AnexoDadosExtraidos | null>
  >({})
  const [confirmadoMap, setConfirmadoMap] = useState<Record<string, boolean>>({})

  // Refs para a revisão estruturada de cada arquivo (permite salvar as edições do profissional)
  const revisaoRefs = useRef<Record<string, RevisaoDadosExtraidosHandle | null>>({})
  const registrarRefRevisao = (nome: string) => (el: RevisaoDadosExtraidosHandle | null) => {
    revisaoRefs.current[nome] = el
  }

  const resumosAnexos: Record<string, ResumoAnexoIaItem> = formData.resumos_anexos || {}

  // Atualizar o resumo de um arquivo específico
  const atualizarResumo = (
    nomeArquivo: string,
    novoResumo: string,
    editadoManualmente = true,
    dadosExtras?: Partial<ResumoAnexoIaItem>,
  ) => {
    const atual = resumosAnexos[nomeArquivo] || {
      nome_arquivo: nomeArquivo,
      resumo: '',
      analisado_em: new Date().toISOString(),
    }

    const atualizado: Record<string, ResumoAnexoIaItem> = {
      ...resumosAnexos,
      [nomeArquivo]: {
        ...atual,
        ...dadosExtras,
        nome_arquivo: nomeArquivo,
        resumo: novoResumo,
        editado_manualmente: editadoManualmente,
      },
    }

    onChange('resumos_anexos', atualizado)
  }

  // Chamar análise de IA para um arquivo
  const handleAnalisarArquivo = async (fileOrName: File | string) => {
    const isFileObject = fileOrName instanceof File
    const fileName = isFileObject ? fileOrName.name : fileOrName

    try {
      setAnalisandoMap((prev) => ({ ...prev, [fileName]: true }))
      setErroMap((prev) => {
        const copy = { ...prev }
        delete copy[fileName]
        return copy
      })

      const params = isFileObject
        ? {
            arquivo: fileOrName,
            paciente_id: pacienteId || formData.paciente_id,
            avaliacao_id: existingRecordId,
            especialidade: 'Fisioterapia',
          }
        : {
            nome_arquivo: fileName,
            collection_name: 'avaliacoes_fisioterapia',
            record_id: existingRecordId,
            paciente_id: pacienteId || formData.paciente_id,
            avaliacao_id: existingRecordId,
            especialidade: 'Fisioterapia',
          }

      const res = await analisarAnexoIa(params)

      if (res && res.resumo) {
        atualizarResumo(fileName, res.resumo, false, {
          analisado_em: res.analisado_em,
          analisado_por: res.analisado_por,
          truncated: res.truncated,
        })

        // Guardar os dados estruturados para o painel de revisão
        setDadosExtraidosMap((prev) => ({ ...prev, [fileName]: res.dados_extraidos || null }))
        setConfirmadoMap((prev) => ({ ...prev, [fileName]: false }))

        // Expandir card para visualização imediata
        setExpandidoMap((prev) => ({ ...prev, [fileName]: true }))

        const temDadosEstruturados = !!(
          res.dados_extraidos && Object.values(res.dados_extraidos).some((v) => v)
        )
        toast({
          title: 'Análise de anexo concluída!',
          description: temDadosEstruturados
            ? `A IA extraiu os dados de "${fileName}". Confira e confirme para preencher o prontuário.`
            : `A IA leu "${fileName}" e gerou a síntese clínica. Edite se necessário.`,
        })
      }
    } catch (err: any) {
      console.error('Erro na análise do anexo com IA:', err)
      const msg = err?.message || 'Falha ao processar arquivo com IA'
      setErroMap((prev) => ({ ...prev, [fileName]: msg }))
      toast({
        title: 'Não foi possível analisar o anexo',
        description: `${msg}. Seus dados do formulário continuam 100% preservados.`,
        variant: 'destructive',
      })
    } finally {
      setAnalisandoMap((prev) => ({ ...prev, [fileName]: false }))
    }
  }

  // Confirmar os dados extraídos pela IA: preenche o campo de destino do prontuário
  // (Histórico Médico, na Etapa 1 — Anamnese) acrescentando ao conteúdo existente.
  const handleConfirmarDados = (nomeArquivo: string, dados: AnexoDadosExtraidos | null) => {
    if (!dados) return

    const partes: string[] = []
    if (dados.tipo_exame) partes.push(`Exame: ${dados.tipo_exame}`)
    if (dados.data_exame) partes.push(`Data: ${dados.data_exame}`)
    if (dados.laboratorio) partes.push(`Laboratório: ${dados.laboratorio}`)
    if (dados.achados) partes.push(`Achados: ${dados.achados}`)
    if (dados.valores_referencia) partes.push(`Valores de referência: ${dados.valores_referencia}`)
    if (dados.conclusao) partes.push(`Conclusão: ${dados.conclusao}`)

    if (partes.length === 0) {
      toast({
        title: 'Nada para preencher',
        description:
          'A IA não extraiu informações deste documento. Você pode preencher os campos manualmente como antes.',
        variant: 'destructive',
      })
      return
    }

    const textoNovo = `[${nomeArquivo}]\n${partes.join('\n')}`
    const atual = String(formData.historico_medico || '').trim()

    onChange('historico_medico', atual ? `${atual}\n\n${textoNovo}` : textoNovo)

    setConfirmadoMap((prev) => ({ ...prev, [nomeArquivo]: true }))
    toast({
      title: 'Prontuário preenchido!',
      description: `Os dados de "${nomeArquivo}" foram lançados no Histórico Médico (Etapa 1 — Anamnese).`,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newFiles = Array.from(files)
    const existing = formData._pending_exames_files || []
    onChange('_pending_exames_files', [...existing, ...newFiles])

    // Disparar análise automática em segundo plano para conveniência do profissional
    newFiles.forEach((file) => {
      handleAnalisarArquivo(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePendingFile = (index: number) => {
    const existing: File[] = formData._pending_exames_files || []
    const fileToRemove = existing[index]
    if (fileToRemove) {
      const copyResumos = { ...resumosAnexos }
      delete copyResumos[fileToRemove.name]
      onChange('resumos_anexos', copyResumos)
    }
    onChange(
      '_pending_exames_files',
      existing.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E9E1D2]">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-[#8C6527]" />
            <h4 className="text-base font-bold text-gray-900">
              Exames Complementares & Documentos Clínicos
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-600" /> Leitura por IA
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Anexe laudos, imagens de Ressonância Magnética, Raios-X, Ultrassonografias ou relatórios
            médicos trazidos pelo paciente (PDF, PNG, JPG). Ao anexar, a IA lê e resume os
            principais achados para apoiar a hipótese clínica final.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,application/pdf"
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl h-9 px-4 flex items-center gap-1.5 shadow-sm"
          >
            <UploadCloud className="h-4 w-4" />
            Anexar Exames (Múltiplos)
          </Button>
        </div>
      </div>

      {/* Caixa de Descrição e Laudos Manual */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-700">
          Descrição dos Exames Complementares e Tratamentos Anteriores
        </Label>
        <Textarea
          rows={3}
          value={formData.historico_medico || ''}
          onChange={(e) => onChange('historico_medico', e.target.value)}
          placeholder="Ex: RM Ombro E (15/01/2026): Ruptura parcial articular de 4mm do tendão supraespinal, bursite subacromial discreta. Tratamentos anteriores: 10 sessões de fisioterapia analgésica e infiltração corticoide há 3 meses..."
          className="rounded-2xl text-xs sm:text-sm"
        />
      </div>

      {/* Arquivos já persistidos no backend com Resumos por IA */}
      {formData.anexos_exames && formData.anexos_exames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-700 block">
              Exames já anexados ao prontuário ({formData.anexos_exames.length}):
            </Label>
            <span className="text-[11px] text-gray-400">
              Clique em &quot;Analisar com IA&quot; para sintetizar o conteúdo do laudo
            </span>
          </div>

          <div className="space-y-3">
            {formData.anexos_exames.map((filename: string, idx: number) => {
              const fileUrl = existingRecordId
                ? getFileUrl('avaliacoes_fisioterapia', existingRecordId, filename)
                : '#'
              const isImg = !!filename.match(/\.(jpg|jpeg|png|webp)$/i)
              const resumoItem = resumosAnexos[filename]
              const isAnalisando = !!analisandoMap[filename]
              const erroMsg = erroMap[filename]
              const isEditando = !!editandoMap[filename]
              const isExpandido = expandidoMap[filename] ?? (!!resumoItem?.resumo || isAnalisando)

              return (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3 hover:border-gray-300 transition-colors"
                >
                  {/* Linha Principal do Arquivo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {isImg ? (
                        <img
                          src={fileUrl}
                          alt="Preview exame"
                          className="h-10 w-10 object-cover rounded-xl border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                          PDF
                        </div>
                      )}
                      <div className="truncate">
                        <span
                          className="text-xs font-semibold text-gray-900 block truncate"
                          title={filename}
                        >
                          {filename}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            Visualizar original
                          </a>
                          {resumoItem?.resumo && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Sparkles className="h-3 w-3" /> Resumido por IA
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isAnalisando}
                        onClick={() => handleAnalisarArquivo(filename)}
                        className={`rounded-xl h-8 text-xs font-semibold flex items-center gap-1.5 shadow-xs ${
                          resumoItem?.resumo
                            ? 'bg-[#FAF5EE] text-[#8C6527] hover:bg-[#F3EAD9] border border-[#E9E1D2]'
                            : 'bg-gradient-to-r from-[#1E2530] to-[#2A3444] text-white hover:brightness-110'
                        }`}
                      >
                        {isAnalisando ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analisando laudo...
                          </>
                        ) : resumoItem?.resumo ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 text-[#8C6527]" />
                            Reanalisar com IA
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-[#DFBF8E]" />
                            Analisar com IA
                          </>
                        )}
                      </Button>

                      {resumoItem?.resumo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setExpandidoMap((prev) => ({ ...prev, [filename]: !isExpandido }))
                          }
                          className="h-8 w-8 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                          title={isExpandido ? 'Recolher resumo' : 'Expandir resumo'}
                        >
                          {isExpandido ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Estado de Erro na Análise */}
                  {erroMsg && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>{erroMsg}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAnalisarArquivo(filename)}
                        className="h-7 text-xs font-bold text-amber-900 hover:bg-amber-100 rounded-lg shrink-0"
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  )}

                  {/* Card do Resumo por Escrito da IA (Visível e Editável) */}
                  {resumoItem && isExpandido && (
                    <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E9E1D2] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#8C6527]" />
                          <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                            Síntese Clínica dos Resultados (IA)
                          </span>
                          {resumoItem.editado_manualmente && (
                            <span className="text-[10px] text-gray-500 font-medium">
                              (editado pelo profissional)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditandoMap((prev) => ({ ...prev, [filename]: !isEditando }))
                          }
                          className="text-xs text-[#8C6527] hover:underline font-semibold flex items-center gap-1"
                        >
                          {isEditando ? (
                            <>
                              <Check className="h-3 w-3" /> Concluir edição
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-3 w-3" /> Editar síntese
                            </>
                          )}
                        </button>
                      </div>

                      {isEditando ? (
                        <Textarea
                          rows={4}
                          value={resumoItem.resumo}
                          onChange={(e) => atualizarResumo(filename, e.target.value, true)}
                          className="text-xs bg-white rounded-xl border-gray-300 leading-relaxed font-sans"
                          placeholder="Edite ou complemente o resumo clínico do laudo..."
                        />
                      ) : (
                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-sans bg-white/70 p-2.5 rounded-xl border border-gray-100">
                          {resumoItem.resumo}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                        <span>
                          {resumoItem.analisado_em
                            ? `Sintetizado em ${new Date(resumoItem.analisado_em).toLocaleDateString('pt-BR')} ${new Date(resumoItem.analisado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Analisado com IA SOUL'}
                        </span>
                        <span className="text-[#8C6527] font-medium">
                          Alimenta a Hipótese Diagnóstica e o Raciocínio Clínico final
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Revisão dos dados extraídos pela IA (confirmar → preenche o prontuário) */}
                  <RevisaoDadosExtraidos
                    ref={registrarRefRevisao(filename)}
                    nomeArquivo={filename}
                    dados={dadosExtraidosMap[filename] || null}
                    confirmado={!!confirmadoMap[filename]}
                    valorAtualCampo={formData.historico_medico || ''}
                    onConfirmar={handleConfirmarDados}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Arquivos Selecionados nesta Sessão (Aguardando Salvar com Suporte a IA) */}
      {formData._pending_exames_files && formData._pending_exames_files.length > 0 && (
        <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Novos exames anexados ({formData._pending_exames_files.length}):
            </Label>
            <span className="text-[11px] text-emerald-800">
              Arquivos lidos com IA entram no raciocínio da avaliação
            </span>
          </div>

          <div className="space-y-3">
            {formData._pending_exames_files.map((file: File, idx: number) => {
              const resumoItem = resumosAnexos[file.name]
              const isAnalisando = !!analisandoMap[file.name]
              const erroMsg = erroMap[file.name]
              const isEditando = !!editandoMap[file.name]
              const isExpandido = expandidoMap[file.name] ?? (!!resumoItem?.resumo || isAnalisando)

              return (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-2.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium text-gray-900">{file.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isAnalisando}
                        onClick={() => handleAnalisarArquivo(file)}
                        className={`rounded-xl h-7 px-3 text-[11px] font-semibold flex items-center gap-1.5 ${
                          resumoItem?.resumo
                            ? 'bg-[#FAF5EE] text-[#8C6527] hover:bg-[#F3EAD9] border border-[#E9E1D2]'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        {isAnalisando ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Lendo com IA...
                          </>
                        ) : resumoItem?.resumo ? (
                          <>
                            <RefreshCw className="h-3 w-3 text-[#8C6527]" />
                            Reanalisar
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            Analisar com IA
                          </>
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => removePendingFile(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg"
                        title="Remover anexo pendente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alerta de Erro */}
                  {erroMsg && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        {erroMsg}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAnalisarArquivo(file)}
                        className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {/* Resumo Gerado para o Arquivo Novo */}
                  {resumoItem && isExpandido && (
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-emerald-950 font-bold text-[11px]">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          <span>Síntese Clínica do Anexo:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEditandoMap((prev) => ({ ...prev, [file.name]: !isEditando }))
                          }
                          className="text-[11px] text-emerald-800 hover:underline font-semibold flex items-center gap-1"
                        >
                          {isEditando ? (
                            <>
                              <Check className="h-3 w-3" /> Concluir edição
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-3 w-3" /> Editar síntese
                            </>
                          )}
                        </button>
                      </div>

                      {isEditando ? (
                        <Textarea
                          rows={3}
                          value={resumoItem.resumo}
                          onChange={(e) => atualizarResumo(file.name, e.target.value, true)}
                          className="text-xs bg-white rounded-lg border-emerald-300 leading-relaxed font-sans"
                        />
                      ) : (
                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap bg-white p-2 rounded-lg border border-emerald-100 font-sans">
                          {resumoItem.resumo}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Revisão dos dados extraídos pela IA (confirmar → preenche o prontuário) */}
                  <RevisaoDadosExtraidos
                    ref={registrarRefRevisao(file.name)}
                    nomeArquivo={file.name}
                    dados={dadosExtraidosMap[file.name] || null}
                    confirmado={!!confirmadoMap[file.name]}
                    valorAtualCampo={formData.historico_medico || ''}
                    onConfirmar={handleConfirmarDados}
                  />
                </div>
              )
            })}
          </div>

          <p className="text-[11px] text-emerald-700">
            Estes arquivos e suas sínteses clínicas serão gravados automaticamente na nuvem ao
            salvar rascunho ou concluir a avaliação.
          </p>
        </div>
      )}
    </div>
  )
}
