import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PLANO_FOTO_CONFIG_PADRAO,
  getPlanoFotoUrl,
  type CapaFotoConfig,
  type ItemPlano,
  type PlanoFotoConfig,
  type PlanoProposta,
} from '@/services/programasTratamento'
import { NOMES_ICONES } from '@/components/DocumentoPropostaTratamento'
import { comprimirImagemParaDataUrl } from '@/lib/anexoIaPreparo'

/**
 * Painel de edição da PÁGINA 2 da proposta SOUL: frase do paciente na capa,
 * os três planos (Basic / Otimizado / Personalizado) com itens, ícone de cada
 * item, parcelas, foto por plano, e os textos de identidade do topo/rodapé.
 * Tudo reage ao vivo na prévia do documento ao lado.
 */

interface PainelPlanosPropostaProps {
  frasePaciente: string
  onFraseChange: (v: string) => void
  planos: PlanoProposta[]
  /** troca um plano inteiro (índice fixo 0/1/2 = Basic/Otimizado/Personalizado) */
  onPlanoChange: (indice: number, plano: PlanoProposta) => void
  /** fotos dos planos: só os arquivos novos podem ir ao servidor */
  onFotoPlanoArquivo: (indice: number, file: File | null) => void
  propsCab: string
  propsPagina: string
  propsRodape: string
  onPropsChange: (campo: 'props_cab' | 'props_pagina' | 'props_rodape', valor: string) => void
  /** id do registro salvo (para montar URL das fotos já enviadas) */
  programaId: string | null
  /** notifica a página com a prévia local (data URL) de cada foto nova, por índice */
  onFotosNovasChange?: (fotos: Record<number, string>) => void
}

/* ---------------- helpers locais ---------------- */

const PARCELAS_MAX = 3
const ITENS_MAX = 12

const rotuloParcela = (n: number) => (n === 1 ? 'À vista' : `${n}x`)

/** Recorte de foto em miniatura (mesma matemática de estiloFotoCorte, escala pequena) */
const FotoMiniaturaPlano: React.FC<{
  url: string
  cfg: PlanoFotoConfig | null | undefined
}> = ({ url, cfg }) => {
  const [naturais, setNaturais] = useState<{ w: number; h: number } | null>(null)
  if (!url) {
    return (
      <div
        className="flex items-center justify-center text-[#C9A46A]"
        style={{ width: '100%', height: 54, backgroundColor: '#F7F3EB' }}
      >
        <ImageIcon className="h-5 w-5" />
      </div>
    )
  }
  const w = 228
  const h = 150
  const opacidade = Math.min(100, Math.max(15, cfg?.o ?? 100)) / 100
  const z = Math.max(1, Number(cfg?.z) || 1)
  const iw = naturais?.w
  const ih = naturais?.h
  let estilo: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: opacidade,
    maxWidth: 'none',
  }
  if (iw && ih) {
    const base = Math.max(w / iw, h / ih) * z
    const largura = iw * base
    const altura = ih * base
    estilo = {
      position: 'absolute',
      width: largura,
      height: altura,
      left: (w - largura) * (Math.min(100, Math.max(0, cfg?.x ?? 50)) / 100),
      top: (h - altura) * (Math.min(100, Math.max(0, cfg?.y ?? 50)) / 100),
      opacity: opacidade,
      maxWidth: 'none',
    }
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: 54, overflow: 'hidden' }}>
      <img
        src={url}
        alt=""
        draggable={false}
        onLoad={(e) =>
          setNaturais({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
        }
        style={estilo}
      />
    </div>
  )
}

const linhaSlider = (
  rotulo: string,
  campo: 'x' | 'y' | 'z' | 'o',
  cfg: PlanoFotoConfig,
  onCfg: (v: PlanoFotoConfig) => void,
  min: number,
  max: number,
  step: number,
) => (
  <div className="space-y-0.5" key={campo}>
    <div className="flex items-center justify-between">
      <Label className="text-[11px] text-[#5F544F]">{rotulo}</Label>
      <span className="text-[11px] font-mono text-[#8A7A6E]">{cfg[campo]}</span>
    </div>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[Number(cfg[campo]) || 0]}
      onValueChange={(vals: number[]) => {
        const v = vals[0]
        if (Number.isFinite(v)) onCfg({ ...cfg, [campo]: v })
      }}
      className="[&_[data-slot=slider-range]]:bg-[#C9A46A]"
    />
  </div>
)

/* ---------------- painel principal ---------------- */

export const PainelPlanosProposta: React.FC<PainelPlanosPropostaProps> = ({
  frasePaciente,
  onFraseChange,
  planos,
  onPlanoChange,
  onFotoPlanoArquivo,
  propsCab,
  propsPagina,
  propsRodape,
  onPropsChange,
  programaId,
  onFotosNovasChange,
}) => {
  const [aberto, setAberto] = useState<number | null>(0)
  const refsInput = useRefArray()
  // Fotos escolhidas nesta sessão (data URL comprimido): alimenta a miniatura
  // e a prévia do documento imediatamente, antes de salvar.
  const [fotosNovas, setFotosNovas] = useState<Record<number, string>>({})

  useEffect(() => {
    // registro trocado (edição/salvamento): limpa as fotos locais da sessão
    setFotosNovas({})
  }, [programaId])

  useEffect(() => {
    onFotosNovasChange?.(fotosNovas)
  }, [fotosNovas, onFotosNovasChange])

  const trocarPlano = useCallback(
    (i: number, patch: Partial<PlanoProposta>) => {
      const atual = planos[i]
      if (!atual) return
      onPlanoChange(i, { ...atual, ...patch })
    },
    [planos, onPlanoChange],
  )

  const trocarItem = useCallback(
    (i: number, idx: number, patch: Partial<ItemPlano>) => {
      const atual = planos[i]
      if (!atual) return
      const itens = atual.itens.map((it, k) => (k === idx ? { ...it, ...patch } : it))
      onPlanoChange(i, { ...atual, itens })
    },
    [planos, onPlanoChange],
  )

  const adicionarItem = useCallback(
    (i: number) => {
      const atual = planos[i]
      if (!atual || atual.itens.length >= ITENS_MAX) return
      onPlanoChange(i, { ...atual, itens: [...atual.itens, { icon: 'check', texto: '' }] })
    },
    [planos, onPlanoChange],
  )

  const removerItem = useCallback(
    (i: number, idx: number) => {
      const atual = planos[i]
      if (!atual) return
      if (atual.itens.length <= 1) {
        onPlanoChange(i, { ...atual, itens: [{ icon: 'check', texto: '' }] })
        return
      }
      onPlanoChange(i, { ...atual, itens: atual.itens.filter((_, k) => k !== idx) })
    },
    [planos, onPlanoChange],
  )

  const trocarParcelas = useCallback(
    (i: number, valores: string) => {
      const atual = planos[i]
      if (!atual) return
      const ns = valores
        .split(',')
        .map((s) => Math.max(1, Math.round(Number(s.trim()) || 0)))
        .filter((n) => n > 0)
      const unicas = Array.from(new Set(ns)).slice(0, PARCELAS_MAX)
      onPlanoChange(i, {
        ...atual,
        parcelas: unicas.length ? unicas.map((n) => ({ n })) : [{ n: 1 }],
      })
    },
    [planos, onPlanoChange],
  )

  const aoEscolherFoto = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onFotoPlanoArquivo(i, file)
    e.target.value = ''
    if (!file) {
      setFotosNovas((prev) => {
        const prox = { ...prev }
        delete prox[i]
        return prox
      })
      return
    }
    try {
      const dataUrl = await comprimirImagemParaDataUrl(file)
      setFotosNovas((prev) => ({ ...prev, [i]: dataUrl }))
    } catch {
      // sem prévia local: o painel segue com o placeholder
    }
  }

  const rotuloTotal = useMemo(
    () =>
      planos
        .map((p) => (Number(p.total) > 0 ? `R$ ${formatarBRL(Number(p.total))}` : '—'))
        .join('  ·  '),
    [planos],
  )

  return (
    <div className="space-y-5">
      {/* Frase do paciente (capa) */}
      <div className="space-y-1.5">
        <Label htmlFor="frase-paciente">Frase do paciente (capa)</Label>
        <Input
          id="frase-paciente"
          placeholder="Ex.: Voltar a correr sem dor em 12 semanas."
          value={frasePaciente}
          onChange={(e) => onFraseChange(e.target.value)}
        />
        <p className="text-xs text-[#8A7A6E]">
          Frase em destaque na capa. Se ficar vazia, a capa usa o nome do paciente.
        </p>
      </div>

      {/* Identidade da página 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="props-cab">Cabeçalho da página 2</Label>
          <Input
            id="props-cab"
            placeholder="Programas de Tratamento"
            value={propsCab}
            onChange={(e) => onPropsChange('props_cab', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="props-pagina">Marca lateral (nº pág.)</Label>
          <Input
            id="props-pagina"
            placeholder="Ex.: 02"
            value={propsPagina}
            onChange={(e) => onPropsChange('props_pagina', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="props-rodape">Rodapé da página 2</Label>
          <Input
            id="props-rodape"
            placeholder="Ex.: Clínica SOUL · contato@soul.com.br"
            value={propsRodape}
            onChange={(e) => onPropsChange('props_rodape', e.target.value)}
          />
        </div>
      </div>

      {/* Totais (para a faixa marrom de investimento) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {planos.map((p, i) => (
          <div className="space-y-1.5" key={`total-${i}`}>
            <Label htmlFor={`total-plano-${i}`}>Total {p.nome} (R$)</Label>
            <Input
              id={`total-plano-${i}`}
              type="number"
              min={0}
              step="0.01"
              value={p.total || ''}
              placeholder="0,00"
              onChange={(e) => trocarPlano(i, { total: Number(e.target.value) || 0 })}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-[#8A7A6E] -mt-3">
        Faixa marrom de investimento de cada plano: “À vista · R$ X” e “Nx de R$ Y” derivados do
        total. Totais atuais: {rotuloTotal}
      </p>

      {/* Os 3 planos */}
      {planos.map((plano, i) => {
        const abertoAgora = aberto === i
        const semanas = Number(plano.duracao_semanas) || 0
        const atend = Number(plano.atendimentos) || 0
        return (
          <div
            key={`plano-${i}`}
            className="rounded-lg overflow-hidden"
            style={{
              border: '1px solid #E9E1D2',
              backgroundColor: abertoAgora ? '#FAF6F0' : '#fff',
            }}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
              onClick={() => setAberto(abertoAgora ? null : i)}
            >
              <span className="font-semibold text-[#6A402D]">
                {i + 1}. {plano.nome}
              </span>
              <span className="text-xs text-[#8A7A6E]">
                {plano.itens.length} itens · {plano.parcelas.length} parcelas
              </span>
            </button>
            {abertoAgora && (
              <div className="px-4 pb-4 space-y-4">
                {/* nome + tagline + métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`nome-plano-${i}`}>Nome do plano</Label>
                    <Input
                      id={`nome-plano-${i}`}
                      value={plano.nome}
                      onChange={(e) => trocarPlano(i, { nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`tagline-plano-${i}`}>Assinatura curta</Label>
                    <Input
                      id={`tagline-plano-${i}`}
                      placeholder="Ex.: Essencial para retomar"
                      value={plano.tagline}
                      onChange={(e) => trocarPlano(i, { tagline: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`semanas-plano-${i}`}>Semanas</Label>
                    <Input
                      id={`semanas-plano-${i}`}
                      type="number"
                      min={0}
                      value={semanas || ''}
                      onChange={(e) =>
                        trocarPlano(i, { duracao_semanas: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`atend-plano-${i}`}>Atendimentos</Label>
                    <Input
                      id={`atend-plano-${i}`}
                      type="number"
                      min={0}
                      value={atend || ''}
                      onChange={(e) =>
                        trocarPlano(i, { atendimentos: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                {/* parcelas */}
                <div className="space-y-1.5">
                  <Label htmlFor={`parcelas-plano-${i}`}>
                    Parcelas (até {PARCELAS_MAX}, separadas por vírgula)
                  </Label>
                  <Input
                    id={`parcelas-plano-${i}`}
                    value={plano.parcelas.map((p) => p.n).join(', ')}
                    placeholder="1, 3"
                    onChange={(e) => trocarParcelas(i, e.target.value)}
                  />
                  <p className="text-xs text-[#8A7A6E]">
                    {plano.parcelas.map((p, k) => rotuloParcela(p.n)).join(' · ')}
                  </p>
                </div>

                {/* itens */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Itens do plano</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[#8C6527] hover:bg-[#F7F3EB]"
                      disabled={plano.itens.length >= ITENS_MAX}
                      onClick={() => adicionarItem(i)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Item
                    </Button>
                  </div>
                  {plano.itens.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2"
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid #E9E1D2',
                        borderRadius: 8,
                        padding: 8,
                      }}
                    >
                      <Select
                        value={NOMES_ICONES.includes(item.icon) ? item.icon : 'check'}
                        onValueChange={(v) => trocarItem(i, idx, { icon: v })}
                      >
                        <SelectTrigger className="w-[150px] h-9 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {NOMES_ICONES.map((nome) => (
                            <SelectItem key={nome} value={nome}>
                              {nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        placeholder="Texto do item"
                        value={item.texto}
                        onChange={(e) => trocarItem(i, idx, { texto: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#B86545] hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => removerItem(i, idx)}
                        title="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* foto do plano */}
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ width: 96, border: '1px solid #E9E1D2', backgroundColor: '#F7F3EB' }}
                  >
                    <FotoMiniaturaPlano
                      url={
                        fotosNovas[i] ||
                        getPlanoFotoUrl(programaId ? { id: programaId } : null, plano.foto)
                      }
                      cfg={plano.foto_config}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
                      onClick={() => refsInput.clique(i)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {plano.foto || fotosNovas[i] ? 'Trocar foto' : 'Enviar foto'}
                    </Button>
                    {(plano.foto || fotosNovas[i]) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#B86545] hover:text-red-600 hover:bg-red-50"
                        onClick={() => onFotoPlanoArquivo(i, null)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remover
                      </Button>
                    )}
                    <input
                      ref={(el) => refsInput.set(i, el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => aoEscolherFoto(i, e)}
                    />
                  </div>
                </div>

                {/* sliders do recorte da foto do plano */}
                {(plano.foto || fotosNovas[i]) && (
                  <div
                    className="space-y-2 p-3 rounded-lg"
                    style={{ backgroundColor: '#F7F3EB', border: '1px solid #E9E1D2' }}
                  >
                    {linhaSlider(
                      'Horizontal',
                      'x',
                      plano.foto_config,
                      (v) => trocarPlano(i, { foto_config: v }),
                      0,
                      100,
                      1,
                    )}
                    {linhaSlider(
                      'Vertical',
                      'y',
                      plano.foto_config,
                      (v) => trocarPlano(i, { foto_config: v }),
                      0,
                      100,
                      1,
                    )}
                    {linhaSlider(
                      'Zoom',
                      'z',
                      plano.foto_config,
                      (v) => trocarPlano(i, { foto_config: v }),
                      1,
                      3,
                      0.05,
                    )}
                    {linhaSlider(
                      'Intensidade',
                      'o',
                      plano.foto_config,
                      (v) => trocarPlano(i, { foto_config: v }),
                      15,
                      100,
                      1,
                    )}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#5F544F] hover:text-[#6A402D]"
                        onClick={() =>
                          trocarPlano(i, { foto_config: { ...PLANO_FOTO_CONFIG_PADRAO } })
                        }
                      >
                        Restaurar padrão
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatarBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

/** Refs de inputs de arquivo, um por plano (índice 0..n-1) */
function useRefArray() {
  const refs = React.useRef<Record<number, HTMLInputElement | null>>({})
  return {
    set: (i: number, el: HTMLInputElement | null) => {
      refs.current[i] = el
    },
    clique: (i: number) => refs.current[i]?.click(),
  }
}

export default PainelPlanosProposta
