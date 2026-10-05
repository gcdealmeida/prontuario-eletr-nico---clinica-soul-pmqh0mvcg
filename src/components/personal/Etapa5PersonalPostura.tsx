import React, { useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Camera,
  Paperclip,
  CheckCircle2,
  Trash2,
  Eye,
  UserCheck,
  FileImage,
  UploadCloud,
} from 'lucide-react'
import { getFileUrl } from '@/services/avaliacoes'

interface PontoPostural {
  id: string
  label: string
}

const PONTOS_ANTERIOR: PontoPostural[] = [
  { id: 'cabeca_inclinacao', label: 'Cabeça (alinhamento / inclinação lateral)' },
  { id: 'ombros_altura', label: 'Altura dos Ombros (simetria / elevação)' },
  { id: 'triangulo_talhe', label: 'Triângulo de Talhe (espaço braço-tronco)' },
  { id: 'pelve_cristas', label: 'Nível das Cristas Ilíacas / Bacia' },
  { id: 'joelhos_frontal', label: 'Joelhos (Genu Varo / Genu Valgo / Neutro)' },
  { id: 'patelas_posicao', label: 'Posição das Patelas (estrabismo / rotação)' },
  { id: 'pes_posicao', label: 'Pés (Pronação / Supinação / Desabamento de Arco)' },
]

const PONTOS_POSTERIOR: PontoPostural[] = [
  { id: 'escapulas_simetria', label: 'Escápulas (aladas / simetria / rotação)' },
  { id: 'coluna_escoliose', label: 'Eixo da Coluna (escoliose visível / desvio lateral)' },
  { id: 'linhas_gluteas', label: 'Pregas Glúteas (simetria horizontal)' },
  { id: 'tendoes_aquiles', label: 'Tendões de Aquiles (alinhamento calcâneo)' },
]

const PONTOS_LATERAL: PontoPostural[] = [
  { id: 'cabeca_projetada', label: 'Projeção Anterior de Cabeça' },
  { id: 'ombros_protusao', label: 'Ombros (Protrusão anterior / enrolamento)' },
  { id: 'cifose_toracica', label: 'Cifose Torácica (Normal / Hipercifose / Retificação)' },
  { id: 'lordose_lombar', label: 'Lordose Lombar (Normal / Hiperlordose / Retificada)' },
  { id: 'pelve_inclinacao', label: 'Pelve (Anteversão / Retroversão)' },
  { id: 'joelhos_sagital', label: 'Joelhos (Recurvato / Fletido / Alinhado)' },
]

interface Etapa5PersonalPosturaProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  existingRecordId?: string
}

export const Etapa5PersonalPostura: React.FC<Etapa5PersonalPosturaProps> = ({
  formData,
  onChange,
  existingRecordId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const postural = formData.postural_dados || {}
  const vistaAnt = postural.vista_anterior || {}
  const vistaPost = postural.vista_posterior || {}
  const vistaLat = postural.vista_lateral || {}
  const conclusao = postural.conclusao_postural ?? ''

  const handleUpdateItem = (
    vista: 'vista_anterior' | 'vista_posterior' | 'vista_lateral',
    id: string,
    status: 'NORMAL' | 'ALTERADO',
    obs?: string,
  ) => {
    const currentVista = postural[vista] || {}
    const existing = currentVista[id] || { status: 'NORMAL', obs: '' }
    const updatedVista = {
      ...currentVista,
      [id]: {
        status,
        obs: obs !== undefined ? obs : existing.obs,
      },
    }

    onChange('postural_dados', {
      ...postural,
      [vista]: updatedVista,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    const existing = formData._pending_postura_files || []
    onChange('_pending_postura_files', [...existing, ...newFiles])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePending = (index: number) => {
    const list = [...(formData._pending_postura_files || [])]
    list.splice(index, 1)
    onChange('_pending_postura_files', list)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">
              5. Avaliação Postural Estática & Registro Fotográfico
            </h4>
            <p className="text-xs text-gray-500">
              Checklist analítico em vistas anterior, posterior e perfil sagital com upload de fotos
              posturais
            </p>
          </div>
        </div>

        {/* Botão de Anexo de Fotos */}
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
            className="rounded-xl bg-[#1E2530] hover:bg-black text-white text-xs font-semibold h-9 shadow-sm flex items-center gap-1.5"
          >
            <Camera className="h-4 w-4 text-[#DFBF8E]" />
            Anexar Fotos Posturais
          </Button>
        </div>
      </div>

      {/* Renderizar as 3 vistas posturais */}
      <div className="space-y-6">
        {/* Vista Anterior */}
        <div className="p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <h5 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider">
              Vista Anterior (Frontal)
            </h5>
          </div>

          <div className="space-y-2.5">
            {PONTOS_ANTERIOR.map((p) => {
              const item = vistaAnt[p.id] || { status: 'NORMAL', obs: '' }
              const isAlterado = item.status === 'ALTERADO'

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isAlterado ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/60 border-gray-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">{p.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem('vista_anterior', p.id, 'NORMAL')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          !isAlterado
                            ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                            : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateItem('vista_anterior', p.id, 'ALTERADO')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          isAlterado
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Alterado
                      </button>
                    </div>
                  </div>

                  {isAlterado && (
                    <Input
                      placeholder="Descreva a alteração observada (ex: ombro D mais elevado 2cm)..."
                      value={item.obs || ''}
                      onChange={(e) =>
                        handleUpdateItem('vista_anterior', p.id, 'ALTERADO', e.target.value)
                      }
                      className="mt-2 h-8 rounded-xl text-xs bg-white border-amber-200"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Vista Posterior */}
        <div className="p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <h5 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider">
              Vista Posterior (Dorsal)
            </h5>
          </div>

          <div className="space-y-2.5">
            {PONTOS_POSTERIOR.map((p) => {
              const item = vistaPost[p.id] || { status: 'NORMAL', obs: '' }
              const isAlterado = item.status === 'ALTERADO'

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isAlterado ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/60 border-gray-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">{p.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem('vista_posterior', p.id, 'NORMAL')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          !isAlterado
                            ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                            : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateItem('vista_posterior', p.id, 'ALTERADO')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          isAlterado
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Alterado
                      </button>
                    </div>
                  </div>

                  {isAlterado && (
                    <Input
                      placeholder="Descreva a alteração observada..."
                      value={item.obs || ''}
                      onChange={(e) =>
                        handleUpdateItem('vista_posterior', p.id, 'ALTERADO', e.target.value)
                      }
                      className="mt-2 h-8 rounded-xl text-xs bg-white border-amber-200"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Vista Lateral / Perfil Sagital */}
        <div className="p-5 rounded-3xl bg-white border border-[#E9E1D2] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <h5 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider">
              Vista Lateral (Perfil Sagital)
            </h5>
          </div>

          <div className="space-y-2.5">
            {PONTOS_LATERAL.map((p) => {
              const item = vistaLat[p.id] || { status: 'NORMAL', obs: '' }
              const isAlterado = item.status === 'ALTERADO'

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isAlterado ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/60 border-gray-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">{p.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem('vista_lateral', p.id, 'NORMAL')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          !isAlterado
                            ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                            : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateItem('vista_lateral', p.id, 'ALTERADO')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          isAlterado
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        Alterado
                      </button>
                    </div>
                  </div>

                  {isAlterado && (
                    <Input
                      placeholder="Descreva a alteração observada..."
                      value={item.obs || ''}
                      onChange={(e) =>
                        handleUpdateItem('vista_lateral', p.id, 'ALTERADO', e.target.value)
                      }
                      className="mt-2 h-8 rounded-xl text-xs bg-white border-amber-200"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Conclusão Postural Livre */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Conclusão & Diagnóstico Postural Global
        </Label>
        <Textarea
          rows={3}
          placeholder="Síntese dos desvios posturais mais marcantes que influenciam a seleção e periodização dos exercícios..."
          value={conclusao}
          onChange={(e) =>
            onChange('postural_dados', { ...postural, conclusao_postural: e.target.value })
          }
          className="rounded-xl border-gray-200 text-xs sm:text-sm"
        />
      </div>

      {/* Galeria de Fotos Posturais Anexadas */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileImage className="h-4 w-4 text-[#8C6527]" />
            Fotos Posturais Anexadas
          </span>
          <span className="text-[11px] text-gray-400">
            {(formData.anexos_postura?.length || 0) +
              (formData._pending_postura_files?.length || 0)}{' '}
            foto(s)
          </span>
        </div>

        {(formData._pending_postura_files && formData._pending_postura_files.length > 0) ||
        (formData.anexos_postura && formData.anexos_postura.length > 0) ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {formData.anexos_postura?.map((file: string) => (
              <div
                key={file}
                className="p-3 bg-white rounded-2xl border border-gray-200 text-xs flex flex-col items-center justify-center gap-2 shadow-2xs hover:border-[#8C6527] transition-all"
              >
                <a
                  href={
                    existingRecordId
                      ? getFileUrl('avaliacoes_personal', existingRecordId, file)
                      : '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1 text-center text-blue-800 hover:underline"
                >
                  <FileImage className="h-8 w-8 text-[#8C6527]" />
                  <span className="text-[11px] font-medium truncate max-w-[120px]">{file}</span>
                </a>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  Salva
                </span>
              </div>
            ))}

            {formData._pending_postura_files?.map((f: File, i: number) => (
              <div
                key={i}
                className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs flex flex-col items-center justify-between gap-2 shadow-2xs"
              >
                <FileImage className="h-8 w-8 text-emerald-600" />
                <span className="text-[11px] font-medium text-emerald-950 truncate max-w-[120px]">
                  {f.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePending(i)}
                  className="h-7 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remover
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-5 rounded-2xl border border-dashed border-gray-200 hover:border-[#C9A46A] bg-gray-50/50 hover:bg-[#FAF5EE]/30 cursor-pointer transition-all text-center space-y-1.5"
          >
            <Camera className="h-5 w-5 mx-auto text-gray-400" />
            <p className="text-xs font-semibold text-gray-700">Nenhuma foto postural anexada</p>
            <p className="text-[11px] text-gray-400">
              Clique para anexar fotos nas vistas anterior, posterior e perfil
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
