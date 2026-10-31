migrate(
  (app) => {
    // 1. Adicionar campo horario (text) na coleção 'presencas'
    try {
      const presCol = app.findCollectionByNameOrId('presencas')
      if (!presCol.fields.getByName('horario')) {
        presCol.fields.add(
          new TextField({
            name: 'horario',
            type: 'text',
            required: false,
          }),
        )
        app.save(presCol)
      }
    } catch (e) {
      console.log('Erro ao adicionar campo horario em presencas: ' + e)
    }

    // 2. Adicionar campo horario (text) na coleção 'evolucoes'
    try {
      const evoCol = app.findCollectionByNameOrId('evolucoes')
      if (!evoCol.fields.getByName('horario')) {
        evoCol.fields.add(
          new TextField({
            name: 'horario',
            type: 'text',
            required: false,
          }),
        )
        app.save(evoCol)
      }
    } catch (e) {
      console.log('Erro ao adicionar campo horario em evolucoes: ' + e)
    }
  },
  (app) => {
    try {
      const presCol = app.findCollectionByNameOrId('presencas')
      const campoPres = presCol.fields.getByName('horario')
      if (campoPres) {
        presCol.fields.removeByName('horario')
        app.save(presCol)
      }
    } catch (_) {}

    try {
      const evoCol = app.findCollectionByNameOrId('evolucoes')
      const campoEvo = evoCol.fields.getByName('horario')
      if (campoEvo) {
        evoCol.fields.removeByName('horario')
        app.save(evoCol)
      }
    } catch (_) {}
  },
)
