migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')

    // 1. Atualizar valores do campo status para incluir 'Pré-cadastro'
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Ativo', 'Inativo', 'Pré-cadastro']
    }

    // 2. Adicionar campos específicos do formulário de pré-cadastro
    if (!col.fields.getByName('origem_como_chegou')) {
      col.fields.add(new TextField({ name: 'origem_como_chegou' }))
    }
    if (!col.fields.getByName('motivo_procura')) {
      col.fields.add(new TextField({ name: 'motivo_procura' }))
    }
    if (!col.fields.getByName('limitacoes_incomodo')) {
      col.fields.add(new TextField({ name: 'limitacoes_incomodo' }))
    }
    if (!col.fields.getByName('tratamentos_anteriores')) {
      col.fields.add(new TextField({ name: 'tratamentos_anteriores' }))
    }
    if (!col.fields.getByName('resultado_esperado')) {
      col.fields.add(new TextField({ name: 'resultado_esperado' }))
    }
    if (!col.fields.getByName('diagnostico_medico')) {
      col.fields.add(new TextField({ name: 'diagnostico_medico' }))
    }

    // 3. Regra de criação: permitir criação pública de pacientes com status = 'Pré-cadastro' OU usuários autenticados
    // createRule: @request.auth.id != '' || @request.body.status = 'Pré-cadastro'
    col.createRule = "@request.auth.id != '' || @request.body.status = 'Pré-cadastro'"

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('pacientes')
      col.createRule = "@request.auth.id != ''"

      const fieldsToRemove = [
        'origem_como_chegou',
        'motivo_procura',
        'limitacoes_incomodo',
        'tratamentos_anteriores',
        'resultado_esperado',
        'diagnostico_medico',
      ]

      fieldsToRemove.forEach((fName) => {
        const f = col.fields.getByName(fName)
        if (f) col.fields.remove(f)
      })

      const statusField = col.fields.getByName('status')
      if (statusField) {
        statusField.values = ['Ativo', 'Inativo']
      }

      app.save(col)
    } catch (_) {}
  },
)
