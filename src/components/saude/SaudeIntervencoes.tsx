import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  atualizarSaudeCliente,
  criarContaClienteSoul,
  criarSaudeLembrete,
  criarSaudeOrientacao,
  listarSaudeLembretes,
  listarSaudeOrientacoes,
  excluirSaudeOrientacao,
  excluirSaudeLembrete,
  atualizarSaudeOrientacao,
  type SaudeClienteRecord,
  type SaudeLembreteRecord,
  type SaudeOrientacaoRecord,
} from '@/services/saudeBemEstar'
import { formatDataHoraPTBR } from '@/lib/constants'
import { Bell, Eye, EyeOff, Lightbulb, Plus, Trash2, UserPlus } from 'lucide-react'

const hojeYMD = () => new Date().toISOString().slice(0, 10)

interface Props {
  cliente: SaudeClienteRecord
  /** Chamado quando a conta do cliente é criada (para recarregar a lista). */
  onContaCriada?: () => void
}

/**
 * Espaço de INTERVENÇÃO da clínica sobre um cliente: criar conta de acesso
 * (Fase B), publicar orientações/dicas, criar lembretes — tudo o que o app do
 * Cliente Soul exibe.
 */
export function SaudeIntervencoes({ cliente, onContaCriada }: Props) {
  const { toast } = useToast()
  const [orientacoes, setOrientacoes] = useState<SaudeOrientacaoRecord[]>([])
  const [lembretes, setLembretes] = useState<SaudeLembreteRecord[]>([])

  // Form conta de acesso
  const [modalConta, setModalConta] = useState(false)
  const [contaEmail, setContaEmail] = useState(cliente.email || '')
  const [contaSenha, setContaSenha] = useState('')
  const [criandoConta, setCriandoConta] = useState(false)

  // Form orientação/dica
  const [modalTexto, setModalTexto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState<SaudeOrientacaoRecord['categoria']>('orientacao')
  const [publicarAgora, setPublicarAgora] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Form lembrete
  const [modalLembrete, setModalLembrete] = useState(false)
  const [lemTitulo, setLemTitulo] = useState('')
  const [lemDescricao, setLemDescricao] = useState('')
  const [lemDataHora, setLemDataHora] = useState('')
  const [lemRepeticao, setLemRepeticao] = useState<SaudeLembreteRecord['repeticao']>('nenhuma')

  const carregar = async () => {
    try {
      const [o, l] = await Promise.all([
        listarSaudeOrientacoes({ clienteId: cliente.id }),
        listarSaudeLembretes(cliente.id),
      ])
      setOrientacoes(o)
      setLembretes(l)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar intervenções.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.id])

  const criarConta = async () => {
    if (!contaEmail.trim() || contaSenha.length < 8) {
      toast({
        title: 'E-mail e senha (mín. 8 caracteres) são obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setCriandoConta(true)
    try {
      const res = await criarContaClienteSoul({
        saude_cliente_id: cliente.id,
        email: contaEmail.trim(),
        password: contaSenha,
        nome: cliente.nome,
      })
      if (res?.error) throw new Error(res.error)
      toast({
        title: 'Conta criada!',
        description: 'O cliente já pode entrar no app Cliente Soul com este e-mail e senha.',
      })
      setModalConta(false)
      setContaSenha('')
      onContaCriada?.()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao criar conta',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCriandoConta(false)
    }
  }

  const salvarTexto = async () => {
    if (!titulo.trim()) {
      toast({ title: 'Informe um título.', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      await criarSaudeOrientacao({
        titulo: titulo.trim(),
        texto: texto.trim() || undefined,
        categoria,
        data: `${hojeYMD()} 12:00:00.000Z`,
        cliente_id: cliente.id,
        publicada: publicarAgora,
      })
      toast({ title: 'Conteúdo publicado!', description: 'Aparece no app do cliente.' })
      setModalTexto(false)
      setTitulo('')
      setTexto('')
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar conteúdo.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const salvarLembrete = async () => {
    if (!lemTitulo.trim() || !lemDataHora) {
      toast({ title: 'Título e data/hora são obrigatórios.', variant: 'destructive' })
      return
    }
    try {
      await criarSaudeLembrete({
        cliente_id: cliente.id,
        titulo: lemTitulo.trim(),
        descricao: lemDescricao.trim() || undefined,
        data_hora: new Date(lemDataHora).toISOString(),
        repeticao: lemRepeticao,
      })
      toast({ title: 'Lembrete criado!' })
      setModalLembrete(false)
      setLemTitulo('')
      setLemDescricao('')
      setLemDataHora('')
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao criar lembrete.', variant: 'destructive' })
    }
  }

  const excluirConteudo = async (id: string) => {
    try {
      await excluirSaudeOrientacao(id)
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao excluir conteúdo.', variant: 'destructive' })
    }
  }

  const excluirLembrete = async (id: string) => {
    try {
      await excluirSaudeLembrete(id)
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao excluir lembrete.', variant: 'destructive' })
    }
  }

  const alternarPublicacao = async (o: SaudeOrientacaoRecord) => {
    try {
      await atualizarSaudeOrientacao(o.id, { publicada: !o.publicada })
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao atualizar publicação.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Bloco de conta de acesso (Fase B) */}
      {!cliente.user_id && (
        <Card className="border-dashed border-[#C9A46A]">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-medium text-[#33221C]">Acesso ao app Cliente Soul</p>
              <p className="text-xs text-[#73574A]">
                Crie o e-mail e a senha que o cliente usará para entrar no app dele.
              </p>
            </div>
            <Button size="sm" onClick={() => setModalConta(true)}>
              <UserPlus className="h-4 w-4 mr-1" /> Criar acesso
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orientações / Dicas */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#C9A46A]" /> Orientações & Dicas
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setModalTexto(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo conteúdo
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {orientacoes.length === 0 ? (
            <p className="text-sm text-[#73574A] italic">
              Nenhuma orientação/dica publicada para este cliente ainda.
            </p>
          ) : (
            orientacoes.map((o) => (
              <div
                key={o.id}
                className="rounded-lg border border-[#73574A]/10 bg-[#FAF7F1] p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#33221C]">{o.titulo}</span>
                    <span className="rounded-full bg-[#C9A46A]/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#73574A]">
                      {labelCategoria(o.categoria)}
                    </span>
                    {!o.publicada && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] text-yellow-800">
                        rascunho
                      </span>
                    )}
                  </div>
                  {o.texto && (
                    <p className="text-sm text-[#73574A] mt-1 whitespace-pre-wrap">{o.texto}</p>
                  )}
                  <p className="text-[11px] text-[#73574A]/60 mt-1">{formatDataHoraPTBR(o.data)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => alternarPublicacao(o)}
                    title={o.publicada ? 'Despublicar' : 'Publicar'}
                  >
                    {o.publicada ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-[#73574A]/50 hover:text-red-600"
                    onClick={() => excluirConteudo(o.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Lembretes */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#C9A46A]" /> Lembretes
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setModalLembrete(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo lembrete
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {lembretes.length === 0 ? (
            <p className="text-sm text-[#73574A] italic">Nenhum lembrete para este cliente.</p>
          ) : (
            lembretes.map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-[#73574A]/10 bg-[#FAF7F1] p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#33221C]">{l.titulo}</p>
                  {l.descricao && (
                    <p className="text-sm text-[#73574A] whitespace-pre-wrap">{l.descricao}</p>
                  )}
                  <p className="text-[11px] text-[#73574A]/60 mt-1">
                    {formatDataHoraPTBR(l.data_hora)}
                    {l.repeticao && l.repeticao !== 'nenhuma' ? ` • repete: ${l.repeticao}` : ''}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-[#73574A]/50 hover:text-red-600"
                  onClick={() => excluirLembrete(l.id)}
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal criar conta */}
      <Dialog open={modalConta} onOpenChange={setModalConta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar acesso do Cliente Soul</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>E-mail de acesso *</Label>
              <Input
                type="email"
                value={contaEmail}
                onChange={(e) => setContaEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Senha (mín. 8 caracteres) *</Label>
              <Input
                type="password"
                value={contaSenha}
                onChange={(e) => setContaSenha(e.target.value)}
              />
            </div>
            <p className="text-xs text-[#73574A]">
              Passe estes dados ao cliente. Ele entrará pela página "Cliente Soul" do app.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConta(false)}>
              Cancelar
            </Button>
            <Button onClick={criarConta} disabled={criandoConta}>
              {criandoConta ? 'Criando...' : 'Criar conta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal orientação/dica */}
      <Dialog open={modalTexto} onOpenChange={setModalTexto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo conteúdo para o cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as SaudeOrientacaoRecord['categoria'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orientacao">Orientação</SelectItem>
                  <SelectItem value="dica">Dica</SelectItem>
                  <SelectItem value="desenvolvimento_pessoal">Desenvolvimento pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div>
              <Label>Texto</Label>
              <Textarea rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#73574A]">
              <input
                type="checkbox"
                checked={publicarAgora}
                onChange={(e) => setPublicarAgora(e.target.checked)}
              />
              Publicar agora (visível no app do cliente)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalTexto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarTexto} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal lembrete */}
      <Dialog open={modalLembrete} onOpenChange={setModalLembrete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lembrete</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={lemTitulo} onChange={(e) => setLemTitulo(e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={lemDescricao}
                onChange={(e) => setLemDescricao(e.target.value)}
              />
            </div>
            <div>
              <Label>Data e hora *</Label>
              <Input
                type="datetime-local"
                value={lemDataHora}
                onChange={(e) => setLemDataHora(e.target.value)}
              />
            </div>
            <div>
              <Label>Repetição</Label>
              <Select
                value={lemRepeticao}
                onValueChange={(v) => setLemRepeticao(v as SaudeLembreteRecord['repeticao'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Não repete</SelectItem>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalLembrete(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarLembrete}>Criar lembrete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function labelCategoria(c: SaudeOrientacaoRecord['categoria']) {
    if (c === 'dica') return 'Dica'
    if (c === 'desenvolvimento_pessoal') return 'Dev. Pessoal'
    return 'Orientação'
  }
}
