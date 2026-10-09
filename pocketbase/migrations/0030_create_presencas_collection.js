migrate(
  (app) => {
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // Regras de escopo:
    // listRule e viewRule: Admin vê todos; profissional aprovado vê apenas os seus lançamentos
    const presencaReadRule = `${approvedCheck} && (${adminCheck} || profissional_id = @request.auth.id)`
    // createRule: Admin pode criar para qualquer profissional; profissional comum só cria se profissional_id for o seu próprio id
    const presencaCreateRule = `${approvedCheck} && (${adminCheck} || @request.body.profissional_id = @request.auth.id)`
    // updateRule e deleteRule: Admin pode editar/excluir qualquer; profissional comum apenas os seus
    const presencaWriteRule = `${approvedCheck} && (${adminCheck} || profissional_id = @request.auth.id)`

    const pacId = app.findCollectionByNameOrId('pacientes').id

    // 1. Atualizar clinical_update_logs para incluir tipo_entidade 'presenca' se necessário
    try {
      const logsCol = app.findCollectionByNameOrId('clinical_update_logs')
      const tipoField = logsCol.fields.getByName('tipo_entidade')
      if (tipoField && tipoField.values && !tipoField.values.includes('presenca')) {
        tipoField.values = [...tipoField.values, 'presenca']
        app.save(logsCol)
      }
    } catch (e) {
      console.log('Aviso ao atualizar tipo_entidade em clinical_update_logs: ' + e)
    }

    // 2. Criar coleção 'presencas'
    let presCol
    try {
      presCol = app.findCollectionByNameOrId('presencas')
    } catch (_) {
      presCol = new Collection({
        name: 'presencas',
        type: 'base',
        listRule: presencaReadRule,
        viewRule: presencaReadRule,
        createRule: presencaCreateRule,
        updateRule: presencaWriteRule,
        deleteRule: presencaWriteRule,
        fields: [
          {
            name: 'paciente_id',
            type: 'relation',
            required: true,
            collectionId: pacId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'profissional_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'data_atendimento',
            type: 'date',
            required: true,
          },
          {
            name: 'area_servico',
            type: 'text',
            required: true,
          },
          {
            name: 'detalhe_servico',
            type: 'text',
          },
          {
            name: 'observacoes',
            type: 'text',
          },
          {
            name: 'status',
            type: 'select',
            required: false,
            values: ['Presente', 'Confirmado', 'Justificado', 'Cancelado'],
            maxSelect: 1,
          },
          {
            name: 'paciente_nome',
            type: 'text',
          },
          {
            name: 'profissional_nome',
            type: 'text',
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_presencas_profissional ON presencas (profissional_id)',
          'CREATE INDEX idx_presencas_paciente ON presencas (paciente_id)',
          'CREATE INDEX idx_presencas_data ON presencas (data_atendimento DESC)',
          'CREATE INDEX idx_presencas_prof_data ON presencas (profissional_id, data_atendimento DESC)',
          'CREATE INDEX idx_presencas_pac_data ON presencas (paciente_id, data_atendimento DESC)',
        ],
      })
      app.save(presCol)
    }
  },
  (app) => {
    try {
      const presCol = app.findCollectionByNameOrId('presencas')
      app.delete(presCol)
    } catch (_) {}
  },
)
