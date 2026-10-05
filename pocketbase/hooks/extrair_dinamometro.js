/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  'POST',
  '/backend/v1/fisioterapia/extrair-dinamometro',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      // 1. Verificar se arquivo foi enviado via multipart/form-data
      const files = e.findUploadedFiles('arquivo')
      const body = e.requestInfo().body || {}
      const textoDireto = (body.texto || '').trim()

      let extraidoTexto = ''
      let nomeArquivo = ''

      if (files && files.length > 0) {
        const file = files[0]
        nomeArquivo = file.originalName || 'arquivo'
        const ext = (nomeArquivo.split('.').pop() || '').toLowerCase()

        if (ext === 'pdf' || ext === 'docx' || ext === 'xlsx') {
          try {
            const { markdown } = $documents.toMarkdown({ file: file })
            extraidoTexto = markdown
          } catch (docErr) {
            console.log('Erro ao converter documento com $documents:', docErr)
            // Se falhou (ex: OCR necessário ou erro), segue para tentar fallback ou aviso
          }
        }
      }

      // Se não temos texto extraído de documento, mas temos texto enviado (ex: CSV ou texto plano)
      if (!extraidoTexto && textoDireto) {
        extraidoTexto = textoDireto
      }

      // Se temos texto (seja de documento, pdf, csv ou fornecido), usar $ai.chat para estruturar
      if (extraidoTexto) {
        const systemPrompt = `Você é um assistente fisioterapêutico especialista em dinamometria manual e isocinética.
Sua tarefa é analisar o conteúdo extraído de um relatório/laudo/tabela de dinamômetro e produzir um resumo claro, clínico, limpo e estruturado em texto corrido/tópicos (sem markdown excessivo ou cercas de código), no idioma Português (Brasil).
Formato recomendado do resumo para o prontuário:
- Data/Aparelho do Dinamômetro (se identificável)
- Leituras por Movimento / Grupo Muscular (separando Lado Direito e Esquerdo com os valores em kgf, N ou lbs, e o % de assimetria / déficit contralateral)
- Conclusão / Observações clínicas relevantes (ex: assimetrias significativas > 15-20%, grupos com fraqueza evidente).

Se não encontrar dados de força muscular, indique claramente que não foram identificados dados de dinamometria legíveis.`

        const reply = $ai.chat({
          model: 'fast',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Por favor, analise as leituras deste arquivo de dinamômetro e extraia o resumo estruturado para o prontuário:\n\n${extraidoTexto}`,
            },
          ],
        })

        const resumo = reply.choices?.[0]?.message?.content || ''
        return e.json(200, {
          success: true,
          nome_arquivo: nomeArquivo,
          resumo: resumo.trim(),
        })
      }

      // Se for imagem ou se não houve texto extraível diretamente via documento:
      // Acionar o agente nativo 'fisioterapia-clinica-soul' ou $ai.chat informando o contexto do arquivo
      const promptAgente = `O fisioterapeuta anexou um arquivo de dinamometria manual/isocinética com nome "${nomeArquivo}".
Como especialista em fisioterapia da SOUL, forneça uma estrutura modelo de descrição para dinamometria pronta para ser preenchida/complementada pelo fisioterapeuta, com os grupos mais frequentes (Rotadores de Ombro, Extensores/Flexores de Joelho, Preensão Palmar), campos de Lado Direito (kgf), Lado Esquerdo (kgf), Cálculo de Assimetria (%) e Observações Clínicas.`

      const agentResult = $ai.agent('fisioterapia-clinica-soul').chat({
        user_id: userId,
        message: promptAgente,
      })

      const content = agentResult?.content || ''

      return e.json(200, {
        success: true,
        nome_arquivo: nomeArquivo,
        resumo: content.trim(),
        aviso:
          files &&
          files.length > 0 &&
          ['jpg', 'jpeg', 'png', 'webp'].includes(
            (nomeArquivo.split('.').pop() || '').toLowerCase(),
          )
            ? 'Arquivo de imagem anexado com sucesso. Estrutura de dinamometria inserida na descrição para complementação dos valores lidos no print.'
            : undefined,
      })
    } catch (err) {
      console.log('Erro no endpoint extrair-dinamometro:', err)
      return e.json(500, {
        error: err?.message || 'Falha ao processar extração do arquivo de dinamômetro',
      })
    }
  },
  $apis.requireAuth(),
)
