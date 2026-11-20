import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { CAPA_CONFIG_PADRAO, type CapaFotoConfig } from '@/services/programasTratamento'
import { estiloFotoCorte } from '@/components/DocumentoPropostaTratamento'

interface PainelCapaPropostaProps {
  capaFotoPreview: string
  onSelecionarArquivo: (file: File | null) => void
  onRemoverFoto: () => void
  capaConfig: CapaFotoConfig
  onCapaConfigChange: (cfg: CapaFotoConfig) => void
}

/**
 * Painel "Capa da Proposta": envio da foto da capa (com miniatura e remoção)
 * e os 4 ajustes da foto — Horizontal, Vertical, Zoom e Intensidade — iguais
 * aos do gerador de propostas (anexo propostas-soul).
 */
export const PainelCapaProposta: React.FC<PainelCapaPropostaProps> = ({
  capaFotoPreview,
  onSelecionarArquivo,
  onRemoverFoto,
  capaConfig,
  onCapaConfigChange,
}) => {
  const refInputFoto = React.useRef<HTMLInputElement>(null)
  const [previewLocal, setPreviewLocal] = useState(capaFotoPreview)

  useEffect(() => {
    setPreviewLocal(capaFotoPreview)
  }, [capaFotoPreview])

  const aoEscolherArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onSelecionarArquivo(file)
    // limpa o valor para permitir reenviar a mesma imagem depois
    e.target.value = ''
  }

  const ajustar = (campo: keyof CapaFotoConfig) => (valores: number[]) => {
    const v = valores[0]
    if (!Number.isFinite(v)) return
    onCapaConfigChange({ ...capaConfig, [campo]: v })
  }

  const linhaSlider = (
    rotulo: string,
    campo: 'x' | 'y' | 'z' | 'o',
    min: number,
    max: number,
    step: number,
  ) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-[#5F544F]">{rotulo}</Label>
        <span className="text-xs font-mono text-[#8A7A6E]">{capaConfig[campo]}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[Number(capaConfig[campo]) || 0]}
        onValueChange={ajustar(campo)}
        className="[&_[data-slot=slider-range]]:bg-[#C9A46A]"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Foto da capa */}
      <div>
        <Label className="text-sm font-medium">Foto da capa</Label>
        <div className="mt-2 flex items-start gap-3">
          <div
            className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F7F3EB', border: '1px solid #E9E1D2' }}
          >
            {previewLocal ? (
              <img
                src={previewLocal}
                alt="Prévia da foto da capa"
                className="w-full h-full object-cover"
                style={{ opacity: Math.min(1, Math.max(0.15, (capaConfig.o ?? 100) / 100)) }}
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-[#C9A46A]" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#C9A46A] text-[#6A402D] hover:bg-[#F7F3EB]"
              onClick={() => refInputFoto.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              {previewLocal ? 'Trocar foto' : 'Enviar foto'}
            </Button>
            {previewLocal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[#B86545] hover:text-red-600 hover:bg-red-50"
                onClick={onRemoverFoto}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remover
              </Button>
            )}
          </div>
          <input
            ref={refInputFoto}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={aoEscolherArquivo}
          />
        </div>
        <p className="text-xs text-[#8A7A6E] mt-2">
          A foto ocupa a metade direita da capa (formato vertical funciona melhor). A imagem não é
          copiada ao aplicar um modelo — envie-a novamente na proposta nova.
        </p>
      </div>

      {/* Ajustes da foto (só fazem sentido com foto enviada) */}
      {previewLocal && (
        <div
          className="space-y-3 p-3 rounded-lg"
          style={{ backgroundColor: '#F7F3EB', border: '1px solid #E9E1D2' }}
        >
          <div
            className="relative overflow-hidden rounded"
            style={{ width: '100%', height: 120, backgroundColor: '#f7f2eb' }}
          >
            {/* Miniatura proporcional da capa: a foto ocupa a metade direita,
                recortada pelos mesmos 4 sliders (Horizontal/Vertical/Zoom/
                Intensidade) que valem para a prévia e para o PDF. */}
            <div
              className="absolute inset-y-0 right-0 overflow-hidden"
              style={{ width: Math.round((120 * 484) / 1123) }}
            >
              <FotoRecortadaMiniatura cfg={capaConfig} src={previewLocal} />
            </div>
          </div>
          {linhaSlider('Horizontal', 'x', 0, 100, 1)}
          {linhaSlider('Vertical', 'y', 0, 100, 1)}
          {linhaSlider('Zoom', 'z', 1, 3, 0.05)}
          {linhaSlider('Intensidade', 'o', 15, 100, 1)}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[#5F544F] hover:text-[#6A402D]"
              onClick={() => onCapaConfigChange({ ...CAPA_CONFIG_PADRAO })}
            >
              Restaurar padrão
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PainelCapaProposta

/** Miniatura da foto recortada: mede a imagem e aplica o MESMO recorte do
 *  documento — recorte proporcional 484×1123 escalado para a altura de 120px
 *  (≈52×120), então o que se vê aqui é exatamente o que sai na capa/PDF. */
const FotoRecortadaMiniatura: React.FC<{ cfg: CapaFotoConfig; src: string }> = ({ cfg, src }) => {
  const [naturais, setNaturais] = React.useState<{ w: number; h: number } | null>(null)
  const escalaMini = 120 / 1123
  return (
    <div
      style={{
        position: 'relative',
        width: 484 * escalaMini,
        height: 120,
        overflow: 'hidden',
      }}
    >
      <img
        src={src}
        alt=""
        onLoad={(e) =>
          setNaturais({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
        }
        style={estiloFotoCorte(cfg, 484 * escalaMini, 120, naturais?.w, naturais?.h)}
        crossOrigin="anonymous"
      />
    </div>
  )
}
