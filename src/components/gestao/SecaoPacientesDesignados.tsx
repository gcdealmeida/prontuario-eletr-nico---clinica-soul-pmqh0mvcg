/**
 * Seção "Pacientes Designados" — lista os vínculos de um usuário com pacientes
 * (coleção `vinculos_pacientes`), permitindo designar um novo paciente e
 * desfazer vínculos existentes, com feedback via toast e estados de carregamento.
 * Reaproveita os serviços existentes (designarPaciente / removerVinculo),
 * garantindo que o modal de edição e a aba de vínculos usem a mesma fonte de dados.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { isProfissionalRole, isGestorRole, roleLabel } from '@/lib/roles'
import type { UserRecord, PacienteRecord } from '@/types/database'
import {
  designarPaciente,
  listarVinculosPorProfissional,
  removerVinculo,
  type VinculoPacienteRecord,
} from '@/services/gestao'

interface SecaoPacientesDesignadosProps {
  /** Lista completa de usuários (para o seletor quando não há usuário fixo). */
  usuarios: UserRecord[]
  /** Lista completa de pacientes (para o seletor de designação). */
  pacientes: PacienteRecord[]
  /** Quando definido, trava a seção em um único usuário (uso no modal Editar Usuário). */
  usuarioFixo?: string
  /** Rótulos opcionais para reuso em outras telas. */
  titulo?: string
  descricao?: string
}

export default function SecaoPacientesDesignados({
  usuarios,
  pacientes,
  usuarioFixo,
  titulo = 'Pacientes Designados',
  descricao,
}: SecaoPacientesDesignadosProps) {
  const { toast } = useToast()
  const [profSel, setProfSel] = useState(usuarioFixo || '')
  const [pacSel, setPacSel] = useState('')
  const [buscaPac, setBuscaPac] = useState('')
  const [designando, setDesignando] = useState(false)
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [vinculos, setVinculos] = useState<VinculoPacienteRecord[]>([])
  const [carregandoVinculos, setCarregandoVinculos] = useState(false)

  const carregarVinculos = useCallback(async () => {
    if (!profSel) {
      setVinculos([])
      return
    }
    setCarregandoVinculos(true)
    try {
      setVinculos(await listarVinculosPorProfissional(profSel))
    } catch (err: unknown) {
      console.error('Erro ao carregar vínculos:', err)
      toast({
        title: 'Erro ao carregar pacientes designados',
        description: (err as Error)?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCarregandoVinculos(false)
    }
  }, [profSel, toast])

  useEffect(() => {
    if (usuarioFixo) setProfSel(usuarioFixo)
  }, [usuarioFixo])

  useEffect(() => {
    carregarVinculos()
  }, [carregarVinculos])

  const usuariosDesignaveis = useMemo(
    () => usuarios.filter((u) => isProfissionalRole(u.role) || isGestorRole(u.role)),
    [usuarios],
  )

  const pacientesDesignaveis = useMemo(() => {
    const jaVinculados = new Set(vinculos.map((v) => v.paciente_id))
    const q = buscaPac.trim().toLowerCase()
    return pacientes.filter((p) => {
      if (jaVinculados.has(p.id)) return false
      if (!q) return true
      return p.nome?.toLowerCase().includes(q) || (p.cpf || '').includes(q)
    })
  }, [pacientes, vinculos, buscaPac])

  const handleDesignar = async () => {
    if (!profSel || !pacSel) {
      toast({ title: 'Escolha o paciente para designar', variant: 'destructive' })
      return
    }
    setDesignando(true)
    try {
      const r = await designarPaciente(profSel, pacSel)
      toast({
        title: r === 'criado' ? 'Paciente designado!' : 'Vínculo já existia',
        description: r === 'criado' ? 'O paciente agora aparece na lista do usuário.' : undefined,
      })
      setPacSel('')
      setBuscaPac('')
      await carregarVinculos()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao designar',
        description: (err as Error)?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDesignando(false)
    }
  }

  const handleRemover = async (vinculoId: string) => {
    setRemovendoId(vinculoId)
    try {
      await removerVinculo(vinculoId)
      toast({ title: 'Vínculo desfeito' })
      await carregarVinculos()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao desfazer vínculo',
        description: (err as Error)?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setRemovendoId(null)
    }
  }

  const nomePaciente = (id: string) =>
    pacientes.find((p) => p.id === id)?.nome ||
    vinculos.find((v) => v.paciente_id === id)?.expand?.paciente_id?.nome ||
    '—'

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[#4A322A]">{titulo}</h3>
        {descricao && <p className="text-xs text-gray-500">{descricao}</p>}
      </div>

      {!usuarioFixo && (
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Usuário</Label>
            <Select value={profSel} onValueChange={setProfSel}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o usuário" />
              </SelectTrigger>
              <SelectContent>
                {usuariosDesignaveis.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email} ({roleLabel(u.role)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Designar novo paciente */}
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Input
            value={buscaPac}
            onChange={(e) => setBuscaPac(e.target.value)}
            placeholder="Filtrar pacientes por nome ou CPF"
            className="rounded-xl"
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Select value={pacSel} onValueChange={setPacSel}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              {pacientesDesignaveis.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome} {p.status ? `· ${p.status}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleDesignar}
          disabled={designando || !profSel || !pacSel}
          className="bg-[#4A322A] hover:bg-[#33221C] text-white rounded-xl h-10 gap-2"
        >
          {designando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Designar
        </Button>
      </div>

      {/* Lista de pacientes designados */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {carregandoVinculos ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#C9A46A]" />
          </div>
        ) : (
          <>
            {vinculos.map((v) => (
              <div
                key={v.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/60"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {nomePaciente(v.paciente_id)}
                  </p>
                  {v.expand?.paciente_id?.status && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[#E3C89A] text-[#8C6527] mt-0.5"
                    >
                      {v.expand.paciente_id.status}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                  disabled={removendoId === v.id}
                  onClick={() => handleRemover(v.id)}
                >
                  {removendoId === v.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {removendoId === v.id ? 'Removendo…' : 'Desfazer'}
                </Button>
              </div>
            ))}
            {vinculos.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">
                Nenhum paciente designado a este usuário.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
