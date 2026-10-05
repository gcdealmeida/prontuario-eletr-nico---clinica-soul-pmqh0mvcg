import React, { useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Paperclip, UploadCloud, FileText, CheckCircle2, Trash2 } from 'lucide-react'
import { getFileUrl } from '@/services/avaliacoes'

interface Etapa6AnexosProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  existingRecordId?: string
}

export const Etapa6Anexos: React.FC<Etapa6AnexosProps> = ({
  formData,
  onChange,
  existingRecordId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newFiles = Array.from(files)
    const existing = formData._pending_exames_files || []
    onChange('_pending_exames_files', [...existing, ...newFiles])
  }

  const removePendingFile = (index: number) => {
    const existing: File[] = formData._pending_exames_files || []
    onChange(
      '_pending_exames_files',
      existing.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E9E1D2]">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-[#8C6527]" />
            <h4 className="text-base font-bold text-gray-900">
              Exames Complementares & Documentos Clínicos
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Anexe laudos, imagens de Ressonância Magnética, Raios-X, Ultrassonografias ou relatórios
            médicos trazidos pelo paciente (suporte a múltiplos arquivos PDF, PNG, JPG).
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

      {/* Caixa de Descrição e Laudos */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-700">
          Descrição dos Exames Complementares e Tratamentos Anteriores
        </Label>
        <Textarea
          rows={4}
          value={formData.historico_medico || ''}
          onChange={(e) => onChange('historico_medico', e.target.value)}
          placeholder="Ex: RM Ombro E (15/01/2026): Ruptura parcial articular de 4mm do tendão supraespinal, bursite subacromial discreta. Tratamentos anteriores: 10 sessões de fisioterapia analgésica e infiltração corticoide há 3 meses..."
          className="rounded-2xl text-xs sm:text-sm"
        />
      </div>

      {/* Arquivos já persistidos no backend */}
      {formData.anexos_exames && formData.anexos_exames.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs font-bold text-gray-700 block">
            Exames já anexados ao prontuário ({formData.anexos_exames.length}):
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {formData.anexos_exames.map((filename: string, idx: number) => {
              const fileUrl = existingRecordId
                ? getFileUrl('avaliacoes_fisioterapia', existingRecordId, filename)
                : '#'
              const isImg = filename.match(/\.(jpg|jpeg|png|webp)$/i)
              return (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isImg ? (
                      <img
                        src={fileUrl}
                        alt="Preview exame"
                        className="h-10 w-10 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        PDF
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-800 truncate" title={filename}>
                      {filename}
                    </span>
                  </div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline font-semibold shrink-0"
                  >
                    Ver
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Arquivos Selecionados nesta Sessão (Aguardando Salvar) */}
      {formData._pending_exames_files && formData._pending_exames_files.length > 0 && (
        <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
          <Label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Novos exames selecionados para envio ({formData._pending_exames_files.length}):
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {formData._pending_exames_files.map((file: File, idx: number) => (
              <div
                key={idx}
                className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="truncate font-medium text-gray-800">{file.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removePendingFile(idx)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-emerald-700">
            Estes arquivos serão transferidos automaticamente para a nuvem ao salvar ou concluir a
            avaliação.
          </p>
        </div>
      )}
    </div>
  )
}
