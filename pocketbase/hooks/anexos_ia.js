/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para leitura, extração clínica e resumo de anexos por IA
 * Rota: POST /backend/v1/anexos/analisar-ia
 *
 * Cadeia de leitura (nesta ordem):
 * 1. Texto direto: PDFs, DOCX, XLSX, PPTX, TXT via $documents.toMarkdown
 * 2. Visão multimodal ($ai.chat) com data URL(s) enviados pelo navegador
 *    ('arquivo_base64' com um data URL, ou 'arquivo_base64s' com JSON array de
 *    data URLs — um por página do PDF, rasterizado via pdf.js no cliente).
 *    Cobre imagens (JPG/PNG/WEBP) e PDFs escaneados (sem camada de texto),
 *    que o $documents rejeita. $documents.pages NÃO existe nesta plataforma —
 *    nunca chamar; $security.base64Encode também NÃO existe nesta JSVM — o
 *    base64 vem pronto do cliente.
 * 3. Síntese via agente nativo 'leitor-documentos-clinica-soul' (migration 0054),
 *    com fallback para $ai.chat direto (texto ou visão) caso o agente não responda
 * 4. Extração estruturada (JSON) para o painel de revisão da Etapa 6
 * 5. Registro na trilha de auditoria clínica (clinical_update_logs)
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

      // Data URL único (campo antigo) OU array de data URLs por página (novo)
      const rawBase64 = (body.arquivo_base64 || '').trim()
      let paginasBase64 = []
      try {
        const parsed = JSON.parse(body.arquivo_base64s || '[]')
        if (Array.isArray(parsed)) {
          paginasBase64 = parsed.filter((s) => typeof s === 'string' && s.startsWith('data:'))
        }
      } catch (_) {}
      if (paginasBase64.length === 0 && rawBase64.startsWith('data:')) {
        paginasBase64 = [rawBase64]
      }
      // Log de diagnóstico (sem conteúdo): tamanho e quantidade de páginas recebidas
      const paginasContagem =
        paginasBase64.length ||
        (body.arquivo_base64s ? String(body.arquivo_base64s).length : 0) ||
        (body.arquivo_base64 ? 1 : 0)
      console.log(
        '[anexos-ia] payload recebido: paginas=' +
          paginasBase64.length +
          ' tamanho_base64_total=' +
          paginasBase64.reduce((acc, s) => acc + (s ? s.length : 0), 0) +
          ' bruto_arquivo_base64s_len=' +
          (body.arquivo_base64s ? String(body.arquivo_base64s).length : 0),
      )
      if (paginasContagem === 0 && (body.arquivo_base64s || body.arquivo_base64)) {
        console.log(
          '[anexos-ia] AVISO: campos de base64 presentes mas nenhuma página data: válida foi reconhecida',
        )
      }

      const extImagens = ['jpg', 'jpeg', 'png', 'webp']
      const extDocumentos = ['pdf', 'docx', 'xlsx', 'pptx', 'txt']

      let fileName = ''
      let fileExt = ''
      let fileContentMarkdown = ''
      let isTruncated = false

      // ------------------------------------------------------------------
      // 1. Obter o conteúdo do documento: texto via $documents
      // ------------------------------------------------------------------
      if (files && files.length > 0) {
        const uploadedFile = files[0]
        fileName = uploadedFile.originalName || 'anexo'
        fileExt = (fileName.split('.').pop() || '').toLowerCase()

        if (uploadedFile.size > 10 * 1024 * 1024) {
          return e.json(413, {
            error:
              'O arquivo excede o limite máximo permitido de 10 MB. Compacte o documento ou anexe uma foto mais leve.',
          })
        }

        if (extDocumentos.includes(fileExt)) {
          try {
            const docRes = $documents.toMarkdown({ file: uploadedFile })
            fileContentMarkdown = docRes.markdown || ''
            isTruncated = !!docRes.truncated
            console.log(
              '[anexos-ia] toMarkdown ok (' +
                fileName +
                '): ' +
                fileContentMarkdown.length +
                ' chars',
            )
          } catch (docErr) {
            console.log(
              '[anexos-ia] Texto não extraível via toMarkdown (' + fileName + '):',
              docErr,
            )
            // PDF escaneado: o fallback de visão acontece mais abaixo com as
            // páginas rasterizadas enviadas pelo cliente
          }
        }
      } else if (existingRecordId && existingCollection && existingFilename) {
        // Arquivo já persistido em um registro da avaliação/evolução
        fileName = existingFilename
        fileExt = (fileName.split('.').pop() || '').toLowerCase()
        try {
          const rec = $app.findRecordById(existingCollection, existingRecordId)
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
                console.log('Falha ao extrair texto do campo ' + fieldCandidates[f] + ':', fieldErr)
              }
            }
          }
        } catch (recErr) {
          console.log('Erro ao ler arquivo de registro existente:', recErr)
        }
      }

      // ------------------------------------------------------------------
      // 2. Visão multimodal com as páginas data URL enviadas pelo navegador
      //    ('arquivo_base64' ou 'arquivo_base64s' JSON array — rasterizadas
      //    via pdf.js no cliente). Usado quando: é imagem, OU documento sem
      //    texto extraível (PDF escaneado), OU o texto extraído veio vazio.
      // ------------------------------------------------------------------
      if (!fileContentMarkdown && paginasBase64.length > 0) {
        try {
          const conteudo = [
            {
              type: 'text',
              text:
                'Leia o documento "' +
                fileName +
                '" anexado ao prontuário. ' +
                (paginasBase64.length > 1
                  ? 'São ' + paginasBase64.length + ' páginas do mesmo documento, em ordem. '
                  : '') +
                'EXTRAIA TODO O TEXTO VISÍVEL com fidelidade absoluta (leitura de documento escaneado ou fotografado). Preserve a ordem de leitura, títulos, valores, medidas e a conclusão. NUNCA comente sobre a qualidade ou nitidez da imagem. Se estiver ilegível, diga apenas "DOCUMENTO ILEGIVEL". Idioma: Português (Brasil).',
            },
          ]
          for (let p = 0; p < paginasBase64.length; p++) {
            conteudo.push({ type: 'image_url', image_url: { url: paginasBase64[p] } })
          }

          const replyVisao = $ai.chat({
            model: 'fast',
            maxTokens: 3000,
            messages: [
              {
                role: 'system',
                content:
                  'Você é um leitor universal de documentos clínicos da Clínica SOUL. Analise cuidadosamente as imagens/anexos e EXTRAIA TODO O TEXTO VISÍVEL com fidelidade absoluta.',
              },
              { role: 'user', content: conteudo },
            ],
          })
          const brutoVisao = (replyVisao.choices?.[0]?.message?.content || '').trim()
          if (brutoVisao && !brutoVisao.toUpperCase().includes('DOCUMENTO ILEGIVEL')) {
            fileContentMarkdown = brutoVisao
            console.log(
              '[anexos-ia] Leitura por visão usada (' +
                (fileExt || 'arquivo') +
                ', ' +
                paginasBase64.length +
                ' pág.): ' +
                fileName +
                ' — ' +
                brutoVisao.length +
                ' chars',
            )
          } else {
            console.log(
              '[anexos-ia] Visão multimodal sem conteúdo útil para ' +
                fileName +
                ' (resposta: ' +
                (brutoVisao ? brutoVisao.slice(0, 120) : '(vazio)') +
                ')',
            )
          }
        } catch (visaoErr) {
          console.log(
            '[anexos-ia] Fallback de visão multimodal falhou (' + fileName + '):',
            visaoErr,
          )
        }
      }

      if (!fileContentMarkdown) {
        // ------------------------------------------------------------------
        // Falha de leitura: mensagem específica pelo motivo real
        // ------------------------------------------------------------------
        let motivo
        if (paginasBase64.length === 0 && (fileExt === 'pdf' || fileExt === '')) {
          motivo =
            'Não recebemos as páginas deste PDF para leitura por IA (o leitor de PDF do navegador não conseguiu convertê-lo). Tente novamente; se persistir, compacte o PDF ou anexe fotos nítidas das páginas (JPG/PNG).'
        } else if (extImagens.includes(fileExt)) {
          motivo =
            'Não foi possível ler a imagem enviada pela IA. Confira se a foto está nítida e completa e tente novamente.'
        } else if (fileExt === 'pdf') {
          motivo =
            'A IA não conseguiu ler as páginas deste documento. Verifique se o PDF contém texto ou imagem legível e tente novamente (ou preencha manualmente).'
        } else {
          motivo =
            'Não foi possível extrair o conteúdo deste arquivo (' +
            (fileExt || 'desconhecido') +
            '). Formatos aceitos: PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX, TXT.'
        }
        return e.json(422, {
          error: motivo,
          motivo: 'documento_ilegivel',
        })
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
        'Documento anexado ao prontuário do paciente ' +
        pacienteNome +
        ', arquivo "' +
        fileName +
        '". Analise o conteúdo extraído abaixo e gere a síntese clínica.\n\n' +
        fileContentMarkdown

      let resumoGerado = ''
      try {
        const agentResult = $ai.agent('leitor-documentos-clinica-soul').chat({
          user_id: userId,
          message: mensagemUsuario,
        })
        resumoGerado = (agentResult?.content || '').trim()
      } catch (agentErr) {
        console.log('Agente leitor-documentos indisponível, usando fallback $ai.chat:', agentErr)
      }

      if (!resumoGerado) {
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
            'A inteligência artificial não retornou a síntese do anexo. Seus dados continuam intactos. Use "Tentar novamente".',
          motivo: 'ia_sem_resposta',
        })
      }

      // ------------------------------------------------------------------
      // 5. Extração estruturada dos dados do documento (painel de revisão)
      // ------------------------------------------------------------------
      let dadosExtraidos = null
      try {
        const textoFonte = fileContentMarkdown.slice(0, 30000)
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
                pacienteNome +
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
      // 6. Avisos e auditoria clínica
      // ------------------------------------------------------------------
      const avisos = []
      if (isTruncated) {
        avisos.push(
          'Aviso: O documento é extenso e teve suas páginas/textos iniciais analisados prioritariamente.',
        )
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
          motivo: 'ia_indisponivel',
        })
      }
      return e.json(500, {
        error:
          'Não foi possível analisar o anexo com IA no momento. Use "Tentar novamente". ' +
          (err?.message || ''),
        motivo: 'erro_interno',
      })
    }
  },
  $apis.requireAuth(),
)
