migrate(
  (app) => {
    // 1. Localizar a conta admin existente pelo e-mail guivemax@hotmail.com ou pelo id se já foi alterado
    let adminRecord = null
    try {
      adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'guivemax@hotmail.com')
    } catch (_) {
      try {
        adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'gcdealmeida@gmail.com')
      } catch (err) {
        console.log('Admin record not found by email: ' + err)
      }
    }

    if (adminRecord) {
      // Atualiza e-mail e senha utilizando os métodos nativos do PocketBase
      // setPassword gera o hash bcrypt seguro esperado pelo PocketBase
      adminRecord.setEmail('gcdealmeida@gmail.com')
      adminRecord.setPassword('Acesso@1234')
      adminRecord.setVerified(true)
      adminRecord.set('role', 'admin')
      adminRecord.set('access_status', 'approved')
      if (!adminRecord.getString('name')) {
        adminRecord.set('name', 'Dr. Guilherme (Admin)')
      }
      app.save(adminRecord)
      console.log('Admin master atualizado para gcdealmeida@gmail.com com sucesso.')
    } else {
      console.log('Aviso: conta admin não localizada para atualização.')
    }

    // 2. Atualizar regras de RLS da coleção users para referenciar o novo e-mail ou role='admin'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule =
      "id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    usersCol.viewRule =
      "id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    usersCol.updateRule =
      "id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    usersCol.deleteRule =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    app.save(usersCol)

    // 3. Atualizar regras de RLS da coleção access_logs
    try {
      const accessLogsCol = app.findCollectionByNameOrId('access_logs')
      accessLogsCol.listRule =
        "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      accessLogsCol.viewRule =
        "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      app.save(accessLogsCol)
    } catch (err) {
      console.log('access_logs collection not found: ' + err)
    }
  },
  (app) => {
    // Reverter para o e-mail anterior se necessário
    try {
      const adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'gcdealmeida@gmail.com')
      adminRecord.setEmail('guivemax@hotmail.com')
      adminRecord.setPassword('Skip@Pass')
      adminRecord.setVerified(true)
      adminRecord.set('role', 'admin')
      adminRecord.set('access_status', 'approved')
      app.save(adminRecord)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.listRule =
        "id = @request.auth.id || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      usersCol.viewRule =
        "id = @request.auth.id || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      usersCol.updateRule =
        "id = @request.auth.id || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      usersCol.deleteRule =
        "@request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      app.save(usersCol)
    } catch (_) {}

    try {
      const accessLogsCol = app.findCollectionByNameOrId('access_logs')
      accessLogsCol.listRule =
        "@request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      accessLogsCol.viewRule =
        "@request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      app.save(accessLogsCol)
    } catch (_) {}
  },
)
