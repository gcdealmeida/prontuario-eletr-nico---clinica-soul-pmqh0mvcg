/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('avaliacoes_fisioterapia')

    if (!col.fields.getByName('forca_muscular_descricao')) {
      col.fields.add(new TextField({ name: 'forca_muscular_descricao' }))
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
      const field = col.fields.getByName('forca_muscular_descricao')
      if (field) {
        col.fields.remove(field)
        app.save(col)
      }
    } catch (_) {}
  },
)
