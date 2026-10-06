migrate(
  (app) => {
    // 1. Criar coleção 'exercicios' (Banco de Exercícios da Clínica SOUL)
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // Leitura pública/autenticada para visualização de treinos pelos alunos e profissionais
    // Criação/edição/deleção por profissionais aprovados e admins
    let exerciciosCol
    try {
      exerciciosCol = app.findCollectionByNameOrId('exercicios')
    } catch (_) {
      exerciciosCol = new Collection({
        name: 'exercicios',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: approvedCheck,
        updateRule: approvedCheck,
        deleteRule: approvedCheck,
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'categoria', type: 'text', required: true },
          { name: 'subcategoria', type: 'text' },
          {
            name: 'foto',
            type: 'file',
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          },
          { name: 'link', type: 'text' },
          { name: 'descricao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_exercicios_nome ON exercicios (nome)',
          'CREATE INDEX idx_exercicios_categoria ON exercicios (categoria)',
        ],
      })
      app.save(exerciciosCol)
    }

    // 2. Expandir a coleção 'programa_exercicio' com campos exercicio_id, link e foto_url
    const progExCol = app.findCollectionByNameOrId('programa_exercicio')
    const exColId = app.findCollectionByNameOrId('exercicios').id

    if (!progExCol.fields.getByName('exercicio_id')) {
      progExCol.fields.add(
        new RelationField({
          name: 'exercicio_id',
          collectionId: exColId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    if (!progExCol.fields.getByName('link')) {
      progExCol.fields.add(
        new TextField({
          name: 'link',
        }),
      )
    }

    if (!progExCol.fields.getByName('foto_url')) {
      progExCol.fields.add(
        new TextField({
          name: 'foto_url',
        }),
      )
    }

    app.save(progExCol)

    // 3. Atualizar regras de programa_acompanhamento para garantir persistência e reabertura perfeita
    const progCol = app.findCollectionByNameOrId('programa_acompanhamento')
    const progRead = `${approvedCheck} && (${adminCheck} || profissional_id = '' || profissional_id = null || profissional_id = @request.auth.id || paciente_id.profissional_responsavel_id = '' || paciente_id.profissional_responsavel_id = null || paciente_id.profissional_responsavel_id = @request.auth.id)`
    const progCreate = `${approvedCheck} && (${adminCheck} || @request.body.profissional_id = @request.auth.id || @request.body.profissional_id = '' || @request.body.profissional_id = null)`
    const progWrite = `${approvedCheck} && (${adminCheck} || profissional_id = '' || profissional_id = null || profissional_id = @request.auth.id || paciente_id.profissional_responsavel_id = '' || paciente_id.profissional_responsavel_id = null || paciente_id.profissional_responsavel_id = @request.auth.id)`

    progCol.listRule = progRead
    progCol.viewRule = `${progRead} || token_compartilhamento != ''`
    progCol.createRule = progCreate
    progCol.updateRule = progWrite
    progCol.deleteRule = progWrite
    app.save(progCol)
  },
  (app) => {
    try {
      const progExCol = app.findCollectionByNameOrId('programa_exercicio')
      progExCol.fields.removeByName('exercicio_id')
      progExCol.fields.removeByName('link')
      progExCol.fields.removeByName('foto_url')
      app.save(progExCol)
    } catch (_) {}

    try {
      const col = app.findCollectionByNameOrId('exercicios')
      app.delete(col)
    } catch (_) {}
  },
)
