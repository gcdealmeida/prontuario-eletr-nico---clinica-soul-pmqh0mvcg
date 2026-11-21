/**
 * Seção "Pacientes Designados" — lista os vínculos de um usuário com pacientes
 * (coleção `vinculos_pacientes`), permitindo designar um novo paciente e
 * desfazer vínculos existentes, com feedback via toast e estados de carregamento.
 * Reaproveita os serviços existentes (designarPaciente / removerVinculo),
 * garantindo que o modal de edição e a aba de vínculos usem a mesma fonte de dados.
 *
 * O seletor de paciente é um autocomplete com busca server-side (coleção
 * `pacientes`, filtro `nome ~ q || cpf ~ q`, mesmo padrão da busca do Painel
 * Geral em TopbarBuscaPaciente): casa por qualquer parte do nome — primeiro
 * nome, sobrenome, trecho de letras — e por CPF parcial ou completo. Pacientes
 * já designados a este usuário são excluídos das sugestões.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Plus, Search, Trash2, User, X } from 'lucide-react'
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
import { formatCPF, getInitials } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  designarPaciente,
  listarVinculosPorProfissional,
  removerVinculo,
  type VinculoPacienteRecord,
} from '@/services/gestao'
import { getPacientes } from '@/services/pacientes'
import { invalidarCachePacientesAcessiveis } from '@/services/avaliacoes'

/** Quantidade máxima de sugestões exibidas por busca. */
const LIMITE_SUGESTOES = 8
/** Tamanho mínimo do texto para disparar a busca server-side. */
const MINIMO_BUSCA = 2

interface SecaoPacientesDesignadosProps {
  /** Lista completa de usuários (para o seletor quando não há usuário fixo). */
  usuarios: UserRecord[]
  /** Fallback para resolver o nome de pacientes já vinculados (expand cobre o resto). */
  pacientes: PacienteRecord[]
  /** Quando definido, trava a seção em um único usuário (uso no modal Editar Usuário). */
  usuarioFixo?: string
  /** Rótulos opcionais para reuso em outras telas. */
  titulo?: string
  descricao?: string
}

/** Escapa aspas para uso seguro dentro de um filtro PocketBase. */
const escaparFiltro = (texto: string) => texto.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export default function SecaoPacientesDesignados({
  usuarios,
  pacientes,
  usuarioFixo,
  titulo = 'Pacientes Designados',
  descricao,
}: SecaoPacientesDesignadosProps) {
  const { toast } = useToast()
  const [profSel, setProfSel] = useState(usuarioFixo || '')
  const [pacSel, setPacSel] = useState<{ id: string; nome: string } | null>(null)
  const [buscaPac, setBuscaPac] = useState('')
  const [debounceBusca, setDebounceBusca] = useState('')
  const [sugestoes, setSugestoes] = useState<PacienteRecord[]>([])
  const [buscando, setBuscando] = useState(false)
  const [listaAberta, setListaAberta] = useState(false)
  const [designando, setDesignando] = useState(false)
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [vinculos, setVinculos] = useState<VinculoPacienteRecord[]>([])
  const [carregandoVinculos, setCarregandoVinculos] = useState(false)
  const containerBuscaRef = useRef<HTMLDivElement>(null)

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

  // Debounce da digitação (250ms, mesmo padrão da busca do Painel Geral).
  useEffect(() => {
    const timer = setTimeout(() => setDebounceBusca(buscaPac.trim()), 250)
    return () => clearTimeout(timer)
  }, [buscaPac])

  // Busca server-side na coleção pacientes: casa qualquer parte do nome ou CPF
  // (parcial ou completo — com ou sem pontuação), sem exigir saber como começa.
  useEffect(() => {
    const q = debounceBusca
    if (q.length < MINIMO_BUSCA) {
      setSugestoes([])
      setBuscando(false)
      return
    }
    let active = true
    const buscar = async () => {
      setBuscando(true)
      try {
        const qEsc = escaparFiltro(q)
        const digitos = q.replace(/\D/g, '')
        let filtro = `(nome ~ "${qEsc}" || cpf ~ "${qEsc}")`
        // Se o usuário digitou só números (ou CPF pontuado), busca também o CPF cru.
        if (digitos && digitos !== q) {
          filtro = `(nome ~ "${qEsc}" || cpf ~ "${qEsc}" || cpf ~ "${digitos}")`
        }
        const res = await getPacientes(filtro, 'nome', LIMITE_SUGESTOES, 1)
        if (active) {
          setSugestoes(res.items)
          setListaAberta(true)
        }
      } catch (err: unknown) {
        console.warn('Erro ao buscar pacientes:', err)
        if (active) setSugestoes([])
      } finally {
        if (active) setBuscando(false)
      }
    }
    buscar()
    return () => {
      active = false
    }
  }, [debounceBusca])

  // Fecha a lista de sugestões ao clicar fora.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerBuscaRef.current && !containerBuscaRef.current.contains(e.target as Node)) {
        setListaAberta(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const usuariosDesignaveis = useMemo(
    () => usuarios.filter((u) => isProfissionalRole(u.role) || isGestorRole(u.role)),
    [usuarios],
  )

  // Pacientes já designados a este usuário não aparecem como sugestão.
  const jaVinculados = useMemo(() => new Set(vinculos.map((v) => v.paciente_id)), [vinculos])
  const sugestoesDisponiveis = useMemo(
    () => sugestoes.filter((p) => !jaVinculados.has(p.id)),
    [sugestoes, jaVinculados],
  )

  const handleEscolherPaciente = (p: PacienteRecord) => {
    setPacSel({ id: p.id, nome: p.nome })
    setBuscaPac('')
    setSugestoes([])
    setDebounceBusca('')
    setListaAberta(false)
  }

  const handleLimparSelecao = () => {
    setPacSel(null)
    setListaAberta(false)
  }

  const handleDesignar = async () => {
    if (!profSel || !pacSel) {
      toast({ title: 'Escolha o paciente para designar', variant: 'destructive' })
      return
    }
    setDesignando(true)
    try {
      const r = await designarPaciente(profSel, pacSel.id)
      toast({
        title: r === 'criado' ? 'Paciente designado!' : 'Vínculo já existia',
        description:
          r === 'criado' ? `“${pacSel.nome}” agora aparece na lista do usuário.` : undefined,
      })
      setPacSel(null)
      setBuscaPac('')
      setDebounceBusca('')
      await carregarVinculos()
      // Novo vínculo muda o que o profissional passa a ver: invalida o cache.
      invalidarCachePacientesAcessiveis()
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
      // Sem o vínculo, o profissional deixa de ver o paciente: invalida o cache.
      invalidarCachePacientesAcessiveis()
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

      {/* Designar novo paciente — autocomplete com busca por nome ou CPF */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-600">Buscar paciente (nome ou CPF)</Label>

        {!pacSel ? (
          <div ref={containerBuscaRef} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C6527]/70 pointer-events-none" />
            <Input
              value={buscaPac}
              onChange={(e) => {
                setBuscaPac(e.target.value)
                setPacSel(null)
              }}
              onFocus={() => {
                if (buscaPac.trim().length >= MINIMO_BUSCA) setListaAberta(true)
              }}
              placeholder="Digite o nome (primeiro, sobrenome ou trecho) ou o CPF…"
              className="pl-9 pr-8 rounded-xl bg-white border-[#E9E1D2] focus:border-[#C9A46A] focus:ring-1 focus:ring-[#C9A46A]"
              autoComplete="off"
            />
            {buscando ? (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C6527] animate-spin pointer-events-none" />
            ) : buscaPac ? (
              <button
                type="button"
                onClick={() => {
                  setBuscaPac('')
                  setSugestoes([])
                  setDebounceBusca('')
                  setListaAberta(false)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-md"
                title="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}

            {/* Lista de possíveis pacientes (clicáveis para escolher) */}
            {listaAberta && buscaPac.trim().length >= MINIMO_BUSCA && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E9E1D2] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="p-2 bg-[#FAF7F1] border-b border-[#E9E1D2] text-xs font-bold text-[#4A322A] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#8C6527]" />
                  Possíveis pacientes
                  {sugestoesDisponiveis.length > 0 && (
                    <span className="text-[#73574A] font-semibold">
                      ({sugestoesDisponiveis.length})
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {buscando && sugestoesDisponiveis.length === 0 ? (
                    <div className="p-5 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#C9A46A]" />
                      Buscando pacientes…
                    </div>
                  ) : sugestoesDisponiveis.length === 0 ? (
                    <div className="p-5 text-center space-y-1 text-xs text-gray-500">
                      <p className="font-medium text-gray-700">Nenhum paciente encontrado</p>
                      <p className="text-[11px] text-gray-400">
                        Tente o primeiro nome, o sobrenome ou o CPF.
                      </p>
                    </div>
                  ) : (
                    sugestoesDisponiveis.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleEscolherPaciente(p)}
                        className="w-full text-left p-2.5 px-3 hover:bg-[#FAF7F1] transition-colors cursor-pointer flex items-center gap-2.5"
                      >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#C9A46A] to-[#B87355] text-white font-bold text-[10px] shrink-0 flex items-center justify-center">
                          {getInitials(p.nome)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-[#33221C] truncate">{p.nome}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">
                            {p.cpf ? `CPF: ${formatCPF(p.cpf)}` : 'Sem CPF'}
                          </p>
                        </div>
                        {p.status && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 shrink-0',
                              p.status === 'Pré-cadastro'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            )}
                          >
                            {p.status}
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Paciente escolhido — chip com opção de trocar */
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#E3C89A] bg-[#FAF7F1] px-3 h-10">
              <User className="h-4 w-4 text-[#8C6527] shrink-0" />
              <span className="text-sm font-semibold text-[#33221C] truncate flex-1">
                {pacSel.nome}
              </span>
              <button
                type="button"
                onClick={handleLimparSelecao}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded-md shrink-0"
                title="Trocar paciente"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              onClick={handleDesignar}
              disabled={designando || !profSel}
              className="bg-[#4A322A] hover:bg-[#33221C] text-white rounded-xl h-10 gap-2"
            >
              {designando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Designar
            </Button>
          </div>
        )}
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
