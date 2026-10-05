import React from 'react'
import type {
  AvaliacaoFisioterapiaRecord,
  AdmSegmento,
  ForcaGrupoItem,
  ForcaCoreTabela,
  TestesEspeciaisSegmento,
  SecoesComplementaresFisio,
  PlanoSemanalItem,
  QueixaItem,
} from '@/types/database'
import { VALORES_REFERENCIA_CORE, BERG_ITENS, ELEMENTOS_PALMILHA } from '@/lib/fisioterapiaModel'
import { getFileUrl } from '@/services/avaliacoes'
import {
  FileText,
  Activity,
  Zap,
  Target,
  Layers,
  Paperclip,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface VisualizacaoFisioterapiaProps {
  avaliacao: AvaliacaoFisioterapiaRecord
}

export const VisualizacaoFisioterapia: React.FC<VisualizacaoFisioterapiaProps> = ({
  avaliacao,
}) => {
  const anamnese = avaliacao.anamnese_detalhada
  const queixas: QueixaItem[] = avaliacao.queixas_multiplas || []
  const visceras = avaliacao.visceras_sistemicas
  const habitos = avaliacao.habitos_saude
  const admSegmentos: AdmSegmento[] = (avaliacao.adm_segmentos || []).filter((s) => s.ativo)
  const gruposForca: ForcaGrupoItem[] = avaliacao.forca_muscular_grupos || []
  const core: ForcaCoreTabela | undefined = avaliacao.forca_core_tabela
  const testesEsp: TestesEspeciaisSegmento[] = (avaliacao.testes_especiais_segmentos || []).filter(
    (s) => s.ativo,
  )
  const comp: SecoesComplementaresFisio | undefined = avaliacao.secoes_complementares
  const planoSemanal: PlanoSemanalItem[] = avaliacao.plano_semanal_detalhado || []

  // Core references
  const refsAtivas =
    core && VALORES_REFERENCIA_CORE[core.sexo]?.[core.faixa_etaria]
      ? VALORES_REFERENCIA_CORE[core.sexo][core.faixa_etaria]
      : VALORES_REFERENCIA_CORE.M['18-40']

  return (
    <div className="space-y-8 print:space-y-6">
      {/* 1. ANAMNESE ESTRATÉGICA */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
          <FileText className="h-4 w-4" /> 1. Anamnese Fisioterapêutica e Estratégica
        </h3>

        {/* Diagnóstico e Objetivos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
          <div>
            <span className="font-bold text-gray-700 block">Diagnóstico Médico Informado:</span>
            <p className="text-gray-900 mt-0.5 font-medium">
              {anamnese?.diagnostico_medico || avaliacao.diagnostico_fisioterapeutico || '—'}
            </p>
          </div>
          <div>
            <span className="font-bold text-gray-700 block">Objetivos do Paciente:</span>
            <p className="text-gray-900 mt-0.5 font-medium">
              {anamnese?.objetivos || avaliacao.objetivos_tratamento || '—'}
            </p>
          </div>
          {anamnese?.frase_chave_paciente && (
            <div className="sm:col-span-2 pt-2 border-t border-gray-200">
              <span className="font-bold text-[#8C6527] block">
                Frase-Chave / Objetivo Central (Palavras do Paciente):
              </span>
              <p className="text-gray-900 italic mt-0.5 font-serif text-sm">
                “{anamnese.frase_chave_paciente}”
              </p>
            </div>
          )}
        </div>

        {/* Perguntas Estratégicas se existirem */}
        {anamnese && (anamnese.motivo_principal || anamnese.impacto_dia_a_dia) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-2xl border border-gray-100">
            {anamnese.motivo_principal && (
              <div>
                <span className="font-bold text-gray-600 block">
                  Motivo da Procura / Dor Principal:
                </span>
                <p className="text-gray-900 mt-0.5">{anamnese.motivo_principal}</p>
              </div>
            )}
            {anamnese.tempo_evolucao && (
              <div>
                <span className="font-bold text-gray-600 block">Tempo de Evolução:</span>
                <p className="text-gray-900 mt-0.5">{anamnese.tempo_evolucao}</p>
              </div>
            )}
            {anamnese.impacto_dia_a_dia && (
              <div>
                <span className="font-bold text-gray-600 block">
                  Impacto no Dia a Dia / Autonomia:
                </span>
                <p className="text-gray-900 mt-0.5">{anamnese.impacto_dia_a_dia}</p>
              </div>
            )}
            {anamnese.o_que_evita_fazer && (
              <div>
                <span className="font-bold text-gray-600 block">
                  O que Deixou de Fazer / Evita:
                </span>
                <p className="text-gray-900 mt-0.5">{anamnese.o_que_evita_fazer}</p>
              </div>
            )}
            {anamnese.tentativas_anteriores && (
              <div>
                <span className="font-bold text-gray-600 block">Tentativas Anteriores:</span>
                <p className="text-gray-900 mt-0.5">{anamnese.tentativas_anteriores}</p>
              </div>
            )}
            {anamnese.vida_resolvida_3_6_meses && (
              <div>
                <span className="font-bold text-gray-600 block">Visão de Futuro (3–6 Meses):</span>
                <p className="text-gray-900 mt-0.5">{anamnese.vida_resolvida_3_6_meses}</p>
              </div>
            )}
          </div>
        )}

        {/* Queixas Clínicas e EVA */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
            Queixas do Paciente
          </span>
          {queixas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {queixas.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1"
                >
                  <div className="flex justify-between items-center font-bold text-gray-800">
                    <span>Queixa {q.titulo}</span>
                    <span className="text-[#8C6527]">EVA: {q.eva}/10</span>
                  </div>
                  <p className="text-gray-900 font-medium">{q.queixa || '—'}</p>
                  {q.desde_quando && (
                    <span className="text-gray-500 block text-[11px]">Desde: {q.desde_quando}</span>
                  )}
                  {q.movimento_piora && (
                    <span className="text-gray-500 block text-[11px]">
                      Piora: {q.movimento_piora}
                    </span>
                  )}
                  {q.o_que_alivia && (
                    <span className="text-gray-500 block text-[11px]">
                      Alívio: {q.o_que_alivia}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-xs">
              <span className="font-bold text-gray-700 block">Queixa Principal:</span>
              <p className="text-gray-900 mt-0.5">{avaliacao.queixa_principal || '—'}</p>
            </div>
          )}
        </div>

        {/* Vísceras & Questões Sistêmicas */}
        {visceras && Object.values(visceras).some(Boolean) && (
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs space-y-2">
            <span className="font-bold text-gray-700 uppercase tracking-wider block text-[11px]">
              Rastreamento Visceral & Sistêmico
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {Object.entries(visceras).map(([k, v]) => {
                if (!v) return null
                return (
                  <div key={k} className="bg-white p-2 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-500 capitalize block">
                      {k.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-gray-800 font-medium">{v}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. EXAME FÍSICO & ADM OPTATIVA */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
          <Activity className="h-4 w-4" /> 2. Exame Físico & Amplitude Articular (ADM)
        </h3>

        {(avaliacao.postura || avaliacao.palpacao) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            {avaliacao.postura && (
              <div>
                <span className="font-bold text-gray-700 block">Inspeção Postural:</span>
                <p className="text-gray-900 mt-0.5">{avaliacao.postura}</p>
              </div>
            )}
            {avaliacao.palpacao && (
              <div>
                <span className="font-bold text-gray-700 block">Palpação Tecidual:</span>
                <p className="text-gray-900 mt-0.5">{avaliacao.palpacao}</p>
              </div>
            )}
          </div>
        )}

        {/* Tabelas de ADM por Segmento Selecionado */}
        {admSegmentos.length > 0 ? (
          <div className="space-y-4">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
              Amplitudes Articulares por Segmento Testado
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admSegmentos.map((seg) => (
                <div
                  key={seg.segmento}
                  className="rounded-2xl border border-gray-200 overflow-hidden bg-white text-xs"
                >
                  <div className="bg-blue-50/80 px-3 py-2 font-bold text-blue-900 border-b border-gray-200 flex justify-between">
                    <span>{seg.segmento}</span>
                    <span className="text-[10px] text-gray-500 font-normal">Graus (°)</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px]">
                        <th className="text-left py-1.5 px-3">Movimento</th>
                        <th className="text-center py-1.5 px-2">D (°)</th>
                        <th className="text-center py-1.5 px-2">E (°)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {seg.movimentos.map((mov) => (
                        <tr key={mov.movimento} className="hover:bg-gray-50/50">
                          <td className="py-1.5 px-3 font-medium text-gray-700">{mov.movimento}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-gray-900">
                            {mov.direito !== '' && mov.direito !== undefined
                              ? `${mov.direito}°`
                              : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-gray-900">
                            {mov.esquerdo !== '' && mov.esquerdo !== undefined
                              ? `${mov.esquerdo}°`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Fallback para avaliações antigas */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block">ADM Ombro</span>
              <span className="text-base font-bold text-gray-900">
                {avaliacao.adm_ombro ?? '—'}°
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block">ADM Joelho</span>
              <span className="text-base font-bold text-gray-900">
                {avaliacao.adm_joelho ?? '—'}°
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block">ADM Quadril</span>
              <span className="text-base font-bold text-gray-900">
                {avaliacao.adm_quadril ?? '—'}°
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block">ADM Coluna</span>
              <span className="text-base font-bold text-gray-900">
                {avaliacao.adm_coluna ?? '—'}°
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. TESTES DE FORÇA & TABELA DE FORÇA CORE */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
          <Zap className="h-4 w-4" /> 3. Teste de Força Muscular, Dinamometria e Força Core
        </h3>

        {/* Força Dinamômetro */}
        {gruposForca.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
              Graduação Muscular & Dinamômetro Manual
            </span>
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Grupo Muscular</th>
                    <th className="py-2 px-2 text-center">Grau D</th>
                    <th className="py-2 px-2 text-center">Grau E</th>
                    <th className="py-2 px-2 text-center">Dinamômetro D</th>
                    <th className="py-2 px-2 text-center">Dinamômetro E</th>
                    <th className="py-2 px-3 text-left">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gruposForca.map((grp) => (
                    <tr key={grp.grupo} className="hover:bg-gray-50/50">
                      <td className="py-1.5 px-3 font-semibold text-gray-800">{grp.grupo}</td>
                      <td className="py-1.5 px-2 text-center font-bold text-gray-900">
                        {grp.grau_direito || '5'}/5
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-gray-900">
                        {grp.grau_esquerdo || '5'}/5
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-gray-800">
                        {grp.dinamometro_direito_kgf ? `${grp.dinamometro_direito_kgf} kgf` : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-gray-800">
                        {grp.dinamometro_esquerdo_kgf ? `${grp.dinamometro_esquerdo_kgf} kgf` : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-gray-500">{grp.descricao_livre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabela de Força Core Fixa */}
        {core && (
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E9E1D2] space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-[#8C6527] block">
                  Força Core — Valores de Referência Normativos (Oliveira et al., 2018)
                </span>
                <span className="text-[11px] text-gray-600">
                  Perfil aplicado: Sexo {core.sexo === 'M' ? 'Masculino' : 'Feminino'} | Faixa{' '}
                  {core.faixa_etaria} anos
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl bg-white border border-[#E9E1D2]">
              <table className="w-full text-xs">
                <thead className="bg-[#FAF4EA] text-[10px] uppercase text-gray-600 border-b border-[#E9E1D2]">
                  <tr>
                    <th className="py-2 px-3 text-left">Teste</th>
                    <th className="py-2 px-2 text-center">Realizado</th>
                    <th className="py-2 px-2 text-center">Padrão da Literatura</th>
                    <th className="py-2 px-2 text-center">% Atingido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      nome: 'Prancha Ventral',
                      val: core.prancha_ventral,
                      padrao: refsAtivas.prancha_ventral,
                    },
                    {
                      nome: 'Prancha Lateral D',
                      val: core.prancha_lateral_d,
                      padrao: refsAtivas.prancha_lateral_d,
                    },
                    {
                      nome: 'Prancha Lateral E',
                      val: core.prancha_lateral_e,
                      padrao: refsAtivas.prancha_lateral_e,
                    },
                    {
                      nome: 'Ponte Unilateral D',
                      val: core.ponte_uni_d,
                      padrao: refsAtivas.ponte_uni_d,
                    },
                    {
                      nome: 'Ponte Unilateral E',
                      val: core.ponte_uni_e,
                      padrao: refsAtivas.ponte_uni_e,
                    },
                  ].map((row) => {
                    const r = parseFloat(String(row.val || ''))
                    const pct = r > 0 ? ((r / row.padrao) * 100).toFixed(0) : null
                    return (
                      <tr key={row.nome}>
                        <td className="py-1.5 px-3 font-semibold text-gray-800">{row.nome}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-gray-900">
                          {row.val ? `${row.val} s` : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-gray-600">
                          {row.padrao} s
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {pct ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                Number(pct) >= 90
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : Number(pct) >= 70
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {pct}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {core.observacoes && (
              <p className="text-xs text-gray-600 italic">Obs: {core.observacoes}</p>
            )}
          </div>
        )}
      </div>

      {/* 4. TESTES ESPECIAIS ORTOPÉDICOS */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
          <Target className="h-4 w-4" /> 4. Testes Especiais Ortopédicos por Segmento
        </h3>

        {testesEsp.length > 0 ? (
          <div className="space-y-4">
            {testesEsp.map((seg) => (
              <div
                key={seg.segmento}
                className="rounded-2xl border border-gray-200 overflow-hidden bg-white text-xs"
              >
                <div className="bg-gray-50 px-3 py-2 font-bold text-gray-900 border-b border-gray-200">
                  Segmento: {seg.segmento}
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px]">
                      <th className="text-left py-2 px-3">Manobra Especial</th>
                      <th className="text-center py-2 px-2 w-20">Lado D</th>
                      <th className="text-center py-2 px-2 w-20">Lado E</th>
                      <th className="text-left py-2 px-3">Observações do Teste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {seg.testes.map((t) => (
                      <tr key={t.nome} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3">
                          <span className="font-semibold text-gray-800 block">{t.nome}</span>
                          {t.estrutura && (
                            <span className="text-[10px] text-gray-400">{t.estrutura}</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              t.status_direito === 'POSITIVO'
                                ? 'bg-red-100 text-red-800'
                                : t.status_direito === 'NEGATIVO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'text-gray-400'
                            }`}
                          >
                            {t.status_direito || 'N/R'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              t.status_esquerdo === 'POSITIVO'
                                ? 'bg-red-100 text-red-800'
                                : t.status_esquerdo === 'NEGATIVO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'text-gray-400'
                            }`}
                          >
                            {t.status_esquerdo || 'N/R'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{t.observacao || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-xl text-xs">
            <span className="font-bold text-gray-700 block">Testes Especiais Registrados:</span>
            <p className="text-gray-900 mt-0.5">{avaliacao.testes_especiais || '—'}</p>
          </div>
        )}
      </div>

      {/* 5. SEÇÕES COMPLEMENTARES */}
      {comp &&
        (comp.berg_ativo || comp.tug_ativo || comp.cirtometria_ativo || comp.palmilha_ativo) && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
              <Layers className="h-4 w-4" /> 5. Fichas e Testes Complementares
            </h3>

            {/* Berg */}
            {comp.berg_ativo && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-gray-800">Berg Balance Scale:</span>
                  <span className="text-[#8C6527] text-sm">{comp.berg_total ?? 0} / 56 pontos</span>
                </div>
              </div>
            )}

            {/* TUG */}
            {comp.tug_ativo && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-gray-800">Timed Up and Go (TUG):</span>
                  <span className="text-blue-700 text-sm">
                    {comp.tug_resultado_escolhido ||
                      comp.tug_valida2?.tempo ||
                      comp.tug_valida1?.tempo ||
                      '—'}{' '}
                    segundos
                  </span>
                </div>
              </div>
            )}

            {/* Palmilha */}
            {comp.palmilha_ativo && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
                <span className="font-bold text-gray-800 block">
                  Prescrição de Palmilha Postural:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(comp.palmilha_elementos || {}).map(([k, v]) => {
                    if (!v) return null
                    const elem = ELEMENTOS_PALMILHA.find((e) => e.id === k)
                    return (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 font-semibold"
                      >
                        {elem?.nome || k}
                      </span>
                    )
                  })}
                </div>
                {comp.palmilha_tamanho && (
                  <span className="text-gray-500 block">Tamanho: {comp.palmilha_tamanho}</span>
                )}
              </div>
            )}
          </div>
        )}

      {/* 6. EXAMES ANEXADOS */}
      {((avaliacao.anexos_exames && avaliacao.anexos_exames.length > 0) ||
        (avaliacao.anexos_dinamometro && avaliacao.anexos_dinamometro.length > 0)) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> 6. Arquivos e Exames Anexados ao Prontuário
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {avaliacao.anexos_exames?.map((f) => (
              <a
                key={f}
                href={getFileUrl('avaliacoes_fisioterapia', avaliacao.id, f)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-blue-700 font-medium flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                {f}
              </a>
            ))}
            {avaliacao.anexos_dinamometro?.map((f) => (
              <a
                key={f}
                href={getFileUrl('avaliacoes_fisioterapia', avaliacao.id, f)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                {f} (Dinamômetro)
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 7. CONCLUSÃO COM IA, DIAGNÓSTICO DISFUNCIONAL & PLANO SEMANAL */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> 7. Raciocínio Clínico, Diagnóstico Disfuncional e Plano
          Semanal
        </h3>

        <div className="space-y-4 text-xs">
          {avaliacao.hipotese_diagnostica_ia && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70">
              <span className="font-bold text-amber-950 uppercase tracking-wider block mb-1">
                Hipótese Diagnóstica (Cruzamento de Evidências Clínicas & Exames):
              </span>
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {avaliacao.hipotese_diagnostica_ia}
              </p>
            </div>
          )}

          <div>
            <span className="font-bold text-gray-700 block">
              Diagnóstico Fisioterapêutico / Cinético-Funcional:
            </span>
            <p className="text-gray-900 mt-0.5 font-medium leading-relaxed">
              {avaliacao.diagnostico_disfuncional || avaliacao.diagnostico_fisioterapeutico || '—'}
            </p>
          </div>

          <div>
            <span className="font-bold text-gray-700 block">Objetivos Terapêuticos:</span>
            <p className="text-gray-900 mt-0.5 leading-relaxed whitespace-pre-wrap">
              {avaliacao.objetivos_tratamento || '—'}
            </p>
          </div>

          {/* Plano Semanal */}
          {planoSemanal.length > 0 ? (
            <div className="space-y-2 pt-2">
              <span className="font-bold text-gray-800 uppercase tracking-wider block">
                Plano de Tratamento Semana a Semana
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {planoSemanal.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px]">
                        {s.semana}
                      </span>
                      <span className="font-bold text-gray-900 text-xs">{s.foco}</span>
                    </div>
                    <p className="text-gray-700 text-xs leading-relaxed">{s.condutas}</p>
                    {s.criterios_evolucao && (
                      <span className="text-[11px] text-gray-500 block pt-1 border-t border-gray-200">
                        Critérios: {s.criterios_evolucao}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <span className="font-bold text-gray-700 block">Plano de Tratamento:</span>
              <p className="text-gray-900 mt-0.5 leading-relaxed whitespace-pre-wrap">
                {avaliacao.plano_tratamento || '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
