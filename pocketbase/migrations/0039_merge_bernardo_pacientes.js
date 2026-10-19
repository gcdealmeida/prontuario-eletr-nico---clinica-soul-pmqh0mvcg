/**
 * Executa a unificação do paciente Bernardo de forma definitiva e idempotente.
 * Mapeia "Bernardo Maia" (hgnzcy4ge6ivr94) -> "Bernardo Juncal Vitória Maia" (4fb1mziit3j9b8u).
 * Limpa o CPF do registro duplicado antes de transferir para respeitar a constraint UNIQUE.
 */

migrate(
  (app) => {
    const targetId = '4fb1mziit3j9b8u' // Bernardo Juncal Vitória Maia
    const sourceId = 'hgnzcy4ge6ivr94' // Bernardo Maia

    let targetPaciente = null
    let sourcePaciente = null

    try {
      targetPaciente = app.findRecordById('pacientes', targetId)
    } catch (_) {
      try {
        targetPaciente = app.findFirstRecordByFilter('pacientes', "nome ~ 'Bernardo Juncal'")
      } catch (_) {}
    }

    try {
      sourcePaciente = app.findRecordById('pacientes', sourceId)
    } catch (_) {
      try {
        sourcePaciente = app.findFirstRecordByFilter(
          'pacientes',
          "nome = 'Bernardo Maia' && id != '" + (targetPaciente ? targetPaciente.id : '') + "'",
        )
      } catch (_) {}
    }

    if (!targetPaciente || !sourcePaciente) {
      console.log(
        'Migração 0039: Bernardo já unificado ou registro não encontrado. Prosseguindo sem alterações.',
      )
      return
    }

    const finalTargetId = targetPaciente.id
    const finalSourceId = sourcePaciente.id
    const targetNome = targetPaciente.getString('nome') || 'Bernardo Juncal Vitória Maia'
    const sourceNome = sourcePaciente.getString('nome') || 'Bernardo Maia'

    console.log(
      'Migração 0039: Unificando "' +
        sourceNome +
        '" (' +
        finalSourceId +
        ') em "' +
        targetNome +
        '" (' +
        finalTargetId +
        ')',
    )

    // 1. Desvincular CPF do duplicado para não conflitar com UNIQUE constraint
    app
      .db()
      .newQuery("UPDATE pacientes SET cpf = '' WHERE id = {:srcId}")
      .bind({ srcId: finalSourceId })
      .execute()

    // 2. Herdar dados de cadastro faltantes
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

    // 3. Mover todas as coleções dependentes
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
        console.log('Erro ao atualizar tabela ' + item.tabela + ' na migracao 0039:', err)
      }
    }

    // 4. Salvar paciente principal consolidado
    app.save(targetPaciente)

    // 5. Excluir o paciente duplicado
    app
      .db()
      .newQuery('DELETE FROM pacientes WHERE id = {:srcId}')
      .bind({ srcId: finalSourceId })
      .execute()

    // 6. Log de auditoria
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
          '). Avaliação de Fisioterapia em rascunho com queixa no joelho, EVA 9 e RNM anexada unificadas com evoluções da planilha.',
      )
      app.save(logRec)
    } catch (_) {}
  },
  (app) => {
    // No-op
  },
)
