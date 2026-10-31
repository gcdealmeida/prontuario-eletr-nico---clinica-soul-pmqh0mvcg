/**
 * Hook para automação de lançamento de Presença / Confirmação na Clínica SOUL
 *
 * NOTA: Cada callback possui sua lógica 100% inline para conformidade com a Goja JSVM do Skip Cloud.
 *
 * Regras:
 * 1. Ao ASSINAR uma evolução (status Finalizada ou documento_fechado = true), cria presença automática.
 * 2. Ao CONCLUIR uma avaliação (status Concluída), cria presença automática.
 * 3. 13 serviços oficiais da SOUL:
 *    - Fisioterapia evolução: 'Sessão Fisioterapia'
 *    - Personal evolução: 'Personal Individual'
 *    - Nutrição evolução/avaliação: 'Nutricionista'
 *    - Osteopatia: 'Sessão Osteopatia'
 *    - Pilates: 'Pilates Performance'
 *    - Avaliação Fisioterapia/Personal: 'Avaliação Física e Funcional'
 *    - Avaliação Médica / Geral: 'Avaliação Inicial'
 * 4. Status = 'Presente', profissional = responsável, deduplicação por paciente + data + identificador de origem.
 */

// 1. evolucoes - Create (Finalizada / Fechada)
onRecordAfterCreateSuccess((e) => {
  try {
    const rec = e.record
    const st = rec.getString('status')
    const fechado = rec.getBool('documento_fechado') || st === 'Finalizada'

    if (fechado) {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        // Data formatada YYYY-MM-DD
        const rawDate = rec.getString('data_evolucao') || rec.getString('assinado_em') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) {
          dataYmd = new Date().toISOString().split('T')[0]
        }
        const dataAtend = dataYmd + ' 12:00:00'

        // Especialidade -> Serviço Oficial
        const esp = (rec.getString('especialidade') || 'Fisioterapia').trim()
        const espLower = esp.toLowerCase()
        let areaServico = 'Sessão Fisioterapia'
        if (espLower.indexOf('personal') >= 0) areaServico = 'Personal Individual'
        else if (espLower.indexOf('nutri') >= 0) areaServico = 'Nutricionista'
        else if (espLower.indexOf('osteopatia') >= 0) areaServico = 'Sessão Osteopatia'
        else if (espLower.indexOf('pilates') >= 0) areaServico = 'Pilates Performance'
        else if (espLower.indexOf('medico') >= 0 || espLower.indexOf('médico') >= 0)
          areaServico = 'Avaliação Inicial'

        const regNum = rec.getString('numero_registro') || 'EVO-' + rec.id
        const obsTexto = 'Gerado automaticamente pela evolução ' + regNum

        // Deduplicação 1: Checa se já existe presença com este regNum nas observações
        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regNum },
          )
          if (buscaOrigem && buscaOrigem.length > 0) {
            jaExiste = true
          }
        } catch (_) {}

        // Deduplicação 2: Checa se já existe presença pro mesmo paciente no mesmo dia na mesma área
        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) {
              jaExiste = true
            }
          } catch (_) {}
        }

        if (!jaExiste) {
          // Nome do paciente
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          // Profissional
          let profId = rec.getString('assinado_por_user_id') || ''
          let profNome = rec.getString('assinado_por_nome') || rec.getString('profissional') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            const horEvo = rec.getString('horario')
            if (horEvo) {
              presRec.set('horario', horEvo)
            }
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', esp)
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca evolucoes create: ' + err)
  }

  e.next()
}, 'evolucoes')

// 2. evolucoes - Update (Transição de Rascunho para Finalizada/Assinada)
onRecordAfterUpdateSuccess((e) => {
  try {
    const rec = e.record
    const original = rec.original()
    const origFechado = original
      ? original.getBool('documento_fechado') || original.getString('status') === 'Finalizada'
      : false

    const st = rec.getString('status')
    const agoraFechado = rec.getBool('documento_fechado') || st === 'Finalizada'

    if (agoraFechado && !origFechado) {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_evolucao') || rec.getString('assinado_em') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) {
          dataYmd = new Date().toISOString().split('T')[0]
        }
        const dataAtend = dataYmd + ' 12:00:00'

        const esp = (rec.getString('especialidade') || 'Fisioterapia').trim()
        const espLower = esp.toLowerCase()
        let areaServico = 'Sessão Fisioterapia'
        if (espLower.indexOf('personal') >= 0) areaServico = 'Personal Individual'
        else if (espLower.indexOf('nutri') >= 0) areaServico = 'Nutricionista'
        else if (espLower.indexOf('osteopatia') >= 0) areaServico = 'Sessão Osteopatia'
        else if (espLower.indexOf('pilates') >= 0) areaServico = 'Pilates Performance'
        else if (espLower.indexOf('medico') >= 0 || espLower.indexOf('médico') >= 0)
          areaServico = 'Avaliação Inicial'

        const regNum = rec.getString('numero_registro') || 'EVO-' + rec.id
        const obsTexto = 'Gerado automaticamente pela evolução ' + regNum

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regNum },
          )
          if (buscaOrigem && buscaOrigem.length > 0) {
            jaExiste = true
          }
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) {
              jaExiste = true
            }
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('assinado_por_user_id') || ''
          let profNome = rec.getString('assinado_por_nome') || rec.getString('profissional') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            const horEvo = rec.getString('horario')
            if (horEvo) {
              presRec.set('horario', horEvo)
            }
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', esp)
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca evolucoes update: ' + err)
  }

  e.next()
}, 'evolucoes')

// 3. avaliacoes_fisioterapia - Create (Concluída)
onRecordAfterCreateSuccess((e) => {
  try {
    const rec = e.record
    if (rec.getString('status') === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Avaliação Física e Funcional'
        const regOrigem = 'AVAL-FISIO-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação de Fisioterapia (' + regOrigem + ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Fisioterapia')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca fisio create: ' + err)
  }

  e.next()
}, 'avaliacoes_fisioterapia')

// 4. avaliacoes_fisioterapia - Update (Rascunho para Concluída)
onRecordAfterUpdateSuccess((e) => {
  try {
    const rec = e.record
    const original = rec.original()
    const origStatus = original ? original.getString('status') : ''
    const novoStatus = rec.getString('status')

    if (origStatus !== 'Concluída' && novoStatus === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Avaliação Física e Funcional'
        const regOrigem = 'AVAL-FISIO-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação de Fisioterapia (' + regOrigem + ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Fisioterapia')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca fisio update: ' + err)
  }

  e.next()
}, 'avaliacoes_fisioterapia')

// 5. avaliacoes_personal - Create & Update (Concluída)
onRecordAfterCreateSuccess((e) => {
  try {
    const rec = e.record
    if (rec.getString('status') === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Avaliação Física e Funcional'
        const regOrigem = 'AVAL-PERSONAL-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação de Personal Trainer (' +
          regOrigem +
          ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Personal Trainer')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca personal create: ' + err)
  }

  e.next()
}, 'avaliacoes_personal')

onRecordAfterUpdateSuccess((e) => {
  try {
    const rec = e.record
    const original = rec.original()
    const origStatus = original ? original.getString('status') : ''
    const novoStatus = rec.getString('status')

    if (origStatus !== 'Concluída' && novoStatus === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Avaliação Física e Funcional'
        const regOrigem = 'AVAL-PERSONAL-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação de Personal Trainer (' +
          regOrigem +
          ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Personal Trainer')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca personal update: ' + err)
  }

  e.next()
}, 'avaliacoes_personal')

// 6. avaliacoes_nutricao - Create & Update (Concluída)
onRecordAfterCreateSuccess((e) => {
  try {
    const rec = e.record
    if (rec.getString('status') === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Nutricionista'
        const regOrigem = 'AVAL-NUTRI-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação de Nutrição (' + regOrigem + ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Nutrição')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca nutri create: ' + err)
  }

  e.next()
}, 'avaliacoes_nutricao')

onRecordAfterUpdateSuccess((e) => {
  try {
    const rec = e.record
    const original = rec.original()
    const origStatus = original ? original.getString('status') : ''
    const novoStatus = rec.getString('status')

    if (origStatus !== 'Concluída' && novoStatus === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Nutricionista'
        const regOrigem = 'AVAL-NUTRI-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação de Nutrição (' + regOrigem + ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Nutrição')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca nutri update: ' + err)
  }

  e.next()
}, 'avaliacoes_nutricao')

// 7. avaliacoes_medico - Create & Update (Concluída)
onRecordAfterCreateSuccess((e) => {
  try {
    const rec = e.record
    if (rec.getString('status') === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Avaliação Inicial'
        const regOrigem = 'AVAL-MED-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação Médica (' + regOrigem + ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Médico')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca medico create: ' + err)
  }

  e.next()
}, 'avaliacoes_medico')

onRecordAfterUpdateSuccess((e) => {
  try {
    const rec = e.record
    const original = rec.original()
    const origStatus = original ? original.getString('status') : ''
    const novoStatus = rec.getString('status')

    if (origStatus !== 'Concluída' && novoStatus === 'Concluída') {
      const pacienteId = rec.getString('paciente_id')
      if (pacienteId) {
        const rawDate = rec.getString('data_avaliacao') || ''
        let dataYmd = ''
        if (rawDate) {
          if (rawDate.indexOf('T') > 0) dataYmd = rawDate.split('T')[0]
          else if (rawDate.indexOf(' ') > 0) dataYmd = rawDate.split(' ')[0]
          else dataYmd = rawDate.slice(0, 10)
        }
        if (!dataYmd) dataYmd = new Date().toISOString().split('T')[0]
        const dataAtend = dataYmd + ' 12:00:00'

        const areaServico = 'Avaliação Inicial'
        const regOrigem = 'AVAL-MED-' + rec.id
        const obsTexto =
          'Gerado automaticamente pela conclusão da avaliação Médica (' + regOrigem + ')'

        let jaExiste = false
        try {
          const buscaOrigem = $app.findRecordsByFilter(
            'presencas',
            'paciente_id = {:pacId} && observacoes ~ {:origem}',
            '-created',
            1,
            0,
            { pacId: pacienteId, origem: regOrigem },
          )
          if (buscaOrigem && buscaOrigem.length > 0) jaExiste = true
        } catch (_) {}

        if (!jaExiste) {
          try {
            const buscaDia = $app.findRecordsByFilter(
              'presencas',
              'paciente_id = {:pacId} && area_servico = {:area} && data_atendimento >= {:dtIni} && data_atendimento <= {:dtFim}',
              '-created',
              1,
              0,
              {
                pacId: pacienteId,
                area: areaServico,
                dtIni: dataYmd + ' 00:00:00',
                dtFim: dataYmd + ' 23:59:59',
              },
            )
            if (buscaDia && buscaDia.length > 0) jaExiste = true
          } catch (_) {}
        }

        if (!jaExiste) {
          let pacNome = ''
          try {
            const pac = $app.findRecordById('pacientes', pacienteId)
            if (pac) pacNome = pac.getString('nome') || ''
          } catch (_) {}

          let profId = rec.getString('user_id') || ''
          let profNome = rec.getString('profissional_responsavel') || ''

          if (!profId && profNome) {
            try {
              const users = $app.findRecordsByFilter(
                'users',
                'access_status = "approved"',
                '-created',
                50,
                0,
              )
              const pNorm = profNome.toLowerCase()
              for (let i = 0; i < users.length; i++) {
                const uName = (users[i].getString('name') || '').toLowerCase()
                if (uName && (uName.indexOf(pNorm) >= 0 || pNorm.indexOf(uName) >= 0)) {
                  profId = users[i].id
                  profNome = users[i].getString('name') || profNome
                  break
                }
              }
            } catch (_) {}
          }

          if (!profId) {
            try {
              const adm = $app.findFirstRecordByData('users', 'email', 'gcdealmeida@gmail.com')
              if (adm) {
                profId = adm.id
                if (!profNome) profNome = adm.getString('name') || 'Dr. Guilherme (Admin)'
              }
            } catch (_) {}
          }

          if (profId) {
            const presCol = $app.findCollectionByNameOrId('presencas')
            const presRec = new Record(presCol)
            presRec.set('paciente_id', pacienteId)
            presRec.set('profissional_id', profId)
            presRec.set('data_atendimento', dataAtend)
            presRec.set('area_servico', areaServico)
            presRec.set('detalhe_servico', 'Médico')
            presRec.set('observacoes', obsTexto)
            presRec.set('status', 'Presente')
            if (pacNome) presRec.set('paciente_nome', pacNome)
            if (profNome) presRec.set('profissional_nome', profNome)
            $app.save(presRec)
          }
        }
      }
    }
  } catch (err) {
    console.log('Erro hook presenca medico update: ' + err)
  }

  e.next()
}, 'avaliacoes_medico')
