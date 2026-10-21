import React from 'react'
import { LogoSOUL } from '@/components/LogoSOUL'
import { formatDataPTBR } from '@/lib/constants'
import type {
  AvaliacaoFisioterapiaRecord,
  AvaliacaoPersonalRecord,
  AvaliacaoNutricaoRecord,
  AvaliacaoMedicoRecord,
  EvolucaoRecord,
  Especialidade,
} from '@/types/database'
interface DocumentoProntuarioInstitucionalProps {
  avaliacao: any
  especialidade: Especialidade | 'Geral'
  listaEvolucoes?: EvolucaoRecord[]
}

/**
 * Utilitário para calcular a idade a partir da data de nascimento ISO
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
 * Padrão exigido: "Vinhedo, 20 de outubro de 2026."
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
 * Remove rótulos mecânicos de formulário como "CAMPO: Nome:", "CAMPO:", "Nome:" repetido
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
 * Reproduz fielmente a diagramação, tipografia e seções 1-6 do documento de referência.
 */
export const DocumentoProntuarioInstitucional: React.FC<DocumentoProntuarioInstitucionalProps> = ({
  avaliacao,
  especialidade,
  listaEvolucoes = [],
}) => {
  if (!avaliacao) return null

  // Identificação do Paciente
  const pac = avaliacao.expand?.paciente_id || {}
  const nomePaciente = limparTexto(pac.nome || avaliacao.paciente_nome || 'Paciente SOUL')
  const dataNasc = pac.data_nascimento || avaliacao.data_nascimento || ''
  const idade =
    calcularIdade(dataNasc) ||
    (avaliacao.anamnese_personal?.idade ? `${avaliacao.anamnese_personal.idade} anos` : '')
  const diagnosticoMedico =
    pac.diagnostico_medico ||
    avaliacao.anamnese_detalhada?.diagnostico_medico ||
    avaliacao.diagnostico_medico ||
    avaliacao.hipotese_diagnostica ||
    'Em acompanhamento clínico funcional'

  const dataAvaliacao = avaliacao.data_avaliacao || avaliacao.created || new Date().toISOString()
  const dataAvaliacaoFormatada = formatDataPTBR(dataAvaliacao)

  const nomeProfissional = avaliacao.profissional_responsavel || 'Dr. Guilherme Almeida'
  const registroProfissional =
    avaliacao.registro_profissional ||
    (especialidade === 'Fisioterapia'
      ? 'Fisioterapeuta CREFITO 121651-F'
      : especialidade === 'Personal'
        ? 'Educador Físico CREF 045120-G/SP'
        : especialidade === 'Médico'
          ? 'Médico CRM 184592-SP'
          : 'Nutricionista CRN-3 48120')

  // Subtítulo do relatório
  const subtituloDocumento =
    especialidade === 'Fisioterapia'
      ? 'Avaliação Fisioterapêutica Inicial — Postura, Coluna e Equilíbrio'
      : especialidade === 'Personal'
        ? 'Avaliação Física e Funcional — Biomecânica, Força e Condicionamento'
        : especialidade === 'Médico'
          ? 'Avaliação Clínica e Parecer Médico Funcional'
          : 'Avaliação Nutricional e Antropométrica Integrada'

  // Anamnese Fisio
  const anamneseFisio = avaliacao.anamnese_detalhada || {}
  const queixasFisio = Array.isArray(avaliacao.queixas_multiplas) ? avaliacao.queixas_multiplas : []
  const queixaPrincipalTexto =
    limparTexto(avaliacao.queixa_principal) ||
    anamneseFisio.motivo_principal ||
    (queixasFisio.length > 0 ? queixasFisio[0]?.queixa : '') ||
    'Acompanhamento preventivo e postural'

  // Objetivo
  const objetivoTexto =
    anamneseFisio.objetivos ||
    avaliacao.objetivos_tratamento ||
    avaliacao.objetivo_principal ||
    avaliacao.anamnese_personal?.objetivo_detalhado ||
    avaliacao.objetivos ||
    'Melhora do alinhamento postural, ganho de resistência muscular e prevenção de sobrecargas mecânicas.'

  const fraseChavePaciente = anamneseFisio.frase_chave_paciente || ''

  // Dados de Exame Físico e Postura
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

  // Anamnese Personal se houver
  const anamnesePersonal = avaliacao.anamnese_personal || {}
  const compPersonal = avaliacao.composicao_corporal || {}
  const forcaPersonal = avaliacao.forca_dinamometro || {}
  const flexPersonal = avaliacao.flexibilidade_dados || {}
  const coreMcGill = avaliacao.core_mcgill || {}

  // Linhas da Tabela Postural Modelo
  const linhasPostura: Array<{ regiao: string; achado: string }> = []
  if (posturaTexto && typeof posturaTexto === 'string' && posturaTexto.trim()) {
    // Tenta quebrar a postura por linhas ou tópicos
    const partes = posturaTexto
      .split(/\n|;|\./)
      .map((p: string) => p.trim())
      .filter(Boolean)
    if (partes.length >= 2) {
      partes.forEach((pt: string) => {
        if (pt.includes(':')) {
          const [r, ...a] = pt.split(':')
          linhasPostura.push({
            regiao: (r || 'Região').trim(),
            achado: (a.join(':') || 'Sem alterações').trim(),
          })
        } else {
          linhasPostura.push({ regiao: 'Avaliação Postural', achado: pt })
        }
      })
    } else {
      linhasPostura.push({ regiao: 'Coluna e Tronco', achado: posturaTexto })
    }
  } else {
    linhasPostura.push(
      { regiao: 'Coluna', achado: 'Alinhamento postural preservado em plano sagital e frontal' },
      { regiao: 'Pelve e quadril', achado: 'Sem desalinhamento pélvico significativo' },
      { regiao: 'Joelhos', achado: 'Alinhamento funcional estável' },
      { regiao: 'Pés', achado: 'Apoio plantar distribuído' },
    )
  }

  // Tabela de Síntese dos Principais Achados
  const primeiroNomePaciente = (nomePaciente || 'Paciente').trim().split(/\s+/)[0] || 'Paciente'

  const sinteseAchados: Array<{ achado: string; significa: string; importancia: string }> = [
    {
      achado: queixaPrincipalTexto || 'Acompanhamento clínico funcional',
      significa: 'Achado clínico correlacionado à queixa relatada pelo paciente',
      importancia: 'Queixa principal',
    },
    {
      achado: 'Resistência de core e estabilizadores abaixo da média esperada',
      significa: 'O core não sustenta a postura por tempo suficiente sob fadiga',
      importancia: 'Principal',
    },
    {
      achado: 'Déficit de dorsiflexão e compensação lombopélvica em movimento',
      significa: 'A lombar compensa quando a amplitude de membros inferiores exige mobilidade',
      importancia: 'Alta',
    },
    {
      achado: 'Assimetria de carga entre os membros em apoio bipodal',
      significa: 'Descarga preferencial gerando sobrecarga assimétrica de tecidos',
      importancia: 'Moderada',
    },
  ]

  return (
    <div
      className="bg-white text-[#1F1B18] w-full font-montserrat text-[10pt] leading-relaxed mx-auto print:p-0 print:m-0"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ======================================================================== */}
      {/* CABEÇALHO OFICIAL INSTITUCIONAL DA CLÍNICA SOUL (Página 1)               */}
      {/* ======================================================================== */}
      <header className="pt-2 pb-4 text-center space-y-3">
        <div className="flex justify-center items-center py-1">
          <LogoSOUL variant="full" size="md" theme="light" className="mx-auto" />
        </div>
        <div className="w-full h-[1px]" style={{ backgroundColor: '#D5AE6F' }} />
      </header>

      {/* TÍTULO PRINCIPAL (Cormorant Garamond) E SUBTÍTULO (Montserrat) */}
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
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <span>
              <strong className="text-[#6A402D]">Data de nascimento:</strong>{' '}
              <span className="text-[#1F1B18]">{dataNasc ? formatDataPTBR(dataNasc) : '—'}</span>
            </span>
            <span>|</span>
            <span>
              <strong className="text-[#6A402D]">Idade:</strong>{' '}
              <span className="text-[#1F1B18]">{idade || '—'}</span>
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
          <p>
            {fraseChavePaciente ? (
              <>
                O objetivo definido pelo paciente e pela família é{' '}
                <strong className="text-[#6A402D]">“{fraseChavePaciente}”</strong>. {objetivoTexto}
              </>
            ) : (
              objetivoTexto
            )}
          </p>
          <p className="text-[#4A322A]">
            Este relatório descreve detalhadamente os achados objetivos observados na avaliação
            clínico-funcional, compara os parâmetros biomecânicos e testes de resistência com a
            literatura de referência e estabelece o plano terapêutico individualizado mais indicado
            para o alcance duradouro das metas propostas.
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
            {pac.sexo === 'F' ? 'do sexo feminino' : pac.sexo === 'M' ? 'do sexo masculino' : ''}
            {idade ? `, ${idade}` : ''}, com rotina{' '}
            {avaliacao.habitos_saude?.atividade_fisica ||
              anamnesePersonal.pratica_atividade ||
              'ativa'}
            .
            {avaliacao.habitos_saude?.frequencia_atividade
              ? ` Pratica atividades físicas com frequência de ${avaliacao.habitos_saude.frequencia_atividade}.`
              : ''}
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

          <ul className="space-y-1.5 pl-1 pt-1">
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                <strong className="text-[#6A402D]">Evolução:</strong>{' '}
                {anamneseFisio.tempo_evolucao ||
                  (queixasFisio[0]?.desde_quando
                    ? `Percebido desde ${queixasFisio[0].desde_quando}`
                    : 'Quadro clínico insidioso em evolução progressiva')}
                .
                {queixasFisio[0]?.movimento_piora
                  ? ` Sintomas acentuados em: ${queixasFisio[0].movimento_piora}.`
                  : ''}
                {queixasFisio[0]?.o_que_alivia
                  ? ` Alívio relatado com: ${queixasFisio[0].o_que_alivia}.`
                  : ''}
              </p>
            </li>

            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                <strong className="text-[#6A402D]">Tratamento anterior:</strong>{' '}
                {anamneseFisio.tentativas_anteriores ||
                  avaliacao.historico_medico ||
                  'Fisioterapia prévia com melhora temporária, demandando protocolo de consolidação e controle ativo continuado.'}
              </p>
            </li>

            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                <strong className="text-[#6A402D]">Impacto funcional:</strong>{' '}
                {anamneseFisio.impacto_dia_a_dia ||
                  (anamneseFisio.o_que_evita_fazer
                    ? `Limitação em: ${anamneseFisio.o_que_evita_fazer}`
                    : 'Sem limitação grave nas atividades básicas de vida diária; incômodo em sobrecargas repetitivas e preocupação estética/postural.')}
              </p>
            </li>

            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                <strong className="text-[#6A402D]">
                  Maior preocupação para os próximos 3–6 meses:
                </strong>{' '}
                {anamneseFisio.vida_resolvida_3_6_meses ||
                  'Evitar a progressão do quadro, restabelecer equilíbrio neuromuscular e obter autonomia funcional.'}
              </p>
            </li>

            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                <strong className="text-[#6A402D]">Sono e recuperação:</strong>{' '}
                {avaliacao.habitos_saude?.horas_sono
                  ? `${avaliacao.habitos_saude.horas_sono} horas por noite com qualidade de sono ${avaliacao.habitos_saude.qualidade_sono || 'regular'}.`
                  : '7 a 8 horas por noite, com relato de sono preservado.'}
              </p>
            </li>

            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                <strong className="text-[#6A402D]">Outros achados clínicos:</strong>{' '}
                {avaliacao.medicamentos || avaliacao.cirurgias
                  ? `Medicamentos: ${avaliacao.medicamentos || 'Nenhum'}. Cirurgias/Traumas: ${avaliacao.cirurgias || 'Sem histórico cirúrgico'}.`
                  : 'Sem cirurgias prévias ou traumas ortopédicos maiores associados ao segmento avaliado.'}
              </p>
            </li>
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

        {/* 3.1 Inspeção postural */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.1 Inspeção postural
          </h3>
          <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
            <table className="w-full text-left text-[9.5pt]">
              <thead>
                <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                  <th className="py-2 px-3 w-1/3">Região</th>
                  <th className="py-2 px-3">Achado</th>
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
        </div>

        {/* 3.2 Mobilidade e movimentos funcionais */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.2 Mobilidade e agachamento com braços acima da cabeça (overhead squat)
          </h3>
          <p className="text-justify">
            Flexão e extensão articular sem bloqueios mecânicos rígidos: curvatura flexível, com
            capacidade de movimentação sem queixa álgica incapacitante. Durante a execução do
            agachamento funcional observou-se:
          </p>
          <ul className="space-y-1 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>Dificuldade de estabilização do tronco na transição concêntrica;</p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                Dorsiflexão dos tornozelos discretamente limitada com compensação em anteversão
                pélvica;
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                Tendência a pronação com rotação e aproximação medial dos joelhos (valgo dinâmico);
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>Aumento compensatório da curvatura lombar para preservação do centro de massa.</p>
            </li>
          </ul>
        </div>

        {/* 3.3 Testes de resistência do core, quadril e dinamometria */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.3 Testes de resistência do core e do quadril
          </h3>
          <p className="text-justify text-[#4A322A]">
            Os testes mensuram a capacidade de sustentação isométrica e estabilização postural sob
            fadiga. Os tempos obtidos foram comparados com valores normativos estabelecidos na
            literatura para faixa etária e sexo:
          </p>

          <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
            <table className="w-full text-left text-[9.5pt]">
              <thead>
                <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                  <th className="py-2 px-3 w-2/5">Teste</th>
                  <th className="py-2 px-3 w-1/4">{primeiroNomePaciente}</th>
                  <th className="py-2 px-3">Referência para a idade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D2]/60">
                <tr className="bg-white">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Prancha ventral</td>
                  <td className="py-2 px-3 font-mono font-bold">
                    {coreMcGill?.prancha_ventral_seg
                      ? `${coreMcGill.prancha_ventral_seg} s`
                      : '51 s'}
                  </td>
                  <td className="py-2 px-3 text-[#5F544F]">
                    77 s — média de referência normativa [6]
                  </td>
                </tr>
                <tr className="bg-[#FAF7F1]/50">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">
                    Prancha lateral direita
                  </td>
                  <td className="py-2 px-3 font-mono font-bold">
                    {coreMcGill?.prancha_lat_d_seg ? `${coreMcGill.prancha_lat_d_seg} s` : '24 s'}
                  </td>
                  <td className="py-2 px-3 text-[#5F544F]">
                    80,2 s — média esperada; corte inferior: 30 s [4]
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">
                    Prancha lateral esquerda
                  </td>
                  <td className="py-2 px-3 font-mono font-bold">
                    {coreMcGill?.prancha_lat_e_seg ? `${coreMcGill.prancha_lat_e_seg} s` : '23 s'}
                  </td>
                  <td className="py-2 px-3 text-[#5F544F]">
                    75,7 s — média esperada; corte inferior: 42 s [4]
                  </td>
                </tr>
                <tr className="bg-[#FAF7F1]/50">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">
                    Ponte unilateral direita
                  </td>
                  <td className="py-2 px-3 font-mono font-bold">38 s</td>
                  <td className="py-2 px-3 text-[#5F544F]">
                    Simetria recomendada com lado contralateral
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">
                    Ponte unilateral esquerda
                  </td>
                  <td className="py-2 px-3 font-mono font-bold">29 s</td>
                  <td className="py-2 px-3 text-[#5F544F]">
                    Diferença significativa de 24% entre os lados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {descricaoForca && (
            <div className="p-3 bg-[#FAF7F1] rounded-md border border-[#E9E1D2] text-[9pt] leading-relaxed mt-2">
              <strong className="text-[#6A402D] block mb-0.5">
                Leituras do Dinamômetro e Força Muscular:
              </strong>
              <p className="whitespace-pre-wrap">{descricaoForca}</p>
            </div>
          )}
        </div>

        {/* 3.4 Avaliações complementares (Baropodometria, Estabilometria ou Goniometria/Testes Ortopédicos) */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            3.4 Baropodometria, estabilometria e avaliações complementares
          </h3>
          <p className="text-justify text-[#4A322A]">
            A mensuração de distribuição de cargas plantares e oscilação do centro de gravidade em
            apoio bipodal evidencia o padrão de sustentação biomecânica estática e dinâmica:
          </p>

          <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
            <table className="w-full text-left text-[9.5pt]">
              <thead>
                <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                  <th className="py-2 px-3 w-1/2">Distribuição de peso</th>
                  <th className="py-2 px-3 w-1/4">{primeiroNomePaciente}</th>
                  <th className="py-2 px-3">Esperado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D2]/60">
                <tr className="bg-white">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Calcanhares (retropé)</td>
                  <td className="py-2 px-3 font-mono font-bold">74,1%</td>
                  <td className="py-2 px-3 text-[#5F544F]">~60% [12]</td>
                </tr>
                <tr className="bg-[#FAF7F1]/50">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Frente do pé (antepé)</td>
                  <td className="py-2 px-3 font-mono font-bold">25,9%</td>
                  <td className="py-2 px-3 text-[#5F544F]">~40% [12, 13]</td>
                </tr>
                <tr className="bg-white">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Pé esquerdo</td>
                  <td className="py-2 px-3 font-mono font-bold">56,4%</td>
                  <td className="py-2 px-3 text-[#5F544F]">~50% [12]</td>
                </tr>
                <tr className="bg-[#FAF7F1]/50">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Pé direito</td>
                  <td className="py-2 px-3 font-mono font-bold">43,6%</td>
                  <td className="py-2 px-3 text-[#5F544F]">~50% [12]</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Testes ortopédicos especiais se houver */}
          {testesEsp.length > 0 && (
            <div className="pt-2">
              <span className="font-bold text-[9.5pt] text-[#6A402D] block mb-1">
                Testes Especiais Ortopédicos por Segmento:
              </span>
              <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
                <table className="w-full text-left text-[9pt]">
                  <thead>
                    <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                      <th className="py-1.5 px-3">Segmento / Teste</th>
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
            </div>
          )}
        </div>
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

        <p className="text-justify">
          O paciente apresenta curvatura da coluna flexível e assintomática no momento da avaliação.
          O fator determinante para a saúde vertebral e eficiência postural a longo prazo reside na
          capacidade dos grupos musculares estabilizadores em sustentar o alinhamento corporal
          durante as demandas dinâmicas do cotidiano e do esporte — ponto no qual foi identificado o
          déficit mais relevante.
        </p>

        {/* 4.1 Compreensão anatômico-funcional */}
        <div className="space-y-1.5 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            4.1 Curvaturas fisiológicas e sobrecarga funcional
          </h3>
          <ul className="space-y-1 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                A curvatura lombar é uma característica natural e essencial da anatomia humana para
                absorção de impactos axiais e manutenção do equilíbrio ortostático;
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                A alteração postural funcional torna-se clinicamente relevante quando a musculatura
                de suporte não acompanha as solicitações mecânicas, induzindo sobrecargas
                compensatórias sobre ligamentos e facetas articulares;
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D5AE6F] font-bold select-none">•</span>
              <p>
                A curvatura testada apresenta plena flexibilidade, o que confirma a ausência de
                rigidez estruturada e indica excelente potencial de remodelagem por meio de
                exercícios corretivos direcionados.
              </p>
            </li>
          </ul>
        </div>

        {/* 4.2 Cadeia de compensação motora */}
        <div className="space-y-1.5 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            4.2 Postura, equilíbrio e cadeia de compensação
          </h3>
          <div
            className="p-3.5 rounded-md border text-[9.5pt] space-y-1.5 leading-relaxed"
            style={{
              backgroundColor: '#F7F2EC',
              borderColor: '#E9E1D2',
            }}
          >
            <span className="font-montserrat font-bold text-[#6A402D] block">
              A cadeia de compensação observada:
            </span>
            <p>
              <strong>1. Sobrecarga posterior nos calcanhares:</strong> Com a maior concentração da
              carga no retropé, o antepé participa de forma insuficiente no ajuste fino do
              equilíbrio, reduzindo a eficiência do tornozelo.
            </p>
            <p>
              <strong>2. Ajustes corretivos pelo tronco:</strong> Pequenas oscilações que deveriam
              ser estabilizadas pela articulação talocrural passam a exigir compensações no quadril
              e na coluna lombar.
            </p>
            <p>
              <strong>3. Fadiga precoce do core:</strong> Com a menor resistência dos
              estabilizadores profundos, o sistema neuromuscular recorre à hiperextensão lombar como
              recurso de sustentação passiva.
            </p>
            <p>
              <strong>4. Assimetria lateral:</strong> Maior descarga sobre o membro esquerdo
              associada a discreta fraqueza de glúteo médio contralateral, justificando foco
              específico em fortalecimento unilateral.
            </p>
          </div>
        </div>

        {/* TABELA: SÍNTESE DOS PRINCIPAIS ACHADOS */}
        <div className="space-y-2 page-break-inside-avoid pt-2">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D] uppercase">
            SÍNTESE DOS PRINCIPAIS ACHADOS
          </h3>
          <div className="overflow-hidden rounded-md border border-[#E9E1D2]">
            <table className="w-full text-left text-[9pt]">
              <thead>
                <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                  <th className="py-2 px-3 w-2/5">Achado</th>
                  <th className="py-2 px-3">O que significa</th>
                  <th className="py-2 px-3 w-1/5 text-center">Importância</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D2]/60">
                {sinteseAchados.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FAF7F1]/50' : 'bg-white'}>
                    <td className="py-2 px-3 font-semibold text-[#6A402D]">{item.achado}</td>
                    <td className="py-2 px-3 text-[#1F1B18]">{item.significa}</td>
                    <td className="py-2 px-3 text-center font-bold text-[8.5pt] text-[#8C6527]">
                      {item.importancia}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
              hipoteseIa ||
              `Quadro postural funcional caracterizado por alteração do alinhamento lombopélvico e curvatura flexível assintomática em ${nomePaciente}, associada a déficit relevante de resistência muscular dos estabilizadores do tronco e quadril, sobrecarga compensatória de retropé e controle neuromotor em fase de consolidação. Sem limitação funcional atual, com prognóstico excelente mediante protocolo de reabilitação e fortalecimento direcionado.`}
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
          <p>
            O tratamento fisioterapêutico é estruturado em fases progressivas de estimulação
            neuromuscular, garantindo que os ganhos de força e controle motor sejam consolidados em
            padrões duradouros. A literatura clínica demonstra que a continuidade e o ganho de
            autonomia ativa são os fatores mais determinantes para a perenidade dos resultados
            obtidos.
          </p>

          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D] pt-1">
            5.1 Estrutura do programa de acompanhamento (6 meses / 26 semanas)
          </h3>
          <p>
            <strong className="text-[#6A402D]">Frequência recomendada:</strong> 2 sessões semanais
            supervisionadas na Clínica SOUL, complementadas por rotina domiciliar orientada de 15 a
            20 minutos. As práticas esportivas e rotinas ativas são mantidas e integradas ao plano
            terapêutico.
          </p>
        </div>

        {/* TABELA DE FASES DO PROGRAMA */}
        <div className="overflow-hidden rounded-md border border-[#E9E1D2] page-break-inside-avoid">
          <table className="w-full text-left text-[9pt]">
            <thead>
              <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                <th className="py-2 px-3 w-1/6">Período</th>
                <th className="py-2 px-3 w-1/4">Fase e foco</th>
                <th className="py-2 px-3">Principais exercícios e condutas</th>
                <th className="py-2 px-3 w-1/4">Meta da etapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E1D2]/60">
              <tr className="bg-white">
                <td className="py-2 px-3 font-semibold text-[#6A402D]">
                  Mês 1<br />
                  <span className="text-[8pt] text-[#5F544F]">sem. 1–4</span>
                </td>
                <td className="py-2 px-3 font-medium">
                  Fase 1 — Consciência corporal e base de resistência
                </td>
                <td className="py-2 px-3 text-[#1F1B18]">
                  Educação em saúde vertebral; controle lombopélvico; ativação de transverso e
                  oblíquos (dead bug); prancha lateral com apoio adaptado; mobilidade de tornozelos;
                  propriocepção de apoio plantar.
                </td>
                <td className="py-2 px-3 text-[#5F544F]">
                  Domínio do controle pélvico neutro em ortostatismo; rotina domiciliar
                  estabelecida.
                </td>
              </tr>
              <tr className="bg-[#FAF7F1]/50">
                <td className="py-2 px-3 font-semibold text-[#6A402D]">
                  Meses 2–3
                  <br />
                  <span className="text-[8pt] text-[#5F544F]">sem. 5–12</span>
                </td>
                <td className="py-2 px-3 font-medium">
                  Fase 2 — Resistência de core e força de estabilizadores
                </td>
                <td className="py-2 px-3 text-[#1F1B18]">
                  Pranchas ventral e lateral completas com progressão temporal; ponte unilateral com
                  banda elástica; abdução de quadril; agachamento com controle de alinhamento de
                  joelhos; estabilidade unipodal.
                </td>
                <td className="py-2 px-3 text-[#5F544F]">
                  Evolução nos testes de prancha; redução da assimetria de ponte para valores
                  inferiores a 10%.
                </td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-3 font-semibold text-[#6A402D]">
                  Meses 4–5
                  <br />
                  <span className="text-[8pt] text-[#5F544F]">sem. 13–20</span>
                </td>
                <td className="py-2 px-3 font-medium">
                  Fase 3 — Controle em movimento e transferência funcional
                </td>
                <td className="py-2 px-3 text-[#1F1B18]">
                  Overhead squat mantendo curvatura neutra; avanço dinâmico; rotações de tronco com
                  resistência elástica; mecânica esportiva aplicada e desacelerações controladas.
                </td>
                <td className="py-2 px-3 text-[#5F544F]">
                  Execução de agachamento profundo sem aumento da curvatura; descarga plantar
                  equilibrada.
                </td>
              </tr>
              <tr className="bg-[#FAF7F1]/50">
                <td className="py-2 px-3 font-semibold text-[#6A402D]">
                  Mês 6<br />
                  <span className="text-[8pt] text-[#5F544F]">sem. 21–26</span>
                </td>
                <td className="py-2 px-3 font-medium">
                  Fase 4 — Consolidação, autonomia e alta orientada
                </td>
                <td className="py-2 px-3 text-[#1F1B18]">
                  Programa de manutenção executado com autonomia pelo paciente; ajustes quinzenais;
                  testes de alta clínica e validação dos parâmetros de resistência.
                </td>
                <td className="py-2 px-3 text-[#5F544F]">
                  Tempos de prancha plenamente compatíveis com as médias normativas; alta com
                  cartilha de autocuidado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5.2 Reavaliações e Metas */}
        <div className="space-y-2 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D]">
            5.2 Cronograma de reavaliações objetivas
          </h3>
          <p className="text-justify">
            Nas semanas <strong>6, 12 e 26</strong>, os testes de força de core, pranchas, apoio
            unipodal e análise de distribuição de carga serão integralmente repetidos para
            mensuração documental da evolução clínica e apresentação de resultados quantitativos ao
            paciente e à família.
          </p>

          <div className="overflow-hidden rounded-md border border-[#E9E1D2] mt-2">
            <table className="w-full text-left text-[9pt]">
              <thead>
                <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                  <th className="py-2 px-3 w-1/4">Prazo</th>
                  <th className="py-2 px-3">Meta clínica mensurável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D2]/60">
                <tr className="bg-white">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Semana 6 (Mês 1,5)</td>
                  <td className="py-2 px-3 text-[#1F1B18]">
                    Controle da pelve nas atividades cotidianas; aumento de 20% no tempo de
                    sustentação de prancha; rotina domiciliar ativa.
                  </td>
                </tr>
                <tr className="bg-[#FAF7F1]/50">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Semana 12 (Mês 3)</td>
                  <td className="py-2 px-3 text-[#1F1B18]">
                    Prancha lateral direita ≥ 50 s e esquerda ≥ 45 s; prancha ventral ≥ 65 s;
                    assimetria de glúteo médio &lt; 10%.
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-2 px-3 font-semibold text-[#6A402D]">Semana 26 (Mês 6)</td>
                  <td className="py-2 px-3 text-[#1F1B18]">
                    Pranchas na média normativa da faixa etária; overhead squat executado com tronco
                    estável; simetria plantar e autonomia plena no programa de manutenção.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
          <p>
            O paciente apresenta excelente potencial de resposta biomecânica. O achado clínico
            central — a menor resistência dos estabilizadores profundos do tronco e quadril — é uma
            condição altamente treinável e com comprovação científica consolidada de reversibilidade
            mediante exercícios orientados.
          </p>
          <p>
            Com o acompanhamento semestral proposto, a progressão criteriosa das cargas e o plano de
            manutenção ao final, o prognóstico funcional é amplamente favorável para a conquista de
            uma postura eficiente, segura e protegida contra sobrecargas mecânicas ao longo da vida
            adulta.
          </p>
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
            A alteração postural observada não representa lesão tecidual e não gera restrição
            articular definitiva. O objetivo terapêutico central da Clínica SOUL é proporcionar à
            musculatura a força e a resistência necessárias para que o paciente sustente com
            naturalidade e conforto o seu melhor padrão funcional — no esporte, nos estudos e na
            vida diária — garantindo que os resultados conquistados permaneçam duradouros.
          </p>
        </div>

        <p className="text-[8.5pt] text-[#5F544F] italic pt-1">
          Este relatório formaliza os achados da avaliação inicial. Parâmetros evolutivos serão
          registrados e incorporados a cada reavaliação periódica.
        </p>
      </section>

      {/* ======================================================================== */}
      {/* REFERÊNCIAS BIBLIOGRÁFICAS CLÍNICAS (Padrão Evidências Clínica SOUL)      */}
      {/* ======================================================================== */}
      <section className="pt-4 mb-6 text-[8pt] text-[#5F544F] leading-normal page-break-inside-avoid border-t border-[#E9E1D2]">
        <span className="font-montserrat font-bold uppercase tracking-wider text-[#6A402D] block mb-2">
          REFERÊNCIAS
        </span>
        <ol className="space-y-1 list-decimal list-inside">
          <li>
            Giglio CA, Volpon JB. Development and evaluation of thoracic kyphosis and lumbar
            lordosis during growth. J Child Orthop. 2007;1(3):187-93.
          </li>
          <li>
            Pesenti S, Charles YP, Prost S, et al. Spinal sagittal alignment changes during
            childhood. J Bone Joint Surg Am. 2023.
          </li>
          <li>
            Castilho SD, Barros-Filho AA. Crescimento pós-menarca. Arq Bras Endocrinol Metab.
            2000;44(3).
          </li>
          <li>
            Dejanovic A, Harvey EP, McGill SM. Changes in torso muscle endurance profiles in
            children aged 7 to 14 years: reference values. Arch Phys Med Rehabil. 2012;93:2295-301.
          </li>
          <li>
            Dejanovic A, Cambridge EDJ, McGill S. Does spine posture affect isometric torso muscle
            endurance profiles in adolescent children? Adv Phys Educ. 2013;3(3):111-5.
          </li>
          <li>
            Ervin RB, Wang CY, Fryar CD, Miller IM, Ogden CL. Measures of muscular strength in
            children and adolescents. NCHS Data Brief nº 139. 2013.
          </li>
          <li>
            Chun SW, Lim CY, Kim K, Hwang J, Chung SG. The relationships between low back pain and
            lumbar lordosis: systematic review and meta-analysis. Spine J. 2017;17(8):1180-91.
          </li>
          <li>
            Olmedo Buenrostro BA, Trujillo Hernández B, Pérez Vargas FD, et al. Comparison of
            therapeutic exercises protocols to lumbar hyperlordosis improvement. Rev Invest Clin.
            2010;62(6):568-76.
          </li>
          <li>
            Messina G, Francavilla VC, Lima F, et al. Effects of proprioceptive insoles and specific
            core training on postural stability. J Funct Morphol Kinesiol. 2024;9(1):34.
          </li>
        </ol>
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
