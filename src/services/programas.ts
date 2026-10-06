import pb from '@/lib/pocketbase/client'
import type {
  ProgramaAcompanhamentoRecord,
  ProgramaMetaRecord,
  ProgramaSemanaRecord,
  ProgramaExercicioRecord,
  ProgramaRegistroCargaRecord,
  ExercicioCatalogoRecord,
} from '@/types/database'
import { createTimelineEvent } from './avaliacoes'

// Helper para gerar token aleatório seguro de 16 caracteres
export function gerarTokenAleatorio(length = 20): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// PROGRAMAS
export async function getProgramas(filter?: string) {
  return await pb.collection('programa_acompanhamento').getFullList<ProgramaAcompanhamentoRecord>({
    filter: filter || '',
    sort: '-created',
    expand: 'paciente_id,profissional_id',
  })
}

export async function getProgramasByPaciente(pacienteId: string) {
  return await pb.collection('programa_acompanhamento').getFullList<ProgramaAcompanhamentoRecord>({
    filter: `paciente_id = "${pacienteId}"`,
    sort: '-created',
    expand: 'paciente_id,profissional_id',
  })
}

export async function getProgramaById(id: string) {
  return await pb.collection('programa_acompanhamento').getOne<ProgramaAcompanhamentoRecord>(id, {
    expand: 'paciente_id,profissional_id',
  })
}

export async function getProgramaByToken(token: string) {
  const list = await pb
    .collection('programa_acompanhamento')
    .getFullList<ProgramaAcompanhamentoRecord>({
      filter: `token_compartilhamento = "${token}" && link_publico_ativo = true`,
      expand: 'paciente_id,profissional_id',
    })
  if (list.length === 0) {
    throw new Error('Programa não encontrado ou link desativado.')
  }
  return list[0]
}

export async function createPrograma(data: Partial<ProgramaAcompanhamentoRecord>) {
  const userId = pb.authStore.record?.id
  const payload: Record<string, unknown> = {
    ...data,
    profissional_id: data.profissional_id || userId,
    token_compartilhamento: data.token_compartilhamento || gerarTokenAleatorio(),
    link_publico_ativo: data.link_publico_ativo ?? true,
    status: data.status || 'ativo',
  }
  const prog = await pb
    .collection('programa_acompanhamento')
    .create<ProgramaAcompanhamentoRecord>(payload)

  // Criar evento na Timeline do paciente
  try {
    if (prog.paciente_id) {
      await createTimelineEvent({
        paciente_id: prog.paciente_id,
        tipo: 'Avaliação',
        especialidade: 'Personal',
        titulo: `Programa de Treino: ${prog.nome}`,
        conteudo: `Periodização de ${prog.total_periodos} ${prog.unidade_duracao} cadastrada com status ${prog.status}.`,
        data_evento: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.log('Aviso ao adicionar evento do programa na timeline:', err)
  }

  return prog
}

export async function updatePrograma(id: string, data: Partial<ProgramaAcompanhamentoRecord>) {
  return await pb
    .collection('programa_acompanhamento')
    .update<ProgramaAcompanhamentoRecord>(id, data)
}

export async function deletePrograma(id: string) {
  return await pb.collection('programa_acompanhamento').delete(id)
}

export async function toggleLinkPublico(id: string, ativo: boolean) {
  return await pb.collection('programa_acompanhamento').update<ProgramaAcompanhamentoRecord>(id, {
    link_publico_ativo: ativo,
  })
}

export async function regenerarTokenCompartilhamento(id: string) {
  return await pb.collection('programa_acompanhamento').update<ProgramaAcompanhamentoRecord>(id, {
    token_compartilhamento: gerarTokenAleatorio(),
    link_publico_ativo: true,
  })
}

// METAS DO PROGRAMA
export async function getMetasByPrograma(programaId: string) {
  return await pb.collection('programa_meta').getFullList<ProgramaMetaRecord>({
    filter: `programa_id = "${programaId}"`,
    sort: 'ordem',
  })
}

export async function createMeta(data: Partial<ProgramaMetaRecord>) {
  return await pb.collection('programa_meta').create<ProgramaMetaRecord>(data)
}

export async function updateMeta(id: string, data: Partial<ProgramaMetaRecord>) {
  return await pb.collection('programa_meta').update<ProgramaMetaRecord>(id, data)
}

export async function deleteMeta(id: string) {
  return await pb.collection('programa_meta').delete(id)
}

// SEMANAS / PERÍODOS DA PERIODIZAÇÃO
export async function getSemanasByPrograma(programaId: string) {
  return await pb.collection('programa_semana').getFullList<ProgramaSemanaRecord>({
    filter: `programa_id = "${programaId}"`,
    sort: 'indice',
  })
}

export async function saveSemanaPeriodo(data: {
  programa_id: string
  indice: number
  rotulo?: string
  metas_ids?: string[]
  foco?: string
  observacoes?: string
}) {
  // Verifica se já existe a semana para atualizar ou criar
  try {
    const existing = await pb
      .collection('programa_semana')
      .getFirstListItem<ProgramaSemanaRecord>(
        `programa_id = "${data.programa_id}" && indice = ${data.indice}`,
      )
    return await pb.collection('programa_semana').update<ProgramaSemanaRecord>(existing.id, data)
  } catch (_) {
    return await pb.collection('programa_semana').create<ProgramaSemanaRecord>(data)
  }
}

// CATÁLOGO DE EXERCÍCIOS
export async function getCatalogoExercicios(categoria?: string) {
  const options: Record<string, any> = {
    sort: 'categoria,subcategoria,nome',
  }
  if (categoria && categoria !== 'todos') {
    options.filter = `categoria = "${categoria}"`
  }
  return await pb.collection('exercicios').getFullList<ExercicioCatalogoRecord>(options)
}

export async function getExercicioCatalogoById(id: string) {
  return await pb.collection('exercicios').getOne<ExercicioCatalogoRecord>(id)
}

export async function createExercicioCatalogo(
  formData: FormData | Partial<ExercicioCatalogoRecord>,
) {
  return await pb.collection('exercicios').create<ExercicioCatalogoRecord>(formData)
}

export async function updateExercicioCatalogo(
  id: string,
  formData: FormData | Partial<ExercicioCatalogoRecord>,
) {
  return await pb.collection('exercicios').update<ExercicioCatalogoRecord>(id, formData)
}

export async function deleteExercicioCatalogo(id: string) {
  return await pb.collection('exercicios').delete(id)
}

export function getFotoExercicioUrl(exercicio: {
  id: string
  foto?: string
  collectionId?: string
}): string | null {
  if (!exercicio.foto) return null
  return pb.files.getURL(exercicio as any, exercicio.foto)
}

// EXERCÍCIOS PRESCRITOS DO PROGRAMA
export async function getExerciciosByPrograma(programaId: string) {
  return await pb.collection('programa_exercicio').getFullList<ProgramaExercicioRecord>({
    filter: `programa_id = "${programaId}"`,
    sort: 'semana_indice,ordem',
    expand: 'exercicio_id',
  })
}

export async function createExercicio(data: Partial<ProgramaExercicioRecord>) {
  return await pb.collection('programa_exercicio').create<ProgramaExercicioRecord>(data)
}

export async function updateExercicio(id: string, data: Partial<ProgramaExercicioRecord>) {
  return await pb.collection('programa_exercicio').update<ProgramaExercicioRecord>(id, data)
}

export async function deleteExercicio(id: string) {
  return await pb.collection('programa_exercicio').delete(id)
}

// REGISTROS DE CARGA & CURVA
export async function getRegistrosCarga(exercicioId: string) {
  return await pb.collection('programa_registro_carga').getFullList<ProgramaRegistroCargaRecord>({
    filter: `exercicio_id = "${exercicioId}"`,
    sort: 'data',
  })
}

export async function getRegistrosCargaPorPrograma(programaId: string) {
  // Busca exercícios do programa e seus registros de carga
  const exercicios = await getExerciciosByPrograma(programaId)
  if (exercicios.length === 0) return []

  const ids = exercicios.map((e) => `"${e.id}"`).join(',')
  return await pb.collection('programa_registro_carga').getFullList<ProgramaRegistroCargaRecord>({
    filter: `exercicio_id ?= [${ids}]`,
    sort: 'data',
    expand: 'exercicio_id',
  })
}

export async function createRegistroCarga(data: Partial<ProgramaRegistroCargaRecord>) {
  const reg = await pb
    .collection('programa_registro_carga')
    .create<ProgramaRegistroCargaRecord>(data)
  // Atualiza carga_atual_kg no exercício
  if (data.exercicio_id && typeof data.valor_kg === 'number') {
    try {
      await pb.collection('programa_exercicio').update(data.exercicio_id, {
        carga_atual_kg: data.valor_kg,
      })
    } catch {
      /* intentionally ignored */
    }
  }
  return reg
}

export async function deleteRegistroCarga(id: string) {
  return await pb.collection('programa_registro_carga').delete(id)
}
