import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel, RecordSubscription } from 'pocketbase'
import {
  listarSaudeClientes,
  listarSaudeRegistrosTodosClientes,
  type SaudeClienteRecord,
  type SaudeRegistroRecord,
} from '@/services/saudeBemEstar'

/* ------------------------------------------------------------------ */
/* Real-time de Saúde (modo Clínica)                                   */
/* ------------------------------------------------------------------ */

export interface NotificacaoRegistro {
  id: string
  clienteId: string
  clienteNome: string
  tipo: string
  tipoLabel: string
  criadoEm: string
  lida: boolean
}

const INTERVALO_POLLING_MS = 25_000

/**
 * Dados do painel Clínico de Monitoramento + atualização EM TEMPO REAL:
 * assina `saude_registros` via PocketBase SSE; se a assinatura falhar (ou o
 * SSE cair), faz polling automático a cada 25s como rede de segurança.
 *
 * O filtro por papel (ADM/Secretária: todos; Profissional: só designados)
 * é aplicado pelas API rules das coleções no servidor — nada é filtrado
 * client-side: o que o servidor devolve é o que o papel pode ver.
 */
export function useSaudeRealtime(enabled: boolean) {
  const [clientes, setClientes] = useState<SaudeClienteRecord[]>([])
  const [registros, setRegistros] = useState<SaudeRegistroRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [notificacoes, setNotificacoes] = useState<NotificacaoRegistro[]>([])
  const [sinoAberto, setSinoAberto] = useState(false)
  const [conectado, setConectado] = useState(false)

  const clientesRef = useRef<SaudeClienteRecord[]>([])
  clientesRef.current = clientes
  const sinoAbertoRef = useRef(false)
  sinoAbertoRef.current = sinoAberto

  /** Recarrega tudo (chamado no mount e pelo polling de segurança). */
  const recarregar = useCallback(async () => {
    const [cs, rs] = await Promise.all([listarSaudeClientes(), listarSaudeRegistrosTodosClientes()])
    setClientes(cs)
    setRegistros(rs)
  }, [])

  /* Carga inicial */
  useEffect(() => {
    if (!enabled) return
    let cancelado = false
    setCarregando(true)
    recarregar()
      .catch((err) => console.error('[SaudeBemEstar] falha ao carregar painel clínico', err))
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [enabled, recarregar])

  /* Evento realtime: create/update/delete em saude_registros. */
  const aoEvento = useCallback((e: RecordSubscription<RecordModel>) => {
    const rec = e.record as unknown as SaudeRegistroRecord
    if (!rec || !rec.cliente_id) return

    if (e.action === 'create' || e.action === 'update') {
      setRegistros((prev) => {
        const existe = prev.some((r) => r.id === rec.id)
        const proxima = existe ? prev.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...prev]
        return [...proxima].sort((a, b) =>
          (b.created || b.data || '') > (a.created || a.data || '')
            ? 1
            : (b.created || b.data || '') < (a.created || a.data || '')
              ? -1
              : 0,
        )
      })
    } else if (e.action === 'delete') {
      setRegistros((prev) => prev.filter((r) => r.id !== rec.id))
    }

    if (e.action === 'create') {
      const cliente = clientesRef.current.find((c) => c.id === rec.cliente_id)
      const nome = cliente?.nome || 'Cliente'
      setNotificacoes((prev) =>
        [
          {
            id: `${rec.id}-${Date.now()}`,
            clienteId: rec.cliente_id,
            clienteNome: nome,
            tipo: rec.tipo,
            tipoLabel: labelTipoRegistroSeguro(rec.tipo),
            criadoEm: new Date().toISOString(),
            lida: sinoAbertoRef.current,
          },
          ...prev,
        ].slice(0, 30),
      )
    }
  }, [])

  /* Assinatura SSE — se falhar ou cair, o polling de 25s cobre. */
  useEffect(() => {
    if (!enabled) return
    let cancelado = false
    let desinscrever: (() => Promise<void>) | undefined

    pb.collection('saude_registros')
      .subscribe('*', aoEvento)
      .then((fn) => {
        if (cancelado) {
          fn().catch(() => {})
        } else {
          desinscrever = fn
          setConectado(true)
        }
      })
      .catch(() => {
        if (!cancelado) setConectado(false)
      })

    return () => {
      cancelado = true
      if (desinscrever) desinscrever().catch(() => {})
    }
  }, [enabled, aoEvento])

  /* Polling de segurança (fallback do SSE) — a cada 25s */
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      recarregar().catch(() => {})
    }, INTERVALO_POLLING_MS)
    return () => clearInterval(id)
  }, [enabled, recarregar])

  /* Marca como lidas ao abrir o sino */
  useEffect(() => {
    if (sinoAberto && notificacoes.some((n) => !n.lida)) {
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    }
  }, [sinoAberto])

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida).length, [notificacoes])

  return {
    clientes,
    registros,
    carregando,
    notificacoes,
    naoLidas,
    sinoAberto,
    setSinoAberto,
    conectado,
    recarregar,
  }
}

const MAPA_TIPO: Record<string, string> = {
  atividade_fisica: 'Atividade Física',
  sono: 'Sono',
  bebida: 'Bebidas',
  alimento: 'Alimentos',
  exame: 'Exames',
  dieta: 'Dieta',
  sintoma: 'Sintomas',
  medicacao: 'Medicação',
  refeicao: 'Refeição',
  emocao: 'Humor',
  treino: 'Treino Físico',
  reabilitacao: 'Reabilitação',
}

function labelTipoRegistroSeguro(tipo: string): string {
  return MAPA_TIPO[tipo] || tipo
}
