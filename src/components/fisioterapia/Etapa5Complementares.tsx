import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { BERG_ITENS, ELEMENTOS_PALMILHA } from '@/lib/fisioterapiaModel'
import type { SecoesComplementaresFisio } from '@/types/database'
import { Layers, Plus, Trash2 } from 'lucide-react'

interface Etapa5ComplementaresProps {
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
}

export const Etapa5Complementares: React.FC<Etapa5ComplementaresProps> = ({
  formData,
  onChange,
}) => {
  const comp: SecoesComplementaresFisio = formData.secoes_complementares || {}

  const updateComp = (patch: Partial<SecoesComplementaresFisio>) => {
    onChange('secoes_complementares', { ...comp, ...patch })
  }

  // Berg calculations
  const bergItens = comp.berg_itens || {}
  const bergTotal = Object.values(bergItens).reduce((acc, v) => acc + (Number(v) || 0), 0)
  const bergPct = ((bergTotal / 56) * 100).toFixed(1)

  const handleBergItemChange = (id: number, val: number) => {
    const updated = { ...bergItens, [id]: val }
    const total = Object.values(updated).reduce((acc, v) => acc + (Number(v) || 0), 0)
    updateComp({ berg_itens: updated, berg_total: total })
  }

  const handleBergObsChange = (id: number, obs: string) => {
    const prev = comp.berg_observacoes || {}
    updateComp({ berg_observacoes: { ...prev, [id]: obs } })
  }

  // TUG calculations
  const tFami = parseFloat(comp.tug_familiarizacao?.tempo || '')
  const tVal1 = parseFloat(comp.tug_valida1?.tempo || '')
  const tVal2 = parseFloat(comp.tug_valida2?.tempo || '')

  const validas = [tVal1, tVal2].filter((t) => !isNaN(t) && t > 0)
  const tugMelhor = validas.length > 0 ? Math.min(...validas) : null
  const tugMedia =
    validas.length > 0
      ? Number((validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(2))
      : null

  const criterio = comp.tug_criterio || 'melhor'
  const resultadoEscolhido = criterio === 'melhor' ? tugMelhor : tugMedia

  // Cirtometria
  const cirto = comp.cirtometria_dados || {}
  const handleCirtoChange = (regiao: string, lado: 'direito' | 'esquerdo', val: string) => {
    const prev = { ...cirto }
    prev[regiao] = { ...prev[regiao], [lado]: val }
    updateComp({ cirtometria_dados: prev })
  }

  // Goniometria
  const gonio = comp.goniometria_medicoes || [
    { data: new Date().toISOString().substring(0, 10), joelho_d: '', joelho_e: '', outros: '' },
  ]
  const addGonioLinha = () => {
    updateComp({
      goniometria_medicoes: [
        ...gonio,
        { data: new Date().toISOString().substring(0, 10), joelho_d: '', joelho_e: '', outros: '' },
      ],
    })
  }
  const removeGonioLinha = (idx: number) => {
    updateComp({ goniometria_medicoes: gonio.filter((_, i) => i !== idx) })
  }
  const handleGonioChange = (idx: number, field: string, val: string) => {
    const list = [...gonio]
    list[idx] = { ...list[idx], [field]: val }
    updateComp({ goniometria_medicoes: list })
  }

  // Palmilha
  const palmElementos = comp.palmilha_elementos || {}
  const handlePalmilhaToggle = (id: string) => {
    updateComp({
      palmilha_elementos: { ...palmElementos, [id]: !palmElementos[id] },
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
        <Layers className="h-5 w-5 text-[#8C6527]" />
        <div>
          <h4 className="text-base font-bold text-gray-900">
            Seções Complementares e Avaliações Específicas (Optativas)
          </h4>
          <p className="text-xs text-gray-500">
            Ative nos seletores abaixo as fichas e testes adicionais que deseja incluir nesta
            avaliação.
          </p>
        </div>
      </div>

      {/* 1. BERG BALANCE SCALE */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.berg_ativo}
              onCheckedChange={(val) => updateComp({ berg_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Berg Balance Scale (Escala de Equilíbrio de Berg)
              </span>
              <span className="text-[11px] text-gray-500">
                13 itens avaliados de 0 a 4 (Pontuação Total 0 a 56)
              </span>
            </div>
          </div>

          {comp.berg_ativo && (
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Escore Total</span>
              <span className="font-mono text-base font-black text-[#8C6527]">
                {bergTotal} / 56 ({bergPct}%)
              </span>
            </div>
          )}
        </div>

        {comp.berg_ativo && (
          <div className="space-y-3 pt-2">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3 text-left w-12 font-bold">#</th>
                    <th className="py-2 px-3 text-left font-bold w-1/3">Descrição do Teste</th>
                    <th className="py-2 px-3 text-left font-bold w-1/4">Instrução ao Paciente</th>
                    <th className="py-2 px-2 text-center font-bold w-24">Pontos (0-4)</th>
                    <th className="py-2 px-3 text-left font-bold">Observações Clínicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {BERG_ITENS.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 font-mono text-gray-400">{item.id}</td>
                      <td className="py-2 px-3 font-semibold text-gray-800">{item.desc}</td>
                      <td className="py-2 px-3 text-gray-500">{item.instrucao}</td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={bergItens[item.id] ?? 4}
                          onChange={(e) => handleBergItemChange(item.id, Number(e.target.value))}
                          className="h-8 w-16 text-center text-xs font-bold rounded-xl border border-gray-200 bg-white"
                        >
                          {[0, 1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          placeholder="Observação..."
                          value={comp.berg_observacoes?.[item.id] || ''}
                          onChange={(e) => handleBergObsChange(item.id, e.target.value)}
                          className="h-7 text-xs rounded-lg"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. TIMED UP AND GO (TUG) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.tug_ativo}
              onCheckedChange={(val) => updateComp({ tug_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Timed Up and Go (TUG) — Ficha de Aplicação
              </span>
              <span className="text-[11px] text-gray-500">
                1 tentativa de familiarização + 2 tentativas válidas (tempo e flags biomecânicos)
              </span>
            </div>
          </div>

          {comp.tug_ativo && resultadoEscolhido !== null && (
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Tempo Escolhido</span>
              <span className="font-mono text-base font-black text-blue-700">
                {resultadoEscolhido} s ({criterio === 'melhor' ? 'Melhor' : 'Média'})
              </span>
            </div>
          )}
        </div>

        {comp.tug_ativo && (
          <div className="space-y-4 pt-2 text-xs">
            {/* Tabela de Tentativas */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-bold">Tentativa</th>
                    <th className="py-2.5 px-2 text-center font-bold">Tempo (s)</th>
                    <th className="py-2.5 px-2 text-center font-bold">Usou Braços?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Instabilidade Giro?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Passos Curtos?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Desvio?</th>
                    <th className="py-2.5 px-2 text-center font-bold">Hesitação?</th>
                    <th className="py-2.5 px-3 text-left font-bold">Apoio / Obs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Familiarização */}
                  <tr>
                    <td className="py-2 px-3 font-semibold text-gray-700">Familiarização</td>
                    <td className="py-2 px-2 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="s"
                        value={comp.tug_familiarizacao?.tempo || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              tempo: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-20 text-center text-xs rounded-xl mx-auto"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.bracos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              bracos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.giro}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              giro: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.passos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              passos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.desvio}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              desvio: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_familiarizacao?.freezing}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              freezing: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="Apoio necessário, observações..."
                        value={comp.tug_familiarizacao?.obs || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_familiarizacao: {
                              ...comp.tug_familiarizacao,
                              obs: e.target.value,
                            },
                          })
                        }
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                  </tr>

                  {/* Válida 1 */}
                  <tr>
                    <td className="py-2 px-3 font-semibold text-gray-900">Válida 1</td>
                    <td className="py-2 px-2 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="s"
                        value={comp.tug_valida1?.tempo || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              tempo: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-20 text-center text-xs rounded-xl mx-auto font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.bracos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              bracos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.giro}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              giro: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.passos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              passos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.desvio}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              desvio: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida1?.freezing}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              freezing: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="Observações da tentativa 1..."
                        value={comp.tug_valida1?.obs || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida1: {
                              ...comp.tug_valida1,
                              obs: e.target.value,
                            },
                          })
                        }
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                  </tr>

                  {/* Válida 2 */}
                  <tr>
                    <td className="py-2 px-3 font-semibold text-gray-900">Válida 2</td>
                    <td className="py-2 px-2 text-center">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="s"
                        value={comp.tug_valida2?.tempo || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              tempo: e.target.value,
                            },
                          })
                        }
                        className="h-8 w-20 text-center text-xs rounded-xl mx-auto font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.bracos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              bracos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.giro}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              giro: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.passos}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              passos: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.desvio}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              desvio: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Checkbox
                        checked={!!comp.tug_valida2?.freezing}
                        onCheckedChange={(v) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              freezing: !!v,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        placeholder="Observações da tentativa 2..."
                        value={comp.tug_valida2?.obs || ''}
                        onChange={(e) =>
                          updateComp({
                            tug_valida2: {
                              ...comp.tug_valida2,
                              obs: e.target.value,
                            },
                          })
                        }
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Critério de Escolha e Resultados Calculados */}
            <div className="p-4 bg-gray-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-700">Critério de resultado padrão:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tug_criterio"
                    checked={criterio === 'melhor'}
                    onChange={() => updateComp({ tug_criterio: 'melhor' })}
                  />
                  <span>Melhor tempo ({tugMelhor ? `${tugMelhor}s` : '—'})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tug_criterio"
                    checked={criterio === 'media'}
                    onChange={() => updateComp({ tug_criterio: 'media' })}
                  />
                  <span>Média das válidas ({tugMedia ? `${tugMedia}s` : '—'})</span>
                </label>
              </div>

              <div className="text-gray-500 text-[11px]">
                Referência: &lt; 10s normal / 10–20s risco moderado / &gt; 20s risco elevado de
                queda
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CIRTOMETRIA / PERIMETRIA DE MEMBROS INFERIORES */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.cirtometria_ativo}
              onCheckedChange={(val) => updateComp({ cirtometria_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Cirtometria / Perimetria de Membros Inferiores
              </span>
              <span className="text-[11px] text-gray-500">
                Medições em cm: acima da patela, 8cm e 15cm acima, linha articular, abaixo e 12cm
                abaixo
              </span>
            </div>
          </div>
        </div>

        {comp.cirtometria_ativo && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 pt-2">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-left font-bold w-1/2">Região Avaliada</th>
                  <th className="py-2.5 px-2 text-center font-bold w-1/4">Lado Direito (cm)</th>
                  <th className="py-2.5 px-2 text-center font-bold w-1/4">Lado Esquerdo (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  'Acima da Patela',
                  '8 cm acima da patela (Quadríceps)',
                  '15 cm acima da patela (Quadríceps)',
                  'Linha Articular do Joelho',
                  'Abaixo da Patela',
                  '12 cm abaixo da patela (Panturrilha)',
                ].map((reg) => (
                  <tr key={reg} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{reg}</td>
                    <td className="py-2.5 px-2 text-center">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={cirto[reg]?.direito || ''}
                        onChange={(e) => handleCirtoChange(reg, 'direito', e.target.value)}
                        className="h-8 w-24 text-center text-xs rounded-xl mx-auto"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={cirto[reg]?.esquerdo || ''}
                        onChange={(e) => handleCirtoChange(reg, 'esquerdo', e.target.value)}
                        className="h-8 w-24 text-center text-xs rounded-xl mx-auto"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. GONIOMETRIA EVOLUTIVA */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.goniometria_ativo}
              onCheckedChange={(val) => updateComp({ goniometria_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Goniometria com Registro por Datas (Evolução D/E)
              </span>
              <span className="text-[11px] text-gray-500">
                Permite acompanhar datas de medições sucessivas para avaliar o progresso
              </span>
            </div>
          </div>

          {comp.goniometria_ativo && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGonioLinha}
              className="text-xs h-8 rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Nova Data
            </Button>
          )}
        </div>

        {comp.goniometria_ativo && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 pt-2">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 text-left font-bold w-36">Data</th>
                  <th className="py-2.5 px-2 text-center font-bold">Joelho / Artic. D (°)</th>
                  <th className="py-2.5 px-2 text-center font-bold">Joelho / Artic. E (°)</th>
                  <th className="py-2.5 px-3 text-left font-bold">Observações / Evolução</th>
                  <th className="py-2.5 px-2 text-center font-bold w-12">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gonio.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3">
                      <Input
                        type="date"
                        value={item.data}
                        onChange={(e) => handleGonioChange(idx, 'data', e.target.value)}
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <Input
                        type="number"
                        placeholder="graus"
                        value={item.joelho_d || ''}
                        onChange={(e) => handleGonioChange(idx, 'joelho_d', e.target.value)}
                        className="h-8 w-24 text-center text-xs rounded-xl mx-auto"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <Input
                        type="number"
                        placeholder="graus"
                        value={item.joelho_e || ''}
                        onChange={(e) => handleGonioChange(idx, 'joelho_e', e.target.value)}
                        className="h-8 w-24 text-center text-xs rounded-xl mx-auto"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <Input
                        placeholder="Observações da sessão..."
                        value={item.outros || ''}
                        onChange={(e) => handleGonioChange(idx, 'outros', e.target.value)}
                        className="h-8 text-xs rounded-xl"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={gonio.length === 1}
                        onClick={() => removeGonioLinha(idx)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. PRESCRIÇÃO DE PALMILHA POSTURAL */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Switch
              checked={!!comp.palmilha_ativo}
              onCheckedChange={(val) => updateComp({ palmilha_ativo: val })}
            />
            <div>
              <span className="font-bold text-sm text-gray-900 block">
                Prescrição de Palmilha Proprioceptiva / Postural
              </span>
              <span className="text-[11px] text-gray-500">
                Seleção de elementos podoposturológicos (BIC, subdigital, botão, cunhas, taloneta) e
                tamanho
              </span>
            </div>
          </div>
        </div>

        {comp.palmilha_ativo && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ELEMENTOS_PALMILHA.map((elem) => (
                <label
                  key={elem.id}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    palmElementos[elem.id]
                      ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                      : 'border-gray-200 bg-gray-50/40 hover:bg-gray-100/60'
                  }`}
                >
                  <Checkbox
                    checked={!!palmElementos[elem.id]}
                    onCheckedChange={() => handlePalmilhaToggle(elem.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">{elem.nome}</span>
                    <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">
                      {elem.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <Label className="text-gray-700 font-semibold">Tamanho da Palmilha / Calçado</Label>
                <Input
                  placeholder="Ex: 38 / 39"
                  value={comp.palmilha_tamanho || ''}
                  onChange={(e) => updateComp({ palmilha_tamanho: e.target.value })}
                  className="mt-1 h-9 rounded-xl"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-gray-700 font-semibold">Observações / Densidade / EVA</Label>
                <Input
                  placeholder="Densidade shore, espessura de base, tipo de cobertura..."
                  value={comp.palmilha_obs || ''}
                  onChange={(e) => updateComp({ palmilha_obs: e.target.value })}
                  className="mt-1 h-9 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
