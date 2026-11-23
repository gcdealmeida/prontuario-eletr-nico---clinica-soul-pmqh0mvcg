/**
 * Hook — criação da conta do Cliente Soul pela clínica.
 *
 * A Fase B exige que a clínica (ADM/Secretária) crie o acesso do cliente com
 * e-mail/senha. A coleção `users` tem createRule = '' (fechada no client — só
 * signup próprio ou admin), então a clínica cria a conta por este endpoint,
 * com role 'cliente' e access_status 'approved' direto, já vinculando o
 * saude_clientes ao paciente (se informado) e registrando log de auditoria.
 *
 * POST /backend/v1/saude/cliente/criar-conta
 * Body: { saude_cliente_id, email, password, nome? }
 * (staff autenticado via requireAuth; verificação de papel aqui dentro)
 */
routerAdd(
  'POST',
  '/backend/v1/saude/cliente/criar-conta',
  (e) => {
    try {
      const authUser = e.auth
      if (!authUser) {
        return e.unauthorizedError('Acesso negado: autenticação necessária.')
      }

      const authRole = authUser.getString('role')
      const authEmail = (authUser.getString('email') || '').toLowerCase().trim()
      const isStaff =
        authRole === 'adm' ||
        authRole === 'admin' ||
        authRole === 'secretaria' ||
        authEmail === 'gcdealmeida@gmail.com' ||
        authEmail === 'guivemax@hotmail.com'
      if (!isStaff) {
        return e.forbiddenError('Acesso restrito à equipe da clínica (ADM/Secretária).')
      }

      const body = e.requestInfo().body || {}
      const saudeClienteId = body.saude_cliente_id
      const email = String(body.email || '')
        .toLowerCase()
        .trim()
      const password = String(body.password || '')
      const nome = String(body.nome || '').trim()

      if (!saudeClienteId || !email || password.length < 8) {
        return e.json(400, {
          error: 'saude_cliente_id, e-mail e senha (mín. 8 caracteres) são obrigatórios.',
        })
      }

      let saudeCliente
      try {
        saudeCliente = $app.findRecordById('saude_clientes', saudeClienteId)
      } catch (_) {
        return e.json(404, { error: 'Cadastro de cliente de saúde não encontrado.' })
      }

      if (saudeCliente.getString('user_id')) {
        return e.json(400, { error: 'Este cliente já possui conta de acesso.' })
      }

      // E-mail já em uso?
      try {
        $app.findFirstRecordByFilter('users', 'email = {:email}', { email })
        return e.json(400, { error: 'Já existe uma conta com este e-mail.' })
      } catch (_) {
        // ok — não encontrou, pode criar
      }

      const usersCol = $app.findCollectionByNameOrId('users')
      const novaConta = new Record(usersCol)
      novaConta.set('email', email)
      novaConta.setPassword(password)
      novaConta.set('name', nome || saudeCliente.getString('nome'))
      novaConta.set('role', 'cliente')
      novaConta.set('access_status', 'approved')
      novaConta.set('verified', true)
      novaConta.set('requested_at', new Date().toISOString())
      novaConta.set('approved_at', new Date().toISOString())
      novaConta.set('approved_by', authEmail)
      try {
        $app.save(novaConta)
      } catch (errSave) {
        // Falha de validação do PocketBase (ex.: e-mail já em uso numa corrida
        // entre a checagem acima e o save, senha fraca, formato inválido).
        // Traduzimos para uma mensagem específica em vez do 500 genérico.
        console.log('Erro ao gravar users em saude/cliente/criar-conta:', errSave)
        return e.json(400, {
          error:
            'Não foi possível criar a conta: verifique se o e-mail já não está cadastrado e se a senha tem ao menos 8 caracteres.',
        })
      }

      saudeCliente.set('user_id', novaConta.id)
      if (!saudeCliente.getString('email')) {
        saudeCliente.set('email', email)
      }
      try {
        $app.save(saudeCliente)
      } catch (errVinculo) {
        // Sem o vínculo user_id o painel do cliente recusaria o login com
        // "Nenhum cadastro vinculado" — falha explícita, nunca silenciosa.
        console.log('Erro ao vincular saude_clientes em criar-conta:', errVinculo)
        return e.json(500, {
          error:
            'A conta foi criada, mas houve falha ao vinculá-la ao cadastro de cliente de saúde. Tente novamente ou refaça o vínculo pela clínica.',
          user_id: novaConta.id,
        })
      }

      // Log de auditoria (mesmo padrão de admin_access_manage.js)
      try {
        const logsCol = $app.findCollectionByNameOrId('access_logs')
        const logRec = new Record(logsCol)
        logRec.set('user_id', novaConta.id)
        logRec.set('user_email', email)
        logRec.set('user_name', novaConta.getString('name') || '')
        logRec.set('actor_id', authUser.id)
        logRec.set('actor_email', authEmail)
        logRec.set('action', 'saude_cliente_conta_criada')
        logRec.set(
          'details',
          'Conta do Cliente Soul criada pela clínica para ' +
            saudeCliente.getString('nome') +
            ' (' +
            email +
            ')',
        )
        $app.save(logRec)
      } catch (_) {}

      return e.json(200, {
        success: true,
        message: 'Conta do Cliente Soul criada com sucesso para ' + saudeCliente.getString('nome'),
        user_id: novaConta.id,
      })
    } catch (err) {
      console.log('Erro em saude/cliente/criar-conta:', err)
      return e.json(500, {
        error:
          err?.message || 'Falha ao criar conta do cliente. Verifique se o e-mail já não existe.',
      })
    }
  },
  $apis.requireAuth(),
)
