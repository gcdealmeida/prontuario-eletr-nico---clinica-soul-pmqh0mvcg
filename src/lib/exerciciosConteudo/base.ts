import type { ConteudoExercicio } from './tipos'

/** Entrada curada no formato compacto: nome + conteúdo. */
export type EntradaCurada = ConteudoExercicio & { nome: string }

/** Lista de entradas curadas no formato compacto. */
export type EntradasConteudo = EntradaCurada[]

/**
 * Helper compacto do dicionário de exercícios:
 * e(nome, 'passo | passo | passo', 'erro | erro', 'músculos separados por vírgula')
 */
export function e(nome: string, passos: string, erros: string, musculos: string): EntradaCurada {
  return {
    nome,
    descricao: passos
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n'),
    errosComuns: erros
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean),
    musculos: musculos
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }
}

export type { ConteudoExercicio }
