export const ESPECIALIDADE_COLORS = {
  Fisioterapia: {
    badge: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',
    chip: 'bg-[#3B82F6] text-white',
    border: 'border-[#3B82F6]',
    text: 'text-[#3B82F6]',
    hex: '#3B82F6',
    bgSoft: '#EFF6FF',
  },
  Personal: {
    badge: 'bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]',
    chip: 'bg-[#F97316] text-white',
    border: 'border-[#F97316]',
    text: 'text-[#F97316]',
    hex: '#F97316',
    bgSoft: '#FFF7ED',
  },
  Nutrição: {
    badge: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
    chip: 'bg-[#22C55E] text-white',
    border: 'border-[#22C55E]',
    text: 'text-[#22C55E]',
    hex: '#22C55E',
    bgSoft: '#F0FDF4',
  },
  Médico: {
    badge: 'bg-[#EDE9FE] text-[#6D28D9] border-[#C4B5FD]',
    chip: 'bg-[#8B5CF6] text-white',
    border: 'border-[#8B5CF6]',
    text: 'text-[#8B5CF6]',
    hex: '#8B5CF6',
    bgSoft: '#F5F3FF',
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
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatHoraPTBR(dateString?: string) {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function formatDataHoraPTBR(dateString?: string) {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
