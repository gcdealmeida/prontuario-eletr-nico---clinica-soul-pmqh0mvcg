import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Props {
  de: string
  ate: string
  onChange: (periodo: { de: string; ate: string }) => void
}

/** Filtro de período simples usado na visão individual do cliente. */
export function SaudeFiltrosPeriodo({ de, ate, onChange }: Props) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">De</Label>
          <Input
            type="date"
            value={de}
            onChange={(e) => onChange({ de: e.target.value, ate })}
            className="h-8 w-[150px] text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input
            type="date"
            value={ate}
            onChange={(e) => onChange({ de, ate: e.target.value })}
            className="h-8 w-[150px] text-xs"
          />
        </div>
        {(de || ate) && (
          <Button size="sm" variant="ghost" onClick={() => onChange({ de: '', ate: '' })}>
            Limpar período
          </Button>
        )}
      </div>
    </Card>
  )
}

export default SaudeFiltrosPeriodo
