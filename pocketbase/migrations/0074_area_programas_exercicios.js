/// <reference path="../pb_data/types.d.ts" />
/**
 * 0074 — Área dedicada de Programas de Exercícios (Reabilitação | Personal)
 *
 * 1) programa_acompanhamento.modalidade: select 'reabilitacao' | 'personal'.
 *    Marcador da área dedicada (rótulos e filtros); default tratado no código.
 * 2) programa_semana.carga_planejada_kg / horas_treino: números da periodização
 *    exibidos no painel com gráfico (Recharts).
 * 3) programa_semana.cumprida: bool do acompanhamento semanal.
 * 4) programa_acompanhamento_notas: registro livre do profissional no
 *    Acompanhamento (semana/carga real/observação), por programa.
 * Idempotente: reexecutar não duplica campos nem coleção.
 */
migrate(
  (app) => {
    // 1) modalidade em programa_acompanhamento
    const prog = app.findCollectionByNameOrId('programa_acompanhamento')
    if (!prog.fields.getByName('modalidade')) {
      prog.fields.add(
        new SelectField({ name: 'modalidade', maxSelect: 1, values: ['reabilitacao', 'personal'] }),
      )
      app.save(prog)
    }

    // 2) carga_planejada_kg / horas_treino / cumprida em programa_semana
    const semana = app.findCollectionByNameOrId('programa_semana')
    if (!semana.fields.getByName('carga_planejada_kg')) {
      semana.fields.add(new NumberField({ name: 'carga_planejada_kg', onlyInt: false }))
    }
    if (!semana.fields.getByName('horas_treino')) {
      semana.fields.add(new NumberField({ name: 'horas_treino', onlyInt: false }))
    }
    if (!semana.fields.getByName('cumprida')) {
      semana.fields.add(new BoolField({ name: 'cumprida' }))
    }
    app.save(semana)

    // 3) coleção de notas de acompanhamento
    try {
      app.findCollectionByNameOrId('programa_acompanhamento_notas')
    } catch (_) {
      const notas = new Collection({
        name: 'programa_acompanhamento_notas',
        type: 'base',
        listRule:
          "@request.auth.id != '' && @request.auth.access_status = 'approved' || programa_id.token_compartilhamento != ''",
        viewRule:
          "@request.auth.id != '' && @request.auth.access_status = 'approved' || programa_id.token_compartilhamento != ''",
        createRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
        updateRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
        deleteRule: "@request.auth.id != '' && @request.auth.access_status = 'approved'",
        fields: [
          {
            name: 'programa_id',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('programa_acompanhamento').id,
            maxSelect: 1,
          },
          { name: 'semana_indice', type: 'number' },
          { name: 'titulo', type: 'text', required: true },
          { name: 'descricao', type: 'text' },
          { name: 'carga_real_kg', type: 'number' },
          {
            name: 'cumprimento',
            type: 'select',
            values: ['pleno', 'parcial', 'nao'],
            maxSelect: 1,
          },
          { name: 'autor_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'autor_nome', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_prog_notas_programa ON programa_acompanhamento_notas (programa_id)',
        ],
      })
      app.save(notas)
    }
  },
  (app) => {
    // down: remove o que a subida criou (campos + coleção)
    try {
      const notas = app.findCollectionByNameOrId('programa_acompanhamento_notas')
      app.delete(notas)
    } catch (_) {
      /* coleção não existia */
    }
    try {
      const semana = app.findCollectionByNameOrId('programa_semana')
      semana.fields.removeByName('cumprida')
      semana.fields.removeByName('horas_treino')
      semana.fields.removeByName('carga_planejada_kg')
      app.save(semana)
    } catch (_) {
      /* campos não existiam */
    }
    try {
      const prog = app.findCollectionByNameOrId('programa_acompanhamento')
      prog.fields.removeByName('modalidade')
      app.save(prog)
    } catch (_) {
      /* campo não existia */
    }
  },
)
