import { useEffect, useState } from 'react'
import {
  Activity,
  Bell,
  BookOpen,
  ClipboardList,
  Droplets,
  Dumbbell,
  Moon,
  Plus,
  Stethoscope,
  Utensils,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDataPTBR, formatDataHoraPTBR } from '@/lib/constants'
import {
  carregarMeuPainel,
  criarSaudeRegistro,
  atualizarSaudeDevPessoal,
  labelTipoRegistro,
  TIPOS_REGISTRO,
  type MeuPerfilSaude,
  type SaudeRegistroTipo,
} from '@/services/saudeBemEstar'
import { ICONES_TIPO } from '@/components/saude/SaudeResumoIcones'

const hojeYMD = () => new Date().toISOString().slice(0, 10)

const rotulosCategoria: Record<string, string> = {
  orientacao: 'Orientação',
  dica: 'Dica',
  desenvolvimento_pessoal: 'Desenvolvimento Pessoal',
}

const integracoes = [
  { nome: 'Garmin Connect', cor: 'text-[#007CC3]' },
  { nome: 'Google Fit', cor: 'text-[#4285F4]' },
  { nome: 'Google Health', cor: 'text-[#34A853]' },
  { nome: 'Apple Health', cor: 'text-[#1D1D1F]' },
]

/** Ambiente logado do Cliente Soul — layout EXCLUSIVO (verde/creme). */
export function ClienteSoulApp() {
  const { toast } = useToast()
  const [perfil, setPerfil] = useState<MeuPerfilSaude | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<'hoje' | 'exames' | 'conteudo' | 'integracoes'>('hoje')
  const [modalRegistro, setModalRegistro] = useState(false)
  const [novoTipo, setNovoTipo] = useState<SaudeRegistroTipo>('atividade_fisica')
  const [novaData, setNovaData] = useState(hojeYMD())
  const [novaObs, setNovaObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      setPerfil(await carregarMeuPainel())
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar seu painel',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const salvarRegistro = async () => {
    if (!perfil) return
    setSalvando(true)
    try {
      await criarSaudeRegistro({
        cliente_id: perfil.cliente.id,
        tipo: novoTipo,
        data: `${novaData} 12:00:00.000Z`,
        observacao: novaObs.trim() || undefined,
      })
      toast({ title: 'Registro salvo! Sua clínica já pode vê-lo.' })
      setModalRegistro(false)
      setNovaObs('')
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar registro.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const concluirDev = async (id: string, concluido: boolean) => {
    try {
      await atualizarSaudeDevPessoal(id, { status: concluido ? 'concluido' : 'ativo' })
      await carregar()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao atualizar.', variant: 'destructive' })
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center">
        <p className="text-[#5C7263]">Carregando seu painel...</p>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center p-4">
        <p className="text-[#5C7263] text-center">
          Nenhum cadastro de Cliente Soul vinculado a esta conta.
          <br />
          Fale com a clínica.
        </p>
      </div>
    )
  }

  const { cliente, registros, orientacoes, lembretes, devPessoal } = perfil

  const exames = orientacoes.filter((o) => o.categoria === 'exame')
  const conteudos = orientacoes.filter((o) => o.categoria !== 'exame')
  const devAtivos = devPessoal.filter((d) => d.status === 'ativo')
  const devConcluidos = devPessoal.filter((d) => d.status === 'concluido')

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF3EC] via-[#F6F1E7] to-[#FDFBF6] pb-24">
      {/* Header do cliente */}
      <header className="bg-[#2C4A3B] text-white px-4 py-6 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[#3E7C59] flex items-center justify-center">
              <span className="text-lg font-bold">{cliente.nome.slice(0, 1).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">Cliente Soul</p>
              <h1 className="text-lg font-semibold leading-tight">{cliente.nome}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
        {/* Lembretes em destaque */}
        {lembretes.length > 0 && (
          <Card className="border-[#C9A46A] bg-white/90">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Bell className="h-4 w-4 text-[#C9A46A]" />
              <CardTitle className="text-sm">Lembretes da clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lembretes.slice(0, 3).map((l) => (
                <div key={l.id} className="rounded-lg bg-[#FDF6E9] border border-[#C9A46A]/30 p-3">
                  <p className="text-sm font-medium text-[#33221C]">{l.titulo}</p>
                  {l.descricao && (
                    <p className="text-xs text-[#73574A] mt-0.5 whitespace-pre-wrap">
                      {l.descricao}
                    </p>
                  )}
                  <p className="text-[10px] text-[#73574A]/60 mt-1">
                    {formatDataHoraPTBR(l.data_hora)}
                    {l.repeticao && l.repeticao !== 'nenhuma' ? ` • repete: ${l.repeticao}` : ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navegação */}
        <div className="flex gap-2 overflow-x-auto">
          {(
            [
              { v: 'hoje', l: 'Meu dia' },
              { v: 'exames', l: 'Meus exames' },
              { v: 'conteudo', l: 'Orientações & Dicas' },
              { v: 'integracoes', l: 'Integrações' },
            ] as const
          ).map((t) => (
            <button
              key={t.v}
              onClick={() => setAba(t.v)}
              className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
                aba === t.v
                  ? 'bg-[#3E7C59] text-white'
                  : 'bg-white/70 text-[#5C7263] hover:bg-white'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Aba: Meu dia */}
        {aba === 'hoje' && (
          <>
            <Button
              onClick={() => setModalRegistro(true)}
              className="w-full h-12 rounded-xl bg-[#3E7C59] hover:bg-[#33684A] text-white"
            >
              <Plus className="h-5 w-5 mr-2" /> Registrar meu dia
            </Button>

            <div className="grid grid-cols-2 gap-3">
              {TIPOS_REGISTRO.map((t) => {
                const qtd = registros.filter((r) => r.tipo === t.value).length
                const Icone = ICONES_TIPO[t.value]
                return (
                  <Card key={t.value} className="bg-white/80">
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className="rounded-full bg-[#3E7C59]/10 p-2.5">
                        <Icone className="h-5 w-5 text-[#3E7C59]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#2C4A3B] leading-none">{qtd}</p>
                        <p className="text-xs text-[#5C7263] mt-1">{t.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Desenvolvimento pessoal */}
            <Card className="bg-white/80">
              <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
                <BookOpen className="h-4 w-4 text-[#3E7C59]" />
                <CardTitle className="text-sm">Meu desenvolvimento pessoal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {devAtivos.length === 0 && devConcluidos.length === 0 ? (
                  <p className="text-sm text-[#5C7263] italic">
                    Nenhum desafio ou meta no momento.
                  </p>
                ) : (
                  <>
                    {devAtivos.map((d) => (
                      <label
                        key={d.id}
                        className="flex items-start gap-3 rounded-lg bg-[#F0F5F0] p-3"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={false}
                          onChange={() => concluirDev(d.id, true)}
                        />
                        <div>
                          <p className="text-sm font-medium text-[#2C4A3B]">{d.titulo}</p>
                          {d.descricao && (
                            <p className="text-xs text-[#5C7263] whitespace-pre-wrap">
                              {d.descricao}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                    {devConcluidos.slice(0, 3).map((d) => (
                      <label
                        key={d.id}
                        className="flex items-start gap-3 rounded-lg bg-white p-3 opacity-70"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked
                          onChange={() => concluirDev(d.id, false)}
                        />
                        <p className="text-sm text-[#2C4A3B] line-through">{d.titulo}</p>
                      </label>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Últimos registros */}
            <Card className="bg-white/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Histórico recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {registros.slice(0, 8).map((r) => {
                  const Icone = ICONES_TIPO[r.tipo]
                  return (
                    <div key={r.id} className="flex items-start gap-3">
                      <Icone className="h-4 w-4 text-[#3E7C59] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-[#2C4A3B]">
                          <span className="font-medium">{labelTipoRegistro(r.tipo)}</span>
                          {r.observacao ? ` — ${r.observacao}` : ''}
                        </p>
                        <p className="text-[10px] text-[#5C7263]/70">
                          {formatDataHoraPTBR(r.data)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {registros.length === 0 && (
                  <p className="text-sm text-[#5C7263] italic">Comece registrando seu dia! 🌱</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Aba: Exames */}
        {aba === 'exames' && (
          <Card className="bg-white/80">
            <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
              <Stethoscope className="h-4 w-4 text-[#3E7C59]" />
              <CardTitle className="text-sm">Meus exames</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exames.length === 0 ? (
                <p className="text-sm text-[#5C7263] italic">
                  Nenhum exame disponível ainda. Sua clínica pode inseri-los aqui.
                </p>
              ) : (
                exames.map((o) => (
                  <div key={o.id} className="rounded-lg bg-[#F0F5F0] p-3">
                    <p className="text-sm font-medium text-[#2C4A3B]">{o.titulo}</p>
                    {o.texto && (
                      <p className="text-sm text-[#5C7263] whitespace-pre-wrap mt-0.5">{o.texto}</p>
                    )}
                    <p className="text-[10px] text-[#5C7263]/60 mt-1">{formatDataPTBR(o.data)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Aba: Orientações & Dicas */}
        {aba === 'conteudo' && (
          <div className="space-y-3">
            {conteudos.length === 0 ? (
              <Card className="bg-white/80">
                <CardContent className="py-8 text-center text-sm text-[#5C7263]">
                  Nenhuma orientação ou dica publicada pela clínica ainda.
                </CardContent>
              </Card>
            ) : (
              conteudos.map((o) => (
                <Card key={o.id} className="bg-white/80">
                  <CardHeader className="pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm">{o.titulo}</CardTitle>
                      <Badge className="bg-[#3E7C59]/15 text-[#2C4A3B] hover:bg-[#3E7C59]/25">
                        {rotulosCategoria[o.categoria] || o.categoria}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {o.texto && (
                      <p className="text-sm text-[#5C7263] whitespace-pre-wrap">{o.texto}</p>
                    )}
                    <p className="text-[10px] text-[#5C7263]/60 mt-2">{formatDataPTBR(o.data)}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Aba: Integrações (em breve) */}
        {aba === 'integracoes' && (
          <div className="space-y-3">
            <Card className="bg-white/80 border-dashed border-[#3E7C59]/30">
              <CardContent className="py-4 text-center">
                <p className="text-sm font-medium text-[#2C4A3B]">Integrações em breve 🚀</p>
                <p className="text-xs text-[#5C7263] mt-1">
                  Em breve você poderá conectar seus apps de saúde e trazer seus dados
                  automaticamente. Por enquanto, registre tudo manualmente aqui.
                </p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              {integracoes.map((i) => (
                <Card key={i.nome} className="bg-white/60 opacity-80">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="rounded-full bg-[#3E7C59]/10 p-2">
                      <Dumbbell className="h-4 w-4 text-[#3E7C59]" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${i.cor}`}>{i.nome}</p>
                      <p className="text-[10px] text-[#5C7263]">em breve</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal registrar */}
      <Dialog open={modalRegistro} onOpenChange={setModalRegistro}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar meu dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_REGISTRO.map((t) => {
                const Icone = ICONES_TIPO[t.value]
                const ativo = novoTipo === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setNovoTipo(t.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition-colors ${
                      ativo
                        ? 'border-[#3E7C59] bg-[#3E7C59]/10 text-[#2C4A3B]'
                        : 'border-[#3E7C59]/15 text-[#5C7263] hover:border-[#3E7C59]/40'
                    }`}
                  >
                    <Icone className="h-5 w-5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
            <div>
              <Label className="text-[#2C4A3B]">Data</Label>
              <Input
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
            <div>
              <Label className="text-[#2C4A3B]">Descrição</Label>
              <Textarea
                rows={3}
                value={novaObs}
                onChange={(e) => setNovaObs(e.target.value)}
                placeholder="Ex.: dormi 8 horas, caminhei 30 min..."
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalRegistro(false)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarRegistro}
              disabled={salvando}
              className="bg-[#3E7C59] hover:bg-[#33684A] text-white"
            >
              {salvando ? 'Salvando...' : 'Salvar registro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClienteSoulApp
