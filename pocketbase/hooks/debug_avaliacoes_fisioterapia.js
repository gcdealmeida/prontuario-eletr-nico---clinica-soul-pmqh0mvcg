/**
 * Hook para diagnóstico aprofundado de validação e requisições em avaliacoes_fisioterapia
 */

onRecordCreateRequest((e) => {
  const auth = e.auth

  console.log('[DEBUG avaliacoes_fisioterapia CREATE REQUEST INICIADO]')
  console.log('  Auth ID:', auth ? auth.id : 'NENHUM (unauthenticated)')
  console.log('  Auth Email:', auth ? auth.getString('email') : 'nenhum')
  console.log('  Auth Role:', auth ? auth.getString('role') : 'nenhuma')
  console.log('  Auth Status:', auth ? auth.getString('access_status') : 'nenhum')

  if (e.record) {
    try {
      console.log('  Record paciente_id:', e.record.getString('paciente_id'))
      console.log('  Record especialidade:', e.record.getString('especialidade'))
      console.log('  Record status:', e.record.getString('status'))
      console.log(
        '  Record queixa_principal:',
        e.record.getString('queixa_principal')?.slice(0, 80),
      )
      console.log('  Record user_id:', e.record.getString('user_id'))
      console.log('  Record data_avaliacao:', e.record.getString('data_avaliacao'))
      console.log(
        '  Record profissional_responsavel:',
        e.record.getString('profissional_responsavel'),
      )

      // Checar se há campos text muito longos
      const textFields = [
        'queixa_principal',
        'historia_doenca_atual',
        'historico_medico',
        'medicamentos',
        'cirurgias',
        'postura',
        'palpacao',
        'testes_especiais',
        'diagnostico_fisioterapeutico',
        'diagnostico_disfuncional',
        'hipotese_diagnostica_ia',
        'objetivos_tratamento',
        'plano_tratamento',
        'evolucao_nota',
        'profissional_responsavel',
        'forca_muscular_descricao',
        'fundamentacao_cientifica',
        'fundamentacao_cientifica_ia',
      ]
      for (let i = 0; i < textFields.length; i++) {
        const val = e.record.getString(textFields[i])
        if (val && val.length > 4000) {
          console.log('  [ALERTA TAMANHO] Campo', textFields[i], 'possui', val.length, 'caracteres')
        }
      }
    } catch (errDump) {
      console.log('  Erro ao inspecionar campos do record:', errDump)
    }
  }

  try {
    e.next()
    console.log(
      '[DEBUG avaliacoes_fisioterapia CREATE SUCESSO]: id =',
      e.record ? e.record.id : 'desconhecido',
    )
  } catch (err) {
    console.log('[DEBUG avaliacoes_fisioterapia CREATE ERRO CAPTURADO]:', err)
    if (err) {
      console.log('  err.message:', err.message)
      console.log('  err.status:', err.status)
      if (err.data) {
        console.log('  err.data (CAMPOS REJEITADOS):', JSON.stringify(err.data))
      }
      if (err.response) {
        console.log('  err.response:', JSON.stringify(err.response))
      }
    }
    throw err
  }
}, 'avaliacoes_fisioterapia')

onRecordUpdateRequest((e) => {
  console.log(
    '[DEBUG avaliacoes_fisioterapia UPDATE REQUEST INICIADO] id =',
    e.record ? e.record.id : 'desconhecido',
  )
  try {
    e.next()
    console.log('[DEBUG avaliacoes_fisioterapia UPDATE SUCESSO]')
  } catch (err) {
    console.log('[DEBUG avaliacoes_fisioterapia UPDATE ERRO CAPTURADO]:', err)
    if (err && err.data) {
      console.log('  err.data (CAMPOS REJEITADOS UPDATE):', JSON.stringify(err.data))
    }
    throw err
  }
}, 'avaliacoes_fisioterapia')
