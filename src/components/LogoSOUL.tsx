import React from 'react'
import { cn } from '@/lib/utils'
import logoOficialImg from '@/assets/logogradiente-7e85a.jpg'

export interface LogoSOULProps {
  /**
   * - 'full': Logo oficial completo vertical (Símbolo no topo, CLÍNICA, SOUL, flor de lótus e SAÚDE E BEM ESTAR)
   * - 'symbol': Apenas o símbolo oficial dos 3 anéis entrelaçados
   * - 'compact': Símbolo + texto SOUL / Clínica simplificado para barras e menus laterais
   * - 'horizontal': Símbolo oficial à esquerda e tipografia oficial à direita
   */
  variant?: 'full' | 'compact' | 'symbol' | 'horizontal'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  theme?: 'dark' | 'light'
  className?: string
  /**
   * Quando true em variant="full", renderiza diretamente a imagem oficial completa sem divisões
   */
  useDirectImage?: boolean
}

/**
 * Componente oficial do Logo da Clínica SOUL.
 * Utiliza o arquivo oficial da imagem (src/assets/logogradiente-6d4ec.jpg) como FONTE DA VERDADE
 * absoluta para o símbolo e logotipo, garantindo fidelidade geométrica sem distorções, esticamento
 * ou recortes indevidos (object-contain, proporção travada e shrink-0).
 */
export function LogoSOUL({
  variant = 'full',
  size = 'md',
  theme = 'light',
  className,
}: LogoSOULProps) {
  const isDark = theme === 'dark'

  // Paleta adaptada ao tema
  const textColor = isDark ? '#F7F1E6' : '#5C4033'
  const textSubColor = isDark ? '#E3C89A' : '#73574A'
  const lineGold = isDark ? '#D4B278' : '#C9A46A'

  // Proporção do símbolo na imagem original:
  // A imagem original é 1:1 (quadrada).
  // O símbolo dos anéis ocupa a metade superior (~18% a 40% verticalmente, 24% a 76% horizontalmente).
  // Proporção largura:altura do símbolo é ~2.1:1.
  const symbolSizes = {
    xs: { width: 44, height: 22 },
    sm: { width: 64, height: 32 },
    md: { width: 96, height: 48 },
    lg: { width: 140, height: 70 },
    xl: { width: 190, height: 95 },
  }[size]

  // Dimensões para o símbolo isolado (versões compact/horizontal/sidebar)
  const renderOfficialSymbol = () => {
    return (
      <div
        className={cn(
          'relative overflow-hidden shrink-0 select-none flex items-center justify-center rounded-sm',
          isDark ? 'bg-white/95 p-0.5 shadow-xs' : 'bg-transparent',
        )}
        style={{
          width: `${symbolSizes.width}px`,
          height: `${symbolSizes.height}px`,
        }}
        aria-label="Símbolo oficial Clínica SOUL"
      >
        <img
          src={logoOficialImg}
          alt="Símbolo Clínica SOUL"
          className="absolute max-w-none pointer-events-none select-none"
          style={{
            width: `${symbolSizes.width * 1.9}px`,
            height: `${symbolSizes.width * 1.9}px`,
            top: `-${symbolSizes.height * 0.5}px`,
            left: `-${symbolSizes.width * 0.45}px`,
            objectFit: 'contain',
          }}
          loading="eager"
        />
      </div>
    )
  }

  // 1. Variante apenas o símbolo (ícones, favicons, topbar compacta, sidebar recolhida)
  if (variant === 'symbol') {
    return (
      <div className={cn('inline-flex items-center justify-center shrink-0', className)}>
        {renderOfficialSymbol()}
      </div>
    )
  }

  // 2. Variante compacta (sidebar expandida / cards com símbolo oficial + texto SOUL)
  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-2.5 select-none shrink-0', className)}>
        {renderOfficialSymbol()}
        <div className="flex flex-col">
          <span
            className="font-serif font-bold tracking-[0.18em] leading-none uppercase"
            style={{
              color: textColor,
              fontSize:
                size === 'xs' ? '13px' : size === 'sm' ? '17px' : size === 'lg' ? '24px' : '20px',
            }}
          >
            SOUL
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.28em] font-medium leading-tight mt-0.5"
            style={{ color: lineGold }}
          >
            Clínica
          </span>
        </div>
      </div>
    )
  }

  // 3. Variante horizontal completa (símbolo oficial à esquerda e tipografia oficial à direita)
  if (variant === 'horizontal') {
    const typography = {
      xs: {
        clinica: '8px',
        trackingClinica: '0.36em',
        soul: '18px',
        trackingSoul: '0.18em',
        lotusH: 'h-2 w-3.5',
        ruleW: 'max-w-[20px]',
        tagline: '7px',
        trackingTagline: '0.30em',
        gap: 'gap-3',
      },
      sm: {
        clinica: '9.5px',
        trackingClinica: '0.40em',
        soul: '24px',
        trackingSoul: '0.20em',
        lotusH: 'h-2.5 w-4',
        ruleW: 'max-w-[28px]',
        tagline: '8px',
        trackingTagline: '0.34em',
        gap: 'gap-3.5',
      },
      md: {
        clinica: '10.5px',
        trackingClinica: '0.42em',
        soul: '30px',
        trackingSoul: '0.22em',
        lotusH: 'h-3 w-5',
        ruleW: 'max-w-[36px]',
        tagline: '9px',
        trackingTagline: '0.36em',
        gap: 'gap-4',
      },
      lg: {
        clinica: '12px',
        trackingClinica: '0.44em',
        soul: '38px',
        trackingSoul: '0.22em',
        lotusH: 'h-3.5 w-6',
        ruleW: 'max-w-[48px]',
        tagline: '10px',
        trackingTagline: '0.38em',
        gap: 'gap-5',
      },
      xl: {
        clinica: '14px',
        trackingClinica: '0.44em',
        soul: '48px',
        trackingSoul: '0.22em',
        lotusH: 'h-4 w-7',
        ruleW: 'max-w-[60px]',
        tagline: '11px',
        trackingTagline: '0.38em',
        gap: 'gap-6',
      },
    }[size]

    return (
      <div
        className={cn(
          'inline-flex items-center select-none shrink-0 print:shrink-0',
          typography.gap,
          className,
        )}
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="shrink-0 flex items-center justify-center">{renderOfficialSymbol()}</div>

        <div className="flex flex-col items-center justify-center text-center shrink-0">
          <div className="flex items-center justify-center gap-1.5 w-full">
            <span
              className={cn('h-[1px] flex-1', typography.ruleW)}
              style={{ backgroundColor: lineGold }}
            />
            <span
              className="uppercase font-semibold leading-none tracking-widest"
              style={{
                color: textSubColor,
                fontSize: typography.clinica,
                letterSpacing: typography.trackingClinica,
                marginLeft: typography.trackingClinica,
              }}
            >
              CLÍNICA
            </span>
            <span
              className={cn('h-[1px] flex-1', typography.ruleW)}
              style={{ backgroundColor: lineGold }}
            />
          </div>

          <span
            className="font-serif font-bold leading-none uppercase my-0.5 tracking-wider"
            style={{
              color: textColor,
              fontSize: typography.soul,
              letterSpacing: typography.trackingSoul,
              marginLeft: typography.trackingSoul,
            }}
          >
            SOUL
          </span>

          <div className="flex items-center justify-center gap-1.5 w-full my-0.5">
            <span
              className={cn('h-[1px] flex-1', typography.ruleW)}
              style={{ backgroundColor: lineGold }}
            />
            <svg
              viewBox="0 0 32 20"
              preserveAspectRatio="xMidYMid meet"
              className={cn('shrink-0', typography.lotusH)}
              fill="none"
              stroke={lineGold}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path
                d="M 16 3 C 13.5 8 13.5 14 16 17 C 18.5 14 18.5 8 16 3 Z"
                fill={isDark ? '#4A322A' : '#FFF9F0'}
              />
              <path d="M 16 17 C 12 16 8 13 9 8 C 11.5 8 14.5 12 16 17 Z" />
              <path d="M 16 17 C 20 16 24 13 23 8 C 20.5 8 17.5 12 16 17 Z" />
            </svg>
            <span
              className={cn('h-[1px] flex-1', typography.ruleW)}
              style={{ backgroundColor: lineGold }}
            />
          </div>

          <span
            className="uppercase font-light leading-none"
            style={{
              color: textSubColor,
              fontSize: typography.tagline,
              letterSpacing: typography.trackingTagline,
              marginLeft: typography.trackingTagline,
            }}
          >
            SAÚDE E BEM-ESTAR
          </span>
        </div>
      </div>
    )
  }

  // 4. Variante FULL (VERTICAL OFICIAL):
  // Exibe a arte oficial original completa (src/assets/logogradiente-6d4ec.jpg)
  // que contém toda a composição vertical empilhada oficial centralizada:
  // (símbolo no topo → CLÍNICA → SOUL → lótus → SAÚDE E BEM-ESTAR)
  // com aspect-ratio 1:1 travado, object-fit contain, sem cortes em baixo,
  // preservando a nitidez total tanto em tela quanto em impressão/PDF.
  const fullDimension = {
    xs: { width: 96, height: 96 },
    sm: { width: 140, height: 140 },
    md: { width: 190, height: 190 },
    lg: { width: 250, height: 250 },
    xl: { width: 320, height: 320 },
  }[size]

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center text-center select-none shrink-0 print:shrink-0 overflow-visible',
        className,
      )}
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 select-none overflow-visible',
          isDark && 'rounded-2xl p-2 bg-white/95 shadow-md',
        )}
        style={{
          width: `${fullDimension.width}px`,
          height: `${fullDimension.height}px`,
          aspectRatio: '1 / 1',
        }}
      >
        <img
          src={logoOficialImg}
          alt="Clínica SOUL — Saúde e Bem-Estar"
          className="w-full h-full object-contain pointer-events-none select-none block max-w-full"
          style={{
            aspectRatio: '1 / 1',
            objectFit: 'contain',
            overflow: 'visible',
          }}
          loading="eager"
        />
      </div>
    </div>
  )
}

/**
 * Componente dedicado que renderiza diretamente a imagem oficial completa da Clínica SOUL
 * com aspecto 1:1 rigorosamente travado, sem estiramento ou distorção.
 */
export function LogoSOULImage({
  size = 'md',
  className,
  alt = 'Clínica SOUL — Saúde e Bem-Estar',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
}) {
  const dimensionClass = {
    xs: 'w-24 h-24 max-w-[96px]',
    sm: 'w-36 h-36 max-w-[144px]',
    md: 'w-48 h-48 max-w-[192px]',
    lg: 'w-64 h-64 max-w-[256px]',
    xl: 'w-80 h-80 max-w-[320px]',
  }[size]

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center select-none aspect-square overflow-visible',
        dimensionClass,
        className,
      )}
      style={{
        aspectRatio: '1 / 1',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <img
        src={logoOficialImg}
        alt={alt}
        className="w-full h-full object-contain pointer-events-none select-none block"
        style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
        loading="eager"
      />
    </div>
  )
}

export default LogoSOUL
