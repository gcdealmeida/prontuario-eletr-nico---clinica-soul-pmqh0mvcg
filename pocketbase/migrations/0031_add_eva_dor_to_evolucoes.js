migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('evolucoes')

    if (!col.fields.getByName('eva_dor')) {
      col.fields.add(
        new NumberField({
          name: 'eva_dor',
          min: 0,
          max: 10,
          onlyInt: true,
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('evolucoes')
      const field = col.fields.getByName('eva_dor')
      if (field) {
        col.fields.remove(field)
        app.save(col)
      }
    } catch (_) {}
  },
)
