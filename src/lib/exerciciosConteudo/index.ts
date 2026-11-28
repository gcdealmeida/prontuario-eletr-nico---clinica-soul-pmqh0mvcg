// Dicionário de conteúdo curado dos exercícios (Biblioteca de Exercícios).
// Chaves = nomes EXATOS dos registros da coleção "exercicios" (seed da migration 0023).

import type { ConteudoExercicio } from './tipos'
import { normalizarNome } from './tipos'
import { buscarVideo } from './videos'
import { SUPERIORES } from './superiores'
import { PEITO } from './peito'
import { OMBRO } from './ombro'
import { COSTAS } from './costas'
import { BRACOS } from './bracos'
import { PERNAS } from './pernas'
import { CORE } from './core'
import { INFERIORES } from './inferiores'

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

// INFERIORES chega como EntradaCurada[] ({nome, ...conteúdo}): sobrescreve duplicatas
// com a versão "Record" (mais recente) — mesmo nome em PERNAS e INFERIORES fica com o
// conteúdo curado em formato Record.
for (const entrada of INFERIORES) {
  DICIONARIO[entrada.nome] = {
    descricao: entrada.descricao,
    errosComuns: entrada.errosComuns,
    musculos: entrada.musculos,
  }
}

// Overlay de vídeos/fotos: exercícios com vídeo no mapa de canais de
// referência ganham videoUrl (watch youtube-nocookie) e foto (thumbnail
// hqdefault do próprio vídeo) sem alterar os arquivos de grupo um a um.
// Explicação/erros/músculos já curados são preservados.
for (const [nome, conteudo] of Object.entries(DICIONARIO)) {
  const video = buscarVideo(nome)
  if (video && !conteudo.videoUrl) {
    conteudo.videoUrl = `https://www.youtube-nocookie.com/watch?v=${video.videoId}`
    if (!conteudo.foto) {
      conteudo.foto = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
      if (!conteudo.fotoAlt) {
        conteudo.fotoAlt = `Foto de execução do exercício ${nome}`
      }
    }
  }
}

const INDICE_NORMALIZADO: Record<string, ConteudoExercicio> = {}
for (const [nome, conteudo] of Object.entries(DICIONARIO)) {
  INDICE_NORMALIZADO[normalizarNome(nome)] = conteudo
}

/** Busca por nome normalizado (sem acentos, minúsculo, espaços colapsados). */
export function buscarConteudo(nome: string): ConteudoExercicio | undefined {
  if (!nome) return undefined
  return INDICE_NORMALIZADO[normalizarNome(nome)]
}

export function temConteudoCurado(nome: string): boolean {
  return !!nome && normalizarNome(nome) in INDICE_NORMALIZADO
}

export function totalConteudoCurado(): number {
  return Object.keys(DICIONARIO).length
}
