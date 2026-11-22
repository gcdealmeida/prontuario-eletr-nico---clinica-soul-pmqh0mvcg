import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { atualizarMeuPerfilSaude, type SaudeClienteRecord } from '@/services/saudeBemEstar'

const GENEROS: { v: NonNullable<SaudeClienteRecord['genero']>; l: string }[] = [
  { v: 'feminino', l: 'Feminino' },
  { v: 'masculino', l: 'Masculino' },
  { v: 'outro', l: 'Outro' },
  { v: 'nao_informado', l: 'Prefiro não informar' },
]

interface Props {
  cliente: SaudeClienteRecord
  onAtualizado: (cliente: SaudeClienteRecord) => void
}

/** Perfil do cliente — peso, altura, gênero e metas (guard hook saude_clientes_perfil_guard). */
export function ClientePerfil({ cliente, onAtualizado }: Props) {
  const { toast } = useToast()
  const [peso, setPeso] = useState(() =>
    cliente.peso_kg != null ? String(cliente.peso_kg).replace('.', ',') : '',
  )
  const [altura, setAltura] = useState(() =>
    cliente.altura_cm != null ? String(cliente.altura_cm).replace('.', ',') : '',
  )
  const [genero, setGenero] = useState<string>(cliente.genero || 'nao_informado')
  const [metas, setMetas] = useState(() => {
    const m = cliente.metas || {}
    return {
      agua_copos: m.agua_copos != null ? String(m.agua_copos) : '8',
      sono_horas: m.sono_horas != null ? String(m.sono_horas) : '8',
      calorias: m.calorias != null ? String(m.calorias) : '2000',
      atividade_min: m.atividade_min != null ? String(m.atividade_min) : '30',
    }
  })
  const [salvando, setSalvando] = useState(false)

  const num = (s: string) => {
    const n = Number(s.replace(',', '.'))
    return s.trim() !== '' && !isNaN(n) ? n : undefined
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const atualizado = await atualizarMeuPerfilSaude(cliente.id, {
        peso_kg: num(peso),
        altura_cm: num(altura),
        genero: genero as SaudeClienteRecord['genero'],
        metas: {
          agua_copos: num(metas.agua_copos),
          sono_horas: num(metas.sono_horas),
          calorias: num(metas.calorias),
          atividade_min: num(metas.atividade_min),
        },
      })
      onAtualizado(atualizado)
      toast({ title: 'Perfil atualizado!' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao salvar perfil.', variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/85 border-[#3E7C59]/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Meus dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#5C7263]">Peso (kg)</Label>
              <Input
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                inputMode="decimal"
                placeholder="ex.: 70,5"
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5C7263]">Altura (cm)</Label>
              <Input
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                inputMode="decimal"
                placeholder="ex.: 170"
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-[#5C7263]">Gênero</Label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="w-full rounded-xl border border-[#3E7C59]/20 bg-white p-2 text-sm"
            >
              {GENEROS.map((g) => (
                <option key={g.v} value={g.v}>
                  {g.l}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/85 border-[#3E7C59]/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Minhas metas diárias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#5C7263]">Água (copos/dia)</Label>
              <Input
                value={metas.agua_copos}
                onChange={(e) => setMetas({ ...metas, agua_copos: e.target.value })}
                inputMode="numeric"
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5C7263]">Sono (horas/noite)</Label>
              <Input
                value={metas.sono_horas}
                onChange={(e) => setMetas({ ...metas, sono_horas: e.target.value })}
                inputMode="decimal"
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5C7263]">Calorias (kcal/dia)</Label>
              <Input
                value={metas.calorias}
                onChange={(e) => setMetas({ ...metas, calorias: e.target.value })}
                inputMode="numeric"
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
            <div>
              <Label className="text-xs text-[#5C7263]">Atividade (min/dia)</Label>
              <Input
                value={metas.atividade_min}
                onChange={(e) => setMetas({ ...metas, atividade_min: e.target.value })}
                inputMode="numeric"
                className="rounded-xl border-[#3E7C59]/20"
              />
            </div>
          </div>
          <p className="text-[10px] text-[#5C7263]/70">
            As metas aparecem nos cartões da aba Hoje e nos seus Insights.
          </p>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="w-full h-11 rounded-xl bg-[#3E7C59] hover:bg-[#33684A] text-white"
          >
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {salvando ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientePerfil
