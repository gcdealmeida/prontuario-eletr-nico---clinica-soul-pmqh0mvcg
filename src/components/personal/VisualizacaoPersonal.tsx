import React from 'react'
import {
  User,
  PieChart,
  Zap,
  Ruler,
  Eye,
  Shield,
  Activity,
  Target,
  FileText,
  FileImage,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import type { AvaliacaoPersonalRecord } from '@/types/database'
import { getFileUrl } from '@/services/avaliacoes'
import {
  calcularIMC,
  calcularRCQ,
  classificarBancoDeWells,
  classificarFlexitest,
  classificarGuedes,
  calcularMcGillIndices,
  calcularFMS,
  PROTOCOLOS_CONFIG,
  type ProtocoloDobras,
  type Sexo,
} from '@/lib/personalPhysicalTest'

interface VisualizacaoPersonalProps {
  avaliacao: AvaliacaoPersonalRecord
}

export const VisualizacaoPersonal: React.FC<VisualizacaoPersonalProps> = ({ avaliacao }) => {
  const anamnese = avaliacao.anamnese_personal || {}
  const comp = avaliacao.composicao_corporal || {}
  const forca = avaliacao.forca_dinamometro || {}
  const flex = avaliacao.flexibilidade_dados || {}
  const postural = avaliacao.postural_dados || {}
  const core = avaliacao.core_mcgill || {}
  const fms = avaliacao.fms_dados || {}
  const metas = avaliacao.metas_treino || {}

  const iaPlano = avaliacao.ia_plano_treino || {}
  const planoSemanal =
    iaPlano.plano_tratamento_semanal || (avaliacao as any).plano_semanal_detalhado || []

  const sexo: Sexo = anamnese.sexo || 'M'
  const idade = anamnese.idade || 30
  const peso = avaliacao.peso || anamnese.peso || 0
  const altura = avaliacao.altura || anamnese.altura || 0

  const imcCalc = calcularIMC(peso, altura)
  const cintura = comp.perimetros?.cintura || anamnese.circ_cintura || avaliacao.circ_cintura || 0
  const quadril = comp.perimetros?.quadril || anamnese.circ_quadril || avaliacao.circ_quadril || 0
  const rcqCalc = calcularRCQ(cintura, quadril, sexo)

  const pctGordura = comp.percentual_gordura ?? avaliacao.percentual_gordura
  const massaGorda = comp.massa_gorda_kg
  const massaMagra = comp.massa_magra_kg
  const pesoIdeal = comp.peso_ideal_kg

  // McGill
  const mcgillCalc = calcularMcGillIndices({
    flexaoTroncoSeg: core.flexao_tronco_seg,
    extensaoBieringSeg: core.extensao_biering_seg,
    pranchaLatDirSeg: core.prancha_lat_d_seg,
    pranchaLatEsqSeg: core.prancha_lat_e_seg,
  })

  // FMS
  const fmsCalc = fms.itens ? calcularFMS(fms.itens) : null

  // Wells
  const melhorWells =
    flex.banco_wells?.melhor_medida_cm ?? avaliacao.flexibilidade_sit_reach ?? null
  const wellsClassif =
    melhorWells !== null ? classificarBancoDeWells(melhorWells, sexo, idade) : null

  return (
    <div className="space-y-8 text-xs text-gray-800">
      {/* 1. IDENTIFICAÇÃO & ANAMNESE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-lg bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <User className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            1. Identificação, Antropometria Inicial & Sinais Vitais
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">
              Objetivo Principal
            </span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block">
              {avaliacao.objetivo_principal || 'Condicionamento'}
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">
              Nível & Frequência
            </span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block">
              {avaliacao.nivel_experiencia || 'Intermediário'} •{' '}
              {avaliacao.frequencia_semanal || '—'} dias/sem
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">
              Pressão Arterial
            </span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block font-mono">
              {anamnese.pressao_arterial || '—'}
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">FC Repouso</span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block font-mono">
              {anamnese.fc_repouso ? `${anamnese.fc_repouso} bpm` : '—'}
            </span>
          </div>
        </div>

        {/* Cards de Métricas: Peso, Altura, IMC, RCQ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">
              Peso Corporal
            </span>
            <span className="text-base font-bold text-gray-900 mt-0.5 block font-mono">
              {peso || '—'} kg
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Altura</span>
            <span className="text-base font-bold text-gray-900 mt-0.5 block font-mono">
              {altura || '—'} m
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${imcCalc?.cor || 'bg-gray-50'}`}>
            <span className="text-gray-600 block text-[10px] uppercase font-bold">
              IMC Automático
            </span>
            <span className="text-base font-black mt-0.5 block font-mono">
              {imcCalc ? `${imcCalc.valor} kg/m²` : '—'}
            </span>
            <span className="text-[10px] font-semibold block">{imcCalc?.classificacao}</span>
          </div>

          <div className={`p-3 rounded-2xl border ${rcqCalc?.cor || 'bg-gray-50'}`}>
            <span className="text-gray-600 block text-[10px] uppercase font-bold">
              RCQ (Cintura/Quadril)
            </span>
            <span className="text-base font-black mt-0.5 block font-mono">
              {rcqCalc ? rcqCalc.valor : '—'}
            </span>
            <span className="text-[10px] font-semibold block">{rcqCalc?.risco}</span>
          </div>
        </div>

        {avaliacao.restricoes_treino && (
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block text-[11px]">
              Restrições Médicas & Lesões Prévias:
            </span>
            <p className="text-amber-950 mt-0.5 leading-relaxed">{avaliacao.restricoes_treino}</p>
          </div>
        )}
      </div>

      {/* 2. COMPOSIÇÃO CORPORAL (PHYSICAL TEST) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <PieChart className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            2. Composição Corporal (Physical Test — {comp.protocolo || 'Pollock 7 dobras'})
          </h3>
        </div>

        {/* 4 Cards de Destaque da Composição */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2]">
            <span className="text-[10px] uppercase font-bold text-[#8C6527] block">
              % Gordura Corporal
            </span>
            <span className="text-2xl font-black text-[#8C6527] mt-0.5 block font-mono">
              {pctGordura !== undefined && pctGordura !== null ? `${pctGordura}%` : '—'}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">
              Densidade: {comp.densidade_corporal ? `${comp.densidade_corporal} g/cm³` : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">
              Massa Gorda (MG)
            </span>
            <span className="text-2xl font-black text-amber-900 mt-0.5 block font-mono">
              {massaGorda ? `${massaGorda} kg` : '—'}
            </span>
            <span className="text-[10px] text-amber-700 mt-0.5 block">Tecido Adiposo Total</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              Massa Magra (MLG)
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block font-mono">
              {massaMagra ? `${massaMagra} kg` : '—'}
            </span>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              Músculo, esqueleto e água
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-800 block">
              Peso Ideal Estimado
            </span>
            <span className="text-2xl font-black text-blue-900 mt-0.5 block font-mono">
              {pesoIdeal ? `${pesoIdeal} kg` : '—'}
            </span>
            <span className="text-[10px] text-blue-700 mt-0.5 block">
              Meta Alvo ({sexo === 'M' ? '15%' : '22%'} %G)
            </span>
          </div>
        </div>

        {/* Dobras Cutâneas Medidas */}
        {comp.dobras && Object.keys(comp.dobras).length > 0 && (
          <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Dobras Cutâneas Coletadas (mm):
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(comp.dobras).map(([key, val]) => (
                <div
                  key={key}
                  className="p-2 bg-white rounded-xl border border-gray-200 text-center"
                >
                  <span className="text-[10px] font-semibold text-gray-500 uppercase block truncate">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-gray-900 font-mono mt-0.5 block">
                    {val} mm
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perímetros Corporais */}
        {comp.perimetros && Object.keys(comp.perimetros).length > 0 && (
          <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Perímetros & Circunferências (cm):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {Object.entries(comp.perimetros).map(([k, v]) => (
                <div key={k} className="p-2 bg-white rounded-xl border border-gray-200 text-center">
                  <span className="text-[10px] font-medium text-gray-500 block truncate">
                    {k.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-gray-900 font-mono mt-0.5 block">
                    {v} cm
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. FORÇA MUSCULAR — DINAMÔMETRO MANUAL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            3. Força Muscular — Dinamômetro Manual
          </h3>
        </div>

        {forca.movimentos && forca.movimentos.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] text-[#8C6527] uppercase text-[10px] border-b border-[#E9E1D2]">
                <tr>
                  <th className="p-2.5 font-bold">Teste / Grupo</th>
                  <th className="p-2.5 font-bold text-center">Direito (kgf)</th>
                  <th className="p-2.5 font-bold text-center">Esquerdo (kgf)</th>
                  <th className="p-2.5 font-bold text-center">Assimetria (%)</th>
                  <th className="p-2.5 font-bold text-center">Força Relativa (kgf/kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forca.movimentos.map((m: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2.5 font-semibold text-gray-800">{m.nome}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-gray-900">
                      {m.direitoKgf ?? '—'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-gray-900">
                      {m.esquerdoKgf ?? '—'}
                    </td>
                    <td className="p-2.5 text-center">
                      {m.assimetriaPct ? (
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                            Number(m.assimetriaPct) > 15
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {m.assimetriaPct}%
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[11px] text-gray-600">
                      {m.forcaRelativaD || m.forcaRelativaE ? (
                        <span>
                          D: {m.forcaRelativaD || '—'} | E: {m.forcaRelativaE || '—'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Descrição Aberta do Dinamômetro */}
        {avaliacao.forca_muscular_descricao && (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] block">
              Laudo Descritivo & Leituras do Dinamômetro:
            </span>
            <p className="text-gray-900 whitespace-pre-wrap font-mono sm:font-sans leading-relaxed">
              {avaliacao.forca_muscular_descricao}
            </p>
          </div>
        )}

        {/* Anexos de Dinamômetro */}
        {avaliacao.anexos_dinamometro && avaliacao.anexos_dinamometro.length > 0 && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] font-bold text-gray-600">Arquivos do Dinamômetro:</span>
            {avaliacao.anexos_dinamometro.map((file: string) => (
              <a
                key={file}
                href={getFileUrl('avaliacoes_personal', avaliacao.id, file)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors text-[11px] font-medium"
              >
                <FileText className="h-3 w-3" /> {file}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 4. FLEXIBILIDADE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Ruler className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            4. Flexibilidade (Banco de Wells & Flexitest)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card Wells */}
          <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] block">
              Banco de Wells (Sentar e Alcançar)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-gray-900 font-mono">
                {melhorWells !== null ? `${melhorWells} cm` : '—'}
              </span>
              {wellsClassif && (
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${wellsClassif.cor}`}
                >
                  {wellsClassif.classificacao}
                </span>
              )}
            </div>
            {flex.banco_wells && (
              <div className="text-[10px] text-gray-500 flex gap-3 pt-1 border-t border-gray-100">
                <span>1ª: {flex.banco_wells.medida1_cm || '—'} cm</span>
                <span>2ª: {flex.banco_wells.medida2_cm || '—'} cm</span>
                <span>3ª: {flex.banco_wells.medida3_cm || '—'} cm</span>
              </div>
            )}
          </div>

          {/* Card Flexitest */}
          {flex.flexitest_ativo && (
            <div className="p-4 rounded-2xl bg-white border border-[#E9E1D2] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] block">
                Flexitest (Cláudio Gil Araújo - 20 Movimentos)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-gray-900 font-mono">
                  {flex.flexitest_total || 0} / 80 pts
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-purple-50 text-purple-800 border border-purple-200">
                  {flex.flexitest_classificacao || 'Avaliado'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 block pt-1 border-t border-gray-100">
                Índice global Fleximax de flexibilidade passiva
              </span>
            </div>
          )}
        </div>

        {flex.observacoes && (
          <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <strong>Observações de Flexibilidade:</strong> {flex.observacoes}
          </p>
        )}
      </div>

      {/* 5. AVALIAÇÃO POSTURAL ESTÁTICA */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Eye className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            5. Avaliação Postural Estática
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Anterior */}
          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1.5">
            <span className="text-[11px] font-bold text-blue-900 block border-b border-gray-200 pb-1">
              Vista Anterior
            </span>
            {postural.vista_anterior && Object.keys(postural.vista_anterior).length > 0 ? (
              <div className="space-y-1 text-[11px]">
                {Object.entries(postural.vista_anterior).map(([k, v]: [string, any]) => (
                  <div key={k} className="flex justify-between items-start gap-1">
                    <span className="text-gray-600 truncate">{k.replace('_', ' ')}:</span>
                    <span
                      className={`font-bold shrink-0 ${
                        v.status === 'ALTERADO' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-[11px]">Sem alterações registradas</span>
            )}
          </div>

          {/* Posterior */}
          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1.5">
            <span className="text-[11px] font-bold text-purple-900 block border-b border-gray-200 pb-1">
              Vista Posterior
            </span>
            {postural.vista_posterior && Object.keys(postural.vista_posterior).length > 0 ? (
              <div className="space-y-1 text-[11px]">
                {Object.entries(postural.vista_posterior).map(([k, v]: [string, any]) => (
                  <div key={k} className="flex justify-between items-start gap-1">
                    <span className="text-gray-600 truncate">{k.replace('_', ' ')}:</span>
                    <span
                      className={`font-bold shrink-0 ${
                        v.status === 'ALTERADO' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-[11px]">Sem alterações registradas</span>
            )}
          </div>

          {/* Lateral */}
          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1.5">
            <span className="text-[11px] font-bold text-orange-900 block border-b border-gray-200 pb-1">
              Vista Lateral (Sagital)
            </span>
            {postural.vista_lateral && Object.keys(postural.vista_lateral).length > 0 ? (
              <div className="space-y-1 text-[11px]">
                {Object.entries(postural.vista_lateral).map(([k, v]: [string, any]) => (
                  <div key={k} className="flex justify-between items-start gap-1">
                    <span className="text-gray-600 truncate">{k.replace('_', ' ')}:</span>
                    <span
                      className={`font-bold shrink-0 ${
                        v.status === 'ALTERADO' ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-[11px]">Sem alterações registradas</span>
            )}
          </div>
        </div>

        {postural.conclusao_postural && (
          <p className="text-xs text-gray-800 bg-[#FAF5EE] p-3 rounded-2xl border border-[#E9E1D2] leading-relaxed">
            <strong>Conclusão Postural:</strong> {postural.conclusao_postural}
          </p>
        )}

        {/* Fotos Posturais Anexadas */}
        {avaliacao.anexos_postura && avaliacao.anexos_postura.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-600 block">Fotos Posturais:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {avaliacao.anexos_postura.map((foto: string) => (
                <a
                  key={foto}
                  href={getFileUrl('avaliacoes_personal', avaliacao.id, foto)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-center hover:border-[#8C6527] transition-all block"
                >
                  <FileImage className="h-6 w-6 text-[#8C6527] mx-auto mb-1" />
                  <span className="text-[10px] text-gray-700 truncate block font-medium">
                    {foto}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. TESTES FUNCIONAIS DE CORE (MCGILL) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            6. Teste Funcional de Core (McGill Torso Endurance)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 font-semibold block">Prancha Ventral</span>
            <span className="text-sm font-bold text-gray-900 font-mono mt-0.5 block">
              {core.prancha_ventral_seg ? `${core.prancha_ventral_seg}s` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 font-semibold block">
              Extensão (Sørensen)
            </span>
            <span className="text-sm font-bold text-gray-900 font-mono mt-0.5 block">
              {core.extensao_biering_seg ? `${core.extensao_biering_seg}s` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 font-semibold block">Flexão a 60°</span>
            <span className="text-sm font-bold text-gray-900 font-mono mt-0.5 block">
              {core.flexao_tronco_seg ? `${core.flexao_tronco_seg}s` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 font-semibold block">Lateral Direita</span>
            <span className="text-sm font-bold text-gray-900 font-mono mt-0.5 block">
              {core.prancha_lat_d_seg ? `${core.prancha_lat_d_seg}s` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 font-semibold block">Lateral Esquerda</span>
            <span className="text-sm font-bold text-gray-900 font-mono mt-0.5 block">
              {core.prancha_lat_e_seg ? `${core.prancha_lat_e_seg}s` : '—'}
            </span>
          </div>
        </div>

        {/* Índices McGill */}
        <div className="p-3 bg-[#FAF5EE] rounded-2xl border border-[#E9E1D2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>
              Flex/Ext: <strong>{mcgillCalc.razaoFlexaoExtensao ?? '—'}</strong> (&lt;1.0)
            </span>
            <span>
              Lat/Ext: <strong>{mcgillCalc.razaoLateralExtensao ?? '—'}</strong> (&lt;0.75)
            </span>
            <span>
              Lat D/E: <strong>{mcgillCalc.razaoLateralD_E ?? '—'}</strong> (0.85-1.15)
            </span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              mcgillCalc.equilibrado
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {mcgillCalc.equilibrado ? 'Core Equilibrado' : 'Desequilíbrio Detectado'}
          </span>
        </div>
      </div>

      {/* 7. FMS — FUNCTIONAL MOVEMENT SCREEN */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            7. FMS — Functional Movement Screen
          </h3>
        </div>

        {/* Header FMS: Total /21 e Assimetrias */}
        <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6527] block">
              Score Total FMS & Risco de Lesão
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-gray-900 font-mono">
                {fms.score_total ?? (fmsCalc ? fmsCalc.scoreTotal : 0)} / 21 pts
              </span>
              <span className="text-xs font-bold text-amber-800">
                • {fms.assimetrias_total ?? (fmsCalc ? fmsCalc.assimetrias : 0)} assimetria(s)
              </span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              fmsCalc ? fmsCalc.corRisco : 'bg-gray-100 text-gray-700'
            }`}
          >
            {fms.classificacao_risco || fmsCalc?.classificacaoRisco || 'Avaliado'}
          </span>
        </div>

        {/* Tabela dos 7 Testes FMS */}
        {fmsCalc && fmsCalc.detalhesPorTeste.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] text-[#8C6527] text-[10px] uppercase border-b border-[#E9E1D2]">
                <tr>
                  <th className="p-2.5 font-bold">Teste Funcional</th>
                  <th className="p-2.5 font-bold text-center">Direito</th>
                  <th className="p-2.5 font-bold text-center">Esquerdo</th>
                  <th className="p-2.5 font-bold text-center">Nota Final</th>
                  <th className="p-2.5 font-bold text-center">Assimetria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fmsCalc.detalhesPorTeste.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-2.5 font-semibold text-gray-800">{t.nome}</td>
                    <td className="p-2.5 text-center font-mono">
                      {t.notaDireita !== undefined ? t.notaDireita : '—'}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      {t.notaEsquerda !== undefined ? t.notaEsquerda : '—'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-gray-900">
                      {t.notaFinal}
                    </td>
                    <td className="p-2.5 text-center">
                      {t.assimetrico ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Sim (D≠E)
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">Não</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {fms.estrategia_treino && (
          <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
            <strong>Estratégia e Conduta de Treino com base no FMS:</strong> {fms.estrategia_treino}
          </p>
        )}
      </div>

      {/* 8. METAS, ANÁLISE INTEGRADA & PRESCRIÇÃO */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1.5 border-b-2 border-[#E9E1D2]">
          <div className="h-6 w-6 rounded-xl bg-[#FAF5EE] border border-[#E9E1D2] flex items-center justify-center text-[#8C6527]">
            <Target className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            8. Prescrição de Treinamento, Metas & Análise Integrada
          </h3>
        </div>

        {/* Hipótese Diagnóstica / Avaliação Funcional da IA */}
        {(avaliacao.hipotese_diagnostica_ia || iaPlano.hipotese_diagnostica) && (
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-950 font-bold uppercase tracking-wider text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-[#8C6527]" />
              <span>Hipótese Diagnóstica / Avaliação Funcional (Physical Test Integrado):</span>
            </div>
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {avaliacao.hipotese_diagnostica_ia || iaPlano.hipotese_diagnostica}
            </p>
          </div>
        )}

        {/* Diagnóstico Funcional (Pontos Fortes & Limitações) */}
        {(avaliacao.diagnostico_funcional || iaPlano.diagnostico_funcional) && (
          <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-1">
            <span className="font-bold text-gray-800 uppercase tracking-wider text-[10px] block">
              Diagnóstico Funcional (Pontos Fortes & Limitações Prioritárias):
            </span>
            <p className="text-gray-900 leading-relaxed font-medium whitespace-pre-wrap">
              {avaliacao.diagnostico_funcional || iaPlano.diagnostico_funcional}
            </p>
          </div>
        )}

        {/* Objetivos do Treinamento Priorizados */}
        {(avaliacao.objetivos_treinamento || iaPlano.objetivos_treinamento) && (
          <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-1">
            <span className="font-bold text-gray-800 uppercase tracking-wider text-[10px] block">
              Objetivos do Treinamento Priorizados:
            </span>
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {avaliacao.objetivos_treinamento || iaPlano.objetivos_treinamento}
            </p>
          </div>
        )}

        {/* Metas 3 Fases (Curto, Médio, Longo Prazo) */}
        {(metas.meta_curto_prazo || metas.meta_medio_prazo || metas.meta_longo_prazo) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {metas.meta_curto_prazo && (
              <div className="p-3 bg-white rounded-xl border border-[#E9E1D2]">
                <span className="text-[10px] font-bold text-[#8C6527] uppercase block">
                  Curto Prazo (30-60 dias):
                </span>
                <p className="text-gray-800 mt-1 leading-relaxed">{metas.meta_curto_prazo}</p>
              </div>
            )}
            {metas.meta_medio_prazo && (
              <div className="p-3 bg-white rounded-xl border border-[#E9E1D2]">
                <span className="text-[10px] font-bold text-[#8C6527] uppercase block">
                  Médio Prazo (3-6 meses):
                </span>
                <p className="text-gray-800 mt-1 leading-relaxed">{metas.meta_medio_prazo}</p>
              </div>
            )}
            {metas.meta_longo_prazo && (
              <div className="p-3 bg-white rounded-xl border border-[#E9E1D2]">
                <span className="text-[10px] font-bold text-[#8C6527] uppercase block">
                  Longo Prazo (12 meses):
                </span>
                <p className="text-gray-800 mt-1 leading-relaxed">{metas.meta_longo_prazo}</p>
              </div>
            )}
          </div>
        )}

        {metas.divisao_rotina && (
          <div className="p-3 bg-white rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold text-gray-600 uppercase block">
              Divisão Semanal da Rotina:
            </span>
            <span className="text-sm font-bold text-gray-900 mt-0.5 block">
              {metas.divisao_rotina}
            </span>
          </div>
        )}

        {/* Plano de Treinamento Semana a Semana (12 Semanas Periodizadas) */}
        {planoSemanal.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 uppercase tracking-wider text-xs block">
                Plano de Treinamento Periodizado (12 Semanas)
              </span>
              <span className="text-[11px] text-[#8C6527] font-semibold">
                {planoSemanal.length} fases registradas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {planoSemanal.map((s: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white font-bold text-[10px]">
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
        ) : avaliacao.plano_treino ? (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
              Plano de Treino Detalhado:
            </span>
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
              {avaliacao.plano_treino}
            </p>
          </div>
        ) : null}

        {avaliacao.observacoes && (
          <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <strong>Observações Gerais:</strong> {avaliacao.observacoes}
          </p>
        )}
      </div>
    </div>
  )
}
