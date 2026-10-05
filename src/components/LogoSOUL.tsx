import React from 'react'
import { cn } from '@/lib/utils'

export interface LogoSOULProps {
  variant?: 'full' | 'compact' | 'symbol' | 'horizontal'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  theme?: 'dark' | 'light'
  className?: string
}

/**
 * Componente SVG oficial da Clínica SOUL.
 * Recriado fielmente a partir do logo oficial:
 * - Símbolo: 3 loops entrelaçados (serpentina / infinito triplo suave) com gradiente dourado champagne
 * - Botão central: círculo sólido no loop do meio com gradiente metálico rosé/cobre
 * - Textos: "CLÍNICA" com linhas douradas laterais, "SOUL" em Didone serifada elegante,
 *   ornamento de flor de lótus de 3 pétalas e tagline "SAÚDE E BEM ESTAR".
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

  // Variantes de tamanho para o símbolo
  const symbolDimensions = {
    xs: { width: 28, height: 16 },
    sm: { width: 44, height: 24 },
    md: { width: 72, height: 40 },
    lg: { width: 110, height: 60 },
    xl: { width: 160, height: 86 },
  }[size]

  // Render do símbolo (3 loops em serpentina contínua + centro rosé/cobre)
  const renderSymbol = (uid: string) => (
    <svg
      viewBox="0 0 240 120"
      preserveAspectRatio="xMidYMid meet"
      width={symbolDimensions.width}
      height={symbolDimensions.height}
      style={{
        width: `${symbolDimensions.width}px`,
        height: `${symbolDimensions.height}px`,
        aspectRatio: '240 / 120',
      }}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente Dourado Champagne principal */}
        <linearGradient id={`goldGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#AF8349" />
          <stop offset="25%" stopColor="#DFBF8E" />
          <stop offset="50%" stopColor="#F5E7CB" />
          <stop offset="75%" stopColor="#DFBF8E" />
          <stop offset="100%" stopColor="#C9A46A" />
        </linearGradient>

        {/* Gradiente Dourado para reflexos internos */}
        <linearGradient id={`goldShine-${uid}`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FFF2DC" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#9C7339" stopOpacity="0.2" />
        </linearGradient>

        {/* Gradiente Cobre/Rosé do núcleo central */}
        <radialGradient id={`roseCore-${uid}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#E5A894" />
          <stop offset="45%" stopColor="#B87355" />
          <stop offset="90%" stopColor="#8A4A33" />
          <stop offset="100%" stopColor="#5E2C1A" />
        </radialGradient>

        {/* Sombra suave para o núcleo rosé */}
        <filter id={`softShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="1.5"
            floodColor="#33221C"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      {/* Traçado dos 3 anéis entrelaçados:
          Loop 1: centro x=50, raio ~35, espessura ~12
          Loop 2: centro x=120, raio ~35
          Loop 3: centro x=190, raio ~35
          Desenhados em curvas suaves com espessura uniforme de 11.5px */}
      <g
        fill="none"
        stroke={`url(#goldGrad-${uid})`}
        strokeWidth="11.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Círculo / Loop Esquerdo */}
        <circle cx="50" cy="60" r="34" />
        {/* Círculo / Loop Direito */}
        <circle cx="190" cy="60" r="34" />
        {/* Círculo / Loop Central (entrelaçado sobreposto) */}
        <circle cx="120" cy="60" r="34" />
      </g>

      {/* Curvas de reforço nos entrelaçamentos para dar a sensação de fita contínua em serpentina */}
      <path
        d="M 85 60 C 85 41 97 26 120 26 C 143 26 155 41 155 60"
        fill="none"
        stroke={`url(#goldGrad-${uid})`}
        strokeWidth="11.5"
        strokeLinecap="round"
      />
      <path
        d="M 50 26 C 73 26 85 41 85 60 C 85 79 97 94 120 94"
        fill="none"
        stroke={`url(#goldShine-${uid})`}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Núcleo Central: pequeno botão sólido em tom rosé/cobre metálico com anel sutil */}
      <circle
        cx="120"
        cy="60"
        r="14.5"
        fill={`url(#roseCore-${uid})`}
        filter={`url(#softShadow-${uid})`}
      />
      {/* Detalhe de reflexo metálico cônico no núcleo */}
      <circle cx="119" cy="58" r="4.5" fill="#FFFFFF" opacity="0.35" />
    </svg>
  )

  const uid = React.useId().replace(/[:]/g, '')

  // 1. Variante apenas o símbolo (ícones, favicons, avatar)
  if (variant === 'symbol') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        {renderSymbol(uid)}
      </div>
    )
  }

  // 2. Variante compacta (horizontal ou para sidebar: símbolo + "SOUL")
  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
        {renderSymbol(uid)}
        <div className="flex flex-col">
          <span
            className="font-serif font-semibold tracking-[0.18em] leading-none uppercase"
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

  // 3. Variante horizontal completa (para cabeçalhos de documento ou topbar expandida)
  // Perfeitamente balanceada e alinhada: símbolo à esquerda + bloco tipográfico oficial à direita
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
        gap: 'gap-2.5',
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
        className={cn('inline-flex items-center select-none shrink-0', typography.gap, className)}
      >
        {/* Símbolo com dimensões fixas proporcionais e preservação estrita de aspect ratio */}
        <div className="shrink-0 flex items-center justify-center">{renderSymbol(uid)}</div>

        {/* Bloco tipográfico oficial alinhado centralmente com o símbolo */}
        <div className="flex flex-col items-center justify-center text-center shrink-0">
          {/* CLÍNICA com linhas douradas laterais */}
          <div className="flex items-center justify-center gap-1.5 w-full">
            <span
              className={cn('h-[1px] flex-1', typography.ruleW)}
              style={{ backgroundColor: lineGold }}
            />
            <span
              className="uppercase font-semibold leading-none"
              style={{
                color: textSubColor,
                fontSize: typography.clinica,
                letterSpacing: typography.trackingClinica,
                marginLeft: typography.trackingClinica, // compensa o tracking no centro
              }}
            >
              CLÍNICA
            </span>
            <span
              className={cn('h-[1px] flex-1', typography.ruleW)}
              style={{ backgroundColor: lineGold }}
            />
          </div>

          {/* SOUL em Cormorant Garamond maiúsculo */}
          <span
            className="font-serif font-bold leading-none uppercase my-0.5"
            style={{
              color: textColor,
              fontSize: typography.soul,
              letterSpacing: typography.trackingSoul,
              marginLeft: typography.trackingSoul,
            }}
          >
            SOUL
          </span>

          {/* Traço fino dourado com Flor de Lótus de 3 pétalas oficial */}
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
              {/* Pétala central de lótus */}
              <path
                d="M 16 3 C 13.5 8 13.5 14 16 17 C 18.5 14 18.5 8 16 3 Z"
                fill={isDark ? '#4A322A' : '#FFF9F0'}
              />
              {/* Pétala esquerda */}
              <path d="M 16 17 C 12 16 8 13 9 8 C 11.5 8 14.5 12 16 17 Z" />
              {/* Pétala direita */}
              <path d="M 16 17 C 20 16 24 13 23 8 C 20.5 8 17.5 12 16 17 Z" />
            </svg>
            <span
              className={cn('h-[1px] flex-1', typography.ruleW)}
              style={{ backgroundColor: lineGold }}
            />
          </div>

          {/* Tagline SAÚDE E BEM-ESTAR */}
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

  // 4. Variante COMPLETA oficial (como na imagem do logo original):
  // Símbolo no topo
  // C L Í N I C A com traços dourados
  // SOUL em Didone maiúsculo bem espaçado
  // Traço fino dourado com flor de lótus de 3 pétalas ao centro
  // S A Ú D E   E   B E M   E S T A R
  return (
    <div className={cn('inline-flex flex-col items-center text-center select-none', className)}>
      {/* Símbolo Triplo */}
      <div className="mb-2.5">{renderSymbol(uid)}</div>

      {/* CLÍNICA com linhas douradas laterais */}
      <div className="w-full max-w-[280px] flex items-center justify-center gap-2.5 my-1">
        <span className="h-[1px] flex-1 max-w-[48px]" style={{ backgroundColor: lineGold }} />
        <span
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.42em] font-medium leading-none"
          style={{ color: textSubColor, marginLeft: '0.42em' }}
        >
          CLÍNICA
        </span>
        <span className="h-[1px] flex-1 max-w-[48px]" style={{ backgroundColor: lineGold }} />
      </div>

      {/* SOUL em Serifada Didone elegante */}
      <h1
        className="font-serif font-semibold tracking-[0.22em] leading-none uppercase my-1 text-center"
        style={{
          color: textColor,
          fontSize:
            size === 'xs'
              ? '24px'
              : size === 'sm'
                ? '32px'
                : size === 'md'
                  ? '44px'
                  : size === 'lg'
                    ? '56px'
                    : '68px',
          marginLeft: '0.22em', // compensa o tracking no alinhamento central
        }}
      >
        SOUL
      </h1>

      {/* Ornamento: Linha fina dourada com Flor de Lótus de 3 pétalas central */}
      <div className="w-full max-w-[260px] flex items-center justify-center gap-2 my-1.5">
        <span className="h-[1px] flex-1 max-w-[64px]" style={{ backgroundColor: lineGold }} />
        <svg
          viewBox="0 0 32 20"
          preserveAspectRatio="xMidYMid meet"
          className="h-3.5 w-6 shrink-0"
          fill="none"
          stroke={lineGold}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Pétala central de lótus */}
          <path
            d="M 16 3 C 13.5 8 13.5 14 16 17 C 18.5 14 18.5 8 16 3 Z"
            fill={isDark ? '#4A322A' : '#FFF9F0'}
          />
          {/* Pétala esquerda */}
          <path d="M 16 17 C 12 16 8 13 9 8 C 11.5 8 14.5 12 16 17 Z" />
          {/* Pétala direita */}
          <path d="M 16 17 C 20 16 24 13 23 8 C 20.5 8 17.5 12 16 17 Z" />
        </svg>
        <span className="h-[1px] flex-1 max-w-[64px]" style={{ backgroundColor: lineGold }} />
      </div>

      {/* Tagline "SAÚDE E BEM-ESTAR" */}
      <p
        className="text-[9px] sm:text-[10px] uppercase tracking-[0.38em] font-light leading-none mt-1"
        style={{ color: textSubColor, marginLeft: '0.38em' }}
      >
        SAÚDE E BEM-ESTAR
      </p>
    </div>
  )
}
export default LogoSOUL
