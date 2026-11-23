import { useMemo } from 'react'
import { BarChart3, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { calcularInsights } from '@/lib/saudeAgregacoes'
import type { SaudeRegistroRecord } from '@/services/saudeBemEstar'

/** Insights do cliente — médias reais calculadas localmente (sem IA). */
export function ClienteInsights({ registros }: { registros: SaudeRegistroRecord[] }) {
  const insights = useMemo(() => calcularInsights(registros), [registros])
  const vazio = insights.length === 1 && insights[0].titulo === 'Comece registrando'

  return (
    <div className="space-y-4">
      {vazio ? (
        <Card className="bg-white border-dashed border-[#C9A063]/50 shadow-sm">
          <CardContent className="py-10 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-[#C9A063]/70" />
            <p className="mt-3 text-base font-semibold text-[#5C3A21]">Comece registrando 🌱</p>
            <p className="mt-1 text-sm text-[#8A6F58]">
              Registre sono, alimentação, atividades e humor para ver seus insights aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-[#8A6F58]">
            <Info className="h-4 w-4" />
            <p className="text-xs">Últimos 7 dias, calculados a partir dos seus registros.</p>
          </div>
          {insights.map((i) => (
            <Card
              key={i.titulo}
              className={`bg-white border shadow-sm ${
                i.tom === 'positivo'
                  ? 'border-[#7B4B2A]/25'
                  : i.tom === 'atencao'
                    ? 'border-[#C9A063]/50'
                    : 'border-[#E2D4BF]'
              }`}
            >
              <CardContent className="py-4">
                <p className="text-sm font-semibold text-[#5C3A21]">{i.titulo}</p>
                <p className="mt-1 text-sm text-[#8A6F58]">{i.texto}</p>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

export default ClienteInsights
