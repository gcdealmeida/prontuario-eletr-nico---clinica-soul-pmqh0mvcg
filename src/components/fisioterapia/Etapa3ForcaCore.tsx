import React, { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Zap,
  Paperclip,
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react'
import { getFileUrl, extrairDinamometroArquivo } from '@/services/avaliacoes'
import { useToast } from '@/hooks/use-toast'

interface Etapa3ForcaCoreProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  existingRecordId?: string
}

export const Etapa3ForcaCore: React.FC<Etapa3ForcaCoreProps> = ({
  formData,
  onChange,
  existingRecordId,
}) => {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractMsg, setExtractMsg] = useState<string | null>(null)

  // O valor da descrição aberta de força
  const descricaoForca = formData.forca_muscular_descricao ?? ''

  // Função para lidar com o anexo do dinamômetro e extração automática
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    const existing = formData._pending_dinamometro_files || []
    onChange('_pending_dinamometro_files', [...existing, ...newFiles])

    // Resetar input para permitir selecionar o mesmo arquivo se quiser
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Processar extração automática do(s) arquivo(s)
    const fileToExtract = newFiles[0]
    if (!fileToExtract) return

    setExtracting(true)
    setExtractMsg(`Lendo e transferindo dados de "${fileToExtract.name}"...`)

    try {
      // Se for arquivo de texto ou CSV simples, podemos também ler texto local para agilizar
      let localText: string | undefined
      if (
        fileToExtract.type === 'text/csv' ||
        fileToExtract.type === 'text/plain' ||
        fileToExtract.name.endsWith('.csv') ||
        fileToExtract.name.endsWith('.txt')
      ) {
        try {
          localText = await fileToExtract.text()
        } catch {
          /* intentionally ignored */
        }
      }

      const res = await extrairDinamometroArquivo(fileToExtract, localText)

      if (res && res.resumo) {
        // Transferir os dados do dinamômetro automaticamente para a caixa de descrição aberta
        const headerInfo = `\n\n--- DADOS EXTRAÍDOS DO DINAMÔMETRO (${fileToExtract.name}) ---\n`
        const textoNovo = descricaoForca
          ? `${descricaoForca.trim()}${headerInfo}${res.resumo.trim()}`
          : `${headerInfo.trim()}\n${res.resumo.trim()}`

        onChange('forca_muscular_descricao', textoNovo)

        toast({
          title: 'Dados do dinamômetro transferidos!',
          description:
            res.aviso ||
            'As leituras do dinamômetro foram resumidas e inseridas na caixa de descrição.',
        })
      } else {
        toast({
          title: 'Arquivo anexado com sucesso',
          description:
            'Não foi possível extrair tabelas de força legíveis automaticamente, mas o anexo foi salvo.',
        })
      }
    } catch (err: any) {
      console.warn('Falha na extração automática do dinamômetro:', err)
      toast({
        title: 'Arquivo anexado ao prontuário',
        description:
          'O arquivo foi anexado. Você pode descrever as leituras manualmente na caixa de texto abaixo.',
      })
    } finally {
      setExtracting(false)
      setExtractMsg(null)
    }
  }

  const handleRemovePending = (index: number) => {
    const list = [...(formData._pending_dinamometro_files || [])]
    list.splice(index, 1)
    onChange('_pending_dinamometro_files', list)
  }

  const handleInserirModeloPadrao = () => {
    const modelo = `AVALIAÇÃO DE FORÇA MUSCULAR & DINAMOMETRIA MANUAL

1. DINAMOMETRIA MANUAL (kgf):
- Manguito Rotador / Rotadores Externos: Direito: ___ kgf | Esquerdo: ___ kgf (Déficit: ___%)
- Manguito Rotador / Rotadores Internos: Direito: ___ kgf | Esquerdo: ___ kgf (Déficit: ___%)
- Abdutores de Quadril (Glúteo Médio): Direito: ___ kgf | Esquerdo: ___ kgf (Déficit: ___%)
- Extensores de Joelho (Quadríceps): Direito: ___ kgf | Esquerdo: ___ kgf (Déficit: ___%)
- Flexores de Joelho (Isquiotibiais): Direito: ___ kgf | Esquerdo: ___ kgf (Déficit: ___%)
- Preensão Palmar (Handgrip): Direito: ___ kgf | Esquerdo: ___ kgf

2. GRADUAÇÃO DE FORÇA MANUAL (Escala MRC 0 a 5):
- Cintura escapular e MMSS: Grau ___/5
- Estabilizadores de tronco / Core: Grau ___/5
- Cintura pélvica e MMII: Grau ___/5

3. OBSERVAÇÕES CLÍNICAS & COMPENSAÇÕES:
- Presença de dor durante contração isométrica? Não / Sim
- Fadiga precoce, tremor ou assimetrias funcionais evidentes: `

    if (descricaoForca.trim()) {
      onChange('forca_muscular_descricao', `${descricaoForca}\n\n${modelo}`)
    } else {
      onChange('forca_muscular_descricao', modelo)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
              <Zap className="h-4 w-4" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Teste de Força Muscular & Dinamometria
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Descreva livremente os resultados da avaliação de força (graduação MRC 0–5, grupos
            musculares avaliados, valores do dinamômetro manual em kgf/lbs e observações).
          </p>
        </div>

        {/* Botão de Anexo com Extração Automática de Dinamômetro */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,application/pdf,.csv,.txt,.xlsx"
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleInserirModeloPadrao}
            className="rounded-xl border-[#E9E1D2] text-[#8C6527] hover:bg-[#FAF5EE] text-xs font-semibold h-9"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Inserir Modelo Guia
          </Button>

          <Button
            type="button"
            disabled={extracting}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-[#1E2530] hover:bg-black text-white text-xs font-semibold h-9 shadow-sm flex items-center gap-1.5"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#DFBF8E]" />
                Processando arquivo...
              </>
            ) : (
              <>
                <Paperclip className="h-4 w-4 text-[#DFBF8E]" />
                Anexar Avaliação Dinamômetro
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerta de carregamento / extração de dados */}
      {extracting && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900 animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin text-[#8C6527] shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold">Transferindo dados do dinamômetro automaticamente...</p>
            <p className="text-amber-700 text-[11px]">
              {extractMsg ||
                'Lendo leituras de força, lados direito/esquerdo e calculando assimetrias para inserir na descrição.'}
            </p>
          </div>
        </div>
      )}

      {/* Caixa de Descrição Aberta */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>Descrição Aberta da Avaliação de Força & Dinamômetro</span>
            <span className="text-[10px] text-[#8C6527] font-semibold px-2 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E9E1D2]">
              Descrição Livre
            </span>
          </Label>

          <span className="text-[11px] text-gray-400">{descricaoForca.length} caracteres</span>
        </div>

        <Textarea
          rows={12}
          value={descricaoForca}
          onChange={(e) => onChange('forca_muscular_descricao', e.target.value)}
          placeholder="Exemplo de descrição:
- Avaliação realizada via dinamômetro manual Lafayette/MicroFET.
- Rotadores Externos de Ombro: Direito 12,4 kgf | Esquerdo 9,8 kgf (Déficit contralateral de 21% no lado acometido).
- Rotadores Internos: Direito 16,0 kgf | Esquerdo 15,2 kgf (Simétricos).
- Extensores de Joelho: Direito 38 kgf | Esquerdo 36 kgf.
- Teste manual MRC: Manguito rotador grau 4/5 à esquerda com dor leve em fim de curso; estabilizadores escapulares grau 4/5 bilateral.
- Observações: compensação com elevação escapular e báscula anterior no teste do lado esquerdo."
          className="rounded-2xl text-xs sm:text-sm font-mono sm:font-sans leading-relaxed border-gray-200 focus-visible:ring-[#C9A46A] p-4 bg-white"
        />

        <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
          <Info className="h-4 w-4 text-[#8C6527] shrink-0 mt-0.5" />
          <span>
            Ao anexar fotos, laudos em PDF ou relatórios do dinamômetro pelo botão acima, os valores
            identificados são transferidos <strong>automaticamente</strong> para esta caixa de
            texto, permitindo que você edite, complemente ou reorganize as informações livremente.
          </span>
        </div>
      </div>

      {/* Lista de Arquivos Anexados (Já Salvos no Prontuário ou Pendentes de Salvamento) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <UploadCloud className="h-4 w-4 text-blue-600" />
            Arquivos Anexados do Dinamômetro
          </span>
          <span className="text-[11px] text-gray-400">
            {(formData.anexos_dinamometro?.length || 0) +
              (formData._pending_dinamometro_files?.length || 0)}{' '}
            arquivo(s)
          </span>
        </div>

        {(formData._pending_dinamometro_files && formData._pending_dinamometro_files.length > 0) ||
        (formData.anexos_dinamometro && formData.anexos_dinamometro.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {/* Arquivos já persistidos */}
            {formData.anexos_dinamometro?.map((file: string) => (
              <div
                key={file}
                className="p-3 bg-white rounded-2xl border border-blue-200 text-xs flex items-center justify-between gap-2 shadow-2xs hover:border-blue-400 transition-colors"
              >
                <a
                  href={
                    existingRecordId
                      ? getFileUrl('avaliacoes_fisioterapia', existingRecordId, file)
                      : '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-blue-800 hover:underline truncate"
                >
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate font-medium">{file}</span>
                </a>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold shrink-0">
                  Salvo
                </span>
              </div>
            ))}

            {/* Arquivos pendentes recém-anexados */}
            {formData._pending_dinamometro_files?.map((f: File, i: number) => (
              <div
                key={i}
                className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {f.name.endsWith('.pdf') ? (
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : f.name.endsWith('.csv') || f.name.endsWith('.xlsx') ? (
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="truncate font-medium text-emerald-950 block">{f.name}</span>
                    <span className="text-[10px] text-emerald-700 block">
                      Transferido para avaliação • Aguardando salvar
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePending(i)}
                  className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                  title="Remover anexo pendente"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 rounded-2xl border border-dashed border-gray-200 hover:border-[#C9A46A] bg-gray-50/50 hover:bg-[#FAF5EE]/30 cursor-pointer transition-all text-center space-y-2"
          >
            <div className="h-10 w-10 mx-auto rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
              <Paperclip className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">
                Nenhum arquivo de dinamômetro anexado ainda
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Clique para anexar fotos, prints, PDFs ou relatórios do dinamômetro. Os dados serão
                extraídos e transferidos para a caixa de descrição automaticamente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
