migrate(
  (app) => {
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    const subReadRule = `${approvedCheck}`
    const subWriteRule = `${approvedCheck}`

    const programaId = app.findCollectionByNameOrId('programa_acompanhamento').id

    // 1. Criar collection 'programa_treino' (Sessões / Divisões de Treino: Treino A, Treino B, etc.)
    let treinoCol
    try {
      treinoCol = app.findCollectionByNameOrId('programa_treino')
    } catch (_) {
      treinoCol = new Collection({
        name: 'programa_treino',
        type: 'base',
        listRule: `${subReadRule} || programa_id.token_compartilhamento != ''`,
        viewRule: `${subReadRule} || programa_id.token_compartilhamento != ''`,
        createRule: subWriteRule,
        updateRule: subWriteRule,
        deleteRule: subWriteRule,
        fields: [
          {
            name: 'programa_id',
            type: 'relation',
            required: true,
            collectionId: programaId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'semana_indice', type: 'number', required: true },
          { name: 'nome', type: 'text', required: true },
          { name: 'ordem', type: 'number' },
          { name: 'foco', type: 'text' },
          { name: 'objetivo_id', type: 'text' },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_treino_programa ON programa_treino (programa_id)',
          'CREATE INDEX idx_treino_prog_semana ON programa_treino (programa_id, semana_indice)',
          'CREATE INDEX idx_treino_ordem ON programa_treino (programa_id, semana_indice, ordem)',
        ],
      })
      app.save(treinoCol)
    }

    const treinoColId = app.findCollectionByNameOrId('programa_treino').id

    // 2. Adicionar campo treino_id e treino_nome em 'programa_exercicio'
    const progExCol = app.findCollectionByNameOrId('programa_exercicio')

    if (!progExCol.fields.getByName('treino_id')) {
      progExCol.fields.add(
        new RelationField({
          name: 'treino_id',
          collectionId: treinoColId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    if (!progExCol.fields.getByName('treino_nome')) {
      progExCol.fields.add(
        new TextField({
          name: 'treino_nome',
        }),
      )
    }

    app.save(progExCol)

    // 3. Migração de dados legados:
    // Para cada combinação existente de (programa_id, semana_indice) em 'programa_exercicio',
    // criar um registro 'Treino A' em 'programa_treino' (se ainda não existir) e associar os exercícios
    const exerciciosSemTreino = app.findRecordsByFilter(
      'programa_exercicio',
      "treino_id = '' || treino_id = null",
      'created',
      0,
      0,
    )

    // Agrupar por programa_id e semana_indice
    const pares = {}
    for (let i = 0; i < exerciciosSemTreino.length; i++) {
      const ex = exerciciosSemTreino[i]
      const progId = ex.get('programa_id')
      const semIdx = ex.get('semana_indice')
      const chave = `${progId}_${semIdx}`
      if (!pares[chave]) {
        pares[chave] = { programa_id: progId, semana_indice: semIdx, ids: [] }
      }
      pares[chave].ids.push(ex.id)
    }

    const chaves = Object.keys(pares)
    for (let i = 0; i < chaves.length; i++) {
      const item = pares[chaves[i]]
      let treinoRecord
      try {
        treinoRecord = app.findFirstRecordByData('programa_treino', 'programa_id', item.programa_id)
        // Se achou um, confirmar se é da mesma semana
        if (treinoRecord.get('semana_indice') !== item.semana_indice) {
          throw new Error('Not same week')
        }
      } catch (_) {
        treinoRecord = new Record(treinoCol)
        treinoRecord.set('programa_id', item.programa_id)
        treinoRecord.set('semana_indice', item.semana_indice)
        treinoRecord.set('nome', 'Treino A')
        treinoRecord.set('ordem', 1)
        app.save(treinoRecord)
      }

      // Vincular os exercícios ao Treino A criado/encontrado
      for (let j = 0; j < item.ids.length; j++) {
        try {
          const exRec = app.findFirstRecordByData('programa_exercicio', 'id', item.ids[j])
          exRec.set('treino_id', treinoRecord.id)
          exRec.set('treino_nome', 'Treino A')
          app.save(exRec)
        } catch (_) {}
      }
    }
  },
  (app) => {
    try {
      const progExCol = app.findCollectionByNameOrId('programa_exercicio')
      progExCol.fields.removeByName('treino_id')
      progExCol.fields.removeByName('treino_nome')
      app.save(progExCol)
    } catch (_) {}

    try {
      const col = app.findCollectionByNameOrId('programa_treino')
      app.delete(col)
    } catch (_) {}
  },
)
