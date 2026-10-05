migrate(
  (app) => {
    // 1. Atualizar a coleção users com campos: access_status, role, especialidade, requested_at, approved_at, approved_by
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('access_status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'access_status',
          values: ['pending', 'approved', 'suspended'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'professional'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('especialidade')) {
      usersCol.fields.add(
        new SelectField({
          name: 'especialidade',
          values: ['Fisioterapia', 'Personal', 'Nutrição', 'Médico', 'Geral'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('requested_at')) {
      usersCol.fields.add(new DateField({ name: 'requested_at' }))
    }

    if (!usersCol.fields.getByName('approved_at')) {
      usersCol.fields.add(new DateField({ name: 'approved_at' }))
    }

    if (!usersCol.fields.getByName('approved_by')) {
      usersCol.fields.add(new TextField({ name: 'approved_by' }))
    }

    if (!usersCol.fields.getByName('last_login_at')) {
      usersCol.fields.add(new DateField({ name: 'last_login_at' }))
    }

    // Regras de users:
    // Admin pode listar e ver todos os usuários para monitorar.
    // Usuários normais só veem a si próprios.
    // Qualquer um autenticado pode atualizar seu próprio perfil, ou admin pode atualizar qualquer um.
    usersCol.listRule =
      "id = @request.auth.id || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    usersCol.viewRule =
      "id = @request.auth.id || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    usersCol.updateRule =
      "id = @request.auth.id || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    usersCol.deleteRule =
      "@request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"

    app.save(usersCol)

    // 2. Criar coleção de auditoria access_logs
    let accessLogsCol
    try {
      accessLogsCol = app.findCollectionByNameOrId('access_logs')
    } catch (_) {
      accessLogsCol = new Collection({
        name: 'access_logs',
        type: 'base',
        listRule: "@request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'",
        viewRule: "@request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'",
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'user_id', type: 'text', required: true },
          { name: 'user_email', type: 'text', required: true },
          { name: 'user_name', type: 'text' },
          {
            name: 'action',
            type: 'select',
            required: true,
            values: [
              'signup_requested',
              'login_success',
              'login_blocked_pending',
              'login_blocked_suspended',
              'access_approved',
              'access_rejected',
              'access_suspended',
              'access_reactivated',
            ],
            maxSelect: 1,
          },
          { name: 'actor_id', type: 'text' },
          { name: 'actor_email', type: 'text' },
          { name: 'details', type: 'text' },
          { name: 'ip_address', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_access_logs_user ON access_logs (user_id)',
          'CREATE INDEX idx_access_logs_action ON access_logs (action)',
          'CREATE INDEX idx_access_logs_created ON access_logs (created DESC)',
        ],
      })
      app.save(accessLogsCol)
    }

    // 3. Garantir que o admin guivemax@hotmail.com seja 'approved' e 'admin'
    try {
      const adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'guivemax@hotmail.com')
      adminRecord.set('access_status', 'approved')
      adminRecord.set('role', 'admin')
      adminRecord.set('approved_at', new Date().toISOString())
      adminRecord.set('approved_by', 'system_migration')
      app.save(adminRecord)
    } catch (err) {
      console.log('Admin user not found to set approved: ' + err)
    }

    // 4. Para outros usuários existentes (se houver), se access_status estiver vazio, aprovar ou manter consistente
    try {
      const allUsers = app.findRecordsByFilter(
        '_pb_users_auth_',
        "access_status = '' || access_status = null",
        '-created',
        200,
        0,
      )
      for (let i = 0; i < allUsers.length; i++) {
        const u = allUsers[i]
        if (u.getString('email') === 'guivemax@hotmail.com') {
          u.set('access_status', 'approved')
          u.set('role', 'admin')
        } else {
          // Usuários legados existentes antes da regra: aprovados para não quebrar ambiente de teste
          u.set('access_status', 'approved')
          u.set('role', 'professional')
        }
        app.save(u)
      }
    } catch (e) {
      console.log('Error updating existing users: ' + e)
    }

    // 5. Atualizar regras de RLS nas coleções clínicas para exigir @request.auth.access_status = 'approved'
    // Coleções: pacientes, consultas, timeline, avaliacoes_fisioterapia, avaliacoes_personal,
    // avaliacoes_nutricao, avaliacoes_medico, evolucoes, google_calendar_syncs, conhecimento_clinico
    const approvedRule = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    const clinicalCollections = [
      'consultas',
      'timeline',
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
      'evolucoes',
      'google_calendar_syncs',
      'conhecimento_clinico',
    ]

    for (const colName of clinicalCollections) {
      try {
        const col = app.findCollectionByNameOrId(colName)
        col.listRule = approvedRule
        col.viewRule = approvedRule
        col.createRule = approvedRule
        col.updateRule = approvedRule
        col.deleteRule = approvedRule
        app.save(col)
      } catch (err) {
        console.log('Could not update rules for ' + colName + ': ' + err)
      }
    }

    // Pacientes: permitir pré-cadastro público na criação, mas leitura/atualização/exclusão apenas aprovados
    try {
      const pacCol = app.findCollectionByNameOrId('pacientes')
      pacCol.listRule = approvedRule
      pacCol.viewRule = approvedRule
      pacCol.createRule = approvedRule + " || @request.body.status = 'Pré-cadastro'"
      pacCol.updateRule = approvedRule
      pacCol.deleteRule = approvedRule
      app.save(pacCol)
    } catch (err) {
      console.log('Could not update rules for pacientes: ' + err)
    }
  },
  (app) => {
    // Reverter regras básicas
    const baseAuthRule = "@request.auth.id != ''"
    const clinicalCollections = [
      'consultas',
      'timeline',
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
      'evolucoes',
      'google_calendar_syncs',
      'conhecimento_clinico',
    ]
    for (const colName of clinicalCollections) {
      try {
        const col = app.findCollectionByNameOrId(colName)
        col.listRule = baseAuthRule
        col.viewRule = baseAuthRule
        col.createRule = baseAuthRule
        col.updateRule = baseAuthRule
        col.deleteRule = baseAuthRule
        app.save(col)
      } catch (_) {}
    }
    try {
      const pacCol = app.findCollectionByNameOrId('pacientes')
      pacCol.listRule = baseAuthRule
      pacCol.viewRule = baseAuthRule
      pacCol.createRule = baseAuthRule + " || @request.body.status = 'Pré-cadastro'"
      pacCol.updateRule = baseAuthRule
      pacCol.deleteRule = baseAuthRule
      app.save(pacCol)
    } catch (_) {}

    try {
      const logs = app.findCollectionByNameOrId('access_logs')
      app.delete(logs)
    } catch (_) {}
  },
)
