/// <reference path="../pb_data/types.d.ts" />

routerAdd('GET', '/calendar/{token}/agenda.ics', (e) => {
  try {
    const token = e.request.pathValue('token') || ''
    if (!token || token.length < 16) {
      return e.string(404, 'Calendário não encontrado')
    }

    // 1. Localizar o profissional pelo calendar_token
    let user = null
    try {
      user = $app.findFirstRecordByData('users', 'calendar_token', token)
    } catch (errUser) {
      return e.string(404, 'Token de calendário inválido ou expirado')
    }

    if (!user) {
      return e.string(404, 'Calendário não encontrado')
    }

    const userName = user.getString('name') || 'Profissional'

    // 2. Buscar consultas
    // Buscamos todas as consultas com paciente expandido
    // Pode ordenar por data_hora
    const consultas = $app.findRecordsByFilter(
      'consultas',
      "status != 'Cancelada'",
      'data_hora',
      500,
      0,
    )

    // Helpers inline no callback (PocketBase VM isolation)
    const padZero = (n) => (n < 10 ? '0' + n : '' + n)

    const toIcsDateTime = (dateObj) => {
      return (
        dateObj.getUTCFullYear() +
        padZero(dateObj.getUTCMonth() + 1) +
        padZero(dateObj.getUTCDate()) +
        'T' +
        padZero(dateObj.getUTCHours()) +
        padZero(dateObj.getUTCMinutes()) +
        padZero(dateObj.getUTCSeconds()) +
        'Z'
      )
    }

    const escapeIcsText = (str) => {
      if (!str) return ''
      return str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n')
    }

    const nowUtcStr = toIcsDateTime(new Date())

    // 3. Montar linhas do VCALENDAR
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Clinica SOUL//Sistema SOUL de Avaliacao//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Clínica SOUL — Agenda (${escapeIcsText(userName)})`,
      'X-WR-TIMEZONE:America/Sao_Paulo',
      'X-WR-CALDESC:Feed de consultas e alertas de reavaliação da Clínica SOUL',
    ]

    for (let i = 0; i < consultas.length; i++) {
      const c = consultas[i]
      const cId = c.id
      const especialidade = c.getString('especialidade') || 'Atendimento'
      const duracaoMin = c.getInt('duracao_min') || 45
      const status = c.getString('status') || 'Agendada'
      const notas = c.getString('notas') || ''
      const pacienteId = c.getString('paciente_id')

      // Obter nome e telefone do paciente
      let pacienteNome = 'Paciente'
      let pacienteTel = ''
      if (pacienteId) {
        try {
          const pacRecord = $app.findRecordById('pacientes', pacienteId)
          if (pacRecord) {
            pacienteNome = pacRecord.getString('nome') || 'Paciente'
            pacienteTel = pacRecord.getString('telefone') || ''
          }
        } catch (_) {}
      }

      const isAlerta = notas.toUpperCase().indexOf('[ALERTA') !== -1

      // Converter data_hora para Date
      // PocketBase armazena datas no formato UTC ISO "YYYY-MM-DD HH:MM:SS.sssZ" ou "YYYY-MM-DDTHH:MM:SS.sssZ"
      const dataHoraRaw = c.getString('data_hora')
      if (!dataHoraRaw) continue

      let dtStart = new Date(dataHoraRaw.replace(' ', 'T'))
      if (isNaN(dtStart.getTime())) {
        dtStart = new Date(dataHoraRaw)
      }
      if (isNaN(dtStart.getTime())) continue

      const dtEnd = new Date(dtStart.getTime() + duracaoMin * 60 * 1000)

      const startIcs = toIcsDateTime(dtStart)
      const endIcs = toIcsDateTime(dtEnd)

      let summary = ''
      let description = ''

      if (isAlerta) {
        const textoAlerta = notas.replace(/\[ALERTA[^\]]*\]/i, '').trim()
        summary = `🔔 ALERTA: ${pacienteNome} — ${textoAlerta || especialidade}`
        description =
          `LEMBRETE DE REAVALIAÇÃO DA CLÍNICA SOUL\\n` +
          `Paciente: ${escapeIcsText(pacienteNome)}\\n` +
          (pacienteTel ? `Telefone: ${escapeIcsText(pacienteTel)}\\n` : '') +
          `Especialidade: ${escapeIcsText(especialidade)}\\n` +
          `Objetivo do Alerta: ${escapeIcsText(textoAlerta || notas)}\\n` +
          `Status: ${escapeIcsText(status)}\\n` +
          `Sistema SOUL de Avaliação`
      } else {
        summary = `${pacienteNome} — ${especialidade}`
        description =
          `CONSULTA CLÍNICA SOUL\\n` +
          `Paciente: ${escapeIcsText(pacienteNome)}\\n` +
          (pacienteTel ? `Telefone: ${escapeIcsText(pacienteTel)}\\n` : '') +
          `Especialidade: ${escapeIcsText(especialidade)}\\n` +
          `Duração: ${duracaoMin} min\\n` +
          `Status: ${escapeIcsText(status)}\\n` +
          (notas ? `Notas: ${escapeIcsText(notas)}\\n` : '') +
          `Sistema SOUL de Avaliação`
      }

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:soul-consulta-${cId}@sistema-soul.goskip.dev`)
      lines.push(`DTSTAMP:${nowUtcStr}`)
      lines.push(`DTSTART:${startIcs}`)
      lines.push(`DTEND:${endIcs}`)
      lines.push(`SUMMARY:${escapeIcsText(summary)}`)
      lines.push(`DESCRIPTION:${description}`)
      lines.push(`STATUS:${status === 'Cancelada' ? 'CANCELLED' : 'CONFIRMED'}`)
      lines.push('LOCATION:Clínica SOUL')
      lines.push('TRANSP:OPAQUE')
      if (isAlerta) {
        lines.push('CATEGORIES:ALERTA,LEMBRETE')
      } else {
        lines.push(`CATEGORIES:${escapeIcsText(especialidade.toUpperCase())}`)
      }
      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')
    lines.push('') // Final CRLF

    const icsContent = lines.join('\r\n')

    // Definir headers corretos para clientes de calendário e download
    e.response.header().set('Content-Type', 'text/calendar; charset=utf-8')
    e.response.header().set('Content-Disposition', 'inline; filename="agenda-soul.ics"')
    e.response.header().set('Cache-Control', 'no-cache, no-store, must-revalidate')
    e.response.header().set('Access-Control-Allow-Origin', '*')

    return e.string(200, icsContent)
  } catch (err) {
    console.log('Erro no feed agenda_ics:', err)
    return e.string(500, 'Erro interno ao gerar feed do calendário')
  }
})
