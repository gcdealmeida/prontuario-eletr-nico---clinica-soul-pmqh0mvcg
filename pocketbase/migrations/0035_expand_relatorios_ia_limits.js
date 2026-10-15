/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios_ia')

    const conteudoField = col.fields.getByName('conteudo')
    if (conteudoField) {
      conteudoField.max = 500000
    }

    const necessidadeField = col.fields.getByName('necessidade')
    if (necessidadeField) {
      necessidadeField.max = 500000
    }

    const publicoAlvoField = col.fields.getByName('publico_alvo')
    if (publicoAlvoField) {
      publicoAlvoField.max = 500000
    }

    const tituloField = col.fields.getByName('titulo')
    if (tituloField) {
      tituloField.max = 5000
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('relatorios_ia')
      const conteudoField = col.fields.getByName('conteudo')
      if (conteudoField) {
        conteudoField.max = 5000
      }
      const necessidadeField = col.fields.getByName('necessidade')
      if (necessidadeField) {
        necessidadeField.max = 5000
      }
      app.save(col)
    } catch (_) {}
  },
)
