migrate(
  (app) => {
    // Regras: exclusivamente o admin master (mesmo padrão da ferramenta Mesclar Cadastros)
    const adminRule =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"

    // 1. Criar coleção 'programas_tratamento' (propostas comerciais)
    let col
    try {
      col = app.findCollectionByNameOrId('programas_tratamento')
    } catch (_) {
      const pacId = app.findCollectionByNameOrId('pacientes').id
      col = new Collection({
        name: 'programas_tratamento',
        type: 'base',
        listRule: adminRule,
        viewRule: adminRule,
        createRule: adminRule,
        updateRule: adminRule,
        deleteRule: adminRule,
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
            name: 'titulo',
            type: 'text',
            required: true,
            max: 300,
          },
          {
            name: 'data_inicio',
            type: 'date',
          },
          {
            name: 'data_fim',
            type: 'date',
          },
          {
            name: 'duracao_semanas',
            type: 'number',
            onlyInt: true,
          },
          {
            name: 'itens',
            type: 'json',
          },
          {
            name: 'desconto_geral_tipo',
            type: 'select',
            values: ['nenhum', 'percentual', 'valor'],
            maxSelect: 1,
          },
          {
            name: 'desconto_geral_valor',
            type: 'number',
          },
          {
            name: 'valor_total',
            type: 'number',
          },
          {
            name: 'condicoes',
            type: 'text',
            max: 5000,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['rascunho', 'finalizada'],
            maxSelect: 1,
          },
          {
            name: 'paciente_nome',
            type: 'text',
            max: 300,
          },
          {
            name: 'criado_por',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
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
          'CREATE INDEX idx_progtrat_paciente ON programas_tratamento (paciente_id)',
          'CREATE INDEX idx_progtrat_status ON programas_tratamento (status)',
          'CREATE INDEX idx_progtrat_created ON programas_tratamento (created DESC)',
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const c = app.findCollectionByNameOrId('programas_tratamento')
      app.delete(c)
    } catch (_) {}
  },
)
