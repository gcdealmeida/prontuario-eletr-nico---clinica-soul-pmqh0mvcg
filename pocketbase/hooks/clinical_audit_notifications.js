/**
 * Hook para registro de auditoria clínica e notificações automáticas
 * Monitora:
 * - avaliacoes_fisioterapia
 * - avaliacoes_personal
 * - avaliacoes_nutricao
 * - avaliacoes_medico
 * - evolucoes
 * - pacientes (prontuário base)
 *
 * NOTA: Cada callback possui sua lógica inline para conformidade com a Goja JSVM do Skip Cloud.
 */

// 1. avaliacoes_fisioterapia - Create
onRecordCreateRequest((e) => {
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const st = rec.getString('status')
    const acao = st === 'Concluída' ? 'concluir' : 'criar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Fisioterapia'
    const detalhes = 'Avaliação de Fisioterapia (Status: ' + (st || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Nova Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'criou') +
              ' uma avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit fisio create: ' + err)
  }
}, 'avaliacoes_fisioterapia')

// 2. avaliacoes_fisioterapia - Update
onRecordUpdateRequest((e) => {
  const origStatus = e.record.original() ? e.record.original().getString('status') : ''
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const novoStatus = rec.getString('status')
    const acao = origStatus !== 'Concluída' && novoStatus === 'Concluída' ? 'concluir' : 'editar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Fisioterapia'
    const detalhes = 'Avaliação de Fisioterapia (Status: ' + (novoStatus || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Edição de Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'editou') +
              ' a avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit fisio update: ' + err)
  }
}, 'avaliacoes_fisioterapia')

// 3. avaliacoes_personal - Create
onRecordCreateRequest((e) => {
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const st = rec.getString('status')
    const acao = st === 'Concluída' ? 'concluir' : 'criar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Personal'
    const detalhes = 'Avaliação de Personal (Status: ' + (st || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Nova Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'criou') +
              ' uma avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit personal create: ' + err)
  }
}, 'avaliacoes_personal')

// 4. avaliacoes_personal - Update
onRecordUpdateRequest((e) => {
  const origStatus = e.record.original() ? e.record.original().getString('status') : ''
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const novoStatus = rec.getString('status')
    const acao = origStatus !== 'Concluída' && novoStatus === 'Concluída' ? 'concluir' : 'editar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Personal'
    const detalhes = 'Avaliação de Personal (Status: ' + (novoStatus || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Edição de Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'editou') +
              ' a avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit personal update: ' + err)
  }
}, 'avaliacoes_personal')

// 5. avaliacoes_nutricao - Create
onRecordCreateRequest((e) => {
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const st = rec.getString('status')
    const acao = st === 'Concluída' ? 'concluir' : 'criar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Nutrição'
    const detalhes = 'Avaliação de Nutrição (Status: ' + (st || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Nova Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'criou') +
              ' uma avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit nutricao create: ' + err)
  }
}, 'avaliacoes_nutricao')

// 6. avaliacoes_nutricao - Update
onRecordUpdateRequest((e) => {
  const origStatus = e.record.original() ? e.record.original().getString('status') : ''
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const novoStatus = rec.getString('status')
    const acao = origStatus !== 'Concluída' && novoStatus === 'Concluída' ? 'concluir' : 'editar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Nutrição'
    const detalhes = 'Avaliação de Nutrição (Status: ' + (novoStatus || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Edição de Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'editou') +
              ' a avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit nutricao update: ' + err)
  }
}, 'avaliacoes_nutricao')

// 7. avaliacoes_medico - Create
onRecordCreateRequest((e) => {
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const st = rec.getString('status')
    const acao = st === 'Concluída' ? 'concluir' : 'criar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Médico'
    const detalhes = 'Avaliação Médica (Status: ' + (st || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Nova Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'criou') +
              ' uma avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit medico create: ' + err)
  }
}, 'avaliacoes_medico')

// 8. avaliacoes_medico - Update
onRecordUpdateRequest((e) => {
  const origStatus = e.record.original() ? e.record.original().getString('status') : ''
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const novoStatus = rec.getString('status')
    const acao = origStatus !== 'Concluída' && novoStatus === 'Concluída' ? 'concluir' : 'editar'

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('profissional_responsavel') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = 'Médico'
    const detalhes = 'Avaliação Médica (Status: ' + (novoStatus || 'Rascunho') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'avaliacao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set(
            'titulo',
            (acao === 'concluir' ? 'Avaliação Concluída' : 'Edição de Avaliação') + ' - ' + esp,
          )
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'concluir' ? 'concluiu' : 'editou') +
              ' a avaliação de ' +
              esp +
              (pacienteNome ? ' do paciente ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/prontuarios/' + rec.id + '?esp=' + encodeURIComponent(esp))
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit medico update: ' + err)
  }
}, 'avaliacoes_medico')

// 9. evolucoes - Create
onRecordCreateRequest((e) => {
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const tipoEvo = rec.getString('tipo_evolucao')
    const isAssinado = rec.getBool('documento_fechado') || rec.getString('status') === 'Finalizada'

    let acao = 'criar'
    if (tipoEvo === 'Corretiva') {
      acao = 'evolucao_corretiva'
    } else if (isAssinado) {
      acao = 'assinar'
    }

    let userId = auth ? auth.id : rec.getString('assinado_por_user_id') || 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('assinado_por_nome') || rec.getString('profissional') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = rec.getString('especialidade') || 'Fisioterapia'
    const numReg = rec.getString('numero_registro') || ''
    const detalhes = 'Evolução (' + (tipoEvo || 'Rotina') + (numReg ? ' - ' + numReg : '') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'evolucao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          const titAcao =
            acao === 'assinar'
              ? 'Evolução Assinada'
              : acao === 'evolucao_corretiva'
                ? 'Evolução Corretiva'
                : 'Nova Evolução (Rascunho)'
          notif.set('titulo', titAcao + ' - ' + esp)
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'assinar'
                ? 'assinou a evolução ' + numReg
                : acao === 'evolucao_corretiva'
                  ? 'registrou uma evolução corretiva'
                  : 'criou uma evolução') +
              ' de ' +
              esp +
              (pacienteNome ? ' para ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          const avId = rec.getString('avaliacao_id')
          notif.set(
            'link',
            avId
              ? '/prontuarios/' + avId + '?esp=' + encodeURIComponent(esp) + '&tab=evolucoes'
              : pacienteId
                ? '/pacientes/' + pacienteId
                : '/prontuarios',
          )
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit evolucoes create: ' + err)
  }
}, 'evolucoes')

// 10. evolucoes - Update
onRecordUpdateRequest((e) => {
  const origFechado = e.record.original()
    ? e.record.original().getBool('documento_fechado') ||
      e.record.original().getString('status') === 'Finalizada'
    : false
  e.next()
  try {
    const rec = e.record
    const auth = e.auth
    const agoraFechado =
      rec.getBool('documento_fechado') || rec.getString('status') === 'Finalizada'
    const acao = !origFechado && agoraFechado ? 'assinar' : 'editar'

    let userId = auth ? auth.id : rec.getString('assinado_por_user_id') || 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth
      ? auth.getString('name') || userEmail
      : rec.getString('assinado_por_nome') || rec.getString('profissional') || 'Profissional SOUL'

    let pacienteId = rec.getString('paciente_id') || ''
    let pacienteNome = ''
    if (pacienteId) {
      try {
        const p = $app.findRecordById('pacientes', pacienteId)
        pacienteNome = p.getString('nome') || ''
      } catch (_) {}
    }

    const esp = rec.getString('especialidade') || 'Fisioterapia'
    const numReg = rec.getString('numero_registro') || ''
    const tipoEvo = rec.getString('tipo_evolucao') || 'Rotina'
    const detalhes = 'Evolução (' + tipoEvo + (numReg ? ' - ' + numReg : '') + ')'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', acao)
    logRec.set('tipo_entidade', 'evolucao')
    logRec.set('especialidade', esp)
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', pacienteId)
    logRec.set('paciente_nome', pacienteNome)
    logRec.set('detalhes', detalhes)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          const titAcao = acao === 'assinar' ? 'Evolução Assinada' : 'Edição de Evolução'
          notif.set('titulo', titAcao + ' - ' + esp)
          notif.set(
            'descricao',
            userName +
              ' (' +
              userEmail +
              ') ' +
              (acao === 'assinar'
                ? 'assinou e fechou a evolução ' + numReg
                : 'editou o rascunho de evolução') +
              ' de ' +
              esp +
              (pacienteNome ? ' para ' + pacienteNome : '') +
              '.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          const avId = rec.getString('avaliacao_id')
          notif.set(
            'link',
            avId
              ? '/prontuarios/' + avId + '?esp=' + encodeURIComponent(esp) + '&tab=evolucoes'
              : pacienteId
                ? '/pacientes/' + pacienteId
                : '/prontuarios',
          )
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit evolucoes update: ' + err)
  }
}, 'evolucoes')

// 11. pacientes (prontuário base) - Create
onRecordCreateRequest((e) => {
  e.next()
  try {
    const rec = e.record
    const auth = e.auth

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth ? auth.getString('name') || userEmail : 'Cadastro Externo / Recepção'

    const pacNome = rec.getString('nome') || 'Novo Paciente'
    const statusPac = rec.getString('status') || 'Ativo'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', 'criar')
    logRec.set('tipo_entidade', 'prontuario')
    logRec.set('especialidade', 'Geral')
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', rec.id)
    logRec.set('paciente_nome', pacNome)
    logRec.set('detalhes', 'Abertura de Prontuário / Cadastro de Paciente (' + statusPac + ')')
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set('titulo', 'Novo Prontuário Aberto')
          notif.set('descricao', userName + ' cadastrou o paciente ' + pacNome + ' no sistema.')
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/pacientes/' + rec.id)
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit paciente create: ' + err)
  }
}, 'pacientes')

// 12. pacientes (prontuário base) - Update
onRecordUpdateRequest((e) => {
  e.next()
  try {
    const rec = e.record
    const auth = e.auth

    let userId = auth ? auth.id : 'system'
    let userEmail = auth
      ? (auth.getString('email') || 'sistema@soul.com').toLowerCase().trim()
      : 'sistema@soul.com'
    let userName = auth ? auth.getString('name') || userEmail : 'Profissional SOUL'

    const pacNome = rec.getString('nome') || 'Paciente'

    const logRec = new Record($app.findCollectionByNameOrId('clinical_update_logs'))
    logRec.set('user_id', userId)
    logRec.set('user_name', userName)
    logRec.set('user_email', userEmail)
    logRec.set('acao', 'editar')
    logRec.set('tipo_entidade', 'prontuario')
    logRec.set('especialidade', 'Geral')
    logRec.set('entidade_id', rec.id)
    logRec.set('paciente_id', rec.id)
    logRec.set('paciente_nome', pacNome)
    logRec.set('detalhes', 'Atualização dos dados do prontuário do paciente ' + pacNome)
    $app.save(logRec)

    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm) {
          const notif = new Record($app.findCollectionByNameOrId('notifications'))
          notif.set('user_id', adm.id)
          notif.set('titulo', 'Prontuário Atualizado')
          notif.set('descricao', userName + ' atualizou dados do prontuário de ' + pacNome + '.')
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/pacientes/' + rec.id)
          $app.save(notif)
        }
      } catch (_) {}
    }
  } catch (err) {
    console.log('Erro audit paciente update: ' + err)
  }
}, 'pacientes')
