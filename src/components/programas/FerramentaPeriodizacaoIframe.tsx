import React from 'react'

/**
 * Aba "Ferramenta de Periodização" — embute a ferramenta standalone
 * "Programas de Exercícios - Clínica Soul" (public/programas/index.html)
 * em um iframe em tela cheia.
 *
 * IMPORTANTE (tutorial de implantação): o iframe NÃO usa o atributo sandbox —
 * sem allow-same-origin o localStorage da ferramenta é bloqueado e nada é salvo.
 * `allow="clipboard-write"` mantém a cópia de textos das fichas funcionando.
 */
export const FerramentaPeriodizacaoIframe: React.FC = () => {
  return (
    <iframe
      src="/programas/index.html"
      title="Programas de Exercícios - Clínica Soul"
      style={{ width: '100%', height: '100vh', border: 0 }}
      allow="clipboard-write"
    />
  )
}
