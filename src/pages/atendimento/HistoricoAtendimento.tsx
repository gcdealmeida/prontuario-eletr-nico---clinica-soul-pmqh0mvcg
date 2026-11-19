import { ClipboardList, CalendarCheck2, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ItemHistorico } from './PainelAtendimentoPartes'
import type { ItemHistoricoUnificado } from './PainelAtendimento'

export function HistoricoAtendimento({
  itens,
  loading,
  pacienteNome,
}: {
  itens: ItemHistoricoUnificado[]
  loading: boolean
  pacienteNome?: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-[#8C6527]" />
        <h2 className="font-serif text-lg font-bold text-[#4A322A]">
          Histórico Unificado{' '}
          {pacienteNome ? (
            <span className="text-sm font-normal text-[#73574A]">— {pacienteNome}</span>
          ) : (
            <span className="text-sm font-normal text-[#73574A]">(selecione um paciente)</span>
          )}
        </h2>
        <span className="text-[11px] text-gray-400 ml-auto">somente consulta</span>
      </div>

      {loading ? (
        <div className="py-10 flex flex-col items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#C9A46A]" />
          <span>Carregando histórico...</span>
        </div>
      ) : itens.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-[#E9E1D2] bg-[#FAF7F1]/50">
          <p className="text-xs font-semibold text-[#4A322A]">Nenhum atendimento registrado</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Registros de atendimento, presenças e evoluções aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {itens.map((item) => (
            <ItemHistorico
              key={item.id}
              icone={
                item.origem === 'registro' ? (
                  <ClipboardList className="h-4 w-4 text-emerald-700" />
                ) : item.origem === 'presenca' ? (
                  <CalendarCheck2 className="h-4 w-4 text-[#8C6527]" />
                ) : (
                  <FileText className="h-4 w-4 text-sky-700" />
                )
              }
              cor={
                item.origem === 'registro'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : item.origem === 'presenca'
                    ? 'bg-[#FAF4EA] border border-[#E3C89A]'
                    : 'bg-sky-50 border border-sky-200'
              }
              titulo={item.titulo}
              subtitulo={item.subtitulo}
              badges={
                <>
                  {item.badges.map((b) => (
                    <Badge
                      key={b}
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        b === 'Finalizada' || b === 'Presente'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : b === 'Ausência' || b === 'Justificado'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {b}
                    </Badge>
                  ))}
                  {item.origem === 'registro' && (
                    <Badge className="text-[10px] bg-[#4A322A] text-white border-[#4A322A]">
                      🔒 Imutável
                    </Badge>
                  )}
                </>
              }
              conteudo={item.conteudo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
