import React from 'react'
import { LogoSOUL } from '@/components/LogoSOUL'
import { formatDataPTBR } from '@/lib/constants'
import type { EvolucaoRecord, Especialidade } from '@/types/database'

interface DocumentoProntuarioInstitucionalProps {
  avaliacao: any
  especialidade: Especialidade | 'Geral'
  listaEvolucoes?: EvolucaoRecord[]
}

/**
 * Calcula a idade a partir da data de nascimento ISO
 */
function calcularIdade(dataNascStr?: string): string {
  if (!dataNascStr) return ''
  try {
    const hoje = new Date()
    const nasc = new Date(dataNascStr)
    if (isNaN(nasc.getTime())) return ''
    let anos = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      anos--
    }
    return anos >= 0 ? `${anos} anos` : ''
  } catch {
    return ''
  }
}

/**
 * Formata a data atual ou da avaliação por extenso com a cidade da clínica (Vinhedo - SP)
 * Padrão: "Vinhedo, 20 de outubro de 2026."
 */
function formatarDataVinhedoExtenso(dataStr?: string): string {
  try {
    const data = dataStr ? new Date(dataStr) : new Date()
    if (isNaN(data.getTime())) {
      const hoje = new Date()
      const dia = hoje.getDate()
      const meses = [
        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
      ]
      return `Vinhedo, ${dia} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}.`
    }
    const dia = data.getDate()
    const meses = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ]
    return `Vinhedo, ${dia} de ${meses[data.getMonth()]} de ${data.getFullYear()}.`
  } catch {
    return 'Vinhedo, Clínica SOUL.'
  }
}

/**
 * Remove rótulos mecânicos de formulário
 */
function limparTexto(texto?: string): string {
  if (!texto) return ''
  return texto
    .replace(/^CAMPO:\s*(?:Nome:\s*)?/i, '')
    .replace(/\bCAMPO:\s*/gi, '')
    .trim()
}

/**
 * Componente oficial do Documento Clínico / Funcional no Modelo Institucional da Clínica SOUL.
 * Renderiza ESTRITAMENTE as informações registradas no prontuário e avaliação do paciente,
 * sem qualquer conteúdo ou histórico de exemplo. Campos não preenchidos exibem "—" ou são omitidos.
 */
export const DocumentoProntuarioInstitucional: React.FC<DocumentoProntuarioInstitucionalProps> = ({
  avaliacao,
  especialidade,
  listaEvolucoes = [],
}) => {
  if (!avaliacao) return null

  // Dados cadastrais do Paciente
  const pac = avaliacao.expand?.paciente_id || {}
  const nomePaciente = limparTexto(pac.nome || avaliacao.paciente_nome || 'Paciente SOUL')
  const cpfPaciente = pac.cpf || avaliacao.cpf || ''
  const dataNasc = pac.data_nascimento || avaliacao.data_nascimento || ''
  const idade =
    calcularIdade(dataNasc) ||
    (avaliacao.anamnese_personal?.idade ? `${avaliacao.anamnese_personal.idade} anos` : '') ||
    '—'

  const sexoPaciente = pac.genero || pac.sexo || ''
  const diagnosticoMedico =
    pac.diagnostico_medico ||
    avaliacao.anamnese_detalhada?.diagnostico_medico ||
    avaliacao.diagnostico_medico ||
    avaliacao.hipotese_diagnostica ||
    '—'

  const dataAvaliacao = avaliacao.data_avaliacao || avaliacao.created || new Date().toISOString()
  const dataAvaliacaoFormatada = formatDataPTBR(dataAvaliacao)

  // Profissional Responsável
  const nomeProfissional = avaliacao.profissional_responsavel || 'Profissional SOUL'
  const registroProfissional =
    avaliacao.registro_profissional ||
    (especialidade === 'Fisioterapia'
      ? 'Fisioterapia'
      : especialidade === 'Personal'
        ? 'Educação Física'
        : especialidade === 'Médico'
          ? 'Medicina'
          : especialidade === 'Nutrição'
            ? 'Nutrição'
            : 'Clínica SOUL')

  // Subtítulo do relatório de acordo com a especialidade
  const subtituloDocumento =
    especialidade === 'Fisioterapia'
      ? 'Avaliação Fisioterapêutica e Parecer Cinético-Funcional'
      : especialidade === 'Personal'
        ? 'Avaliação Física, Funcional e Prescrição de Treinamento'
        : especialidade === 'Médico'
          ? 'Avaliação Clínica e Parecer Médico'
          : especialidade === 'Nutrição'
            ? 'Avaliação Nutricional e Antropométrica Integrada'
            : 'Relatório Clínico e Funcional'

  // Dados de Anamnese da Fisioterapia / Geral
  const anamneseFisio = avaliacao.anamnese_detalhada || {}
  const queixasFisio = Array.isArray(avaliacao.queixas_multiplas) ? avaliacao.queixas_multiplas : []
  const queixaPrincipalTexto =
    limparTexto(avaliacao.queixa_principal) ||
    anamneseFisio.motivo_principal ||
    (queixasFisio.length > 0 ? queixasFisio[0]?.queixa : '') ||
    '—'

  const fraseChavePaciente = anamneseFisio.frase_chave_paciente || ''
  const objetivoTexto =
    anamneseFisio.objetivos ||
    avaliacao.objetivos_tratamento ||
    avaliacao.objetivo_principal ||
    avaliacao.anamnese_personal?.objetivo_detalhado ||
    avaliacao.objetivos ||
    ''

  const tempoEvolucao =
    anamneseFisio.tempo_evolucao ||
    (queixasFisio[0]?.desde_quando ? `Desde ${queixasFisio[0].desde_quando}` : '')

  const tratamentosAnteriores =
    anamneseFisio.tentativas_anteriores ||
    avaliacao.historico_medico ||
    pac.tratamentos_anteriores ||
    ''

  const impactoFuncional =
    anamneseFisio.impacto_dia_a_dia ||
    anamneseFisio.o_que_evita_fazer ||
    pac.limitacoes_incomodo ||
    ''

  const expectativaPaciente = anamneseFisio.vida_resolvida_3_6_meses || pac.resultado_esperado || ''

  const habitosSono = avaliacao.habitos_saude?.horas_sono
    ? `${avaliacao.habitos_saude.horas_sono} horas por noite${
        avaliacao.habitos_saude.qualidade_sono
          ? ` (qualidade: ${avaliacao.habitos_saude.qualidade_sono})`
          : ''
      }`
    : ''

  const atividadeFisica =
    avaliacao.habitos_saude?.atividade_fisica ||
    avaliacao.anamnese_personal?.pratica_atividade ||
    pac.atividade_fisica ||
    ''

  const frequenciaAtividade =
    avaliacao.habitos_saude?.frequencia_atividade || pac.frequencia_semanal || ''

  const medicamentosTexto = avaliacao.medicamentos || ''
  const cirurgiasTexto = avaliacao.cirurgias || anamneseFisio.acidentes_traumas || ''

  // Dados de Exame Físico / Fisioterapia
  const posturaTexto = avaliacao.postura || ''
  const palpacaoTexto = avaliacao.palpacao || ''
  const admSegmentos = Array.isArray(avaliacao.adm_segmentos)
    ? avaliacao.adm_segmentos.filter((s: any) => s && s.ativo)
    : []
  const descricaoForca = avaliacao.forca_muscular_descricao || ''
  const gruposForca = Array.isArray(avaliacao.forca_muscular_grupos)
    ? avaliacao.forca_muscular_grupos
    : []
  const testesEsp = Array.isArray(avaliacao.testes_especiais_segmentos)
    ? avaliacao.testes_especiais_segmentos.filter((s: any) => s && s.ativo)
    : []
  const comp = avaliacao.secoes_complementares || {}
  const planoSemanal = Array.isArray(avaliacao.plano_semanal_detalhado)
    ? avaliacao.plano_semanal_detalhado
    : []
  const hipoteseIa = avaliacao.hipotese_diagnostica_ia || ''
  const diagDisfuncional =
    avaliacao.diagnostico_disfuncional ||
    avaliacao.diagnostico_fisioterapeutico ||
    avaliacao.hipotese_diagnostica ||
    avaliacao.diagnostico_funcional ||
    ''

  // Anamnese Personal
  const anamnesePersonal = avaliacao.anamnese_personal || {}
  const compPersonal = avaliacao.composicao_corporal || {}
  const forcaPersonal = avaliacao.forca_dinamometro || {}
  const flexPersonal = avaliacao.flexibilidade_dados || {}
  const coreMcGill = avaliacao.core_mcgill || {}
  const fmsPersonal = avaliacao.fms_dados || {}

  // Linhas da Tabela Postural reais da avaliação
  const linhasPostura: Array<{ regiao: string; achado: string }> = []
  if (posturaTexto && typeof posturaTexto === 'string' && posturaTexto.trim()) {
    const partes = posturaTexto
      .split(/\n|;/)
      .map((p: string) => p.trim())
      .filter(Boolean)
    if (partes.length >= 2) {
      partes.forEach((pt: string) => {
        if (pt.includes(':')) {
          const [r, ...a] = pt.split(':')
          linhasPostura.push({
            regiao: (r || 'Região').trim(),
            achado: (a.join(':') || '—').trim(),
          })
        } else {
          linhasPostura.push({ regiao: 'Avaliação Postural', achado: pt })
        }
      })
    } else {
      linhasPostura.push({ regiao: 'Inspeção Postural', achado: posturaTexto })
    }
  }

  return (
    <div
      className="bg-white text-[#1F1B18] w-full font-montserrat text-[10pt] leading-relaxed mx-auto print:p-0 print:m-0"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ======================================================================== */}
      {/* CABEÇALHO OFICIAL INSTITUCIONAL DA CLÍNICA SOUL                          */}
      {/* ======================================================================== */}
      <header className="pt-2 pb-4 text-center space-y-3">
        <div className="flex justify-center items-center py-1">
          <LogoSOUL variant="full" size="md" theme="light" className="mx-auto" />
        </div>
        <div className="w-full h-[1px]" style={{ backgroundColor: '#D5AE6F' }} />
      </header>

      {/* TÍTULO PRINCIPAL E SUBTÍTULO */}
      <div className="text-center space-y-1 mb-6">
        <h1
          className="font-soul font-semibold tracking-wide text-[#6A402D] uppercase"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '22pt',
            lineHeight: 1.2,
          }}
        >
          RELATÓRIO CLÍNICO / FUNCIONAL
        </h1>
        <p className="font-montserrat italic text-[#B86545] text-[10.5pt]">{subtituloDocumento}</p>
        <div className="w-16 h-[1px] mx-auto mt-2" style={{ backgroundColor: '#D5AE6F' }} />
      </div>

      {/* BLOCO PACIENTE: Caixa bege claro (#F7F2EC) com borda suave (#E9E1D2) */}
      <div
        className="p-4 mb-6 rounded-lg text-[9.5pt] leading-relaxed page-break-inside-avoid"
        style={{
          backgroundColor: '#F7F2EC',
          border: '1px solid #E9E1D2',
        }}
      >
        <div className="font-montserrat font-bold text-[10pt] uppercase tracking-wider text-[#6A402D] mb-2 pb-1 border-b border-[#D5AE6F]/30">
          PACIENTE
        </div>
        <div className="space-y-1.5 text-[#5F544F]">
          <div>
            <strong className="text-[#6A402D]">Nome:</strong>{' '}
            <span className="text-[#1F1B18] font-medium text-[10pt]">{nomePaciente}</span>
            {cpfPaciente && (
              <span className="text-gray-500 font-mono text-[8.5pt]"> (CPF: {cpfPaciente})</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <span>
              <strong className="text-[#6A402D]">Data de nascimento:</strong>{' '}
              <span className="text-[#1F1B18]">{dataNasc ? formatDataPTBR(dataNasc) : '—'}</span>
            </span>
            <span>|</span>
            <span>
              <strong className="text-[#6A402D]">Idade:</strong>{' '}
              <span className="text-[#1F1B18]">{idade}</span>
            </span>
            <span>|</span>
            <span>
              <strong className="text-[#6A402D]">Diagnóstico médico:</strong>{' '}
              <span className="text-[#1F1B18] font-medium">{diagnosticoMedico}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <span>
              <strong className="text-[#6A402D]">Data da avaliação:</strong>{' '}
              <span className="text-[#1F1B18]">{dataAvaliacaoFormatada}</span>
            </span>
            <span>|</span>
            <span>
              <strong className="text-[#6A402D]">Profissional responsável:</strong>{' '}
              <span className="text-[#1F1B18] font-medium">
                {nomeProfissional} — {registroProfissional}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================================== */}
      {/* 1. OBJETIVO DO RELATÓRIO                                                 */}
      {/* ======================================================================== */}
      <section className="mb-6 page-break-inside-avoid">
        <div className="pb-1 mb-2.5 border-b border-[#D5AE6F]/40">
          <h2
            className="font-soul font-bold text-[13pt] text-[#6A402D] uppercase tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            1. OBJETIVO DO RELATÓRIO
          </h2>
        </div>
        <div className="space-y-2 text-justify">
          {fraseChavePaciente ? (
            <p>
              O objetivo central definido pelo paciente é{' '}
              <strong className="text-[#6A402D]">“{fraseChavePaciente}”</strong>.
              {objetivoTexto ? ` ${objetivoTexto}` : ''}
            </p>
          ) : objetivoTexto ? (
            <p>
              <strong className="text-[#6A402D]">Objetivo do paciente:</strong> {objetivoTexto}
            </p>
          ) : (
            <p className="text-[#5F544F]">
              Acompanhamento e cuidado clínico individualizado na Clínica SOUL.
            </p>
          )}

          <p className="text-[#4A322A]">
            Este documento descreve detalhadamente os achados objetivos observados na avaliação
            clínico-funcional do paciente, os parâmetros de mobilidade, força e testes realizados,
            fundamentando o plano terapêutico individualizado estabelecido para o alcance das metas.
          </p>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 2. HISTÓRICO E QUEIXA PRINCIPAL                                          */}
      {/* ======================================================================== */}
      <section className="mb-6 page-break-inside-avoid">
        <div className="pb-1 mb-2.5 border-b border-[#D5AE6F]/40">
          <h2
            className="font-soul font-bold text-[13pt] text-[#6A402D] uppercase tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            2. HISTÓRICO E QUEIXA PRINCIPAL
          </h2>
        </div>
        <div className="space-y-2 text-justify">
          <p>
            Paciente{' '}
            {sexoPaciente === 'F' || sexoPaciente === 'Feminino'
              ? 'do sexo feminino'
              : sexoPaciente === 'M' || sexoPaciente === 'Masculino'
                ? 'do sexo masculino'
                : ''}
            {idade && idade !== '—' ? `, ${idade}` : ''}
            {atividadeFisica ? `, prática de atividade física: ${atividadeFisica}` : ''}
            {frequenciaAtividade ? ` (${frequenciaAtividade})` : ''}.
          </p>

          <p>
            <strong className="text-[#6A402D]">Queixa principal:</strong> {queixaPrincipalTexto}
            {queixasFisio.length > 0 && typeof queixasFisio[0].eva === 'number' && (
              <span className="font-semibold text-[#8C6527]">
                {' '}
                (Escala Visual Analógica - EVA: {queixasFisio[0].eva}/10)
              </span>
            )}
            .
          </p>

          {/* Lista de queixas múltiplas se houver mais de uma */}
          {queixasFisio.length > 1 && (
            <div className="pt-1">
              <span className="font-semibold text-[#6A402D] block mb-1">
                Outras queixas relatadas:
              </span>
              <ul className="space-y-1 pl-1">
                {queixasFisio.slice(1).map((q: any, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#D5AE6F] font-bold select-none">•</span>
                    <p>
                      <strong>{q.queixa || q.titulo || `Queixa ${i + 2}`}:</strong>{' '}
                      {typeof q.eva === 'number' ? `[EVA: ${q.eva}/10] ` : ''}
                      {q.desde_quando ? `Desde: ${q.desde_quando}. ` : ''}
                      {q.movimento_piora ? `Piora com: ${q.movimento_piora}. ` : ''}
                      {q.o_que_alivia ? `Alívio: ${q.o_que_alivia}.` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-1.5 pl-1 pt-1">
            {tempoEvolucao && (
              <li className="flex items-start gap-2">
                <span className="text-[#D5AE6F] font-bold select-none">•</span>
                <p>
                  <strong className="text-[#6A402D]">Evolução dos sintomas:</strong> {tempoEvolucao}
                  {queixasFisio[0]?.movimento_piora
                    ? `. Sintomas acentuados em: ${queixasFisio[0].movimento_piora}`
                    : ''}
                  {queixasFisio[0]?.o_que_alivia
                    ? `. Alívio relatado com: ${queixasFisio[0].o_que_alivia}`
                    : ''}
                  .
                </p>
              </li>
            )}

            {tratamentosAnteriores && (
              <li className="flex items-start gap-2">
                <span className="text-[#D5AE6F] font-bold select-none">•</span>
                <p>
                  <strong className="text-[#6A402D]">Tratamentos anteriores:</strong>{' '}
                  {tratamentosAnteriores}
                </p>
              </li>
            )}

            {impactoFuncional && (
              <li className="flex items-start gap-2">
                <span className="text-[#D5AE6F] font-bold select-none">•</span>
                <p>
                  <strong className="text-[#6A402D]">Impacto funcional no dia a dia:</strong>{' '}
                  {impactoFuncional}
                </p>
              </li>
            )}

            {expectativaPaciente && (
              <li className="flex items-start gap-2">
                <span className="text-[#D5AE6F] font-bold select-none">•</span>
                <p>
                  <strong className="text-[#6A402D]">Expectativa / Visão de futuro:</strong>{' '}
                  {expectativaPaciente}
                </p>
              </li>
            )}

            {habitosSono && (
              <li className="flex items-start gap-2">
                <span className="text-[#D5AE6F] font-bold select-none">•</span>
                <p>
                  <strong className="text-[#6A402D]">Sono e recuperação:</strong> {habitosSono}
                </p>
              </li>
            )}

            {(medicamentosTexto || cirurgiasTexto) && (
              <li className="flex items-start gap-2">
                <span className="text-[#D5AE6F] font-bold select-none">•</span>
                <p>
                  <strong className="text-[#6A402D]">Histórico médico e medicamentos:</strong>{' '}
                  {medicamentosTexto ? `Medicamentos em uso: ${medicamentosTexto}. ` : ''}
                  {cirurgiasTexto ? `Cirurgias / Traumas prévios: ${cirurgiasTexto}.` : ''}
                </p>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 3. AVALIAÇÃO CLÍNICA E FUNCIONAL                                         */}
      {/* ======================================================================== */}
      <section className="mb-6 space-y-4">
        <div className="pb-1 mb-2.5 border-b border-[#D5AE6F]/40">
          <h2
            className="font-soul font-bold text-[13pt] text-[#6A402D] uppercase tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            3. AVALIAÇÃO CLÍNICA E FUNCIONAL
          </h2>
        </div>

        {/* 3.1 Inspeção postural e palpação tecidual */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.1 Inspeção postural e palpação
          </h3>

          {linhasPostura.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
              <table className="w-full text-left text-[9.5pt]">
                <thead>
                  <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                    <th className="py-2 px-3 w-1/3">Região</th>
                    <th className="py-2 px-3">Achado Clínico Observado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E1D2]/60">
                  {linhasPostura.map((l, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FAF7F1]/50' : 'bg-white'}>
                      <td className="py-2 px-3 font-semibold text-[#6A402D]">{l.regiao}</td>
                      <td className="py-2 px-3 text-[#1F1B18]">{l.achado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-justify text-[#5F544F]">
              {posturaTexto ||
                'Inspeção postural sem alterações dignas de nota registradas na sessão.'}
            </p>
          )}

          {palpacaoTexto && (
            <div className="p-3 bg-[#FAF7F1] rounded-md border border-[#E9E1D2] text-[9pt] leading-relaxed mt-2">
              <strong className="text-[#6A402D] block mb-0.5">Palpação Tecidual:</strong>
              <p className="text-[#1F1B18] whitespace-pre-wrap">{palpacaoTexto}</p>
            </div>
          )}
        </div>

        {/* 3.2 Amplitude Articular (ADM) */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.2 Amplitude articular e mobilidade
          </h3>

          {admSegmentos.length > 0 ? (
            <div className="space-y-2">
              {admSegmentos.map((seg: any) => {
                const movimentos = Array.isArray(seg.movimentos) ? seg.movimentos : []
                return (
                  <div
                    key={seg.segmento}
                    className="overflow-hidden rounded-md border border-[#E9E1D2]"
                  >
                    <div className="bg-[#F7F2EC] px-3 py-1.5 font-bold text-[#6A402D] text-[9.5pt] border-b border-[#E9E1D2] flex justify-between">
                      <span>Segmento: {seg.segmento}</span>
                      <span className="text-[8.5pt] text-[#73574A] font-normal">Graus (°)</span>
                    </div>
                    <table className="w-full text-left text-[9pt]">
                      <thead>
                        <tr className="border-b border-[#E9E1D2]/60 text-[#73574A] text-[8.5pt]">
                          <th className="py-1 px-3">Movimento</th>
                          <th className="py-1 px-2 text-center w-24">Lado D (°)</th>
                          <th className="py-1 px-2 text-center w-24">Lado E (°)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9E1D2]/40">
                        {movimentos.map((m: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FAF7F1]/50' : 'bg-white'}>
                            <td className="py-1 px-3 font-medium text-[#1F1B18]">
                              {m.movimento}
                              {m.graus !== undefined && m.graus !== '' ? ` (${m.graus}°)` : ''}
                            </td>
                            <td className="py-1 px-2 text-center font-mono font-semibold text-[#6A402D]">
                              {m.direito !== '' && m.direito !== undefined ? `${m.direito}°` : '—'}
                            </td>
                            <td className="py-1 px-2 text-center font-mono font-semibold text-[#6A402D]">
                              {m.esquerdo !== '' && m.esquerdo !== undefined
                                ? `${m.esquerdo}°`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          ) : avaliacao.adm_ombro ||
            avaliacao.adm_joelho ||
            avaliacao.adm_quadril ||
            avaliacao.adm_coluna ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9pt]">
              {avaliacao.adm_ombro ? (
                <div className="p-2.5 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                  <span className="text-[#5F544F] block text-[8pt]">ADM Ombro</span>
                  <span className="font-bold text-[#6A402D]">{avaliacao.adm_ombro}°</span>
                </div>
              ) : null}
              {avaliacao.adm_joelho ? (
                <div className="p-2.5 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                  <span className="text-[#5F544F] block text-[8pt]">ADM Joelho</span>
                  <span className="font-bold text-[#6A402D]">{avaliacao.adm_joelho}°</span>
                </div>
              ) : null}
              {avaliacao.adm_quadril ? (
                <div className="p-2.5 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                  <span className="text-[#5F544F] block text-[8pt]">ADM Quadril</span>
                  <span className="font-bold text-[#6A402D]">{avaliacao.adm_quadril}°</span>
                </div>
              ) : null}
              {avaliacao.adm_coluna ? (
                <div className="p-2.5 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                  <span className="text-[#5F544F] block text-[8pt]">ADM Coluna</span>
                  <span className="font-bold text-[#6A402D]">{avaliacao.adm_coluna}°</span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-justify text-[#5F544F]">
              Amplitude articular funcional sem restrições ou mensurações analíticas adicionais
              registradas nesta avaliação.
            </p>
          )}
        </div>

        {/* 3.3 Força Muscular e Dinamometria */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.3 Força muscular e dinamometria
          </h3>

          {descricaoForca ? (
            <div className="p-3 bg-[#FAF7F1] rounded-md border border-[#E9E1D2] text-[9pt] leading-relaxed">
              <strong className="text-[#6A402D] block mb-0.5">
                Avaliação de Força Muscular / Dinamometria:
              </strong>
              <p className="text-[#1F1B18] whitespace-pre-wrap">{descricaoForca}</p>
            </div>
          ) : gruposForca.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
              <table className="w-full text-left text-[9pt]">
                <thead>
                  <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                    <th className="py-1.5 px-3">Grupo Muscular</th>
                    <th className="py-1.5 px-2 text-center w-24">Lado D</th>
                    <th className="py-1.5 px-2 text-center w-24">Lado E</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E1D2]/60">
                  {gruposForca.map((g: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FAF7F1]/50' : 'bg-white'}>
                      <td className="py-1.5 px-3 font-medium text-[#1F1B18]">{g.grupo}</td>
                      <td className="py-1.5 px-2 text-center font-mono">
                        {g.grau_direito ? `Grau ${g.grau_direito}` : '—'}
                        {g.dinamometro_direito_kgf ? ` (${g.dinamometro_direito_kgf} kgf)` : ''}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono">
                        {g.grau_esquerdo ? `Grau ${g.grau_esquerdo}` : '—'}
                        {g.dinamometro_esquerdo_kgf ? ` (${g.dinamometro_esquerdo_kgf} kgf)` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-justify text-[#5F544F]">
              Sem registro de dinamometria ou déficit evidente de força muscular quantificado nesta
              sessão.
            </p>
          )}

          {/* Testes de Core do Paciente caso existam no prontuário */}
          {coreMcGill &&
            (coreMcGill.prancha_ventral_seg ||
              coreMcGill.prancha_lat_d_seg ||
              coreMcGill.prancha_lat_e_seg ||
              coreMcGill.extensao_biering_seg) && (
              <div className="pt-2">
                <span className="font-semibold text-[#6A402D] text-[9.5pt] block mb-1">
                  Testes de Sustentação de Core (McGill):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9pt]">
                  {coreMcGill.prancha_ventral_seg && (
                    <div className="p-2 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                      <span className="text-[#5F544F] block text-[8pt]">Prancha Ventral</span>
                      <span className="font-bold text-[#6A402D] font-mono">
                        {coreMcGill.prancha_ventral_seg} s
                      </span>
                    </div>
                  )}
                  {coreMcGill.prancha_lat_d_seg && (
                    <div className="p-2 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                      <span className="text-[#5F544F] block text-[8pt]">Prancha Lat. Direita</span>
                      <span className="font-bold text-[#6A402D] font-mono">
                        {coreMcGill.prancha_lat_d_seg} s
                      </span>
                    </div>
                  )}
                  {coreMcGill.prancha_lat_e_seg && (
                    <div className="p-2 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                      <span className="text-[#5F544F] block text-[8pt]">Prancha Lat. Esquerda</span>
                      <span className="font-bold text-[#6A402D] font-mono">
                        {coreMcGill.prancha_lat_e_seg} s
                      </span>
                    </div>
                  )}
                  {coreMcGill.extensao_biering_seg && (
                    <div className="p-2 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                      <span className="text-[#5F544F] block text-[8pt]">Extensão Tronco</span>
                      <span className="font-bold text-[#6A402D] font-mono">
                        {coreMcGill.extensao_biering_seg} s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* 3.4 Testes Especiais Ortopédicos */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.4 Testes especiais ortopédicos
          </h3>

          {testesEsp.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
              <table className="w-full text-left text-[9pt]">
                <thead>
                  <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                    <th className="py-1.5 px-3">Segmento / Manobra Especial</th>
                    <th className="py-1.5 px-2 text-center w-20">Lado D</th>
                    <th className="py-1.5 px-2 text-center w-20">Lado E</th>
                    <th className="py-1.5 px-3">Achado Clínico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E1D2]/60">
                  {testesEsp.flatMap((seg: any) => {
                    const testesLista = Array.isArray(seg?.testes) ? seg.testes : []
                    const nomeSegmento = seg?.segmento || 'Segmento'
                    return testesLista.map((t: any, i: number) => (
                      <tr key={`${nomeSegmento}-${i}`} className="bg-white">
                        <td className="py-1.5 px-3 font-semibold text-[#6A402D]">
                          {nomeSegmento}: {t?.nome || 'Teste'}
                          {t?.estrutura ? ` (${t.estrutura})` : ''}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-[8.5pt]">
                          {t?.status_direito || 'N/R'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-[8.5pt]">
                          {t?.status_esquerdo || 'N/R'}
                        </td>
                        <td className="py-1.5 px-3 text-[#5F544F]">{t?.observacao || '—'}</td>
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          ) : avaliacao.testes_especiais ? (
            <div className="p-3 bg-[#FAF7F1] rounded-md border border-[#E9E1D2] text-[9pt]">
              <strong className="text-[#6A402D] block mb-0.5">Testes Especiais Registrados:</strong>
              <p className="text-[#1F1B18]">{avaliacao.testes_especiais}</p>
            </div>
          ) : (
            <p className="text-justify text-[#5F544F]">
              Sem manobras ortopédicas especiais com positividade ou testes específicos aplicados.
            </p>
          )}
        </div>

        {/* 3.5 Avaliações complementares reais se existirem (Podopostural, Berg, TUG, Cirtometria, etc.) */}
        {comp &&
          (comp.palmilha_ativo ||
            comp.cirtometria_ativo ||
            comp.goniometria_ativo ||
            comp.berg_ativo ||
            comp.tug_ativo) && (
            <div className="space-y-2 page-break-inside-avoid pt-1">
              <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
                3.5 Avaliações complementares registradas
              </h3>

              {/* Avaliação Podopostural Real se preenchida */}
              {comp.palmilha_ativo && comp.palmilha_avaliacao && (
                <div className="p-3 bg-[#FAF7F1] rounded-md border border-[#E9E1D2] text-[9pt] space-y-1.5">
                  <span className="font-bold text-[#6A402D] block">Avaliação Podopostural:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {comp.palmilha_avaliacao.tipo_pisada && (
                      <div>
                        <span className="text-[#5F544F] text-[8pt] block">Pisada:</span>
                        <strong className="text-[#1F1B18]">
                          {comp.palmilha_avaliacao.tipo_pisada}
                        </strong>
                      </div>
                    )}
                    {comp.palmilha_avaliacao.postura_retrope && (
                      <div>
                        <span className="text-[#5F544F] text-[8pt] block">Retropé:</span>
                        <strong className="text-[#1F1B18]">
                          {comp.palmilha_avaliacao.postura_retrope}
                        </strong>
                      </div>
                    )}
                    {comp.palmilha_avaliacao.postura_antepe && (
                      <div>
                        <span className="text-[#5F544F] text-[8pt] block">Antepé:</span>
                        <strong className="text-[#1F1B18]">
                          {comp.palmilha_avaliacao.postura_antepe}
                        </strong>
                      </div>
                    )}
                    {comp.palmilha_avaliacao.postura_joelho && (
                      <div>
                        <span className="text-[#5F544F] text-[8pt] block">Joelhos:</span>
                        <strong className="text-[#1F1B18]">
                          {comp.palmilha_avaliacao.postura_joelho}
                        </strong>
                      </div>
                    )}
                    {comp.palmilha_avaliacao.perna_curta && (
                      <div>
                        <span className="text-[#5F544F] text-[8pt] block">Dismetria:</span>
                        <strong className="text-[#1F1B18]">
                          {comp.palmilha_avaliacao.perna_curta}
                          {comp.palmilha_avaliacao.perna_curta_mm
                            ? ` (${comp.palmilha_avaliacao.perna_curta_mm}mm)`
                            : ''}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Berg & TUG */}
              {(comp.berg_ativo || comp.tug_ativo) && (
                <div className="flex flex-wrap gap-3 text-[9pt]">
                  {comp.berg_ativo && (
                    <div className="p-2.5 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                      <span className="text-[#5F544F] text-[8pt] block">Escala de Berg:</span>
                      <strong className="text-[#6A402D]">{comp.berg_total ?? 0} / 56 pontos</strong>
                    </div>
                  )}
                  {comp.tug_ativo && (
                    <div className="p-2.5 bg-[#FAF7F1] rounded border border-[#E9E1D2]">
                      <span className="text-[#5F544F] text-[8pt] block">Teste TUG:</span>
                      <strong className="text-[#6A402D]">
                        {comp.tug_resultado_escolhido ||
                          comp.tug_valida2?.tempo ||
                          comp.tug_valida1?.tempo ||
                          '—'}{' '}
                        s
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Anexos de exames se houver */}
        {avaliacao.anexos_exames && avaliacao.anexos_exames.length > 0 && (
          <div className="p-2.5 bg-[#FAF7F1] rounded border border-[#E9E1D2] text-[8.5pt]">
            <strong className="text-[#6A402D] block mb-0.5">Exames Anexados ao Prontuário:</strong>
            <span className="text-[#1F1B18]">{avaliacao.anexos_exames.join(', ')}</span>
          </div>
        )}
      </section>

      {/* ======================================================================== */}
      {/* 4. INTERPRETAÇÃO DOS ACHADOS                                             */}
      {/* ======================================================================== */}
      <section className="mb-6 space-y-4">
        <div className="pb-1 mb-2.5 border-b border-[#D5AE6F]/40">
          <h2
            className="font-soul font-bold text-[13pt] text-[#6A402D] uppercase tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            4. INTERPRETAÇÃO DOS ACHADOS
          </h2>
        </div>

        {hipoteseIa ? (
          <div className="space-y-2 text-justify">
            <span className="font-montserrat font-bold text-[10pt] text-[#6A402D] block">
              Raciocínio Clínico e Evidências Observadas:
            </span>
            <p className="text-[#1F1B18] whitespace-pre-wrap leading-relaxed">{hipoteseIa}</p>
          </div>
        ) : (
          <p className="text-justify text-[#4A322A]">
            Os achados clínicos objetivos observados na avaliação foram correlacionados com a
            anamnese, a história da queixa e as demandas funcionais do paciente, determinando os
            pontos centrais de atuação para restauração do equilíbrio biomecânico.
          </p>
        )}

        {/* CAIXA DE DESTAQUE: DIAGNÓSTICO CINÉTICO-FUNCIONAL */}
        <div
          className="p-4 rounded-md border-l-4 my-3 text-[9.5pt] leading-relaxed page-break-inside-avoid"
          style={{
            backgroundColor: '#F7F2EC',
            borderColor: '#6A402D',
          }}
        >
          <span className="font-montserrat font-bold text-[10pt] uppercase tracking-wider text-[#6A402D] block mb-1">
            Diagnóstico cinético-funcional
          </span>
          <p className="text-[#1F1B18] font-medium text-justify">
            {diagDisfuncional ||
              (hipoteseIa
                ? hipoteseIa
                : `Quadro clínico funcional correlacionado à queixa de "${queixaPrincipalTexto}" apresentada pelo paciente.`)}
          </p>
        </div>
      </section>

      {/* ======================================================================== */}
      {/* 5. CONDUTA / PLANO DE TRATAMENTO                                         */}
      {/* ======================================================================== */}
      <section className="mb-6 space-y-4">
        <div className="pb-1 mb-2.5 border-b border-[#D5AE6F]/40">
          <h2
            className="font-soul font-bold text-[13pt] text-[#6A402D] uppercase tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            5. CONDUTA / PLANO DE TRATAMENTO
          </h2>
        </div>

        <div className="space-y-2 text-justify">
          {avaliacao.objetivos_tratamento && (
            <div>
              <strong className="text-[#6A402D] block mb-0.5">Objetivos Terapêuticos:</strong>
              <p className="text-[#1F1B18] whitespace-pre-wrap">{avaliacao.objetivos_tratamento}</p>
            </div>
          )}

          {avaliacao.plano_tratamento && (
            <div>
              <strong className="text-[#6A402D] block mb-0.5">Plano de Tratamento:</strong>
              <p className="text-[#1F1B18] whitespace-pre-wrap">{avaliacao.plano_tratamento}</p>
            </div>
          )}
        </div>

        {/* TABELA DE FASES DO PROGRAMA SEMANAL (SE HOUVER PLANO SEMANAL CADASTRADO NO PRONTUÁRIO) */}
        {planoSemanal.length > 0 && (
          <div className="overflow-hidden rounded-md border border-[#E9E1D2] page-break-inside-avoid mt-2">
            <table className="w-full text-left text-[9pt]">
              <thead>
                <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                  <th className="py-2 px-3 w-1/6">Período</th>
                  <th className="py-2 px-3 w-1/4">Foco</th>
                  <th className="py-2 px-3">Condutas / Exercícios</th>
                  <th className="py-2 px-3 w-1/4">Critérios de Evolução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D2]/60">
                {planoSemanal.map((s: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FAF7F1]/50' : 'bg-white'}>
                    <td className="py-2 px-3 font-semibold text-[#6A402D]">{s.semana}</td>
                    <td className="py-2 px-3 font-medium text-[#1F1B18]">{s.foco || '—'}</td>
                    <td className="py-2 px-3 text-[#1F1B18]">{s.condutas || '—'}</td>
                    <td className="py-2 px-3 text-[#5F544F]">{s.criterios_evolucao || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!avaliacao.objetivos_tratamento &&
          !avaliacao.plano_tratamento &&
          planoSemanal.length === 0 && (
            <p className="text-justify text-[#5F544F]">
              Conduta individualizada estabelecida pelo profissional responsável na Clínica SOUL,
              com acompanhamento periódico e reavaliações dos parâmetros funcionais.
            </p>
          )}
      </section>

      {/* ======================================================================== */}
      {/* 6. CONSIDERAÇÕES FINAIS                                                  */}
      {/* ======================================================================== */}
      <section className="mb-6 space-y-3 page-break-inside-avoid">
        <div className="pb-1 mb-2.5 border-b border-[#D5AE6F]/40">
          <h2
            className="font-soul font-bold text-[13pt] text-[#6A402D] uppercase tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            6. CONSIDERAÇÕES FINAIS
          </h2>
        </div>

        <div className="space-y-2 text-justify">
          {avaliacao.evolucao_nota ? (
            <p className="whitespace-pre-wrap">{avaliacao.evolucao_nota}</p>
          ) : (
            <p>
              A avaliação clínica e funcional formaliza os achados iniciais do paciente. O plano de
              cuidado estruturado tem como meta a restauração da integridade biomecânica, o controle
              dos sintomas e a conquista de autonomia motora duradoura nas atividades diárias e
              esportivas.
            </p>
          )}
        </div>

        {/* CAIXA DE DESTAQUE INSTITUCIONAL */}
        <div
          className="p-4 rounded-md border text-[9.5pt] leading-relaxed my-3"
          style={{
            backgroundColor: '#F7F2EC',
            borderColor: '#D5AE6F',
          }}
        >
          <p className="text-[#6A402D] font-medium text-justify">
            O objetivo terapêutico central da Clínica SOUL é proporcionar à musculatura e às
            estruturas de suporte a força, o alinhamento e o controle necessários para que o
            paciente sustente com conforto e eficiência o seu melhor padrão funcional no dia a dia.
          </p>
        </div>

        <p className="text-[8.5pt] text-[#5F544F] italic pt-1">
          Este relatório formaliza os achados da avaliação do paciente. Novos parâmetros evolutivos
          serão registrados e incorporados a cada reavaliação periódica.
        </p>
      </section>

      {/* ======================================================================== */}
      {/* HISTÓRICO DE EVOLUÇÕES CLÍNICAS ASSINADAS (se houver sessões)           */}
      {/* ======================================================================== */}
      {Array.isArray(listaEvolucoes) && listaEvolucoes.length > 0 && (
        <section className="pt-6 mb-8 border-t-2 border-[#D5AE6F]/40 page-break-before space-y-4">
          <div className="pb-2 border-b border-[#E9E1D2]">
            <h3 className="font-soul font-bold text-[14pt] text-[#6A402D]">
              Histórico de Evoluções Clínicas do Prontuário (Sessões Registradas)
            </h3>
            <p className="text-[9pt] text-[#5F544F]">
              Registros clínicos assinados digitalmente pelos profissionais da Clínica SOUL.
            </p>
          </div>

          <div className="space-y-3">
            {listaEvolucoes.map((evo) => {
              if (!evo) return null
              return (
                <div
                  key={evo.id || Math.random().toString()}
                  className="p-3.5 rounded-lg border border-[#E9E1D2] bg-white text-[9pt] space-y-1.5 page-break-inside-avoid"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="font-bold text-[#6A402D]">
                      {evo.especialidade || 'Sessão'}{' '}
                      {evo.numero_registro ? `• ${evo.numero_registro}` : ''}
                    </span>
                    <span className="text-[#5F544F] text-[8.5pt]">
                      Sessão em: <strong>{formatDataPTBR(evo.data_evolucao || evo.created)}</strong>
                    </span>
                  </div>

                  {evo.subjetivo && (
                    <p>
                      <strong className="text-[#6A402D]">Subjetivo (S):</strong>{' '}
                      {typeof evo.eva_dor === 'number' && (
                        <span className="font-bold text-[#8C6527] mr-1">
                          [EVA: {evo.eva_dor}/10]
                        </span>
                      )}
                      {evo.subjetivo}
                    </p>
                  )}

                  {evo.objetivo && (
                    <p>
                      <strong className="text-[#6A402D]">Objetivo (O):</strong> {evo.objetivo}
                    </p>
                  )}

                  {evo.avaliacao_clinica && (
                    <p>
                      <strong className="text-[#6A402D]">Avaliação Clínica (A):</strong>{' '}
                      {evo.avaliacao_clinica}
                    </p>
                  )}

                  {evo.conduta_procedimentos && (
                    <p>
                      <strong className="text-[#8C6527]">Conduta Realizada:</strong>{' '}
                      {evo.conduta_procedimentos}
                    </p>
                  )}

                  <div className="pt-1.5 mt-1 border-t border-dashed border-[#E9E1D2] flex justify-between text-[8pt] text-[#73574A]">
                    <span>
                      Assinado por:{' '}
                      <strong>
                        {evo.assinado_por_nome || evo.profissional || 'Profissional SOUL'}
                      </strong>
                    </span>
                    <span>Status: {evo.status || 'Concluída'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ======================================================================== */}
      {/* BLOCO DE ASSINATURA INSTITUCIONAL COM CIDADE VINHEDO                    */}
      {/* ======================================================================== */}
      <section className="pt-8 mt-10 text-left page-break-inside-avoid space-y-1 max-w-sm">
        <div className="w-64 border-b border-[#6A402D] mb-3" />
        <p className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">{nomeProfissional}</p>
        <p className="font-montserrat text-[9pt] text-[#5F544F]">{registroProfissional}</p>
        <p className="font-montserrat font-semibold text-[9pt] text-[#6A402D]">
          Clínica SOUL — Saúde e Bem Estar
        </p>
        <p className="font-montserrat text-[9pt] text-[#5F544F] pt-0.5">
          {formatarDataVinhedoExtenso(dataAvaliacao)}
        </p>
      </section>

      {/* ======================================================================== */}
      {/* RODAPÉ INSTITUCIONAL (Clínica SOUL • Telefone • Instagram)                */}
      {/* ======================================================================== */}
      <footer className="pt-6 mt-10 border-t border-[#D5AE6F]/40 flex flex-col sm:flex-row items-center justify-between text-[8.5pt] text-[#5F544F] font-montserrat print:hidden">
        <p>Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar</p>
        <p className="font-medium text-[#6A402D]">Documento Clínico Oficial</p>
      </footer>

      {/* Rodapé fixo de impressão por página */}
      <div id="rodape-fixo-prontuario-soul" aria-hidden="true">
        <span className="rodape-linha-institucional">
          Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar
        </span>
        <span className="rodape-pagina">Página 1</span>
      </div>
    </div>
  )
}

export default DocumentoProntuarioInstitucional
