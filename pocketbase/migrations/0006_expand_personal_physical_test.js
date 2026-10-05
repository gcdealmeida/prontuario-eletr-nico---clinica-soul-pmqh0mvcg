/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const personalCol = app.findCollectionByNameOrId('avaliacoes_personal')

    // 1. IDENTIFICAÇÃO E ANAMNESE (pressão arterial, FC repouso, histórico)
    if (!personalCol.fields.getByName('anamnese_personal')) {
      personalCol.fields.add(new JSONField({ name: 'anamnese_personal' }))
    }

    // 2. COMPOSIÇÃO CORPORAL (dobras cutâneas, protocolos, perímetros, resultados calculados)
    if (!personalCol.fields.getByName('composicao_corporal')) {
      personalCol.fields.add(new JSONField({ name: 'composicao_corporal' }))
    }

    // 3. FORÇA MUSCULAR — DINAMÔMETRO MANUAL
    if (!personalCol.fields.getByName('forca_dinamometro')) {
      personalCol.fields.add(new JSONField({ name: 'forca_dinamometro' }))
    }
    if (!personalCol.fields.getByName('forca_muscular_descricao')) {
      personalCol.fields.add(new TextField({ name: 'forca_muscular_descricao' }))
    }
    if (!personalCol.fields.getByName('anexos_dinamometro')) {
      personalCol.fields.add(
        new FileField({
          name: 'anexos_dinamometro',
          maxSelect: 15,
          maxSize: 31457280, // 30MB
          mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'text/plain',
            'text/csv',
          ],
        }),
      )
    }

    // 4. FLEXIBILIDADE (Banco de Wells, Flexitest)
    if (!personalCol.fields.getByName('flexibilidade_dados')) {
      personalCol.fields.add(new JSONField({ name: 'flexibilidade_dados' }))
    }

    // 5. AVALIAÇÃO POSTURAL ESTÁTICA & FOTOS
    if (!personalCol.fields.getByName('postural_dados')) {
      personalCol.fields.add(new JSONField({ name: 'postural_dados' }))
    }
    if (!personalCol.fields.getByName('anexos_postura')) {
      personalCol.fields.add(
        new FileField({
          name: 'anexos_postura',
          maxSelect: 15,
          maxSize: 31457280,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        }),
      )
    }

    // 6. TESTE FUNCIONAL DE CORE (McGill Torso Endurance Tests)
    if (!personalCol.fields.getByName('core_mcgill')) {
      personalCol.fields.add(new JSONField({ name: 'core_mcgill' }))
    }

    // 7. FMS — FUNCTIONAL MOVEMENT SCREEN
    if (!personalCol.fields.getByName('fms_dados')) {
      personalCol.fields.add(new JSONField({ name: 'fms_dados' }))
    }

    // 8. METAS E PRESCRIÇÃO
    if (!personalCol.fields.getByName('metas_treino')) {
      personalCol.fields.add(new JSONField({ name: 'metas_treino' }))
    }

    app.save(personalCol)
  },
  (app) => {
    // Reverter campos adicionados se necessário
    try {
      const personalCol = app.findCollectionByNameOrId('avaliacoes_personal')
      const fieldsToRemove = [
        'anamnese_personal',
        'composicao_corporal',
        'forca_dinamometro',
        'forca_muscular_descricao',
        'anexos_dinamometro',
        'flexibilidade_dados',
        'postural_dados',
        'anexos_postura',
        'core_mcgill',
        'fms_dados',
        'metas_treino',
      ]
      for (const f of fieldsToRemove) {
        if (personalCol.fields.getByName(f)) {
          personalCol.fields.removeByName(f)
        }
      }
      app.save(personalCol)
    } catch (_) {}
  },
)
