import React, { useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GRUPOS_FORCA_PADRAO, VALORES_REFERENCIA_CORE } from '@/lib/fisioterapiaModel'
import type { ForcaGrupoItem, ForcaCoreTabela } from '@/types/database'
import { Zap, Paperclip, UploadCloud, FileText, CheckCircle2 } from 'lucide-react'
import { getFileUrl } from '@/services/avaliacoes'

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
  const grupos: ForcaGrupoItem[] =
    formData.forca_muscular_grupos && formData.forca_muscular_grupos.length > 0
      ? formData.forca_muscular_grupos
      : GRUPOS_FORCA_PADRAO

  const core: ForcaCoreTabela = formData.forca_core_tabela || {
    sexo: 'M',
    faixa_etaria: '18-40',
    prancha_ventral: '',
    prancha_lateral_d: '',
    prancha_lateral_e: '',
    ponte_uni_d: '',
    ponte_uni_e: '',
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGrupoChange = (index: number, field: keyof ForcaGrupoItem, val: any) => {
    const list = [...grupos]
    list[index] = { ...list[index], [field]: val }
    onChange('forca_muscular_grupos', list)

    // Atualizar indicadores de compatibilidade para MMSS/MMII
    if (index === 0 && field === 'grau_direito') {
      onChange('forca_mmss', Number(val) || 5)
    }
    if (index === 9 && field === 'grau_direito') {
      onChange('forca_mmii', Number(val) || 5)
    }
  }

  const handleCoreChange = (field: keyof ForcaCoreTabela, val: any) => {
    const updated = { ...core, [field]: val }
    onChange('forca_core_tabela', updated)
    // Compatibilidade com forca_core antiga
    if (field === 'prancha_ventral') {
      onChange('forca_core', Number(val) > 60 ? 5 : 4)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newFiles = Array.from(files)
    const existing = formData._pending_dinamometro_files || []
    onChange('_pending_dinamometro_files', [...existing, ...newFiles])
  }

  // Obter referências normativas ativas da literatura (Oliveira et al., 2018)
  const refsAtivas =
    VALORES_REFERENCIA_CORE[core.sexo]?.[core.faixa_etaria] || VALORES_REFERENCIA_CORE.M['18-40']

  // Cálculos de comparação com padrão (% alcançado)
  const calcComparativo = (realizado: any, padrao: number) => {
    const r = parseFloat(String(realizado || ''))
    if (!r || isNaN(r) || padrao <= 0) return null
    const pct = ((r / padrao) * 100).toFixed(0)
    const diffSec = (r - padrao).toFixed(1)
    return { pct: Number(pct), diffSec: Number(diffSec) }
  }

  const compVentral = calcComparativo(core.prancha_ventral, refsAtivas.prancha_ventral)
  const compLatD = calcComparativo(core.prancha_lateral_d, refsAtivas.prancha_lateral_d)
  const compLatE = calcComparativo(core.prancha_lateral_e, refsAtivas.prancha_lateral_e)
  const compPonteD = calcComparativo(core.ponte_uni_d, refsAtivas.ponte_uni_d)
  const compPonteE = calcComparativo(core.ponte_uni_e, refsAtivas.ponte_uni_e)

  // Comparativo D x E
  const compPranchaDE = () => {
    const d = parseFloat(String(core.prancha_lateral_d || ''))
    const e = parseFloat(String(core.prancha_lateral_e || ''))
    if (!d || !e) return null
    const diff = Math.abs(d - e)
    const maior = Math.max(d, e)
    const assimetriaPct = ((diff / maior) * 100).toFixed(1)
    return { diff, assimetriaPct, ladoMaior: d >= e ? 'Direito' : 'Esquerdo' }
  }

  const compPonteDE = () => {
    const d = parseFloat(String(core.ponte_uni_d || ''))
    const e = parseFloat(String(core.ponte_uni_e || ''))
    if (!d || !e) return null
    const diff = Math.abs(d - e)
    const maior = Math.max(d, e)
    const assimetriaPct = ((diff / maior) * 100).toFixed(1)
    return { diff, assimetriaPct, ladoMaior: d >= e ? 'Direito' : 'Esquerdo' }
  }

  const assimetriaPrancha = compPranchaDE()
  const assimetriaPonte = compPonteDE()

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 1. Testes de Força Muscular Manual & Dinamômetro */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E9E1D2]">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#8C6527]" />
              <h4 className="text-base font-bold text-gray-900">
                1. Teste de Força Muscular por Grupo e Dinamometria Manual
              </h4>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Escala Medical Research Council (0 a 5), leitura em kgf/lbs do dinamômetro manual,
              descrição livre e botão ANEXAR para foto/print do dinamômetro.
            </p>
          </div>

          {/* Botão de Anexo para Dinamômetro */}
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
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <Paperclip className="h-4 w-4" />
              Anexar Arquivo / Dinamômetro
            </Button>
          </div>
        </div>

        {/* Lista de Arquivos de Dinamômetro Selecionados ou Já Salvos */}
        {((formData._pending_dinamometro_files && formData._pending_dinamometro_files.length > 0) ||
          (formData.anexos_dinamometro && formData.anexos_dinamometro.length > 0)) && (
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-wrap gap-2 text-xs">
            <span className="font-bold text-blue-900 flex items-center gap-1">
              <UploadCloud className="h-4 w-4 text-blue-600" />
              Anexos de Dinamometria:
            </span>
            {formData.anexos_dinamometro?.map((file: string) => (
              <a
                key={file}
                href={
                  existingRecordId
                    ? getFileUrl('avaliacoes_fisioterapia', existingRecordId, file)
                    : '#'
                }
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-800 flex items-center gap-1 hover:underline"
              >
                <FileText className="h-3 w-3" />
                {file}
              </a>
            ))}
            {formData._pending_dinamometro_files?.map((f: File, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                {f.name} (Aguardando salvar)
              </span>
            ))}
          </div>
        )}

        {/* Tabela de Grupos Musculares */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50/80 text-gray-600 text-[11px] uppercase border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 text-left font-bold w-1/3">Grupo Muscular Testado</th>
                <th className="py-2.5 px-2 text-center font-bold">Grau D (0-5)</th>
                <th className="py-2.5 px-2 text-center font-bold">Grau E (0-5)</th>
                <th className="py-2.5 px-2 text-center font-bold">Dinamômetro D (kgf/lbs)</th>
                <th className="py-2.5 px-2 text-center font-bold">Dinamômetro E (kgf/lbs)</th>
                <th className="py-2.5 px-3 text-left font-bold w-1/4">Descrição / Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {grupos.map((grp, idx) => (
                <tr key={grp.grupo} className="hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-semibold text-gray-800">{grp.grupo}</td>
                  <td className="py-2 px-2 text-center">
                    <Select
                      value={grp.grau_direito || '5'}
                      onValueChange={(v) => handleGrupoChange(idx, 'grau_direito', v)}
                    >
                      <SelectTrigger className="h-8 w-16 text-xs mx-auto rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['0', '1', '2', '3', '4', '5'].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Select
                      value={grp.grau_esquerdo || '5'}
                      onValueChange={(v) => handleGrupoChange(idx, 'grau_esquerdo', v)}
                    >
                      <SelectTrigger className="h-8 w-16 text-xs mx-auto rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['0', '1', '2', '3', '4', '5'].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="kgf"
                      value={grp.dinamometro_direito_kgf ?? ''}
                      onChange={(e) =>
                        handleGrupoChange(idx, 'dinamometro_direito_kgf', e.target.value)
                      }
                      className="h-8 text-center text-xs rounded-xl"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="kgf"
                      value={grp.dinamometro_esquerdo_kgf ?? ''}
                      onChange={(e) =>
                        handleGrupoChange(idx, 'dinamometro_esquerdo_kgf', e.target.value)
                      }
                      className="h-8 text-center text-xs rounded-xl"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      placeholder="Observações do teste..."
                      value={grp.descricao_livre ?? ''}
                      onChange={(e) => handleGrupoChange(idx, 'descricao_livre', e.target.value)}
                      className="h-8 text-xs rounded-xl"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Força Core (Tabela Padrão Oliveira et al., 2018) */}
      <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-[#FAF6F0] border border-[#E9E1D2]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9E1D2]">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#8C6527]" />
              <h4 className="text-base font-bold text-gray-900">
                2. Força Core — Tabela Padrão (Oliveira et al., Braz J Phys Ther 2018)
              </h4>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Medições em SEGUNDOS com comparativo automático contra os valores de referência da
              literatura e cálculo de assimetria Direito x Esquerdo.
            </p>
          </div>

          {/* Seletores de Sexo e Faixa Etária */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E9E1D2]">
              <span className="font-semibold text-gray-600 px-1">Sexo:</span>
              <button
                type="button"
                onClick={() => handleCoreChange('sexo', 'M')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  core.sexo === 'M'
                    ? 'bg-[#1E2530] text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => handleCoreChange('sexo', 'F')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  core.sexo === 'F'
                    ? 'bg-[#1E2530] text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                F
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E9E1D2]">
              <span className="font-semibold text-gray-600 px-1">Faixa:</span>
              <button
                type="button"
                onClick={() => handleCoreChange('faixa_etaria', '18-40')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  core.faixa_etaria === '18-40' ? 'bg-[#8C6527] text-white' : 'text-gray-500'
                }`}
              >
                18-40
              </button>
              <button
                type="button"
                onClick={() => handleCoreChange('faixa_etaria', '41-65')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  core.faixa_etaria === '41-65' ? 'bg-[#8C6527] text-white' : 'text-gray-500'
                }`}
              >
                41-65
              </button>
            </div>
          </div>
        </div>

        {/* Tabela Fixa dos 5 Testes de Core */}
        <div className="overflow-x-auto rounded-2xl bg-white border border-[#E9E1D2]">
          <table className="w-full text-xs">
            <thead className="bg-[#FAF4EA] text-gray-700 text-[11px] uppercase border-b border-[#E9E1D2]">
              <tr>
                <th className="py-2.5 px-3 text-left font-bold">Teste de Core</th>
                <th className="py-2.5 px-2 text-center font-bold">Valor Realizado (s)</th>
                <th className="py-2.5 px-2 text-center font-bold">Padrão Literatura (s)</th>
                <th className="py-2.5 px-2 text-center font-bold">Realizado x Padrão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Prancha Ventral */}
              <tr className="hover:bg-amber-50/20">
                <td className="py-2.5 px-3 font-semibold text-gray-800">
                  Prancha Ventral (Prone Bridge)
                </td>
                <td className="py-2.5 px-2 text-center">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="segundos"
                    value={core.prancha_ventral ?? ''}
                    onChange={(e) => handleCoreChange('prancha_ventral', e.target.value)}
                    className="h-8 w-28 text-center text-xs rounded-xl mx-auto font-mono"
                  />
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-gray-600">
                  {refsAtivas.prancha_ventral} s
                </td>
                <td className="py-2.5 px-2 text-center">
                  {compVentral ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        compVentral.pct >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : compVentral.pct >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {compVentral.pct}% (
                      {compVentral.diffSec > 0 ? `+${compVentral.diffSec}` : compVentral.diffSec}s)
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>

              {/* Prancha Lateral Direita */}
              <tr className="hover:bg-amber-50/20">
                <td className="py-2.5 px-3 font-semibold text-gray-800">
                  Prancha Lateral Direita (Side Bridge - Right)
                </td>
                <td className="py-2.5 px-2 text-center">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="segundos"
                    value={core.prancha_lateral_d ?? ''}
                    onChange={(e) => handleCoreChange('prancha_lateral_d', e.target.value)}
                    className="h-8 w-28 text-center text-xs rounded-xl mx-auto font-mono"
                  />
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-gray-600">
                  {refsAtivas.prancha_lateral_d} s
                </td>
                <td className="py-2.5 px-2 text-center">
                  {compLatD ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        compLatD.pct >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : compLatD.pct >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {compLatD.pct}% (
                      {compLatD.diffSec > 0 ? `+${compLatD.diffSec}` : compLatD.diffSec}s)
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>

              {/* Prancha Lateral Esquerda */}
              <tr className="hover:bg-amber-50/20">
                <td className="py-2.5 px-3 font-semibold text-gray-800">
                  Prancha Lateral Esquerda (Side Bridge - Left)
                </td>
                <td className="py-2.5 px-2 text-center">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="segundos"
                    value={core.prancha_lateral_e ?? ''}
                    onChange={(e) => handleCoreChange('prancha_lateral_e', e.target.value)}
                    className="h-8 w-28 text-center text-xs rounded-xl mx-auto font-mono"
                  />
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-gray-600">
                  {refsAtivas.prancha_lateral_e} s
                </td>
                <td className="py-2.5 px-2 text-center">
                  {compLatE ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        compLatE.pct >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : compLatE.pct >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {compLatE.pct}% (
                      {compLatE.diffSec > 0 ? `+${compLatE.diffSec}` : compLatE.diffSec}s)
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>

              {/* Ponte Unilateral Direita */}
              <tr className="hover:bg-amber-50/20">
                <td className="py-2.5 px-3 font-semibold text-gray-800">
                  Ponte Unilateral Direita (Single Leg Bridge - Right)
                </td>
                <td className="py-2.5 px-2 text-center">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="segundos"
                    value={core.ponte_uni_d ?? ''}
                    onChange={(e) => handleCoreChange('ponte_uni_d', e.target.value)}
                    className="h-8 w-28 text-center text-xs rounded-xl mx-auto font-mono"
                  />
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-gray-600">
                  {refsAtivas.ponte_uni_d} s
                </td>
                <td className="py-2.5 px-2 text-center">
                  {compPonteD ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        compPonteD.pct >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : compPonteD.pct >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {compPonteD.pct}% (
                      {compPonteD.diffSec > 0 ? `+${compPonteD.diffSec}` : compPonteD.diffSec}s)
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>

              {/* Ponte Unilateral Esquerda */}
              <tr className="hover:bg-amber-50/20">
                <td className="py-2.5 px-3 font-semibold text-gray-800">
                  Ponte Unilateral Esquerda (Single Leg Bridge - Left)
                </td>
                <td className="py-2.5 px-2 text-center">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="segundos"
                    value={core.ponte_uni_e ?? ''}
                    onChange={(e) => handleCoreChange('ponte_uni_e', e.target.value)}
                    className="h-8 w-28 text-center text-xs rounded-xl mx-auto font-mono"
                  />
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-gray-600">
                  {refsAtivas.ponte_uni_e} s
                </td>
                <td className="py-2.5 px-2 text-center">
                  {compPonteE ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        compPonteE.pct >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : compPonteE.pct >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {compPonteE.pct}% (
                      {compPonteE.diffSec > 0 ? `+${compPonteE.diffSec}` : compPonteE.diffSec}s)
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Comparativo Direito x Esquerdo Automático */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 bg-white rounded-2xl border border-[#E9E1D2] text-xs space-y-1">
            <span className="font-bold text-gray-700 block">
              Comparativo Prancha Lateral: Direita vs Esquerda
            </span>
            {assimetriaPrancha ? (
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500">
                  Diferença: <strong>{assimetriaPrancha.diff.toFixed(1)}s</strong> (
                  {assimetriaPrancha.ladoMaior} &gt;)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    Number(assimetriaPrancha.assimetriaPct) <= 15
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Assimetria: {assimetriaPrancha.assimetriaPct}%
                </span>
              </div>
            ) : (
              <span className="text-gray-400">
                Preencha ambos os lados para o comparativo automático
              </span>
            )}
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-[#E9E1D2] text-xs space-y-1">
            <span className="font-bold text-gray-700 block">
              Comparativo Ponte Unilateral: Direita vs Esquerda
            </span>
            {assimetriaPonte ? (
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500">
                  Diferença: <strong>{assimetriaPonte.diff.toFixed(1)}s</strong> (
                  {assimetriaPonte.ladoMaior} &gt;)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    Number(assimetriaPonte.assimetriaPct) <= 15
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Assimetria: {assimetriaPonte.assimetriaPct}%
                </span>
              </div>
            ) : (
              <span className="text-gray-400">
                Preencha ambos os lados para o comparativo automático
              </span>
            )}
          </div>
        </div>

        <div>
          <Label className="text-gray-700 text-xs font-semibold">
            Observações Clínicas de Força Core
          </Label>
          <Textarea
            rows={2}
            value={core.observacoes || ''}
            onChange={(e) => handleCoreChange('observacoes', e.target.value)}
            placeholder="Qualidade do movimento, tremores, compensações lumbopélvicas..."
            className="mt-1 rounded-xl text-xs bg-white"
          />
        </div>
      </div>
    </div>
  )
}
