migrate(
  (app) => {
    // 1. Criar coleção google_calendar_syncs para gerenciar as URLs secretas iCal e metadados por usuário
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    let syncCol = null
    try {
      syncCol = app.findCollectionByNameOrId('google_calendar_syncs')
    } catch (_) {}

    if (!syncCol) {
      syncCol = new Collection({
        name: 'google_calendar_syncs',
        type: 'base',
        listRule: "@request.auth.id != '' && user_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
        createRule: "@request.auth.id != '' && user_id = @request.auth.id",
        updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'ics_url',
            type: 'text',
            required: true,
          },
          {
            name: 'calendar_name',
            type: 'text',
          },
          {
            name: 'last_sync',
            type: 'date',
          },
          {
            name: 'last_status',
            type: 'text',
          },
          {
            name: 'last_error',
            type: 'text',
          },
          {
            name: 'events_count',
            type: 'number',
          },
          {
            name: 'auto_sync',
            type: 'bool',
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_google_sync_user ON google_calendar_syncs (user_id)'],
      })
      app.save(syncCol)
    }

    // 2. Criar paciente sistema "Google Calendar" para agrupar eventos externos sem vincular a paciente clínico real
    let googlePaciente = null
    try {
      googlePaciente = app.findFirstRecordByData('pacientes', 'nome', 'Google Agenda')
    } catch (_) {}

    if (!googlePaciente) {
      const pacientesCol = app.findCollectionByNameOrId('pacientes')
      const rec = new Record(pacientesCol)
      rec.set('nome', 'Google Agenda')
      rec.set(
        'observacoes',
        'Registro de sistema para alocação de eventos externos importados via iCal',
      )
      rec.set('status', 'Ativo')
      app.save(rec)
    }

    // 3. Adicionar campos em 'consultas':
    // origem (ex: 'app' | 'google'), google_event_uid, google_sync_id, titulo_externo, user_id
    const consultasCol = app.findCollectionByNameOrId('consultas')

    if (!consultasCol.fields.getByName('origem')) {
      consultasCol.fields.add(
        new TextField({
          name: 'origem',
        }),
      )
    }

    if (!consultasCol.fields.getByName('google_event_uid')) {
      consultasCol.fields.add(
        new TextField({
          name: 'google_event_uid',
        }),
      )
    }

    if (!consultasCol.fields.getByName('google_sync_id')) {
      consultasCol.fields.add(
        new TextField({
          name: 'google_sync_id',
        }),
      )
    }

    if (!consultasCol.fields.getByName('titulo_externo')) {
      consultasCol.fields.add(
        new TextField({
          name: 'titulo_externo',
        }),
      )
    }

    if (!consultasCol.fields.getByName('user_id')) {
      consultasCol.fields.add(
        new RelationField({
          name: 'user_id',
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }

    app.save(consultasCol)

    // Adicionar índice para busca rápida por google_event_uid e origem
    try {
      consultasCol.addIndex('idx_consultas_google_uid', false, 'google_event_uid', '')
      consultasCol.addIndex('idx_consultas_origem', false, 'origem', '')
      app.save(consultasCol)
    } catch (_) {}
  },
  (app) => {
    try {
      const consultasCol = app.findCollectionByNameOrId('consultas')
      const fOrigem = consultasCol.fields.getByName('origem')
      if (fOrigem) consultasCol.fields.remove(fOrigem)
      const fUid = consultasCol.fields.getByName('google_event_uid')
      if (fUid) consultasCol.fields.remove(fUid)
      const fSyncId = consultasCol.fields.getByName('google_sync_id')
      if (fSyncId) consultasCol.fields.remove(fSyncId)
      const fTit = consultasCol.fields.getByName('titulo_externo')
      if (fTit) consultasCol.fields.remove(fTit)
      const fUser = consultasCol.fields.getByName('user_id')
      if (fUser) consultasCol.fields.remove(fUser)
      app.save(consultasCol)
    } catch (_) {}

    try {
      const syncCol = app.findCollectionByNameOrId('google_calendar_syncs')
      if (syncCol) app.delete(syncCol)
    } catch (_) {}
  },
)
