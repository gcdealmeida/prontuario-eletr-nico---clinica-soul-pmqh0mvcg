# Implantação da Ferramenta de Periodização

A ferramenta standalone "Programas de Exercícios - Clínica Soul"
(`src/assets/index-6c05c.html`, ~272 KB) agora é embutida **via código do app**
em `src/programas/embed.ts` + `src/components/programas/FerramentaPeriodizacaoIframe.tsx`.

## Por que não existe `public/programas/index.html`

Os arquivos da ferramenta estão todos acima do limite de ~98 KB das ferramentas
de escrita do builder (index.html ~272 KB; xlsx ~940 KB; jspdf ~360 KB;
html2canvas ~195 KB) e o ambiente de build não expõe shell. A plataforma também
protege `package.json` e `vite.config.ts` (preventAI), o que impede tanto
adicionar o mammoth às dependências quanto criar um plugin de cópia no build.

A solução equivalente, sem `public/programas/`:

- O HTML completo entra pelo `?raw` do Vite (`HTML_FERRAMENTA`) e é renderizado
  num iframe `srcDoc` — mesma origem do app, então `localStorage` e downloads
  (`a.download`) funcionam normalmente, sem atributo `sandbox`.
- xlsx, html2canvas e jspdf são importados dos pacotes LOCAIS do `node_modules`
  pelo embed (sem CDN) e injetados como globais (`XLSX`, `html2canvas`,
  `window.jspdf.jsPDF`) na window do iframe, que a ferramenta lê no uso.
- O mammoth (leitor de .docx) não está instalado e continua sendo carregado em
  runtime de CDN com fallback entre 3 fontes — mesmo padrão de
  `src/lib/importacaoProgramas.ts` (`carregarMammoth()`).

## Testes de aceitação (aba Ferramenta de Periodização)

1. Aba abre a ferramenta em tela cheia dentro do iframe (Reabilitação e Personal).
2. Importar um `.xlsx` reconhece as abas/semanas e mostra o Painel de análise.
3. Baixar PDF e PNG da ficha funciona (jspdf + html2canvas locais, sem CDN).
4. Importar `.docx` funciona quando há internet (mammoth via CDN).
5. Backup/exportar `.json` funciona (iframe sem `sandbox`, com `clipboard-write`).

## Observação sobre armazenamento

Sem `window.claude` no navegador do app, a ferramenta salva tudo em
`localStorage` — "Salvas somente neste navegador".
