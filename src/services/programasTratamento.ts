import pb from '@/lib/pocketbase/client'

/**
 * Serviço da ferramenta "Montar Programa de Tratamento" (proposta comercial).
 * Acesso restrito ao admin — as regras da coleção no servidor já garantem isso.
 */

export interface ItemServicoProposta {
  nome: string
  quantidade: number
  valorUnitario: number
  tipoDesconto: 'nenhum' | 'percentual' | 'valor'
  desconto: number
}

/** Ajustes da foto da capa (posição/zoom/intensidade, como no gerador de propostas) */
export interface CapaFotoConfig {
  /** posição horizontal 0–100 */
  x: number
  /** posição vertical 0–100 */
  y: number
  /** zoom 1–3 */
  z: number
  /** intensidade/opacidade 15–100 */
  o: number
}

export const CAPA_CONFIG_PADRAO: CapaFotoConfig = { x: 50, y: 50, z: 1, o: 100 }

export interface ProgramaTratamentoPayload {
  paciente_id: string
  titulo: string
  data_inicio: string
  data_fim: string
  duracao_semanas: number
  itens: ItemServicoProposta[]
  desconto_geral_tipo: 'nenhum' | 'percentual' | 'valor'
  desconto_geral_valor: number
  valor_total: number
  condicoes: string
  status: 'rascunho' | 'finalizada'
  paciente_nome?: string
  /** Textos livres editáveis da proposta (nada de exemplo no documento final) */
  mes_referencia?: string
  texto_apresentacao?: string
  texto_introducao?: string
  condicoes_pagamento?: string
  observacoes?: string
  capa_config?: CapaFotoConfig
  /** Modelos reutilizáveis (mesma coleção, flag admin-only) */
  is_modelo?: boolean
  modelo_nome?: string
}

export interface ProgramaTratamentoRecord {
  id: string
  paciente_id: string
  titulo: string
  data_inicio: string
  data_fim: string
  duracao_semanas: number
  itens: ItemServicoProposta[]
  desconto_geral_tipo: string
  desconto_geral_valor: number
  valor_total: number
  condicoes: string
  status: 'rascunho' | 'finalizada'
  paciente_nome: string
  criado_por: string
  created: string
  updated: string
  capa_foto?: string
  capa_config?: CapaFotoConfig | null
  mes_referencia?: string
  texto_apresentacao?: string
  texto_introducao?: string
  condicoes_pagamento?: string
  observacoes?: string
  is_modelo?: boolean
  modelo_nome?: string
  expand?: {
    paciente_id?: {
      id: string
      nome: string
      cpf?: string
      data_nascimento?: string
      telefone?: string
      email?: string
    }
  }
}

const COLLECTION = 'programas_tratamento'

/** Subtotal de um item: quantidade × unitário − desconto do item */
export function calcularSubtotalItem(item: ItemServicoProposta): number {
  const bruto = (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0)
  const desc = Number(item.desconto) || 0
  const liquido =
    item.tipoDesconto === 'percentual'
      ? bruto - (bruto * desc) / 100
      : item.tipoDesconto === 'valor'
        ? bruto - desc
        : bruto
  return Math.max(0, Math.round(liquido * 100) / 100)
}

/** Total da proposta: soma dos subtotais − desconto geral (nunca negativo) */
export function calcularTotalPrograma(
  itens: ItemServicoProposta[],
  descontoTipo: 'nenhum' | 'percentual' | 'valor',
  descontoValor: number,
): number {
  const somaSubtotais = itens.reduce((acc, it) => acc + calcularSubtotalItem(it), 0)
  const desc = Number(descontoValor) || 0
  const total =
    descontoTipo === 'percentual'
      ? somaSubtotais - (somaSubtotais * desc) / 100
      : descontoTipo === 'valor'
        ? somaSubtotais - desc
        : somaSubtotais
  return Math.max(0, Math.round(total * 100) / 100)
}

/** Formata valor monetário em R$ no padrão brasileiro (sem símbolo) */
export function formatarMoedaBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

export async function listarProgramasTratamento(filter?: string) {
  return await pb.collection(COLLECTION).getFullList<ProgramaTratamentoRecord>({
    filter: filter || '',
    sort: '-created',
    expand: 'paciente_id',
  })
}

export async function listarProgramasTratamentoPorPaciente(pacienteId: string) {
  return await pb.collection(COLLECTION).getFullList<ProgramaTratamentoRecord>({
    filter: `paciente_id = "${pacienteId}"`,
    sort: '-created',
    expand: 'paciente_id',
  })
}

/** Modelos reutilizáveis salvos (is_modelo = true), mais recentes primeiro */
export async function listarModelosTratamento(): Promise<ProgramaTratamentoRecord[]> {
  return await pb.collection(COLLECTION).getFullList<ProgramaTratamentoRecord>({
    filter: 'is_modelo = true',
    sort: '-updated',
  })
}

export async function getProgramaTratamento(id: string) {
  return await pb.collection(COLLECTION).getOne<ProgramaTratamentoRecord>(id, {
    expand: 'paciente_id',
  })
}

/** Lê um registro mesmo sem expandir o paciente (usado ao montar modelos) */
export async function getProgramaTratamentoBruto(id: string) {
  return await pb.collection(COLLECTION).getOne<ProgramaTratamentoRecord>(id)
}

/**
 * Serviços já utilizados na clínica (sugestões rápidas): extrai nomes distintos
 * dos serviços registrados nas presenças + nomes dos itens de propostas anteriores.
 */
export async function listarServicosConhecidos(): Promise<string[]> {
  const nomes = new Set<string>()
  try {
    const presencas = await pb
      .collection('presencas')
      .getFullList<{ area_servico?: string; detalhe_servico?: string }>({
        filter: '',
        fields: 'area_servico,detalhe_servico',
        sort: '-created',
      })
    presencas.forEach((p) => {
      if (p.area_servico) nomes.add(p.area_servico.trim())
      if (p.detalhe_servico) nomes.add(p.detalhe_servico.trim())
    })
  } catch {
    // Sem presenças acessíveis: segue apenas com propostas anteriores
  }
  try {
    const propostas = await pb.collection(COLLECTION).getFullList<ProgramaTratamentoRecord>({
      fields: 'itens',
      sort: '-created',
    })
    propostas.forEach((p) => {
      if (Array.isArray(p.itens)) {
        p.itens.forEach((it) => {
          if (it?.nome) nomes.add(String(it.nome).trim())
        })
      }
    })
  } catch {
    // ignora
  }
  return Array.from(nomes)
    .filter((n) => n.length > 1 && n.length <= 120)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

/** Normaliza a config da capa vinda do banco (json pode chegar como string) */
export function parseCapaConfig(valor: unknown): CapaFotoConfig {
  let obj: Partial<CapaFotoConfig> | null = null
  if (typeof valor === 'string' && valor.trim()) {
    try {
      obj = JSON.parse(valor)
    } catch {
      obj = null
    }
  } else if (valor && typeof valor === 'object') {
    obj = valor as Partial<CapaFotoConfig>
  }
  const num = (v: unknown, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    x: num(obj?.x, 50),
    y: num(obj?.y, 50),
    z: num(obj?.z, 1),
    o: obj?.o == null ? 100 : num(obj.o, 100),
  }
}

/** URL da foto da capa: arquivo da coleção, URL blob/data (prévia local) ou http */
export function getCapaFotoUrl(registro: ProgramaTratamentoRecord): string {
  const foto = registro?.capa_foto || ''
  if (!foto) return ''
  if (/^(blob:|data:|https?:)/.test(foto)) return foto
  if (!registro.id) return ''
  return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${COLLECTION}/${registro.id}/${foto}`
}

/**
 * Cria/atualiza o registro aceitando FormData (quando há foto nova para enviar).
 * Com FormData, campos json/array precisam ir como string.
 */
export async function createProgramaTratamento(
  data: ProgramaTratamentoPayload,
  capaFotoArquivo?: File | null,
) {
  const userId = pb.authStore.record?.id
  const body: Record<string, unknown> = {
    ...data,
    capa_config: data.capa_config ? JSON.stringify(data.capa_config) : '',
    criado_por: userId,
  }
  if (capaFotoArquivo) {
    const fd = new FormData()
    Object.entries(body).forEach(([k, v]) => {
      if (v === undefined) return
      fd.append(k, v == null ? '' : (v as string))
    })
    fd.append('capa_foto', capaFotoArquivo)
    return await pb.collection(COLLECTION).create<ProgramaTratamentoRecord>(fd)
  }
  return await pb.collection(COLLECTION).create<ProgramaTratamentoRecord>(body)
}

export async function updateProgramaTratamento(
  id: string,
  data: Partial<ProgramaTratamentoPayload>,
  capaFotoArquivo?: File | null,
  removerCapaFoto = false,
) {
  const body: Record<string, unknown> = {
    ...data,
    ...(data.capa_config !== undefined
      ? { capa_config: data.capa_config ? JSON.stringify(data.capa_config) : '' }
      : {}),
  }
  if (removerCapaFoto) body['capa_foto-'] = ''
  if (capaFotoArquivo || removerCapaFoto) {
    const fd = new FormData()
    Object.entries(body).forEach(([k, v]) => {
      if (v === undefined) return
      fd.append(k, v == null ? '' : (v as string))
    })
    if (capaFotoArquivo) fd.append('capa_foto', capaFotoArquivo)
    return await pb.collection(COLLECTION).update<ProgramaTratamentoRecord>(id, fd)
  }
  return await pb.collection(COLLECTION).update<ProgramaTratamentoRecord>(id, body)
}

export async function deleteProgramaTratamento(id: string) {
  return await pb.collection(COLLECTION).delete(id)
}

/** Nome do arquivo de exportação: "Proposta de Tratamento SOUL - {paciente} - {mes}.pdf" */
export function nomeArquivoProposta(
  pacienteNome: string,
  mesReferencia: string,
  extensao = 'pdf',
): string {
  const base = (
    'Proposta de Tratamento SOUL - ' +
    (pacienteNome || 'Cliente').trim() +
    ' - ' +
    (mesReferencia || '').trim()
  )
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+-\s*$/, '')
  return `${base}.${extensao}`
}

/**
 * Exemplo inicial (SOUL REHAB) — usado APENAS como ponto de partida ao
 * escolher "Começar do exemplo" ou dentro de um MODELO; nunca vai para o
 * documento final sem o admin ter preenchido/confirmado.
 */
export function exemploItensRehab(): ItemServicoProposta[] {
  return [
    {
      nome: 'Avaliação Fisioterapêutica Completa',
      quantidade: 1,
      valorUnitario: 350,
      tipoDesconto: 'nenhum',
      desconto: 0,
    },
    {
      nome: 'Sessão de Reabilitação Funcional',
      quantidade: 12,
      valorUnitario: 180,
      tipoDesconto: 'nenhum',
      desconto: 0,
    },
    {
      nome: 'Liberação Miofascial',
      quantidade: 4,
      valorUnitario: 150,
      tipoDesconto: 'nenhum',
      desconto: 0,
    },
    {
      nome: 'Reavaliação Clínica',
      quantidade: 1,
      valorUnitario: 180,
      tipoDesconto: 'nenhum',
      desconto: 0,
    },
  ]
}
