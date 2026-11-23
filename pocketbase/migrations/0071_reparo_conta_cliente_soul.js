/**
 * 0071 — Reparo da conta de teste do Cliente Soul (guivemax@hotmail.com).
 *
 * Causa raiz: o e-mail guivemax@hotmail.com está na lista de e-mails "master
 * admin" dos hooks de ciclo de vida (user_access_lifecycle / auth_access_
 * enforcement). Quando a clínica criou o acesso do Cliente Soul para esse
 * e-mail, o hook promovia a conta para role 'admin' + approved_by
 * 'system_admin_rule' na gravação (e de novo a cada login), e o
 * saude_meu_painel — exclusivo de role='cliente' — recusava o painel com
 * "Nenhum cadastro de Cliente Soul vinculado a esta conta".
 *
 * Os hooks já foram corrigidos (nunca mais promovem conta role='cliente').
 * Esta migration repara os dados vivos de forma idempotente:
 *  1. toda conta role='cliente' volta a ser 'cliente' + approved (o backfill
 *     da 0060 tinha virado tudo 'adm' e o master-admin-rule virava 'admin');
 *  2. cadastro de saúde órfão (sem user_id) é religado à conta role='cliente'
 *     de mesmo e-mail; na falta de casamento por e-mail, o último usuário
 *     'cliente' sem cadastro é vinculado ao cadastro pendente mais antigo.
 */
migrate(
  (app) => {
    const nowIso = new Date().toISOString()

    // 1. Normaliza TODAS as contas role='cliente'.
    const contasCliente = app.findRecordsByFilter('users', "role = 'cliente'", '-created', 500)
    for (const conta of contasCliente) {
      let mudou = false
      if (conta.getString('access_status') !== 'approved') {
        conta.set('access_status', 'approved')
        mudou = true
      }
      if (!conta.getBool('verified')) {
        conta.set('verified', true)
        mudou = true
      }
      if (mudou) app.save(conta)
    }

    // 2. Religação de cadastros órfãos.
    const cadastros = app.findRecordsByFilter('saude_clientes', "user_id = ''", '-created', 500)
    const clientesSemCadastro = app
      .findRecordsByFilter('users', "role = 'cliente'", '-created', 500)
      .filter((u) => {
        try {
          app.findFirstRecordByFilter('saude_clientes', 'user_id = {:uid}', { uid: u.id })
          return false
        } catch (_) {
          return true
        }
      })

    const porEmail = (cadastro) => {
      const email = (cadastro.getString('email') || '').toLowerCase().trim()
      if (!email) return null
      try {
        return app.findFirstRecordByFilter('users', "role = 'cliente' && email = {:email}", {
          email,
        })
      } catch (_) {
        return null
      }
    }

    for (const cadastro of cadastros) {
      let conta = porEmail(cadastro)
      if (!conta && clientesSemCadastro.length > 0) {
        conta = clientesSemCadastro.shift()
      }
      if (!conta) break
      cadastro.set('user_id', conta.id)
      if (!cadastro.getString('email')) cadastro.set('email', conta.getString('email'))
      app.save(cadastro)
      console.log(
        '0071: saude_clientes',
        cadastro.id,
        'religado a users',
        conta.id,
        'por',
        conta.getString('email') ? 'e-mail' : 'fila de órfãos',
      )
    }

    // 3. Caso concreto do relato: a conta de teste virou 'admin' e o cadastro
    //    ficou apontando para ela. Repare a conta (não tocamos no cadastro —
    //    o vínculo por user_id já está correto).
    try {
      const teste = app.findFirstRecordByFilter('users', 'email = {:email}', {
        email: 'guivemax@hotmail.com',
      })
      if (teste && teste.getString('role') === 'admin') {
        // só repromove se o cadastro de saúde dela existir (não é admin da clínica real)
        const cadastroVinculado = (() => {
          try {
            return app.findFirstRecordByFilter('saude_clientes', 'user_id = {:uid}', {
              uid: teste.id,
            })
          } catch (_) {
            return null
          }
        })()
        if (cadastroVinculado) {
          teste.set('role', 'cliente')
          teste.set('access_status', 'approved')
          teste.set('verified', true)
          teste.set('approved_by', 'migracao_0071')
          app.save(teste)
          console.log('0071: conta de teste rebaixada a role cliente:', teste.id)
        }
      }
    } catch (_) {}
    void nowIso
  },
  (app) => {
    // Reverte: nada estrutural foi alterado — sem volta possível de dados.
    void app
  },
)
