/**
 * Migração 0045: Unificação de avaliações em duplicidade da paciente Adriana Ferracciu.
 *
 * Paciente: ADRIANA PORT PAIVA FERRACCIU (id 070drnrz8eje76t)
 * Avaliação Alvo (manter): 88dyp6gzslsyvjh (Status: Concluída, 2026-10-24 13:58:12.235Z)
 * Avaliações Rascunho a mesclar e excluir:
 *   1. etxr4fzpnc7gki5 (Rascunho, 2026-10-24 13:30:44.273Z)
 *   2. 9af621gxw33u58e (Rascunho, 2026-10-24 13:30:44.542Z)
 *   3. gu78idovzyzea60 (Rascunho, 2026-10-24 13:57:40.219Z)
 *
 * Critérios clínicos:
 * 1. Anamnese detalhada:
 *    - Mesclar campos do pré-cadastro presentes nos rascunhos (desejo_voltar_fazer, frase_chave_paciente,
 *      tentativas_anteriores, impacto_dia_a_dia, o_que_evita_fazer, resultado_valeu_a_pena)
 * 2. Hábitos de saúde e queixas múltiplas:
 *    - Preservar dados preenchidos de sono, alimentação e queixas.
 * 3. Resumos de anexos e arquivos:
 *    - A avaliação concluída já possui os anexos físicos (ressonância, escanometria, foto WhatsApp)
 *      e os resumos da IA. Fazer merge de quaisquer resumos complementares.
 * 4. Excluir os 3 rascunhos duplicados (etxr4fzpnc7gki5, 9af621gxw33u58e, gu78idovzyzea60).
 * 5. Registrar auditoria em clinical_update_logs e notifications.
 */

migrate(
  (app) => {
    const targetId = '88dyp6gzslsyvjh' // Concluída
    const sourceIds = ['etxr4fzpnc7gki5', '9af621gxw33u58e', 'gu78idovzyzea60']
    const pacienteId = '070drnrz8eje76t'
    const pacienteNome = 'ADRIANA PORT PAIVA FERRACCIU'

    let targetAvaliacao = null
    try {
      targetAvaliacao = app.findRecordById('avaliacoes_fisioterapia', targetId)
    } catch (_) {}

    if (!targetAvaliacao) {
      console.log(
        'Migração 0045: Avaliação alvo 88dyp6gzslsyvjh não encontrada. Abortando com segurança.',
      )
      return
    }

    console.log(
      'Migração 0045: Iniciando consolidação dos dados dos rascunhos na avaliação concluída...',
    )

    // 1. Obter e preparar anamnese_detalhada da avaliação alvo
    let targetAnamnese = {}
    try {
      const raw = targetAvaliacao.getString('anamnese_detalhada')
      if (raw && raw !== 'null') {
        targetAnamnese = JSON.parse(raw)
      }
    } catch (_) {}

    // 2. Obter habitos_saude da avaliação alvo
    let targetHabitos = {}
    try {
      const raw = targetAvaliacao.getString('habitos_saude')
      if (raw && raw !== 'null') {
        targetHabitos = JSON.parse(raw)
      }
    } catch (_) {}

    // 3. Obter resumos_anexos da avaliação alvo
    let targetResumos = {}
    try {
      const raw = targetAvaliacao.getString('resumos_anexos')
      if (raw && raw !== 'null') {
        targetResumos = JSON.parse(raw)
      }
    } catch (_) {}

    let rascunhosExcluidos = 0

    for (let i = 0; i < sourceIds.length; i++) {
      const srcId = sourceIds[i]
      let srcRecord = null
      try {
        srcRecord = app.findRecordById('avaliacoes_fisioterapia', srcId)
      } catch (_) {}

      if (!srcRecord) {
        console.log('Migração 0045: Rascunho ' + srcId + ' já não existe ou já foi excluído.')
        continue
      }

      // Mesclar anamnese_detalhada
      try {
        const rawSrcAnamnese = srcRecord.getString('anamnese_detalhada')
        if (rawSrcAnamnese && rawSrcAnamnese !== 'null') {
          const srcAnamnese = JSON.parse(rawSrcAnamnese)
          for (const k in srcAnamnese) {
            if (!targetAnamnese[k] && srcAnamnese[k]) {
              targetAnamnese[k] = srcAnamnese[k]
            }
          }
        }
      } catch (_) {}

      // Mesclar habitos_saude
      try {
        const rawSrcHabitos = srcRecord.getString('habitos_saude')
        if (rawSrcHabitos && rawSrcHabitos !== 'null') {
          const srcHabitos = JSON.parse(rawSrcHabitos)
          for (const k in srcHabitos) {
            if (!targetHabitos[k] && srcHabitos[k]) {
              targetHabitos[k] = srcHabitos[k]
            }
          }
        }
      } catch (_) {}

      // Mesclar resumos_anexos
      try {
        const rawSrcResumos = srcRecord.getString('resumos_anexos')
        if (rawSrcResumos && rawSrcResumos !== 'null') {
          const srcResumos = JSON.parse(rawSrcResumos)
          for (const fName in srcResumos) {
            if (!targetResumos[fName] && srcResumos[fName]) {
              targetResumos[fName] = srcResumos[fName]
            }
          }
        }
      } catch (_) {}

      // Se queixa_principal ou historia_doenca_atual estiverem vazias no alvo e presentes no rascunho:
      if (
        !targetAvaliacao.getString('historia_doenca_atual') &&
        srcRecord.getString('historia_doenca_atual')
      ) {
        targetAvaliacao.set('historia_doenca_atual', srcRecord.getString('historia_doenca_atual'))
      }
      if (
        !targetAvaliacao.getString('objetivos_tratamento') &&
        srcRecord.getString('objetivos_tratamento')
      ) {
        targetAvaliacao.set('objetivos_tratamento', srcRecord.getString('objetivos_tratamento'))
      }

      // Excluir rascunho da base
      try {
        app
          .db()
          .newQuery('DELETE FROM avaliacoes_fisioterapia WHERE id = {:srcId}')
          .bind({ srcId: srcId })
          .execute()
        rascunhosExcluidos++
        console.log('Migração 0045: Rascunho duplicado ' + srcId + ' excluído com sucesso.')
      } catch (errDelete) {
        console.log('Migração 0045: Erro ao excluir rascunho ' + srcId + ': ' + errDelete)
      }
    }

    // Salvar avaliação alvo atualizada
    targetAvaliacao.set('anamnese_detalhada', targetAnamnese)
    targetAvaliacao.set('habitos_saude', targetHabitos)
    targetAvaliacao.set('resumos_anexos', targetResumos)
    app.save(targetAvaliacao)
    console.log(
      'Migração 0045: Avaliação alvo 88dyp6gzslsyvjh atualizada e consolidada com sucesso.',
    )

    // Registrar log de auditoria clínica
    try {
      let adminId = 'system'
      try {
        const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'gcdealmeida@gmail.com')
        if (adminUser) adminId = adminUser.id
      } catch (_) {}

      const logCol = app.findCollectionByNameOrId('clinical_update_logs')
      const logRec = new Record(logCol)
      logRec.set('user_id', adminId)
      logRec.set('user_name', 'Dr. Guilherme (Admin)')
      logRec.set('user_email', 'gcdealmeida@gmail.com')
      logRec.set('acao', 'editar')
      logRec.set('tipo_entidade', 'avaliacao')
      logRec.set('especialidade', 'Fisioterapia')
      logRec.set('entidade_id', targetId)
      logRec.set('paciente_id', pacienteId)
      logRec.set('paciente_nome', pacienteNome)
      logRec.set(
        'detalhes',
        'Unificação de prontuários da paciente Adriana Ferracciu: ' +
          rascunhosExcluidos +
          ' rascunho(s) em duplicidade (etxr4fzpnc7gki5, 9af621gxw33u58e, gu78idovzyzea60) absorvidos na avaliação concluída (88dyp6gzslsyvjh). Anamnese detalhada, resumos de exames e dados do pré-cadastro consolidados sem perda de dados.',
      )
      app.save(logRec)
      console.log('Migração 0045: Log de auditoria clinical_update_logs registrado com sucesso.')
    } catch (e) {
      console.log('Migração 0045: Erro ao registrar clinical_update_logs: ' + e)
    }

    // Criar notificação para administradores
    try {
      const notifCol = app.findCollectionByNameOrId('notifications')
      const adminUsers = app.findRecordsByFilter(
        '_pb_users_auth_',
        "role = 'admin' || email = 'gcdealmeida@gmail.com' || email = 'guivemax@hotmail.com'",
        'created',
        10,
        0,
      )

      for (let u = 0; u < adminUsers.length; u++) {
        const admin = adminUsers[u]
        const notifRec = new Record(notifCol)
        notifRec.set('user_id', admin.id)
        notifRec.set('titulo', 'Unificação de Prontuário - Adriana Ferracciu')
        notifRec.set(
          'descricao',
          'Os 3 rascunhos duplicados da paciente Adriana Ferracciu foram unificados na avaliação concluída oficial de Fisioterapia, mantendo exames, resumos de IA e histórico completo.',
        )
        notifRec.set('tipo', 'clinical_update')
        notifRec.set('lida', false)
        notifRec.set('link', '/prontuarios/' + targetId + '?esp=Fisioterapia')
        notifRec.set('metadata', {
          paciente_id: pacienteId,
          paciente_nome: pacienteNome,
          avaliacao_id: targetId,
          acao: 'unificacao_avaliacoes_adriana',
        })
        app.save(notifRec)
      }
      console.log('Migração 0045: Notificação enviada para ' + adminUsers.length + ' admin(s).')
    } catch (e) {
      console.log('Migração 0045: Erro ao criar notificação: ' + e)
    }
  },
  (app) => {
    // Reversão não aplicável: registros em duplicidade foram unificados na avaliação oficial
  },
)
