import React from 'react'

/**
 * Rodapé institucional fixo por página do documento de impressão do prontuário.
 * Renderizado fora do fluxo (position: fixed) e ativado apenas na impressão
 * via body.imprimindo-prontuario-soul — o navegador o repete em cada página A4.
 *
 * Formato exigido pelo Modelo Institucional SOUL:
 *   Esquerda: "Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar"
 *   Direita:  "Página N"
 */
export function RodapePaginaImpressao() {
  return (
    <div id="rodape-fixo-prontuario-soul" aria-hidden="true">
      <span className="rodape-linha-institucional">
        Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar
      </span>
      <span className="rodape-pagina">Página 1</span>
    </div>
  )
}

export default RodapePaginaImpressao
