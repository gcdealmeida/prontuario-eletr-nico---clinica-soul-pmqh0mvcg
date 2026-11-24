import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Dumbbell, HeartPulse, Plus, Stethoscope, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { formatDataHoraPTBR } from '@/lib/constants'
import {
  criarExameClinico,
  criarTreinoClinico,
  excluirSaudeRegistro,
  type ItemTreino,
  type SaudeClienteRecord,
  type SaudeRegistroRecord,
} from '@/services/saudeBemEstar'
import {
  colecaoHtrParaTipo,
  enviarRegistroHealthTracker,
  mensagemErroHealthTracker,
} from '@/services/healthTracker'
import { typeHtrParaTipo, categoriaHtrParaTipo } from '@/lib/saudeHtrVocab'

interface Props {
  cliente: SaudeClienteRecord
  /** Registros já carregados da visão geral (para listar o que foi prescrito). */
  registros: SaudeRegistroRecord[]
  /** Chamado após gravar/excluir, para recarregar a lista geral. */
  onAtualizado?: () => void
}

const ehPrescrito = (r: SaudeRegistroRecord) =>
  (r.tipo === 'treino' || r.tipo === 'reabilitacao' || r.tipo === 'exame') &&
  (r.dados_json as Record<string, unknown> | null | undefined)?._origem === 'clinica'

const EXCLUIR = 'Excluir'

/** Lista os exercícios de um treino em texto corrido ("3x12 — Agachamento"). */
export function resumoExercicios(items: ItemTreino[] | undefined): string {
  if (!items || items.length === 0) return ''
  return items
    .map((i) => {
      const serie = i.series || ''
      const rep = i.repeticoes || ''
      const dosagem = serie && rep ? `${serie}x${rep}` : serie || rep || ''
      return [i.nome, dosagem, i.carga].filter(Boolean).join(' — ')
    })
    .join('\n')
}

/**
 * Envio "best effort" ao Health Tracker (outro projeto Skip): chamado APÓS
 * o registro local já ter sido gravado — uma falha aqui NÃO desfaz nada,
 * apenas gera um aviso discreto para o usuário.
 */
async function sincronizarHealthTracker(
  clienteId: string,
  tipo: 'treino' | 'reabilitacao' | 'exame',
  payload: Record<string, unknown>,
  nomeProfissional: string,
  dataLancamento?: string,
): Promise<string> {
  try {
    await enviarRegistroHealthTracker({
      cliente_id: clienteId,
      collection: colecaoHtrParaTipo(tipo),
      tipo: tipo,
      payload: {
        // Vocabulário do Health Tracker já no envio (espelha o hook): type é
        // enum na coleção — valor cru ("treino") é recusado com "Invalid
        // value". O hook re-garanta como última linha de defesa.
        type: typeHtrParaTipo(tipo),
        category: categoriaHtrParaTipo(tipo),
        ...payload,
      },
      professional_name: nomeProfissional,
      data_lancamento: dataLancamento,
    })
    return ''
  } catch (err) {
    console.error('Falha ao enviar registro ao Health Tracker:', err)
    return mensagemErroHealthTracker(err)
  }
}

/**
 * Painel de PRESCRIÇÃO da clínica na visão individual do cliente:
 * treinos físicos, exercícios de reabilitação e exames que o profissional
 * insere aqui e aparecem automaticamente no app do cliente (SOUL HTR).
 */
export function SaudePrescricaoTreinos({ cliente, registros, onAtualizado }: Props) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [avisoHealthTracker, setAvisoHealthTracker] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalTipo, setModalTipo] = useState<'treino' | 'reabilitacao' | 'exame'>('treino')
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState('')

  // Form
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [resultado, setResultado] = useState('')
  const [exercicios, setExercicios] = useState<ItemTreino[]>([])

  const prescritos = registros.filter(ehPrescrito)

  const abrir = useCallback((tipo: 'treino' | 'reabilitacao' | 'exame') => {
    setModalTipo(tipo)
    setTitulo('')
    setDescricao('')
    setResultado('')
    setExercicios([])
    setModalAberto(true)
  }, [])

  const salvar = async () => {
    if (!titulo.trim()) {
      toast({ title: 'Informe o título.', variant: 'destructive' })
      return
    }
    setSalvando(true)
    let aviso = ''
    try {
      // 1) Grava localmente (fonte da verdade desta clínica).
      if (modalTipo === 'exame') {
        await criarExameClinico({
          cliente_id: cliente.id,
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          resultado: resultado.trim() || undefined,
        })
      } else {
        await criarTreinoClinico({
          cliente_id: cliente.id,
          tipo: modalTipo,
          observacao: titulo.trim(),
          dados: {
            titulo: titulo.trim(),
            descricao: descricao.trim() || undefined,
            exercicios: exercicios.filter((e) => e.nome.trim()),
            resultado: resultado.trim() || undefined,
          },
        })
      }
      toast({ title: 'Prescrição enviada!', description: 'Já aparece no app do cliente.' })
      setModalAberto(false)
      onAtualizado?.()

      // 2) Best effort: espelha no Health Tracker com o nome do profissional
      //    logado. Falha aqui NÃO desfaz o registro local — só avisa.
      aviso = await sincronizarHealthTracker(
        cliente.id,
        modalTipo,
        {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          exercicios: exercicios.filter((e) => e.nome.trim()),
          resultado: resultado.trim() || undefined,
        },
        user?.name || '',
        // Data do lançamento (não do envio): a gravação local usa hoje ao
        // meio-dia (mesmo padrão de criarTreinoClinico/criarExameClinico).
        new Date().toISOString(),
      )
      if (aviso) setAvisoHealthTracker(aviso)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar prescrição.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (id: string) => {
    setExcluindoId(id)
    try {
      await excluirSaudeRegistro(id)
      onAtualizado?.()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao excluir.', variant: 'destructive' })
    } finally {
      setExcluindoId('')
    }
  }

  const podeSalvar = titulo.trim().length > 0 && !salvando

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-[#C9A46A]" /> Treinos, Reabilitação & Exames
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => abrir('treino')}>
            <Plus className="h-4 w-4 mr-1" /> Treino
          </Button>
          <Button size="sm" variant="outline" onClick={() => abrir('reabilitacao')}>
            <Plus className="h-4 w-4 mr-1" /> Reabilitação
          </Button>
          <Button size="sm" variant="outline" onClick={() => abrir('exame')}>
            <Plus className="h-4 w-4 mr-1" /> Exame
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-[#73574A]/80">
          O que você prescrever aqui aparece automaticamente no app do cliente (aba Exames & Dietas
          e seção Treinos & Reabilitação) e também é enviado ao Health Tracker.
        </p>
        {avisoHealthTracker && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">
              Registro gravado na clínica, mas o envio ao Health Tracker falhou:{' '}
              {avisoHealthTracker}
            </span>
            <button
              type="button"
              className="ml-auto shrink-0 text-amber-800/70 hover:text-amber-900"
              onClick={() => setAvisoHealthTracker('')}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}
        {prescritos.length === 0 ? (
          <p className="text-sm text-[#73574A] italic">
            Nenhuma prescrição enviada a este cliente ainda.
          </p>
        ) : (
          prescritos.map((r) => {
            const d = (r.dados_json || {}) as Record<string, unknown>
            const exerciciosTexto = resumoExercicios(d.exercicios as ItemTreino[] | undefined)
            return (
              <div
                key={r.id}
                className="rounded-lg border border-[#73574A]/10 bg-[#FAF7F1] p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#33221C]">
                      {r.observacao || String(d.titulo || '')}
                    </span>
                    <span className="rounded-full bg-[#C9A46A]/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#73574A]">
                      {r.tipo === 'treino'
                        ? 'Treino Físico'
                        : r.tipo === 'reabilitacao'
                          ? 'Reabilitação'
                          : 'Exame'}
                    </span>
                  </div>
                  {typeof d.descricao === 'string' && d.descricao && (
                    <p className="text-sm text-[#73574A] mt-1 whitespace-pre-wrap">{d.descricao}</p>
                  )}
                  {exerciciosTexto && (
                    <pre className="mt-1 text-xs text-[#73574A] whitespace-pre-wrap font-sans">
                      {exerciciosTexto}
                    </pre>
                  )}
                  {typeof d.resultado === 'string' && d.resultado && (
                    <p className="text-xs text-[#73574A]/80 mt-1">Resultado: {d.resultado}</p>
                  )}
                  <p className="text-[11px] text-[#73574A]/60 mt-1">{formatDataHoraPTBR(r.data)}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-[#73574A]/50 hover:text-red-600"
                  onClick={() => void excluir(r.id)}
                  disabled={excluindoId === r.id}
                  title={EXCLUIR}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })
        )}
      </CardContent>

      {/* Modal de prescrição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              {modalTipo === 'treino' && <Dumbbell className="h-4 w-4 text-[#C9A46A]" />}
              {modalTipo === 'reabilitacao' && <HeartPulse className="h-4 w-4 text-[#C9A46A]" />}
              {modalTipo === 'exame' && <Stethoscope className="h-4 w-4 text-[#C9A46A]" />}
              <h3 className="font-semibold text-[#33221C]">
                {modalTipo === 'treino'
                  ? 'Novo Treino Físico'
                  : modalTipo === 'reabilitacao'
                    ? 'Novo Exercício de Reabilitação'
                    : 'Novo Exame'}
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>{modalTipo === 'exame' ? 'Nome do exame' : 'Título'}</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder={
                    modalTipo === 'treino'
                      ? 'ex.: Treino A — Membros inferiores'
                      : modalTipo === 'reabilitacao'
                        ? 'ex.: Reabilitação de ombro — fase 1'
                        : 'ex.: Hemograma completo'
                  }
                />
              </div>
              <div>
                <Label>Descrição / orientações</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Orientações gerais para o cliente..."
                />
              </div>
              {modalTipo !== 'exame' && (
                <div className="space-y-2">
                  <Label>Exercícios</Label>
                  {exercicios.map((ex, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_70px_70px_80px_auto] gap-2">
                      <Input
                        value={ex.nome}
                        onChange={(e) => {
                          const next = [...exercicios]
                          next[idx] = { ...next[idx], nome: e.target.value }
                          setExercicios(next)
                        }}
                        placeholder="Exercício"
                      />
                      <Input
                        value={ex.series || ''}
                        onChange={(e) => {
                          const next = [...exercicios]
                          next[idx] = { ...next[idx], series: e.target.value }
                          setExercicios(next)
                        }}
                        placeholder="Séries"
                      />
                      <Input
                        value={ex.repeticoes || ''}
                        onChange={(e) => {
                          const next = [...exercicios]
                          next[idx] = { ...next[idx], repeticoes: e.target.value }
                          setExercicios(next)
                        }}
                        placeholder="Reps"
                      />
                      <Input
                        value={ex.carga || ''}
                        onChange={(e) => {
                          const next = [...exercicios]
                          next[idx] = { ...next[idx], carga: e.target.value }
                          setExercicios(next)
                        }}
                        placeholder="Carga"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-[#73574A]/50 hover:text-red-600"
                        onClick={() => setExercicios(exercicios.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExercicios([
                        ...exercicios,
                        { nome: '', series: '', repeticoes: '', carga: '' },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adicionar exercício
                  </Button>
                </div>
              )}
              {modalTipo === 'exame' && (
                <div>
                  <Label>Resultado / dado</Label>
                  <Textarea
                    value={resultado}
                    onChange={(e) => setResultado(e.target.value)}
                    rows={2}
                    placeholder="Resultado do exame, se já houver..."
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={() => void salvar()} disabled={!podeSalvar}>
                {salvando ? 'Salvando...' : 'Enviar ao cliente'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default SaudePrescricaoTreinos
