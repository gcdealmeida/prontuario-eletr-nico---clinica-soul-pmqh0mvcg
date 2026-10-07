/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const fisioCol = app.findCollectionByNameOrId('avaliacoes_fisioterapia')

    if (!fisioCol.fields.getByName('dados_importados_planilha')) {
      fisioCol.fields.add(new JSONField({ name: 'dados_importados_planilha' }))
      app.save(fisioCol)
    }
  },
  (app) => {
    try {
      const fisioCol = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
      const field = fisioCol.fields.getByName('dados_importados_planilha')
      if (field) {
        fisioCol.fields.removeByName('dados_importados_planilha')
        app.save(fisioCol)
      }
    } catch (_) {}
  },
)
