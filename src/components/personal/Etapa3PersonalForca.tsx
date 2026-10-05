import React, { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Zap,
  Paperclip,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
  Trash2,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  TrendingDown,
} from 'lucide-react'
import { getFileUrl, extrairDinamometroArquivo } from '@/services/avaliacoes'
import { useToast } from '@/hooks/use-toast'

interface MovimentoDinamometro {
  id: string
  nome: string
  direitoKgf?: number | string
  esquerdoKgf?: number | string
  assimetriaPct?: number | string
  forcaRelativaD?: number | string
  forcaRelativaE?: number | string
}

const MOVIMENTOS_PADRAO: Array<{ id: string; nome: string }> = [
  { id: 'preensao_palmar', nome: 'Preensão Palmar (Handgrip)' },
  { id: 'flexores_tronco', nome: 'Flexores de Tronco' },
  { id: 'extensores_tronco', nome: 'Extensores de Tronco / Coluna' },
  { id: 'quadriceps', nome: 'Quadríceps / Extensores Joelho' },
  { id: 'flexores_cotovelo', nome: 'Flexores de Cotovelo (Bíceps)' },
  { id: 'abdutores_ombro', nome: 'Abdutores de Ombro' },
  { id: 'adutores_quadril', nome: 'Adutores de Quadril' },
  { id: 'abdutores_quadril', nome: 'Abdutores de Quadril (Glúteo Médio)' },
]

interface Etapa3PersonalForcaProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  existingRecordId?: string
}

export const Etapa3PersonalForca: React.FC<Etapa3PersonalForcaProps> = ({
  formData,
  onChange,
  existingRecordId,
}) => {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractMsg, setExtractMsg] = useState<string | null>(null)

  const pesoKg = Number(formData.peso || formData.anamnese_personal?.peso || 70)
  const forcaDados = formData.forca_dinamometro || {}
  const descricaoForca = formData.forca_muscular_descricao ?? ''

  // Mapear movimentos preenchidos
  const movimentosSalvos: MovimentoDinamometro[] = forcaDados.movimentos || []

  const getMovimentoVal = (id: string) => {
    return movimentosSalvos.find((m) => m.id === id) || { id, nome: '' }
  }

  const handleUpdateMovimento = (
    id: string,
    nome: string,
    campo: 'direitoKgf' | 'esquerdoKgf',
    valorStr: string,
  ) => {
    const num = valorStr === '' ? '' : parseFloat(valorStr) || 0
    const list = [...movimentosSalvos]
    let item = list.find((m) => m.id === id)

    if (!item) {
      item = { id, nome }
      list.push(item)
    }

    item[campo] = num

    // Recalcular assimetria e força relativa
    const d = Number(item.direitoKgf) || 0
    const e = Number(item.esquerdoKgf) || 0

    if (d > 0 && e > 0) {
      const maxVal = Math.max(d, e)
      const diff = Math.abs(d - e)
      item.assimetriaPct = Number(((diff / maxVal) * 100).toFixed(1))
    } else {
      item.assimetriaPct = ''
    }

    if (pesoKg > 0) {
      item.forcaRelativaD = d > 0 ? Number((d / pesoKg).toFixed(2)) : ''
      item.forcaRelativaE = e > 0 ? Number((e / pesoKg).toFixed(2)) : ''
    }

    onChange('forca_dinamometro', { ...forcaDados, movimentos: list })
  }

  // Upload e extração do dinamômetro
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    const existing = formData._pending_dinamometro_files || []
    onChange('_pending_dinamometro_files', [...existing, ...newFiles])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    const fileToExtract = newFiles[0]
    if (!fileToExtract) return

    setExtracting(true)
    setExtractMsg(`Lendo e transferindo dados de "${fileToExtract.name}"...`)

    try {
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
          /* ignore */
        }
      }

      const res = await extrairDinamometroArquivo(fileToExtract, localText)

      if (res && res.resumo) {
        const headerInfo = `\n\n--- DADOS EXTRAÍDOS DO DINAMÔMETRO PERSONAL (${fileToExtract.name}) ---\n`
        const textoNovo = descricaoForca
          ? `${descricaoForca.trim()}${headerInfo}${res.resumo.trim()}`
          : `${headerInfo.trim()}\n${res.resumo.trim()}`

        onChange('forca_muscular_descricao', textoNovo)

        toast({
          title: 'Dados do dinamômetro transferidos!',
          description:
            res.aviso || 'As leituras foram resumidas e inseridas na caixa de descrição.',
        })
      } else {
        toast({
          title: 'Arquivo anexado com sucesso',
          description:
            'Não foi possível extrair tabelas legíveis automaticamente, mas o arquivo foi anexado ao prontuário.',
        })
      }
    } catch (err: any) {
      console.warn('Falha na extração automática:', err)
      toast({
        title: 'Arquivo anexado ao prontuário',
        description:
          'O arquivo foi salvo. Você pode preencher os testes na tabela e na descrição abaixo.',
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              3. Força Muscular — Dinamômetro Manual (Lafayette / Jamar)
            </h4>
            <p className="text-xs text-gray-500">
              Testes isométricos em kgf, assimetria contralateral bilateral e força relativa ao peso
              corporal
            </p>
          </div>
        </div>

        {/* Botão Anexar Dinamômetro */}
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
            disabled={extracting}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-[#1E2530] hover:bg-black text-white text-xs font-semibold h-9 shadow-sm flex items-center gap-1.5"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#DFBF8E]" />
                Processando...
              </>
            ) : (
              <>
                <Paperclip className="h-4 w-4 text-[#DFBF8E]" />
                Anexar Dinamômetro (PDF/Foto)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerta de Extração */}
      {extracting && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs text-amber-900 animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin text-[#8C6527] shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold">Lendo leituras do dinamômetro...</p>
            <p className="text-amber-700 text-[11px]">{extractMsg}</p>
          </div>
        </div>
      )}

      {/* Tabela de Testes do Dinamômetro Manual */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Testes Padronizados do Dinamômetro Manual
          </Label>
          <span className="text-[11px] text-gray-500">
            Peso corporal de referência: <strong>{pesoKg} kg</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EE] text-[#8C6527] uppercase text-[10px] tracking-wider border-b border-[#E9E1D2]">
              <tr>
                <th className="p-3 font-bold">Teste / Grupo Muscular</th>
                <th className="p-3 font-bold text-center w-28">Direito (kgf)</th>
                <th className="p-3 font-bold text-center w-28">Esquerdo (kgf)</th>
                <th className="p-3 font-bold text-center w-24">Assimetria</th>
                <th className="p-3 font-bold text-center w-36">Força Relativa (kgf/kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOVIMENTOS_PADRAO.map((mov) => {
                const item = getMovimentoVal(mov.id)
                const dVal = item.direitoKgf ?? ''
                const eVal = item.esquerdoKgf ?? ''
                const assimetria = item.assimetriaPct
                const isAltaAssimetria = Number(assimetria) > 15

                return (
                  <tr key={mov.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3 font-semibold text-gray-800">{mov.nome}</td>
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={dVal}
                        onChange={(e) =>
                          handleUpdateMovimento(mov.id, mov.nome, 'direitoKgf', e.target.value)
                        }
                        className="h-8 rounded-lg text-xs font-mono text-center border-gray-200"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={eVal}
                        onChange={(e) =>
                          handleUpdateMovimento(mov.id, mov.nome, 'esquerdoKgf', e.target.value)
                        }
                        className="h-8 rounded-lg text-xs font-mono text-center border-gray-200"
                      />
                    </td>
                    <td className="p-3 text-center">
                      {assimetria !== '' && assimetria !== undefined ? (
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                            isAltaAssimetria
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {assimetria}%
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-[11px] text-gray-600">
                      {item.forcaRelativaD || item.forcaRelativaE ? (
                        <span>
                          D: {item.forcaRelativaD || '—'} | E: {item.forcaRelativaE || '—'}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caixa de Descrição Aberta */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>Descrição Aberta do Dinamômetro & Observações</span>
            <span className="text-[10px] text-[#8C6527] font-semibold px-2 py-0.5 rounded-full bg-[#FAF5EE] border border-[#E9E1D2]">
              Livre & Integrada
            </span>
          </Label>
          <span className="text-[11px] text-gray-400">{descricaoForca.length} caracteres</span>
        </div>

        <Textarea
          rows={6}
          value={descricaoForca}
          onChange={(e) => onChange('forca_muscular_descricao', e.target.value)}
          placeholder="Descreva detalhes específicos do teste, curva de fadiga, presença de dor durante o teste ou valores transferidos do dinamômetro..."
          className="rounded-2xl text-xs sm:text-sm font-mono sm:font-sans leading-relaxed border-gray-200 focus-visible:ring-[#C9A46A] p-4 bg-white"
        />
      </div>

      {/* Lista de Arquivos Anexados */}
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
            {formData.anexos_dinamometro?.map((file: string) => (
              <div
                key={file}
                className="p-3 bg-white rounded-2xl border border-blue-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
              >
                <a
                  href={
                    existingRecordId
                      ? getFileUrl('avaliacoes_personal', existingRecordId, file)
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

            {formData._pending_dinamometro_files?.map((f: File, i: number) => (
              <div
                key={i}
                className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
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
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-5 rounded-2xl border border-dashed border-gray-200 hover:border-[#C9A46A] bg-gray-50/50 hover:bg-[#FAF5EE]/30 cursor-pointer transition-all text-center space-y-1.5"
          >
            <Paperclip className="h-5 w-5 mx-auto text-gray-400" />
            <p className="text-xs font-semibold text-gray-700">
              Nenhum arquivo de dinamômetro anexado
            </p>
            <p className="text-[11px] text-gray-400">
              Clique para anexar PDF, imagem ou CSV do dinamômetro manual
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
