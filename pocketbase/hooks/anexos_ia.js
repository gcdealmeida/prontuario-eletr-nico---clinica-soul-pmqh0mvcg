/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para leitura, extração clínica e resumo de anexos por IA
 * Rota: POST /backend/v1/anexos/analisar-ia
 *
 * Suporta:
 * 1. Arquivos enviados via multipart/form-data (campo 'arquivo') ou já salvos no registro
 * 2. Documentos com texto: PDFs, DOCX, XLSX via $documents.toMarkdown
 * 3. Imagens (JPG, PNG, WEBP) via visão ($ai.chat com multimodal base64)
 * 4. Geração de síntese clínica concisa (2 a 6 tópicos/frases) sem prefixos mecânicos de formulário
 * 5. Registro automático na trilha de auditoria clínica (clinical_update_logs)
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

      let fileName = ''
      let fileExt = ''
      let fileContentMarkdown = ''
      let isTruncated = false
      let fileBase64 = ''
      let fileMime = ''

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

        if (['pdf', 'docx', 'xlsx', 'pptx'].includes(fileExt)) {
          try {
            const docRes = $documents.toMarkdown({ file: uploadedFile })
            fileContentMarkdown = docRes.markdown || ''
            isTruncated = !!docRes.truncated
          } catch (docErr) {
            console.log('Erro ao ler documento com $documents.toMarkdown:', docErr)
            if (docErr && docErr.status === 422) {
              return e.json(422, {
                error:
                  'Não foi possível extrair o texto deste PDF (documento digitalizado/escaneado sem camada de texto selecionável). Favor utilizar um arquivo com texto selecionável ou foto nítida.',
              })
            }
            if (docErr && docErr.status === 413) {
              return e.json(413, {
                error: 'O documento é grande demais para processamento (limite de 10 MB).',
              })
            }
            return e.json(400, {
              error:
                'Falha ao extrair dados do documento: ' +
                (docErr?.message || 'Arquivo corrompido ou formato não suportado.'),
            })
          }
        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
          try {
            // Ler bytes e converter para base64
            const reader = uploadedFile.open()
            const bytes = $io.readAll(reader)
            reader.close()
            fileBase64 = $security.base64Encode(bytes)
            fileMime =
              fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg'
          } catch (imgErr) {
            console.log('Erro ao ler bytes da imagem enviada:', imgErr)
          }
        }
      } else if (existingRecordId && existingCollection && existingFilename) {
        // Arquivo já persistido em um registro
        fileName = existingFilename
        fileExt = (fileName.split('.').pop() || '').toLowerCase()
        try {
          const rec = $app.findRecordById(existingCollection, existingRecordId)
          if (['pdf', 'docx', 'xlsx', 'pptx'].includes(fileExt)) {
            const fieldCandidates = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
            let matchedField = ''
            for (let f = 0; f < fieldCandidates.length; f++) {
              if (rec.collection().fields.getByName(fieldCandidates[f])) {
                matchedField = fieldCandidates[f]
                break
              }
            }
            if (matchedField) {
              const docRes = $documents.toMarkdown({ record: rec, field: matchedField })
              fileContentMarkdown = docRes.markdown || ''
              isTruncated = !!docRes.truncated
            }
          }
        } catch (recErr) {
          console.log('Erro ao ler arquivo de registro existente:', recErr)
        }
      }

      if (!fileContentMarkdown && !fileBase64) {
        return e.badRequestError(
          'Nenhum arquivo válido enviado ou legível para análise. Envie um arquivo PDF, JPG, PNG ou WEBP.',
        )
      }

      // Buscar nome do paciente para auditoria e contexto
      let pacienteNome = 'Paciente SOUL'
      if (pacienteId) {
        try {
          const pRec = $app.findRecordById('pacientes', pacienteId)
          pacienteNome = pRec.getString('nome') || pacienteNome
        } catch (_) {}
      }

      // Prompt para geração de síntese clínica de alto nível
      const systemPrompt = `Você é o Especialista Clínico de Diagnóstico e Apoio ao Raciocínio da Clínica SOUL.
Sua tarefa é analisar o arquivo anexado ao prontuário (exame de imagem como Ressonância Magnética, Raio-X, Ultrassom, Tomografia, exame laboratorial, laudo estático ou relatório funcional) e produzir uma SÍNTESE CLÍNICA CONCISA e estruturada dos principais resultados.

DIRETRIZES FUNDAMENTAIS DE REDAÇÃO (PADRÃO CLÍNICA SOUL):
1. SÍNTESE CLÍNICA FLUIDA, NÃO COLAGEM CRUA:
   - Apresente uma síntese clínica concisa em linguagem técnica e natural (de 2 a 6 frases ou tópicos objetivos).
   - Destaque: achados patológicos relevantes, lesões estruturais, medidas/valores anormais com impacto funcional e a conclusão diagnóstica do laudo.
   - Indique também estruturas íntegras relevantes quando afastarem suspeitas importantes.

2. É ESTRITAMENTE PROIBIDO:
   - Usar prefixos mecânicos de formulário tipo "CAMPO:", "Campo:", "Achado:", "Achados:", "Item:", "Nome:", "Resultado:".
   - Colar trechos de texto desnecessários ou blocos burocráticos (nome de médico que assinou o laudo, cabeçalho de laboratório, endereço da clínica de imagem etc.).
   - Criar tabelas markdown.

3. FORMA DE APRESENTAÇÃO:
   - Redija parágrafos concisos ou tópicos com marcadores hífen (-) claros e técnicos.
   - Idioma: Português (Brasil).
   - Se o documento não for legível ou não for um exame de saúde/laudo, indique sucintamente.`

      let resumoGerado = ''

      if (fileContentMarkdown) {
        // Truncar preventivamente para segurança de tokens (35.000 caracteres no máximo)
        const safeMarkdown = fileContentMarkdown.slice(0, 35000)

        const reply = $ai.chat({
          model: 'fast',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Por favor, analise o texto extraído deste exame/anexo ("${fileName}") e gere a síntese clínica concisa:\n\n${safeMarkdown}`,
            },
          ],
        })

        resumoGerado = (reply.choices?.[0]?.message?.content || '').trim()
      } else if (fileBase64) {
        // Imagem enviada: utilizar chamada de visão com multimodal
        const reply = $ai.chat({
          model: 'fast',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analise cuidadosamente esta imagem anexada ao prontuário ("${fileName}") — trate-se de foto de exame, laudo impresso, foto postural ou captura de relatório. Extraia os dados visíveis e gere a síntese clínica concisa.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${fileMime};base64,${fileBase64}`,
                  },
                },
              ],
            },
          ],
        })

        resumoGerado = (reply.choices?.[0]?.message?.content || '').trim()
      }

      if (!resumoGerado) {
        return e.json(502, {
          error:
            'A inteligência artificial não retornou o resumo do anexo. Seus dados continuam intactos. Tente novamente.',
        })
      }

      // Se foi truncado na conversão, incluir aviso informativo
      const avisoTruncado = isTruncated
        ? 'Aviso: O documento é extenso e teve suas páginas iniciais analisadas prioritariamente.'
        : undefined

      // Registrar auditoria clínica (clinical_update_logs)
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
        truncated: isTruncated,
        aviso: avisoTruncado,
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
