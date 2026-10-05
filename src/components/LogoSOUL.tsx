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

  // Variantes de tamanho para o símbolo dos 3 anéis entrelaçados (proporção 230:110 ≈ 2.09)
  const symbolDimensions = {
    xs: { width: 34, height: 16 },
    sm: { width: 50, height: 24 },
    md: { width: 84, height: 40 },
    lg: { width: 125, height: 60 },
    xl: { width: 178, height: 85 },
  }[size]

  // Render do símbolo oficial dos 3 anéis entrelaçados (Trefoil / Borromean Loops)
  // Geometria precisa do símbolo SOUL:
  // - 3 anéis de mesmo raio (~32px)
  // - Anel Esquerdo (ouro champagne quente)
  // - Anel Central (sobreposto com botão rosé/cobre radiante e ponto de brilho)
  // - Anel Direito (ouro champagne quente)
  // - Efeito de entrelaçamento contínuo com arcos sobrepostos e iluminação especular
  const renderSymbol = (uid: string) => (
    <svg
      viewBox="0 0 230 110"
      preserveAspectRatio="xMidYMid meet"
      width={symbolDimensions.width}
      height={symbolDimensions.height}
      style={{
        width: `${symbolDimensions.width}px`,
        height: `${symbolDimensions.height}px`,
        aspectRatio: '230 / 110',
      }}
      className="shrink-0 overflow-visible select-none"
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente Dourado Principal: ouro champagne acetinado com reflexo brilhante central */}
        <linearGradient id={`goldMain-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9C7338" />
          <stop offset="18%" stopColor="#C9A46A" />
          <stop offset="38%" stopColor="#EAD2A8" />
          <stop offset="50%" stopColor="#FFF3DC" />
          <stop offset="62%" stopColor="#DFBF8E" />
          <stop offset="82%" stopColor="#C49B5B" />
          <stop offset="100%" stopColor="#9E753B" />
        </linearGradient>

        {/* Gradiente Dourado Vertical para dar volume tubular aos aros */}
        <linearGradient id={`goldTube-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDF7EA" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#C9A46A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7F5724" stopOpacity="0.8" />
        </linearGradient>

        {/* Gradiente Diagonal Suave para o anel central */}
        <linearGradient id={`goldCenter-${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFF8ED" />
          <stop offset="30%" stopColor="#E3C393" />
          <stop offset="70%" stopColor="#B68B4B" />
          <stop offset="100%" stopColor="#8C6228" />
        </linearGradient>

        {/* Gradiente do Núcleo Central: Rosé / Cobre Metálico com profundidade e brilho perolado */}
        <radialGradient id={`roseCore-${uid}`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="18%" stopColor="#F5C6B3" />
          <stop offset="42%" stopColor="#D98A6C" />
          <stop offset="75%" stopColor="#B87355" />
          <stop offset="92%" stopColor="#874730" />
          <stop offset="100%" stopColor="#5E2C1A" />
        </radialGradient>

        {/* Sombra de profundidade sob os aros e o núcleo central */}
        <filter id={`ringShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#33221C" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Camada 1: Sombra projetada sutil para realçar os aros */}
      <g
        fill="none"
        stroke="#4A322A"
        strokeWidth="11"
        strokeOpacity="0.08"
        strokeLinecap="round"
        transform="translate(0, 1.5)"
      >
        <circle cx="55" cy="55" r="32" />
        <circle cx="175" cy="55" r="32" />
        <circle cx="115" cy="55" r="32" />
      </g>

      {/* Camada 2: Aro Esquerdo (Loop 1) */}
      <g fill="none">
        {/* Aro base dourado com espessura uniforme 10.5px */}
        <circle
          cx="55"
          cy="55"
          r="32"
          stroke={`url(#goldMain-${uid})`}
          strokeWidth="10.5"
          strokeLinecap="round"
        />
        {/* Filete de luz superior para efeito tridimensional */}
        <path
          d="M 28 45 A 32 32 0 0 1 82 45"
          stroke={`url(#goldTube-${uid})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>

      {/* Camada 3: Aro Direito (Loop 3) */}
      <g fill="none">
        <circle
          cx="175"
          cy="55"
          r="32"
          stroke={`url(#goldMain-${uid})`}
          strokeWidth="10.5"
          strokeLinecap="round"
        />
        {/* Filete de luz superior */}
        <path
          d="M 148 45 A 32 32 0 0 1 202 45"
          stroke={`url(#goldTube-${uid})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>

      {/* Camada 4: Aro Central (Loop 2) — entrelaçado sobre os aros laterais */}
      <g fill="none">
        {/* Aro central dourado completo */}
        <circle
          cx="115"
          cy="55"
          r="32"
          stroke={`url(#goldCenter-${uid})`}
          strokeWidth="10.8"
          strokeLinecap="round"
          filter={`url(#ringShadow-${uid})`}
        />
        {/* Filete de luz superior do aro central */}
        <path
          d="M 88 45 A 32 32 0 0 1 142 45"
          stroke="#FFFDF7"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>

      {/* Camada 5: Pontes de entrelaçamento (weave effect)
          Para conferir o entrelaçamento perfeito dos 3 anéis da marca SOUL */}
      {/* Arco de sobreposição no cruzamento esquerdo inferior */}
      <path
        d="M 80 62 A 32 32 0 0 0 88 77"
        fill="none"
        stroke={`url(#goldMain-${uid})`}
        strokeWidth="10.5"
        strokeLinecap="round"
      />
      {/* Arco de sobreposição no cruzamento direito superior */}
      <path
        d="M 142 33 A 32 32 0 0 1 150 48"
        fill="none"
        stroke={`url(#goldMain-${uid})`}
        strokeWidth="10.5"
        strokeLinecap="round"
      />

      {/* Camada 6: Núcleo Central Rosé/Cobre Metálico
          Pequeno medalhão circular sólido perfeitamente centralizado no loop do meio */}
      <g>
        {/* Anel de borda dourada fina ao redor do medalhão rosé */}
        <circle
          cx="115"
          cy="55"
          r="15"
          fill="none"
          stroke={`url(#goldCenter-${uid})`}
          strokeWidth="1.2"
          opacity="0.8"
        />
        {/* Núcleo sólido com gradiente rosé metálico e sombra */}
        <circle
          cx="115"
          cy="55"
          r="14"
          fill={`url(#roseCore-${uid})`}
          filter={`url(#ringShadow-${uid})`}
        />
        {/* Ponto de brilho especular perolado (reflexo de luz superior) */}
        <ellipse
          cx="111.5"
          cy="50.5"
          rx="4"
          ry="2.4"
          transform="rotate(-25 111.5 50.5)"
          fill="#FFFFFF"
          opacity="0.85"
        />
        {/* Ponto de brilho secundário menor */}
        <circle cx="117.5" cy="58" r="1.2" fill="#FFFFFF" opacity="0.35" />
      </g>
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
        {/* Símbolo com dimensões fixas proporcionais e travamento estrito de aspect ratio */}
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
              className="uppercase font-semibold leading-none tracking-widest"
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

          {/* SOUL em Cormorant Garamond serifada sofisticada */}
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
