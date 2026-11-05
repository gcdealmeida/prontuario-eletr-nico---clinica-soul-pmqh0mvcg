migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
    if (!col.fields.getByName('estrela_dor')) {
      col.fields.add(new JSONField({ name: 'estrela_dor', maxSize: 2000000 }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
    if (col.fields.getByName('estrela_dor')) {
      col.fields.removeByName('estrela_dor')
      app.save(col)
    }
  },
)
