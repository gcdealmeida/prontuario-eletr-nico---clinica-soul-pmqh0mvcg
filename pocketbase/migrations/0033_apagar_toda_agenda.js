/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0033: Limpeza completa da agenda clínica (consultas manuais e sincronizadas do Google Agenda)
 * Solicitada e confirmada pelo administrador (gcdealmeida@gmail.com).
 * Remove todos os registros da coleção 'consultas' e as entradas do tipo 'Consulta' da 'timeline'.
 * Desativa auto_sync em 'google_calendar_syncs' e zera o contador events_count para evitar
 * que o cron ressuscite os eventos do Google logo após o reset, mantendo as URLs intactas.
 * Registra a ação em clinical_update_logs e notifications.
 */
migrate(
  (app) => {
    // 1. Contar registros usando app.countRecords
    let totalConsultas = 0
    let totalTimelineConsultas = 0
    let totalConsultasGoogle = 0

    try {
      totalConsultas = app.countRecords('consultas')
    } catch (_) {}

    try {
      totalConsultasGoogle = app.countRecords('consultas', "origem = 'google'")
    } catch (_) {}

    try {
      totalTimelineConsultas = app.countRecords('timeline', "tipo = 'Consulta'")
    } catch (_) {}

    const totalConsultasManuais = totalConsultas - totalConsultasGoogle

    console.log(
      '[Migração 0033] Registros identificados: ' +
        totalConsultas +
        ' consultas (' +
        totalConsultasGoogle +
        ' Google, ' +
        totalConsultasManuais +
        ' manuais), ' +
        totalTimelineConsultas +
        ' eventos de consulta na timeline.',
    )

    // 2. Apagar TODOS os registros da coleção consultas
    app.db().newQuery('DELETE FROM consultas').execute()

    // 3. Apagar registros de timeline relacionados a consultas (mantendo Avaliações e Notas)
    app.db().newQuery("DELETE FROM timeline WHERE tipo = 'Consulta'").execute()

    // 4. Pausar auto_sync em google_calendar_syncs e zerar events_count para respeitar o pedido de apagar tudo
    // Mantém ics_url, calendar_name e vínculo de usuário intactos para re-sincronização futura manual quando o usuário desejar.
    try {
      app
        .db()
        .newQuery(`
        UPDATE google_calendar_syncs 
        SET auto_sync = false, 
            events_count = 0,
            last_status = 'agenda_zerada',
            last_error = ''
      `)
        .execute()
    } catch (e) {
      console.log('[Migração 0033] Erro ao atualizar google_calendar_syncs: ' + e)
    }

    // 5. Localizar o usuário admin mestre (gcdealmeida@gmail.com)
    let adminUserId = ''
    let adminUserName = 'Dr. Guilherme (Admin)'
    let adminEmail = 'gcdealmeida@gmail.com'

    try {
      const adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'gcdealmeida@gmail.com')
      if (adminRecord) {
        adminUserId = adminRecord.id
        adminUserName = adminRecord.getString('name') || adminUserName
        adminEmail = adminRecord.getString('email') || adminEmail
      }
    } catch (_) {
      try {
        const anyAdmin = app.findFirstRecordByData('users', 'role', 'admin')
        if (anyAdmin) {
          adminUserId = anyAdmin.id
          adminUserName = anyAdmin.getString('name') || adminUserName
          adminEmail = anyAdmin.getString('email') || adminEmail
        }
      } catch (_) {}
    }

    // 6. Registrar entrada na auditoria clinical_update_logs
    try {
      const logsCol = app.findCollectionByNameOrId('clinical_update_logs')
      const logRecord = new Record(logsCol)
      logRecord.set('user_id', adminUserId || 'system')
      logRecord.set('user_name', adminUserName)
      logRecord.set('user_email', adminEmail)
      logRecord.set('acao', 'excluir')
      logRecord.set('tipo_entidade', 'prontuario')
      logRecord.set('especialidade', 'Geral')
      logRecord.set('entidade_id', 'agenda_completa')
      logRecord.set('paciente_id', '')
      logRecord.set('paciente_nome', 'Todas as Consultas / Agenda Geral')
      logRecord.set(
        'detalhes',
        'Agenda clínica zerada pelo administrador a pedido expresso do usuário. Total excluído: ' +
          totalConsultas +
          ' consultas (' +
          totalConsultasGoogle +
          ' Google Agenda, ' +
          totalConsultasManuais +
          ' manuais) e ' +
          totalTimelineConsultas +
          ' registros de consulta na timeline.',
      )
      app.save(logRecord)
    } catch (e) {
      console.log('[Migração 0033] Erro ao registrar log de auditoria: ' + e)
    }

    // 7. Registrar notificação para o administrador
    try {
      const notifCol = app.findCollectionByNameOrId('notifications')
      const notifRecord = new Record(notifCol)
      notifRecord.set('user_id', adminUserId || 'system')
      notifRecord.set('titulo', 'Agenda Clínica Zerada')
      notifRecord.set(
        'descricao',
        'A agenda completa foi zerada com sucesso. Foram removidos ' +
          totalConsultas +
          ' agendamentos (' +
          totalConsultasGoogle +
          ' do Google e ' +
          totalConsultasManuais +
          ' manuais). O vínculo do Google Agenda foi pausado para evitar reimportação automática imediata.',
      )
      notifRecord.set('tipo', 'system')
      notifRecord.set('lida', false)
      notifRecord.set('link', '/agenda')
      notifRecord.set(
        'metadata',
        JSON.stringify({
          consultas_removidas: totalConsultas,
          google_removidas: totalConsultasGoogle,
          manuais_removidas: totalConsultasManuais,
          timeline_removidas: totalTimelineConsultas,
          executado_em: new Date().toISOString(),
        }),
      )
      app.save(notifRecord)
    } catch (e) {
      console.log('[Migração 0033] Erro ao emitir notificação de sistema: ' + e)
    }

    console.log('[Migração 0033] Execução finalizada com sucesso. Coleção de consultas zerada.')
  },
  () => {
    // Reversão não recria registros apagados
  },
)
