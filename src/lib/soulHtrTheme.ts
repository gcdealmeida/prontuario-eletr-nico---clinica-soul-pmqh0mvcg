/* Paleta SOUL Health Tracker (app do cliente) — bege claro + marrons + dourado. */

export const SOUL_HTR = {
  bg: '#F5EFE6',
  bgAlt: '#EFE6D8',
  card: '#FFFFFF',
  borda: '#E2D4BF',
  marromEscuro: '#5C3A21',
  marrom: '#7B4B2A',
  marromSuave: '#9A6B45',
  dourado: '#C9A063',
  douradoClaro: '#E7CFA0',
  cobre: '#B0714F',
  textoSuave: '#8A6F58',
  textoFraco: '#A98D74',
} as const

export const NOME_APP_CLIENTE = 'SOUL Health Tracker'
export const NOME_APP_CLIENTE_CURTO = 'SOUL HTR'

/** Tipos de registro aceitos no modal do app do cliente — espelha SaudeRegistroTipo. */
export type TipoModalRegistro =
  | 'atividade_fisica'
  | 'sono'
  | 'bebida'
  | 'refeicao'
  | 'medicacao'
  | 'emocao'
  | 'sintoma'
  | 'exame'
  | 'alimento'

export interface PilulaAcao {
  chave: string
  rotulo: string
  tipo: TipoModalRegistro
  icone: string
}

/** Pílulas de ação rápida (modelo "Add Entry / Meds / Water…" do exemplo). */
export const PILULAS_RAPIDAS: PilulaAcao[] = [
  { chave: 'novo', rotulo: 'Novo registro', tipo: 'emocao', icone: 'plus' },
  { chave: 'meds', rotulo: 'Meds', tipo: 'medicacao', icone: 'pill' },
  { chave: 'agua', rotulo: 'Água', tipo: 'bebida', icone: 'droplet' },
  { chave: 'cafe', rotulo: 'Cafeína', tipo: 'bebida', icone: 'coffee' },
  { chave: 'sintomas', rotulo: 'Sintomas', tipo: 'sintoma', icone: 'activity' },
  { chave: 'alimentos', rotulo: 'Alimentos', tipo: 'refeicao', icone: 'utensils' },
  { chave: 'energia', rotulo: 'Energia', tipo: 'atividade_fisica', icone: 'zap' },
  { chave: 'humor', rotulo: 'Humor', tipo: 'emocao', icone: 'smile' },
]

/** Ícone lucide pela chave da pílula. */
export function iconePilula(chave: string): string {
  return PILULAS_RAPIDAS.find((p) => p.chave === chave)?.icone || 'plus'
}

/* ----------------------------- métricas de hoje --------------------------- */

export interface CartaoMetrica {
  titulo: string
  valor: string
  unidade: string
  quando: string
  icone: string
  aoRegistrar: () => void
}

/* --------------------------- medicações (tabela) --------------------------- */

export interface MedSemana {
  nome: string
  dose: string
  horario: string
  /** índice 0 = segunda … 6 = domingo */
  dias: boolean[]
  ultimoRegistroId?: string
}

const DIAS_ATE_SEGUNDA = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00`).getDay() // 0=dom
  return (d + 6) % 7
}

export function ymdComOffset(ymd: string, offset: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/** Agrupa registros de medicação por nome numa tabela semanal (seg–dom). */
export function montarMedicacoesSemana(
  registros: {
    id: string
    tipo: string
    data?: string
    dados_json?: Record<string, unknown> | null
  }[],
  diaBase: string,
): MedSemana[] {
  const inicio = ymdComOffset(diaBase, -DIAS_ATE_SEGUNDA(diaBase))
  const fim = ymdComOffset(inicio, 6)
  const map = new Map<string, MedSemana>()
  for (const r of registros) {
    if (r.tipo !== 'medicacao') continue
    const d = (r.dados_json || {}) as Record<string, unknown>
    const nome = String(d.nome || 'Medicação')
    const ymd = (r.data || '').slice(0, 10)
    if (ymd < inicio || ymd > fim) continue
    const col = Math.round(
      (new Date(`${ymd}T12:00:00`).getTime() - new Date(`${inicio}T12:00:00`).getTime()) / 86400000,
    )
    const ingerida = d.ingerida !== false
    const atual = map.get(nome)
    if (!atual) {
      const dias = [false, false, false, false, false, false, false]
      if (col >= 0 && col <= 6 && ingerida) dias[col] = true
      map.set(nome, {
        nome,
        dose: String(d.dose || ''),
        horario: String(d.horario || ''),
        dias,
        ultimoRegistroId: r.id,
      })
    } else if (col >= 0 && col <= 6 && ingerida) {
      atual.dias[col] = true
    }
  }
  return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome))
}
