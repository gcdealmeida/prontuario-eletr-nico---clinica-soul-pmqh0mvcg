/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0042: Adiciona o campo resumos_anexos (json) nas coleções de avaliação e evoluções
 * Permite persistir o resumo clínico por escrito gerado por IA para cada arquivo anexado (PDF, imagens, laudos)
 * bem como as edições realizadas pelo profissional.
 */
migrate(
  (app) => {
    const collectionsToUpdate = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
      'evolucoes',
    ]

    for (let i = 0; i < collectionsToUpdate.length; i++) {
      const colName = collectionsToUpdate[i]
      try {
        const col = app.findCollectionByNameOrId(colName)
        if (!col.fields.getByName('resumos_anexos')) {
          col.fields.add(
            new JSONField({
              name: 'resumos_anexos',
            }),
          )
          app.save(col)
          console.log('Migração 0042: Campo resumos_anexos adicionado à coleção ' + colName)
        }
      } catch (err) {
        console.log('Migração 0042: Erro ao adicionar campo à coleção ' + colName + ': ' + err)
      }
    }
  },
  (app) => {
    const collectionsToUpdate = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
      'evolucoes',
    ]

    for (let i = 0; i < collectionsToUpdate.length; i++) {
      const colName = collectionsToUpdate[i]
      try {
        const col = app.findCollectionByNameOrId(colName)
        const field = col.fields.getByName('resumos_anexos')
        if (field) {
          col.fields.removeByName('resumos_anexos')
          app.save(col)
        }
      } catch (_) {}
    }
  },
)
