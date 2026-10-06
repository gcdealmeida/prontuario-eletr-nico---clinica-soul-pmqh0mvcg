migrate(
  (app) => {
    const email = 'vicky.brisque@gmail.com'
    const name = 'Vicky Brisque'
    const especialidade = 'Fisioterapia'
    const role = 'professional'
    const accessStatus = 'approved'
    const password = 'Fisio@1234'
    const nowIso = new Date().toISOString()

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    let record = null
    try {
      record = app.findAuthRecordByEmail('_pb_users_auth_', email)
    } catch (_) {
      // Registro não existe ainda
      record = new Record(usersCol)
    }

    record.setEmail(email)
    record.setPassword(password)
    record.setVerified(true)
    record.set('name', name)
    record.set('role', role)
    record.set('access_status', accessStatus)
    record.set('especialidade', especialidade)
    record.set('approved_at', nowIso)
    record.set('approved_by', 'gcdealmeida@gmail.com')

    app.save(record)
    console.log(
      'Profissional Vicky Brisque configurada com sucesso com perfil restrito de Fisioterapia.',
    )

    // Registrar log de auditoria em access_logs
    try {
      const logsCol = app.findCollectionByNameOrId('access_logs')
      const logRec = new Record(logsCol)
      logRec.set('user_id', record.id)
      logRec.set('user_email', email)
      logRec.set('user_name', name)
      logRec.set('action', 'access_approved')
      logRec.set('actor_id', record.id)
      logRec.set('actor_email', 'gcdealmeida@gmail.com')
      logRec.set(
        'details',
        'Conta profissional de Fisioterapia provisionada e aprovada pelo administrador gcdealmeida@gmail.com.',
      )
      app.save(logRec)
    } catch (err) {
      console.log('Aviso ao registrar log de auditoria: ' + err)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'vicky.brisque@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
