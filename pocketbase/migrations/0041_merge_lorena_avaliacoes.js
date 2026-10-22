/**
 * Migração 0041: Unificação dos prontuários/avaliações da paciente Lorena Pimentel Garcia.
 *
 * Paciente: Lorena Pimentel Garcia (id dfpsavito6u6vpj)
 * Avaliação Alvo (manter): 96vr8nbcnx7dnov (Status: Concluída, 2026-10-20)
 * Avaliação Origem (absorver e excluir): jeoicztsumi5f9g (Status: Rascunho, 2026-10-19)
 *
 * Critérios clínicos:
 * 1. Anamnese detalhada:
 *    - acidentes_traumas: preservar o relato rico de ambos:
 *      "Há mais de um ano teve "tropeção" e depois desse dia relata dores. Tropeçou na praia há 1 ano. Depois de um tempo começou com essa queixa de dor.\nSexta passada teve um entorse do tornozelo piora da dor no pé."
 *    - atividade_fisica: "Tênis, Beachtennis, Futevôlei" (incluindo Futevôlei do rascunho)
 *    - cirurgias: preservar "nd / Nd."
 * 2. Hábitos de saúde:
 *    - Preservar dados de sono e água da concluída ("9h", "Boa", "2 litros", "Muito diariamente")
 *    - Absorver dados de alimentação/refeições do rascunho:
 *      refeicoes_cafe: "Se alimenta bem de forma geral."
 *      refeicoes_almoco: "Se alimenta bem de forma geral."
 *      alimentacao_detalhe: "Come bastante - todos os dias."
 * 3. Queixas múltiplas:
 *    - A concluída possui a queixa consolidada (EVA 9, Dor ao pisar, Queimação).
 *    - Registrar nota/histórico preservando os dados do rascunho (EVA 7, dor no pé esquerdo, piora andar/caminhar/manhã).
 * 4. Preservar intactos:
 *    - Anexos de exames (lorena_garcia_mon_oct_19_17_01_06_brst_2026_exame_esta_tico_k2bnud7j53.pdf)
 *    - Diagnóstico disfuncional CIF e Hipótese IA
 *    - Testes especiais positivos (Tripé Podal, Drop do Navicular, Teste do Core Podal)
 *    - Palpação e postura
 *    - Objetivos e plano de tratamento semanal detalhado
 * 5. Excluir o rascunho duplicado jeoicztsumi5f9g
 * 6. Registrar em clinical_update_logs e notifications
 */

migrate(
  (app) => {
    const targetId = '96vr8nbcnx7dnov' // Concluída
    const sourceId = 'jeoicztsumi5f9g' // Rascunho

    let targetAvaliacao = null
    let sourceAvaliacao = null

    try {
      targetAvaliacao = app.findRecordById('avaliacoes_fisioterapia', targetId)
    } catch (_) {}

    try {
      sourceAvaliacao = app.findRecordById('avaliacoes_fisioterapia', sourceId)
    } catch (_) {}

    if (!targetAvaliacao) {
      console.log('Migração 0041: Avaliação alvo 96vr8nbcnx7dnov não encontrada. Abortando.')
      return
    }

    if (!sourceAvaliacao) {
      console.log(
        'Migração 0041: Avaliação rascunho jeoicztsumi5f9g já foi absorvida/excluída. Idempotência garantida.',
      )
      return
    }

    console.log(
      'Migração 0041: Iniciando mesclagem da avaliação rascunho na avaliação concluída...',
    )

    // 1. Processar anamnese_detalhada
    let targetAnamnese = {}
    let sourceAnamnese = {}
    try {
      const rawTargetAnamnese = targetAvaliacao.getString('anamnese_detalhada')
      if (rawTargetAnamnese && rawTargetAnamnese !== 'null') {
        targetAnamnese = JSON.parse(rawTargetAnamnese)
      }
    } catch (_) {}

    try {
      const rawSourceAnamnese = sourceAvaliacao.getString('anamnese_detalhada')
      if (rawSourceAnamnese && rawSourceAnamnese !== 'null') {
        sourceAnamnese = JSON.parse(rawSourceAnamnese)
      }
    } catch (_) {}

    // Combinar acidentes_traumas garantindo que o entorse do tornozelo não seja perdido
    const traumaTarget = targetAnamnese.acidentes_traumas || ''
    const traumaSource = sourceAnamnese.acidentes_traumas || ''
    let combinedTrauma = traumaTarget
    if (traumaSource && !traumaTarget.includes('entorse do tornozelo')) {
      if (combinedTrauma) {
        combinedTrauma +=
          '\nRelato complementar (Rascunho inicial): Tropeçou na praia há 1 ano. Depois de um tempo começou com essa queixa de dor. Sexta passada teve um entorse do tornozelo piora da dor no pé.'
      } else {
        combinedTrauma = traumaSource
      }
    }
    targetAnamnese.acidentes_traumas = combinedTrauma

    // Atividade física combinada
    const ativTarget = targetAnamnese.atividade_fisica || ''
    const ativSource = sourceAnamnese.atividade_fisica || ''
    if (ativSource && !ativTarget.toLowerCase().includes('futev')) {
      targetAnamnese.atividade_fisica =
        (ativTarget ? ativTarget.trim().replace(/,$/, '') + ', ' : '') + 'Futevôlei'
    }

    // Copiar qualquer outro campo de anamnese que exista no source mas não no target
    for (const k in sourceAnamnese) {
      if (!targetAnamnese[k] && sourceAnamnese[k]) {
        targetAnamnese[k] = sourceAnamnese[k]
      }
    }

    targetAvaliacao.set('anamnese_detalhada', targetAnamnese)

    // 2. Processar habitos_saude
    let targetHabitos = {}
    let sourceHabitos = {}
    try {
      const rawTargetHabitos = targetAvaliacao.getString('habitos_saude')
      if (rawTargetHabitos && rawTargetHabitos !== 'null') {
        targetHabitos = JSON.parse(rawTargetHabitos)
      }
    } catch (_) {}

    try {
      const rawSourceHabitos = sourceAvaliacao.getString('habitos_saude')
      if (rawSourceHabitos && rawSourceHabitos !== 'null') {
        sourceHabitos = JSON.parse(rawSourceHabitos)
      }
    } catch (_) {}

    // Adicionar refeicoes_cafe, refeicoes_almoco e notas nutricionais do rascunho
    if (!targetHabitos.refeicoes_cafe && sourceHabitos.refeicoes_cafe) {
      targetHabitos.refeicoes_cafe = sourceHabitos.refeicoes_cafe
    }
    if (!targetHabitos.refeicoes_almoco && sourceHabitos.refeicoes_almoco) {
      targetHabitos.refeicoes_almoco = sourceHabitos.refeicoes_almoco
    }
    for (const k in sourceHabitos) {
      if (!targetHabitos[k] && sourceHabitos[k]) {
        targetHabitos[k] = sourceHabitos[k]
      }
    }
    targetAvaliacao.set('habitos_saude', targetHabitos)

    // 3. Processar queixas_multiplas
    let targetQueixas = []
    let sourceQueixas = []
    try {
      const rawTargetQueixas = targetAvaliacao.getString('queixas_multiplas')
      if (rawTargetQueixas && rawTargetQueixas !== 'null') {
        targetQueixas = JSON.parse(rawTargetQueixas)
      }
    } catch (_) {}
    try {
      const rawSourceQueixas = sourceAvaliacao.getString('queixas_multiplas')
      if (rawSourceQueixas && rawSourceQueixas !== 'null') {
        sourceQueixas = JSON.parse(rawSourceQueixas)
      }
    } catch (_) {}

    // Garantir histórico de avaliação inicial anotado na queixa principal
    if (Array.isArray(targetQueixas) && targetQueixas.length > 0) {
      const q0 = targetQueixas[0]
      if (sourceQueixas && sourceQueixas[0]) {
        const sq0 = sourceQueixas[0]
        const obsRascunho =
          'Rascunho inicial (19/10/2026): EVA ' +
          sq0.eva +
          ', Queixa "' +
          sq0.queixa +
          '", Piora: ' +
          sq0.movimento_piora +
          ', Alívio: ' +
          sq0.o_que_alivia +
          ', Momento do dia: ' +
          sq0.pior_momento_dia
        if (!q0.historico || !q0.historico.includes('Rascunho inicial')) {
          q0.historico = q0.historico ? q0.historico + '\n' + obsRascunho : obsRascunho
        }
      }
      targetAvaliacao.set('queixas_multiplas', targetQueixas)
    }

    // 4. Salvar avaliação alvo unificada
    app.save(targetAvaliacao)
    console.log('Migração 0041: Avaliação alvo 96vr8nbcnx7dnov atualizada com sucesso.')

    // 5. Excluir o rascunho duplicado da base
    app
      .db()
      .newQuery('DELETE FROM avaliacoes_fisioterapia WHERE id = {:srcId}')
      .bind({ srcId: sourceId })
      .execute()
    console.log('Migração 0041: Avaliação rascunho jeoicztsumi5f9g excluída com sucesso.')

    // 6. Registrar auditoria em clinical_update_logs
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
      logRec.set('paciente_id', 'dfpsavito6u6vpj')
      logRec.set('paciente_nome', 'Lorena Pimentel Garcia')
      logRec.set(
        'detalhes',
        'Unificação de prontuários da paciente Lorena Pimentel Garcia: avaliação rascunho (jeoicztsumi5f9g) absorvida na avaliação concluída (96vr8nbcnx7dnov). Preservados exame anexado, hipótese IA, testes especiais, plano semanal e incorporadas observações clínicas de trauma/entorse de tornozelo recente e hábitos de saúde.',
      )
      app.save(logRec)
      console.log('Migração 0041: Log de auditoria clinical_update_logs registrado com sucesso.')
    } catch (e) {
      console.log('Migração 0041: Erro ao registrar clinical_update_logs: ' + e)
    }

    // 7. Criar notificação para administradores
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
        notifRec.set('titulo', 'Unificação de Prontuário - Lorena Pimentel Garcia')
        notifRec.set(
          'descricao',
          'As avaliações em duplicidade da paciente Lorena foram unificadas em uma única avaliação de Fisioterapia concluída, preservando todo o histórico clínico, exames anexados e hipótese IA.',
        )
        notifRec.set('tipo', 'clinical_update')
        notifRec.set('lida', false)
        notifRec.set('link', '/prontuarios/' + targetId + '?esp=Fisioterapia')
        notifRec.set('metadata', {
          paciente_id: 'dfpsavito6u6vpj',
          paciente_nome: 'Lorena Pimentel Garcia',
          avaliacao_id: targetId,
          acao: 'unificacao_avaliacoes',
        })
        app.save(notifRec)
      }
      console.log('Migração 0041: Notificação enviada para ' + adminUsers.length + ' admin(s).')
    } catch (e) {
      console.log('Migração 0041: Erro ao criar notificação: ' + e)
    }
  },
  (app) => {
    // Reversão não recomendada pois a avaliação rascunho excluída foi incorporada na definitiva
  },
)
