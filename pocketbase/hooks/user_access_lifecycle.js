/**
 * Hook do ciclo de vida de usuários para o controle de Acesso Profissional SOUL:
 * 1. Ao criar conta (signup):
 *    - Se for guivemax@hotmail.com: aprovado e admin imediatamente.
 *    - Se for qualquer outro: define access_status = 'pending', role = 'professional', requested_at = now.
 *    - Registra log de auditoria 'signup_requested'.
 * 2. Bloqueia criação direta se o usuário tentar passar access_status = 'approved' sem ser admin.
 */

onRecordCreate((e) => {
  const email = (e.record.getString('email') || '').toLowerCase().trim()

  if (email === 'guivemax@hotmail.com') {
    e.record.set('access_status', 'approved')
    e.record.set('role', 'admin')
    e.record.set('approved_at', new Date().toISOString())
    e.record.set('approved_by', 'system_admin_rule')
  } else {
    // Novos cadastros sempre entram como pendentes
    e.record.set('access_status', 'pending')
    if (!e.record.getString('role')) {
      e.record.set('role', 'professional')
    }
    const nowIso = new Date().toISOString()
    e.record.set('requested_at', nowIso)
  }

  e.next()
}, 'users')

onRecordAfterCreateSuccess((e) => {
  try {
    const user = e.record
    const email = (user.getString('email') || '').toLowerCase().trim()
    const isMasterAdmin = email === 'guivemax@hotmail.com'

    const logsCol = $app.findCollectionByNameOrId('access_logs')
    const logRec = new Record(logsCol)
    logRec.set('user_id', user.id)
    logRec.set('user_email', email)
    logRec.set('user_name', user.getString('name') || '')
    logRec.set('action', isMasterAdmin ? 'access_approved' : 'signup_requested')
    logRec.set('actor_id', user.id)
    logRec.set('actor_email', email)
    logRec.set(
      'details',
      isMasterAdmin
        ? 'Conta do administrador mestre criada e aprovada automaticamente.'
        : 'Nova solicitação de acesso profissional enviada para aprovação do administrador.',
    )
    $app.save(logRec)
  } catch (err) {
    console.log('Erro ao criar access_log onRecordAfterCreateSuccess:', err)
  }

  e.next()
}, 'users')
