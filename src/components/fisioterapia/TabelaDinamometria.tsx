import React from 'react'
import { Activity } from 'lucide-react'
import type { DinamometroLeituraItem } from '@/types/database'
import type { LinhaComSegmento } from '@/lib/dinamometriaMarkdown'
import { extrairLeiturasComSegmentos } from '@/lib/dinamometriaMarkdown'

/**
 * Tabela estilizada (paleta SOUL) + gráficos de barras em SVG puro das leituras
 * do dinamômetro. O SVG é compatível com window.print e com captura em canvas.
 * Leituras são extraídas também do texto livre `forca_muscular_descricao`
 * (padrão gerado pelo extrator IA "D: valor kgf / E: valor kgf").
 */

const SOUL = {
  borda: '#E9E1D2',
  fundoClaro: '#F7F2EC',
  dourado: '#C9A46A',
  marrom: '#6A402D',
  cobre: '#B87355',
  textoSuave: '#73574A',
  perigo: '#B45309',
  ok: '#3D7A4E',
}

export function parseNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  const txt = String(valor).trim()
  if (!txt) return null
  const m = txt.replace(',', '.').match(/-?\d+(\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

export interface LeituraTabela {
  movimento: string
  direita: number | null
  esquerda: number | null
  assimetriaPct: number | null
  observacao?: string
}

/** Normaliza registros JSON (campo dinamometro_leituras) em linhas da tabela. */
export function normalizarLeiturasJson(bruto: unknown): LeituraTabela[] {
  if (!Array.isArray(bruto)) return []
  const linhas: LeituraTabela[] = []
  for (const it of bruto) {
    if (!it || typeof it !== 'object') continue
    const rec = it as Record<string, unknown>
    const movimento = String(rec.movimento ?? rec.grupo ?? rec.musculo ?? rec.nome ?? '').trim()
    const direita = parseNumero(rec.direito_kgf ?? rec.direito ?? rec.kgf_direito ?? rec.direita)
    const esquerda = parseNumero(
      rec.esquerdo_kgf ?? rec.esquerdo ?? rec.kgf_esquerdo ?? rec.esquerda,
    )
    const observacao = String(rec.observacao ?? rec.observacoes ?? '').trim()
    if (!movimento && direita === null && esquerda === null) continue
    linhas.push({ movimento: movimento || '—', direita, esquerda, assimetriaPct: null, observacao })
  }
  return linhas
}

/**
 * Extrai leituras do texto livre forca_muscular_descricao.
 * Reconhece: "Flexão de joelho D: 28,4 kgf | E: 24,1 kgf", tabelas em markdown
 * agrupadas por segmento ("**Quadril**" + | Movimento | Direito | Esquerdo |),
 * linhas "Direito (kgf): 28.4" etc.
 */
export function extrairLeiturasDoTexto(texto: string): LeituraTabela[] {
  if (!texto || !texto.trim()) return []
  const linhas: LeituraTabela[] = []

  // Formato novo: tabelas markdown agrupadas por segmento (prioritário)
  const md = extrairLeiturasComSegmentos(texto)
  if (md.length > 0) return md.map(({ segmento: _seg, ...rest }) => rest)

  // Padrão 1: "<Movimento>" ... D/Direito/Direita: <num> kgf ... E/Esquerdo/Esquerda: <num> kgf
  const reLados =
    /(?:^|\n|\||;)\s*([^\n|;:]{3,80}?)\s*(?:D|Dir\.?|Direito|Direita)\s*[:\-–]\s*(\d+(?:[.,]\d+)?)\s*(?:kgf|kg|N)?[\s\S]{0,60}?(?:E|Esq\.?|Esquerdo|Esquerda)\s*[:\-–]\s*(\d+(?:[.,]\d+)?)\s*(?:kgf|kg|N)?/gi
  let m: RegExpExecArray | null
  while ((m = reLados.exec(texto)) !== null) {
    const movimento = m[1]
      .replace(/^[•\-\s*]+/, '')
      .replace(/\s*\(kgf\)\s*$/i, '')
      .trim()
    if (movimento.length < 3) continue
    linhas.push({
      movimento,
      direita: parseNumero(m[2]),
      esquerda: parseNumero(m[3]),
      assimetriaPct: null,
    })
  }
  if (linhas.length > 0) return linhas

  // Padrão 2: cada linha "Movimento | 28.4 | 24.1" (tabela copiada de planilha)
  for (const linhaBruta of texto.split('\n')) {
    const partes = linhaBruta
      .split('|')
      .map((p) => p.trim())
      .filter((p) => p && p !== '-' && p !== '---')
    if (partes.length < 3) continue
    const [nome, d, e] = partes
    const direita = parseNumero(d)
    const esquerda = parseNumero(e)
    if (!nome || nome.toLowerCase().includes('direito') || direita === null || esquerda === null)
      continue
    linhas.push({ movimento: nome, direita, esquerda, assimetriaPct: null })
  }
  return linhas
}

/** Calcula o % de assimetria (déficit do lado menor em relação ao maior). */
function calcularAssimetria(direita: number | null, esquerda: number | null): number | null {
  if (direita === null || esquerda === null) return null
  const maior = Math.max(direita, esquerda)
  if (maior <= 0) return null
  return Math.round((Math.abs(direita - esquerda) / maior) * 1000) / 10
}

function formatarValor(v: number | null): string {
  if (v === null) return '—'
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kgf`
}

/** Grupo de leituras de um mesmo segmento (ex.: "Quadril", "Joelho"). */
export interface GrupoLeituras {
  segmento: string
  linhas: LeituraTabela[]
}

/** Agrupa linhas por segmento (extraído do parser markdown ou "Geral"). */
export function agruparPorSegmento(linhas: LinhaComSegmento[]): GrupoLeituras[] {
  const grupos: GrupoLeituras[] = []
  const mapa = new Map<string, LeituraTabela[]>()
  for (const l of linhas) {
    const seg = (l.segmento || 'Geral').trim() || 'Geral'
    const arr = mapa.get(seg)
    if (arr) arr.push(l)
    else mapa.set(seg, [l])
  }
  for (const [segmento, arr] of mapa) {
    grupos.push({ segmento, linhas: arr })
  }
  return grupos
}

/** Gráfico de barras comparando Direito x Esquerdo por movimento (SVG puro). */
const GraficoBarrasDinamometro: React.FC<{ linhas: LeituraTabela[] }> = ({ linhas }) => {
  if (linhas.length === 0) return null

  const rotulos = linhas.map((l, i) => (l.movimento || `Item ${i + 1}`).slice(0, 22))
  const maxValor = Math.max(1, ...linhas.flatMap((l) => [l.direita ?? 0, l.esquerda ?? 0]))
  const escalaMax = Math.ceil((maxValor * 1.15) / 5) * 5

  const alturaRotulo = 46
  const alturaGrafico = 170
  const larguraRotulo = 120
  const larguraBarra = 16
  const gapEntreBarras = 6
  const larguraGrupo = larguraBarra * 2 + gapEntreBarras
  const gapEntreGrupos = 24
  const larguraArea = linhas.length * (larguraGrupo + gapEntreGrupos) - gapEntreGrupos
  const larguraTotal = larguraRotulo + larguraArea + 34
  const alturaTotal = alturaRotulo + alturaGrafico + 30

  return (
    <svg
      viewBox={`0 0 ${larguraTotal} ${alturaTotal}`}
      width="100%"
      style={{ maxHeight: 260, display: 'block' }}
      role="img"
      aria-label="Gráfico comparativo de força por movimento (kgf)"
    >
      {/* Linhas de grade horizontais com rótulo de escala */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = alturaRotulo + alturaGrafico - f * alturaGrafico
        return (
          <g key={f}>
            <line
              x1={larguraRotulo}
              y1={y}
              x2={larguraRotulo + larguraArea}
              y2={y}
              stroke={SOUL.borda}
              strokeWidth="1"
            />
            <text
              x={larguraRotulo - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill={SOUL.textoSuave}
              fontFamily="Montserrat, sans-serif"
            >
              {Math.round(escalaMax * f)}
            </text>
          </g>
        )
      })}

      {linhas.map((l, i) => {
        const xGrupo = larguraRotulo + i * (larguraGrupo + gapEntreGrupos)
        const baseY = alturaRotulo + alturaGrafico
        const alturaD = l.direita !== null ? (l.direita / escalaMax) * alturaGrafico : 0
        const alturaE = l.esquerda !== null ? (l.esquerda / escalaMax) * alturaGrafico : 0
        return (
          <g key={i}>
            {l.direita !== null && (
              <g>
                <rect
                  x={xGrupo}
                  y={baseY - alturaD}
                  width={larguraBarra}
                  height={alturaD}
                  rx="3"
                  fill={SOUL.dourado}
                />
                <text
                  x={xGrupo + larguraBarra / 2}
                  y={baseY - alturaD - 4}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill={SOUL.marrom}
                  fontFamily="Montserrat, sans-serif"
                >
                  {l.direita.toLocaleString('pt-BR')}
                </text>
              </g>
            )}
            {l.esquerda !== null && (
              <g>
                <rect
                  x={xGrupo + larguraBarra + gapEntreBarras}
                  y={baseY - alturaE}
                  width={larguraBarra}
                  height={alturaE}
                  rx="3"
                  fill={SOUL.cobre}
                />
                <text
                  x={xGrupo + larguraBarra + gapEntreBarras + larguraBarra / 2}
                  y={baseY - alturaE - 4}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill={SOUL.marrom}
                  fontFamily="Montserrat, sans-serif"
                >
                  {l.esquerda.toLocaleString('pt-BR')}
                </text>
              </g>
            )}
            {/* Rótulo do movimento (quebra em até 2 linhas) */}
            <text
              x={xGrupo + larguraGrupo / 2}
              y={baseY + 14}
              textAnchor="middle"
              fontSize="8.5"
              fill={SOUL.textoSuave}
              fontFamily="Montserrat, sans-serif"
            >
              {(() => {
                const rot = rotulos[i]
                const palavras = rot.split(' ')
                const linha1: string[] = []
                let larguraAcumulada = 0
                while (palavras.length > 0 && larguraAcumulada < 14) {
                  const p = palavras.shift() as string
                  linha1.push(p)
                  larguraAcumulada += p.length + 1
                }
                const linha2 = palavras.join(' ').slice(0, 20)
                if (!linha2) return null
                return (
                  <>
                    <tspan x={xGrupo + larguraGrupo / 2} dy="0">
                      {linha1.join(' ').slice(0, 20)}
                    </tspan>
                    <tspan x={xGrupo + larguraGrupo / 2} dy="11">
                      {linha2}
                    </tspan>
                  </>
                )
              })()}
            </text>
          </g>
        )
      })}

      {/* Legenda */}
      <g fontFamily="Montserrat, sans-serif" fontSize="9">
        <rect
          x={larguraRotulo}
          y={alturaTotal - 16}
          width="10"
          height="10"
          rx="2"
          fill={SOUL.dourado}
        />
        <text x={larguraRotulo + 14} y={alturaTotal - 7.5} fill={SOUL.textoSuave}>
          Lado Direito
        </text>
        <rect
          x={larguraRotulo + 96}
          y={alturaTotal - 16}
          width="10"
          height="10"
          rx="2"
          fill={SOUL.cobre}
        />
        <text x={larguraRotulo + 110} y={alturaTotal - 7.5} fill={SOUL.textoSuave}>
          Lado Esquerdo
        </text>
        <text x={larguraTotal - 4} y={alturaTotal - 7.5} textAnchor="end" fill={SOUL.textoSuave}>
          kgf
        </text>
      </g>
    </svg>
  )
}

export interface TabelaDinamometriaProps {
  leituras: DinamometroLeituraItem[]
  descricaoTexto?: string
  className?: string
}

/**
 * Bloco completo de dinamometria: tabela estilizada + gráficos.
 * Reutilizado na tela (VisualizacaoFisioterapia) e no PDF (DocumentoProntuarioInstitucional).
 */
export const TabelaDinamometria: React.FC<TabelaDinamometriaProps> = ({
  leituras,
  descricaoTexto = '',
  className = '',
}) => {
  const doJson = normalizarLeiturasJson(leituras)

  // 1) Extração prioritária: tabelas markdown agrupadas por segmento
  const doMarkdown = extrairLeiturasComSegmentos(descricaoTexto)
  let linhasComSegmento: LinhaComSegmento[] = doMarkdown
  if (doMarkdown.length === 0) {
    // 2) Fallback: padrões "D: X kgf | E: Y kgf" e tabelas simples (sem segmento)
    linhasComSegmento = extrairLeiturasDoTexto(descricaoTexto).map((l) => ({
      ...l,
      segmento: 'Geral',
    }))
  }
  // 3) JSON estruturado tem prioridade (mescla por movimento+segmento)
  for (const l of doJson) {
    const seg = 'Geral'
    const existente = linhasComSegmento.find(
      (x) =>
        x.movimento.toLowerCase() === l.movimento.toLowerCase() && (x.segmento || 'Geral') === seg,
    )
    if (existente) {
      existente.direita = l.direita
      existente.esquerda = l.esquerda
      existente.observacao = l.observacao
    } else {
      linhasComSegmento.push({ ...l, segmento: seg })
    }
  }

  const linhas: LinhaComSegmento[] = linhasComSegmento
    .map((l) => ({ ...l, assimetriaPct: calcularAssimetria(l.direita, l.esquerda) }))
    .filter((l) => l.direita !== null || l.esquerda !== null)

  if (linhas.length === 0) return null

  const grupos = agruparPorSegmento(linhas)

  const assimetrias = linhas.filter((l) => l.assimetriaPct !== null)
  const maiorAssimetria = assimetrias.reduce(
    (acc, l) => ((l.assimetriaPct ?? 0) > (acc.assimetriaPct ?? 0) ? l : acc),
    assimetrias[0],
  )

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ===== TABELAS ESTILIZADAS (uma por segmento) ===== */}
      {grupos.map((g, gi) => (
        <div key={g.segmento} className="overflow-x-auto rounded-xl border border-[#E9E1D2]">
          <table className="w-full text-left border-collapse" style={{ fontSize: '9.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: SOUL.fundoClaro, color: SOUL.marrom }}>
                <th
                  colSpan={4}
                  className="py-2 px-3 font-bold uppercase tracking-wide"
                  style={{ fontSize: '8.5pt', borderBottom: `1px solid ${SOUL.borda}` }}
                >
                  {g.segmento === 'Geral' ? 'Leituras do Dinamômetro' : g.segmento}
                </th>
              </tr>
              <tr style={{ backgroundColor: SOUL.fundoClaro, color: SOUL.marrom }}>
                <th
                  className="py-2 px-3 font-bold uppercase tracking-wide"
                  style={{ fontSize: '8.5pt', borderBottom: `1px solid ${SOUL.borda}` }}
                >
                  Movimento
                </th>
                <th
                  className="py-2 px-3 text-center font-bold uppercase tracking-wide"
                  style={{ fontSize: '8.5pt', borderBottom: `1px solid ${SOUL.borda}`, width: 110 }}
                >
                  Direito (kgf)
                </th>
                <th
                  className="py-2 px-3 text-center font-bold uppercase tracking-wide"
                  style={{ fontSize: '8.5pt', borderBottom: `1px solid ${SOUL.borda}`, width: 110 }}
                >
                  Esquerdo (kgf)
                </th>
                <th
                  className="py-2 px-3 text-center font-bold uppercase tracking-wide"
                  style={{ fontSize: '8.5pt', borderBottom: `1px solid ${SOUL.borda}`, width: 100 }}
                >
                  Assimetria
                </th>
              </tr>
            </thead>
            <tbody>
              {g.linhas.map((l, idx) => {
                const assimetriaAlta = (l.assimetriaPct ?? 0) >= 15
                return (
                  <tr
                    key={`${l.movimento}-${gi}-${idx}`}
                    style={{ backgroundColor: idx % 2 === 1 ? '#FAF7F1' : '#FFFFFF' }}
                  >
                    <td
                      className="py-2 px-3 font-medium break-words"
                      style={{ color: '#1F1B18', borderBottom: `1px solid ${SOUL.borda}66` }}
                    >
                      {l.movimento}
                    </td>
                    <td
                      className="py-2 px-3 text-center font-mono font-semibold whitespace-nowrap"
                      style={{ color: SOUL.marrom, borderBottom: `1px solid ${SOUL.borda}66` }}
                    >
                      {formatarValor(l.direita)}
                    </td>
                    <td
                      className="py-2 px-3 text-center font-mono font-semibold whitespace-nowrap"
                      style={{ color: SOUL.marrom, borderBottom: `1px solid ${SOUL.borda}66` }}
                    >
                      {formatarValor(l.esquerda)}
                    </td>
                    <td
                      className="py-2 px-3 text-center font-semibold"
                      style={{
                        borderBottom: `1px solid ${SOUL.borda}66`,
                        color:
                          l.assimetriaPct === null
                            ? SOUL.textoSuave
                            : assimetriaAlta
                              ? SOUL.perigo
                              : SOUL.ok,
                      }}
                    >
                      {l.assimetriaPct === null
                        ? '—'
                        : `${l.assimetriaPct.toLocaleString('pt-BR')}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* ===== GRÁFICO ===== */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: '#FAF7F1', border: `1px solid ${SOUL.borda}` }}
      >
        <div
          className="flex items-center gap-2 mb-2"
          style={{ color: SOUL.marrom, fontSize: '9.5pt', fontWeight: 700 }}
        >
          <Activity style={{ width: 16, height: 16 }} />
          Comparativo de Força por Movimento (kgf)
        </div>
        <GraficoBarrasDinamometro linhas={linhas} />
      </div>

      {/* ===== DESTAQUE CLÍNICO ===== */}
      {maiorAssimetria && (maiorAssimetria.assimetriaPct ?? 0) > 0 && (
        <div
          className="rounded-lg p-3 text-justify"
          style={{
            backgroundColor: '#F7F2EC',
            borderLeft: `4px solid ${SOUL.marrom}`,
            fontSize: '9.5pt',
          }}
        >
          <strong style={{ color: SOUL.marrom }}>Assimetria de maior relevância: </strong>
          <span style={{ color: '#1F1B18' }}>
            {maiorAssimetria.movimento} — diferença de{' '}
            <strong>{maiorAssimetria.assimetriaPct?.toLocaleString('pt-BR')}%</strong> entre os
            lados
            {(maiorAssimetria.assimetriaPct ?? 0) >= 15
              ? ' (acima do limiar clínico de 15%, atenção à assimetria de força).'
              : '.'}
          </span>
        </div>
      )}
    </div>
  )
}

export default TabelaDinamometria
