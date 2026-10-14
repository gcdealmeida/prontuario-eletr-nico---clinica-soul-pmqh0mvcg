import pb from '@/lib/pocketbase/client'
import type { Especialidade } from '@/types/database'

export interface QuickLinkTarget {
  tipo: 'existente' | 'novo' | 'aba'
  url: string
  label: string
  sublabel?: string
  especialidade?: Especialidade
}

export interface PacienteQuickLinks {
  pacienteId: string
  avaliacao: QuickLinkTarget
  prontuario: QuickLinkTarget
  evolucao: QuickLinkTarget
}

// Cache leve em memória com expiração curta para não impactar performance em listas grandes
const quickLinksCache = new Map<string, { data: PacienteQuickLinks; timestamp: number }>()
const CACHE_TTL_MS = 15000 // 15 segundos

/**
 * Retorna os links diretos para Avaliação, Prontuário e Evolução de um paciente específico.
 * Se o paciente tiver registros existentes, aponta para o registro mais recente.
 * Caso contrário, aponta para o fluxo de criação rápida com o paciente pré-selecionado.
 */
export async function getPacienteQuickLinks(
  pacienteId: string,
  userEspecialidade?: string,
  abrirNovaEvolucao?: boolean,
): Promise<PacienteQuickLinks> {
  // Não usa cache se for para abrir nova evolução diretamente para evitar conflito de flags
  const cached = !abrirNovaEvolucao ? quickLinksCache.get(pacienteId) : null
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  // Especialidade padrão sugerida para novos registros
  const defaultEsp: Especialidade =
    userEspecialidade &&
    ['Fisioterapia', 'Personal', 'Nutrição', 'Médico'].includes(userEspecialidade)
      ? (userEspecialidade as Especialidade)
      : 'Fisioterapia'

  try {
    // Busca paralela otimizada de avaliações e evoluções mais recentes do paciente
    const [fisioList, personalList, nutriList, medicoList, evolucoesList] = await Promise.all([
      pb
        .collection('avaliacoes_fisioterapia')
        .getList(1, 1, {
          filter: `paciente_id = "${pacienteId}"`,
          sort: '-created',
          fields: 'id,created,status,especialidade',
        })
        .catch(() => ({ items: [] })),
      pb
        .collection('avaliacoes_personal')
        .getList(1, 1, {
          filter: `paciente_id = "${pacienteId}"`,
          sort: '-created',
          fields: 'id,created,status,especialidade',
        })
        .catch(() => ({ items: [] })),
      pb
        .collection('avaliacoes_nutricao')
        .getList(1, 1, {
          filter: `paciente_id = "${pacienteId}"`,
          sort: '-created',
          fields: 'id,created,status,especialidade',
        })
        .catch(() => ({ items: [] })),
      pb
        .collection('avaliacoes_medico')
        .getList(1, 1, {
          filter: `paciente_id = "${pacienteId}"`,
          sort: '-created',
          fields: 'id,created,status,especialidade',
        })
        .catch(() => ({ items: [] })),
      pb
        .collection('evolucoes')
        .getList(1, 1, {
          filter: `paciente_id = "${pacienteId}"`,
          sort: '-data_evolucao,-created',
          fields: 'id,avaliacao_id,especialidade,created,status,documento_fechado',
        })
        .catch(() => ({ items: [] })),
    ])

    // Combina e ordena avaliações existentes por mais recente
    const allAvs: Array<{
      id: string
      created: string
      especialidade: Especialidade
      status?: string
    }> = []
    if (fisioList.items[0]) {
      allAvs.push({
        id: fisioList.items[0].id,
        created: fisioList.items[0].created,
        especialidade: 'Fisioterapia',
        status: fisioList.items[0].status,
      })
    }
    if (personalList.items[0]) {
      allAvs.push({
        id: personalList.items[0].id,
        created: personalList.items[0].created,
        especialidade: 'Personal',
        status: personalList.items[0].status,
      })
    }
    if (nutriList.items[0]) {
      allAvs.push({
        id: nutriList.items[0].id,
        created: nutriList.items[0].created,
        especialidade: 'Nutrição',
        status: nutriList.items[0].status,
      })
    }
    if (medicoList.items[0]) {
      allAvs.push({
        id: medicoList.items[0].id,
        created: medicoList.items[0].created,
        especialidade: 'Médico',
        status: medicoList.items[0].status,
      })
    }

    allAvs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    const latestAvaliacao = allAvs[0]
    const latestEvolucao = evolucoesList.items[0]

    // 1. Avaliação rápida:
    // Se tem avaliação existente -> abre ela direto em /prontuarios/:id?esp=...
    // Se não tem -> abre /prontuarios/novo?paciente=:id&especialidade=...
    const avaliacaoTarget: QuickLinkTarget = latestAvaliacao
      ? {
          tipo: 'existente',
          url: `/prontuarios/${latestAvaliacao.id}?esp=${encodeURIComponent(latestAvaliacao.especialidade)}`,
          label: `Avaliação (${latestAvaliacao.especialidade})`,
          sublabel: 'Abrir mais recente',
          especialidade: latestAvaliacao.especialidade,
        }
      : {
          tipo: 'novo',
          url: `/prontuarios/novo?paciente=${pacienteId}&especialidade=${encodeURIComponent(defaultEsp)}`,
          label: 'Nova Avaliação',
          sublabel: 'Iniciar preenchimento',
          especialidade: defaultEsp,
        }

    // 2. Prontuário do paciente:
    // Leva direto ao perfil na aba de avaliações clínicas (/pacientes/:id?tab=avaliacoes)
    // Se já tiver uma avaliação específica, permite abrir a ficha oficial completa
    const prontuarioTarget: QuickLinkTarget = latestAvaliacao
      ? {
          tipo: 'existente',
          url: `/prontuarios/${latestAvaliacao.id}?esp=${encodeURIComponent(latestAvaliacao.especialidade)}`,
          label: `Prontuário (${latestAvaliacao.especialidade})`,
          sublabel: 'Ficha clínica completa',
          especialidade: latestAvaliacao.especialidade,
        }
      : {
          tipo: 'aba',
          url: `/pacientes/${pacienteId}?tab=avaliacoes`,
          label: 'Prontuário Clínico',
          sublabel: 'Histórico & fichas',
        }

    // 3. Evolução rápida:
    // Se o paciente já tem evoluções e avaliação correspondente, abre a aba de evoluções do prontuário
    // Se tem avaliação, abre o prontuário na aba de evoluções (/prontuarios/:id?tab=evolucoes)
    // Se não tem avaliação, abre a aba Evoluções do perfil do paciente (/pacientes/:id?tab=evolucoes)
    // Se abrirNovaEvolucao for true, anexa &nova=1 para abrir direto o formulário SOAP/registro
    const novaParam = abrirNovaEvolucao ? '&nova=1' : ''

    const evolucaoTarget: QuickLinkTarget = latestAvaliacao
      ? {
          tipo: latestEvolucao ? 'existente' : 'novo',
          url: `/prontuarios/${latestAvaliacao.id}?esp=${encodeURIComponent(
            latestAvaliacao.especialidade,
          )}&tab=evolucoes${novaParam}`,
          label: latestEvolucao ? 'Evoluções (Sessões)' : 'Nova Evolução',
          sublabel: latestEvolucao ? 'Ver / Registrar sessão' : 'Iniciar primeira sessão',
          especialidade: latestAvaliacao.especialidade,
        }
      : {
          tipo: 'aba',
          url: `/pacientes/${pacienteId}?tab=evolucoes${novaParam}`,
          label: 'Evoluções',
          sublabel: 'Aba do histórico de sessões',
        }

    const result: PacienteQuickLinks = {
      pacienteId,
      avaliacao: avaliacaoTarget,
      prontuario: prontuarioTarget,
      evolucao: evolucaoTarget,
    }

    if (!abrirNovaEvolucao) {
      quickLinksCache.set(pacienteId, { data: result, timestamp: Date.now() })
    }
    return result
  } catch (err) {
    console.warn('Erro ao obter quick links para paciente', pacienteId, err)
    const novaParam = abrirNovaEvolucao ? '&nova=1' : ''
    // Fallback seguro usando as rotas do paciente
    return {
      pacienteId,
      avaliacao: {
        tipo: 'novo',
        url: `/prontuarios/novo?paciente=${pacienteId}&especialidade=${encodeURIComponent(defaultEsp)}`,
        label: 'Nova Avaliação',
        especialidade: defaultEsp,
      },
      prontuario: {
        tipo: 'aba',
        url: `/pacientes/${pacienteId}?tab=avaliacoes`,
        label: 'Prontuário Clínico',
      },
      evolucao: {
        tipo: 'aba',
        url: `/pacientes/${pacienteId}?tab=evolucoes${novaParam}`,
        label: 'Evoluções',
      },
    }
  }
}

/**
 * Invalida o cache para um paciente específico ou todo o cache.
 */
export function invalidateQuickLinksCache(pacienteId?: string) {
  if (pacienteId) {
    quickLinksCache.delete(pacienteId)
  } else {
    quickLinksCache.clear()
  }
}
