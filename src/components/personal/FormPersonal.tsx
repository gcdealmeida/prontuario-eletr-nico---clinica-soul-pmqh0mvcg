import React, { useState } from 'react'
import {
  User,
  PieChart,
  Zap,
  Ruler,
  Eye,
  Shield,
  Activity,
  Target,
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Etapa1PersonalAnamnese } from './Etapa1PersonalAnamnese'
import { Etapa2PersonalComposicao } from './Etapa2PersonalComposicao'
import { Etapa3PersonalForca } from './Etapa3PersonalForca'
import { Etapa4PersonalFlexibilidade } from './Etapa4PersonalFlexibilidade'
import { Etapa5PersonalPostura } from './Etapa5PersonalPostura'
import { Etapa6PersonalCore } from './Etapa6PersonalCore'
import { Etapa7PersonalFms } from './Etapa7PersonalFms'
import { Etapa8PersonalMetas } from './Etapa8PersonalMetas'
import type { PacienteRecord, StatusAvaliacao } from '@/types/database'

interface FormPersonalProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  onSave: (status: StatusAvaliacao) => Promise<void>
  submitting: boolean
  paciente?: PacienteRecord
  existingRecordId?: string
  etapaAtual?: number
  onEtapaChange?: (etapa: number) => void
}

export const ETAPAS_PERSONAL = [
  { id: 1, title: 'Anamnese & Vitais', icon: User, desc: 'Dados, IMC, RCQ, FC e PA' },
  { id: 2, title: 'Composição Corporal', icon: PieChart, desc: 'Physical Test, Dobras & %G' },
  { id: 3, title: 'Força & Dinamômetro', icon: Zap, desc: 'Dinamometria Manual & Anexos' },
  { id: 4, title: 'Flexibilidade', icon: Ruler, desc: 'Banco de Wells & Flexitest' },
  { id: 5, title: 'Postura Estática', icon: Eye, desc: 'Vistas e Fotos Posturais' },
  { id: 6, title: 'Core (McGill)', icon: Shield, desc: 'Pranchas & Índices McGill' },
  { id: 7, title: 'FMS (7 Testes)', icon: Activity, desc: 'Movement Screen & Assimetrias' },
  { id: 8, title: 'Metas & Prescrição', icon: Target, desc: 'Periodização & Conclusão' },
]

export const FormPersonal: React.FC<FormPersonalProps> = ({
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
    if (etapaAtual < 8) {
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
      {/* Stepper Navigation Visual Padrão SOUL */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              Etapa {etapaAtual} de 8 (Physical Test)
            </span>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              {ETAPAS_PERSONAL[etapaAtual - 1].title}
            </h3>
          </div>
          <span className="text-xs text-[#8C6527] font-semibold">
            {Math.round((etapaAtual / 8) * 100)}% concluído
          </span>
        </div>

        {/* Barra de Progresso com Gradiente Oficial SOUL */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#B87355] transition-all duration-300"
            style={{ width: `${(etapaAtual / 8) * 100}%` }}
          />
        </div>

        {/* Steps Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
          {ETAPAS_PERSONAL.map((step) => {
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
                <span className="text-[10px] font-bold leading-tight line-clamp-1">
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
          <Etapa1PersonalAnamnese formData={formData} onChange={onChange} paciente={paciente} />
        )}
        {etapaAtual === 2 && <Etapa2PersonalComposicao formData={formData} onChange={onChange} />}
        {etapaAtual === 3 && (
          <Etapa3PersonalForca
            formData={formData}
            onChange={onChange}
            existingRecordId={existingRecordId}
          />
        )}
        {etapaAtual === 4 && (
          <Etapa4PersonalFlexibilidade formData={formData} onChange={onChange} />
        )}
        {etapaAtual === 5 && (
          <Etapa5PersonalPostura
            formData={formData}
            onChange={onChange}
            existingRecordId={existingRecordId}
          />
        )}
        {etapaAtual === 6 && <Etapa6PersonalCore formData={formData} onChange={onChange} />}
        {etapaAtual === 7 && <Etapa7PersonalFms formData={formData} onChange={onChange} />}
        {etapaAtual === 8 && (
          <Etapa8PersonalMetas formData={formData} onChange={onChange} paciente={paciente} />
        )}

        {/* Rodapé de Navegação e Salvamento (Rascunho / Concluir) */}
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

            {etapaAtual < 8 ? (
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
                    <CheckCircle2 className="h-4 w-4" /> Concluir Avaliação Personal
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
