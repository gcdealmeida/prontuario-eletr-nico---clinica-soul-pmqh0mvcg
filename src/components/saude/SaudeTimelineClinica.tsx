import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  listarSaudeRegistros,
  excluirSaudeRegistro,
  criarSaudeRegistro,
  labelTipoRegistro,
  TIPOS_REGISTRO,
  type SaudeRegistroRecord,
  type SaudeRegistroTipo,
} from '@/services/saudeBemEstar'
import { ICONES_TIPO } from '@/components/saude/SaudeResumoIcones'
import { formatDataHoraPTBR } from '@/lib/constants'
import { Plus, Trash2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const hojeYMD = () => new Date().toISOString().slice(0, 10)

interface Props {
  clienteId: string
}

/** Timeline de registros do cliente na visão da clínica, com filtros e lançamento manual. */
export function SaudeTimelineClinica({ clienteId }: Props) {
  const { toast } = useToast()
  const [registros, setRegistros] = useState<SaudeRegistroRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tipos, setTipos] = useState<SaudeRegistroTipo[]>([])
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [modalNovo, setModalNovo] = useState(false)
  const [novoTipo, setNovoTipo] = useState<SaudeRegistroTipo>('atividade_fisica')
  const [novaData, setNovaData] = useState(hojeYMD())
  const [novaObs, setNovaObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      const rs = await listarSaudeRegistros({
        clienteId,
        tipos: tipos.length > 0 ? tipos : undefined,
        de: de || undefined,
        ate: ate || undefined,
      })
      setRegistros(rs)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar registros.', variant: 'destructive' })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, tipos, de, ate])

  const toggleTipo = (t: SaudeRegistroTipo) => {
    setTipos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const salvarRegistro = async () => {
    setSalvando(true)
    try {
      await criarSaudeRegistro({
        cliente_id: clienteId,
        tipo: novoTipo,
        data: `${novaData} 12:00:00.000Z`,
        observacao: novaObs.trim() || undefined,
      })
      toast({ title: 'Registro lançado!' })
      setModalNovo(false)
      setNovaObs('')
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao lançar registro.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (id: string) => {
    try {
      await excluirSaudeRegistro(id)
      setRegistros((prev) => prev.filter((r) => r.id !== id))
      toast({ title: 'Registro removido.' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao remover registro.', variant: 'destructive' })
    }
  }

  const agrupados = useMemo(() => {
    const out: Record<string, SaudeRegistroRecord[]> = {}
    for (const r of registros) {
      const dia = (r.data || '').slice(0, 10)
      ;(out[dia] = out[dia] || []).push(r)
    }
    return Object.entries(out).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [registros])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Registros do cliente</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setModalNovo(true)}>
            <Plus className="h-4 w-4 mr-1" /> Lançar registro
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {TIPOS_REGISTRO.map((t) => {
            const ativo = tipos.includes(t.value)
            const Icone = ICONES_TIPO[t.value]
            return (
              <button
                key={t.value}
                onClick={() => toggleTipo(t.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                  ativo
                    ? 'border-[#C9A46A] bg-[#C9A46A]/10 text-[#73574A]'
                    : 'border-[#73574A]/20 text-[#73574A]/70 hover:border-[#C9A46A]'
                }`}
              >
                <Icone className="h-3.5 w-3.5" />
                {t.label}
                {ativo && <X className="h-3 w-3" />}
              </button>
            )
          })}
          <span className="mx-1 h-4 w-px bg-[#73574A]/20" />
          <Input
            type="date"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            className="h-8 w-[140px] text-xs"
          />
          <span className="text-xs text-[#73574A]">até</span>
          <Input
            type="date"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            className="h-8 w-[140px] text-xs"
          />
          {(de || ate || tipos.length > 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setTipos([])
                setDe('')
                setAte('')
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <p className="text-sm text-[#73574A]">Carregando registros...</p>
        ) : agrupados.length === 0 ? (
          <p className="text-sm text-[#73574A] italic">
            Nenhum registro encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="space-y-4">
            {agrupados.map(([dia, lista]) => (
              <div key={dia}>
                <p className="text-xs font-semibold text-[#73574A] uppercase tracking-wide mb-2">
                  {dia.split('-').reverse().join('/')}
                </p>
                <div className="space-y-2">
                  {lista.map((r) => {
                    const Icone = ICONES_TIPO[r.tipo]
                    return (
                      <div
                        key={r.id}
                        className="flex items-start gap-3 rounded-lg border border-[#73574A]/10 bg-[#FAF7F1] p-3"
                      >
                        <div className="mt-0.5 rounded-full bg-[#C9A46A]/15 p-2">
                          <Icone className="h-4 w-4 text-[#73574A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#33221C]">
                              {labelTipoRegistro(r.tipo)}
                            </span>
                            <span className="text-xs text-[#73574A]/70">
                              {formatDataHoraPTBR(r.data)}
                            </span>
                          </div>
                          {r.observacao && (
                            <p className="text-sm text-[#73574A] mt-0.5 whitespace-pre-wrap">
                              {r.observacao}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-[#73574A]/50 hover:text-red-600"
                          onClick={() => excluir(r.id)}
                          title="Remover registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal lançar registro */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar registro (entrada manual)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoria *</Label>
              <Select value={novoTipo} onValueChange={(v) => setNovoTipo(v as SaudeRegistroTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REGISTRO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={novaObs}
                onChange={(e) => setNovaObs(e.target.value)}
                placeholder="Ex.: Caminhada de 30 minutos no parque"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovo(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarRegistro} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Lançar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default SaudeTimelineClinica
