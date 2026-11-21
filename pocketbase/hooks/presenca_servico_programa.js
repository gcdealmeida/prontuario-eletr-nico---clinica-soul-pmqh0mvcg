/**
 * Hook presenca_servico_programa — Clínica SOUL
 *
 * Garante que TODA presença gravada no app tenha os campos de relatório:
 * - servico: nome do serviço (espelho de area_servico, já usada em relatórios)
 * - programa: nome do programa de acompanhamento ATIVO do paciente no dia
 *   da presença (quando existir).
 *
 * Roda em create E update, cobrindo os três caminhos de gravação:
 * 1. Modal manual em /presencas (createPresenca/updatePresenca)
 * 2. garantirPresencaAutomatica (evolução assinada / avaliação concluída)
 * 3. Hook presenca_automatica.js (avaliações que geram presença no backend)
 *
 * Como o callback da JSVM não acessa funções de nível superior, toda a
 * lógica fica inline no callback.
 */
onRecordCreate((e) => {
  try {
    const rec = e.record
    const col = $app.findCollectionByNameOrId('presencas')

    // --- servico: espelha area_servico (normalizada) se não veio do cliente
    if (!rec.getString('servico')) {
      const area = rec.getString('area_servico') || ''
      if (area) rec.set('servico', area.trim())
    }

    // --- programa: programa ativo do paciente na data da presença
    const pacienteId = rec.getString('paciente_id') || ''
    if (pacienteId && !rec.getString('programa')) {
      const rawDate = rec.getString('data_atendimento') || ''
      const dataYmd = rawDate ? rawDate.split(' ')[0].split('T')[0] : ''

      let filtro = 'paciente_id = {:pacId} && status = "ativo"'
      if (dataYmd) {
        filtro += ' && (data_inicio = "" || data_inicio <= {:d})'
      }
      const progs = $app.findRecordsByFilter('programa_acompanhamento', filtro, '-created', 1, 0, {
        pacId: pacienteId,
        d: dataYmd,
      })
      if (progs && progs.length > 0) {
        rec.set('programa', progs[0].getString('nome') || '')
      }
    }

    if (rec.getString('servico') && !col.fields.getByIdx) {
      // noop — mantém compatibilidade caso a coleção ainda não tenha o campo
    }
  } catch (err) {
    console.log('Erro hook presenca_servico_programa (create): ' + err)
  }
  e.next()
}, 'presencas')

onRecordUpdate((e) => {
  try {
    const rec = e.record
    if (!rec.getString('servico')) {
      const area = rec.getString('area_servico') || ''
      if (area) rec.set('servico', area.trim())
    }

    const pacienteId = rec.getString('paciente_id') || ''
    if (pacienteId && !rec.getString('programa')) {
      const rawDate = rec.getString('data_atendimento') || ''
      const dataYmd = rawDate ? rawDate.split(' ')[0].split('T')[0] : ''

      let filtro = 'paciente_id = {:pacId} && status = "ativo"'
      if (dataYmd) {
        filtro += ' && (data_inicio = "" || data_inicio <= {:d})'
      }
      const progs = $app.findRecordsByFilter('programa_acompanhamento', filtro, '-created', 1, 0, {
        pacId: pacienteId,
        d: dataYmd,
      })
      if (progs && progs.length > 0) {
        rec.set('programa', progs[0].getString('nome') || '')
      }
    }
  } catch (err) {
    console.log('Erro hook presenca_servico_programa (update): ' + err)
  }
  e.next()
}, 'presencas')
