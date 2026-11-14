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
} from 'lucide-react'
import { getFileUrl, analisarAnexoIa } from '@/services/avaliacoes'
import type { AnalisarAnexoIaParams, AnexoDadosExtraidos } from '@/services/avaliacoes'
import { prepararAnexoParaIa, TAMANHO_LOTE_PADRAO } from '@/lib/anexoIaPreparo'
import { useToast } from '@/hooks/use-toast'
import type { ResumoAnexoIaItem } from '@/types/database'
import { RevisaoDadosExtraidos, type RevisaoDadosExtraidosHandle } from './AnexosIaRevisao'

interface Etapa6AnexosProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  existingRecordId?: string
  pacienteId?: string
}

const LIMITES_LOTE: Array<number | null> = [TAMANHO_LOTE_PADRAO, 2, 1]

/**
 * Etapa 6 — Exames Complementares e Documentos.
 *
 * A análise de IA é feita em LOTES de páginas (1 requisição por grupo de páginas
 * rasterizadas do PDF), para nunca estourar o limite de tamanho de requisição do
 * backend. Enquanto os lotes rodam, a UI mostra "Analisando página X de Y...".
 * Páginas que falharem não bloqueiam as demais; se ao menos 1 página for lida,
 * o fluxo segue (com aviso do que ficou de fora).
 */
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
  const [progressoMap, setProgressoMap] = useState<Record<string, string>>({})
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

  // Baixar anexo já salvo no prontuário (para "Reanalisar com IA")
  const baixarAnexoSalvo = async (fileName: string): Promise<File | undefined> => {
    if (!existingRecordId) return undefined
    try {
      const urlArquivo = getFileUrl('avaliacoes_fisioterapia', existingRecordId, fileName)
      const resp = await fetch(urlArquivo)
      if (!resp.ok) return undefined
      const blob = await resp.blob()
      return new File([blob], fileName, { type: blob.type || 'application/pdf' })
    } catch (fetchErr) {
      console.warn('Re-download do anexo salvo falhou; seguindo com análise server-side:', fetchErr)
      return undefined
    }
  }

  // Montar os parâmetros de UMA requisição ao hook (um lote de páginas)
  const montarParams = (
    fileOrName: File | string,
    dataUrls: string[],
    nomeArquivo: string,
    arquivoCru?: File,
  ): AnalisarAnexoIaParams => {
    const base = {
      arquivo: dataUrls.length === 0 ? arquivoCru : undefined,
      arquivo_base64s: dataUrls.length > 0 ? dataUrls : undefined,
      nome_arquivo: nomeArquivo,
      paciente_id: pacienteId || formData.paciente_id,
      avaliacao_id: existingRecordId,
      especialidade: 'Fisioterapia',
    }
    if (fileOrName instanceof File) return base
    return {
      ...base,
      collection_name: 'avaliacoes_fisioterapia',
      record_id: existingRecordId,
    }
  }

  /**
   * Executa a análise em lotes de páginas e junta os resultados.
   * - Lote inicial: TAMANHO_LOTE_PADRAO páginas por requisição.
   * - Se a requisição falhar por tamanho, re-renderiza as páginas menores e refaz
   *   o lote em partes menores (2, depois 1 página).
   * - Páginas com falha isolada não derrubam o lote seguinte.
   */
  const analisarEmLotes = async (
    fileOrName: File | string,
    nomeArquivo: string,
    paginas: string[],
    arquivoCru?: File,
  ): Promise<{ resumo: string; dados: AnexoDadosExtraidos | null; aviso?: string }> => {
    let resultados: string[] = []
    let dadosJunta: Partial<AnexoDadosExtraidos> = {}
    let temDado = false
    const falhas: string[] = []

    for (let indiceLote = 0; indiceLote < paginas.length; indiceLote += TAMANHO_LOTE_PADRAO) {
      const lote = paginas.slice(indiceLote, indiceLote + TAMANHO_LOTE_PADRAO)

      const resultadoLote = await analisarLoteComReducao(
        fileOrName,
        nomeArquivo,
        lote,
        arquivoCru,
        (msg) =>
          setProgressoMap((prev) => ({
            ...prev,
            [nomeArquivo]: msg,
          })),
      )
      if (resultadoLote.erro) {
        falhas.push(resultadoLote.erro)
      } else {
        resultados.push(resultadoLote.resumo || '')
        if (resultadoLote.dados) {
          temDado = true
          dadosJunta = { ...dadosJunta, ...resultadoLote.dados }
        }
      }
    }

    const resumoFinal = resultados.filter(Boolean).join('\n\n')
    if (!resumoFinal && falhas.length > 0) {
      throw new Error(falhas[0])
    }

    const avisoFinal =
      falhas.length > 0
        ? `Atenção: ${falhas.length} de ${paginas.length} páginas não puderam ser lidas. As demais foram analisadas normalmente.`
        : undefined

    return {
      resumo: resumoFinal,
      dados: temDado ? (dadosJunta as AnexoDadosExtraidos) : null,
      aviso: avisoFinal,
    }
  }

  // Analisar um lote com retries em tamanhos menores quando o payload é recusado
  const analisarLoteComReducao = async (
    fileOrName: File | string,
    nomeArquivo: string,
    loteOriginal: string[],
    arquivoCru: File | undefined,
    onProgresso: (msg: string) => void,
  ): Promise<{ resumo?: string; dados?: AnexoDadosExtraidos; erro?: string }> => {
    // Tenta o lote completo; se falhar por tamanho (422/413/431), divide e reenvia
    for (let tentativa = 0; tentativa < LIMITES_LOTE.length; tentativa++) {
      const tamanhoLote = LIMITES_LOTE[Math.min(tentativa, LIMITES_LOTE.length - 1)]
      const sublotes: string[][] = []
      for (let i = 0; i < loteOriginal.length; i += tamanhoLote) {
        sublotes.push(loteOriginal.slice(i, i + tamanhoLote))
      }

      const conteudos: string[] = []
      let dados: Partial<AnexoDadosExtraidos> = {}
      let temDado = false
      let erroUltimo = ''
      let ok = true

      for (let s = 0; s < sublotes.length; s++) {
        const sub = sublotes[s]
        const rotulo =
          sub.length === 1
            ? `Analisando página ${s + 1} de ${sublotes.length}...`
            : `Analisando ${sub.length} páginas (bloco ${s + 1} de ${sublotes.length})...`
        onProgresso(rotulo)
        try {
          const params = montarParams(fileOrName, sub, nomeArquivo, arquivoCru)
          const res = await analisarAnexoIa(params)
          if (res?.resumo) conteudos.push(res.resumo)
          if (res?.dados_extraidos) {
            temDado = true
            dados = { ...dados, ...res.dados_extraidos }
          }
          if (res?.aviso) {
            // aviso do servidor (ex.: documento truncado) é apenas informativo
            conteudos.push(`(aviso do servidor: ${res.aviso})`)
          }
        } catch (err: any) {
          const msg = String(err?.message || '')
          erroUltimo = msg
          ok = false
          // 413/422/431 → payload recusado por tamanho; divide e tenta de novo
          if (/413|422|431|too large|entidade|entity|payload/i.test(msg)) {
            break
          }
          // Outros erros (IA indisponível etc.): não adianta dividir
          return { erro: msg }
        }
      }

      if (ok) {
        const resumo = conteudos.filter(Boolean).join('\n\n')
        return {
          resumo,
          dados: temDado ? (dados as AnexoDadosExtraidos) : undefined,
        }
      }
      // Se já estamos no menor lote (1 página) e ainda assim falhou, desiste
      if (tamanhoLote === 1) {
        return { erro: erroUltimo }
      }
      // Senão, loop continua com o próximo tamanho de sublote
    }
    return { erro: 'Falha ao analisar o lote de páginas' }
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

      let arquivoParaPreparo: File | undefined = isFileObject ? fileOrName : undefined
      if (!arquivoParaPreparo) {
        arquivoParaPreparo = await baixarAnexoSalvo(fileName)
      }

      setProgressoMap((prev) => ({
        ...prev,
        [fileName]: arquivoParaPreparo ? 'Preparando documento para leitura...' : 'Lendo com IA...',
      }))

      const preparo = arquivoParaPreparo
        ? await prepararAnexoParaIa(arquivoParaPreparo)
        : { dataUrls: [] as string[], aviso: undefined }

      if (preparo.aviso) {
        toast({
          title: 'Anexo preparado com ressalva',
          description: preparo.aviso,
        })
      }

      // Sem páginas rasterizadas: envia o arquivo cru (hook tenta $documents)
      if (preparo.dataUrls.length === 0) {
        if (!arquivoParaPreparo) {
          throw new Error(
            'Não foi possível obter o arquivo do anexo para leitura por IA. Tente novamente.',
          )
        }
        setProgressoMap((prev) => ({ ...prev, [fileName]: 'Lendo com IA...' }))
        const res = await analisarAnexoIa(
          montarParams(fileOrName, [], fileName, preparo.arquivoCru),
        )
        if (!res?.resumo) {
          throw new Error(
            res?.aviso ||
              'A IA não conseguiu ler o conteúdo do anexo. Verifique a nitidez e tente novamente.',
          )
        }
        atualizarResumo(fileName, res.resumo, false, {
          analisado_em: new Date().toISOString(),
          analisado_por: 'IA SOUL (leitor de documentos)',
          truncated: !!res.truncated,
        })
        setDadosExtraidosMap((prev) => ({ ...prev, [fileName]: res.dados_extraidos || null }))
        setConfirmadoMap((prev) => ({ ...prev, [fileName]: false }))
        setExpandidoMap((prev) => ({ ...prev, [fileName]: true }))
        if (res.aviso) {
          toast({ title: 'Análise concluída com ressalvas', description: res.aviso })
        } else {
          toast({
            title: 'Análise de anexo concluída!',
            description: res.dados_extraidos
              ? `A IA extraiu os dados de "${fileName}". Confira e confirme para preencher o prontuário.`
              : `A IA leu "${fileName}" e gerou a síntese clínica. Edite se necessário.`,
          })
        }
        return
      }

      // Com páginas: análise em lotes
      const resultado = await analisarEmLotes(fileOrName, fileName, preparo.dataUrls)

      if (preparo.aviso) {
        // já exibido em toast; nada adicional
      }

      const resumo = resultado.resumo
      if (!resumo) {
        throw new Error(
          resultado.aviso ||
            'A IA não conseguiu ler o conteúdo do anexo. Verifique a nitidez e tente novamente.',
        )
      }

      atualizarResumo(fileName, resumo, false, {
        analisado_em: new Date().toISOString(),
        analisado_por: 'IA SOUL (leitor de documentos)',
        truncated: false,
      })
      setDadosExtraidosMap((prev) => ({ ...prev, [fileName]: resultado.dados || null }))
      setConfirmadoMap((prev) => ({ ...prev, [fileName]: false }))
      setExpandidoMap((prev) => ({ ...prev, [fileName]: true }))

      if (resultado.aviso) {
        toast({
          title: 'Análise concluída com ressalvas',
          description: resultado.aviso,
        })
      } else {
        toast({
          title: 'Análise de anexo concluída!',
          description: resultado.dados
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

  const removePendingFile = (index: [number] | number) => {
    const existing: File[] = formData._pending_exames_files || []
    const idx = Array.isArray(index) ? index[0] : index
    const fileToRemove = existing[idx]
    if (fileToRemove) {
      const copyResumos = { ...resumosAnexos }
      delete copyResumos[fileToRemove.name]
      onChange('resumos_anexos', copyResumos)
    }
    onChange(
      '_pending_exames_files',
      existing.filter((_, i) => i !== idx),
    )
  }

  const renderCardArquivo = (
    nome: string,
    opts: {
      isImg?: boolean
      fileUrl?: string
      file?: File
      idx?: number
      pendente: boolean
    },
  ) => {
    const resumoItem = resumosAnexos[nome]
    const isAnalisando = !!analisandoMap[nome]
    const erroMsg = erroMap[nome]
    const isEditando = !!editandoMap[nome]
    const isExpandido = expandidoMap[nome] ?? (!!resumoItem?.resumo || isAnalisando)

    return (
      <div
        key={nome}
        className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs text-xs space-y-2.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            {opts.isImg && opts.fileUrl ? (
              <img
                src={opts.fileUrl}
                alt="Preview exame"
                className="h-8 w-8 object-cover rounded-lg border border-gray-200 shrink-0"
              />
            ) : (
              <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span className="truncate font-medium text-gray-900">{nome}</span>
            {opts.file && (
              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                ({(opts.file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              disabled={isAnalisando}
              onClick={() => handleAnalisarArquivo(opts.file ?? nome)}
              className={`rounded-xl h-7 px-3 text-[11px] font-semibold flex items-center gap-1.5 ${
                resumoItem?.resumo
                  ? 'bg-[#FAF5EE] text-[#8C6527] hover:bg-[#F3EAD9] border border-[#E9E1D2]'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              {isAnalisando ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {progressoMap[nome] || 'Lendo com IA...'}
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

            {opts.pendente && (
              <button
                type="button"
                onClick={() => removePendingFile(opts.idx ?? 0)}
                className="text-red-500 hover:text-red-700 p-1 rounded-lg"
                title="Remover anexo pendente"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
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
              onClick={() => handleAnalisarArquivo(opts.file ?? nome)}
              className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Resumo Gerado (visível e editável) */}
        {resumoItem && isExpandido && (
          <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E9E1D2] space-y-1.5">
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
                onClick={() => setEditandoMap((prev) => ({ ...prev, [nome]: !isEditando }))}
                className="text-[11px] text-[#8C6527] hover:underline font-semibold flex items-center gap-1"
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
                onChange={(e) => atualizarResumo(nome, e.target.value, true)}
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
          ref={registrarRefRevisao(nome)}
          nomeArquivo={nome}
          dados={dadosExtraidosMap[nome] || null}
          confirmado={!!confirmadoMap[nome]}
          valorAtualCampo={formData.historico_medico || ''}
          onConfirmar={handleConfirmarDados}
        />
      </div>
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
              return renderCardArquivo(filename, { isImg, fileUrl, pendente: false, idx })
            })}
          </div>
        </div>
      )}

      {/* Arquivos Selecionados nesta Sessão */}
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
              const isImg = file.type.startsWith('image/')
              const fileUrl = isImg ? URL.createObjectURL(file) : undefined
              return renderCardArquivo(file.name, { isImg, fileUrl, file, idx, pendente: true })
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
