import pb from '@/lib/pocketbase/client'
import { normalizarNome } from '@/lib/exerciciosConteudo/tipos'

/** Conteúdo editado manualmente de um exercício (coleção conteudo_exercicios). */
export interface ConteudoEditadoRecord {
  id: string
  exercicio: string
  exercicio_normalizado: string
  foto_url?: string
  video_url?: string
  video_id?: string
  como_executar?: string
  /** Erros comuns, um por linha (formato do formulário de edição). */
  erros_comuns?: string
  /** Músculos trabalhados, separados por vírgula. */
  musculos?: string
  atualizado_por?: string
  created: string
  updated: string
}

/** Dados do formulário de edição, prontos para gravar. */
export interface ConteudoEditadoPayload {
  exercicio: string
  foto_url?: string
  video_url?: string
  video_id?: string
  como_executar?: string
  erros_comuns?: string
  musculos?: string
  atualizado_por?: string
}

/** Busca o conteúdo editado de um exercício pelo nome (qualquer variação). */
export async function getConteudoEditado(
  nomeExercicio: string,
): Promise<ConteudoEditadoRecord | null> {
  const norm = normalizarNome(nomeExercicio)
  if (!norm) return null
  const lista = await pb.collection('conteudo_exercicios').getFullList<ConteudoEditadoRecord>({
    filter: `exercicio_normalizado = "${norm.replace(/"/g, '\\"')}"`,
    sort: '-updated',
  })
  return lista[0] ?? null
}

/** Cria ou atualiza o conteúdo editado de um exercício (1 registro por nome). */
export async function salvarConteudoEditado(
  payload: ConteudoEditadoPayload,
): Promise<ConteudoEditadoRecord> {
  const existente = await getConteudoEditado(payload.exercicio)
  if (existente) {
    return await pb
      .collection('conteudo_exercicios')
      .update<ConteudoEditadoRecord>(existente.id, payload)
  }
  return await pb.collection('conteudo_exercicios').create<ConteudoEditadoRecord>({
    ...payload,
    exercicio_normalizado: normalizarNome(payload.exercicio),
  })
}

/** Remove a edição manual — o exercício volta ao conteúdo curado/padrão. */
export async function removerConteudoEditado(id: string) {
  return await pb.collection('conteudo_exercicios').delete(id)
}

/** Carrega as edições da sessão de uma vez (para selos na listagem). */
export async function getConteudosEditados(
  nomes: string[],
): Promise<Map<string, ConteudoEditadoRecord>> {
  const mapa = new Map<string, ConteudoEditadoRecord>()
  if (nomes.length === 0) return mapa
  const normalizados = Array.from(new Set(nomes.map((n) => normalizarNome(n)).filter(Boolean))).map(
    (n) => `"${n.replace(/"/g, '\\"')}"`,
  )
  if (normalizados.length === 0) return mapa
  // PocketBase aceita até ~30 valores por filtro in; fatia para listas grandes.
  const FATIA = 30
  for (let i = 0; i < normalizados.length; i += FATIA) {
    const lote = normalizados.slice(i, i + FATIA)
    const lista = await pb.collection('conteudo_exercicios').getFullList<ConteudoEditadoRecord>({
      filter: `exercicio_normalizado ?= [${lote.join(',')}]`,
      sort: '-updated',
    })
    for (const reg of lista) {
      if (!mapa.has(reg.exercicio_normalizado)) mapa.set(reg.exercicio_normalizado, reg)
    }
  }
  return mapa
}
