/**
 * Endpoint para Ativação de Cadastro de Paciente
 * Rota: POST /backend/v1/admin/pacientes/ativar
 *
 * Regras:
 * 1. Muda status do paciente de 'Pré-cadastro' para 'Ativo'.
 * 2. Registra na auditoria (clinical_update_logs) quem ativou e quando.
 * 3. Cria evento na timeline do paciente.
 * 4. Notifica administradores sobre a ativação.
 * 5. Retorna o paciente atualizado para abertura imediata do prontuário no front.
 */

routerAdd('POST', '/backend/v1/admin/pacientes/ativar', (e) => {
  try {
    const authRecord = e.auth
    const reqInfo = e.requestInfo()
    const body = reqInfo.body || {}

    const pacienteId = String(body.paciente_id || '').trim()
    if (!pacienteId) {
      return e.json(400, { error: 'O ID do paciente é obrigatório.' })
    }

    let paciente = null
    try {
      paciente = $app.findRecordById('pacientes', pacienteId)
    } catch (_) {
      return e.json(404, { error: 'Paciente não encontrado.' })
    }

    const statusAtual = paciente.getString('status')
    const nomePaciente = paciente.getString('nome') || 'Paciente'

    // Determina profissional atuante
    let userId = 'system'
    let userName = 'Terapeuta / Equipe SOUL'
    let userEmail = 'gcdealmeida@gmail.com'

    if (authRecord) {
      userId = authRecord.id
      userName = authRecord.getString('name') || authRecord.getString('email') || userName
      userEmail = authRecord.getString('email') || userEmail
    } else {
      try {
        const masterRec = $app.findAuthRecordByEmail('_pb_users_auth_', 'gcdealmeida@gmail.com')
        if (masterRec) {
          userId = masterRec.id
          userName = masterRec.getString('name') || 'Dr. Guilherme (Admin)'
          userEmail = masterRec.getString('email') || userEmail
        }
      } catch (_) {}
    }

    // Se estiver em pré-cadastro (ou qualquer outro status inativo), ativa
    paciente.set('status', 'Ativo')
    $app.save(paciente)

    // Log de auditoria clínica
    try {
      const logCol = $app.findCollectionByNameOrId('clinical_update_logs')
      const logRec = new Record(logCol)
      logRec.set('user_id', userId)
      logRec.set('user_name', userName)
      logRec.set('user_email', userEmail)
      logRec.set('acao', 'ativar_cadastro')
      logRec.set('tipo_entidade', 'paciente')
      logRec.set('especialidade', 'Geral')
      logRec.set('entidade_id', pacienteId)
      logRec.set('paciente_id', pacienteId)
      logRec.set('paciente_nome', nomePaciente)
      logRec.set(
        'detalhes',
        'Cadastro do paciente ativado com sucesso por ' +
          userName +
          ' (' +
          userEmail +
          '). Status anterior: "' +
          statusAtual +
          '" → Status novo: "Ativo". Prontuário liberado para início imediato da avaliação clínica.',
      )
      $app.save(logRec)
    } catch (logErr) {
      console.log('Erro ao gravar log de auditoria de ativação:', logErr)
    }

    // Evento na timeline do paciente
    try {
      const timeCol = $app.findCollectionByNameOrId('timeline')
      const timeRec = new Record(timeCol)
      timeRec.set('paciente_id', pacienteId)
      timeRec.set('tipo', 'Outro')
      timeRec.set('especialidade', 'Geral')
      timeRec.set('titulo', 'Cadastro ativado pelo profissional')
      timeRec.set(
        'conteudo',
        'O cadastro do paciente foi aprovado e ativado por ' +
          userName +
          '. O prontuário e avaliações clínicas foram liberados para condução do tratamento.',
      )
      timeRec.set('data_evento', new Date().toISOString())
      $app.save(timeRec)
    } catch (timeErr) {
      console.log('Erro ao salvar timeline na ativação:', timeErr)
    }

    // Notificação
    const admins = ['gcdealmeida@gmail.com', 'guivemax@hotmail.com']
    for (let i = 0; i < admins.length; i++) {
      try {
        const adm = $app.findAuthRecordByEmail('_pb_users_auth_', admins[i])
        if (adm && adm.id !== userId) {
          const notifCol = $app.findCollectionByNameOrId('notifications')
          const notif = new Record(notifCol)
          notif.set('user_id', adm.id)
          notif.set('titulo', 'Cadastro Ativado')
          notif.set(
            'descricao',
            userName +
              ' ativou o cadastro de "' +
              nomePaciente +
              '" e abriu o fluxo de prontuário.',
          )
          notif.set('tipo', 'clinical_update')
          notif.set('lida', false)
          notif.set('link', '/pacientes/' + pacienteId)
          $app.save(notif)
        }
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      message: 'Cadastro de "' + nomePaciente + '" ativado com sucesso!',
      paciente: {
        id: paciente.id,
        nome: nomePaciente,
        status: 'Ativo',
      },
    })
  } catch (err) {
    console.log('Erro ao ativar paciente:', err)
    return e.json(500, { error: err?.message || 'Falha ao ativar cadastro do paciente.' })
  }
})
