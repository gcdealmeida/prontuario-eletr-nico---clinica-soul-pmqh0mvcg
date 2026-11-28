// Dicionário de conteúdo curado dos exercícios (Biblioteca de Exercícios).
// Chaves = nomes dos registros da coleção "exercicios" (seed da migration 0023)
// e variações próximas. A busca é tolerante: nome exato normalizado → alias
// conhecido → correspondência por tokens (sem acentos, ignora artigos/
// preposições) → vídeo do mapa de canais (conteúdo mínimo com foto/vídeo).

import type { ConteudoExercicio } from './tipos'
import { normalizarNome } from './tipos'
import { buscarVideo, MAPA_VIDEOS } from './videos'
import { ALIAS_NOMES } from './aliases'
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

// ── Correspondência tolerante por tokens ────────────────────────────────────
// Palavras de ligação não ajudam a distinguir exercícios ("com", "na", "de"...)
// e as coleções variam entre "frontal"/"na frente", "máquina"/"aparelho" etc.
const STOPWORDS = new Set([
  'com',
  'na',
  'no',
  'nas',
  'nos',
  'do',
  'da',
  'dos',
  'das',
  'de',
  'em',
  'para',
  'por',
  'ou',
  'ao',
  'aos',
  'pelo',
  'pela',
  'um',
  'uma',
  'the',
  'and',
])

// Variações de vocabulário que significam a mesma coisa.
const SINONIMOS: Record<string, string> = {
  frontal: 'frente',
  machine: 'maquina',
  aparelho: 'maquina',
  multipower: 'smith',
  elastico: 'band',
  miniband: 'band',
  superband: 'band',
  faixa: 'band',
  halteres: 'halter',
  anilha: 'peso',
  kettlebell: 'peso',
  avanco: 'afundo',
  passada: 'afundo',
  lunge: 'afundo',
  caminhando: 'andando',
}

function tokensDe(nome: string): string[] {
  return normalizarNome(nome)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => SINONIMOS[t] ?? t)
}

function conjuntoDeTokens(tokens: string[]): Set<string> {
  return new Set(tokens)
}

interface Pontuacao {
  cobertura: number // fração dos tokens da consulta presentes no alvo
  comum: number // quantidade de tokens em comum
}

function pontuar(consulta: Set<string>, alvo: Set<string>): Pontuacao {
  let comum = 0
  for (const t of consulta) if (alvo.has(t)) comum++
  return { cobertura: consulta.size > 0 ? comum / consulta.size : 0, comum }
}

interface EntradaTokenizada {
  chave: string
  tokens: Set<string>
}

const ENTRADAS_DICIONARIO: EntradaTokenizada[] = Object.keys(INDICE_NORMALIZADO).map((chave) => ({
  chave,
  tokens: conjuntoDeTokens(tokensDe(chave)),
}))

const ENTRADAS_VIDEOS: EntradaTokenizada[] = Object.keys(MAPA_VIDEOS).map((chave) => ({
  chave,
  tokens: conjuntoDeTokens(tokensDe(chave)),
}))

const LIMIAR_COBERTURA = 0.7
const MINIMO_TOKENS_COMUNS = 2

/** Melhor chave por sobreposição de tokens (null se nenhuma passar o limiar). */
function melhorChave(
  consulta: string[],
  entradas: EntradaTokenizada[],
): { chave: string; cobertura: number } | null {
  const consultaTokens = conjuntoDeTokens(consulta)
  if (consultaTokens.size === 0) return null
  let melhor: { chave: string; cobertura: number; comum: number } | null = null
  for (const entrada of entradas) {
    const { cobertura, comum } = pontuar(consultaTokens, entrada.tokens)
    if (comum < MINIMO_TOKENS_COMUNS) continue
    if (
      !melhor ||
      cobertura > melhor.cobertura ||
      (cobertura === melhor.cobertura && comum > melhor.comum)
    ) {
      melhor = { chave: entrada.chave, cobertura, comum }
    }
  }
  if (!melhor || melhor.cobertura < LIMIAR_COBERTURA) return null
  return { chave: melhor.chave, cobertura: melhor.cobertura }
}

/** Resolve o nome via ALIAS_NOMES (até 3 saltos para encadear apelidos). */
function resolverAlias(nomeNormalizado: string): string | null {
  let atual = nomeNormalizado
  for (let i = 0; i < 3 && ALIAS_NOMES[atual]; i++) {
    atual = ALIAS_NOMES[atual]
  }
  return atual !== nomeNormalizado ? atual : null
}

function conteudoSomenteVideo(nome: string): ConteudoExercicio | undefined {
  const video = buscarVideo(nome)
  if (!video) return undefined
  return {
    descricao: '',
    errosComuns: [],
    musculos: [],
    videoUrl: `https://www.youtube-nocookie.com/watch?v=${video.videoId}`,
    foto: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    fotoAlt: `Foto de execução do exercício ${nome}`,
  }
}

const CACHE_BUSCA = new Map<string, ConteudoExercicio | undefined>()

/**
 * Busca tolerante: nome exato → alias → tokens → vídeo. Retorna undefined
 * apenas quando o exercício realmente não tem nada no acervo curado.
 */
export function buscarConteudo(nome: string): ConteudoExercicio | undefined {
  if (!nome) return undefined
  const n = normalizarNome(nome)
  if (CACHE_BUSCA.has(n)) return CACHE_BUSCA.get(n)

  let resultado: ConteudoExercicio | undefined = INDICE_NORMALIZADO[n]

  // 1. Alias curado (ex.: "Supino Reto" → "Supino reto com barra").
  if (!resultado) {
    const alvo = resolverAlias(n)
    if (alvo) {
      resultado = INDICE_NORMALIZADO[alvo]
      if (!resultado) resultado = conteudoSomenteVideo(alvo)
    }
  }

  // 2. Correspondência por tokens (acentos, ordem e vocabulário variam).
  if (!resultado) {
    const tokens = tokensDe(n)
    const palpite = melhorChave(tokens, ENTRADAS_DICIONARIO)
    if (palpite) {
      resultado = INDICE_NORMALIZADO[palpite.chave]
    } else {
      // 3. Sem entrada curada: tenta o mapa de vídeos (foto + vídeo).
      const palpiteVideo = melhorChave(tokens, ENTRADAS_VIDEOS)
      if (palpiteVideo) {
        resultado = conteudoSomenteVideo(palpiteVideo.chave)
      } else {
        resultado = conteudoSomenteVideo(n)
      }
    }
  }

  CACHE_BUSCA.set(n, resultado)
  return resultado
}

export function temConteudoCurado(nome: string): boolean {
  return !!buscarConteudo(nome)
}

export function totalConteudoCurado(): number {
  return Object.keys(DICIONARIO).length
}
