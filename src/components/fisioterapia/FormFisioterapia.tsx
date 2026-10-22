import React from 'react'
import {
  FileText,
  Activity,
  Zap,
  Target,
  Sparkles,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  Loader2,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Etapa1Anamnese } from './Etapa1Anamnese'
import { Etapa2ExameFisico } from './Etapa2ExameFisico'
import { Etapa3ForcaCore } from './Etapa3ForcaCore'
import { Etapa4TestesEspeciais } from './Etapa4TestesEspeciais'
import { Etapa5Complementares } from './Etapa5Complementares'
import { Etapa6Anexos } from './Etapa6Anexos'
import { Etapa7ConclusaoIa } from './Etapa7ConclusaoIa'
import type { PacienteRecord, StatusAvaliacao } from '@/types/database'

interface FormFisioterapiaProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  onSave: (status: StatusAvaliacao) => Promise<void>
  submitting: boolean
  paciente?: PacienteRecord
  existingRecordId?: string
  etapaAtual?: number
  onEtapaChange?: (etapa: number) => void
}

export const ETAPAS_FISIO = [
  { id: 1, title: 'Anamnese', icon: FileText, desc: 'Motivo, Impacto, Queixas e Histórico' },
  {
    id: 2,
    title: 'Exame Físico & ADM',
    icon: Activity,
    desc: 'Inspeção e Amplitude Articular Optativa',
  },
  { id: 3, title: 'Força Muscular', icon: Zap, desc: 'Descrição Aberta & Dinamômetro' },
  { id: 4, title: 'Testes Especiais', icon: Target, desc: 'Testes Ortopédicos por Segmento' },
  {
    id: 5,
    title: 'Testes Complementares',
    icon: Layers,
    desc: 'Berg, TUG, Cirtometria, Podologia',
  },
  { id: 6, title: 'Exames Complementares', icon: Paperclip, desc: 'Upload de Imagens e Laudos' },
  {
    id: 7,
    title: 'Conclusão com IA',
    icon: Sparkles,
    desc: 'Hipótese, Diagnóstico e Plano Semanal',
  },
]

export const FormFisioterapia: React.FC<FormFisioterapiaProps> = ({
  formData,
  onChange,
  onSave,
  submitting,
  paciente,
  existingRecordId,
  etapaAtual: controlledEtapa,
  onEtapaChange,
}) => {
  const [internalEtapa, setInternalEtapa] = React.useState(1)
  const etapaAtual = controlledEtapa !== undefined ? controlledEtapa : internalEtapa

  const setEtapa = (novaEtapa: number) => {
    if (onEtapaChange) {
      onEtapaChange(novaEtapa)
    } else {
      setInternalEtapa(novaEtapa)
    }
  }

  const handleNext = () => {
    if (etapaAtual < 7) {
      setEtapa(etapaAtual + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (etapaAtual > 1) {
      setEtapa(etapaAtual - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper Navigation */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              Etapa {etapaAtual} de 7
            </span>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              {ETAPAS_FISIO[etapaAtual - 1].title}
            </h3>
          </div>
          <span className="text-xs text-[#8C6527] font-semibold">
            {Math.round((etapaAtual / 7) * 100)}% concluído
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#B87355] transition-all duration-300"
            style={{ width: `${(etapaAtual / 7) * 100}%` }}
          />
        </div>

        {/* Steps Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {ETAPAS_FISIO.map((step) => {
            const Icon = step.icon
            const isActive = etapaAtual === step.id
            const isCompleted = step.id < etapaAtual
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setEtapa(step.id)}
                className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  isActive
                    ? 'bg-[#1E2530] text-white shadow-xs'
                    : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#DFBF8E]' : ''}`} />
                <span className="text-[11px] font-bold leading-tight line-clamp-1">
                  {step.id}. {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo da Etapa Atual */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        {etapaAtual === 1 && (
          <Etapa1Anamnese formData={formData} onChange={onChange} paciente={paciente} />
        )}
        {etapaAtual === 2 && <Etapa2ExameFisico formData={formData} onChange={onChange} />}
        {etapaAtual === 3 && (
          <Etapa3ForcaCore
            formData={formData}
            onChange={onChange}
            existingRecordId={existingRecordId}
          />
        )}
        {etapaAtual === 4 && <Etapa4TestesEspeciais formData={formData} onChange={onChange} />}
        {etapaAtual === 5 && <Etapa5Complementares formData={formData} onChange={onChange} />}
        {etapaAtual === 6 && (
          <Etapa6Anexos
            formData={formData}
            onChange={onChange}
            existingRecordId={existingRecordId}
            pacienteId={paciente?.id}
          />
        )}
        {etapaAtual === 7 && (
          <Etapa7ConclusaoIa formData={formData} onChange={onChange} paciente={paciente} />
        )}

        {/* Rodapé com Navegação e Salvamento */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 mt-8 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            disabled={etapaAtual === 1}
            onClick={handlePrev}
            className="rounded-xl h-10 px-4 text-xs font-semibold w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Etapa Anterior
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onSave('Rascunho')}
              className="rounded-xl h-10 px-4 text-xs font-semibold border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
              title="Salva no servidor e continua na página"
            >
              <Save className="h-3.5 w-3.5 text-gray-500" />
              Salvar Rascunho
            </Button>

            {etapaAtual < 7 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-gray-900 hover:bg-black text-white rounded-xl h-10 px-5 text-xs font-semibold flex items-center gap-1.5"
              >
                Próxima Etapa <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={submitting}
                onClick={() => onSave('Concluída')}
                className="bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-10 px-6 text-xs shadow-sm flex items-center gap-1.5 border border-[#DFBF8E]/40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Concluir Avaliação
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
