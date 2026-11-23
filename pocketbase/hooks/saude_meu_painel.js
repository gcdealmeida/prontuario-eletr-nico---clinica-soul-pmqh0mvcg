/**
 * Hook — painel do Cliente Soul (app do cliente).
 *
 * GET /backend/v1/saude/cliente/meu-painel
 * Retorna o saude_clientes do usuário logado (role 'cliente') com todos os
 * seus registros de saúde, orientações/dicas/exames publicadas, lembretes e
 * desafios de desenvolvimento pessoal. As API rules das coleções saude_*
 * (0066/0067) já garantem que o cliente só lê os próprios dados; este endpoint
 * apenas monta o payload num único request (equivalente ao profile/dashboard
 * do health-tracker de referência).
 */
routerAdd('GET', '/backend/v1/saude/cliente/meu-painel', (e) => {
  const auth = e.auth
  if (!auth) {
    return e.unauthorizedError('Autenticação necessária.')
  }
  if (auth.getString('role') !== 'cliente') {
    return e.forbiddenError('Endpoint exclusivo do Cliente Soul.')
  }

  let cliente
  try {
    cliente = $app.findFirstRecordByFilter('saude_clientes', 'user_id = {:uid}', { uid: auth.id })
  } catch (_) {
    cliente = null
  }
  if (!cliente) {
    // Reparo idempotente: conta 'cliente' sem cadastro vinculado (ex.: gravação
    // do vínculo falhou na criação). Casa pelo e-mail num cadastro ainda sem
    // conta e vincula — se não houver, aí sim recusa com a mensagem clara.
    const authEmail = (auth.getString('email') || '').toLowerCase().trim()
    if (authEmail) {
      try {
        const candidato = $app.findFirstRecordByFilter(
          'saude_clientes',
          "user_id = '' && email = {:email}",
          { email: authEmail },
        )
        candidato.set('user_id', auth.id)
        $app.save(candidato)
        cliente = candidato
        console.log('saude_meu_painel: vínculo reparado por e-mail para', authEmail)
      } catch (_) {
        cliente = null
      }
    }
  }
  if (!cliente) {
    return e.json(404, { error: 'Nenhum cadastro de Cliente Soul vinculado a esta conta.' })
  }

  const registros = $app.findRecordsByFilter(
    'saude_registros',
    'cliente_id = {:cid}',
    '-data,-created',
    500,
    0,
    { cid: cliente.id },
  )
  const orientacoes = $app.findRecordsByFilter(
    'saude_orientacoes',
    'publicada = true && (cliente_id = "" || cliente_id = {:cid})',
    '-data,-created',
    200,
    0,
    { cid: cliente.id },
  )
  const lembretes = $app.findRecordsByFilter(
    'saude_lembretes',
    'cliente_id = {:cid}',
    'data_hora',
    200,
    0,
    { cid: cliente.id },
  )
  const devPessoal = $app.findRecordsByFilter(
    'saude_dev_pessoal',
    'cliente_id = {:cid}',
    '-created',
    200,
    0,
    { cid: cliente.id },
  )

  return e.json(200, {
    cliente: cliente.publicExport(),
    registros: registros.map((r) => r.publicExport()),
    orientacoes: orientacoes.map((r) => r.publicExport()),
    lembretes: lembretes.map((r) => r.publicExport()),
    dev_pessoal: devPessoal.map((r) => r.publicExport()),
  })
})
