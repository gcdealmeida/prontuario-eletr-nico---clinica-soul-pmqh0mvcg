/**
 * Migração 0040: Unificação de duplicidades da paciente Lorena e consolidação de prontuário.
 * Busca todos os registros correspondentes a "Lorena" (ex.: "Lorena Pimentel Garcia").
 * Unifica registros duplicados no cadastro mais completo, movendo todas as entidades dependentes:
 * avaliacoes_fisioterapia, avaliacoes_personal, avaliacoes_nutricao, avaliacoes_medico,
 * evolucoes, consultas, timeline, programa_acompanhamento, presencas, relatorios_ia, clinical_update_logs.
 * Preenche campos vazios sem sobrescrever dados existentes e gera log de auditoria.
 */

migrate(
  (app) => {
    console.log('Migração 0040: Iniciando verificação de pacientes Lorena...')

    // Buscar registros por filter nativo do PocketBase
    let lorenaRecords = []
    try {
      lorenaRecords = app.findRecordsByFilter('pacientes', "nome ~ 'Lorena'", 'created', 100, 0)
    } catch (e) {
      console.log('Migração 0040: Erro ao buscar registros por filter: ' + e)
    }

    console.log(
      'Migração 0040: Total de pacientes encontrados com nome Lorena: ' + lorenaRecords.length,
    )
    for (let r = 0; r < lorenaRecords.length; r++) {
      const rec = lorenaRecords[r]
      console.log(
        '  - Registro #' +
          (r + 1) +
          ': ID=' +
          rec.id +
          ' | Nome="' +
          rec.getString('nome') +
          '" | CPF=' +
          rec.getString('cpf') +
          ' | Tel=' +
          rec.getString('telefone') +
          ' | Status=' +
          rec.getString('status'),
      )
    }

    if (lorenaRecords.length < 2) {
      console.log(
        'Migração 0040: Menos de dois registros de Lorena encontrados na tabela pacientes (' +
          lorenaRecords.length +
          '). Prosseguindo sem necessidade de mesclagem.',
      )
      return
    }

    // Se houver 2 ou mais registros:
    // Determinar o registro alvo (target) mais completo (nome mais longo ou que já tenha CPF)
    let targetPaciente = lorenaRecords[0]
    let sourcePaciente = lorenaRecords[1]

    for (let i = 0; i < lorenaRecords.length; i++) {
      const cur = lorenaRecords[i]
      const curLen = (cur.getString('nome') || '').length
      const targetLen = (targetPaciente.getString('nome') || '').length

      if (
        curLen > targetLen ||
        (curLen === targetLen && cur.getString('cpf') && !targetPaciente.getString('cpf'))
      ) {
        targetPaciente = cur
      }
    }

    // O source será o outro registro
    for (let i = 0; i < lorenaRecords.length; i++) {
      if (lorenaRecords[i].id !== targetPaciente.id) {
        sourcePaciente = lorenaRecords[i]
        break
      }
    }

    const finalTargetId = targetPaciente.id
    const finalSourceId = sourcePaciente.id
    const targetNome = targetPaciente.getString('nome')
    const sourceNome = sourcePaciente.getString('nome')

    console.log(
      'Migração 0040: Mesclando source ID=' +
        finalSourceId +
        ' ("' +
        sourceNome +
        '") no target ID=' +
        finalTargetId +
        ' ("' +
        targetNome +
        '")',
    )

    // 1. Limpar CPF do source antes de transferir para evitar violação de UNIQUE
    app
      .db()
      .newQuery("UPDATE pacientes SET cpf = '' WHERE id = {:srcId}")
      .bind({ srcId: finalSourceId })
      .execute()

    // 2. Herdar campos vazios no target
    const camposHeranca = [
      'cpf',
      'telefone',
      'email',
      'data_nascimento',
      'genero',
      'endereco',
      'observacoes',
      'origem_como_chegou',
      'quem_indicou',
      'motivo_procura',
      'limitacoes_incomodo',
      'tratamentos_anteriores',
      'resultado_esperado',
      'diagnostico_medico',
      'queixa_dor_onde',
      'atividade_fisica',
      'frequencia_semanal',
      'duracao_treino',
      'controle_alimentar',
      'observacoes_formulario',
      'profissional_responsavel_id',
    ]

    for (let i = 0; i < camposHeranca.length; i++) {
      const campo = camposHeranca[i]
      const valTarget = targetPaciente.getString(campo) || ''
      const valSource = sourcePaciente.getString(campo) || ''
      if (!valTarget && valSource) {
        targetPaciente.set(campo, valSource)
      }
    }

    try {
      const targetFichaRaw = targetPaciente.getString('ficha_pre_cadastro')
      const sourceFichaRaw = sourcePaciente.getString('ficha_pre_cadastro')
      if (
        (!targetFichaRaw || targetFichaRaw === 'null' || targetFichaRaw === '{}') &&
        sourceFichaRaw &&
        sourceFichaRaw !== 'null' &&
        sourceFichaRaw !== '{}'
      ) {
        targetPaciente.set('ficha_pre_cadastro', JSON.parse(sourceFichaRaw))
      }
    } catch (_) {}

    if (
      targetPaciente.getString('status') === 'Pré-cadastro' &&
      sourcePaciente.getString('status') === 'Ativo'
    ) {
      targetPaciente.set('status', 'Ativo')
    }

    // 3. Mover todas as relações dependentes
    const tabelas = [
      { tabela: 'avaliacoes_fisioterapia', campo: 'paciente_id' },
      { tabela: 'avaliacoes_personal', campo: 'paciente_id' },
      { tabela: 'avaliacoes_nutricao', campo: 'paciente_id' },
      { tabela: 'avaliacoes_medico', campo: 'paciente_id' },
      { tabela: 'evolucoes', campo: 'paciente_id' },
      { tabela: 'consultas', campo: 'paciente_id' },
      { tabela: 'timeline', campo: 'paciente_id' },
      { tabela: 'programa_acompanhamento', campo: 'paciente_id' },
      { tabela: 'presencas', campo: 'paciente_id' },
      { tabela: 'relatorios_ia', campo: 'paciente_id' },
      { tabela: 'clinical_update_logs', campo: 'paciente_id' },
    ]

    for (let i = 0; i < tabelas.length; i++) {
      const item = tabelas[i]
      try {
        if (item.tabela === 'presencas') {
          app
            .db()
            .newQuery(
              'UPDATE presencas SET paciente_id = {:tgtId}, paciente_nome = {:tgtNome} WHERE paciente_id = {:srcId}',
            )
            .bind({ tgtId: finalTargetId, tgtNome: targetNome, srcId: finalSourceId })
            .execute()
        } else if (item.tabela === 'clinical_update_logs') {
          app
            .db()
            .newQuery(
              'UPDATE clinical_update_logs SET paciente_id = {:tgtId}, paciente_nome = {:tgtNome} WHERE paciente_id = {:srcId}',
            )
            .bind({ tgtId: finalTargetId, tgtNome: targetNome, srcId: finalSourceId })
            .execute()
        } else {
          app
            .db()
            .newQuery(
              'UPDATE ' +
                item.tabela +
                ' SET ' +
                item.campo +
                ' = {:tgtId} WHERE ' +
                item.campo +
                ' = {:srcId}',
            )
            .bind({ tgtId: finalTargetId, srcId: finalSourceId })
            .execute()
        }
      } catch (err) {
        console.log('Erro ao atualizar tabela ' + item.tabela + ' na migracao 0040:', err)
      }
    }

    // 4. Salvar paciente alvo
    app.save(targetPaciente)

    // 5. Excluir paciente duplicado
    app
      .db()
      .newQuery('DELETE FROM pacientes WHERE id = {:srcId}')
      .bind({ srcId: finalSourceId })
      .execute()

    // 6. Log de auditoria clínica
    try {
      let adminId = 'system'
      try {
        const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'gcdealmeida@gmail.com')
        if (adminUser) adminId = adminUser.id
      } catch (_) {}

      const logCol = app.findCollectionByNameOrId('clinical_update_logs')
      const logRec = new Record(logCol)
      logRec.set('user_id', adminId)
      logRec.set('user_name', 'Dr. Guilherme (Master Admin)')
      logRec.set('user_email', 'gcdealmeida@gmail.com')
      logRec.set('acao', 'editar')
      logRec.set('tipo_entidade', 'prontuario')
      logRec.set('especialidade', 'Geral')
      logRec.set('entidade_id', finalTargetId)
      logRec.set('paciente_id', finalTargetId)
      logRec.set('paciente_nome', targetNome)
      logRec.set(
        'detalhes',
        'Mesclagem de pacientes executada: absorvido "' +
          sourceNome +
          '" (' +
          finalSourceId +
          ') em "' +
          targetNome +
          '" (' +
          finalTargetId +
          '). Prontuário, avaliações, timeline e cadastros unificados.',
      )
      app.save(logRec)
    } catch (_) {}

    console.log('Migração 0040: Unificação da paciente Lorena concluída com sucesso.')
  },
  (app) => {
    // No-op
  },
)
