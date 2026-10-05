/**
 * Endpoint de administração para gerenciar status de acesso de profissionais:
 * POST /backend/v1/admin/access/manage
 * Body: { target_user_id: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string }
 * Exclusivo para administradores (guivemax@hotmail.com ou role='admin').
 *
 * Ao aprovar:
 *   access_status = 'approved', approved_at = now, approved_by = admin_email
 *   Log de auditoria registrado
 * Ao recusar:
 *   access_status = 'suspended' (ou deleta conta conforme solicitado, aqui marcamos suspenso com nota recusado)
 *   Log de auditoria registrado
 * Ao suspender:
 *   access_status = 'suspended'
 *   Invalida o tokenKey do usuário para derrubar qualquer sessão ativa imediatamente!
 *   Log de auditoria registrado
 * Ao reativar:
 *   access_status = 'approved'
 *   Log de auditoria registrado
 */

routerAdd(
  'POST',
  '/backend/v1/admin/access/manage',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso negado: autenticação necessária.')
      }

      const authEmail = (authUser.getString('email') || '').toLowerCase().trim()
      const authRole = authUser.getString('role')
      const isMasterAdmin = authEmail === 'guivemax@hotmail.com'
      const isAdmin = isMasterAdmin || authRole === 'admin'

      if (!isAdmin) {
        return e.forbiddenError('Acesso restrito ao administrador da clínica.')
      }

      const body = e.requestInfo().body || {}
      const targetUserId = body.target_user_id
      const action = body.action // 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete'
      const reason = body.reason || ''

      if (!targetUserId || !action) {
        return e.json(400, { error: 'target_user_id e action são obrigatórios.' })
      }

      let targetUser
      try {
        targetUser = $app.findFirstRecordByData('users', 'id', targetUserId)
      } catch (_) {
        return e.json(404, { error: 'Usuário não encontrado.' })
      }

      const targetEmail = (targetUser.getString('email') || '').toLowerCase().trim()

      // Impede modificar ou suspender o administrador mestre
      if (
        targetEmail === 'guivemax@hotmail.com' &&
        (action === 'suspend' || action === 'reject' || action === 'delete')
      ) {
        return e.json(400, {
          error: 'Não é permitido suspender ou remover o administrador mestre da clínica.',
        })
      }

      const nowIso = new Date().toISOString()
      const logsCol = $app.findCollectionByNameOrId('access_logs')
      const logRec = new Record(logsCol)
      logRec.set('user_id', targetUser.id)
      logRec.set('user_email', targetEmail)
      logRec.set('user_name', targetUser.getString('name') || '')
      logRec.set('actor_id', authUser.id)
      logRec.set('actor_email', authEmail)

      if (action === 'approve') {
        targetUser.set('access_status', 'approved')
        targetUser.set('approved_at', nowIso)
        targetUser.set('approved_by', authEmail)
        $app.save(targetUser)

        logRec.set('action', 'access_approved')
        logRec.set(
          'details',
          'Acesso profissional aprovado por ' + authEmail + (reason ? ': ' + reason : ''),
        )
        $app.save(logRec)

        return e.json(200, {
          success: true,
          message: 'Acesso do usuário ' + targetEmail + ' aprovado com sucesso.',
          access_status: 'approved',
        })
      }

      if (action === 'reactivate') {
        targetUser.set('access_status', 'approved')
        targetUser.set('approved_at', nowIso)
        targetUser.set('approved_by', authEmail)
        $app.save(targetUser)

        logRec.set('action', 'access_reactivated')
        logRec.set('details', 'Acesso reativado por ' + authEmail + (reason ? ': ' + reason : ''))
        $app.save(logRec)

        return e.json(200, {
          success: true,
          message: 'Acesso do usuário ' + targetEmail + ' reativado.',
          access_status: 'approved',
        })
      }

      if (action === 'suspend') {
        targetUser.set('access_status', 'suspended')
        // Invalida sessões ativas imediatamente alterando tokenKey
        targetUser.set('tokenKey', $security.randomString(30))
        $app.save(targetUser)

        logRec.set('action', 'access_suspended')
        logRec.set('details', 'Acesso suspenso por ' + authEmail + (reason ? ': ' + reason : ''))
        $app.save(logRec)

        return e.json(200, {
          success: true,
          message: 'Acesso suspenso e sessões ativas do usuário invalidadas.',
          access_status: 'suspended',
        })
      }

      if (action === 'reject') {
        targetUser.set('access_status', 'suspended')
        targetUser.set('tokenKey', $security.randomString(30))
        $app.save(targetUser)

        logRec.set('action', 'access_rejected')
        logRec.set(
          'details',
          'Solicitação de acesso recusada por ' + authEmail + (reason ? ': ' + reason : ''),
        )
        $app.save(logRec)

        return e.json(200, {
          success: true,
          message: 'Solicitação recusada com sucesso.',
          access_status: 'suspended',
        })
      }

      if (action === 'delete') {
        logRec.set('action', 'access_rejected')
        logRec.set(
          'details',
          'Usuário e solicitação de acesso excluídos definitivamente por ' + authEmail,
        )
        $app.save(logRec)

        $app.delete(targetUser)

        return e.json(200, {
          success: true,
          message: 'Usuário removido do sistema.',
        })
      }

      return e.json(400, { error: 'Ação desconhecida: ' + action })
    } catch (err) {
      console.log('Erro em admin/access/manage:', err)
      return e.json(500, { error: err?.message || 'Falha ao processar solicitação de acesso' })
    }
  },
  $apis.requireAuth(),
)
