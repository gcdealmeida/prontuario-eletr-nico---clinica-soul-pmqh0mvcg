/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0020: Limpeza e deduplicação de consultas importadas do Google Calendar
 * Remove duplicatas criadas pelo estouro do limite de 3000 registros na busca anterior,
 * mantendo o registro mais recente por (google_event_uid, user_id).
 */
migrate(
  (app) => {
    // 1. Remover registros duplicados de consultas com origem='google', mantendo apenas o mais recente
    app
      .db()
      .newQuery(`
      DELETE FROM consultas 
      WHERE origem = 'google' 
        AND google_event_uid != '' 
        AND id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY google_event_uid, user_id ORDER BY updated DESC, created DESC) as rn
            FROM consultas
            WHERE origem = 'google' AND google_event_uid != ''
          ) t WHERE t.rn = 1
        )
    `)
      .execute()

    // 2. Garantir índice adequado para consultas por origem, user_id e data_hora
    try {
      const consultasCol = app.findCollectionByNameOrId('consultas')
      consultasCol.addIndex('idx_consultas_user_data', false, 'user_id, data_hora', '')
      consultasCol.addIndex(
        'idx_consultas_user_origem_uid',
        false,
        'user_id, origem, google_event_uid',
        '',
      )
      app.save(consultasCol)
    } catch (_) {}
  },
  (app) => {
    try {
      const consultasCol = app.findCollectionByNameOrId('consultas')
      consultasCol.removeIndex('idx_consultas_user_data')
      consultasCol.removeIndex('idx_consultas_user_origem_uid')
      app.save(consultasCol)
    } catch (_) {}
  },
)
