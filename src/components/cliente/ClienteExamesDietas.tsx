import { useMemo, useState } from 'react'
import { ClipboardList, Plus, Salad, Stethoscope, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDataHoraPTBR } from '@/lib/constants'
import { descreverRegistro, hojeYMD } from '@/lib/saudeAgregacoes'
import type { SaudeRegistroRecord } from '@/services/saudeBemEstar'

interface Props {
  registros: SaudeRegistroRecord[]
  onRegistrar: (tipo: 'exame' | 'dieta', titulo?: string) => Promise<void> | void
  onExcluir: (id: string) => void
}

/** Exames & Dietas (modelo ExamsAndDiets.tsx). */
export function ClienteExamesDietas({ registros, onRegistrar, onExcluir }: Props) {
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [tipoNovo, setTipoNovo] = useState<'exame' | 'dieta'>('exame')

  const exames = useMemo(() => registros.filter((r) => r.tipo === 'exame'), [registros])
  const dietas = useMemo(() => registros.filter((r) => r.tipo === 'dieta'), [registros])

  const salvar = async () => {
    if (!titulo.trim()) return
    setSalvando(true)
    try {
      await onRegistrar(tipoNovo, titulo.trim())
      setTitulo('')
      setAberto(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-[#E2D4BF] shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#7B4B2A]" /> Exames
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegistrar('exame')}
              className="border-[#7B4B2A]/30 text-[#5C3A21] hover:border-[#C9A063]"
            >
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {exames.length === 0 ? (
              <p className="text-sm text-[#8A6F58] italic">Nenhum exame registrado.</p>
            ) : (
              exames.slice(0, 15).map((r) => (
                <div key={r.id} className="rounded-xl bg-[#F5EFE6] border border-[#E2D4BF] p-3">
                  <p className="text-sm text-[#5C3A21]">{descreverRegistro(r)}</p>
                  <p className="text-[10px] text-[#8A6F58]/70 mt-0.5">
                    {formatDataHoraPTBR(r.data)}
                  </p>
                  <button
                    onClick={() => onExcluir(r.id)}
                    className="mt-1 text-[10px] text-[#8A6F58]/60 hover:text-red-500"
                  >
                    excluir
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2D4BF] shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Salad className="h-4 w-4 text-[#7B4B2A]" /> Dietas
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegistrar('dieta')}
              className="border-[#7B4B2A]/30 text-[#5C3A21] hover:border-[#C9A063]"
            >
              <Plus className="h-4 w-4 mr-1" /> Nova
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {dietas.length === 0 ? (
              <p className="text-sm text-[#8A6F58] italic">Nenhuma dieta registrada.</p>
            ) : (
              dietas.slice(0, 15).map((r) => (
                <div key={r.id} className="rounded-xl bg-[#F5EFE6] border border-[#E2D4BF] p-3">
                  <p className="text-sm text-[#5C3A21]">{descreverRegistro(r)}</p>
                  <p className="text-[10px] text-[#8A6F58]/70 mt-0.5">
                    {formatDataHoraPTBR(r.data)}
                  </p>
                  <button
                    onClick={() => onExcluir(r.id)}
                    className="mt-1 text-[10px] text-[#8A6F58]/60 hover:text-red-500"
                  >
                    excluir
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {aberto && (
        <Card className="border-[#C9A063] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#C9A063]" /> Registrar{' '}
              {tipoNovo === 'exame' ? 'exame' : 'dieta'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-[#5C3A21]">Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={
                  tipoNovo === 'exame' ? 'ex.: Hemograma completo' : 'ex.: Dieta low carb'
                }
                className="rounded-xl border-[#E2D4BF] focus-visible:ring-[#C9A063]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button
                onClick={salvar}
                disabled={salvando || !titulo.trim()}
                className="bg-[#7B4B2A] hover:bg-[#5C3A21] text-white"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ClienteExamesDietas
