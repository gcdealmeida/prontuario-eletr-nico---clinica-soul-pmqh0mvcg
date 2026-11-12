migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
    if (!col.fields.getByName('dinamometro_leituras')) {
      col.fields.add(new JSONField({ name: 'dinamometro_leituras', maxSize: 2000000 }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
    if (col.fields.getByName('dinamometro_leituras')) {
      col.fields.removeByName('dinamometro_leituras')
      app.save(col)
    }
  },
)
