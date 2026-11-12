import React from 'react'
import { parsearBlocosForca, type BlocoConteudo } from '@/lib/dinamometriaMarkdown'

/**
 * Renderização formatada do texto livre `forca_muscular_descricao`,
 * SEM nenhum markdown visível (###, **, |---|, \*): títulos como subtítulos
 * estilizados na paleta SOUL, tabelas como grade limpa, listas como bullets.
 * Usado na tela (VisualizacaoFisioterapia) e no PDF (DocumentoProntuarioInstitucional).
 */

const SOUL = {
  borda: '#E9E1D2',
  fundoClaro: '#F7F2EC',
  marrom: '#6A402D',
  cobre: '#B87355',
  textoSuave: '#73574A',
  perigo: '#B45309',
}

/** Linha única da tabela formatada (células em array, já sem markdown). */
const TabelaBloco: React.FC<{ linhas: string[][] }> = ({ linhas }) => {
  if (linhas.length === 0) return null
  const [cabecalho, ...corpo] = linhas
  const isAssimetria = (txt: string) => /assimetria|d[eé]ficit/i.test(txt)

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E9E1D2] my-2">
      <table className="w-full text-left border-collapse" style={{ fontSize: '9pt' }}>
        <thead>
          <tr style={{ backgroundColor: SOUL.fundoClaro, color: SOUL.marrom }}>
            {cabecalho.map((c, i) => (
              <th
                key={i}
                className="py-1.5 px-2.5 font-bold uppercase tracking-wide break-words"
                style={{ fontSize: '8pt', borderBottom: `1px solid ${SOUL.borda}` }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {corpo.map((cel, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#FAF7F1' : '#FFFFFF' }}>
              {cel.map((c, j) => {
                const colAssim = isAssimetria(cabecalho[j] || '')
                const valorNum = c.match(/(\d+)%/) // destaque p/ assimetrias altas
                const alta = colAssim && valorNum && Number(valorNum[1]) >= 15
                return (
                  <td
                    key={j}
                    className="py-1.5 px-2.5 break-words"
                    style={{
                      borderBottom: `1px solid ${SOUL.borda}66`,
                      color: alta ? SOUL.perigo : j === 0 ? '#1F1B18' : SOUL.textoSuave,
                      fontWeight: alta || j === 0 ? 600 : 400,
                      whiteSpace: colAssim || /^[\d.,]+\s*kgf$/i.test(c) ? 'nowrap' : 'normal',
                    }}
                  >
                    {c}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Item de bullet: remove **negrito** renderizando-o como <strong>. */
const BulletItem: React.FC<{ texto: string }> = ({ texto }) => {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return (
    <li className="flex gap-2">
      <span
        aria-hidden
        className="shrink-0 rounded-full mt-[0.45em]"
        style={{ width: 5, height: 5, backgroundColor: SOUL.cobre }}
      />
      <span style={{ color: '#1F1B18' }}>
        {partes.map((p, i) =>
          p.startsWith('**') && p.endsWith('**') ? (
            <strong key={i} style={{ color: SOUL.marrom }}>
              {p.slice(2, -2)}
            </strong>
          ) : (
            <React.Fragment key={i}>{p}</React.Fragment>
          ),
        )}
      </span>
    </li>
  )
}

export const TextoForcaFormatado: React.FC<{
  texto: string
  className?: string
  /** Quando a TabelaDinamometria já renderizou as tabelas extraídas, evita duplicação. */
  ocultarTabelas?: boolean
}> = ({ texto, className = '', ocultarTabelas = false }) => {
  const blocos = parsearBlocosForca(texto).filter((b) => !(ocultarTabelas && b.tipo === 'tabela'))
  if (blocos.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      {blocos.map((b: BlocoConteudo, i) => {
        switch (b.tipo) {
          case 'titulo':
            return (
              <div
                key={i}
                className="font-bold uppercase tracking-wide"
                style={{ color: SOUL.marrom, fontSize: '9.5pt', marginTop: i > 0 ? 6 : 0 }}
              >
                {b.texto}
              </div>
            )
          case 'subtitulo':
            return (
              <div
                key={i}
                className="font-bold"
                style={{ color: SOUL.marrom, fontSize: '9.5pt', marginTop: 4 }}
              >
                {b.texto}
              </div>
            )
          case 'tabela':
            return b.linhas ? <TabelaBloco key={i} linhas={b.linhas} /> : null
          case 'bullets':
            return (
              <ul key={i} className="space-y-1 pl-1">
                {(b.itens || []).map((it, j) => (
                  <BulletItem key={j} texto={it} />
                ))}
              </ul>
            )
          case 'formula':
            return (
              <div
                key={i}
                className="italic"
                style={{ color: SOUL.textoSuave, fontSize: '8.5pt', marginTop: 4 }}
              >
                {b.texto}
              </div>
            )
          default:
            return (
              <p
                key={i}
                className="text-justify break-words"
                style={{ color: '#1F1B18', fontSize: '9.5pt' }}
              >
                {b.texto}
              </p>
            )
        }
      })}
    </div>
  )
}

export default TextoForcaFormatado
