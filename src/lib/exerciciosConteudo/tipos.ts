/** Conteúdo curado de um exercício da Biblioteca. */
export interface ConteudoExercicio {
  descricao: string
  errosComuns: string[]
  musculos: string[]
  /** URL de foto/ilustração da execução (CDN de imagens do app). */
  foto?: string
  /** ID de vídeo do YouTube ou URL completa de vídeo confiável. */
  videoUrl?: string
  /** Texto alternativo da foto/ilustração. */
  fotoAlt?: string
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
