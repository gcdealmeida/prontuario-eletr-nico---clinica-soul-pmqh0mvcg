/// <reference path="../pb_data/types.d.ts" />
/**
 * 0056 — campos para reproduzir a arte original do gerador "Painel Planejamento
 * Programa SOUL" na proposta de tratamento:
 *  - frase_paciente: frase escolhida pelo cliente na capa
 *  - planos: JSON com a lista de planos (Basic / Otimizado / Personalizado),
 *    cada um com { nome, tagline, foto, foto_config, itens[{icon, texto}],
 *    duracao_semanas, atendimentos, total, parcelas[{n}] }
 *  - logo_custom / props_cab / props_pagina / props_rodape: identidade da pág. 2
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('programas_tratamento')

    const add = (field) => {
      if (!col.fields.getByName(field.name)) col.fields.add(field)
    }

    add(new TextField({ name: 'frase_paciente', max: 2000 }))
    add(
      new JSONField({
        name: 'planos',
        maxSize: 2200000,
      }),
    )
    add(
      new FileField({
        name: 'logo_custom',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      }),
    )
    add(new TextField({ name: 'props_cab', max: 200 }))
    add(new TextField({ name: 'props_pagina', max: 60 }))
    add(new TextField({ name: 'props_rodape', max: 500 }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('programas_tratamento')
    ;[
      'frase_paciente',
      'planos',
      'logo_custom',
      'props_cab',
      'props_pagina',
      'props_rodape',
    ].forEach((n) => {
      const f = col.fields.getByName(n)
      if (f) col.fields.remove(f)
    })
    app.save(col)
  },
)
