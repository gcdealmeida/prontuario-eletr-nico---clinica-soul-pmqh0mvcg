import pb from '@/lib/pocketbase/client'

/* ------------------------------------------------------------------ */
/* Tipos — coleções da migration 0066/0067 (Saúde & Bem-Estar)         */
/* ------------------------------------------------------------------ */

export type SaudeRegistroTipo =
  | 'atividade_fisica'
  | 'sono'
  | 'bebida'
  | 'alimento'
  | 'exame'
  | 'dieta'
  | 'sintoma'
  | 'medicacao'
  | 'refeicao'
  | 'emocao'
  | 'treino'
  | 'reabilitacao'

export const TIPOS_REGISTRO: { value: SaudeRegistroTipo; label: string }[] = [
  { value: 'atividade_fisica', label: 'Atividade Física' },
  { value: 'sono', label: 'Sono' },
  { value: 'bebida', label: 'Bebidas' },
  { value: 'alimento', label: 'Alimentos' },
  { value: 'exame', label: 'Exames' },
  { value: 'dieta', label: 'Dieta' },
  { value: 'sintoma', label: 'Sintomas' },
  { value: 'medicacao', label: 'Medicação' },
  { value: 'refeicao', label: 'Refeição' },
  { value: 'emocao', label: 'Humor' },
  { value: 'treino', label: 'Treino Físico' },
  { value: 'reabilitacao', label: 'Reabilitação' },
]

export const labelTipoRegistro = (t: SaudeRegistroTipo) =>
  TIPOS_REGISTRO.find((x) => x.value === t)?.label || t

export interface MinhasMetasCliente {
  agua_copos?: number
  sono_horas?: number
  calorias?: number
  atividade_min?: number
}

export interface SaudeClienteRecord {
  id: string
  user_id?: string
  paciente_id?: string
  nome: string
  email?: string
  data_nascimento?: string
  observacoes?: string
  ativo?: boolean
  altura_cm?: number
  peso_kg?: number
  genero?: 'feminino' | 'masculino' | 'outro' | 'nao_informado'
  metas?: MinhasMetasCliente | null
  ultima_visita_clinica?: string
  created?: string
  updated?: string
  expand?: {
    user_id?: { id: string; email: string; name?: string }
    paciente_id?: { id: string; nome: string }
  }
}

export interface ItemTreino {
  nome: string
  series?: string
  repeticoes?: string
  carga?: string
  observacao?: string
}

export interface DadosTreinoClinico {
  titulo?: string
  descricao?: string
  exercicios?: ItemTreino[]
  resultado?: string
}

export interface SaudeRegistroRecord {
  id: string
  cliente_id: string
  tipo: SaudeRegistroTipo
  data: string
  observacao?: string
  dados_json?: Record<string, unknown> | null
  registrado_por?: string
  created?: string
  updated?: string
}

export interface SaudeOrientacaoRecord {
  id: string
  titulo: string
  texto?: string
  categoria: 'orientacao' | 'dica' | 'desenvolvimento_pessoal' | 'exame'
  data: string
  cliente_id?: string
  publicada?: boolean
  criado_por?: string
  created?: string
  expand?: { cliente_id?: { id: string; nome: string } }
}

export interface SaudeLembreteRecord {
  id: string
  cliente_id: string
  titulo: string
  descricao?: string
  data_hora: string
  repeticao?: 'nenhuma' | 'diaria' | 'semanal' | 'mensal'
  created?: string
}

export interface SaudeDevPessoalRecord {
  id: string
  cliente_id: string
  titulo: string
  descricao?: string
  categoria: 'habito' | 'meta' | 'desafio'
  status: 'ativo' | 'concluido'
  prazo?: string
  progresso?: number
  created?: string
}

/* ------------------------------------------------------------------ */
/* Área Clínica                                                        */
/* ------------------------------------------------------------------ */

/**
 * Lista de clientes de saúde visíveis a este usuário:
 * - ADM/Secretária: todos;
 * - Profissional: somente os com vínculo ativo em vinculos_pacientes
 *   (paciente_id do saude_clientes designado a ele — mesmo padrão da 0064).
 * A regra de API do backend já filtra; aqui apenas buscamos a lista completa
 * (o filtro por papel é servidor-side, não client-side).
 */
export async function listarSaudeClientes(): Promise<SaudeClienteRecord[]> {
  return pb.collection('saude_clientes').getFullList<SaudeClienteRecord>({
    sort: 'nome',
    expand: 'user_id,paciente_id',
  })
}

export async function criarSaudeCliente(payload: {
  nome: string
  email?: string
  data_nascimento?: string
  observacoes?: string
  paciente_id?: string
  ativo?: boolean
}): Promise<SaudeClienteRecord> {
  return pb.collection('saude_clientes').create<SaudeClienteRecord>(payload)
}

export async function atualizarSaudeCliente(
  id: string,
  data: Partial<{
    nome: string
    email: string
    data_nascimento: string
    observacoes: string
    paciente_id: string
    ativo: boolean
    ultima_visita_clinica: string
  }>,
): Promise<SaudeClienteRecord> {
  return pb.collection('saude_clientes').update<SaudeClienteRecord>(id, data)
}

/** Cria a conta de login do cliente (Fase B) — endpoint do hook saude_criar_conta_cliente.js. */
export async function criarContaClienteSoul(payload: {
  saude_cliente_id: string
  email: string
  password: string
  nome?: string
}): Promise<{ success: boolean; message?: string; error?: string; user_id?: string }> {
  return pb.send('/backend/v1/saude/cliente/criar-conta', {
    method: 'POST',
    body: payload,
  })
}

export interface FiltroRegistros {
  clienteId: string
  tipos?: SaudeRegistroTipo[]
  /** ISO dates (yyyy-mm-dd) */
  de?: string
  ate?: string
}

const dataMinimaDoDia = (ymd: string) => `${ymd} 00:00:00.000Z`
const dataMaximaDoDia = (ymd: string) => `${ymd} 23:59:59.999Z`

export async function listarSaudeRegistros(f: FiltroRegistros): Promise<SaudeRegistroRecord[]> {
  const partes: string[] = [`cliente_id = "${f.clienteId}"`]
  if (f.tipos && f.tipos.length > 0 && f.tipos.length < 6) {
    partes.push(`(${f.tipos.map((t) => `tipo = "${t}"`).join(' || ')})`)
  }
  if (f.de) partes.push(`data >= "${dataMinimaDoDia(f.de)}"`)
  if (f.ate) partes.push(`data <= "${dataMaximaDoDia(f.ate)}"`)
  return pb.collection('saude_registros').getFullList<SaudeRegistroRecord>({
    filter: partes.join(' && '),
    sort: '-data,-created',
  })
}

/** Atualiza o perfil de SAÚDE do cliente logado (campos limitados pelo hook saude_clientes_perfil_guard.js). */
export async function atualizarMeuPerfilSaude(
  id: string,
  data: Partial<{
    altura_cm: number
    peso_kg: number
    genero: SaudeClienteRecord['genero']
    metas: MinhasMetasCliente
  }>,
): Promise<SaudeClienteRecord> {
  return pb.collection('saude_clientes').update<SaudeClienteRecord>(id, data)
}

export async function listarSaudeRegistrosTodosClientes(): Promise<SaudeRegistroRecord[]> {
  return pb.collection('saude_registros').getFullList<SaudeRegistroRecord>({
    sort: '-data,-created',
  })
}

export async function criarSaudeRegistro(payload: {
  cliente_id: string
  tipo: SaudeRegistroTipo
  data: string
  observacao?: string
  dados_json?: Record<string, unknown>
}): Promise<SaudeRegistroRecord> {
  return pb.collection('saude_registros').create<SaudeRegistroRecord>(payload)
}

/* -------------------------------------------------------------- */
/* Prescrição clínica (treinos / reabilitação / exames)            */
/* -------------------------------------------------------------- */

/** Monta o dados_json de um treino/reabilitação prescrito pela clínica. */
export function dadosTreinoClinico(dados: DadosTreinoClinico): Record<string, unknown> {
  return {
    ...dados,
    _origem: 'clinica',
  }
}

export async function criarTreinoClinico(payload: {
  cliente_id: string
  tipo: 'treino' | 'reabilitacao'
  observacao: string
  dados: DadosTreinoClinico
}): Promise<SaudeRegistroRecord> {
  // registrado_por é preenchido pelo hook saude_registros_staff.
  return criarSaudeRegistro({
    cliente_id: payload.cliente_id,
    tipo: payload.tipo,
    data: `${hojeYMD()} 12:00:00.000Z`,
    observacao: payload.observacao,
    dados_json: dadosTreinoClinico(payload.dados),
  })
}

export async function criarExameClinico(payload: {
  cliente_id: string
  titulo: string
  descricao?: string
  resultado?: string
}): Promise<SaudeRegistroRecord> {
  return criarSaudeRegistro({
    cliente_id: payload.cliente_id,
    tipo: 'exame',
    data: `${hojeYMD()} 12:00:00.000Z`,
    observacao: payload.titulo,
    dados_json: dadosTreinoClinico({
      titulo: payload.titulo,
      descricao: payload.descricao,
      resultado: payload.resultado,
    }),
  })
}

export async function atualizarSaudeRegistro(
  id: string,
  data: Partial<{
    tipo: SaudeRegistroTipo
    data: string
    observacao?: string
    dados_json?: Record<string, unknown>
  }>,
): Promise<SaudeRegistroRecord> {
  return pb.collection('saude_registros').update<SaudeRegistroRecord>(id, data)
}

export async function excluirSaudeRegistro(id: string): Promise<void> {
  await pb.collection('saude_registros').delete(id)
}

/* ------------------------------------------------------------------ */
/* Intervenção da clínica (orientações / dicas / lembretes / dev)      */
/* ------------------------------------------------------------------ */

const hojeYMD = () => {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export async function listarSaudeOrientacoes(filtro?: {
  clienteId?: string
  somentePublicadas?: boolean
}): Promise<SaudeOrientacaoRecord[]> {
  const partes: string[] = []
  if (filtro?.clienteId) {
    partes.push(`(cliente_id = "${filtro.clienteId}" || cliente_id = '')`)
  }
  if (filtro?.somentePublicadas) partes.push('publicada = true')
  return pb.collection('saude_orientacoes').getFullList<SaudeOrientacaoRecord>({
    filter: partes.length > 0 ? partes.join(' && ') : undefined,
    sort: '-data,-created',
  })
}

export async function criarSaudeOrientacao(payload: {
  titulo: string
  texto?: string
  categoria: SaudeOrientacaoRecord['categoria']
  data: string
  cliente_id?: string
  publicada?: boolean
}): Promise<SaudeOrientacaoRecord> {
  return pb.collection('saude_orientacoes').create<SaudeOrientacaoRecord>(payload)
}

export async function atualizarSaudeOrientacao(
  id: string,
  data: Partial<Pick<SaudeOrientacaoRecord, 'titulo' | 'texto' | 'publicada'>>,
): Promise<SaudeOrientacaoRecord> {
  return pb.collection('saude_orientacoes').update<SaudeOrientacaoRecord>(id, data)
}

export async function excluirSaudeOrientacao(id: string): Promise<void> {
  await pb.collection('saude_orientacoes').delete(id)
}

export async function listarSaudeLembretes(clienteId: string): Promise<SaudeLembreteRecord[]> {
  return pb.collection('saude_lembretes').getFullList<SaudeLembreteRecord>({
    filter: `cliente_id = "${clienteId}"`,
    sort: 'data_hora',
  })
}

export async function criarSaudeLembrete(payload: {
  cliente_id: string
  titulo: string
  descricao?: string
  data_hora: string
  repeticao?: SaudeLembreteRecord['repeticao']
}): Promise<SaudeLembreteRecord> {
  return pb.collection('saude_lembretes').create<SaudeLembreteRecord>(payload)
}

export async function excluirSaudeLembrete(id: string): Promise<void> {
  await pb.collection('saude_lembretes').delete(id)
}

export async function listarSaudeDevPessoal(clienteId: string): Promise<SaudeDevPessoalRecord[]> {
  return pb.collection('saude_dev_pessoal').getFullList<SaudeDevPessoalRecord>({
    filter: `cliente_id = "${clienteId}"`,
    sort: '-created',
  })
}

export async function criarSaudeDevPessoal(payload: {
  cliente_id: string
  titulo: string
  descricao?: string
  categoria: SaudeDevPessoalRecord['categoria']
  status?: SaudeDevPessoalRecord['status']
  prazo?: string
  progresso?: number
}): Promise<SaudeDevPessoalRecord> {
  return pb.collection('saude_dev_pessoal').create<SaudeDevPessoalRecord>(payload)
}

export async function atualizarSaudeDevPessoal(
  id: string,
  data: Partial<Pick<SaudeDevPessoalRecord, 'status' | 'progresso'>>,
): Promise<SaudeDevPessoalRecord> {
  return pb.collection('saude_dev_pessoal').update<SaudeDevPessoalRecord>(id, data)
}

/* ------------------------------------------------------------------ */
/* Área Cliente Soul                                                   */
/* ------------------------------------------------------------------ */

export interface MeuPerfilSaude {
  cliente: SaudeClienteRecord
  registros: SaudeRegistroRecord[]
  orientacoes: SaudeOrientacaoRecord[]
  lembretes: SaudeLembreteRecord[]
  devPessoal: SaudeDevPessoalRecord[]
}

/** Carrega tudo do cliente logado — num único request via hook saude_meu_painel.js. */
export async function carregarMeuPainel(): Promise<MeuPerfilSaude> {
  const resp = await pb.send<{
    cliente: SaudeClienteRecord
    registros: SaudeRegistroRecord[]
    orientacoes: SaudeOrientacaoRecord[]
    lembretes: SaudeLembreteRecord[]
    dev_pessoal: SaudeDevPessoalRecord[]
  }>('/backend/v1/saude/cliente/meu-painel', { method: 'GET' })
  return {
    cliente: resp.cliente,
    registros: resp.registros || [],
    orientacoes: resp.orientacoes || [],
    lembretes: resp.lembretes || [],
    devPessoal: resp.dev_pessoal || [],
  }
}
