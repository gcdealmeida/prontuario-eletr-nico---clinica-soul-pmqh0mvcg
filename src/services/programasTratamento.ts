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

/** Config de recorte da foto de um plano (página 2) — mesma semântica da capa */
export type PlanoFotoConfig = CapaFotoConfig

/** Item da lista de um plano (página 2), com ícone da arte original */
export interface ItemPlano {
  icon: string
  texto: string
}

/** Opção de parcelamento: número de vezes (1 = à vista) */
export interface ParcelaPlano {
  n: number
}

/** Um plano da página 2 (Basic / Otimizado / Personalizado) */
export interface PlanoProposta {
  nome: string
  tagline: string
  foto: string
  foto_config: PlanoFotoConfig
  itens: ItemPlano[]
  duracao_semanas: number
  atendimentos: number
  /** Valor total em R$ — uso interno, não imprime na proposta */
  total: number
  parcelas: ParcelaPlano[]
}

export const PLANO_FOTO_CONFIG_PADRAO: PlanoFotoConfig = { x: 50, y: 50, z: 1, o: 100 }

const NOMES_PLANOS_PADRAO = ['Basic', 'Otimizado', 'Personalizado'] as const

/** Três planos vazios (Basic / Otimizado / Personalizado), prontos para edição */
export function planosPadrao(): PlanoProposta[] {
  return NOMES_PLANOS_PADRAO.map((nome) => ({
    nome,
    tagline: '',
    foto: '',
    foto_config: { ...PLANO_FOTO_CONFIG_PADRAO },
    itens: [{ icon: 'check', texto: '' }],
    duracao_semanas: 4,
    atendimentos: 8,
    total: 0,
    parcelas: [{ n: 1 }, { n: 3 }],
  }))
}

/** Normaliza o JSON `planos` vindo do banco (pode chegar como string) */
export function parsePlanos(valor: unknown): PlanoProposta[] {
  let bruto: unknown = valor
  if (typeof valor === 'string' && valor.trim()) {
    try {
      bruto = JSON.parse(valor)
    } catch {
      bruto = null
    }
  }
  if (!Array.isArray(bruto)) return planosPadrao()
  const base = planosPadrao()
  const cfg = (v: unknown): PlanoFotoConfig => {
    const o = (v && typeof v === 'object' ? v : {}) as Partial<PlanoFotoConfig>
    const num = (x: unknown, fb: number) => (Number.isFinite(Number(x)) ? Number(x) : fb)
    return {
      x: num(o.x, 50),
      y: num(o.y, 50),
      z: num(o.z, 1),
      o: o.o == null ? 100 : num(o.o, 100),
    }
  }
  return NOMES_PLANOS_PADRAO.map((nome, i) => {
    const raw = (bruto as unknown[]).find(
      (p) => p && typeof p === 'object' && (p as PlanoProposta).nome === nome,
    ) as Partial<PlanoProposta> | undefined
    const fallback = (bruto as unknown[])[i] as Partial<PlanoProposta> | undefined
    const p = raw || fallback || {}
    return {
      nome: String(p.nome || nome),
      tagline: String(p.tagline || ''),
      foto: String(p.foto || ''),
      foto_config: cfg(p.foto_config),
      itens:
        Array.isArray(p.itens) && p.itens.length
          ? p.itens
              .map((it) => ({
                icon: String((it as ItemPlano)?.icon || 'check'),
                texto: String((it as ItemPlano)?.texto || ''),
              }))
              .filter((it) => it.texto.trim())
          : [],
      duracao_semanas: Number(p.duracao_semanas) || 0,
      atendimentos: Number(p.atendimentos) || 0,
      total: Number(p.total) || 0,
      parcelas:
        Array.isArray(p.parcelas) && p.parcelas.length
          ? p.parcelas
              .map((x) => ({ n: Math.max(1, Math.round(Number((x as ParcelaPlano)?.n) || 1)) }))
              .slice(0, 3)
          : [{ n: 1 }, { n: 3 }],
    }
  })
}

/** URL da foto de um plano: data/blob/http (prévia local) ou arquivo da coleção */
export function getPlanoFotoUrl(
  registro: Pick<ProgramaTratamentoRecord, 'id'> | null,
  foto: string,
): string {
  if (!foto) return ''
  if (/^(blob:|data:|https?:)/.test(foto)) return foto
  if (!registro?.id) return ''
  return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${COLLECTION}/${registro.id}/${foto}`
}

/** URL da logo custom: data/blob/http ou arquivo da coleção */
export function getLogoCustomUrl(registro: Pick<ProgramaTratamentoRecord, 'id'> | null): string {
  const logo = (registro as ProgramaTratamentoRecord | null)?.logo_custom || ''
  if (!logo) return ''
  if (/^(blob:|data:|https?:)/.test(logo)) return logo
  if (!registro?.id) return ''
  return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${COLLECTION}/${registro.id}/${logo}`
}

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
  /** Arte original do gerador SOUL: planos da pág. 2 e frase da capa */
  frase_paciente?: string
  planos?: PlanoProposta[]
  logo_custom?: string
  props_cab?: string
  props_pagina?: string
  props_rodape?: string
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
  frase_paciente?: string
  planos?: PlanoProposta[] | string | null
  logo_custom?: string
  props_cab?: string
  props_pagina?: string
  props_rodape?: string
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
 * Corpo serializável: arrays/objetos (itens, capa_config) vão como string JSON —
 * obrigatório com FormData, que senão serializa o array como "[object Object]"
 * e perde os itens; com objeto puro, o SDK do PocketBase já serializa JSON.
 */
function prepararBody(data: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined) return
    if (Array.isArray(v) || (v && typeof v === 'object')) {
      body[k] = JSON.stringify(v)
    } else {
      body[k] = v
    }
  })
  return body
}

export async function createProgramaTratamento(
  data: ProgramaTratamentoPayload,
  capaFotoArquivo?: File | null,
  logoArquivo?: File | null,
) {
  const userId = pb.authStore.record?.id
  const body = prepararBody({
    ...data,
    capa_config: data.capa_config ? JSON.stringify(data.capa_config) : '',
    criado_por: userId,
  })
  const arquivos: { campo: string; file: File }[] = []
  if (capaFotoArquivo) arquivos.push({ campo: 'capa_foto', file: capaFotoArquivo })
  if (logoArquivo) arquivos.push({ campo: 'logo_custom', file: logoArquivo })
  if (arquivos.length) {
    const fd = new FormData()
    Object.entries(body).forEach(([k, v]) => {
      if (v == null) return
      fd.append(k, String(v))
    })
    arquivos.forEach(({ campo, file }) => fd.append(campo, file))
    return await pb.collection(COLLECTION).create<ProgramaTratamentoRecord>(fd)
  }
  return await pb.collection(COLLECTION).create<ProgramaTratamentoRecord>(body)
}

export async function updateProgramaTratamento(
  id: string,
  data: Partial<ProgramaTratamentoPayload>,
  capaFotoArquivo?: File | null,
  removerCapaFoto = false,
  logoArquivo?: File | null,
  removerLogo = false,
) {
  const body: Record<string, unknown> = {
    ...data,
    ...(data.capa_config !== undefined
      ? { capa_config: data.capa_config ? JSON.stringify(data.capa_config) : '' }
      : {}),
  }
  if (removerCapaFoto) body['capa_foto-'] = ''
  if (removerLogo) body['logo_custom-'] = ''
  const preparado = prepararBody(body)
  if (capaFotoArquivo || removerCapaFoto || logoArquivo || removerLogo) {
    const fd = new FormData()
    Object.entries(preparado).forEach(([k, v]) => {
      if (v == null) return
      fd.append(k, String(v))
    })
    if (capaFotoArquivo) fd.append('capa_foto', capaFotoArquivo)
    if (logoArquivo) fd.append('logo_custom', logoArquivo)
    return await pb.collection(COLLECTION).update<ProgramaTratamentoRecord>(id, fd)
  }
  return await pb.collection(COLLECTION).update<ProgramaTratamentoRecord>(id, preparado)
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
