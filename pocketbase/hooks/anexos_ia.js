/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para leitura, extração clínica e resumo de anexos por IA
 * Rota: POST /backend/v1/anexos/analisar-ia
 *
 * Suporta:
 * 1. Arquivos enviados via multipart/form-data (campo 'arquivo') ou já salvos no registro
 * 2. Documentos com texto: PDFs, DOCX, XLSX, PPTX, TXT via $documents.toMarkdown
 * 3. PDFs escaneados (sem camada de texto): fallback de VISÃO — cada página do PDF é
 *    renderizada como imagem e lida por IA multimodal ($documents.pages → $ai.chat)
 * 4. Imagens (JPG, PNG, WEBP) via visão ($ai.chat com multimodal base64)
 * 5. Síntese gerada pelo agente nativo 'leitor-documentos-clinica-soul' (migration 0054),
 *    com fallback para $ai.chat direto caso o agente não responda
 * 6. Registro automático na trilha de auditoria clínica (clinical_update_logs)
 */
routerAdd(
  'POST',
  '/backend/v1/anexos/analisar-ia',
  (e) => {
    try {
      const auth = e.auth
      const userId = auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const userName = auth.getString('name') || auth.getString('email') || 'Profissional SOUL'
      const userEmail = (auth.getString('email') || '').toLowerCase().trim()

      const files = e.findUploadedFiles('arquivo')
      const body = e.requestInfo().body || {}

      const pacienteId = (body.paciente_id || '').trim()
      const avaliacaoId = (body.avaliacao_id || '').trim()
      const evolucaoId = (body.evolucao_id || '').trim()
      const especialidade = (body.especialidade || 'Fisioterapia').trim()
      const existingFilename = (body.nome_arquivo || '').trim()
      const existingCollection = (body.collection_name || '').trim()
      const existingRecordId = (body.record_id || avaliacaoId || evolucaoId || '').trim()

      const MIME_POR_EXT = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        png: 'image/png',
        webp: 'image/webp',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
      }
      const extImagens = ['jpg', 'jpeg', 'png', 'webp']
      const extDocumentos = ['pdf', 'docx', 'xlsx', 'pptx', 'txt']

      let fileName = ''
      let fileExt = ''
      let fileContentMarkdown = ''
      let isTruncated = false
      let fileBase64 = ''
      let fileMime = ''

      // ------------------------------------------------------------------
      // 1. Obter o conteúdo do documento: texto direto ou páginas renderizadas
      // ------------------------------------------------------------------
      if (files && files.length > 0) {
        const uploadedFile = files[0]
        fileName = uploadedFile.originalName || 'anexo'
        fileExt = (fileName.split('.').pop() || '').toLowerCase()

        // Verificação de tamanho (limite 10MB)
        if (uploadedFile.size > 10 * 1024 * 1024) {
          return e.json(413, {
            error: 'O arquivo excede o limite máximo permitido de 10 MB.',
          })
        }

        if (extDocumentos.includes(fileExt)) {
          try {
            const docRes = $documents.toMarkdown({ file: uploadedFile })
            fileContentMarkdown = docRes.markdown || ''
            isTruncated = !!docRes.truncated
          } catch (docErr) {
            console.log('Texto não extraível via toMarkdown:', docErr)
            // Fallback para visão acontece mais abaixo, com o arquivo original
          }
        } else if (extImagens.includes(fileExt)) {
          try {
            const reader = uploadedFile.open()
            const bytes = $io.readAll(reader)
            reader.close()
            fileBase64 = $security.base64Encode(bytes)
            fileMime = MIME_POR_EXT[fileExt] || 'image/jpeg'
          } catch (imgErr) {
            console.log('Erro ao ler bytes da imagem enviada:', imgErr)
          }
        }
      } else if (existingRecordId && existingCollection && existingFilename) {
        // Arquivo já persistido em um registro da avaliação/evolução
        fileName = existingFilename
        fileExt = (fileName.split('.').pop() || '').toLowerCase()
        try {
          const rec = $app.findRecordById(existingCollection, existingRecordId)
          if (extDocumentos.includes(fileExt)) {
            const fieldCandidates = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
            for (let f = 0; f < fieldCandidates.length; f++) {
              if (rec.collection().fields.getByName(fieldCandidates[f])) {
                try {
                  const docRes = $documents.toMarkdown({
                    record: rec,
                    field: fieldCandidates[f],
                  })
                  fileContentMarkdown = docRes.markdown || ''
                  isTruncated = !!docRes.truncated
                  break
                } catch (fieldErr) {
                  console.log(
                    'Falha ao extrair texto do campo ' + fieldCandidates[f] + ':',
                    fieldErr,
                  )
                }
              }
            }
          } else if (extImagens.includes(fileExt)) {
            try {
              const fieldCandidates = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
              for (let f = 0; f < fieldCandidates.length; f++) {
                if (rec.collection().fields.getByName(fieldCandidates[f])) {
                  const fileBytes = rec.getStoredFileBytes(fieldCandidates[f], existingFilename)
                  if (fileBytes && fileBytes.length > 0) {
                    fileBase64 = $security.base64Encode(fileBytes)
                    fileMime = MIME_POR_EXT[fileExt] || 'image/jpeg'
                    break
                  }
                }
              }
            } catch (imgErr) {
              console.log('Erro ao ler imagem de registro existente:', imgErr)
            }
          }
        } catch (recErr) {
          console.log('Erro ao ler arquivo de registro existente:', recErr)
        }
      }

      // ------------------------------------------------------------------
      // 2. Fallback de VISÃO para documentos sem camada de texto (PDF escaneado
      //    ou DOCX apenas com imagens): renderizar cada página como imagem e
      //    ler com IA multimodal. NUNCA rejeitar com erro falso de "nitidez".
      // ------------------------------------------------------------------
      if (!fileContentMarkdown && !fileBase64) {
        let sourceFile = null
        if (files && files.length > 0) {
          sourceFile = files[0]
        } else if (existingRecordId && existingCollection && existingFilename) {
          try {
            const rec = $app.findRecordById(existingCollection, existingRecordId)
            const fieldCandidates = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
            for (let f = 0; f < fieldCandidates.length; f++) {
              if (rec.collection().fields.getByName(fieldCandidates[f])) {
                const bytes = rec.getStoredFileBytes(fieldCandidates[f], existingFilename)
                if (bytes && bytes.length > 0) {
                  sourceFile = { bytes: bytes, mime: MIME_POR_EXT[fileExt] || 'application/pdf' }
                  break
                }
              }
            }
          } catch (recErr2) {
            console.log('Erro ao localizar arquivo persistido para fallback de visão:', recErr2)
          }
        }

        if (sourceFile) {
          try {
            let pagesInfo = null
            let bytes = null
            let mime = 'application/pdf'
            if (sourceFile.bytes) {
              // Arquivo persistido: converter bytes em Blob para o extrator de páginas
              bytes = sourceFile.bytes
              mime = sourceFile.mime || 'application/pdf'
              pagesInfo = $documents.pages({ bytes: new Blob([bytes], { type: mime }) })
            } else {
              pagesInfo = $documents.pages({ file: sourceFile })
            }

            if (pagesInfo && pagesInfo.length > 0) {
              const contentParts = []
              const maxPaginas = 8
              const totalPaginas = pagesInfo.length
              for (let p = 0; p < Math.min(totalPaginas, maxPaginas); p++) {
                contentParts.push({
                  type: 'text',
                  text:
                    'Página ' +
                    (p + 1) +
                    ' de ' +
                    totalPaginas +
                    ' do documento "' +
                    fileName +
                    '".',
                })
                contentParts.push({
                  type: 'image_url',
                  image_url: {
                    url: 'data:image/png;base64,' + $security.base64Encode(pagesInfo[p].image),
                  },
                })
              }

              if (totalPaginas > maxPaginas) {
                isTruncated = true
              }

              const replyVisao = $ai.chat({
                model: 'fast',
                messages: [
                  {
                    role: 'system',
                    content:
                      'Você é um leitor universal de documentos clínicos. Analise cuidadosamente as páginas (imagens) deste documento anexado ao prontuário e EXTRAIA TODO O TEXTO VISÍVEL com fidelidade absoluta (OCR de visão). Preserve a ordem de leitura, títulos, valores, medidas e a conclusão. Não comente sobre a qualidade da imagem nem avalie nitidez. Idioma: Português (Brasil).',
                  },
                  { role: 'user', content: contentParts },
                ],
              })

              fileContentMarkdown = (replyVisao.choices?.[0]?.message?.content || '').trim()
              if (fileContentMarkdown) {
                console.log(
                  'Fallback de visão usado para documento sem camada de texto: ' +
                    fileName +
                    ' (' +
                    Math.min(totalPaginas, maxPaginas) +
                    ' páginas)',
                )
              }
            }
          } catch (visaoErr) {
            console.log('Fallback de visão para documento falhou:', visaoErr)
          }
        }
      }

      if (!fileContentMarkdown && !fileBase64) {
        return e.badRequestError(
          'Nenhum arquivo válido enviado ou legível para análise. Envie um arquivo PDF, JPG, PNG ou WEBP.',
        )
      }

      // ------------------------------------------------------------------
      // 3. Buscar nome do paciente para auditoria e contexto
      // ------------------------------------------------------------------
      let pacienteNome = 'Paciente SOUL'
      if (pacienteId) {
        try {
          const pRec = $app.findRecordById('pacientes', pacienteId)
          pacienteNome = pRec.getString('nome') || pacienteNome
        } catch (_) {}
      }

      // ------------------------------------------------------------------
      // 4. Síntese clínica via AGENTE NATIVO 'leitor-documentos-clinica-soul'
      //    (definido na migration 0054), com fallback para $ai.chat direto.
      // ------------------------------------------------------------------
      const systemPromptFallback = `Você é o Leitor Universal de Documentos Clínicos da Clínica SOUL.
Sua tarefa é analisar o documento anexado ao prontuário (laudo de Ressonância Magnética, Raio-X, Ultrassom, Tomografia, exame laboratorial, receituário, relatório funcional ou foto) e produzir uma SÍNTESE CLÍNICA CONCISA e organizada dos principais resultados.

DIRETRIZES DE REDAÇÃO (PADRÃO CLÍNICA SOUL):
1. SÍNTESE CLÍNICA FLUIDA, NÃO COLAGEM CRUA: apresente de 2 a 8 frases ou tópicos objetivos.
   Destaque: tipo de exame e data (se constar), achados patológicos relevantes, lesões estruturais,
   medidas/valores anormais com impacto funcional e a conclusão diagnóstica do laudo.
   Indique também estruturas íntegras relevantes quando afastarem suspeitas importantes.
2. É ESTRITAMENTE PROIBIDO usar prefixos mecânicos tipo "CAMPO:", "Achado:", "Nome:", "Resultado:", "Item:",
   colar blocos burocráticos (cabeçalho de laboratório, endereço, nome do médico que assina etc.)
   ou criar tabelas markdown.
3. FORMA DE APRESENTAÇÃO: parágrafos concisos ou tópicos com marcadores hífen (-).
   Idioma: Português (Brasil). Se o documento não for legível ou não for de saúde, indique sucintamente.`

      const mensagemUsuario =
        'Documento anexado ao prontuário do paciente (' +
        (pacienteNome ? pacienteNome : 'paciente SOUL') +
        '), arquivo "' +
        fileName +
        '". ' +
        (fileBase64 && !fileContentMarkdown
          ? 'Analise a imagem anexada.'
          : 'Analise o conteúdo extraído abaixo e gere a síntese clínica.') +
        '\n\n' +
        (fileContentMarkdown || '')

      let resumoGerado = ''
      try {
        const agentResult = $ai.agent('leitor-documentos-clinica-soul').chat({
          user_id: userId,
          message: mensagemUsuario,
          files: fileBase64
            ? [{ base64: fileBase64, mime: fileMime || 'image/jpeg', name: fileName }]
            : undefined,
        })
        resumoGerado = (agentResult?.content || '').trim()
      } catch (agentErr) {
        console.log('Agente leitor-documentos indisponível, usando fallback $ai.chat:', agentErr)
      }

      if (!resumoGerado && fileBase64 && !fileContentMarkdown) {
        // Imagem: chamada de visão multimodal direta
        try {
          const reply = $ai.chat({
            model: 'fast',
            messages: [
              { role: 'system', content: systemPromptFallback },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text:
                      'Analise cuidadosamente esta imagem anexada ao prontuário ("' +
                      fileName +
                      '") — foto de exame, laudo impresso, foto postural ou captura de relatório. Extraia os dados visíveis e gere a síntese clínica concisa.',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: 'data:' + (fileMime || 'image/jpeg') + ';base64,' + fileBase64,
                    },
                  },
                ],
              },
            ],
          })
          resumoGerado = (reply.choices?.[0]?.message?.content || '').trim()
        } catch (visaoErr2) {
          console.log('Erro na visão multimodal da imagem:', visaoErr2)
        }
      } else if (!resumoGerado && fileContentMarkdown) {
        // Documento com texto: $ai.chat direto sobre o texto extraído
        try {
          const safeMarkdown = fileContentMarkdown.slice(0, 35000)
          const reply = $ai.chat({
            model: 'fast',
            messages: [
              { role: 'system', content: systemPromptFallback },
              {
                role: 'user',
                content:
                  'Analise o texto extraído deste exame/anexo ("' +
                  fileName +
                  '") e gere a síntese clínica concisa:\n\n' +
                  safeMarkdown,
              },
            ],
          })
          resumoGerado = (reply.choices?.[0]?.message?.content || '').trim()
        } catch (chatErr2) {
          console.log('Erro no $ai.chat de fallback:', chatErr2)
        }
      }

      if (!resumoGerado) {
        return e.json(502, {
          error:
            'A inteligência artificial não retornou o resumo do anexo. Seus dados continuam intactos. Tente novamente.',
        })
      }

      // ------------------------------------------------------------------
      // 4bis. Extração estruturada dos dados do documento (revisão no prontuário)
      //      Segunda chamada curta ao modelo: devolve JSON com os campos que a
      //      tela "Exames Complementares e Documentos" mostra para o profissional
      //      conferir antes de preencher automaticamente os campos do formulário.
      //      Fallback: se falhar, o frontend continua com o resumo puro.
      // ------------------------------------------------------------------
      let dadosExtraidos = null
      try {
        const textoFonte =
          fileBase64 && !fileContentMarkdown
            ? '(imagem analisada por visão)'
            : fileContentMarkdown.slice(0, 30000)
        const replyDados = $ai.chat({
          model: 'fast',
          messages: [
            {
              role: 'system',
              content:
                'Você é um extrator de dados de documentos clínicos. A partir do texto da síntese e das informações do documento anexado ao prontuário, devolve EXCLUSIVAMENTE um JSON válido (sem markdown, sem cercas de código) com as chaves: "tipo_exame" (string), "data_exame" (string, formato DD/MM/AAAA ou ""), "laboratorio" (string, nome do laboratório/clínica ou ""), "achados" (string, achados relevantes em texto corrido ou tópicos com "-"), "valores_referencia" (string, valores de referência/medidas citados ou ""), "conclusao" (string, conclusão diagnóstica ou ""), "campo_sugerido" (string: um destes valores — "historico_medico" se for laudo de imagem/relatório; "" caso contrário). Use "" quando a informação não existir no documento. Nunca invente dados.',
            },
            {
              role: 'user',
              content:
                'Documento "' +
                fileName +
                '" do paciente ' +
                (pacienteNome || '') +
                '.\n\nSíntese clínica já gerada:\n' +
                resumoGerado +
                '\n\nConteúdo bruto do documento (pode estar truncado):\n' +
                textoFonte,
            },
          ],
        })
        const bruto = (replyDados.choices?.[0]?.message?.content || '').trim()
        const jsonLimpo = bruto
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/, '')
          .trim()
        const match = jsonLimpo.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (parsed && typeof parsed === 'object') {
            dadosExtraidos = {
              tipo_exame: String(parsed.tipo_exame || ''),
              data_exame: String(parsed.data_exame || ''),
              laboratorio: String(parsed.laboratorio || ''),
              achados: String(parsed.achados || ''),
              valores_referencia: String(parsed.valores_referencia || ''),
              conclusao: String(parsed.conclusao || ''),
              campo_sugerido: String(parsed.campo_sugerido || ''),
            }
          }
        }
      } catch (dadosErr) {
        console.log('Extração estruturada de dados do anexo falhou (seguindo sem ela):', dadosErr)
      }

      // ------------------------------------------------------------------
      // 5. Avisos e auditoria clínica
      // ------------------------------------------------------------------
      const avisos = []
      if (isTruncated) {
        avisos.push(
          'Aviso: O documento é extenso e teve suas páginas/textos iniciais analisados prioritariamente.',
        )
      }
      if (fileContentMarkdown && !fileBase64 && fileBase64 !== '') {
        // sem-op: mantido para clareza do fluxo texto vs imagem
      }

      try {
        const logCol = $app.findCollectionByNameOrId('clinical_update_logs')
        const logRec = new Record(logCol)
        logRec.set('user_id', userId)
        logRec.set('user_name', userName)
        logRec.set('user_email', userEmail)
        logRec.set('acao', 'criar')
        logRec.set('tipo_entidade', 'prontuario')
        logRec.set('especialidade', especialidade)
        logRec.set('entidade_id', avaliacaoId || evolucaoId || 'anexo_' + Date.now())
        logRec.set('paciente_id', pacienteId || '')
        logRec.set('paciente_nome', pacienteNome)
        logRec.set(
          'detalhes',
          'Leitura e análise com IA do anexo "' +
            fileName +
            '" (' +
            (resumoGerado.length > 80 ? resumoGerado.slice(0, 80) + '...' : resumoGerado) +
            ')',
        )
        $app.save(logRec)
      } catch (auditErr) {
        console.log('Erro ao registrar auditoria clínica do anexo:', auditErr)
      }

      return e.json(200, {
        success: true,
        nome_arquivo: fileName,
        resumo: resumoGerado,
        dados_extraidos: dadosExtraidos || undefined,
        truncated: isTruncated,
        aviso: avisos.join(' ') || undefined,
        analisado_em: new Date().toISOString(),
        analisado_por: userName,
      })
    } catch (err) {
      console.log('Erro no endpoint anexos/analisar-ia:', err)
      if (typeof SkipAiConfigError !== 'undefined' && err instanceof SkipAiConfigError) {
        return e.json(503, {
          error: 'Serviço de IA indisponível temporariamente. Seus dados continuam intactos.',
        })
      }
      return e.json(500, {
        error:
          'Não foi possível analisar o anexo com IA no momento. ' +
          (err?.message || 'Erro inesperado.'),
      })
    }
  },
  $apis.requireAuth(),
)
