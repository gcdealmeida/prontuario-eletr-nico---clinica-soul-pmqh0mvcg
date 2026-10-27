/**
 * Utilitário de normalização e limpeza de Markdown para Relatórios Clínicos da Clínica SOUL.
 *
 * Transforma tabelas markdown cruas (| col1 | col2 |, |---|---|), títulos, pipes e traços
 * em texto estruturado legível com tópicos e listas limpas, garantindo que nenhum
 * caractere markdown cru como |, ---, **, ## apareça de forma desordenada no Modelo Oficial,
 * na edição, na cópia ou na impressão.
 */

/**
 * Verifica se uma linha é uma linha de separador de tabela Markdown (ex: "|---|---|", "|:---:|---:|")
 */
function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.includes('|') && !trimmed.startsWith('-')) return false
  // Remove pipes, espaços, dois-pontos e hífens
  const stripped = trimmed.replace(/[|\-:\s]/g, '')
  // Se não sobrou nenhum outro caractere e tem pelo menos 2 hífens ou traços
  return stripped.length === 0 && (trimmed.includes('-') || trimmed.includes('|'))
}

/**
 * Converte linhas que formam tabelas Markdown em blocos de texto estruturado com tópicos legíveis
 */
function converterTabelasMarkdownEmTexto(texto: string): string {
  if (!texto || !texto.includes('|')) return texto

  const linhas = texto.split('\n')
  const resultadoLinhas: string[] = []

  let emTabela = false
  let cabecalhos: string[] = []

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    const trimmed = linha.trim()

    // Linha parece ser de tabela: começa ou contém múltiplos pipes '|'
    const pipeCount = (trimmed.match(/\|/g) || []).length
    const pareceTabela =
      pipeCount >= 2 &&
      (trimmed.startsWith('|') || trimmed.endsWith('|') || isTableSeparatorLine(trimmed))

    if (pareceTabela) {
      if (isTableSeparatorLine(trimmed)) {
        // Separador de tabela (ex: |---|---|) — simplesmente ignorar
        emTabela = true
        continue
      }

      // Extrair células limpando espaços e pipes pontas
      const celulas = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => {
          // Remover primeira e última se vazias por causa dos pipes nas bordas
          if (idx === 0 && c === '' && trimmed.startsWith('|')) return false
          if (idx === arr.length - 1 && c === '' && trimmed.endsWith('|')) return false
          return true
        })

      if (celulas.length === 0) continue

      if (!emTabela) {
        // Primeira linha da tabela (geralmente cabeçalho)
        cabecalhos = celulas
        emTabela = true
        // Se a próxima linha for separador, confirma que é tabela
        continue
      }

      // Linha de dados da tabela
      if (cabecalhos.length > 0 && cabecalhos.length === celulas.length) {
        // Montar formato amigável: "- Cabecalho1: Valor1 | Cabecalho2: Valor2" ou linha estruturada
        const partes: string[] = []
        for (let c = 0; c < celulas.length; c++) {
          const tit = cabecalhos[c].replace(/\*\*/g, '').trim()
          const val = celulas[c].trim()
          if (val && val !== '-') {
            if (tit && !tit.match(/^\d+$/) && tit.toLowerCase() !== 'item') {
              partes.push(`${tit}: ${val}`)
            } else {
              partes.push(val)
            }
          }
        }
        if (partes.length > 0) {
          resultadoLinhas.push(`• ${partes.join(' — ')}`)
        }
      } else {
        // Sem cabeçalho compatível, junta as células com traço
        const partesValidas = celulas.filter((c) => c && c !== '-')
        if (partesValidas.length > 0) {
          resultadoLinhas.push(`• ${partesValidas.join(' — ')}`)
        }
      }
    } else {
      // Saiu de bloco de tabela
      if (emTabela) {
        emTabela = false
        cabecalhos = []
      }
      resultadoLinhas.push(linha)
    }
  }

  return resultadoLinhas.join('\n')
}

/**
 * Limpa prefixos mecânicos de formulário e rótulos redundantes residuais:
 * - "CAMPO: Nome: Fulano" -> "Fulano"
 * - "CAMPO: Fulano" -> "Fulano"
 * - "**CAMPO:** **Nome:** Fulano" -> "Fulano"
 * - "Nome: Fulano" quando redundante / duplicado
 * - "Achado: ...", "Achados: ...", "Conclusão: ..." em laudos de exames/RNM
 */
export function limparRotulosRedundantes(texto: string): string {
  if (!texto) return ''

  return texto
    .split('\n')
    .map((linha) => {
      let l = linha

      // 1. Limpar prefixos "CAMPO:" ou variações ("CAMPO: Nome:", "**CAMPO:**", "Campo:")
      // Casos com markdown ou sem:
      // ex: "CAMPO: Nome: Bernardo Maia" -> "Bernardo Maia"
      // ex: "- CAMPO: Nome: Bernardo Maia" -> "- Bernardo Maia"
      // ex: "• **CAMPO:** **Nome:** Bernardo Maia" -> "• Bernardo Maia"
      l = l.replace(
        /^(\s*(?:[-•*]\s*)?)(?:\*{0,2}CAMPO\s*:\*{0,2}\s*)(?:\*{0,2}Nome(?:\s+do\s+Paciente)?\s*:\*{0,2}\s*)?/i,
        '$1',
      )

      // Se ainda sobrou "Nome: " logo após marcador de lista e antes de nome próprio no topo
      l = l.replace(
        /^(\s*(?:[-•*]\s*)?)(?:\*{0,2}Nome(?:\s+do\s+Paciente)?\s*:\*{0,2}\s*)(?:\*{0,2}Nome(?:\s+do\s+Paciente)?\s*:\*{0,2}\s*)/i,
        '$1',
      )

      // Limpar "CAMPO:" isolado no meio da linha
      l = l.replace(/\bCAMPO\s*:\s*(?:Nome\s*:\s*)?/gi, '')

      // 2. Limpar prefixos mecânicos residuais de exames como "Achado:", "Achados:", "Achado 1:", "Conclusão:"
      // Transforma "- Achado: rotura no menisco..." em "- Rotura no menisco..."
      l = l.replace(
        /^(\s*(?:[-•*]\s*)?)(?:\*{0,2}Achados?(?:\s+\d+)?\s*:\*{0,2}\s*)(.*)$/i,
        (_match, prefix, resto) => {
          const restoTrim = resto.trim()
          if (!restoTrim) return ''
          // Capitalizar a primeira letra do achado clínico
          const capitalizado = restoTrim.charAt(0).toUpperCase() + restoTrim.slice(1)
          return `${prefix}${capitalizado}`
        },
      )

      // Transforma "- Conclusão: edema infrapatelar..." em "- Edema infrapatelar..."
      l = l.replace(
        /^(\s*(?:[-•*]\s*)?)(?:\*{0,2}Conclus[aã]o(?:\s+do\s+laudo)?\s*:\*{0,2}\s*)(.*)$/i,
        (_match, prefix, resto) => {
          const restoTrim = resto.trim()
          if (!restoTrim) return ''
          const capitalizado = restoTrim.charAt(0).toUpperCase() + restoTrim.slice(1)
          return `${prefix}${capitalizado}`
        },
      )

      return l
    })
    .join('\n')
}

/**
 * Normaliza o relatório recebido da IA ou carregado do banco:
 * 1. Converte tabelas Markdown para listas/tópicos legíveis sem pipes (|) ou separadores (---)
 * 2. Remove pipes soltos ou resquícios de formatação de tabela
 * 3. Limpa rótulos redundantes ("CAMPO:", "Nome:" duplicados, "Achado:" linha a linha)
 * 4. Garante que as 6 seções numeradas fiquem bem destacadas
 * 5. Limpa múltiplos saltos de linha redundantes
 */
export function normalizarConteudoRelatorio(textoBruto: string): string {
  if (!textoBruto) return ''

  // 1. Converter tabelas markdown completas
  let texto = converterTabelasMarkdownEmTexto(textoBruto)

  // 2. Limpar linhas que ainda tenham sobrado como separadores crus de markdown (ex: "|---|", "---|---", "---")
  texto = texto
    .split('\n')
    .map((linha) => {
      const trimmed = linha.trim()
      if (isTableSeparatorLine(trimmed)) {
        return ''
      }
      // Se a linha começar com pipes soltos residuais ou terminar com pipes, limpa
      if (trimmed.startsWith('|') || trimmed.endsWith('|')) {
        const pedacos = trimmed
          .split('|')
          .map((p) => p.trim())
          .filter(Boolean)
        if (pedacos.length > 0) {
          return `• ${pedacos.join(' — ')}`
        }
        return ''
      }
      return linha
    })
    .join('\n')

  // 3. Limpar rótulos redundantes de formulário e prefixos tipo "CAMPO:", "Nome:" duplicado e "Achado:"
  texto = limparRotulosRedundantes(texto)

  // 4. Limpar subtítulo residual do Resumo de Evolução ("Síntese Longitudinal Multidisciplinar com IA")
  // caso o modelo antigo o tenha gerado no início do texto ou como cabeçalho
  texto = texto.replace(
    /(?:^|\n)\s*(?:#+\s*|\*\*\s*|[-•*]\s*)?(?:RESUMO\s+DE\s+EVOLU[CÇ][AÃ]O\s+CL[IÍ]NICA\s*[-—–]\s*)?S[ií]ntese\s+Longitudinal\s+Multidisciplinar(?:\s+com\s+IA)?(?:\s*\*\*)?:?\s*(?:\n|$)/gi,
    '\n',
  )

  // 4. Normalizar espaçamentos e quebras de linha excessivas (mais de 2 saltos consecutivos)
  texto = texto.replace(/\n{3,}/g, '\n\n')

  return texto.trim()
}

/**
 * Limpa símbolos markdown (**, ##, *, _) para exportação ou cópia em texto simples 100% puro
 */
export function normalizarParaTextoPuro(textoBruto: string): string {
  if (!textoBruto) return ''
  const normalizado = normalizarConteudoRelatorio(textoBruto)

  return (
    normalizado
      // Remove títulos markdown (###, ##, #)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove negrito e itálico (**termo**, *termo*, __termo__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove marcadores de código inline (`termo`)
      .replace(/`([^`]+)`/g, '$1')
      .trim()
  )
}

/**
 * Interface padronizada do resultado da Conclusão com IA (Fisio / Personal).
 */
export interface ConclusaoIaEstruturada {
  hipotese_diagnostica: string
  fundamentacao_cientifica: string
  diagnostico_disfuncional: string
  objetivos_tratamento: string
  plano_tratamento_semanal: Array<{
    semana: string
    foco: string
    condutas: string
    criterios_evolucao?: string
  }>
  plano_tratamento_texto?: string
  sintese_geral: string
}

/**
 * Tenta parsear JSON cru retornado pela IA com suporte a blocos markdown e aspas inteligentes.
 */
export function tentarParsearJsonIa(raw: string | undefined | null): any | null {
  if (!raw || typeof raw !== 'string') return null
  let text = raw.trim()

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim()
  } else {
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1)
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    /* intentionally ignored */
  }

  try {
    const semTrailingCommas = text
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
    return JSON.parse(semTrailingCommas)
  } catch {
    /* intentionally ignored */
  }

  return null
}

/**
 * Converte blocos semanais de plano em texto legível formatado
 */
export function formatarPlanoSemanalEmTexto(
  semanas: Array<{
    semana?: string
    foco?: string
    condutas?: string
    criterios_evolucao?: string
  }>,
): string {
  if (!Array.isArray(semanas) || semanas.length === 0) return ''
  return semanas
    .map((s) => {
      const rotulo = s.semana || 'Semana'
      const foco = s.foco ? ` ${s.foco}` : ''
      const condutas = s.condutas ? `\nCondutas: ${s.condutas}` : ''
      const criterios = s.criterios_evolucao ? `\nCritérios: ${s.criterios_evolucao}` : ''
      return `[${rotulo}]${foco}${condutas}${criterios}`
    })
    .join('\n\n')
}

/**
 * Parser heurístico ROBUSTO de texto livre da IA para distribuir com precisão nas seções
 * da avaliação clínica (Fisioterapia ou Personal).
 *
 * Garante que NUNCA todo o texto caia em um único campo como "1. Hipótese Diagnóstica",
 * limpando resíduos de markdown, marcadores e normalizando parágrafos.
 */
export function distribuirConclusaoIaPorHeuristica(
  raw: string | undefined | null,
  tipo: 'fisioterapia' | 'personal' = 'fisioterapia',
): ConclusaoIaEstruturada {
  const vazia: ConclusaoIaEstruturada = {
    hipotese_diagnostica: '',
    fundamentacao_cientifica: '',
    diagnostico_disfuncional: '',
    objetivos_tratamento: '',
    plano_tratamento_semanal: [],
    plano_tratamento_texto: '',
    sintese_geral: '',
  }

  if (!raw || typeof raw !== 'string') return vazia
  const textoLimpo = normalizarConteudoRelatorio(raw)

  // 1. Tentar primeiro extrair via marcadores explícitos estilo TAG: ou ###TAG###
  const regexMarcadores =
    /(?:###\s*([A-Z0-9_]+)\s*###|^([A-Z0-9_]{3,30})\s*:)\s*([\s\S]*?)(?=(?:###\s*[A-Z0-9_]+\s*###|^[A-Z0-9_]{3,30}\s*:)|$)/gim
  let m
  let encontrouMarcador = false
  const achadosMarcador: Record<string, string> = {}

  while ((m = regexMarcadores.exec(textoLimpo)) !== null) {
    const tag = (m[1] || m[2] || '').toUpperCase().trim()
    const val = (m[3] || '').trim()
    if (!val) continue

    if (tag.includes('HIPOTESE') || tag.includes('AVALIACAO_FUNCIONAL')) {
      achadosMarcador.hipotese =
        (achadosMarcador.hipotese ? achadosMarcador.hipotese + '\n\n' : '') + val
      encontrouMarcador = true
    } else if (
      tag.includes('FUNDAMENTACAO') ||
      tag.includes('PERIODIC') ||
      tag.includes('LITERATURA')
    ) {
      achadosMarcador.fundamentacao =
        (achadosMarcador.fundamentacao ? achadosMarcador.fundamentacao + '\n\n' : '') + val
      encontrouMarcador = true
    } else if (
      tag.includes('DISFUNCIONAL') ||
      tag.includes('CINETICO') ||
      (tag.includes('DIAGNOSTICO') && !tag.includes('MEDICO')) ||
      tag.includes('PONTOS_FORTES')
    ) {
      achadosMarcador.diagnostico =
        (achadosMarcador.diagnostico ? achadosMarcador.diagnostico + '\n\n' : '') + val
      encontrouMarcador = true
    } else if (tag.includes('OBJETIV') || tag.includes('METAS')) {
      achadosMarcador.objetivos =
        (achadosMarcador.objetivos ? achadosMarcador.objetivos + '\n\n' : '') + val
      encontrouMarcador = true
    } else if (tag.includes('PLANO') || tag.includes('SEMANAL') || tag.includes('PERIODIZACAO')) {
      achadosMarcador.plano = (achadosMarcador.plano ? achadosMarcador.plano + '\n\n' : '') + val
      encontrouMarcador = true
    } else if (tag.includes('SINTESE') || tag.includes('RESUMO') || tag.includes('OBSERVACOES')) {
      achadosMarcador.sintese =
        (achadosMarcador.sintese ? achadosMarcador.sintese + '\n\n' : '') + val
      encontrouMarcador = true
    }
  }

  // 2. Se os marcadores fortes pegaram pelo menos 2 seções, usar direto
  if (encontrouMarcador && Object.keys(achadosMarcador).length >= 2) {
    return {
      hipotese_diagnostica: normalizarParaTextoPuro(achadosMarcador.hipotese || ''),
      fundamentacao_cientifica: normalizarParaTextoPuro(achadosMarcador.fundamentacao || ''),
      diagnostico_disfuncional: normalizarParaTextoPuro(achadosMarcador.diagnostico || ''),
      objetivos_tratamento: normalizarParaTextoPuro(achadosMarcador.objetivos || ''),
      plano_tratamento_semanal: parsearPlanoSemanalDeTexto(achadosMarcador.plano || '', tipo),
      plano_tratamento_texto: normalizarConteudoRelatorio(achadosMarcador.plano || ''),
      sintese_geral: normalizarParaTextoPuro(achadosMarcador.sintese || ''),
    }
  }

  // 3. Parser heurístico linha a linha identificando cabeçalhos clássicos numerados ou em negrito
  // Ex: "1. Hipótese Diagnóstica", "2. Diagnóstico Disfuncional", "### Fundamentação Científica", etc.
  const secoesConfig = [
    {
      key: 'hipotese',
      regex:
        /^(?:(?:\d+[.)-]\s*)?(?:hip[oó]tese\s*diagn[oó]stica|avalia[cç][aã]o\s*funcional|an[aá]lise\s*(?:cl[ií]nica|biomec[aâ]nica)))(?:\s*\(.*?\))?:?$/i,
    },
    {
      key: 'fundamentacao',
      regex:
        /^(?:(?:\d+[.)-]\s*)?(?:fundamenta[cç][aã]o\s*cient[ií]fica|peri[oó]dicos\s*(?:cient[ií]ficos|de\s*refer[eê]ncia)?|literatura\s*cient[ií]fica|evid[eê]ncias\s*cient[ií]ficas))(?:\s*\(.*?\))?:?$/i,
    },
    {
      key: 'diagnostico',
      regex:
        /^(?:(?:\d+[.)-]\s*)?(?:diagn[oó]stico\s*disfuncional|diagn[oó]stico\s*cin[eé]tico[- ]funcional|diagn[oó]stico\s*fisioterap[eê]utico|diagn[oó]stico\s*funcional|pontos\s*fortes\s*e\s*limita[cç][oõ]es))(?:\s*\(.*?\))?:?$/i,
    },
    {
      key: 'objetivos',
      regex:
        /^(?:(?:\d+[.)-]\s*)?(?:objetivos\s*(?:do\s*tratamento|terap[eê]uticos|do\s*treinamento|priorizados)?|metas\s*de\s*tratamento))(?:\s*\(.*?\))?:?$/i,
    },
    {
      key: 'plano',
      regex:
        /^(?:(?:\d+[.)-]\s*)?(?:plano\s*(?:de\s*tratamento|de\s*treino|de\s*treinamento|semanal|semana\s*a\s*semana)|periodiza[cç][aã]o(?:\s*semanal)?))(?:\s*\(.*?\))?:?$/i,
    },
    {
      key: 'sintese',
      regex:
        /^(?:(?:\d+[.)-]\s*)?(?:s[ií]ntese\s*geral|resumo\s*(?:do\s*prontu[aá]rio|geral|final)|observa[cç][oõ]es\s*finais))(?:\s*\(.*?\))?:?$/i,
    },
  ]

  const linhas = textoLimpo.split('\n')
  const acumuladores: Record<string, string[]> = {
    hipotese: [],
    fundamentacao: [],
    diagnostico: [],
    objetivos: [],
    plano: [],
    sintese: [],
  }

  let chaveAtiva = 'hipotese'
  let achouAlgumCabecalho = false

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    const trimmed = linha.trim()

    // Normaliza para testar se a linha é um título de seção
    const linhaParaTeste = trimmed
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\*\*([\s\S]+)\*\*$/, '$1')
      .replace(/^__([\s\S]+)__$/, '$1')
      .trim()

    let secaoMatch: string | null = null
    if (linhaParaTeste.length >= 3 && linhaParaTeste.length <= 80) {
      for (const sc of secoesConfig) {
        if (sc.regex.test(linhaParaTeste)) {
          secaoMatch = sc.key
          break
        }
      }
    }

    if (secaoMatch) {
      chaveAtiva = secaoMatch
      achouAlgumCabecalho = true
      continue
    }

    acumuladores[chaveAtiva].push(linha)
  }

  const hipoteseBruta = acumuladores.hipotese.join('\n').trim()
  const fundBruta = acumuladores.fundamentacao.join('\n').trim()
  const diagBruto = acumuladores.diagnostico.join('\n').trim()
  const objBruto = acumuladores.objetivos.join('\n').trim()
  const planoBruto = acumuladores.plano.join('\n').trim()
  const sinteseBruta = acumuladores.sintese.join('\n').trim()

  const resultado: ConclusaoIaEstruturada = {
    hipotese_diagnostica: normalizarParaTextoPuro(hipoteseBruta),
    fundamentacao_cientifica: normalizarParaTextoPuro(fundBruta),
    diagnostico_disfuncional: normalizarParaTextoPuro(diagBruto),
    objetivos_tratamento: normalizarParaTextoPuro(objBruto),
    plano_tratamento_semanal: parsearPlanoSemanalDeTexto(planoBruto, tipo),
    plano_tratamento_texto: normalizarConteudoRelatorio(planoBruto),
    sintese_geral: normalizarParaTextoPuro(sinteseBruta),
  }

  // 4. Se não achou cabeçalhos suficientes ou se a hipótese acumulou todo o texto (>400 caracteres e os outros vazios),
  // fatiar por parágrafos/conteúdo sem perder nada
  if (
    (!achouAlgumCabecalho ||
      (!resultado.diagnostico_disfuncional && !resultado.objetivos_tratamento)) &&
    resultado.hipotese_diagnostica.length > 300
  ) {
    const paragrafos = resultado.hipotese_diagnostica
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (paragrafos.length >= 2) {
      const restantes: string[] = []

      for (const p of paragrafos) {
        // Citação de periódicos
        if (
          !resultado.fundamentacao_cientifica &&
          /JBJS|AJSM|Spine|BJSM|JOSPT|BJPT|Arthroscopy|RBO|MSSE|RBME|Physical Therapy in Sport|Fisioterapia Brasil/i.test(
            p,
          )
        ) {
          resultado.fundamentacao_cientifica = p
          continue
        }

        // Diagnóstico cinético-funcional
        if (
          !resultado.diagnostico_disfuncional &&
          /diagn[oó]stico|disfun[cç][aã]o\s*cin[eé]tico|d[eé]ficit\s*de|fraqueza|mobilidade|estabilidade/i.test(
            p,
          )
        ) {
          resultado.diagnostico_disfuncional = p
          continue
        }

        // Objetivos terapêuticos
        if (
          !resultado.objetivos_tratamento &&
          /objetivo|curto prazo|m[eé]dio prazo|longo prazo|meta/i.test(p)
        ) {
          resultado.objetivos_tratamento = p
          continue
        }

        // Plano semanal
        if (
          !resultado.plano_tratamento_texto &&
          /semana\s*\d|fase\s*\d|periodiza[cç][aã]o|condutas|reabilita[cç][aã]o/i.test(p)
        ) {
          resultado.plano_tratamento_texto = p
          resultado.plano_tratamento_semanal = parsearPlanoSemanalDeTexto(p, tipo)
          continue
        }

        restantes.push(p)
      }

      if (restantes.length > 0) {
        resultado.hipotese_diagnostica = restantes.join('\n\n')
      }
    }
  }

  return resultado
}

/**
 * Tenta decompor um texto livre de plano semanal em blocos estruturados ({ semana, foco, condutas, criterios_evolucao })
 */
export function parsearPlanoSemanalDeTexto(
  textoPlano: string,
  tipo: 'fisioterapia' | 'personal' = 'fisioterapia',
): Array<{ semana: string; foco: string; condutas: string; criterios_evolucao?: string }> {
  if (!textoPlano || typeof textoPlano !== 'string') return []

  // Bloco padrão com regex para detectar [Semana 1-2] ou Semana 1-2: ou Fase 1:
  const blocosRegex =
    /(?:\[(Semanas?\s*[\d–-]+)\]|(?:^|\n)(Semanas?\s*[\d–-]+|Fase\s*\d+)[:\s–-]+)([\s\S]*?)(?=(?:\[Semanas?\s*[\d–-]+\]|(?:^|\n)(?:Semanas?\s*[\d–-]+|Fase\s*\d+)[:\s–-]+)|$)/gi
  const resultado: Array<{
    semana: string
    foco: string
    condutas: string
    criterios_evolucao?: string
  }> = []
  let b

  while ((b = blocosRegex.exec(textoPlano)) !== null) {
    const nomeSemana = (b[1] || b[2] || '').trim()
    const corpo = (b[3] || '').trim()
    if (!nomeSemana && !corpo) continue

    let foco = ''
    let condutas = ''
    let criterios = ''

    const linhasCorpo = corpo
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (linhasCorpo.length > 0) {
      // Primeira linha costuma ser o foco
      const primeira = linhasCorpo[0]
      if (/foco\s*:/i.test(primeira)) {
        foco = primeira.replace(/foco\s*:/i, '').trim()
      } else if (!/conduta|crit[eé]rio/i.test(primeira)) {
        foco = primeira
      }

      // Restante
      const resto = linhasCorpo.slice(foco === primeira ? 1 : 0).join('\n')
      const condutaMatch = resto.match(
        /(?:condutas?|prescri[cç][aã]o|exerc[ií]cios)\s*:\s*([\s\S]*?)(?=(?:crit[eé]rios?|$))/i,
      )
      const criterioMatch = resto.match(
        /crit[eé]rios?\s*(?:de\s*evolu[cç][aã]o|de\s*progress[aã]o)?\s*:\s*([\s\S]*)$/i,
      )

      if (condutaMatch) {
        condutas = condutaMatch[1].trim()
      } else if (!criterioMatch) {
        condutas = resto.trim()
      }

      if (criterioMatch) {
        criterios = criterioMatch[1].trim()
      }
    }

    resultado.push({
      semana: nomeSemana || `Fase ${resultado.length + 1}`,
      foco: normalizarParaTextoPuro(foco || 'Evolução e progressão clínica'),
      condutas: normalizarParaTextoPuro(condutas || corpo),
      criterios_evolucao: normalizarParaTextoPuro(criterios || 'Evolução favorável'),
    })
  }

  return resultado
}
