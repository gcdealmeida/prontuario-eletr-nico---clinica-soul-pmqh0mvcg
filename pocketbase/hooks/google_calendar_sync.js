/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de importação e sincronização com Google Calendar via endereço secreto .ics (iCal)
 * Oferece:
 * 1. POST /api/google-calendar/sync (requer auth do usuário logado)
 * 2. POST /api/google-calendar/save-and-sync (salva ou atualiza a ics_url e executa sync imediato)
 * 3. cronAdd("google_calendar_sync_all", "@every 15m") para sincronizar automaticamente todos os usuários com URL configurada
 *
 * NOTA IMPORTANTE VM POCKETBASE:
 * Toda a lógica de parse e persistência está inline dentro de cada callback ou replicada conforme regras do runtime goja.
 */

// 1. Rota de Salvar e Sincronizar
routerAdd(
  'POST',
  '/backend/v1/google-calendar/save-and-sync',
  (e) => {
    const auth = e.auth
    if (!auth || !auth.id) {
      return e.json(401, { error: 'Não autorizado' })
    }

    const userId = auth.id
    let body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }

    const rawUrl = (body.ics_url || '').trim()
    if (!rawUrl) {
      return e.json(400, { error: 'Endereço iCal (.ics) é obrigatório' })
    }

    // Validação básica da URL do Google Calendar
    if (
      !rawUrl.startsWith('http://') &&
      !rawUrl.startsWith('https://') &&
      !rawUrl.startsWith('webcal://')
    ) {
      return e.json(400, {
        error: 'URL inválida. O link deve começar com https:// ou webcal://',
      })
    }

    // Converter webcal:// para https://
    let normalizedUrl = rawUrl
    if (normalizedUrl.startsWith('webcal://')) {
      normalizedUrl = 'https://' + normalizedUrl.slice(9)
    }

    // Salvar ou atualizar na coleção google_calendar_syncs
    let syncRecord = null
    try {
      syncRecord = $app.findFirstRecordByData('google_calendar_syncs', 'user_id', userId)
    } catch (_) {}

    if (!syncRecord) {
      const syncCol = $app.findCollectionByNameOrId('google_calendar_syncs')
      syncRecord = new Record(syncCol)
      syncRecord.set('user_id', userId)
    }

    syncRecord.set('ics_url', normalizedUrl)
    if (body.calendar_name) {
      syncRecord.set('calendar_name', body.calendar_name)
    }
    syncRecord.set('auto_sync', body.auto_sync !== false)
    syncRecord.set('last_status', 'pending')
    $app.save(syncRecord)

    // Executar sincronização imediata
    try {
      // 1. Localizar paciente "Google Agenda"
      let pacienteId = ''
      try {
        const p = $app.findFirstRecordByData('pacientes', 'nome', 'Google Agenda')
        if (p) pacienteId = p.id
      } catch (_) {}

      if (!pacienteId) {
        const pCol = $app.findCollectionByNameOrId('pacientes')
        const newP = new Record(pCol)
        newP.set('nome', 'Google Agenda')
        newP.set('status', 'Ativo')
        newP.set('observacoes', 'Sistema - Alocação externa de eventos Google')
        $app.save(newP)
        pacienteId = newP.id
      }

      // 2. Download do arquivo .ics
      const res = $http.send({
        url: normalizedUrl,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SistemaSOUL/1.0; +https://clinicasoul.com.br)',
          Accept: 'text/calendar, text/plain, */*',
        },
        timeout: 25,
      })

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errMsg = 'Falha ao baixar calendário do Google. Código HTTP: ' + res.statusCode
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
        return e.json(400, { error: errMsg })
      }

      const icsText = res.raw || ''
      if (!icsText || icsText.indexOf('BEGIN:VCALENDAR') === -1) {
        const errMsg = 'A URL fornecida não retornou um arquivo iCalendar (.ics) válido.'
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
        return e.json(400, { error: errMsg })
      }

      // 3. Parser de VEVENTs (desdobramento de linhas RFC 5545)
      // Linhas continuadas começam com espaço ou tab
      const rawLines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
      const unfoldedLines = []
      for (let i = 0; i < rawLines.length; i++) {
        const cur = rawLines[i]
        if ((cur.startsWith(' ') || cur.startsWith('\t')) && unfoldedLines.length > 0) {
          unfoldedLines[unfoldedLines.length - 1] += cur.substring(1)
        } else {
          unfoldedLines.push(cur)
        }
      }

      // Extrair nome do calendário se presente
      let calNameFromIcs = ''
      for (let i = 0; i < unfoldedLines.length; i++) {
        const line = unfoldedLines[i]
        if (line.startsWith('X-WR-CALNAME:')) {
          calNameFromIcs = line.substring(13).trim()
          break
        }
      }
      if (calNameFromIcs && !syncRecord.getString('calendar_name')) {
        syncRecord.set('calendar_name', calNameFromIcs)
      }

      // Extrair blocos VEVENT
      const events = []
      let inEvent = false
      let currentEvent = null

      for (let i = 0; i < unfoldedLines.length; i++) {
        const line = unfoldedLines[i].trim()
        if (line === 'BEGIN:VEVENT') {
          inEvent = true
          currentEvent = {
            uid: '',
            summary: '',
            description: '',
            dtstart: '',
            dtend: '',
            status: 'CONFIRMED',
            allDay: false,
          }
        } else if (line === 'END:VEVENT') {
          if (currentEvent && currentEvent.uid && currentEvent.dtstart) {
            events.push(currentEvent)
          }
          inEvent = false
          currentEvent = null
        } else if (inEvent && currentEvent) {
          const colonIdx = line.indexOf(':')
          if (colonIdx !== -1) {
            const propFull = line.substring(0, colonIdx)
            const val = line.substring(colonIdx + 1)
            const propName = propFull.split(';')[0].toUpperCase()

            if (propName === 'UID') {
              currentEvent.uid = val.trim()
            } else if (propName === 'SUMMARY') {
              // Desescapar caracteres iCal
              currentEvent.summary = val
                .replace(/\\n/g, ' ')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\')
                .trim()
            } else if (propName === 'DESCRIPTION') {
              currentEvent.description = val
                .replace(/\\n/g, '\n')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\')
                .trim()
            } else if (propName === 'STATUS') {
              currentEvent.status = val.trim().toUpperCase()
            } else if (propName === 'DTSTART') {
              currentEvent.dtstart = val.trim()
              if (propFull.indexOf('VALUE=DATE') !== -1 || val.trim().length === 8) {
                currentEvent.allDay = true
              }
            } else if (propName === 'DTEND') {
              currentEvent.dtend = val.trim()
            }
          }
        }
      }

      // Helper inline para converter timestamp iCal para Date UTC
      // Formatos: 20261005T140000Z, 20261005T110000, 20261005
      const parseIcsDate = (valStr, isAllDay) => {
        if (!valStr) return null
        const clean = valStr.trim()
        if (clean.length === 8) {
          // YYYYMMDD (All Day) -> interpretar como início do dia em SP (America/Sao_Paulo UTC-3)
          // 08:00 horário comercial da clínica = 11:00 UTC
          const y = parseInt(clean.substring(0, 4), 10)
          const m = parseInt(clean.substring(4, 6), 10) - 1
          const d = parseInt(clean.substring(6, 8), 10)
          // Criar data às 08:00 locais de SP (11:00 UTC)
          const dt = new Date(Date.UTC(y, m, d, 11, 0, 0))
          return { date: dt, duration: 480, isAllDay: true } // 8h
        }

        // YYYYMMDDTHHMMSS ou YYYYMMDDTHHMMSSZ
        if (clean.length >= 15 && clean.indexOf('T') !== -1) {
          const y = parseInt(clean.substring(0, 4), 10)
          const m = parseInt(clean.substring(4, 6), 10) - 1
          const d = parseInt(clean.substring(6, 8), 10)
          const h = parseInt(clean.substring(9, 11), 10)
          const min = parseInt(clean.substring(11, 13), 10)
          const s = parseInt(clean.substring(13, 15), 10) || 0

          let dt = null
          if (clean.endsWith('Z')) {
            // Já em UTC
            dt = new Date(Date.UTC(y, m, d, h, min, s))
          } else {
            // Sem indicador 'Z', normalmente gerado no timezone local da conta Google (SP: UTC-3)
            // Adicionamos +3h para converter horário SP para UTC
            dt = new Date(Date.UTC(y, m, d, h + 3, min, s))
          }
          return { date: dt, duration: 45, isAllDay: false }
        }

        return null
      }

      // Buscar consultas já importadas deste usuário/sync
      // Para atualizar existentes e excluir eventos removidos do Google
      const existingConsultas = $app.findRecordsByFilter(
        'consultas',
        `origem = 'google' && user_id = '${userId}'`,
        '-data_hora',
        2000,
        0,
      )

      const existingMapByUid = {}
      for (let i = 0; i < existingConsultas.length; i++) {
        const c = existingConsultas[i]
        const uid = c.getString('google_event_uid')
        if (uid) {
          existingMapByUid[uid] = c
        }
      }

      const currentUidsInFeed = {}
      let importedCount = 0
      let updatedCount = 0
      let cancelledCount = 0

      const consultasCol = $app.findCollectionByNameOrId('consultas')

      for (let i = 0; i < events.length; i++) {
        const ev = events[i]
        currentUidsInFeed[ev.uid] = true

        // Se cancelado no Google
        if (ev.status === 'CANCELLED') {
          const exist = existingMapByUid[ev.uid]
          if (exist) {
            try {
              $app.delete(exist)
              cancelledCount++
            } catch (_) {}
          }
          continue
        }

        const parsedStart = parseIcsDate(ev.dtstart, ev.allDay)
        if (!parsedStart || isNaN(parsedStart.date.getTime())) {
          continue
        }

        let duracao = parsedStart.duration
        if (ev.dtend && !parsedStart.isAllDay) {
          const parsedEnd = parseIcsDate(ev.dtend, false)
          if (parsedEnd && !isNaN(parsedEnd.date.getTime())) {
            const diffMin = Math.round(
              (parsedEnd.date.getTime() - parsedStart.date.getTime()) / 60000,
            )
            if (diffMin > 0 && diffMin < 1440) {
              duracao = diffMin
            }
          }
        }

        // Format ISO string para o PocketBase: "YYYY-MM-DD HH:MM:SS.000Z"
        const isoStr = parsedStart.date.toISOString().replace('T', ' ')

        const summaryText = ev.summary || 'Compromisso Google Agenda'
        const descText = ev.description || ''

        const exist = existingMapByUid[ev.uid]
        if (exist) {
          // Atualizar
          exist.set('data_hora', isoStr)
          exist.set('duracao_min', duracao)
          exist.set('titulo_externo', summaryText)
          exist.set('notas', descText)
          exist.set('status', 'Confirmada')
          $app.save(exist)
          updatedCount++
        } else {
          // Inserir novo
          const newRecord = new Record(consultasCol)
          newRecord.set('paciente_id', pacienteId)
          newRecord.set('especialidade', 'Fisioterapia')
          newRecord.set('data_hora', isoStr)
          newRecord.set('duracao_min', duracao)
          newRecord.set('status', 'Confirmada')
          newRecord.set('notas', descText)
          newRecord.set('origem', 'google')
          newRecord.set('google_event_uid', ev.uid)
          newRecord.set('google_sync_id', syncRecord.id)
          newRecord.set('titulo_externo', summaryText)
          newRecord.set('user_id', userId)
          $app.save(newRecord)
          importedCount++
        }
      }

      // Limpar eventos que estavam gravados como 'google' mas não constam mais no feed .ics
      let removedCount = 0
      for (let i = 0; i < existingConsultas.length; i++) {
        const c = existingConsultas[i]
        const uid = c.getString('google_event_uid')
        if (uid && !currentUidsInFeed[uid]) {
          try {
            $app.delete(c)
            removedCount++
          } catch (_) {}
        }
      }

      // Atualizar metadados do syncRecord
      const nowIso = new Date().toISOString().replace('T', ' ')
      syncRecord.set('last_sync', nowIso)
      syncRecord.set('last_status', 'success')
      syncRecord.set('last_error', '')
      syncRecord.set('events_count', events.length)
      $app.save(syncRecord)

      return e.json(200, {
        success: true,
        message: 'Sincronização concluída com sucesso!',
        calendar_name: syncRecord.getString('calendar_name') || 'Google Calendar',
        total_in_feed: events.length,
        imported: importedCount,
        updated: updatedCount,
        removed: removedCount + cancelledCount,
        last_sync: nowIso,
      })
    } catch (syncErr) {
      const errMsg =
        'Erro na sincronização: ' + (syncErr ? syncErr.message || syncErr : 'Desconhecido')
      try {
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
      } catch (_) {}
      return e.json(500, { error: errMsg })
    }
  },
  $apis.requireAuth(),
)

// 2. Rota de Sincronizar Agora (executa sincronização usando a URL já salva no banco)
routerAdd(
  'POST',
  '/backend/v1/google-calendar/sync-now',
  (e) => {
    const auth = e.auth
    if (!auth || !auth.id) {
      return e.json(401, { error: 'Não autorizado' })
    }

    const userId = auth.id
    let syncRecord = null
    try {
      syncRecord = $app.findFirstRecordByData('google_calendar_syncs', 'user_id', userId)
    } catch (_) {}

    if (!syncRecord || !syncRecord.getString('ics_url')) {
      return e.json(400, {
        error: 'Nenhum endereço iCal configurado. Cole a URL do Google Calendar primeiro.',
      })
    }

    const icsUrl = syncRecord.getString('ics_url').trim()

    try {
      // 1. Localizar paciente "Google Agenda"
      let pacienteId = ''
      try {
        const p = $app.findFirstRecordByData('pacientes', 'nome', 'Google Agenda')
        if (p) pacienteId = p.id
      } catch (_) {}

      if (!pacienteId) {
        const pCol = $app.findCollectionByNameOrId('pacientes')
        const newP = new Record(pCol)
        newP.set('nome', 'Google Agenda')
        newP.set('status', 'Ativo')
        newP.set('observacoes', 'Sistema - Alocação externa de eventos Google')
        $app.save(newP)
        pacienteId = newP.id
      }

      // 2. Download do arquivo .ics
      const res = $http.send({
        url: icsUrl,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SistemaSOUL/1.0; +https://clinicasoul.com.br)',
          Accept: 'text/calendar, text/plain, */*',
        },
        timeout: 25,
      })

      if (res.statusCode < 200 || res.statusCode >= 300) {
        const errMsg = 'Falha ao baixar calendário do Google. Código HTTP: ' + res.statusCode
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
        return e.json(400, { error: errMsg })
      }

      const icsText = res.raw || ''
      if (!icsText || icsText.indexOf('BEGIN:VCALENDAR') === -1) {
        const errMsg = 'A URL fornecida não retornou um arquivo iCalendar (.ics) válido.'
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
        return e.json(400, { error: errMsg })
      }

      // 3. Parser de VEVENTs (unfold RFC 5545)
      const rawLines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
      const unfoldedLines = []
      for (let i = 0; i < rawLines.length; i++) {
        const cur = rawLines[i]
        if ((cur.startsWith(' ') || cur.startsWith('\t')) && unfoldedLines.length > 0) {
          unfoldedLines[unfoldedLines.length - 1] += cur.substring(1)
        } else {
          unfoldedLines.push(cur)
        }
      }

      let calNameFromIcs = ''
      for (let i = 0; i < unfoldedLines.length; i++) {
        const line = unfoldedLines[i]
        if (line.startsWith('X-WR-CALNAME:')) {
          calNameFromIcs = line.substring(13).trim()
          break
        }
      }
      if (calNameFromIcs && !syncRecord.getString('calendar_name')) {
        syncRecord.set('calendar_name', calNameFromIcs)
      }

      const events = []
      let inEvent = false
      let currentEvent = null

      for (let i = 0; i < unfoldedLines.length; i++) {
        const line = unfoldedLines[i].trim()
        if (line === 'BEGIN:VEVENT') {
          inEvent = true
          currentEvent = {
            uid: '',
            summary: '',
            description: '',
            dtstart: '',
            dtend: '',
            status: 'CONFIRMED',
            allDay: false,
          }
        } else if (line === 'END:VEVENT') {
          if (currentEvent && currentEvent.uid && currentEvent.dtstart) {
            events.push(currentEvent)
          }
          inEvent = false
          currentEvent = null
        } else if (inEvent && currentEvent) {
          const colonIdx = line.indexOf(':')
          if (colonIdx !== -1) {
            const propFull = line.substring(0, colonIdx)
            const val = line.substring(colonIdx + 1)
            const propName = propFull.split(';')[0].toUpperCase()

            if (propName === 'UID') {
              currentEvent.uid = val.trim()
            } else if (propName === 'SUMMARY') {
              currentEvent.summary = val
                .replace(/\\n/g, ' ')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\')
                .trim()
            } else if (propName === 'DESCRIPTION') {
              currentEvent.description = val
                .replace(/\\n/g, '\n')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\')
                .trim()
            } else if (propName === 'STATUS') {
              currentEvent.status = val.trim().toUpperCase()
            } else if (propName === 'DTSTART') {
              currentEvent.dtstart = val.trim()
              if (propFull.indexOf('VALUE=DATE') !== -1 || val.trim().length === 8) {
                currentEvent.allDay = true
              }
            } else if (propName === 'DTEND') {
              currentEvent.dtend = val.trim()
            }
          }
        }
      }

      const parseIcsDate = (valStr, isAllDay) => {
        if (!valStr) return null
        const clean = valStr.trim()
        if (clean.length === 8) {
          const y = parseInt(clean.substring(0, 4), 10)
          const m = parseInt(clean.substring(4, 6), 10) - 1
          const d = parseInt(clean.substring(6, 8), 10)
          const dt = new Date(Date.UTC(y, m, d, 11, 0, 0)) // 08:00 horário SP
          return { date: dt, duration: 480, isAllDay: true }
        }

        if (clean.length >= 15 && clean.indexOf('T') !== -1) {
          const y = parseInt(clean.substring(0, 4), 10)
          const m = parseInt(clean.substring(4, 6), 10) - 1
          const d = parseInt(clean.substring(6, 8), 10)
          const h = parseInt(clean.substring(9, 11), 10)
          const min = parseInt(clean.substring(11, 13), 10)
          const s = parseInt(clean.substring(13, 15), 10) || 0

          let dt = null
          if (clean.endsWith('Z')) {
            dt = new Date(Date.UTC(y, m, d, h, min, s))
          } else {
            dt = new Date(Date.UTC(y, m, d, h + 3, min, s))
          }
          return { date: dt, duration: 45, isAllDay: false }
        }
        return null
      }

      const existingConsultas = $app.findRecordsByFilter(
        'consultas',
        `origem = 'google' && user_id = '${userId}'`,
        '-data_hora',
        2000,
        0,
      )

      const existingMapByUid = {}
      for (let i = 0; i < existingConsultas.length; i++) {
        const c = existingConsultas[i]
        const uid = c.getString('google_event_uid')
        if (uid) {
          existingMapByUid[uid] = c
        }
      }

      const currentUidsInFeed = {}
      let importedCount = 0
      let updatedCount = 0
      let cancelledCount = 0

      const consultasCol = $app.findCollectionByNameOrId('consultas')

      for (let i = 0; i < events.length; i++) {
        const ev = events[i]
        currentUidsInFeed[ev.uid] = true

        if (ev.status === 'CANCELLED') {
          const exist = existingMapByUid[ev.uid]
          if (exist) {
            try {
              $app.delete(exist)
              cancelledCount++
            } catch (_) {}
          }
          continue
        }

        const parsedStart = parseIcsDate(ev.dtstart, ev.allDay)
        if (!parsedStart || isNaN(parsedStart.date.getTime())) {
          continue
        }

        let duracao = parsedStart.duration
        if (ev.dtend && !parsedStart.isAllDay) {
          const parsedEnd = parseIcsDate(ev.dtend, false)
          if (parsedEnd && !isNaN(parsedEnd.date.getTime())) {
            const diffMin = Math.round(
              (parsedEnd.date.getTime() - parsedStart.date.getTime()) / 60000,
            )
            if (diffMin > 0 && diffMin < 1440) {
              duracao = diffMin
            }
          }
        }

        const isoStr = parsedStart.date.toISOString().replace('T', ' ')
        const summaryText = ev.summary || 'Compromisso Google Agenda'
        const descText = ev.description || ''

        const exist = existingMapByUid[ev.uid]
        if (exist) {
          exist.set('data_hora', isoStr)
          exist.set('duracao_min', duracao)
          exist.set('titulo_externo', summaryText)
          exist.set('notas', descText)
          exist.set('status', 'Confirmada')
          $app.save(exist)
          updatedCount++
        } else {
          const newRecord = new Record(consultasCol)
          newRecord.set('paciente_id', pacienteId)
          newRecord.set('especialidade', 'Fisioterapia')
          newRecord.set('data_hora', isoStr)
          newRecord.set('duracao_min', duracao)
          newRecord.set('status', 'Confirmada')
          newRecord.set('notas', descText)
          newRecord.set('origem', 'google')
          newRecord.set('google_event_uid', ev.uid)
          newRecord.set('google_sync_id', syncRecord.id)
          newRecord.set('titulo_externo', summaryText)
          newRecord.set('user_id', userId)
          $app.save(newRecord)
          importedCount++
        }
      }

      let removedCount = 0
      for (let i = 0; i < existingConsultas.length; i++) {
        const c = existingConsultas[i]
        const uid = c.getString('google_event_uid')
        if (uid && !currentUidsInFeed[uid]) {
          try {
            $app.delete(c)
            removedCount++
          } catch (_) {}
        }
      }

      const nowIso = new Date().toISOString().replace('T', ' ')
      syncRecord.set('last_sync', nowIso)
      syncRecord.set('last_status', 'success')
      syncRecord.set('last_error', '')
      syncRecord.set('events_count', events.length)
      $app.save(syncRecord)

      return e.json(200, {
        success: true,
        message: 'Sincronização concluída com sucesso!',
        calendar_name: syncRecord.getString('calendar_name') || 'Google Calendar',
        total_in_feed: events.length,
        imported: importedCount,
        updated: updatedCount,
        removed: removedCount + cancelledCount,
        last_sync: nowIso,
      })
    } catch (syncErr) {
      const errMsg =
        'Erro na sincronização: ' + (syncErr ? syncErr.message || syncErr : 'Desconhecido')
      try {
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
      } catch (_) {}
      return e.json(500, { error: errMsg })
    }
  },
  $apis.requireAuth(),
)

// 3. Rota de Obter Status Atual de Sincronização
routerAdd(
  'GET',
  '/backend/v1/google-calendar/status',
  (e) => {
    const auth = e.auth
    if (!auth || !auth.id) {
      return e.json(401, { error: 'Não autorizado' })
    }

    const userId = auth.id
    let syncRecord = null
    try {
      syncRecord = $app.findFirstRecordByData('google_calendar_syncs', 'user_id', userId)
    } catch (_) {}

    if (!syncRecord) {
      return e.json(200, {
        configured: false,
      })
    }

    const fullUrl = syncRecord.getString('ics_url') || ''
    // Truncar URL para segurança (exibir apenas domínio e primeiros/últimos caracteres)
    let maskedUrl = ''
    if (fullUrl.length > 28) {
      maskedUrl = fullUrl.substring(0, 32) + '••••••••' + fullUrl.substring(fullUrl.length - 12)
    } else {
      maskedUrl = fullUrl
    }

    return e.json(200, {
      configured: true,
      masked_url: maskedUrl,
      calendar_name: syncRecord.getString('calendar_name') || '',
      last_sync: syncRecord.getString('last_sync') || '',
      last_status: syncRecord.getString('last_status') || '',
      last_error: syncRecord.getString('last_error') || '',
      events_count: syncRecord.getInt('events_count') || 0,
      auto_sync: syncRecord.getBool('auto_sync'),
    })
  },
  $apis.requireAuth(),
)

// 4. Rota de Remover Vínculo / Desconectar Google Calendar
routerAdd(
  'POST',
  '/backend/v1/google-calendar/disconnect',
  (e) => {
    const auth = e.auth
    if (!auth || !auth.id) {
      return e.json(401, { error: 'Não autorizado' })
    }

    const userId = auth.id
    let syncRecord = null
    try {
      syncRecord = $app.findFirstRecordByData('google_calendar_syncs', 'user_id', userId)
    } catch (_) {}

    if (syncRecord) {
      try {
        $app.delete(syncRecord)
      } catch (_) {}
    }

    // Opcional: remover eventos importados do Google deste usuário
    const existingConsultas = $app.findRecordsByFilter(
      'consultas',
      `origem = 'google' && user_id = '${userId}'`,
      '-created',
      2000,
      0,
    )
    for (let i = 0; i < existingConsultas.length; i++) {
      try {
        $app.delete(existingConsultas[i])
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      message: 'Vínculo com Google Calendar removido e eventos externos excluídos com sucesso.',
    })
  },
  $apis.requireAuth(),
)

// 5. Cron Job automático a cada 15 minutos para todos os calendários cadastrados
cronAdd('google_calendar_sync_cron', '*/15 * * * *', () => {
  try {
    console.log('[CRON Google Sync] Iniciando ciclo de sincronização a cada 15 min...')

    const syncRecords = $app.findRecordsByFilter(
      'google_calendar_syncs',
      "auto_sync = true && ics_url != ''",
      '-created',
      200,
      0,
    )

    if (!syncRecords || syncRecords.length === 0) {
      console.log('[CRON Google Sync] Nenhum calendário ativo para sincronizar.')
      return
    }

    // Localizar paciente "Google Agenda"
    let pacienteId = ''
    try {
      const p = $app.findFirstRecordByData('pacientes', 'nome', 'Google Agenda')
      if (p) pacienteId = p.id
    } catch (_) {}

    if (!pacienteId) {
      const pCol = $app.findCollectionByNameOrId('pacientes')
      const newP = new Record(pCol)
      newP.set('nome', 'Google Agenda')
      newP.set('status', 'Ativo')
      newP.set('observacoes', 'Sistema - Alocação externa de eventos Google')
      $app.save(newP)
      pacienteId = newP.id
    }

    const consultasCol = $app.findCollectionByNameOrId('consultas')

    for (let sIdx = 0; sIdx < syncRecords.length; sIdx++) {
      const syncRecord = syncRecords[sIdx]
      const userId = syncRecord.getString('user_id')
      const icsUrl = syncRecord.getString('ics_url')
      if (!userId || !icsUrl) continue

      try {
        const res = $http.send({
          url: icsUrl,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SistemaSOUL/1.0; +https://clinicasoul.com.br)',
            Accept: 'text/calendar, text/plain, */*',
          },
          timeout: 25,
        })

        if (res.statusCode < 200 || res.statusCode >= 300) {
          syncRecord.set('last_status', 'error')
          syncRecord.set('last_error', 'HTTP ' + res.statusCode)
          $app.save(syncRecord)
          continue
        }

        const icsText = res.raw || ''
        if (!icsText || icsText.indexOf('BEGIN:VCALENDAR') === -1) {
          syncRecord.set('last_status', 'error')
          syncRecord.set('last_error', 'Arquivo iCal inválido')
          $app.save(syncRecord)
          continue
        }

        // Unfold
        const rawLines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
        const unfoldedLines = []
        for (let i = 0; i < rawLines.length; i++) {
          const cur = rawLines[i]
          if ((cur.startsWith(' ') || cur.startsWith('\t')) && unfoldedLines.length > 0) {
            unfoldedLines[unfoldedLines.length - 1] += cur.substring(1)
          } else {
            unfoldedLines.push(cur)
          }
        }

        const events = []
        let inEvent = false
        let currentEvent = null

        for (let i = 0; i < unfoldedLines.length; i++) {
          const line = unfoldedLines[i].trim()
          if (line === 'BEGIN:VEVENT') {
            inEvent = true
            currentEvent = {
              uid: '',
              summary: '',
              description: '',
              dtstart: '',
              dtend: '',
              status: 'CONFIRMED',
              allDay: false,
            }
          } else if (line === 'END:VEVENT') {
            if (currentEvent && currentEvent.uid && currentEvent.dtstart) {
              events.push(currentEvent)
            }
            inEvent = false
            currentEvent = null
          } else if (inEvent && currentEvent) {
            const colonIdx = line.indexOf(':')
            if (colonIdx !== -1) {
              const propFull = line.substring(0, colonIdx)
              const val = line.substring(colonIdx + 1)
              const propName = propFull.split(';')[0].toUpperCase()

              if (propName === 'UID') {
                currentEvent.uid = val.trim()
              } else if (propName === 'SUMMARY') {
                currentEvent.summary = val
                  .replace(/\\n/g, ' ')
                  .replace(/\\,/g, ',')
                  .replace(/\\;/g, ';')
                  .replace(/\\\\/g, '\\')
                  .trim()
              } else if (propName === 'DESCRIPTION') {
                currentEvent.description = val
                  .replace(/\\n/g, '\n')
                  .replace(/\\,/g, ',')
                  .replace(/\\;/g, ';')
                  .replace(/\\\\/g, '\\')
                  .trim()
              } else if (propName === 'STATUS') {
                currentEvent.status = val.trim().toUpperCase()
              } else if (propName === 'DTSTART') {
                currentEvent.dtstart = val.trim()
                if (propFull.indexOf('VALUE=DATE') !== -1 || val.trim().length === 8) {
                  currentEvent.allDay = true
                }
              } else if (propName === 'DTEND') {
                currentEvent.dtend = val.trim()
              }
            }
          }
        }

        const parseIcsDate = (valStr, isAllDay) => {
          if (!valStr) return null
          const clean = valStr.trim()
          if (clean.length === 8) {
            const y = parseInt(clean.substring(0, 4), 10)
            const m = parseInt(clean.substring(4, 6), 10) - 1
            const d = parseInt(clean.substring(6, 8), 10)
            const dt = new Date(Date.UTC(y, m, d, 11, 0, 0))
            return { date: dt, duration: 480, isAllDay: true }
          }

          if (clean.length >= 15 && clean.indexOf('T') !== -1) {
            const y = parseInt(clean.substring(0, 4), 10)
            const m = parseInt(clean.substring(4, 6), 10) - 1
            const d = parseInt(clean.substring(6, 8), 10)
            const h = parseInt(clean.substring(9, 11), 10)
            const min = parseInt(clean.substring(11, 13), 10)
            const s = parseInt(clean.substring(13, 15), 10) || 0

            let dt = null
            if (clean.endsWith('Z')) {
              dt = new Date(Date.UTC(y, m, d, h, min, s))
            } else {
              dt = new Date(Date.UTC(y, m, d, h + 3, min, s))
            }
            return { date: dt, duration: 45, isAllDay: false }
          }
          return null
        }

        const existingConsultas = $app.findRecordsByFilter(
          'consultas',
          `origem = 'google' && user_id = '${userId}'`,
          '-data_hora',
          2000,
          0,
        )

        const existingMapByUid = {}
        for (let i = 0; i < existingConsultas.length; i++) {
          const c = existingConsultas[i]
          const uid = c.getString('google_event_uid')
          if (uid) {
            existingMapByUid[uid] = c
          }
        }

        const currentUidsInFeed = {}

        for (let i = 0; i < events.length; i++) {
          const ev = events[i]
          currentUidsInFeed[ev.uid] = true

          if (ev.status === 'CANCELLED') {
            const exist = existingMapByUid[ev.uid]
            if (exist) {
              try {
                $app.delete(exist)
              } catch (_) {}
            }
            continue
          }

          const parsedStart = parseIcsDate(ev.dtstart, ev.allDay)
          if (!parsedStart || isNaN(parsedStart.date.getTime())) {
            continue
          }

          let duracao = parsedStart.duration
          if (ev.dtend && !parsedStart.isAllDay) {
            const parsedEnd = parseIcsDate(ev.dtend, false)
            if (parsedEnd && !isNaN(parsedEnd.date.getTime())) {
              const diffMin = Math.round(
                (parsedEnd.date.getTime() - parsedStart.date.getTime()) / 60000,
              )
              if (diffMin > 0 && diffMin < 1440) {
                duracao = diffMin
              }
            }
          }

          const isoStr = parsedStart.date.toISOString().replace('T', ' ')
          const summaryText = ev.summary || 'Compromisso Google Agenda'
          const descText = ev.description || ''

          const exist = existingMapByUid[ev.uid]
          if (exist) {
            exist.set('data_hora', isoStr)
            exist.set('duracao_min', duracao)
            exist.set('titulo_externo', summaryText)
            exist.set('notas', descText)
            exist.set('status', 'Confirmada')
            $app.save(exist)
          } else {
            const newRecord = new Record(consultasCol)
            newRecord.set('paciente_id', pacienteId)
            newRecord.set('especialidade', 'Fisioterapia')
            newRecord.set('data_hora', isoStr)
            newRecord.set('duracao_min', duracao)
            newRecord.set('status', 'Confirmada')
            newRecord.set('notas', descText)
            newRecord.set('origem', 'google')
            newRecord.set('google_event_uid', ev.uid)
            newRecord.set('google_sync_id', syncRecord.id)
            newRecord.set('titulo_externo', summaryText)
            newRecord.set('user_id', userId)
            $app.save(newRecord)
          }
        }

        // Remover deletados do feed
        for (let i = 0; i < existingConsultas.length; i++) {
          const c = existingConsultas[i]
          const uid = c.getString('google_event_uid')
          if (uid && !currentUidsInFeed[uid]) {
            try {
              $app.delete(c)
            } catch (_) {}
          }
        }

        const nowIso = new Date().toISOString().replace('T', ' ')
        syncRecord.set('last_sync', nowIso)
        syncRecord.set('last_status', 'success')
        syncRecord.set('last_error', '')
        syncRecord.set('events_count', events.length)
        $app.save(syncRecord)
      } catch (itemErr) {
        console.log('[CRON Google Sync] Erro no usuário ' + userId + ':', itemErr)
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', String(itemErr))
        $app.save(syncRecord)
      }
    }
  } catch (globalErr) {
    console.log('[CRON Google Sync] Erro global:', globalErr)
  }
})
