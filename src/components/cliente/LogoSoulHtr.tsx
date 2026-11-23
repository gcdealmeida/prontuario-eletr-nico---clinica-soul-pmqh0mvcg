import { cn } from '@/lib/utils'

/**
 * Logo SOUL Health Tracker — versão vetorial fiel da logo oficial da Clínica
 * Soul (anexo do usuário): símbolo de infinito em gradiente dourado com ponto
 * cobre no centro, wordmark "SOUL" em serifa marrom e "SAÚDE E BEM ESTAR".
 * NÃO usar a marca "Guava" (referência é só de layout).
 */
export function LogoSoulHtr({
  compacto = false,
  className,
}: {
  compacto?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <SimboloInfinito className="h-9 w-14 shrink-0" />
      {!compacto && (
        <div className="leading-none">
          <p className="text-[9px] font-semibold tracking-[0.35em] text-[#7B4B2A] uppercase">
            Clínica
          </p>
          <p className="font-serif text-xl font-semibold tracking-[0.08em] text-[#5C3A21]">SOUL</p>
          <p className="mt-0.5 text-[8px] tracking-[0.28em] text-[#C9A063] uppercase">
            Health Tracker
          </p>
        </div>
      )}
    </div>
  )
}

/** Símbolo do infinito (gradiente dourado) com o ponto cobre central. */
export function SimboloInfinito({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id="soul-htr-ouro"
          x1="0"
          y1="0"
          x2="64"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#C9A063" />
          <stop offset="0.5" stopColor="#E7CFA0" />
          <stop offset="1" stopColor="#A67C3D" />
        </linearGradient>
        <radialGradient id="soul-htr-cobre" cx="0.35" cy="0.35" r="0.9">
          <stop offset="0" stopColor="#E8A184" />
          <stop offset="1" stopColor="#9E5A40" />
        </radialGradient>
      </defs>
      <path
        d="M32 16c-4 6.5-8.6 11-14 11C10.3 27 4 22.3 4 16S10.3 5 18 5c5.4 0 10 4.5 14 11 4-6.5 8.6-11 14-11 7.7 0 14 4.7 14 11s-6.3 11-14 11c-5.4 0-10-4.5-14-11Z"
        stroke="url(#soul-htr-ouro)"
        strokeWidth="3.4"
      />
      <circle cx="32" cy="16" r="4.2" fill="url(#soul-htr-cobre)" />
    </svg>
  )
}

export default LogoSoulHtr
