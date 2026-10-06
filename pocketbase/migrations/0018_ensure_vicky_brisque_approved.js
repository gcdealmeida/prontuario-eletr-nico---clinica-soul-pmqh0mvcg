migrate(
  (app) => {
    const email = 'vicky.brisque@gmail.com'
    const name = 'Vicky Brisque'
    const especialidade = 'Fisioterapia'
    const role = 'professional'
    const accessStatus = 'approved'
    const password = 'Fisio@1234'
    const nowIso = new Date().toISOString()

    let record = null
    try {
      record = app.findAuthRecordByEmail('_pb_users_auth_', email)
    } catch (err) {
      console.log('Record not found by findAuthRecordByEmail: ' + err)
    }

    if (record) {
      record.setPassword(password)
      record.setVerified(true)
      record.set('name', name)
      record.set('role', role)
      record.set('access_status', accessStatus)
      record.set('especialidade', especialidade)
      record.set('approved_at', nowIso)
      record.set('approved_by', 'gcdealmeida@gmail.com')
      app.save(record)
      console.log('Vicky Brisque atualizada para access_status=approved com sucesso.')
    } else {
      console.log('Aviso: conta de Vicky Brisque não encontrada para aprovação.')
    }
  },
  (app) => {
    // Revert no-op
  },
)
