migrate(
  (app) => {
    // 1. pacientes
    const pacientesCol = new Collection({
      name: 'pacientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'cpf', type: 'text' },
        { name: 'data_nascimento', type: 'date' },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'endereco', type: 'text' },
        { name: 'observacoes', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pacientes_nome ON pacientes (nome)',
        "CREATE UNIQUE INDEX idx_pacientes_cpf ON pacientes (cpf) WHERE cpf IS NOT NULL AND cpf != ''",
      ],
    })
    app.save(pacientesCol)

    const pacientesId = app.findCollectionByNameOrId('pacientes').id

    // 2. consultas
    const consultasCol = new Collection({
      name: 'consultas',
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
          name: 'especialidade',
          type: 'select',
          required: true,
          values: ['Fisioterapia', 'Personal', 'Nutrição', 'Médico'],
          maxSelect: 1,
        },
        { name: 'data_hora', type: 'date', required: true },
        { name: 'duracao_min', type: 'number' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Agendada', 'Confirmada', 'Concluída', 'Cancelada'],
          maxSelect: 1,
        },
        { name: 'notas', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_consultas_paciente ON consultas (paciente_id)',
        'CREATE INDEX idx_consultas_data_hora ON consultas (data_hora)',
      ],
    })
    app.save(consultasCol)

    // 3. timeline
    const timelineCol = new Collection({
      name: 'timeline',
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
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Consulta', 'Avaliação', 'Nota'],
          maxSelect: 1,
        },
        {
          name: 'especialidade',
          type: 'select',
          values: ['Fisioterapia', 'Personal', 'Nutrição', 'Médico'],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'conteudo', type: 'text' },
        { name: 'data_evento', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_timeline_paciente_data ON timeline (paciente_id, data_evento)'],
    })
    app.save(timelineCol)

    // 4. avaliacoes_fisioterapia
    const fisioCol = new Collection({
      name: 'avaliacoes_fisioterapia',
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
          name: 'especialidade',
          type: 'select',
          required: true,
          values: ['Fisioterapia'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Rascunho', 'Concluída'],
          maxSelect: 1,
        },
        { name: 'queixa_principal', type: 'text', required: true },
        { name: 'historia_doenca_atual', type: 'text' },
        { name: 'historico_medico', type: 'text' },
        { name: 'medicamentos', type: 'text' },
        { name: 'cirurgias', type: 'text' },
        { name: 'postura', type: 'text' },
        { name: 'adm_ombro', type: 'number' },
        { name: 'adm_joelho', type: 'number' },
        { name: 'adm_quadril', type: 'number' },
        { name: 'adm_coluna', type: 'number' },
        { name: 'forca_mmss', type: 'number' },
        { name: 'forca_mmii', type: 'number' },
        { name: 'forca_core', type: 'number' },
        { name: 'palpacao', type: 'text' },
        { name: 'testes_especiais', type: 'text' },
        { name: 'diagnostico_fisioterapeutico', type: 'text' },
        { name: 'objetivos_tratamento', type: 'text' },
        { name: 'plano_tratamento', type: 'text' },
        { name: 'evolucao_nota', type: 'text' },
        { name: 'profissional_responsavel', type: 'text' },
        { name: 'data_avaliacao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_afisio_paciente ON avaliacoes_fisioterapia (paciente_id)'],
    })
    app.save(fisioCol)

    // 5. avaliacoes_personal
    const personalCol = new Collection({
      name: 'avaliacoes_personal',
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
          name: 'especialidade',
          type: 'select',
          required: true,
          values: ['Personal'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Rascunho', 'Concluída'],
          maxSelect: 1,
        },
        {
          name: 'objetivo_principal',
          type: 'select',
          values: [
            'Hipertrofia',
            'Emagrecimento',
            'Condicionamento',
            'Reabilitação',
            'Performance',
          ],
          maxSelect: 1,
        },
        {
          name: 'nivel_experiencia',
          type: 'select',
          values: ['Iniciante', 'Intermediário', 'Avançado'],
          maxSelect: 1,
        },
        { name: 'frequencia_semanal', type: 'number' },
        { name: 'restricoes_treino', type: 'text' },
        { name: 'peso', type: 'number' },
        { name: 'altura', type: 'number' },
        { name: 'imc', type: 'number' },
        { name: 'percentual_gordura', type: 'number' },
        { name: 'circ_cintura', type: 'number' },
        { name: 'circ_abdomen', type: 'number' },
        { name: 'circ_quadril', type: 'number' },
        { name: 'flexibilidade_sit_reach', type: 'number' },
        { name: 'teste_1rm', type: 'text' },
        { name: 'vo2max', type: 'number' },
        { name: 'resistencia_muscular', type: 'text' },
        { name: 'plano_treino', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'profissional_responsavel', type: 'text' },
        { name: 'data_avaliacao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_apersonal_paciente ON avaliacoes_personal (paciente_id)'],
    })
    app.save(personalCol)

    // 6. avaliacoes_nutricao
    const nutriCol = new Collection({
      name: 'avaliacoes_nutricao',
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
          name: 'especialidade',
          type: 'select',
          required: true,
          values: ['Nutrição'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Rascunho', 'Concluída'],
          maxSelect: 1,
        },
        { name: 'peso', type: 'number' },
        { name: 'altura', type: 'number' },
        { name: 'imc', type: 'number' },
        { name: 'historico_peso', type: 'text' },
        { name: 'patologias', type: 'text' },
        { name: 'medicamentos', type: 'text' },
        { name: 'cirurgias', type: 'text' },
        { name: 'historico_familiar', type: 'text' },
        { name: 'rec_cafe_manha', type: 'text' },
        { name: 'rec_almoco', type: 'text' },
        { name: 'rec_jantar', type: 'text' },
        { name: 'rec_lanches', type: 'text' },
        { name: 'consumo_agua_l', type: 'number' },
        {
          name: 'consumo_alcool',
          type: 'select',
          values: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'],
          maxSelect: 1,
        },
        { name: 'atividade_fisica', type: 'text' },
        { name: 'sono_horas', type: 'number' },
        { name: 'estresse_nivel', type: 'number' },
        { name: 'tabagismo', type: 'select', values: ['Sim', 'Não'], maxSelect: 1 },
        { name: 'objetivos', type: 'text' },
        { name: 'plano_alimentar', type: 'text' },
        { name: 'metas', type: 'text' },
        { name: 'profissional_responsavel', type: 'text' },
        { name: 'data_avaliacao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_anutri_paciente ON avaliacoes_nutricao (paciente_id)'],
    })
    app.save(nutriCol)

    // 7. avaliacoes_medico
    const medicoCol = new Collection({
      name: 'avaliacoes_medico',
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
        { name: 'especialidade', type: 'select', required: true, values: ['Médico'], maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Rascunho', 'Concluída'],
          maxSelect: 1,
        },
        { name: 'queixa_principal', type: 'text', required: true },
        { name: 'hda', type: 'text' },
        { name: 'historico_medico', type: 'text' },
        { name: 'medicamentos', type: 'text' },
        { name: 'alergias', type: 'text' },
        { name: 'antecedentes_familiares', type: 'text' },
        { name: 'pressao_arterial', type: 'text' },
        { name: 'fc', type: 'number' },
        { name: 'fr', type: 'number' },
        { name: 'temperatura', type: 'number' },
        { name: 'peso', type: 'number' },
        { name: 'altura', type: 'number' },
        { name: 'ausculta', type: 'text' },
        { name: 'abdome', type: 'text' },
        { name: 'aparelho_osteomuscular', type: 'text' },
        { name: 'hipotese_diagnostica', type: 'text' },
        { name: 'exames_complementares', type: 'text' },
        { name: 'conduta_terapeutica', type: 'text' },
        { name: 'prescricao', type: 'text' },
        { name: 'evolucao_nota', type: 'text' },
        { name: 'profissional_responsavel', type: 'text' },
        { name: 'data_avaliacao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_amedico_paciente ON avaliacoes_medico (paciente_id)'],
    })
    app.save(medicoCol)
  },
  (app) => {
    const toDelete = [
      'avaliacoes_medico',
      'avaliacoes_nutricao',
      'avaliacoes_personal',
      'avaliacoes_fisioterapia',
      'timeline',
      'consultas',
      'pacientes',
    ]
    for (const name of toDelete) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
