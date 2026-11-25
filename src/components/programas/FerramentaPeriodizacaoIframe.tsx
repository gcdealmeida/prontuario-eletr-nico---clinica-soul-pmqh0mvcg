import React, { useEffect, useRef, useState } from 'react'
import { HTML_FERRAMENTA, garantirBibliotecas, injetarBibliotecasNoIframe } from '@/programas/embed'

/**
 * Aparece antes do iframe estar pronto.
 */
const placeholderFerramenta = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#FAF7F1]">
    <p className="text-sm font-semibold text-[#8C6527]">Carregando ferramenta…</p>
  </div>
)

/**
 * Aba "Ferramenta de Periodização" — embute a ferramenta standalone
 * "Programas de Exercícios - Clínica Soul" em um iframe em tela cheia.
 *
 * O HTML completo da ferramenta vem do `?raw` do Vite (src/programas/embed.ts)
 * e é renderizado via `srcDoc` — NÃO via /programas/index.html, que não existe
 * em public/ (os arquivos >98 KB não podem ser copiados pelo builder).
 *
 * IMPORTANTE: o iframe NÃO usa o atributo sandbox — sem allow-same-origin o
 * localStorage da ferramenta é bloqueado e nada é salvo. `allow="clipboard-write"`
 * mantém a cópia de textos das fichas funcionando.
 *
 * As bibliotecas vendor (xlsx, html2canvas, jspdf) são empacotadas pelo Vite a
 * partir do node_modules (sem CDN) e injetadas como globais na window do iframe
 * logo após a carga; mammoth (importação .docx) continua de CDN com fallback.
 */
export const FerramentaPeriodizacaoIframe: React.FC = () => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    garantirBibliotecas()
      .then(() => {
        if (!cancelado) injetarBibliotecasNoIframe(frameRef.current)
      })
      .catch((e: unknown) => {
        if (!cancelado)
          setErro(
            e instanceof Error
              ? `Não foi possível carregar as bibliotecas da ferramenta (${e.message}).`
              : 'Não foi possível carregar as bibliotecas da ferramenta.',
          )
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="relative h-full min-h-dvh w-full">
      {carregando && !erro && placeholderFerramenta()}
      {erro && (
        <div className="p-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {erro} Você pode continuar usando a importação de planilhas nas outras abas.
          </p>
        </div>
      )}
      <iframe
        ref={frameRef}
        srcDoc={HTML_FERRAMENTA}
        title="Programas de Exercícios - Clínica Soul"
        style={{ width: '100%', height: '100dvh', border: 0, display: 'block' }}
        allow="clipboard-write"
        onLoad={() => {
          injetarBibliotecasNoIframe(frameRef.current)
          setCarregando(false)
        }}
      />
    </div>
  )
}
