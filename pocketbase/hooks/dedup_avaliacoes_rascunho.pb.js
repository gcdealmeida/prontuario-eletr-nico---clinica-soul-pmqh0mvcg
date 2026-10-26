/**
 * Hook de deduplicação idempotente de rascunhos de avaliação.
 *
 * Registra onRecordCreateRequest em cada coleção de avaliação:
 * - avaliacoes_fisioterapia
 * - avaliacoes_personal
 * - avaliacoes_nutricao
 * - avaliacoes_medico
 *
 * Toda lógica e declarações de variáveis são mantidas estritamente inline dentro
 * de cada callback para conformidade com a Goja JSVM do Skip Cloud.
 */

// 1. avaliacoes_fisioterapia
onRecordCreateRequest((e) => {
  const rec = e.record
  if (!rec) {
    e.next()
    return
  }

  const pacienteId = rec.getString('paciente_id')
  const status = rec.getString('status') || 'Rascunho'

  if (status !== 'Rascunho' || !pacienteId) {
    e.next()
    return
  }

  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ')
  const collectionName = 'avaliacoes_fisioterapia'

  try {
    const query = $app
      .db()
      .newQuery(
        'SELECT id FROM ' +
          collectionName +
          " WHERE paciente_id = {:pacienteId} AND status = 'Rascunho' AND updated >= {:cutoff} ORDER BY updated DESC LIMIT 1",
      )
    query.bind({ pacienteId: pacienteId, cutoff: cutoffDate })

    const existingRows = []
    query.all(existingRows)

    if (existingRows && existingRows.length > 0 && existingRows[0].id) {
      const existingId = existingRows[0].id
      console.log(
        '[DEDUPLICAÇÃO ATIVA] ' +
          collectionName +
          ': Rascunho existente encontrado (' +
          existingId +
          ') para paciente ' +
          pacienteId +
          '. Atualizando em vez de criar duplicata.',
      )

      const existingRecord = $app.findRecordById(collectionName, existingId)
      if (existingRecord) {
        const fileFields = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
        const fields = e.collection.fields
        for (let f = 0; f < fields.length; f++) {
          const fieldName = fields[f].name
          if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') {
            continue
          }

          if (fileFields.indexOf(fieldName) >= 0) {
            const newFileVal = rec.get(fieldName)
            if (!newFileVal || (Array.isArray(newFileVal) && newFileVal.length === 0)) {
              continue
            }
          }

          if (
            fieldName === 'resumos_anexos' ||
            fieldName === 'anamnese_detalhada' ||
            fieldName === 'habitos_saude'
          ) {
            try {
              const oldRaw = existingRecord.getString(fieldName)
              const newRaw = rec.getString(fieldName)
              if (newRaw && newRaw !== 'null' && newRaw !== '{}') {
                const newObj = JSON.parse(newRaw)
                let oldObj = {}
                if (oldRaw && oldRaw !== 'null') {
                  try {
                    oldObj = JSON.parse(oldRaw)
                  } catch (_) {}
                }
                const merged = Object.assign({}, oldObj, newObj)
                existingRecord.set(fieldName, merged)
                continue
              }
            } catch (_) {}
          }

          const newVal = rec.get(fieldName)
          if (newVal !== undefined && newVal !== null && newVal !== '') {
            existingRecord.set(fieldName, newVal)
          }
        }

        $app.save(existingRecord)

        try {
          const auth = e.auth
          const userId = auth ? auth.id : 'system'
          const userEmail = auth
            ? auth.getString('email') || 'sistema@soul.com'
            : 'sistema@soul.com'
          const userName = auth ? auth.getString('name') || userEmail : 'Profissional SOUL'

          let pacienteNome = ''
          try {
            const p = $app.findRecordById('pacientes', pacienteId)
            pacienteNome = p.getString('nome') || ''
          } catch (_) {}

          const logCol = $app.findCollectionByNameOrId('clinical_update_logs')
          if (logCol) {
            const logRec = new Record(logCol)
            logRec.set('user_id', userId)
            logRec.set('user_name', userName)
            logRec.set('user_email', userEmail)
            logRec.set('acao', 'editar')
            logRec.set('tipo_entidade', 'avaliacao')
            logRec.set('especialidade', 'Fisioterapia')
            logRec.set('entidade_id', existingId)
            logRec.set('paciente_id', pacienteId)
            logRec.set('paciente_nome', pacienteNome)
            logRec.set(
              'detalhes',
              'Deduplicação automática no servidor: requisição de criação convertida em atualização do rascunho existente (' +
                existingId +
                ') para evitar duplicidade.',
            )
            $app.save(logRec)
          }
        } catch (logErr) {
          console.log('Erro ao registrar log de deduplicação fisio: ' + logErr)
        }

        return e.json(200, existingRecord)
      }
    }
  } catch (errDedup) {
    console.log('[DEDUPLICAÇÃO ERRO fisio] ' + errDedup)
  }

  e.next()
}, 'avaliacoes_fisioterapia')

// 2. avaliacoes_personal
onRecordCreateRequest((e) => {
  const rec = e.record
  if (!rec) {
    e.next()
    return
  }

  const pacienteId = rec.getString('paciente_id')
  const status = rec.getString('status') || 'Rascunho'

  if (status !== 'Rascunho' || !pacienteId) {
    e.next()
    return
  }

  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ')
  const collectionName = 'avaliacoes_personal'

  try {
    const query = $app
      .db()
      .newQuery(
        'SELECT id FROM ' +
          collectionName +
          " WHERE paciente_id = {:pacienteId} AND status = 'Rascunho' AND updated >= {:cutoff} ORDER BY updated DESC LIMIT 1",
      )
    query.bind({ pacienteId: pacienteId, cutoff: cutoffDate })

    const existingRows = []
    query.all(existingRows)

    if (existingRows && existingRows.length > 0 && existingRows[0].id) {
      const existingId = existingRows[0].id
      console.log(
        '[DEDUPLICAÇÃO ATIVA] ' +
          collectionName +
          ': Rascunho existente encontrado (' +
          existingId +
          ') para paciente ' +
          pacienteId +
          '. Atualizando em vez de criar duplicata.',
      )

      const existingRecord = $app.findRecordById(collectionName, existingId)
      if (existingRecord) {
        const fileFields = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
        const fields = e.collection.fields
        for (let f = 0; f < fields.length; f++) {
          const fieldName = fields[f].name
          if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') {
            continue
          }

          if (fileFields.indexOf(fieldName) >= 0) {
            const newFileVal = rec.get(fieldName)
            if (!newFileVal || (Array.isArray(newFileVal) && newFileVal.length === 0)) {
              continue
            }
          }

          if (
            fieldName === 'resumos_anexos' ||
            fieldName === 'composicao_corporal' ||
            fieldName === 'ia_plano_treino'
          ) {
            try {
              const oldRaw = existingRecord.getString(fieldName)
              const newRaw = rec.getString(fieldName)
              if (newRaw && newRaw !== 'null' && newRaw !== '{}') {
                const newObj = JSON.parse(newRaw)
                let oldObj = {}
                if (oldRaw && oldRaw !== 'null') {
                  try {
                    oldObj = JSON.parse(oldRaw)
                  } catch (_) {}
                }
                const merged = Object.assign({}, oldObj, newObj)
                existingRecord.set(fieldName, merged)
                continue
              }
            } catch (_) {}
          }

          const newVal = rec.get(fieldName)
          if (newVal !== undefined && newVal !== null && newVal !== '') {
            existingRecord.set(fieldName, newVal)
          }
        }

        $app.save(existingRecord)

        try {
          const auth = e.auth
          const userId = auth ? auth.id : 'system'
          const userEmail = auth
            ? auth.getString('email') || 'sistema@soul.com'
            : 'sistema@soul.com'
          const userName = auth ? auth.getString('name') || userEmail : 'Profissional SOUL'

          let pacienteNome = ''
          try {
            const p = $app.findRecordById('pacientes', pacienteId)
            pacienteNome = p.getString('nome') || ''
          } catch (_) {}

          const logCol = $app.findCollectionByNameOrId('clinical_update_logs')
          if (logCol) {
            const logRec = new Record(logCol)
            logRec.set('user_id', userId)
            logRec.set('user_name', userName)
            logRec.set('user_email', userEmail)
            logRec.set('acao', 'editar')
            logRec.set('tipo_entidade', 'avaliacao')
            logRec.set('especialidade', 'Personal')
            logRec.set('entidade_id', existingId)
            logRec.set('paciente_id', pacienteId)
            logRec.set('paciente_nome', pacienteNome)
            logRec.set(
              'detalhes',
              'Deduplicação automática no servidor: requisição de criação convertida em atualização do rascunho existente (' +
                existingId +
                ') para evitar duplicidade.',
            )
            $app.save(logRec)
          }
        } catch (logErr) {
          console.log('Erro ao registrar log de deduplicação personal: ' + logErr)
        }

        return e.json(200, existingRecord)
      }
    }
  } catch (errDedup) {
    console.log('[DEDUPLICAÇÃO ERRO personal] ' + errDedup)
  }

  e.next()
}, 'avaliacoes_personal')

// 3. avaliacoes_nutricao
onRecordCreateRequest((e) => {
  const rec = e.record
  if (!rec) {
    e.next()
    return
  }

  const pacienteId = rec.getString('paciente_id')
  const status = rec.getString('status') || 'Rascunho'

  if (status !== 'Rascunho' || !pacienteId) {
    e.next()
    return
  }

  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ')
  const collectionName = 'avaliacoes_nutricao'

  try {
    const query = $app
      .db()
      .newQuery(
        'SELECT id FROM ' +
          collectionName +
          " WHERE paciente_id = {:pacienteId} AND status = 'Rascunho' AND updated >= {:cutoff} ORDER BY updated DESC LIMIT 1",
      )
    query.bind({ pacienteId: pacienteId, cutoff: cutoffDate })

    const existingRows = []
    query.all(existingRows)

    if (existingRows && existingRows.length > 0 && existingRows[0].id) {
      const existingId = existingRows[0].id
      console.log(
        '[DEDUPLICAÇÃO ATIVA] ' +
          collectionName +
          ': Rascunho existente encontrado (' +
          existingId +
          ') para paciente ' +
          pacienteId +
          '. Atualizando em vez de criar duplicata.',
      )

      const existingRecord = $app.findRecordById(collectionName, existingId)
      if (existingRecord) {
        const fileFields = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
        const fields = e.collection.fields
        for (let f = 0; f < fields.length; f++) {
          const fieldName = fields[f].name
          if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') {
            continue
          }

          if (fileFields.indexOf(fieldName) >= 0) {
            const newFileVal = rec.get(fieldName)
            if (!newFileVal || (Array.isArray(newFileVal) && newFileVal.length === 0)) {
              continue
            }
          }

          const newVal = rec.get(fieldName)
          if (newVal !== undefined && newVal !== null && newVal !== '') {
            existingRecord.set(fieldName, newVal)
          }
        }

        $app.save(existingRecord)

        try {
          const auth = e.auth
          const userId = auth ? auth.id : 'system'
          const userEmail = auth
            ? auth.getString('email') || 'sistema@soul.com'
            : 'sistema@soul.com'
          const userName = auth ? auth.getString('name') || userEmail : 'Profissional SOUL'

          let pacienteNome = ''
          try {
            const p = $app.findRecordById('pacientes', pacienteId)
            pacienteNome = p.getString('nome') || ''
          } catch (_) {}

          const logCol = $app.findCollectionByNameOrId('clinical_update_logs')
          if (logCol) {
            const logRec = new Record(logCol)
            logRec.set('user_id', userId)
            logRec.set('user_name', userName)
            logRec.set('user_email', userEmail)
            logRec.set('acao', 'editar')
            logRec.set('tipo_entidade', 'avaliacao')
            logRec.set('especialidade', 'Nutrição')
            logRec.set('entidade_id', existingId)
            logRec.set('paciente_id', pacienteId)
            logRec.set('paciente_nome', pacienteNome)
            logRec.set(
              'detalhes',
              'Deduplicação automática no servidor: requisição de criação convertida em atualização do rascunho existente (' +
                existingId +
                ') para evitar duplicidade.',
            )
            $app.save(logRec)
          }
        } catch (logErr) {
          console.log('Erro ao registrar log de deduplicação nutricao: ' + logErr)
        }

        return e.json(200, existingRecord)
      }
    }
  } catch (errDedup) {
    console.log('[DEDUPLICAÇÃO ERRO nutricao] ' + errDedup)
  }

  e.next()
}, 'avaliacoes_nutricao')

// 4. avaliacoes_medico
onRecordCreateRequest((e) => {
  const rec = e.record
  if (!rec) {
    e.next()
    return
  }

  const pacienteId = rec.getString('paciente_id')
  const status = rec.getString('status') || 'Rascunho'

  if (status !== 'Rascunho' || !pacienteId) {
    e.next()
    return
  }

  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ')
  const collectionName = 'avaliacoes_medico'

  try {
    const query = $app
      .db()
      .newQuery(
        'SELECT id FROM ' +
          collectionName +
          " WHERE paciente_id = {:pacienteId} AND status = 'Rascunho' AND updated >= {:cutoff} ORDER BY updated DESC LIMIT 1",
      )
    query.bind({ pacienteId: pacienteId, cutoff: cutoffDate })

    const existingRows = []
    query.all(existingRows)

    if (existingRows && existingRows.length > 0 && existingRows[0].id) {
      const existingId = existingRows[0].id
      console.log(
        '[DEDUPLICAÇÃO ATIVA] ' +
          collectionName +
          ': Rascunho existente encontrado (' +
          existingId +
          ') para paciente ' +
          pacienteId +
          '. Atualizando em vez de criar duplicata.',
      )

      const existingRecord = $app.findRecordById(collectionName, existingId)
      if (existingRecord) {
        const fileFields = ['anexos_exames', 'anexos_dinamometro', 'anexos_postura']
        const fields = e.collection.fields
        for (let f = 0; f < fields.length; f++) {
          const fieldName = fields[f].name
          if (fieldName === 'id' || fieldName === 'created' || fieldName === 'updated') {
            continue
          }

          if (fileFields.indexOf(fieldName) >= 0) {
            const newFileVal = rec.get(fieldName)
            if (!newFileVal || (Array.isArray(newFileVal) && newFileVal.length === 0)) {
              continue
            }
          }

          const newVal = rec.get(fieldName)
          if (newVal !== undefined && newVal !== null && newVal !== '') {
            existingRecord.set(fieldName, newVal)
          }
        }

        $app.save(existingRecord)

        try {
          const auth = e.auth
          const userId = auth ? auth.id : 'system'
          const userEmail = auth
            ? auth.getString('email') || 'sistema@soul.com'
            : 'sistema@soul.com'
          const userName = auth ? auth.getString('name') || userEmail : 'Profissional SOUL'

          let pacienteNome = ''
          try {
            const p = $app.findRecordById('pacientes', pacienteId)
            pacienteNome = p.getString('nome') || ''
          } catch (_) {}

          const logCol = $app.findCollectionByNameOrId('clinical_update_logs')
          if (logCol) {
            const logRec = new Record(logCol)
            logRec.set('user_id', userId)
            logRec.set('user_name', userName)
            logRec.set('user_email', userEmail)
            logRec.set('acao', 'editar')
            logRec.set('tipo_entidade', 'avaliacao')
            logRec.set('especialidade', 'Médico')
            logRec.set('entidade_id', existingId)
            logRec.set('paciente_id', pacienteId)
            logRec.set('paciente_nome', pacienteNome)
            logRec.set(
              'detalhes',
              'Deduplicação automática no servidor: requisição de criação convertida em atualização do rascunho existente (' +
                existingId +
                ') para evitar duplicidade.',
            )
            $app.save(logRec)
          }
        } catch (logErr) {
          console.log('Erro ao registrar log de deduplicação medico: ' + logErr)
        }

        return e.json(200, existingRecord)
      }
    }
  } catch (errDedup) {
    console.log('[DEDUPLICAÇÃO ERRO medico] ' + errDedup)
  }

  e.next()
}, 'avaliacoes_medico')
