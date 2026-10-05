migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('calendar_token')) {
      users.fields.add(
        new TextField({
          name: 'calendar_token',
          min: 16,
          max: 64,
        }),
      )
      app.save(users)
    }

    // Gerar token para qualquer usuário existente que não tenha calendar_token
    const existingUsers = app.findRecordsByFilter(
      '_pb_users_auth_',
      "calendar_token = '' || calendar_token = null",
      '-created',
      100,
      0,
    )
    for (let i = 0; i < existingUsers.length; i++) {
      const u = existingUsers[i]
      const token = $security.randomString(32)
      u.set('calendar_token', token)
      app.save(u)
    }
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const field = users.fields.getByName('calendar_token')
      if (field) {
        users.fields.remove(field)
        app.save(users)
      }
    } catch (_) {}
  },
)
