export const SOUL_PALETTE = {
  gold: '#C9A46A',
  goldLight: '#E3C89A',
  goldPale: '#F0E3CC',
  brown: '#5C4033',
  brownDark: '#4A322A',
  brownDeep: '#33221C',
  copper: '#B87355',
  copperLight: '#D6957B',
  cream: '#FAF7F1',
  linen: '#F4EFE6',
  // Paleta Institucional Oficial Clínica SOUL (Modelo de Documentos)
  marromSoul: '#6A402D',
  douradoChampagne: '#D5AE6F',
  bronzeRose: '#B86545',
  begeClaro: '#F7F2EC',
  cinzaQuente: '#5F544F',
  branco: '#FFFFFF',
} as const

export const ESPECIALIDADE_COLORS = {
  Fisioterapia: {
    badge: 'bg-[#FAF4EA] text-[#8C6527] border-[#E3C89A]',
    chip: 'bg-[#C9A46A] text-[#33221C] font-semibold',
    border: 'border-[#C9A46A]',
    text: 'text-[#8C6527]',
    hex: '#C9A46A', // Dourado champagne SOUL
    bgSoft: '#FAF4EA',
  },
  Personal: {
    badge: 'bg-[#FDF2EE] text-[#9A4B2E] border-[#E7BFB0]',
    chip: 'bg-[#B87355] text-white',
    border: 'border-[#B87355]',
    text: 'text-[#B87355]',
    hex: '#B87355', // Cobre / Rosé SOUL
    bgSoft: '#FDF2EE',
  },
  Nutrição: {
    badge: 'bg-[#F2F6F1] text-[#2F5E39] border-[#C1D7C4]',
    chip: 'bg-[#477A53] text-white',
    border: 'border-[#477A53]',
    text: 'text-[#2F5E39]',
    hex: '#477A53', // Verde Oliva / Sálvia sofisticado
    bgSoft: '#F2F6F1',
  },
  Médico: {
    badge: 'bg-[#F5F1EE] text-[#5C4033] border-[#D9C8BE]',
    chip: 'bg-[#5C4033] text-white',
    border: 'border-[#5C4033]',
    text: 'text-[#5C4033]',
    hex: '#5C4033', // Marrom Café SOUL
    bgSoft: '#F5F1EE',
  },
} as const

export function formatCPF(val?: string) {
  if (!val) return '—'
  const clean = val.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return val
}

export function formatTelefone(val?: string) {
  if (!val) return '—'
  const clean = val.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return val
}

export function formatDataPTBR(dateString?: string) {
  if (!dateString) return '—'
  try {
    // Se a string contiver formato de data YYYY-MM-DD (com ou sem horário), extrair componentes diretamente
    // para NUNCA sofrer deslocamento de fuso horário em datas puras ou UTC 00:00:00
    const m = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) {
      const [, ano, mes, dia] = m
      return `${dia}/${mes}/${ano}`
    }
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    })
  } catch {
    return dateString
  }
}

/**
 * Retorna a data de hoje no fuso horário do Brasil (America/Sao_Paulo) no formato YYYY-MM-DD
 */
export function getHojeBrasilYMD(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Retorna o horário atual no fuso horário do Brasil (America/Sao_Paulo) no formato HH:mm
 */
export function getAgoraBrasilHora(): string {
  try {
    return new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
}

export function formatHoraPTBR(dateString?: string) {
  if (!dateString) return '—'
  // Se for apenas uma string HH:mm ou HH:mm:ss
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(dateString.trim())) {
    return dateString.trim().substring(0, 5)
  }
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  } catch {
    return dateString
  }
}

export function formatDataHoraPTBR(dateString?: string) {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  } catch {
    return dateString
  }
}

export function getInitials(name?: string) {
  if (!name) return 'SO'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Áreas ou Serviços oficiais da Clínica SOUL para o processo de Presença / Confirmação de Atendimentos.
 * Substitui por completo a lista antiga por decisão clínica.
 */
export const SERVICOS_PRESENCA_PADRAO = [
  'Assessoria Esportiva',
  'Assessoria Fisioterapia',
  'Avaliação Física e Funcional',
  'Avaliação Inicial',
  'Massagem Terapêutica',
  'Nutricionista',
  'Personal Individual',
  'Personal em Grupo',
  'Pilates Performance',
  'Reavaliação',
  'Sessão Fisioterapia',
  'Sessão Osteopatia',
  'Sessão Spa & Recovery',
] as const

export type ServicoPresencaPadrao = (typeof SERVICOS_PRESENCA_PADRAO)[number]
