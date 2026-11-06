migrate(
  (app) => {
    // Evolução da ferramenta "Programa de Tratamento": capa com foto ajustável,
    // textos livres editáveis e modelos reutilizáveis. Migration idempotente.
    const col = app.findCollectionByNameOrId('programas_tratamento')

    // 1. Foto da capa (upload, padrão de anexos do projeto: campo file)
    if (!col.fields.getByName('capa_foto')) {
      col.fields.add(
        new FileField({
          name: 'capa_foto',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['800x0'],
        }),
      )
    }

    // 2. Ajustes da foto da capa (posição/zoom/intensidade) + referência do mês
    if (!col.fields.getByName('capa_config')) {
      col.fields.add(new JSONField({ name: 'capa_config', maxSize: 4000 }))
    }
    if (!col.fields.getByName('mes_referencia')) {
      col.fields.add(new TextField({ name: 'mes_referencia', max: 80 }))
    }

    // 3. Textos livres da proposta (nada hardcoded no documento final)
    if (!col.fields.getByName('texto_apresentacao')) {
      col.fields.add(new TextField({ name: 'texto_apresentacao', max: 8000 }))
    }
    if (!col.fields.getByName('texto_introducao')) {
      col.fields.add(new TextField({ name: 'texto_introducao', max: 8000 }))
    }
    if (!col.fields.getByName('condicoes_pagamento')) {
      col.fields.add(new TextField({ name: 'condicoes_pagamento', max: 8000 }))
    }
    if (!col.fields.getByName('observacoes')) {
      col.fields.add(new TextField({ name: 'observacoes', max: 8000 }))
    }

    // 4. Modelos reutilizáveis: flag na própria coleção (caminho mais simples)
    if (!col.fields.getByName('is_modelo')) {
      col.fields.add(new BoolField({ name: 'is_modelo' }))
    }
    if (!col.fields.getByName('modelo_nome')) {
      col.fields.add(new TextField({ name: 'modelo_nome', max: 200 }))
    }

    // Índice de listagem de modelos
    col.addIndex('idx_progtrat_modelos', false, 'is_modelo', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('programas_tratamento')
    ;[
      'capa_foto',
      'capa_config',
      'mes_referencia',
      'texto_apresentacao',
      'texto_introducao',
      'condicoes_pagamento',
      'observacoes',
      'is_modelo',
      'modelo_nome',
    ].forEach((n) => {
      const f = col.fields.getByName(n)
      if (f) col.fields.removeByName(n)
    })
    col.removeIndex('idx_progtrat_modelos')
    app.save(col)
  },
)
