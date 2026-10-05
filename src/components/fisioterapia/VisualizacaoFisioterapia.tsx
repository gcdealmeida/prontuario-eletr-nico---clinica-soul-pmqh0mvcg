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
import { BERG_ITENS, ELEMENTOS_PALMILHA, CIRTOMETRIA_REGIOES_PADRAO } from '@/lib/fisioterapiaModel'
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
  Footprints,
  Calendar,
  TrendingDown,
  TrendingUp,
  Minus,
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
  const descricaoForca = avaliacao.forca_muscular_descricao
  const gruposForca: ForcaGrupoItem[] = avaliacao.forca_muscular_grupos || []
  const core: ForcaCoreTabela | undefined = avaliacao.forca_core_tabela
  const testesEsp: TestesEspeciaisSegmento[] = (avaliacao.testes_especiais_segmentos || []).filter(
    (s) => s.ativo,
  )
  const comp: SecoesComplementaresFisio | undefined = avaliacao.secoes_complementares
  const planoSemanal: PlanoSemanalItem[] = avaliacao.plano_semanal_detalhado || []

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

      {/* 3. TESTE DE FORÇA MUSCULAR & DINAMOMETRIA (CAIXA DE DESCRIÇÃO ABERTA) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 p-2.5 rounded-xl flex items-center gap-2">
          <Zap className="h-4 w-4" /> 3. Teste de Força Muscular & Dinamometria
        </h3>

        {/* Caixa de Descrição Aberta */}
        {descricaoForca ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-[#8C6527] uppercase tracking-wider block">
              Avaliação de Força Muscular e Leituras do Dinamômetro:
            </span>
            <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-mono sm:font-sans bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              {descricaoForca}
            </p>
          </div>
        ) : gruposForca.length > 0 ? (
          /* Fallback legível para prontuários legados preenchidos antes da alteração */
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
            <span className="font-bold text-gray-700 block">
              Registro de Força Muscular (Prontuário Anterior):
            </span>
            <div className="space-y-1 text-gray-800">
              {gruposForca.map((grp) => (
                <div key={grp.grupo} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="font-medium">{grp.grupo}</span>
                  <span>
                    D: {grp.grau_direito || '5'}/5{' '}
                    {grp.dinamometro_direito_kgf ? `(${grp.dinamometro_direito_kgf} kgf)` : ''} | E:{' '}
                    {grp.grau_esquerdo || '5'}/5{' '}
                    {grp.dinamometro_esquerdo_kgf ? `(${grp.dinamometro_esquerdo_kgf} kgf)` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-500">
            Nenhuma observação de força muscular registrada para esta avaliação.
          </div>
        )}

        {/* Anexos de Dinamômetro na seção de força */}
        {avaliacao.anexos_dinamometro && avaliacao.anexos_dinamometro.length > 0 && (
          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-2">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-700" />
              Arquivos / Prints de Dinamômetro Vinculados:
            </span>
            <div className="flex flex-wrap gap-2">
              {avaliacao.anexos_dinamometro.map((f) => (
                <a
                  key={f}
                  href={getFileUrl('avaliacoes_fisioterapia', avaliacao.id, f)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                  <span className="truncate max-w-xs">{f}</span>
                </a>
              ))}
            </div>
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
        (comp.berg_ativo ||
          comp.tug_ativo ||
          comp.cirtometria_ativo ||
          comp.goniometria_ativo ||
          comp.palmilha_ativo) && (
          <div className="space-y-6">
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

            {/* Cirtometria com Comparação Evolutiva entre Fases */}
            {comp.cirtometria_ativo && (
              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 text-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-gray-200">
                  <span className="font-bold text-sm text-gray-900 block">
                    Cirtometria / Perimetria de Membros Inferiores — Análise Comparativa por Fases
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Evolução cronológica de perímetros com destaque de variações (D / E)
                  </span>
                </div>

                {/* Normalização de fases (compatibilidade com versões anteriores) */}
                {(() => {
                  const fases =
                    comp.cirtometria_fases && comp.cirtometria_fases.length > 0
                      ? [...comp.cirtometria_fases].sort(
                          (a, b) =>
                            new Date(a.data || '').getTime() - new Date(b.data || '').getTime(),
                        )
                      : comp.cirtometria_dados
                        ? [
                            {
                              id: 'legado',
                              fase: 'Medida Inicial',
                              data: avaliacao.data_avaliacao || '',
                              medidas: comp.cirtometria_dados,
                            },
                          ]
                        : []

                  if (fases.length === 0) {
                    return <p className="text-gray-500">Nenhuma medição registrada.</p>
                  }

                  const primeiraFase = fases[0]
                  const ultimaFase = fases[fases.length - 1]
                  const temComparativo = fases.length > 1

                  return (
                    <div className="space-y-4">
                      {/* Tabela Comparativa de Perímetros */}
                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                            <tr>
                              <th className="py-2 px-3 text-left font-bold">Região / Ponto</th>
                              {fases.map((f, i) => (
                                <th
                                  key={f.id || i}
                                  colSpan={2}
                                  className="py-2 px-2 text-center font-bold border-l border-gray-200"
                                >
                                  <div>{f.fase || `Fase ${i + 1}`}</div>
                                  <div className="text-[9px] font-normal text-gray-400">
                                    {f.data || 'Data N/I'}
                                  </div>
                                </th>
                              ))}
                              {temComparativo && (
                                <th
                                  colSpan={2}
                                  className="py-2 px-2 text-center font-bold border-l-2 border-[#8C6527] bg-[#FAF4EA] text-[#8C6527]"
                                >
                                  <div>Variação Total (Última vs Inicial)</div>
                                  <div className="text-[9px] font-normal">Diferença em cm</div>
                                </th>
                              )}
                            </tr>
                            <tr className="border-t border-gray-200 text-[9px] text-gray-400">
                              <th className="py-1 px-3 text-left"></th>
                              {fases.map((f, i) => (
                                <React.Fragment key={`sub-${f.id || i}`}>
                                  <th className="py-1 px-2 text-center border-l border-gray-100">
                                    D
                                  </th>
                                  <th className="py-1 px-2 text-center">E</th>
                                </React.Fragment>
                              ))}
                              {temComparativo && (
                                <React.Fragment key="sub-diff">
                                  <th className="py-1 px-2 text-center border-l-2 border-[#8C6527] bg-[#FAF4EA] text-[#8C6527] font-bold">
                                    D (Δ)
                                  </th>
                                  <th className="py-1 px-2 text-center bg-[#FAF4EA] text-[#8C6527] font-bold">
                                    E (Δ)
                                  </th>
                                </React.Fragment>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {CIRTOMETRIA_REGIOES_PADRAO.map((reg) => {
                              // Valores da primeira fase
                              const dIni = parseFloat(primeiraFase.medidas?.[reg]?.direito || '')
                              const eIni = parseFloat(primeiraFase.medidas?.[reg]?.esquerdo || '')
                              // Valores da última fase
                              const dUlt = parseFloat(ultimaFase.medidas?.[reg]?.direito || '')
                              const eUlt = parseFloat(ultimaFase.medidas?.[reg]?.esquerdo || '')

                              const diffD = !isNaN(dIni) && !isNaN(dUlt) ? dUlt - dIni : null
                              const diffE = !isNaN(eIni) && !isNaN(eUlt) ? eUlt - eIni : null

                              return (
                                <tr key={reg} className="hover:bg-gray-50/50">
                                  <td className="py-2 px-3 font-semibold text-gray-800">{reg}</td>
                                  {fases.map((f, i) => (
                                    <React.Fragment key={`cell-${f.id || i}`}>
                                      <td className="py-2 px-2 text-center font-mono border-l border-gray-100">
                                        {f.medidas?.[reg]?.direito
                                          ? `${f.medidas[reg]?.direito} cm`
                                          : '—'}
                                      </td>
                                      <td className="py-2 px-2 text-center font-mono">
                                        {f.medidas?.[reg]?.esquerdo
                                          ? `${f.medidas[reg]?.esquerdo} cm`
                                          : '—'}
                                      </td>
                                    </React.Fragment>
                                  ))}
                                  {temComparativo && (
                                    <React.Fragment key="cell-diff">
                                      <td className="py-2 px-2 text-center font-mono font-bold border-l-2 border-[#8C6527] bg-[#FAF4EA]/50">
                                        {diffD !== null ? (
                                          <span
                                            className={`inline-flex items-center gap-0.5 ${
                                              diffD > 0
                                                ? 'text-emerald-700'
                                                : diffD < 0
                                                  ? 'text-blue-700'
                                                  : 'text-gray-500'
                                            }`}
                                          >
                                            {diffD > 0 ? (
                                              <TrendingUp className="h-3 w-3 inline" />
                                            ) : diffD < 0 ? (
                                              <TrendingDown className="h-3 w-3 inline" />
                                            ) : (
                                              <Minus className="h-3 w-3 inline" />
                                            )}
                                            {diffD > 0 ? `+${diffD.toFixed(1)}` : diffD.toFixed(1)}{' '}
                                            cm
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                      <td className="py-2 px-2 text-center font-mono font-bold bg-[#FAF4EA]/50">
                                        {diffE !== null ? (
                                          <span
                                            className={`inline-flex items-center gap-0.5 ${
                                              diffE > 0
                                                ? 'text-emerald-700'
                                                : diffE < 0
                                                  ? 'text-blue-700'
                                                  : 'text-gray-500'
                                            }`}
                                          >
                                            {diffE > 0 ? (
                                              <TrendingUp className="h-3 w-3 inline" />
                                            ) : diffE < 0 ? (
                                              <TrendingDown className="h-3 w-3 inline" />
                                            ) : (
                                              <Minus className="h-3 w-3 inline" />
                                            )}
                                            {diffE > 0 ? `+${diffE.toFixed(1)}` : diffE.toFixed(1)}{' '}
                                            cm
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                    </React.Fragment>
                                  )}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Observações das Fases */}
                      {fases.some((f) => f.observacoes) && (
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-gray-200">
                          <span className="font-bold text-[11px] text-gray-700 block">
                            Notas Clínicas das Fases de Cirtometria:
                          </span>
                          {fases.map(
                            (f, i) =>
                              f.observacoes && (
                                <div key={i} className="text-gray-700 text-xs">
                                  <span className="font-semibold">
                                    {f.fase || `Fase ${i + 1}`}:
                                  </span>{' '}
                                  {f.observacoes}
                                </div>
                              ),
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Goniometria: Segmento — Movimento (Esq X° / Dir Y°) com Assimetria */}
            {comp.goniometria_ativo && (
              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-gray-200">
                  <span className="font-bold text-sm text-gray-900 block">
                    Goniometria Articular Específica
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Registro de segmento e movimento com destaque para assimetrias
                  </span>
                </div>

                {comp.goniometria_avaliacoes && comp.goniometria_avaliacoes.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3 text-left font-bold">Data</th>
                          <th className="py-2.5 px-3 text-left font-bold">Segmento & Movimento</th>
                          <th className="py-2.5 px-3 text-center font-bold">Lado Esquerdo</th>
                          <th className="py-2.5 px-3 text-center font-bold">Lado Direito</th>
                          <th className="py-2.5 px-3 text-center font-bold">
                            Assimetria (|D - E|)
                          </th>
                          <th className="py-2.5 px-3 text-left font-bold">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {comp.goniometria_avaliacoes.map((item) => {
                          const esqNum = parseFloat(String(item.esquerdo_graus || ''))
                          const dirNum = parseFloat(String(item.direito_graus || ''))
                          const temValores = !isNaN(esqNum) && !isNaN(dirNum)
                          const assimetria = temValores ? Math.abs(dirNum - esqNum) : null
                          const isAssimetriaRelevante = assimetria !== null && assimetria >= 10

                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="py-2.5 px-3 font-mono text-gray-500">
                                {item.data || '—'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-gray-900">
                                  {item.segmento} — {item.movimento}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-800">
                                {item.esquerdo_graus !== '' && item.esquerdo_graus !== undefined
                                  ? `${item.esquerdo_graus}°`
                                  : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-800">
                                {item.direito_graus !== '' && item.direito_graus !== undefined
                                  ? `${item.direito_graus}°`
                                  : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {assimetria !== null ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                      isAssimetriaRelevante
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {assimetria}° {isAssimetriaRelevante ? '(Significativa)' : ''}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600">
                                {item.observacoes || '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : comp.goniometria_medicoes && comp.goniometria_medicoes.length > 0 ? (
                  /* Fallback para avaliações legadas de goniometria */
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="py-2 px-3 text-left">Data</th>
                          <th className="py-2 px-2 text-center">Joelho D</th>
                          <th className="py-2 px-2 text-center">Joelho E</th>
                          <th className="py-2 px-3 text-left">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {comp.goniometria_medicoes.map((m, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">{m.data}</td>
                            <td className="py-2 px-2 text-center font-mono">{m.joelho_d}°</td>
                            <td className="py-2 px-2 text-center font-mono">{m.joelho_e}°</td>
                            <td className="py-2 px-3 text-gray-500">{m.outros || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum registro de goniometria encontrado.</p>
                )}
              </div>
            )}

            {/* Avaliação Podopostural Completa & Prescrição da Palmilha */}
            {comp.palmilha_ativo && (
              <div className="space-y-4 p-5 bg-[#FAF4EA]/40 rounded-2xl border border-[#DFBF8E]/60 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DFBF8E]/40">
                  <Footprints className="h-4 w-4 text-[#8C6527]" />
                  <span className="font-bold text-sm text-gray-900 block">
                    Avaliação Podopostural e Prescrição de Palmilha
                  </span>
                </div>

                {/* 1. Postura Podal Estática se preenchida */}
                {comp.palmilha_avaliacao &&
                  Object.values(comp.palmilha_avaliacao).some(Boolean) && (
                    <div className="space-y-3">
                      <span className="font-bold text-[11px] text-[#8C6527] uppercase tracking-wider block">
                        Achados da Avaliação Podopostural:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {comp.palmilha_avaliacao.tipo_pisada && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">
                              Pisada Predominante
                            </span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.tipo_pisada}
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.postura_retrope && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">
                              Retropé / Tornozelo
                            </span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.postura_retrope}
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.postura_antepe && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">Antepé</span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.postura_antepe}
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.postura_joelho && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">Joelhos</span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.postura_joelho}
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.plano_sagital && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">Plano Sagital</span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.plano_sagital}
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.perna_curta && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">
                              Dismetria de Membros
                            </span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.perna_curta}{' '}
                              {comp.palmilha_avaliacao.perna_curta_mm
                                ? `(${comp.palmilha_avaliacao.perna_curta_mm}mm)`
                                : ''}
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.jack_test_direito && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">Jack Test (D/E)</span>
                            <span className="font-bold text-gray-900">
                              D: {comp.palmilha_avaliacao.jack_test_direito} | E:{' '}
                              {comp.palmilha_avaliacao.jack_test_esquerdo || 'N/R'}
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.hubscher_modificado && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">
                              Hubscher Modificado
                            </span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.hubscher_modificado}
                            </span>
                          </div>
                        )}
                        {(comp.palmilha_avaliacao.drop_navicular_mm_direito ||
                          comp.palmilha_avaliacao.drop_navicular_mm_esquerdo) && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">
                              Drop do Navicular
                            </span>
                            <span className="font-bold text-gray-900 font-mono">
                              D: {comp.palmilha_avaliacao.drop_navicular_mm_direito || '—'}mm | E:{' '}
                              {comp.palmilha_avaliacao.drop_navicular_mm_esquerdo || '—'}mm
                            </span>
                          </div>
                        )}
                        {comp.palmilha_avaliacao.rotacao_cabeca_estimulo_podal && (
                          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                            <span className="text-[10px] text-gray-500 block">
                              Estímulo Podal / Rotação
                            </span>
                            <span className="font-bold text-gray-900">
                              {comp.palmilha_avaliacao.rotacao_cabeca_estimulo_podal}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* 2. Prescrição Técnica da Palmilha */}
                <div className="space-y-3 pt-2">
                  <span className="font-bold text-[11px] text-[#8C6527] uppercase tracking-wider block">
                    Prescrição da Palmilha & Elementos Posturais:
                  </span>

                  {/* Elementos prescritos */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(
                      comp.palmilha_pedido?.elementos_selecionados || comp.palmilha_elementos || {},
                    ).map(([k, v]) => {
                      if (!v) return null
                      const elem = ELEMENTOS_PALMILHA.find((e) => e.id === k)
                      return (
                        <span
                          key={k}
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#C9A46A] text-gray-800 font-bold shadow-2xs"
                        >
                          {elem?.nome || k}
                        </span>
                      )
                    })}
                  </div>

                  {/* Dados do Pedido */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-3.5 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Modelo Prescrito</span>
                      <span className="font-semibold text-gray-900">
                        {comp.palmilha_pedido?.modelo_palmilha || 'Postural / Proprioceptiva'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Tamanho</span>
                      <span className="font-semibold text-gray-900">
                        {comp.palmilha_pedido?.calçado_tamanho || comp.palmilha_tamanho || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Densidade EVA</span>
                      <span className="font-semibold text-gray-900">
                        {comp.palmilha_pedido?.densidade_eva || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Cobertura</span>
                      <span className="font-semibold text-gray-900">
                        {comp.palmilha_pedido?.cobertura_tipo || '—'}
                      </span>
                    </div>
                    {comp.palmilha_pedido?.espessura_base_mm && (
                      <div>
                        <span className="text-[10px] text-gray-500 block">Espessura Base</span>
                        <span className="font-semibold text-gray-900">
                          {comp.palmilha_pedido.espessura_base_mm}
                        </span>
                      </div>
                    )}
                    {comp.palmilha_pedido?.compensacao_dismetria_mm && (
                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          Compensação Dismetria
                        </span>
                        <span className="font-semibold text-gray-900">
                          {comp.palmilha_pedido.compensacao_dismetria_lado}{' '}
                          {comp.palmilha_pedido.compensacao_dismetria_mm}mm
                        </span>
                      </div>
                    )}
                    {comp.palmilha_pedido?.laboratorio_fornecedor && (
                      <div>
                        <span className="text-[10px] text-gray-500 block">Laboratório</span>
                        <span className="font-semibold text-gray-900">
                          {comp.palmilha_pedido.laboratorio_fornecedor}
                        </span>
                      </div>
                    )}
                    {comp.palmilha_pedido?.prazo_previsto && (
                      <div>
                        <span className="text-[10px] text-gray-500 block">Previsão Entrega</span>
                        <span className="font-semibold text-gray-900">
                          {comp.palmilha_pedido.prazo_previsto}
                        </span>
                      </div>
                    )}
                    {(comp.palmilha_pedido?.observacoes_laboratorio || comp.palmilha_obs) && (
                      <div className="col-span-2 sm:col-span-4 pt-1 border-t border-gray-100">
                        <span className="text-[10px] text-gray-500 block">
                          Observações para Confecção:
                        </span>
                        <span className="text-gray-800">
                          {comp.palmilha_pedido?.observacoes_laboratorio || comp.palmilha_obs}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
