/** Conteúdo curado de um exercício da Biblioteca. */
export interface ConteudoExercicio {
  descricao: string
  errosComuns: string[]
  musculos: string[]
}

/** Remove acentos, minúsculas, colapsa espaços (chave do dicionário). */
export function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}
