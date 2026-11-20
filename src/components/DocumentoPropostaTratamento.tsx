import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ProgramaTratamentoRecord, PlanoFotoConfig } from '@/services/programasTratamento'
import { getCapaFotoUrl, getLogoCustomUrl, getPlanoFotoUrl } from '@/services/programasTratamento'

/**
 * Documento da Proposta de Tratamento SOUL — arte portada do gerador original
 * (painel-soul-9677b.html): duas páginas A4 fixas de 794×1123 px, capa creme
 * (#f7f2eb) com foto à direita recortada (x/y/zoom/intensidade) e página 2
 * (#faf6f0) com os três planos em colunas e faixa marrom (#7a5233) de
 * investimento. Fontes: Cormorant Garamond (serif) e Montserrat (sans).
 */

const COR_CREME = '#f7f2eb'
const COR_PAPEL = '#faf6f0'
const COR_TINTA = '#3e2b1f'
const COR_MARROM = '#7a5233'
const COR_LINHA = 'rgba(122, 82, 51, 0.28)'
const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif'
const SANS = '"Montserrat", "Helvetica Neue", Arial, sans-serif'

export const LARGURA_PAGINA = 794
export const ALTURA_PAGINA = 1123

/** Garante as fontes do documento carregadas (prévia e exportação PDF) */
const HREF_FONTES =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap'
function garantirFontes() {
  if (document.getElementById('fontes-proposta-soul')) return
  const link = document.createElement('link')
  link.id = 'fontes-proposta-soul'
  link.rel = 'stylesheet'
  link.href = HREF_FONTES
  document.head.appendChild(link)
}

/* ---------------- corte de foto (equivalente ao crop() do original) ---------------- */

/** Estilo absoluto da <img> recortada dentro de um quadro W×H (html2canvas-safe) */
export function estiloFotoCorte(
  cfg: PlanoFotoConfig | null | undefined,
  w: number,
  h: number,
  iw?: number,
  ih?: number,
): React.CSSProperties {
  const opacidade = Math.min(100, Math.max(15, cfg?.o ?? 100)) / 100
  if (!iw || !ih) {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: opacidade,
      maxWidth: 'none',
    }
  }
  const z = Math.max(1, Number(cfg?.z) || 1)
  const base = Math.max(w / iw, h / ih) * z
  const largura = iw * base
  const altura = ih * base
  return {
    position: 'absolute',
    width: largura,
    height: altura,
    left: (w - largura) * (Math.min(100, Math.max(0, cfg?.x ?? 50)) / 100),
    top: (h - altura) * (Math.min(100, Math.max(0, cfg?.y ?? 50)) / 100),
    opacity: opacidade,
    maxWidth: 'none',
  }
}

/** Compat: assinatura antiga usada por telas que mostram a capa */
export const estiloFotoCapa = estiloFotoCorte

/** Foto recortada dentro de um quadro fixo w×h (crop x/y/zoom/intensidade) */
const FotoCortada: React.FC<{
  url: string
  cfg?: PlanoFotoConfig | null
  w: number
  h: number
}> = ({ url, cfg, w, h }) => {
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null)
  if (!url) {
    return <div style={{ width: w, height: h, backgroundColor: '#e7ddcc' }} />
  }
  return (
    <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden' }}>
      <img
        src={url}
        alt=""
        draggable={false}
        onLoad={(e) =>
          setDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
        }
        style={estiloFotoCorte(cfg, w, h, dim?.w, dim?.h)}
      />
    </div>
  )
}

/* ---------------- ajuste automático de texto (fit() do original) ---------------- */

/** Reduz a fonte até o texto caber na altura dada (como o fit() do gerador) */
const TextoAjustavel: React.FC<{
  altura: number
  base: number
  min: number
  style?: React.CSSProperties
  children: React.ReactNode
}> = ({ altura, base, min, style, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [tam, setTam] = useState(base)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let tamanho = base
    while (tamanho > min) {
      el.style.fontSize = `${tamanho}px`
      if (el.scrollHeight <= altura + 1) break
      tamanho -= 1
    }
    setTam(tamanho)
  }, [children, base, min, altura])
  return (
    <div
      ref={ref}
      style={{
        height: altura,
        overflow: 'hidden',
        fontSize: tam,
        lineHeight: 1.25,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ---------------- ícones (24 traços SVG da arte original) ---------------- */

const ICONES: Record<string, string> = {
  check: 'M5 12l5 5 9-10',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18 M12 7v5l3 3',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  star: 'M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2-5.6-3-5.6 3 1.2-6.2L3 9.5l6.3-.8z',
  heart: 'M12 20s-7-4.6-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.4-9 9-9 9z',
  atividade: 'M3 12h4l3 7 4-14 3 7h4',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  brilho:
    'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M18.4 5.6l-2.1 2.1 M7.7 16.3l-2.1 2.1',
  usuarios:
    'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-2a6 6 0 0 1 12 0v2 M16 3.5a4 4 0 0 1 0 7.7 M22 21v-2a6 6 0 0 0-4-5.6',
  zap: 'M13 2L4 14h6l-1 8 9-12h-6z',
  alvo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18 M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  premio:
    'M8 21h8 M12 17v4 M6 3h12v6a6 6 0 0 1-12 0z M6 5H3v2a4 4 0 0 0 4 4 M18 5h3v2a4 4 0 0 1-4 4',
  halter: 'M6 7v10 M18 7v10 M3 9v6 M21 9v6 M6 12h12',
  nutricao: 'M12 8c-4 0-7 3-7 8h14c0-5-3-8-7-8 M12 8c0-3 2-5 5-5 0 3-2 5-5 5',
  lua: 'M20 14a8 8 0 1 1-9.9-9.9A7 7 0 0 0 20 14z',
  sol: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M12 2v2 M12 20v2 M4 12H2 M22 12h-2 M5 5l1.5 1.5 M17.5 17.5L19 19 M19 5l-1.5 1.5 M6.5 17.5L5 19',
  onda: 'M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0 M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0',
  olho: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  folha: 'M4 20c8 0 16-6 16-16-8 0-16 4-16 12 0 2 .5 3 0 4z M4 20c2-6 6-9 10-11',
  bandeira: 'M5 21V4 M5 4h12l-2.5 4L17 12H5',
  livro: 'M4 4h9a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3z M16 4h4v13h-1a3 3 0 0 0-3 3z',
  presente:
    'M4 10h16v11H4z M4 7h16v3H4z M12 7v14 M12 7s-4 0-4-2.5S12 2 12 7z M12 7s4 0 4-2.5S12 2 12 7z',
  config:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19 12a7 7 0 0 1-.2 1.6l2 1.6-2 3.4-2.4-1a7 7 0 0 1-2.8 1.6L13 22h-2l-.6-2.8a7 7 0 0 1-2.8-1.6l-2.4 1-2-3.4 2-1.6A7 7 0 0 1 5 12',
  fone: 'M4 13a8 8 0 0 1 16 0 M4 13v4a2 2 0 0 0 2 2h1v-6H5 M20 13v4a2 2 0 0 1-2 2h-1v-6h2',
}

const ICONE_PADRAO = 'check'

/** Nomes de ícone disponíveis para o seletor do editor (mesma arte da página 2) */
export const NOMES_ICONES: string[] = Object.keys(ICONES)

const IconePlano: React.FC<{ nome: string; tamanho?: number }> = ({ nome, tamanho = 20 }) => (
  <span
    style={{
      flex: '0 0 auto',
      width: tamanho + 12,
      height: tamanho + 12,
      borderRadius: '50%',
      border: `1px solid ${COR_LINHA}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COR_MARROM,
      backgroundColor: '#ffffff',
    }}
  >
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICONES[nome] || ICONES[ICONE_PADRAO]} />
    </svg>
  </span>
)

/* ---------------- marca SOUL (logo custom ou wordmark) ---------------- */

const MarcaSOUL: React.FC<{ url: string; tamanho?: number }> = ({ url, tamanho = 1 }) => {
  if (url) {
    return (
      <img
        src={url}
        alt="Clínica SOUL"
        draggable={false}
        style={{ height: 84 * tamanho, width: 'auto', objectFit: 'contain' }}
      />
    )
  }
  return (
    <div style={{ lineHeight: 1 }}>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 52 * tamanho,
          letterSpacing: '0.32em',
          color: COR_TINTA,
        }}
      >
        SOUL
      </div>
      <div
        style={{
          marginTop: 8 * tamanho,
          fontFamily: SANS,
          fontWeight: 400,
          fontSize: 10 * tamanho,
          letterSpacing: '0.42em',
          color: COR_MARROM,
          textTransform: 'uppercase',
        }}
      >
        Fisioterapia · Movement · Health
      </div>
    </div>
  )
}

/* ---------------- páginas ---------------- */

const PaginaCapa: React.FC<{ programa: ProgramaTratamentoRecord }> = ({ programa }) => {
  const fotoUrl = getCapaFotoUrl(programa)
  const logoUrl = getLogoCustomUrl(programa)
  const duracao = Number(programa.duracao_semanas) || 0
  const semanasTexto = duracao ? `${duracao} ${duracao === 1 ? 'semana' : 'semanas'}` : ''
  return (
    <div
      style={{
        width: LARGURA_PAGINA,
        height: ALTURA_PAGINA,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: COR_CREME,
        color: COR_TINTA,
      }}
    >
      {/* foto recortada à direita, altura total */}
      <div style={{ position: 'absolute', right: 0, top: 0, width: 484, height: ALTURA_PAGINA }}>
        <FotoCortada url={fotoUrl} cfg={programa.capa_config} w={484} h={ALTURA_PAGINA} />
      </div>

      {/* coluna de texto à esquerda */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 310,
          height: ALTURA_PAGINA,
          padding: '56px 40px 48px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MarcaSOUL url={logoUrl} />

        <div style={{ marginTop: 96 }}>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              color: COR_MARROM,
            }}
          >
            Proposta de Tratamento
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 34,
              lineHeight: 1.12,
            }}
          >
            {programa.titulo || 'Programa de Tratamento'}
          </div>
        </div>

        <div style={{ marginTop: 44 }}>
          <TextoAjustavel
            altura={280}
            base={30}
            min={19}
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 500,
              color: COR_TINTA,
            }}
          >
            {programa.frase_paciente || programa.paciente_nome || ''}
          </TextoAjustavel>
        </div>

        <div style={{ marginTop: 'auto' }}>
          {(semanasTexto || programa.mes_referencia) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {semanasTexto && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '8px 14px',
                    border: `1px solid ${COR_LINHA}`,
                    borderRadius: 999,
                    backgroundColor: '#ffffff',
                  }}
                >
                  {semanasTexto}
                </span>
              )}
              {programa.mes_referencia && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '8px 14px',
                    border: `1px solid ${COR_LINHA}`,
                    borderRadius: 999,
                    backgroundColor: '#ffffff',
                  }}
                >
                  {programa.mes_referencia}
                </span>
              )}
            </div>
          )}
          <div
            style={{
              marginTop: 22,
              paddingTop: 14,
              borderTop: `1px solid ${COR_LINHA}`,
              fontFamily: SANS,
              fontWeight: 300,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: COR_MARROM,
            }}
          >
            Clínica SOUL · Programa de Tratamento
          </div>
        </div>
      </div>
    </div>
  )
}

const rotuloParcela = (n: number, total: number): string => {
  if (total <= 0) return n === 1 ? 'À vista' : `${n}x`
  return n === 1 ? `À vista · R$ ${formatar(total)}` : `${n}x de R$ ${formatar(total / n)}`
}
const formatar = (v: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const ColunaPlano: React.FC<{
  programa: ProgramaTratamentoRecord
  indice: number
}> = ({ programa, indice }) => {
  const planos = Array.isArray(programa.planos) ? programa.planos : []
  const plano = planos[indice]
  if (!plano) return <div style={{ flex: 1, minWidth: 0 }} />
  const semanas = Number(plano.duracao_semanas) || 0
  const atend = Number(plano.atendimentos) || 0
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: `1px solid ${COR_LINHA}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <FotoCortada
        url={getPlanoFotoUrl(programa, plano.foto)}
        cfg={plano.foto_config}
        w={228}
        h={150}
      />
      <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 26, lineHeight: 1.1 }}>
          {plano.nome}
        </div>
        {plano.tagline && (
          <div
            style={{
              marginTop: 6,
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 9.5,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: COR_MARROM,
            }}
          >
            {plano.tagline}
          </div>
        )}
        <div style={{ margin: '14px 0', borderTop: `1px solid ${COR_LINHA}` }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plano.itens.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <IconePlano nome={item.icon} />
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: 400,
                  fontSize: 11,
                  lineHeight: 1.45,
                  color: COR_TINTA,
                }}
              >
                {item.texto}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 14 }}>
          {(semanas > 0 || atend > 0) && (
            <div
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COR_MARROM,
              }}
            >
              {[semanas > 0 ? `${semanas} semanas` : '', atend > 0 ? `${atend} atendimentos` : '']
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}
        </div>
      </div>
      {/* faixa marrom de investimento */}
      <div
        style={{
          backgroundColor: COR_MARROM,
          color: '#f9f3ec',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {plano.parcelas.map((p, i) => (
          <div
            key={i}
            style={{
              fontFamily: SANS,
              fontWeight: i === 0 ? 600 : 400,
              fontSize: 11.5,
              letterSpacing: '0.04em',
            }}
          >
            {rotuloParcela(p.n, Number(plano.total) || 0)}
          </div>
        ))}
      </div>
    </div>
  )
}

const PaginaPlanos: React.FC<{ programa: ProgramaTratamentoRecord }> = ({ programa }) => (
  <div
    style={{
      width: LARGURA_PAGINA,
      height: ALTURA_PAGINA,
      backgroundColor: COR_PAPEL,
      color: COR_TINTA,
      padding: '40px 38px 26px',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginLeft: 34 }}>
      <div
        style={{
          flex: 1,
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 10.5,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: COR_MARROM,
        }}
      >
        {programa.props_cab || 'Programas de Tratamento'}
      </div>
      {programa.props_pagina && (
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 300,
            fontSize: 10.5,
            letterSpacing: '0.2em',
            color: COR_MARROM,
          }}
        >
          {programa.props_pagina}
        </div>
      )}
    </div>

    {programa.texto_introducao && (
      <div
        style={{
          marginTop: 22,
          marginLeft: 34,
          maxWidth: 640,
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 17,
          lineHeight: 1.5,
          color: COR_TINTA,
        }}
      >
        {programa.texto_introducao}
      </div>
    )}

    <div style={{ display: 'flex', gap: 16, marginTop: 26, flex: 1, minHeight: 0 }}>
      {[0, 1, 2].map((i) => (
        <ColunaPlano key={i} programa={programa} indice={i} />
      ))}
    </div>

    {programa.props_rodape && (
      <div
        style={{
          marginTop: 20,
          paddingTop: 12,
          borderTop: `1px solid ${COR_LINHA}`,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 300,
          fontSize: 9.5,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: COR_MARROM,
        }}
      >
        {programa.props_rodape}
      </div>
    )}
  </div>
)

/* ---------------- documento ---------------- */

export interface DocumentoPropostaTratamentoProps {
  programa: ProgramaTratamentoRecord
  /** Escala visual da prévia (exportação usa 1 = A4 exato) */
  escala?: number
}

export const DocumentoPropostaTratamento: React.FC<DocumentoPropostaTratamentoProps> = ({
  programa,
  escala = 1,
}) => {
  useEffect(garantirFontes, [])
  return (
    <div
      className="documento-proposta-soul"
      style={{
        width: LARGURA_PAGINA * escala,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        transform: escala !== 1 ? `scale(${escala})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      <PaginaCapa programa={programa} />
      <PaginaPlanos programa={programa} />
    </div>
  )
}

export default DocumentoPropostaTratamento
