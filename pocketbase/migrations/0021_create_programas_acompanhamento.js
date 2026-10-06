migrate(
  (app) => {
    const pacientesCol = app.findCollectionByNameOrId('pacientes')
    const pacientesId = pacientesCol.id

    // RLS definitions
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // Regras de acesso para programa_acompanhamento:
    // Profissional visualiza e gere apenas programas dos seus próprios pacientes ou criados por ele
    // Admin tem acesso total
    const programaReadRule = `${approvedCheck} && (${adminCheck} || profissional_id = '' || profissional_id = null || profissional_id = @request.auth.id || paciente_id.profissional_responsavel_id = @request.auth.id)`
    const programaCreateRule = `${approvedCheck} && (${adminCheck} || @request.body.profissional_id = @request.auth.id)`
    const programaWriteRule = `${approvedCheck} && (${adminCheck} || profissional_id = @request.auth.id || paciente_id.profissional_responsavel_id = @request.auth.id)`

    // Sub-recursos (metas, semanas, exercícios, registros de carga):
    // Permitir acesso autenticado aprovado condicionado ao programa
    const subReadRule = `${approvedCheck}`
    const subWriteRule = `${approvedCheck}`

    // 1. programa_acompanhamento
    const programaCol = new Collection({
      name: 'programa_acompanhamento',
      type: 'base',
      listRule: programaReadRule,
      viewRule: `${programaReadRule} || token_compartilhamento != ''`,
      createRule: programaCreateRule,
      updateRule: programaWriteRule,
      deleteRule: programaWriteRule,
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
          name: 'profissional_id',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        {
          name: 'unidade_duracao',
          type: 'select',
          required: true,
          values: ['dias', 'semanas', 'meses'],
          maxSelect: 1,
        },
        { name: 'total_periodos', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'ativo', 'concluido'],
          maxSelect: 1,
        },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'observacoes', type: 'text' },
        { name: 'token_compartilhamento', type: 'text' },
        { name: 'link_publico_ativo', type: 'bool' },
        { name: 'avaliacao_origem_id', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_prog_paciente ON programa_acompanhamento (paciente_id)',
        'CREATE INDEX idx_prog_profissional ON programa_acompanhamento (profissional_id)',
        'CREATE INDEX idx_prog_token ON programa_acompanhamento (token_compartilhamento)',
      ],
    })
    app.save(programaCol)

    const programaId = app.findCollectionByNameOrId('programa_acompanhamento').id

    // 2. programa_meta
    const metaCol = new Collection({
      name: 'programa_meta',
      type: 'base',
      listRule: subReadRule,
      viewRule: `${subReadRule} || programa_id.token_compartilhamento != ''`,
      createRule: subWriteRule,
      updateRule: subWriteRule,
      deleteRule: subWriteRule,
      fields: [
        {
          name: 'programa_id',
          type: 'relation',
          required: true,
          collectionId: programaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'ordem', type: 'number', required: true },
        { name: 'titulo', type: 'text', required: true },
        { name: 'duracao_periodos', type: 'number' },
        { name: 'descricao', type: 'text' },
        { name: 'fragilidade_ref', type: 'text' },
        { name: 'cor', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_meta_programa ON programa_meta (programa_id)',
        'CREATE INDEX idx_meta_ordem ON programa_meta (programa_id, ordem)',
      ],
    })
    app.save(metaCol)

    // 3. programa_semana (período da periodização)
    const semanaCol = new Collection({
      name: 'programa_semana',
      type: 'base',
      listRule: subReadRule,
      viewRule: `${subReadRule} || programa_id.token_compartilhamento != ''`,
      createRule: subWriteRule,
      updateRule: subWriteRule,
      deleteRule: subWriteRule,
      fields: [
        {
          name: 'programa_id',
          type: 'relation',
          required: true,
          collectionId: programaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'indice', type: 'number', required: true },
        { name: 'rotulo', type: 'text' },
        { name: 'metas_ids', type: 'json' },
        { name: 'foco', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_semana_programa ON programa_semana (programa_id)',
        'CREATE UNIQUE INDEX idx_semana_prog_indice ON programa_semana (programa_id, indice)',
      ],
    })
    app.save(semanaCol)

    // 4. programa_exercicio
    const exercicioCol = new Collection({
      name: 'programa_exercicio',
      type: 'base',
      listRule: subReadRule,
      viewRule: `${subReadRule} || programa_id.token_compartilhamento != ''`,
      createRule: subWriteRule,
      updateRule: subWriteRule,
      deleteRule: subWriteRule,
      fields: [
        {
          name: 'programa_id',
          type: 'relation',
          required: true,
          collectionId: programaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'semana_indice', type: 'number', required: true },
        { name: 'meta_id', type: 'text' },
        { name: 'nome', type: 'text', required: true },
        { name: 'series', type: 'number' },
        {
          name: 'tipo_repeticao',
          type: 'select',
          required: true,
          values: ['reps', 'segundos'],
          maxSelect: 1,
        },
        { name: 'quantidade', type: 'text' },
        { name: 'intervalo', type: 'text' },
        { name: 'carga_prescrita', type: 'text' },
        { name: 'carga_atual_kg', type: 'number' },
        { name: 'observacao', type: 'text' },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ex_programa ON programa_exercicio (programa_id)',
        'CREATE INDEX idx_ex_semana ON programa_exercicio (programa_id, semana_indice)',
      ],
    })
    app.save(exercicioCol)

    const exercicioId = app.findCollectionByNameOrId('programa_exercicio').id

    // 5. programa_registro_carga
    const cargaCol = new Collection({
      name: 'programa_registro_carga',
      type: 'base',
      listRule: subReadRule,
      viewRule: `${subReadRule} || exercicio_id.programa_id.token_compartilhamento != ''`,
      createRule: subWriteRule,
      updateRule: subWriteRule,
      deleteRule: subWriteRule,
      fields: [
        {
          name: 'exercicio_id',
          type: 'relation',
          required: true,
          collectionId: exercicioId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'valor_kg', type: 'number', required: true },
        { name: 'repeticoes_feitas', type: 'text' },
        { name: 'rpe', type: 'number' },
        { name: 'notas', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_carga_exercicio ON programa_registro_carga (exercicio_id)',
        'CREATE INDEX idx_carga_data ON programa_registro_carga (exercicio_id, data)',
      ],
    })
    app.save(cargaCol)
  },
  (app) => {
    const toDelete = [
      'programa_registro_carga',
      'programa_exercicio',
      'programa_semana',
      'programa_meta',
      'programa_acompanhamento',
    ]
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
