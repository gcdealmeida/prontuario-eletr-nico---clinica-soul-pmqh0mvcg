migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')

    // Novos campos estruturados para atender os dados de anamnese e cadastro da clínica SOUL
    const newFields = [
      { name: 'genero', type: 'text' },
      { name: 'queixa_dor_onde', type: 'text' },
      { name: 'atividade_fisica', type: 'text' },
      { name: 'frequencia_semanal', type: 'text' },
      { name: 'duracao_treino', type: 'text' },
      { name: 'controle_alimentar', type: 'text' },
      { name: 'quem_indicou', type: 'text' },
      { name: 'observacoes_formulario', type: 'text' },
      { name: 'ficha_pre_cadastro', type: 'json' },
    ]

    for (let i = 0; i < newFields.length; i++) {
      const f = newFields[i]
      if (!col.fields.getByName(f.name)) {
        if (f.type === 'text') {
          col.fields.add(new TextField({ name: f.name }))
        } else if (f.type === 'json') {
          col.fields.add(new JSONField({ name: f.name }))
        }
      }
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('pacientes')
      const fieldsToRemove = [
        'genero',
        'queixa_dor_onde',
        'atividade_fisica',
        'frequencia_semanal',
        'duracao_treino',
        'controle_alimentar',
        'quem_indicou',
        'observacoes_formulario',
        'ficha_pre_cadastro',
      ]

      for (let i = 0; i < fieldsToRemove.length; i++) {
        const field = col.fields.getByName(fieldsToRemove[i])
        if (field) {
          col.fields.remove(field)
        }
      }

      app.save(col)
    } catch (_) {}
  },
)
