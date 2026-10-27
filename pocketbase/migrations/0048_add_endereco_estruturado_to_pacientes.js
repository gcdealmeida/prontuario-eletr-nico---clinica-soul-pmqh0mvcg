migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')

    if (!col.fields.getByName('endereco_rua')) {
      col.fields.add(new TextField({ name: 'endereco_rua' }))
    }
    if (!col.fields.getByName('endereco_numero')) {
      col.fields.add(new TextField({ name: 'endereco_numero' }))
    }
    if (!col.fields.getByName('endereco_complemento')) {
      col.fields.add(new TextField({ name: 'endereco_complemento' }))
    }
    if (!col.fields.getByName('endereco_bairro')) {
      col.fields.add(new TextField({ name: 'endereco_bairro' }))
    }
    if (!col.fields.getByName('endereco_cidade')) {
      col.fields.add(new TextField({ name: 'endereco_cidade' }))
    }
    if (!col.fields.getByName('endereco_estado')) {
      col.fields.add(new TextField({ name: 'endereco_estado' }))
    }
    if (!col.fields.getByName('endereco_cep')) {
      col.fields.add(new TextField({ name: 'endereco_cep' }))
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('pacientes')
      const fieldsToRemove = [
        'endereco_rua',
        'endereco_numero',
        'endereco_complemento',
        'endereco_bairro',
        'endereco_cidade',
        'endereco_estado',
        'endereco_cep',
      ]
      fieldsToRemove.forEach((fName) => {
        const f = col.fields.getByName(fName)
        if (f) col.fields.remove(f)
      })
      app.save(col)
    } catch (_) {}
  },
)
