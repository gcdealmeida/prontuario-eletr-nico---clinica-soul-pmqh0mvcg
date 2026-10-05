migrate(
  (app) => {
    const pacientesId = app.findCollectionByNameOrId('pacientes').id

    // 1. Criar collection evolucoes
    const evolucoesCol = new Collection({
      name: 'evolucoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: pacientesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'avaliacao_id',
          type: 'text',
        },
        {
          name: 'especialidade',
          type: 'select',
          required: true,
          values: ['Fisioterapia', 'Personal', 'Nutrição', 'Médico'],
          maxSelect: 1,
        },
        {
          name: 'data_evolucao',
          type: 'date',
          required: true,
        },
        {
          name: 'profissional',
          type: 'text',
          required: true,
        },
        // Modo SOAP
        {
          name: 'subjetivo',
          type: 'text',
        },
        {
          name: 'objetivo',
          type: 'text',
        },
        {
          name: 'avaliacao_clinica',
          type: 'text',
        },
        {
          name: 'plano',
          type: 'text',
        },
        // Conduta/procedimentos realizados na sessão
        {
          name: 'conduta_procedimentos',
          type: 'text',
        },
        // Texto livre da evolução rápida
        {
          name: 'texto_livre',
          type: 'text',
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Finalizada', 'Rascunho'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_evolucoes_paciente ON evolucoes (paciente_id, data_evolucao DESC)',
        'CREATE INDEX idx_evolucoes_avaliacao ON evolucoes (avaliacao_id)',
      ],
    })
    app.save(evolucoesCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('evolucoes')
      app.delete(col)
    } catch (_) {}
  },
)
