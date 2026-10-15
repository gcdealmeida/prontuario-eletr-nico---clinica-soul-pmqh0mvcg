/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para geração e persistência de Relatórios Otimizados com IA
 * Rota: POST /backend/v1/relatorios/gerar-ia
 *
 * Utiliza o agente nativo Skip Cloud "relatorios-clinica-soul",
 * valida permissão de acesso ao prontuário/paciente,
 * persiste na collection "relatorios_ia" e
 * gera registro na trilha de auditoria clínica (clinical_update_logs) e notificações para administradores.
 */
routerAdd(
  'POST',
  '/backend/v1/relatorios/gerar-ia',
  (e) => {
    try {
      const auth = e.auth
      const userId = auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const body = e.requestInfo().body || {}
      const pacienteId = body.paciente_id || ''
      const avaliacaoId = body.avaliacao_id || ''
      const especialidade = body.especialidade || 'Fisioterapia'
      const necessidade = (body.necessidade || '').trim()
      const publicoAlvo = (body.publico_alvo || '').trim()
      const tituloSugerido = (body.titulo || '').trim() || 'Relatório Clínico Otimizado'
      const dadosProntuario = body.dados_prontuario || {}

      if (!necessidade) {
        return e.badRequestError(
          'A descrição da necessidade/solicitação do relatório é obrigatória',
        )
      }
      if (!avaliacaoId || !pacienteId) {
        return e.badRequestError('Identificação do prontuário e paciente é obrigatória')
      }

      // 1. Verificação de permissões do usuário logado (RLS / Scoping)
      const userRole = auth.getString('role')
      const userEmail = (auth.getString('email') || '').toLowerCase().trim()
      const isAdmin =
        userRole === 'admin' ||
        userEmail === 'gcdealmeida@gmail.com' ||
        userEmail === 'guivemax@hotmail.com'

      // Se não for admin, verificar se o profissional tem permissão sobre a avaliação
      if (!isAdmin) {
        let colName = 'avaliacoes_fisioterapia'
        if (especialidade === 'Personal') colName = 'avaliacoes_personal'
        else if (especialidade === 'Nutrição') colName = 'avaliacoes_nutricao'
        else if (especialidade === 'Médico') colName = 'avaliacoes_medico'

        try {
          const avRecord = $app.findRecordById(colName, avaliacaoId)
          const avUserId = avRecord.getString('user_id')
          if (avUserId && avUserId !== userId) {
            return e.forbiddenError('Você não tem permissão para gerar relatórios desta avaliação')
          }
        } catch (err) {
          return e.notFoundError('Avaliação não encontrada ou inacessível')
        }
      }

      // 2. Buscar informações cadastrais do paciente
      let pacienteNome = 'Paciente SOUL'
      let pacienteCpf = ''
      let pacienteNasc = ''
      try {
        const pRec = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = pRec.getString('nome') || pacienteNome
        pacienteCpf = pRec.getString('cpf') || ''
        pacienteNasc = pRec.getString('data_nascimento') || ''
      } catch (_) {}

      // 3. Montar o prompt rico integrando a necessidade e os dados reais
      const userName = auth.getString('name') || userEmail || 'Profissional SOUL'

      // Higienizar dados do prontuário para o contexto do agente:
      // Remove metadados internos de framework que poderiam vazar rótulos redundantes
      const dadosProntuarioFiltrados = Object.assign({}, dadosProntuario)
      delete dadosProntuarioFiltrados.collectionId
      delete dadosProntuarioFiltrados.collectionName
      delete dadosProntuarioFiltrados.expand

      const promptMensagem = `Gere um Relatório Clínico / Funcional no MODELO INSTITUCIONAL OFICIAL DA CLÍNICA SOUL conforme a instrução:

INSTRUÇÃO / NECESSIDADE DO PROFISSIONAL:
"${necessidade}"

${publicoAlvo ? `PÚBLICO-ALVO / DESTINATÁRIO: ${publicoAlvo}` : ''}
${tituloSugerido ? `TÍTULO / SUBTÍTULO SUGERIDO: ${tituloSugerido}` : ''}

DADOS INSTITUCIONAIS (já presentes no cabeçalho do documento — NÃO DUPLICAR no corpo do texto):
- Instituição: Clínica SOUL — Saúde e Bem Estar
- Profissional Emissor: ${userName} (${especialidade})
- Paciente: ${pacienteNome}${pacienteCpf ? ` (CPF: ${pacienteCpf})` : ''}${pacienteNasc ? ` (Nascimento: ${pacienteNasc})` : ''}
- Identificação da Avaliação: ${avaliacaoId}

DADOS REAIS DO PRONTUÁRIO / AVALIAÇÃO CLÍNICA:
${JSON.stringify(dadosProntuarioFiltrados, null, 2)}

ESTRUTURA OBRIGATÓRIA — MODELO INSTITUCIONAL DA CLÍNICA SOUL:
O relatório DEVE ser gerado com as seguintes 6 seções numeradas preenchidas a partir dos dados acima:

1. OBJETIVO DO RELATÓRIO
[Descrever de forma objetiva a finalidade deste documento segundo a necessidade informada.]

2. HISTÓRICO E QUEIXA PRINCIPAL
[Anamnese, evolução dos sintomas, histórico clínico, limitações funcionais e EVA em redação clínica fluida.]

3. AVALIAÇÃO CLÍNICA E FUNCIONAL
[Inspeção, mobilidade/ADM, força/dinamometria, testes especiais por segmento, testes funcionais, postura e exames de imagem.]

4. INTERPRETAÇÃO DOS ACHADOS
[Relação clínica entre os achados, déficits, assimetrias, hipótese disfuncional e repercussões funcionais.]

5. CONDUTA / PLANO DE TRATAMENTO
[Objetivos terapêuticos, frequência, progressão, condutas recomendadas e critérios de reavaliação.]

6. CONSIDERAÇÕES FINAIS
[Conclusão clínica fundamentada, orientações para o paciente/destinatário e próximos passos.]

DIRETRIZES MANDATÓRIAS DE REDAÇÃO:
1. SEM RÓTULOS REDUNDANTES DE FORMULÁRIO:
   - É ESTRITAMENTE PROIBIDO incluir prefixos mecânicos de formulário tipo "CAMPO:", "Campo:", "Nome:", "Nome do Paciente:", "Idade:", "Diagnóstico:" antes de dados.
   - Qualquer menção à pessoa no texto deve ser natural ("Bernardo Juncal Vitória Maia, 34 anos" e NUNCA "CAMPO: Nome: Bernardo...").
   - O bloco cadastral do paciente já é exibido automaticamente no cabeçalho institucional timbrado — NÃO replique caixas ou listas de dados cadastrais no corpo das seções.

2. DADOS DA RNM E EXAMES DE IMAGEM — SÍNTESE CLÍNICA CONCISA (NUNCA COLAGEM CRUA):
   - Caso haja laudos de Ressonância Magnética (RNM), Tomografia, Raio-X ou Ultrassom no prontuário, produza uma SÍNTESE CLÍNICA CONCISA (2 a 5 frases) em texto corrido com os achados relevantes para a clínica/funcionalidade.
   - É ESTRITAMENTE PROIBIDO colar o laudo cru linha a linha ou usar prefixos mecânicos tipo "Achado:", "Achados:", "Conclusão:", "Item 1:". Integre os achados com fluidez técnica (ex.: "A RNM do joelho direito evidencia rotura no menisco medial e edema infrapatelar lateral...").

3. FORMATAÇÃO LIMPA SEM TABELAS MARKDOWN:
   - É ESTRITAMENTE PROIBIDO GERAR TABELAS MARKDOWN (nunca use separadores "|---|---|", barras verticais ou traços em grade).
   - Todo e qualquer dado comparativo (ADM, dinamometria, lado D vs E, exames) DEVE ser formatado em TEXTO CORRIDO ou em LISTAS SIMPLES COM MARCADORES (ex: "- Ombro D: Flexão 170° | Ombro E: Flexão 180°").
   - Tom elegante, sóbrio e técnico. Sem floreios nem ícones decorativos. Baseie-se 100% nos dados reais do prontuário acima. Não invente dados ausentes.`

      // 4. Chamada síncrona ao agente nativo Skip Cloud
      let agentResult
      try {
        agentResult = $ai.agent('relatorios-clinica-soul').chat({
          user_id: userId,
          message: promptMensagem,
        })
      } catch (errAi) {
        console.log('Erro ao consultar o agente de relatórios IA:', errAi)
        return e.json(503, {
          error:
            'Não foi possível gerar o relatório com a inteligência artificial no momento. Seus dados de avaliação continuam intactos. Tente novamente em instantes.',
        })
      }

      const conteudoGerado = agentResult?.content || ''

      if (!conteudoGerado) {
        return e.json(502, {
          error:
            'O assistente de IA não retornou o texto do relatório. Seus dados de avaliação continuam salvos e intactos.',
        })
      }

      // 5. Persistir na collection relatorios_ia com fallback defensivo
      let relRec = null
      let avisoSalvamento = ''
      try {
        const colRelatorios = $app.findCollectionByNameOrId('relatorios_ia')
        relRec = new Record(colRelatorios)
        relRec.set('paciente_id', pacienteId)
        relRec.set('avaliacao_id', avaliacaoId)
        relRec.set('especialidade', especialidade)
        relRec.set('autor_id', userId)
        relRec.set('autor_nome', userName)
        relRec.set('titulo', tituloSugerido.slice(0, 5000))
        relRec.set('necessidade', necessidade)
        relRec.set('publico_alvo', publicoAlvo)
        relRec.set('conteudo', conteudoGerado)
        $app.save(relRec)
      } catch (errSave) {
        console.log('Tentativa 1 ao salvar relatório gerado falhou:', errSave)
        // Tentativa de recuperação defensiva: caso algum campo ainda esteja esbarrando em limite anterior
        try {
          const colRelatorios = $app.findCollectionByNameOrId('relatorios_ia')
          relRec = new Record(colRelatorios)
          relRec.set('paciente_id', pacienteId)
          relRec.set('avaliacao_id', avaliacaoId)
          relRec.set('especialidade', especialidade)
          relRec.set('autor_id', userId)
          relRec.set('autor_nome', userName)
          relRec.set('titulo', tituloSugerido.slice(0, 200))
          relRec.set('necessidade', necessidade.slice(0, 4900))
          relRec.set('publico_alvo', (publicoAlvo || '').slice(0, 500))
          relRec.set('conteudo', conteudoGerado.slice(0, 4900))
          $app.save(relRec)
          avisoSalvamento =
            'Relatório salvo no histórico com versão truncada para compatibilidade. O texto completo gerado está disponível abaixo.'
        } catch (errSave2) {
          console.log('Tentativa defensiva de salvar relatório no banco falhou:', errSave2)
          // NUNCA retornar 500 se a IA já gerou o relatório com sucesso!
          // Devolve o conteúdo gerado para que o profissional não perca o trabalho.
          return e.json(200, {
            id: 'temp_' + Date.now(),
            paciente_id: pacienteId,
            avaliacao_id: avaliacaoId,
            especialidade: especialidade,
            titulo: tituloSugerido,
            necessidade: necessidade,
            conteudo: conteudoGerado,
            autor_id: userId,
            autor_nome: userName,
            created: new Date().toISOString(),
            falha_historico: true,
            aviso:
              'Relatório gerado com sucesso pela IA! Houve uma instabilidade pontual ao salvar no histórico permanente, mas seu texto completo está disponível abaixo — copie ou imprima agora.',
          })
        }
      }

      // 6. Auditoria clínica (clinical_update_logs) e notificações para administradores
      try {
        const logCol = $app.findCollectionByNameOrId('clinical_update_logs')
        const logRec = new Record(logCol)
        logRec.set('user_id', userId)
        logRec.set('user_name', userName)
        logRec.set('user_email', userEmail)
        logRec.set('acao', 'criar')
        logRec.set('tipo_entidade', 'prontuario')
        logRec.set('especialidade', especialidade)
        logRec.set('entidade_id', relRec.id)
        logRec.set('paciente_id', pacienteId)
        logRec.set('paciente_nome', pacienteNome)
        logRec.set(
          'detalhes',
          'Emissão de Relatório Clínico com IA: "' +
            tituloSugerido +
            '" (Foco: ' +
            necessidade.slice(0, 120) +
            ')',
        )
        $app.save(logRec)

        const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
        for (let i = 0; i < admins.length; i++) {
          try {
            const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
            if (adm && adm.id !== userId) {
              const notif = new Record($app.findCollectionByNameOrId('notifications'))
              notif.set('user_id', adm.id)
              notif.set('titulo', 'Novo Relatório com IA Gerado - ' + especialidade)
              notif.set(
                'descricao',
                userName +
                  ' emitiu um relatório com IA para ' +
                  pacienteNome +
                  ': "' +
                  tituloSugerido +
                  '".',
              )
              notif.set('tipo', 'clinical_update')
              notif.set('lida', false)
              notif.set(
                'link',
                '/prontuarios/' + avaliacaoId + '?esp=' + encodeURIComponent(especialidade),
              )
              $app.save(notif)
            }
          } catch (_) {}
        }
      } catch (errAudit) {
        console.log('Erro ao gravar auditoria do relatório:', errAudit)
      }

      return e.json(200, {
        id: relRec.id,
        paciente_id: pacienteId,
        avaliacao_id: avaliacaoId,
        especialidade: especialidade,
        titulo: tituloSugerido,
        necessidade: necessidade,
        conteudo: conteudoGerado,
        autor_id: userId,
        autor_nome: userName,
        created: relRec.getString('created'),
        aviso: avisoSalvamento || undefined,
      })
    } catch (err) {
      console.log('Erro no endpoint relatorios/gerar-ia:', err)
      if (typeof SkipAiConfigError !== 'undefined' && err instanceof SkipAiConfigError) {
        return e.json(503, {
          error:
            'Serviço de IA indisponível temporariamente. Seus dados de avaliação continuam intactos.',
        })
      }
      if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status >= 500 ? 503 : status, {
          error:
            status >= 500
              ? 'Falha no processamento do agente de relatórios. Seus dados de avaliação continuam intactos.'
              : err.message,
        })
      }
      return e.json(500, {
        error:
          'Não foi possível concluir a emissão do relatório. Seus dados de avaliação continuam intactos. Detalhe: ' +
          (err?.message || 'Erro interno inesperado'),
      })
    }
  },
  $apis.requireAuth(),
)
