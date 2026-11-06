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

export async function getProgramaTratamento(id: string) {
  return await pb.collection(COLLECTION).getOne<ProgramaTratamentoRecord>(id, {
    expand: 'paciente_id',
  })
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

export async function createProgramaTratamento(data: ProgramaTratamentoPayload) {
  const userId = pb.authStore.record?.id
  return await pb.collection(COLLECTION).create<ProgramaTratamentoRecord>({
    ...data,
    criado_por: userId,
  })
}

export async function updateProgramaTratamento(
  id: string,
  data: Partial<ProgramaTratamentoPayload>,
) {
  return await pb.collection(COLLECTION).update<ProgramaTratamentoRecord>(id, data)
}

export async function deleteProgramaTratamento(id: string) {
  return await pb.collection(COLLECTION).delete(id)
}
