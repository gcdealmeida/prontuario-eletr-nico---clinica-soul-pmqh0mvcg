/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Expandir avaliacoes_fisioterapia com novos campos estruturados (mantendo compatibilidade retroativa)
    const fisioCol = app.findCollectionByNameOrId('avaliacoes_fisioterapia')

    if (!fisioCol.fields.getByName('anamnese_detalhada')) {
      fisioCol.fields.add(new JSONField({ name: 'anamnese_detalhada' }))
    }
    if (!fisioCol.fields.getByName('queixas_multiplas')) {
      fisioCol.fields.add(new JSONField({ name: 'queixas_multiplas' }))
    }
    if (!fisioCol.fields.getByName('visceras_sistemicas')) {
      fisioCol.fields.add(new JSONField({ name: 'visceras_sistemicas' }))
    }
    if (!fisioCol.fields.getByName('habitos_saude')) {
      fisioCol.fields.add(new JSONField({ name: 'habitos_saude' }))
    }
    if (!fisioCol.fields.getByName('adm_segmentos')) {
      fisioCol.fields.add(new JSONField({ name: 'adm_segmentos' }))
    }
    if (!fisioCol.fields.getByName('forca_muscular_grupos')) {
      fisioCol.fields.add(new JSONField({ name: 'forca_muscular_grupos' }))
    }
    if (!fisioCol.fields.getByName('forca_core_tabela')) {
      fisioCol.fields.add(new JSONField({ name: 'forca_core_tabela' }))
    }
    if (!fisioCol.fields.getByName('testes_especiais_segmentos')) {
      fisioCol.fields.add(new JSONField({ name: 'testes_especiais_segmentos' }))
    }
    if (!fisioCol.fields.getByName('secoes_complementares')) {
      fisioCol.fields.add(new JSONField({ name: 'secoes_complementares' }))
    }
    if (!fisioCol.fields.getByName('diagnostico_disfuncional')) {
      fisioCol.fields.add(new TextField({ name: 'diagnostico_disfuncional' }))
    }
    if (!fisioCol.fields.getByName('hipotese_diagnostica_ia')) {
      fisioCol.fields.add(new TextField({ name: 'hipotese_diagnostica_ia' }))
    }
    if (!fisioCol.fields.getByName('plano_semanal_detalhado')) {
      fisioCol.fields.add(new JSONField({ name: 'plano_semanal_detalhado' }))
    }
    if (!fisioCol.fields.getByName('anexos_exames')) {
      fisioCol.fields.add(
        new FileField({
          name: 'anexos_exames',
          maxSelect: 15,
          maxSize: 31457280, // 30MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        }),
      )
    }
    if (!fisioCol.fields.getByName('anexos_dinamometro')) {
      fisioCol.fields.add(
        new FileField({
          name: 'anexos_dinamometro',
          maxSelect: 15,
          maxSize: 31457280,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        }),
      )
    }

    app.save(fisioCol)

    // 2. Criar collection de conhecimento clínico com evidências científicas de alto impacto
    let conhecimentoCol
    try {
      conhecimentoCol = app.findCollectionByNameOrId('conhecimento_clinico')
    } catch (_) {
      conhecimentoCol = new Collection({
        name: 'conhecimento_clinico',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'titulo', type: 'text', required: true },
          { name: 'segmento_ou_area', type: 'text', required: true },
          { name: 'nivel_evidencia', type: 'text' },
          { name: 'referencia_bibliografica', type: 'text' },
          { name: 'conteudo_sintese', type: 'text', required: true },
          { name: 'diretrizes_faseadas', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_conhecimento_area ON conhecimento_clinico (segmento_ou_area)'],
      })
      app.save(conhecimentoCol)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('conhecimento_clinico')
      app.delete(col)
    } catch (_) {}
  },
)
