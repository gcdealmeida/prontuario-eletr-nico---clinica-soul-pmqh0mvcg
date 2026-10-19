/**
 * Utilitário de persistência de rascunho local (localStorage) para formulários clínicos.
 * Protege contra perdas acidentais de digitação (queda de rede, fechamento de aba, navegação acidental).
 */

export interface RascunhoLocalMetadata {
  updatedAt: string // ISO date
  pacienteId: string
  pacienteNome?: string
  especialidade?: string
  tipo: 'avaliacao' | 'evolucao'
  step?: number
  sectionIndex?: number
}

export interface RascunhoLocalItem<T = any> {
  meta: RascunhoLocalMetadata
  data: T
}

const STORAGE_PREFIX = 'soul_draft_v1'

export function getRascunhoStorageKey(
  tipo: 'avaliacao' | 'evolucao',
  pacienteId: string,
  extraKey = 'default',
): string {
  const safePac = pacienteId || 'anon'
  const safeExtra = extraKey || 'default'
  return `${STORAGE_PREFIX}:${tipo}:${safePac}:${safeExtra}`
}

export function salvarRascunhoLocal<T = any>(
  tipo: 'avaliacao' | 'evolucao',
  pacienteId: string,
  extraKey: string,
  data: T,
  metaExtra?: Partial<RascunhoLocalMetadata>,
): boolean {
  if (!pacienteId) return false
  try {
    const key = getRascunhoStorageKey(tipo, pacienteId, extraKey)
    const payload: RascunhoLocalItem<T> = {
      meta: {
        updatedAt: new Date().toISOString(),
        pacienteId,
        tipo,
        ...metaExtra,
      },
      data,
    }
    localStorage.setItem(key, JSON.stringify(payload))
    return true
  } catch (err) {
    console.warn('[RascunhoLocal] Falha ao salvar no localStorage:', err)
    return false
  }
}

export function carregarRascunhoLocal<T = any>(
  tipo: 'avaliacao' | 'evolucao',
  pacienteId: string,
  extraKey: string,
): RascunhoLocalItem<T> | null {
  if (!pacienteId) return null
  try {
    const key = getRascunhoStorageKey(tipo, pacienteId, extraKey)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RascunhoLocalItem<T>
    if (!parsed || !parsed.data) return null
    return parsed
  } catch (err) {
    console.warn('[RascunhoLocal] Falha ao ler do localStorage:', err)
    return null
  }
}

export function limparRascunhoLocal(
  tipo: 'avaliacao' | 'evolucao',
  pacienteId: string,
  extraKey: string,
): void {
  if (!pacienteId) return
  try {
    const key = getRascunhoStorageKey(tipo, pacienteId, extraKey)
    localStorage.removeItem(key)
  } catch (err) {
    console.warn('[RascunhoLocal] Falha ao limpar do localStorage:', err)
  }
}

export function listarRascunhosLocais(tipo?: 'avaliacao' | 'evolucao'): RascunhoLocalItem[] {
  const itens: RascunhoLocalItem[] = []
  try {
    const prefix = tipo ? `${STORAGE_PREFIX}:${tipo}:` : `${STORAGE_PREFIX}:`
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) {
        const raw = localStorage.getItem(k)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (parsed?.meta && parsed?.data) {
              itens.push(parsed)
            }
          } catch {
            /* intentionally ignored */
          }
        }
      }
    }
  } catch {
    /* intentionally ignored */
  }
  return itens.sort(
    (a, b) => new Date(b.meta.updatedAt).getTime() - new Date(a.meta.updatedAt).getTime(),
  )
}
