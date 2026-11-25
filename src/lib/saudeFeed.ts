import type { SaudeRegistroRecord, SaudeLembreteRecord } from '@/services/saudeBemEstar'

/* ------------------------------------------------------------------ */
/* Feed em tempo real — utilitários compartilhados entre o hook        */
/* useSaudeRealtime e o PainelMonitorClinico.                          */
/* ------------------------------------------------------------------ */

/** Timestamp (ms) usado para ordenar o feed do mais novo para o mais antigo. */
export function getTimestampFeed(r: SaudeRegistroRecord | SaudeLembreteRecord): number {
  if ('data_hora' in r && r.data_hora) {
    const t = new Date(r.data_hora).getTime()
    if (!isNaN(t)) return t
  }
  // Lembrete: usa o instante de criação; registro: data do lançamento.
  const iso = r.created || ('data' in r ? r.data : '') || ''
  const t = new Date(iso).getTime()
  return isNaN(t) ? 0 : t
}

/** true quando o item é de hoje (data local). */
export function ehHoje(r: SaudeRegistroRecord | SaudeLembreteRecord): boolean {
  const d = new Date(getTimestampFeed(r))
  const off = d.getTimezoneOffset()
  const ymd = new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
  const agora = new Date()
  const offAgora = agora.getTimezoneOffset()
  const ymdAgora = new Date(agora.getTime() - offAgora * 60000).toISOString().slice(0, 10)
  return ymd === ymdAgora
}
