/**
 * Tela de Gestão (exclusiva ADM/Secretária).
 * Abas: Usuários (criar/editar com perfil), Designações (vínculos de pacientes
 * a profissionais) e Acesso (com Painel de Acessos & Governança embutido).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Plus, Search, Trash2, UserPlus, ShieldCheck, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/constants'
import { isProfissionalRole, isGestorRole, roleLabel } from '@/lib/roles'
import PainelAcesso from '@/components/PainelAcesso'
import Acessos, { isAcessosSubTab, type AcessosSubTab } from '@/pages/Acessos'
import SecaoPacientesDesignados from '@/components/gestao/SecaoPacientesDesignados'
import { PainelRelatoriosAdmin } from '@/components/relatorios/PainelRelatoriosAdmin'
import type { UserRecord } from '@/types/database'
import pb from '@/lib/pocketbase/client'
import type { PacienteRecord } from '@/types/database'
import {
  OPCOES_PERFIL,
  OPCOES_ESPECIALIDADE,
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  listarVinculos,
  designarPaciente,
  removerVinculo,
  VinculoPacienteRecord,
} from '@/services/gestao'

type TabKey = 'usuarios' | 'designacoes' | 'acesso' | 'relatorios'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'usuarios', label: 'Usuários & Perfis' },
  { key: 'designacoes', label: 'Pacientes designados' },
  { key: 'acesso', label: 'Acesso' },
  { key: 'relatorios', label: 'Relatórios' },
]

export default function Gestao() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Aba ativa vem da URL (?tab=acesso), com fallback para 'usuarios'.
  const tab = (searchParams.get('tab') as TabKey) || 'usuarios'
  const setTab = (t: TabKey) => {
    const params = new URLSearchParams(searchParams)
    if (t === 'usuarios') params.delete('tab')
    else params.set('tab', t)
    if (t !== 'acesso' && t !== 'relatorios') params.delete('sub')
    setSearchParams(params, { replace: true })
  }

  // Sub-aba do painel de Acessos embutido na aba Acesso (?tab=acesso&sub=...).
  const subParam = searchParams.get('sub')
  const subAcesso: AcessosSubTab = isAcessosSubTab(subParam) ? subParam : 'pendentes'
  const setSubAcesso = (s: AcessosSubTab) => {
    const params = new URLSearchParams(searchParams)
    if (s === 'pendentes') params.delete('sub')
    else params.set('sub', s)
    setSearchParams(params, { replace: true })
  }
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<UserRecord[]>([])
  const [pacientes, setPacientes] = useState<PacienteRecord[]>([])
  const [vinculos, setVinculos] = useState<VinculoPacienteRecord[]>([])
  const [busca, setBusca] = useState('')

  // modal de usuário
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<UserRecord | null>(null)
  const [fNome, setFNome] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fSenha, setFSenha] = useState('')
  const [fPerfil, setFPerfil] = useState<'adm' | 'secretaria' | 'profissional'>('profissional')
  const [fEspecialidade, setFEspecialidade] = useState('Fisioterapia')
  const [salvando, setSalvando] = useState(false)
  // Após CRIAR um usuário, o modal reabre em modo EDIÇÃO para permitir
  // designar pacientes de imediato (vínculo só faz sentido com usuário salvo).
  const [usuarioCriado, setUsuarioCriado] = useState<UserRecord | null>(null)
  const [modalPosCriacao, setModalPosCriacao] = useState(false)

  // designar
  const [profDesignar, setProfDesignar] = useState('')
  const [pacDesignar, setPacDesignar] = useState('')

  const profissionais = useMemo(
    () => usuarios.filter((u) => isProfissionalRole(u.role) || isGestorRole(u.role)),
    [usuarios],
  )

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [us, pacRes, vin] = await Promise.all([
        listarUsuarios(),
        pb.collection('pacientes').getFullList<PacienteRecord>({ sort: 'nome' }),
        listarVinculos(),
      ])
      setUsuarios(us)
      setPacientes(pacRes)
      setVinculos(vin)
    } catch (err: unknown) {
      console.error('Erro ao carregar gestão:', err)
      toast({
        title: 'Erro ao carregar dados de gestão',
        description: (err as Error)?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Reabre o modal, em modo EDIÇÃO, logo após criar um usuário novo.
  useEffect(() => {
    if (!modalPosCriacao || !usuarioCriado) return
    const alvo = usuarios.find((u) => u.id === usuarioCriado.id)
    setModalPosCriacao(false)
    if (alvo) abrirEditarUsuario(alvo)
  }, [modalPosCriacao, usuarioCriado, usuarios])

  const abrirNovoUsuario = () => {
    setEditando(null)
    setFNome('')
    setFEmail('')
    setFSenha('')
    setFPerfil('profissional')
    setFEspecialidade('Fisioterapia')
    setModalOpen(true)
  }

  const abrirEditarUsuario = (u: UserRecord) => {
    setEditando(u)
    setFNome(u.name || '')
    setFEmail(u.email || '')
    setFSenha('')
    setFPerfil(
      u.role === 'secretaria'
        ? 'secretaria'
        : u.role === 'profissional' || u.role === 'professional'
          ? 'profissional'
          : 'adm',
    )
    setFEspecialidade(u.especialidade || 'Fisioterapia')
    setModalOpen(true)
  }

  const salvarUsuario = async () => {
    // Na EDIÇÃO, o ADM pode salvar qualquer alteração (perfil, nome, especialidade,
    // senha etc.) sem a validação travar campos que não está alterando — inclusive
    // quando o e-mail vem oculto do backend. Na CRIAÇÃO, nome, e-mail e senha
    // continuam obrigatórios.
    if (!editando && !fNome.trim()) {
      toast({ title: 'Preencha o nome do usuário', variant: 'destructive' })
      return
    }
    if (!editando && !fEmail.trim()) {
      toast({ title: 'Preencha o e-mail do usuário', variant: 'destructive' })
      return
    }
    if (!editando && fSenha.length < 8) {
      toast({ title: 'A senha deve ter ao menos 8 caracteres', variant: 'destructive' })
      return
    }
    if (editando && fSenha && fSenha.length < 8) {
      toast({ title: 'A nova senha deve ter ao menos 8 caracteres', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await atualizarUsuario(editando.id, {
          ...(fNome.trim() ? { name: fNome.trim() } : {}),
          role: fPerfil,
          especialidade: fEspecialidade,
          ...(fSenha ? { password: fSenha, passwordConfirm: fSenha } : {}),
        })
        toast({ title: 'Usuário atualizado!' })
      } else {
        const novo = await criarUsuario({
          name: fNome.trim(),
          email: fEmail.trim(),
          password: fSenha,
          passwordConfirm: fSenha,
          role: fPerfil,
          especialidade: fEspecialidade,
          access_status: 'approved',
        })
        toast({ title: 'Usuário criado!', description: `${fNome.trim()} já pode fazer login.` })
        // Após CRIAR, reabre o modal em modo EDIÇÃO para designar pacientes
        // de imediato (vínculo só faz sentido com usuário já salvo).
        setUsuarioCriado(novo)
        setModalPosCriacao(true)
        setModalOpen(false)
        await carregar()
        return
      }
      setModalOpen(false)
      await carregar()
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { message?: string } }
      toast({
        title: 'Erro ao salvar usuário',
        description: e?.response?.message || e?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleDesignar = async () => {
    if (!profDesignar || !pacDesignar) {
      toast({ title: 'Escolha o profissional e o paciente', variant: 'destructive' })
      return
    }
    try {
      const r = await designarPaciente(profDesignar, pacDesignar)
      toast({
        title: r === 'criado' ? 'Paciente designado!' : 'Vínculo já existia',
        description:
          r === 'criado' ? 'O paciente agora aparece na lista do profissional.' : undefined,
      })
      setPacDesignar('')
      await carregar()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao designar',
        description: (err as Error)?.message,
        variant: 'destructive',
      })
    }
  }

  const nomeUsuario = (id: string) => usuarios.find((u) => u.id === id)?.name || '—'
  const nomePaciente = (id: string) => pacientes.find((p) => p.id === id)?.nome || '—'

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busca.trim().toLowerCase()
    if (!q) return true
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      roleLabel(u.role).toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#4A322A]">Gestão da Clínica</h1>
        <p className="text-sm text-gray-500">
          Usuários, perfis e designação de pacientes a profissionais.
        </p>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              tab === t.key
                ? 'bg-[#4A322A] text-white border-[#4A322A] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#C9A46A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#C9A46A]" />
        </div>
      ) : (
        <>
          {/* ============ USUÁRIOS ============ */}
          {tab === 'usuarios' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, e-mail ou perfil"
                    className="pl-9 rounded-xl"
                  />
                </div>
                <Button
                  onClick={abrirNovoUsuario}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-10 gap-2"
                >
                  <UserPlus className="h-4 w-4" /> Novo Usuário
                </Button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {usuariosFiltrados.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 rounded-xl border border-gray-200">
                        <AvatarFallback className="bg-[#FAF4EA] text-[#8C6527] text-xs font-bold">
                          {getInitials(u.name || u.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {u.name || 'Sem nome'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.especialidade && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-[#E3C89A] text-[#8C6527]"
                        >
                          {u.especialidade}
                        </Badge>
                      )}
                      <Badge
                        className={`text-[10px] font-bold ${
                          isGestorRole(u.role)
                            ? 'bg-[#4A322A] text-white'
                            : 'bg-[#FAF4EA] text-[#8C6527] border border-[#E3C89A]'
                        }`}
                      >
                        {u.role === 'adm' || u.role === 'admin' ? (
                          <ShieldCheck className="h-3 w-3 mr-1 inline" />
                        ) : null}
                        {roleLabel(u.role)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => abrirEditarUsuario(u)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <p className="p-8 text-center text-sm text-gray-400">
                    Nenhum usuário encontrado.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ============ DESIGNAÇÕES ============ */}
          {tab === 'designacoes' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Profissional</Label>
                  <Select value={profDesignar} onValueChange={setProfDesignar}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {profissionais.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || u.email} ({roleLabel(u.role)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Paciente</Label>
                  <Select value={pacDesignar} onValueChange={setPacDesignar}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} {p.status ? `· ${p.status}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleDesignar}
                  className="bg-[#4A322A] hover:bg-[#33221C] text-white rounded-xl h-10 gap-2"
                >
                  <Plus className="h-4 w-4" /> Designar
                </Button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {vinculos.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {nomePaciente(v.paciente_id)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Designado a{' '}
                        <span className="font-medium text-[#8C6527]">
                          {nomeUsuario(v.profissional_id)}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => {
                        await removerVinculo(v.id)
                        toast({ title: 'Vínculo removido' })
                        carregar()
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {vinculos.length === 0 && (
                  <p className="p-8 text-center text-sm text-gray-400">
                    Nenhum paciente designado ainda. Use o formulário acima.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ============ RELATÓRIOS ============ */}
          {/* Painel completo de Relatórios do gestor (indicadores, filtros,
              gráficos, frequência e exportações Excel/PDF), movido de
              /relatorios (v0.0.137 — padrão da aba Acesso).
              Deep-link: /gestao?tab=relatorios (a rota antiga redireciona). */}
          {tab === 'relatorios' && <PainelRelatoriosAdmin />}

          {/* ============ ACESSO ============ */}
          {/* PainelAcesso (link público de pré-avaliação) + painel completo de
              Acessos & Governança (pendentes/ativos/suspensos, Atualizações
              Clínicas e Auditoria de Acessos), embutido sem o cabeçalho próprio.
              Deep-link: /gestao?tab=acesso&sub=atualizacoes */}
          {tab === 'acesso' && (
            <div className="space-y-6">
              <PainelAcesso />

              <Acessos embedded subTab={subAcesso} onSubTabChange={setSubAcesso} />
            </div>
          )}
        </>
      )}

      {/* Modal de Usuário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editando
                ? 'Altere nome, perfil, especialidade ou defina uma nova senha.'
                : 'Crie o acesso (login e senha) e escolha o perfil do usuário.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={fNome}
                onChange={(e) => setFNome(e.target.value)}
                placeholder="Nome completo"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
                type="email"
                placeholder="email@clinica.com"
                disabled={!!editando}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editando ? 'Nova senha (opcional)' : 'Senha'}</Label>
              <Input
                value={fSenha}
                onChange={(e) => setFSenha(e.target.value)}
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select value={fPerfil} onValueChange={(v) => setFPerfil(v as typeof fPerfil)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_PERFIL.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Especialidade</Label>
                <Select value={fEspecialidade} onValueChange={setFEspecialidade}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_ESPECIALIDADE.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pacientes designados (só na edição — vínculo precisa do usuário já salvo) */}
          {editando && (
            <div className="border-t border-gray-100 pt-3">
              <SecaoPacientesDesignados
                usuarios={usuarios}
                pacientes={pacientes}
                usuarioFixo={editando.id}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={salvarUsuario}
              disabled={salvando}
              className="rounded-xl bg-[#4A322A] hover:bg-[#33221C] text-white"
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editando ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
