import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { ICONES_TIPO } from '@/components/saude/SaudeResumoIcones'
import {
  TIPOS_REGISTRO,
  type SaudeRegistroTipo,
  type SaudeRegistroRecord,
} from '@/services/saudeBemEstar'
import { hojeYMD } from '@/lib/saudeAgregacoes'

/** Tipos que aparecem no seletor do modal de registro (modelo RegisterMetric.tsx). */
const TIPOS_MODAL: SaudeRegistroTipo[] = [
  'atividade_fisica',
  'sono',
  'bebida',
  'refeicao',
  'medicacao',
  'emocao',
  'sintoma',
  'alimento',
  'exame',
]

export interface ValoresRegistro {
  tipo: SaudeRegistroTipo
  data: string
  observacao: string
  dados: Record<string, unknown>
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  tipoInicial?: SaudeRegistroTipo
  registro?: SaudeRegistroRecord | null
  onSalvar: (v: ValoresRegistro) => Promise<void>
}

const REF_LABEL: Record<string, string> = {
  cafe: 'Café da manhã',
  almoco: 'Almoço',
  janta: 'Jantar',
  lanche: 'Lanche',
}

const BEBIDAS: { v: string; l: string }[] = [
  { v: 'agua', l: 'Água' },
  { v: 'cafe', l: 'Café' },
  { v: 'cha', l: 'Chá' },
  { v: 'suco', l: 'Suco' },
  { v: 'refrigerante', l: 'Refrigerante' },
  { v: 'alcool', l: 'Álcool' },
]

const HUMORES: { v: string; l: string }[] = [
  { v: 'otimo', l: 'Ótimo' },
  { v: 'bom', l: 'Bom' },
  { v: 'neutro', l: 'Neutro' },
  { v: 'baixo', l: 'Baixo' },
  { v: 'ruim', l: 'Ruim' },
]

/** Modal "Registrar" — um campo dinâmico por tipo (dados_json). */
export function ModalRegistroMetrica({
  open,
  onOpenChange,
  tipoInicial,
  registro,
  onSalvar,
}: Props) {
  const [tipo, setTipo] = useState<SaudeRegistroTipo>(tipoInicial || 'atividade_fisica')
  const [data, setData] = useState(hojeYMD())
  const [hora, setHora] = useState(() => new Date().toTimeString().slice(0, 5))
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  // campos dinâmicos
  const [sonoDeitar, setSonoDeitar] = useState('23:00')
  const [sonoAcordar, setSonoAcordar] = useState('07:00')
  const [sonoQualidade, setSonoQualidade] = useState(3)
  const [fasesSono, setFasesSono] = useState({ deep: '', rem: '', awake: '', light: '' })
  const [bebida, setBebida] = useState('agua')
  const [copos, setCopos] = useState(1)
  const [refeicao, setRefeicao] = useState('almoco')
  const [itens, setItens] = useState('')
  const [calorias, setCalorias] = useState('')
  const [medNome, setMedNome] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medHorario, setMedHorario] = useState('')
  const [medIngerida, setMedIngerida] = useState(true)
  const [humor, setHumor] = useState('bom')
  const [humorNotas, setHumorNotas] = useState('')
  const [atvDescricao, setAtvDescricao] = useState('')
  const [atvDuracao, setAtvDuracao] = useState('')
  const [atvIntensidade, setAtvIntensidade] = useState('moderada')
  const [sintomaDescricao, setSintomaDescricao] = useState('')

  useEffect(() => {
    if (!open) return
    if (registro) {
      setTipo(registro.tipo)
      setData((registro.data || '').slice(0, 10))
      setHora((registro.data || '').slice(11, 16) || '12:00')
      setObservacao(registro.observacao || '')
      const d = (registro.dados_json || {}) as Record<string, unknown>
      if (registro.tipo === 'sono') {
        setSonoDeitar((d.hora_deitar as string) || '23:00')
        setSonoAcordar((d.hora_acordar as string) || '07:00')
        setSonoQualidade((d.qualidade as number) || 3)
        const f = (d.fases || {}) as Record<string, unknown>
        setFasesSono({
          deep: f.deep != null ? String(f.deep) : '',
          rem: f.rem != null ? String(f.rem) : '',
          awake: f.awake != null ? String(f.awake) : '',
          light: f.light != null ? String(f.light) : '',
        })
      }
      if (registro.tipo === 'bebida') {
        setBebida((d.bebida as string) || 'agua')
        setCopos((d.copos as number) || 1)
      }
      if (registro.tipo === 'refeicao' || registro.tipo === 'alimento') {
        setRefeicao((d.refeicao as string) || 'almoco')
        setItens((d.itens as string) || '')
        setCalorias(d.calorias != null ? String(d.calorias) : '')
      }
      if (registro.tipo === 'medicacao') {
        setMedNome((d.nome as string) || '')
        setMedDose((d.dose as string) || '')
        setMedHorario((d.horario as string) || '')
        setMedIngerida(d.ingerida !== false)
      }
      if (registro.tipo === 'emocao') {
        setHumor((d.humor as string) || 'bom')
        setHumorNotas((d.notas as string) || '')
      }
      if (registro.tipo === 'atividade_fisica') {
        setAtvDescricao((d.descricao as string) || '')
        setAtvDuracao(d.duracao_min != null ? String(d.duracao_min) : '')
        setAtvIntensidade((d.intensidade as string) || 'moderada')
      }
      if (registro.tipo === 'sintoma') {
        setSintomaDescricao((d.descricao as string) || '')
      }
    } else {
      setObservacao('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, registro])

  const montarDados = (): Record<string, unknown> => {
    const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')))
    switch (tipo) {
      case 'sono': {
        const fases = {
          deep: num(fasesSono.deep || ''),
          rem: num(fasesSono.rem || ''),
          awake: num(fasesSono.awake || ''),
          light: num(fasesSono.light || ''),
        }
        const temFases = Object.values(fases).some((v) => typeof v === 'number' && !isNaN(v))
        return {
          hora_deitar: sonoDeitar,
          hora_acordar: sonoAcordar,
          qualidade: sonoQualidade,
          ...(temFases ? { fases } : {}),
        }
      }
      case 'bebida':
        return { bebida, copos }
      case 'refeicao':
      case 'alimento':
        return { refeicao, itens, calorias: num(calorias) }
      case 'medicacao':
        return { nome: medNome, dose: medDose, horario: medHorario, ingerida: medIngerida }
      case 'emocao':
        return { humor, notas: humorNotas }
      case 'atividade_fisica':
        return {
          descricao: atvDescricao,
          duracao_min: num(atvDuracao),
          intensidade: atvIntensidade,
        }
      case 'sintoma':
        return { descricao: sintomaDescricao }
      case 'exame':
      default:
        return {}
    }
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      await onSalvar({
        tipo,
        data: `${data} ${hora || '12:00'}:00.000Z`,
        observacao: observacao.trim(),
        dados: montarDados(),
      })
      onOpenChange(false)
      setObservacao('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{registro ? 'Editar registro' : 'Registrar'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-[#2C4A3B]">O que você quer registrar?</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {TIPOS_MODAL.map((t) => {
                const Icone = ICONES_TIPO[t]
                const ativo = tipo === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs transition-colors ${
                      ativo
                        ? 'border-[#3E7C59] bg-[#3E7C59]/10 text-[#2C4A3B]'
                        : 'border-[#3E7C59]/15 text-[#5C7263] hover:border-[#3E7C59]/40'
                    }`}
                  >
                    <Icone className="h-5 w-5" />
                    {TIPOS_REGISTRO.find((x) => x.value === t)?.label || t}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[#2C4A3B]">Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
            <div>
              <Label className="text-[#2C4A3B]">Hora</Label>
              <Input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
          </div>

          {/* Campos por tipo */}
          {tipo === 'sono' && (
            <div className="space-y-2 rounded-xl bg-[#F0F5F0] p-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[#5C7263]">Deitou-se</Label>
                  <Input
                    type="time"
                    value={sonoDeitar}
                    onChange={(e) => setSonoDeitar(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#5C7263]">Acordou</Label>
                  <Input
                    type="time"
                    value={sonoAcordar}
                    onChange={(e) => setSonoAcordar(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#5C7263]">Qualidade ({sonoQualidade}/5)</Label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={sonoQualidade}
                  onChange={(e) => setSonoQualidade(Number(e.target.value))}
                  className="w-full accent-[#3E7C59]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#5C7263]">Fases (horas — opcional)</Label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  <Input
                    placeholder="Deep"
                    value={fasesSono.deep}
                    onChange={(e) => setFasesSono({ ...fasesSono, deep: e.target.value })}
                    inputMode="decimal"
                    className="rounded-lg"
                  />
                  <Input
                    placeholder="REM"
                    value={fasesSono.rem}
                    onChange={(e) => setFasesSono({ ...fasesSono, rem: e.target.value })}
                    inputMode="decimal"
                    className="rounded-lg"
                  />
                  <Input
                    placeholder="Awake"
                    value={fasesSono.awake}
                    onChange={(e) => setFasesSono({ ...fasesSono, awake: e.target.value })}
                    inputMode="decimal"
                    className="rounded-lg"
                  />
                  <Input
                    placeholder="Light"
                    value={fasesSono.light}
                    onChange={(e) => setFasesSono({ ...fasesSono, light: e.target.value })}
                    inputMode="decimal"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {tipo === 'bebida' && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F0F5F0] p-3">
              <div>
                <Label className="text-xs text-[#5C7263]">Bebida</Label>
                <select
                  value={bebida}
                  onChange={(e) => setBebida(e.target.value)}
                  className="w-full rounded-lg border border-[#3E7C59]/20 bg-white p-2 text-sm"
                >
                  {BEBIDAS.map((b) => (
                    <option key={b.v} value={b.v}>
                      {b.l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#5C7263]">Copos</Label>
                <Input
                  type="number"
                  min={1}
                  value={copos}
                  onChange={(e) => setCopos(Number(e.target.value))}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {(tipo === 'refeicao' || tipo === 'alimento') && (
            <div className="space-y-2 rounded-xl bg-[#F0F5F0] p-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[#5C7263]">Refeição</Label>
                  <select
                    value={refeicao}
                    onChange={(e) => setRefeicao(e.target.value)}
                    className="w-full rounded-lg border border-[#3E7C59]/20 bg-white p-2 text-sm"
                  >
                    {Object.entries(REF_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-[#5C7263]">Calorias (kcal)</Label>
                  <Input
                    value={calorias}
                    onChange={(e) => setCalorias(e.target.value)}
                    inputMode="decimal"
                    placeholder="ex.: 550"
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#5C7263]">O que comeu</Label>
                <Textarea
                  rows={2}
                  value={itens}
                  onChange={(e) => setItens(e.target.value)}
                  placeholder="ex.: frango grelhado, arroz, salada"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {tipo === 'medicacao' && (
            <div className="space-y-2 rounded-xl bg-[#F0F5F0] p-3">
              <div>
                <Label className="text-xs text-[#5C7263]">Medicação / rotina</Label>
                <Input
                  value={medNome}
                  onChange={(e) => setMedNome(e.target.value)}
                  placeholder="ex.: Vitamina D"
                  className="rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[#5C7263]">Dose</Label>
                  <Input
                    value={medDose}
                    onChange={(e) => setMedDose(e.target.value)}
                    placeholder="ex.: 1 comprimido"
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#5C7263]">Horário</Label>
                  <Input
                    type="time"
                    value={medHorario}
                    onChange={(e) => setMedHorario(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#2C4A3B]">
                <input
                  type="checkbox"
                  checked={medIngerida}
                  onChange={(e) => setMedIngerida(e.target.checked)}
                />
                Já ingerida hoje
              </label>
            </div>
          )}

          {tipo === 'emocao' && (
            <div className="space-y-2 rounded-xl bg-[#F0F5F0] p-3">
              <div className="grid grid-cols-5 gap-1">
                {HUMORES.map((h) => (
                  <button
                    key={h.v}
                    type="button"
                    onClick={() => setHumor(h.v)}
                    className={`rounded-lg border px-1 py-2 text-xs transition-colors ${
                      humor === h.v
                        ? 'border-[#3E7C59] bg-[#3E7C59]/10 text-[#2C4A3B] font-medium'
                        : 'border-[#3E7C59]/15 text-[#5C7263]'
                    }`}
                  >
                    {h.l}
                  </button>
                ))}
              </div>
              <Textarea
                rows={2}
                value={humorNotas}
                onChange={(e) => setHumorNotas(e.target.value)}
                placeholder="Anotações do dia (opcional)"
                className="rounded-lg"
              />
            </div>
          )}

          {tipo === 'atividade_fisica' && (
            <div className="space-y-2 rounded-xl bg-[#F0F5F0] p-3">
              <div>
                <Label className="text-xs text-[#5C7263]">O que fez</Label>
                <Input
                  value={atvDescricao}
                  onChange={(e) => setAtvDescricao(e.target.value)}
                  placeholder="ex.: caminhada no parque"
                  className="rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[#5C7263]">Duração (min)</Label>
                  <Input
                    value={atvDuracao}
                    onChange={(e) => setAtvDuracao(e.target.value)}
                    inputMode="numeric"
                    placeholder="30"
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#5C7263]">Intensidade</Label>
                  <select
                    value={atvIntensidade}
                    onChange={(e) => setAtvIntensidade(e.target.value)}
                    className="w-full rounded-lg border border-[#3E7C59]/20 bg-white p-2 text-sm"
                  >
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="intensa">Intensa</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tipo === 'sintoma' && (
            <div className="rounded-xl bg-[#F0F5F0] p-3">
              <Label className="text-xs text-[#5C7263]">Como você está se sentindo?</Label>
              <Textarea
                rows={2}
                value={sintomaDescricao}
                onChange={(e) => setSintomaDescricao(e.target.value)}
                placeholder="ex.: dor lombar leve ao acordar"
                className="rounded-lg"
              />
            </div>
          )}

          <div>
            <Label className="text-[#2C4A3B]">Observação geral (opcional)</Label>
            <Textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="rounded-xl border-[#3E7C59]/20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="bg-[#3E7C59] hover:bg-[#33684A] text-white"
          >
            {salvando ? 'Salvando...' : 'Salvar registro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalRegistroMetrica
