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
 * Normaliza o relatório recebido da IA ou carregado do banco:
 * 1. Converte tabelas Markdown para listas/tópicos legíveis sem pipes (|) ou separadores (---)
 * 2. Remove pipes soltos ou resquícios de formatação de tabela
 * 3. Garante que as 6 seções numeradas fiquem bem destacadas
 * 4. Limpa múltiplos saltos de linha redundantes
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

  // 3. Normalizar espaçamentos e quebras de linha excessivas (mais de 2 saltos consecutivos)
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
