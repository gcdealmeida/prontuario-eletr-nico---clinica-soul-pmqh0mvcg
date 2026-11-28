// Dicionário de conteúdo curado dos exercícios (Biblioteca de Exercícios).
// Chaves = nomes EXATOS dos registros da coleção "exercicios" (seed da migration 0023).

import type { ConteudoExercicio } from './tipos'
import { SUPERIORES } from './superiores'
import { PEITO } from './peito'
import { OMBRO } from './ombro'
import { COSTAS } from './costas'
import { BRACOS } from './bracos'
import { PERNAS } from './pernas'
import { CORE } from './core'

export type { ConteudoExercicio } from './tipos'
export { normalizarNome } from './tipos'

const DICIONARIO: Record<string, ConteudoExercicio> = {
  ...SUPERIORES,
  ...PEITO,
  ...OMBRO,
  ...COSTAS,
  ...BRACOS,
  ...PERNAS,
  ...CORE,
}

/** Busca por nome normalizado (sem acentos, minúsculo). */
export function buscarConteudo(nome: string): ConteudoExercicio | undefined {
  return DICIONARIO[normalizarNome(nome)]
}

export function temConteudoCurado(nome: string): boolean {
  return normalizarNome(nome) in DICIONARIO
}

export function totalConteudoCurado(): number {
  return Object.keys(DICIONARIO).length
}
