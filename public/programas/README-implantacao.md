# Implantação da Ferramenta de Periodização (public/programas/)

A aba **Ferramenta de Periodização** já está no app (Reabilitação e Personal), apontando
para `/programas/index.html`. Falta colocar os arquivos estáticos em `public/programas/`
— eles são grandes demais (>98 KB) para as ferramentas do builder e precisam ser
copiados/baixados fora dele.

## 1. Copiar o index.html

Fonte: `src/assets/index-6c05c.html` (401 KB, já com as 4 tags de script apontando para
`vendor/` local — nada a editar nele).

```bash
mkdir -p public/programas
cp src/assets/index-6c05c.html public/programas/index.html
```

Verificação: o arquivo deve ter ~401 KB e começar com `<!doctype html>`; as linhas
1342–1345 devem ser:

```html
<script src="vendor/xlsx.full.min.js"></script>
<script src="vendor/html2canvas.min.js"></script>
<script src="vendor/jspdf.umd.min.js"></script>
<script src="vendor/mammoth.browser.min.js"></script>
```

## 2. Baixar as 4 bibliotecas vendor (versões exatas)

```bash
mkdir -p public/programas/vendor
curl -fL -o public/programas/vendor/xlsx.full.min.js      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
curl -fL -o public/programas/vendor/html2canvas.min.js    https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
curl -fL -o public/programas/vendor/jspdf.umd.min.js      https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
curl -fL -o public/programas/vendor/mammoth.browser.min.js https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js
```

Não substituir por versões diferentes silenciosamente — o parser usa APIs dessas
versões (ex.: `XLSX.read` com `cellDates`).

## 3. Conferir o build

O Vite copia `public/` inteiro para o `dist` em qualquer modo (não há plugin
`vite-plugin-programas` no `vite.config.ts` — confirmado limpo). Depois de
`pnpm build`, deve existir `dist/programas/index.html` e `dist/programas/vendor/`.

## 4. Testes de aceitação (na aba Ferramenta de Periodização)

1. Aba abre a ferramenta em tela cheia dentro do iframe.
2. Importar um `.xlsx` reconhece as abas/semanas e mostra o Painel de análise
   (xlsx local do vendor/, sem CDN).
3. Baixar PDF e PNG da ficha funciona sem janela de erro (jspdf + html2canvas locais).
4. Importar backup `.json` mostra "N de N aluno(s) importado(s)".
5. Exportar backup `.json` funciona (iframe sem `sandbox`, com `clipboard-write`).

## Observação sobre armazenamento

Sem `window.claude` no navegador do app, a ferramenta salva tudo em `localStorage`
(salvo no navegador em uso — como diz a própria tela: "Salvas somente neste navegador").
