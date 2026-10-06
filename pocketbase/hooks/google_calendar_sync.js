/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de importação e sincronização com Google Calendar via endereço secreto .ics (iCal)
 * Oferece:
 * 1. POST /backend/v1/google-calendar/save-and-sync (salva ou atualiza a ics_url e executa sync imediato com retry e diagnóstico detalhado)
 * 2. POST /backend/v1/google-calendar/sync-now (executa sincronização usando a URL já salva no banco)
 * 3. GET  /backend/v1/google-calendar/status (retorna o estado da sincronização do usuário autenticado)
 * 4. POST /backend/v1/google-calendar/disconnect (desconecta e remove eventos externos)
 * 5. cronAdd("google_calendar_sync_cron", "* /15 * * * *") para sincronizar automaticamente a cada 15 min
 *
 * NOTA ARQUITETURA VM POCKETBASE (goja):
 * Top-level functions e variáveis NÃO são compartilhadas entre callbacks.
 * Toda a lógica de cada rota ou cron handler é mantida self-contained dentro do callback.
 */

// 1. Rota de Salvar e Sincronizar
routerAdd(
  'POST',
  '/backend/v1/google-calendar/save-and-sync',
  (e) => {
    const auth = e.auth
    if (!auth || !auth.id) {
      return e.json(401, { error: 'Não autorizado. Faça login novamente.' })
    }

    const userId = auth.id
    let body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }

    let rawUrl = (body.ics_url || '').trim()
    if (!rawUrl) {
      return e.json(400, {
        error: 'Endereço iCal (.ics) é obrigatório. Cole o link copiado do Google Agenda.',
      })
    }

    // Limpar aspas acidentais, quebras de linha e espaços extras
    rawUrl = rawUrl.replace(/[\r\n\t]/g, '').trim()
    if (
      (rawUrl.startsWith('"') && rawUrl.endsWith('"')) ||
      (rawUrl.startsWith("'") && rawUrl.endsWith("'"))
    ) {
      rawUrl = rawUrl.substring(1, rawUrl.length - 1).trim()
    }

    // Normalizar protocolo webcal:// para https://
    let normalizedUrl = rawUrl
    if (normalizedUrl.toLowerCase().startsWith('webcal://')) {
      normalizedUrl = 'https://' + normalizedUrl.substring(9)
    }

    // Validar formato mínimo de URL
    if (
      !normalizedUrl.toLowerCase().startsWith('https://') &&
      !normalizedUrl.toLowerCase().startsWith('http://')
    ) {
      return e.json(400, {
        error:
          'URL inválida. O link do Google Agenda deve começar com https:// (ou webcal://). Verifique se copiou o link completo.',
      })
    }

    // Alerta caso o usuário tente colar link html de visualização web em vez de .ics
    if (
      normalizedUrl.indexOf('calendar.google.com') !== -1 &&
      normalizedUrl.indexOf('.ics') === -1 &&
      (normalizedUrl.indexOf('/embed') !== -1 ||
        normalizedUrl.indexOf('/render') !== -1 ||
        normalizedUrl.indexOf('/event') !== -1)
    ) {
      return e.json(400, {
        error:
          'Este link parece ser da página web do Google Agenda, não o arquivo iCal. No Google Agenda, vá em Configurações > Integrar agenda e copie o "Endereço secreto em formato iCal" que termina com .ics.',
      })
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

      // 2. Download do arquivo .ics com retry em caso de lentidão de rede
      let res = null
      let downloadError = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          res = $http.send({
            url: normalizedUrl,
            method: 'GET',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SistemaSOUL/1.0',
              Accept: 'text/calendar, text/plain, */*',
              'Cache-Control': 'no-cache',
            },
            timeout: 30,
          })
          if (res && res.statusCode >= 200 && res.statusCode < 300) {
            downloadError = null
            break
          } else {
            downloadError = 'Código HTTP ' + (res ? res.statusCode : 'sem resposta')
          }
        } catch (fetchErr) {
          downloadError = fetchErr ? fetchErr.message || String(fetchErr) : 'Falha na conexão'
        }
      }

      if (!res || res.statusCode < 200 || res.statusCode >= 300) {
        let msg =
          'Não foi possível acessar seu calendário do Google (' +
          (downloadError || 'Erro desconhecido') +
          '). '
        if (res && res.statusCode === 404) {
          msg +=
            'O endereço iCal não foi encontrado no Google. Verifique se o endereço secreto foi redefinido ou copiado incorretamente.'
        } else if ((res && res.statusCode === 401) || (res && res.statusCode === 403)) {
          msg +=
            'Acesso negado pelo Google. Certifique-se de copiar o "Endereço secreto em formato iCal", e não um link público restrito.'
        } else {
          msg += 'Verifique sua conexão e se a URL completa copiada do Google Agenda está correta.'
        }

        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', msg)
        $app.save(syncRecord)
        return e.json(400, { error: msg })
      }

      const icsText = res.raw || ''
      if (!icsText || icsText.indexOf('BEGIN:VCALENDAR') === -1) {
        const errMsg =
          'O link informado não retornou um calendário iCal (.ics) válido. Copie novamente o "Endereço secreto em formato iCal" nas configurações do seu Google Agenda.'
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
        return e.json(400, { error: errMsg })
      }

      // 3. Parser RFC 5545 com desdobramento de linhas (folding)
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
        if (line.toUpperCase().startsWith('X-WR-CALNAME:')) {
          calNameFromIcs = line.substring(line.indexOf(':') + 1).trim()
          break
        }
      }
      if (calNameFromIcs && !syncRecord.getString('calendar_name')) {
        syncRecord.set('calendar_name', calNameFromIcs)
      }

      // Parser de eventos VEVENT
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
                .replace(/\\N/g, ' ')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\')
                .trim()
            } else if (propName === 'DESCRIPTION') {
              currentEvent.description = val
                .replace(/\\n/g, '\n')
                .replace(/\\N/g, '\n')
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

      // Parser robusto de datas iCal (UTC 'Z', local 'YYYYMMDDTHHMMSS' assumindo SP UTC-3, e All-Day)
      const parseIcsDate = (valStr, isAllDay) => {
        if (!valStr) return null
        const clean = valStr.trim()
        if (clean.length === 8) {
          const y = parseInt(clean.substring(0, 4), 10)
          const m = parseInt(clean.substring(4, 6), 10) - 1
          const d = parseInt(clean.substring(6, 8), 10)
          const dt = new Date(Date.UTC(y, m, d, 11, 0, 0)) // 08:00 horário de Brasília = 11:00 UTC
          return { date: dt, duration: 480, isAllDay: true }
        }

        if (clean.length >= 15 && clean.indexOf('T') !== -1) {
          const tIdx = clean.indexOf('T')
          const datePart = clean.substring(0, tIdx)
          const timePart = clean.substring(tIdx + 1)

          const y = parseInt(datePart.substring(0, 4), 10)
          const m = parseInt(datePart.substring(4, 6), 10) - 1
          const d = parseInt(datePart.substring(6, 8), 10)
          const h = parseInt(timePart.substring(0, 2), 10)
          const min = parseInt(timePart.substring(2, 4), 10)
          const s = parseInt(timePart.substring(4, 6), 10) || 0

          let dt = null
          if (clean.endsWith('Z')) {
            dt = new Date(Date.UTC(y, m, d, h, min, s))
          } else {
            // Sem 'Z': horário local do Brasil (UTC-3)
            dt = new Date(Date.UTC(y, m, d, h + 3, min, s))
          }
          return { date: dt, duration: 45, isAllDay: false }
        }
        return null
      }

      // Buscar eventos já sincronizados deste usuário para merge sem duplicidade
      const existingConsultas = $app.findRecordsByFilter(
        'consultas',
        `origem = 'google' && user_id = '${userId}'`,
        '-data_hora',
        3000,
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

      // Remover eventos do Google que foram excluídos na fonte
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
        message: 'Google Agenda vinculado e sincronizado com sucesso!',
        calendar_name: syncRecord.getString('calendar_name') || 'Google Agenda',
        total_in_feed: events.length,
        imported: importedCount,
        updated: updatedCount,
        removed: removedCount + cancelledCount,
        last_sync: nowIso,
      })
    } catch (syncErr) {
      const errMsg =
        'Erro ao processar agenda: ' +
        (syncErr ? syncErr.message || String(syncErr) : 'Erro desconhecido')
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
      return e.json(401, { error: 'Não autorizado. Faça login novamente.' })
    }

    const userId = auth.id
    let syncRecord = null
    try {
      syncRecord = $app.findFirstRecordByData('google_calendar_syncs', 'user_id', userId)
    } catch (_) {}

    if (!syncRecord || !syncRecord.getString('ics_url')) {
      return e.json(400, {
        error:
          'Nenhum endereço iCal configurado. Cole o endereço secreto do Google Agenda primeiro.',
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

      // 2. Download do arquivo .ics com retry
      let res = null
      let downloadError = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          res = $http.send({
            url: icsUrl,
            method: 'GET',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SistemaSOUL/1.0',
              Accept: 'text/calendar, text/plain, */*',
              'Cache-Control': 'no-cache',
            },
            timeout: 30,
          })
          if (res && res.statusCode >= 200 && res.statusCode < 300) {
            downloadError = null
            break
          } else {
            downloadError = 'Código HTTP ' + (res ? res.statusCode : 'sem resposta')
          }
        } catch (fetchErr) {
          downloadError = fetchErr ? fetchErr.message || String(fetchErr) : 'Falha na conexão'
        }
      }

      if (!res || res.statusCode < 200 || res.statusCode >= 300) {
        const errMsg =
          'Falha ao baixar calendário do Google (' +
          (downloadError || 'Erro desconhecido') +
          '). Verifique se a URL secreta ainda é válida nas configurações do Google Agenda.'
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
        return e.json(400, { error: errMsg })
      }

      const icsText = res.raw || ''
      if (!icsText || icsText.indexOf('BEGIN:VCALENDAR') === -1) {
        const errMsg =
          'O Google não retornou um arquivo iCalendar (.ics) válido. Copie novamente o endereço secreto nas configurações do Google Agenda.'
        syncRecord.set('last_status', 'error')
        syncRecord.set('last_error', errMsg)
        $app.save(syncRecord)
        return e.json(400, { error: errMsg })
      }

      // 3. Parser RFC 5545
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
        if (line.toUpperCase().startsWith('X-WR-CALNAME:')) {
          calNameFromIcs = line.substring(line.indexOf(':') + 1).trim()
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
                .replace(/\\N/g, ' ')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\')
                .trim()
            } else if (propName === 'DESCRIPTION') {
              currentEvent.description = val
                .replace(/\\n/g, '\n')
                .replace(/\\N/g, '\n')
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
          const tIdx = clean.indexOf('T')
          const datePart = clean.substring(0, tIdx)
          const timePart = clean.substring(tIdx + 1)

          const y = parseInt(datePart.substring(0, 4), 10)
          const m = parseInt(datePart.substring(4, 6), 10) - 1
          const d = parseInt(datePart.substring(6, 8), 10)
          const h = parseInt(timePart.substring(0, 2), 10)
          const min = parseInt(timePart.substring(2, 4), 10)
          const s = parseInt(timePart.substring(4, 6), 10) || 0

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
        3000,
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
        calendar_name: syncRecord.getString('calendar_name') || 'Google Agenda',
        total_in_feed: events.length,
        imported: importedCount,
        updated: updatedCount,
        removed: removedCount + cancelledCount,
        last_sync: nowIso,
      })
    } catch (syncErr) {
      const errMsg =
        'Erro na sincronização: ' +
        (syncErr ? syncErr.message || String(syncErr) : 'Erro desconhecido')
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

    // Remover eventos importados do Google deste usuário
    const existingConsultas = $app.findRecordsByFilter(
      'consultas',
      `origem = 'google' && user_id = '${userId}'`,
      '-created',
      3000,
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
        let res = null
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            res = $http.send({
              url: icsUrl,
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SistemaSOUL/1.0',
                Accept: 'text/calendar, text/plain, */*',
                'Cache-Control': 'no-cache',
              },
              timeout: 30,
            })
            if (res && res.statusCode >= 200 && res.statusCode < 300) {
              break
            }
          } catch (_) {}
        }

        if (!res || res.statusCode < 200 || res.statusCode >= 300) {
          syncRecord.set('last_status', 'error')
          syncRecord.set('last_error', 'HTTP ' + (res ? res.statusCode : 'Falha de rede'))
          $app.save(syncRecord)
          continue
        }

        const icsText = res.raw || ''
        if (!icsText || icsText.indexOf('BEGIN:VCALENDAR') === -1) {
          syncRecord.set('last_status', 'error')
          syncRecord.set('last_error', 'Arquivo iCal inválido retornado pelo Google')
          $app.save(syncRecord)
          continue
        }

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
                  .replace(/\\N/g, ' ')
                  .replace(/\\,/g, ',')
                  .replace(/\\;/g, ';')
                  .replace(/\\\\/g, '\\')
                  .trim()
              } else if (propName === 'DESCRIPTION') {
                currentEvent.description = val
                  .replace(/\\n/g, '\n')
                  .replace(/\\N/g, '\n')
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
            const tIdx = clean.indexOf('T')
            const datePart = clean.substring(0, tIdx)
            const timePart = clean.substring(tIdx + 1)

            const y = parseInt(datePart.substring(0, 4), 10)
            const m = parseInt(datePart.substring(4, 6), 10) - 1
            const d = parseInt(datePart.substring(6, 8), 10)
            const h = parseInt(timePart.substring(0, 2), 10)
            const min = parseInt(timePart.substring(2, 4), 10)
            const s = parseInt(timePart.substring(4, 6), 10) || 0

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
          3000,
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
