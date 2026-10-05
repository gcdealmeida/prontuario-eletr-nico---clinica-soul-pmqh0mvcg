/**
 * Intercepta solicitações de autenticação (authWithPassword e authRefresh)
 * para:
 * 1. Validar se o usuário está 'pending' ou 'suspended'
 * 2. Se for pending, bloquear o login e registrar tentativa no access_logs
 * 3. Se for suspended, bloquear o login e registrar tentativa no access_logs
 * 4. Se for approved, atualizar last_login_at e registrar login_success
 */

onRecordAuthRequest((e) => {
  const user = e.record
  if (!user) {
    e.next()
    return
  }

  const email = (user.getString('email') || '').toLowerCase().trim()
  const isMasterAdmin = email === 'guivemax@hotmail.com'

  // Master admin é sempre aprovado
  if (isMasterAdmin) {
    if (user.getString('access_status') !== 'approved') {
      user.set('access_status', 'approved')
      user.set('role', 'admin')
      $app.save(user)
    }
  }

  const status = user.getString('access_status') || 'pending'

  // Verificar se o usuário está suspenso
  if (status === 'suspended') {
    try {
      const logsCol = $app.findCollectionByNameOrId('access_logs')
      const logRec = new Record(logsCol)
      logRec.set('user_id', user.id)
      logRec.set('user_email', email)
      logRec.set('user_name', user.getString('name') || '')
      logRec.set('action', 'login_blocked_suspended')
      logRec.set('actor_id', user.id)
      logRec.set('actor_email', email)
      logRec.set('details', 'Tentativa de login bloqueada: acesso suspenso pela administração.')
      $app.save(logRec)
    } catch (_) {}

    throw new ForbiddenError(
      'Seu acesso está suspenso pela administração da Clínica SOUL. Entre em contato com o responsável.',
    )
  }

  // Verificar se o usuário está pendente de aprovação
  if (status === 'pending') {
    try {
      const logsCol = $app.findCollectionByNameOrId('access_logs')
      const logRec = new Record(logsCol)
      logRec.set('user_id', user.id)
      logRec.set('user_email', email)
      logRec.set('user_name', user.getString('name') || '')
      logRec.set('action', 'login_blocked_pending')
      logRec.set('actor_id', user.id)
      logRec.set('actor_email', email)
      logRec.set(
        'details',
        'Tentativa de login bloqueada: conta aguardando aprovação da administração da clínica.',
      )
      $app.save(logRec)
    } catch (_) {}

    throw new ForbiddenError(
      'Sua conta aguarda aprovação da administração da clínica. Você será liberado assim que o acesso for autorizado.',
    )
  }

  // Se aprovado, atualizar last_login_at e registrar auditoria (somente em auth com senha para não poluir em refresh)
  try {
    const nowIso = new Date().toISOString()
    user.set('last_login_at', nowIso)
    $app.save(user)

    const logsCol = $app.findCollectionByNameOrId('access_logs')
    const logRec = new Record(logsCol)
    logRec.set('user_id', user.id)
    logRec.set('user_email', email)
    logRec.set('user_name', user.getString('name') || '')
    logRec.set('action', 'login_success')
    logRec.set('actor_id', user.id)
    logRec.set('actor_email', email)
    logRec.set('details', 'Login realizado com sucesso no Sistema SOUL.')
    $app.save(logRec)
  } catch (_) {}

  e.next()
}, 'users')
