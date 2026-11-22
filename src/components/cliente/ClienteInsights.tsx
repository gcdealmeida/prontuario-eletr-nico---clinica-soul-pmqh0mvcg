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
        <Card className="bg-white/85 border-dashed border-[#3E7C59]/30">
          <CardContent className="py-10 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-[#3E7C59]/40" />
            <p className="mt-3 text-base font-semibold text-[#2C4A3B]">Comece registrando 🌱</p>
            <p className="mt-1 text-sm text-[#5C7263]">
              Registre sono, alimentação, atividades e humor para ver seus insights aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-[#5C7263]">
            <Info className="h-4 w-4" />
            <p className="text-xs">Últimos 7 dias, calculados a partir dos seus registros.</p>
          </div>
          {insights.map((i) => (
            <Card
              key={i.titulo}
              className={`bg-white/85 border ${
                i.tom === 'positivo'
                  ? 'border-[#3E7C59]/30'
                  : i.tom === 'atencao'
                    ? 'border-[#C9A46A]/40'
                    : 'border-[#3E7C59]/15'
              }`}
            >
              <CardContent className="py-4">
                <p className="text-sm font-semibold text-[#2C4A3B]">{i.titulo}</p>
                <p className="mt-1 text-sm text-[#5C7263]">{i.texto}</p>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

export default ClienteInsights
