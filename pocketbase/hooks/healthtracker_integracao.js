/**
 * Hook — Integração de confiança com o app Health Tracker da clínica
 * (outro projeto Skip).
 *
 * O Health Tracker expõe uma API de confiança:
 *   (1) assinatura HMAC-SHA256 de "email|ts" (ts = epoch ms, tolerância 5 min)
 *       com a env var INSTITUTIONAL_TRUST_SECRET;
 *   (2) POST /backend/v1/trust/token  {email, ts, sig} → token de sessão;
 *   (3) GET  /backend/v1/trust/patients/{email}/summary, header
 *       "Authorization: <token>" (sem Bearer) → resumo das áreas do cliente;
 *   (4) POST /backend/v1/trust/patients/{email}/records
 *       {collection, professional_name, data} → grava registro no cliente,
 *       identificado como "via app institucional".
 *
 * O SEGREDO NUNCA vai ao frontend: este hook assina, troca o token e repassa
 * os dados. O frontend chama apenas as rotas internas deste projeto:
 *   GET  /backend/v1/healthtracker/summary?cliente=<saude_clientes.id>
 *   POST /backend/v1/healthtracker/record  {cliente_id, collection, tipo, payload}
 *
 * Segurança de acesso (não pode regredir): o profissional só acessa clientes
 * designados a ele em vinculos_pacientes (paciente_id do saude_clientes —
 * mesmo padrão da migration 0064); ADM/Secretária acessam todos.
 *
 * Nota sobre o segredo: a variável está gravada no painel como
 * "NSTITUTIONAL_TRUST_SECRET" (sem o "I" inicial). Lemos primeiro o nome
 * correto e depois o gravado; sem nenhum dos dois, a rota responde erro
 * claro (503) em vez de falhar silenciosamente.
 *
 * Primitiva de HMAC: $security.hs256(s, secret) — disponível na JSVM desta
 * instância (ver lista de globals da skill skip-cloud/coding).
 *
 * IMPORTANTE (JSVM do PocketBase): callbacks de rota rodam num pool de VMs
 * separado — NADA do topo do arquivo (const/function) é visível dentro dos
 * callbacks. Por isso toda a lógica e as constantes estão INLINE nos
 * callbacks, inclusive o cache de token (objeto criado dentro de cada
 * callback; se o pool não compartilhar estado entre requests, o efeito é
 * apenas refazer o handshake — nunca um erro).
 */

routerAdd(
  'GET',
  '/backend/v1/healthtracker/summary',
  (e) => {
    const HT_BASE = 'https://clinica-soul-health-tracker-333e7.shrd01.internal.goskip.dev'
    const HT_TOKEN_TTL_MS = 4 * 60 * 1000 // renova antes da tolerância de 5 min
    const HT_TOKEN_CACHE = { token: '', expiraEm: 0 }

    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária.')

    const clienteId = String((e.requestInfo().query || {}).cliente || '')
    if (!clienteId) {
      return e.json(400, { error: 'Parâmetro cliente é obrigatório.' })
    }

    const role = auth.getString('role') || ''
    const authEmail = (auth.getString('email') || '').toLowerCase().trim()
    console.log(
      '[HealthTracker] summary: chamada recebida — cliente=' +
        clienteId +
        ' role=' +
        role +
        ' auth=' +
        authEmail,
    )

    let cliente
    try {
      cliente = $app.findRecordById('saude_clientes', clienteId)
    } catch (_) {
      return e.json(404, { error: 'Cliente de saúde não encontrado.' })
    }

    // ----- Autorização (mesma política da área Saúde & Bem-Estar) -----
    const isAdm = role === 'adm' || role === 'admin'
    const isSecretaria = role === 'secretaria'
    const isProfissional = role === 'profissional' || role === 'professional'
    const isMaster = authEmail === 'gcdealmeida@gmail.com' || authEmail === 'guivemax@hotmail.com'
    if (role === 'cliente') {
      return e.forbiddenError('Área exclusiva da equipe clínica.')
    }
    if (!isAdm && !isSecretaria && !isMaster && !isProfissional) {
      return e.forbiddenError('Acesso negado.')
    }
    if (isProfissional && !isAdm && !isSecretaria) {
      // Profissional: só clientes designados a ele (vínculo ativo em
      // vinculos_pacientes via paciente_id do saude_clientes — padrão 0064).
      const pacienteId = cliente.getString('paciente_id')
      if (!pacienteId) {
        return e.forbiddenError(
          'Este cliente não está designado a você — fale com a administração da clínica.',
        )
      }
      try {
        $app.findFirstRecordByFilter(
          'vinculos_pacientes',
          'profissional_id = {:pid} && paciente_id = {:pac} && status = "ativo"',
          { pid: auth.id, pac: pacienteId },
        )
      } catch (_) {
        return e.forbiddenError(
          'Este cliente não está designado a você — fale com a administração da clínica.',
        )
      }
    }

    // ----- E-mail do cliente no Health Tracker -----
    const email = (cliente.getString('email') || '').toLowerCase().trim()
    if (!email) {
      return e.json(400, {
        error:
          'Este cliente não tem e-mail cadastrado — não é possível buscar os dados do Health Tracker.',
      })
    }

    // ----- Handshake de confiança (passos 1 e 2) -----
    const segredo =
      String($os.getenv('INSTITUTIONAL_TRUST_SECRET') || '').trim() ||
      String($os.getenv('NSTITUTIONAL_TRUST_SECRET') || '').trim()
    if (!segredo) {
      return e.json(503, {
        error:
          'Integração com o Health Tracker não configurada: variável INSTITUTIONAL_TRUST_SECRET ausente.',
      })
    }

    let token = ''
    if (HT_TOKEN_CACHE.token && Date.now() < HT_TOKEN_CACHE.expiraEm) {
      token = HT_TOKEN_CACHE.token
    } else {
      const ts = String(Date.now())
      let sig
      try {
        sig = $security.hs256(email + '|' + ts, segredo)
      } catch (errHmac) {
        console.log('healthtracker: falha ao gerar HMAC:', errHmac)
        return e.json(502, {
          error: 'Falha ao gerar a assinatura de confiança para o Health Tracker.',
        })
      }
      let respToken
      try {
        respToken = $http.send({
          url: HT_BASE + '/backend/v1/trust/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, ts: ts, sig: sig }),
        })
      } catch (errHttp) {
        console.log('healthtracker: falha de rede no handshake:', errHttp)
        return e.json(502, { error: 'Health Tracker indisponível (handshake).' })
      }
      const stToken = respToken.statusCode || respToken.status || 0
      let dadosToken = respToken.json
      if (typeof dadosToken === 'string') {
        try {
          dadosToken = JSON.parse(dadosToken)
        } catch (_) {
          dadosToken = null
        }
      }
      if (stToken < 200 || stToken >= 300) {
        const msg =
          dadosToken && dadosToken.error
            ? String(dadosToken.error)
            : 'Health Tracker recusou o handshake de confiança (HTTP ' + stToken + ').'
        return e.json(502, { error: msg })
      }
      token = String(
        (dadosToken && (dadosToken.token || dadosToken.session_token || dadosToken.access_token)) ||
          '',
      )
      if (!token) {
        return e.json(502, { error: 'Health Tracker não devolveu token de sessão no handshake.' })
      }
      // Guarda um pouco menos que a tolerância de 5 min para nunca usar um
      // ts que já saiu da janela.
      HT_TOKEN_CACHE.token = token
      HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
    }

    // ----- Chamada ao summary (passo 3), com renovação única em 401/403 -----
    const chamarSummary = () => {
      const resp = $http.send({
        url: HT_BASE + '/backend/v1/trust/patients/' + encodeURIComponent(email) + '/summary',
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: token },
      })
      const st = resp.statusCode || resp.status || 0
      let dados = resp.json
      if (typeof dados === 'string') {
        try {
          dados = JSON.parse(dados)
        } catch (_) {
          dados = null
        }
      }
      return { status: st, dados: dados }
    }

    try {
      let r = chamarSummary()
      if (r.status === 401 || r.status === 403) {
        // Token possivelmente expirado: invalida o cache, refaz o handshake
        // UMA vez e tenta de novo.
        HT_TOKEN_CACHE.token = ''
        HT_TOKEN_CACHE.expiraEm = 0
        token = ''
        const ts2 = String(Date.now())
        const sig2 = $security.hs256(email + '|' + ts2, segredo)
        const respToken2 = $http.send({
          url: HT_BASE + '/backend/v1/trust/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, ts: ts2, sig: sig2 }),
        })
        const stToken2 = respToken2.statusCode || respToken2.status || 0
        let dadosToken2 = respToken2.json
        if (typeof dadosToken2 === 'string') {
          try {
            dadosToken2 = JSON.parse(dadosToken2)
          } catch (_) {
            dadosToken2 = null
          }
        }
        const token2 = String(
          (dadosToken2 &&
            (dadosToken2.token || dadosToken2.session_token || dadosToken2.access_token)) ||
            '',
        )
        if (token2 && stToken2 >= 200 && stToken2 < 300) {
          HT_TOKEN_CACHE.token = token2
          HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
          token = token2
          r = chamarSummary()
        }
      }

      if (r.status === 404) {
        // Cliente ainda não existe no outro projeto (e-mail sem conta lá):
        // 404 específico para o frontend mostrar o estado vazio explicativo.
        console.log('[HealthTracker] summary: cliente sem cadastro no Health Tracker — ' + email)
        return e.json(404, { error: 'Cliente sem cadastro no Health Tracker.' })
      }
      if (r.status < 200 || r.status >= 300) {
        const msg =
          r.dados && r.dados.error
            ? String(r.dados.error)
            : 'Health Tracker respondeu HTTP ' + r.status + '.'
        console.log('[HealthTracker] summary: falha — HTTP ' + r.status + ': ' + msg)
        return e.json(502, { error: msg })
      }
      console.log('[HealthTracker] summary: OK para ' + email)
      return e.json(200, { health_tracker: r.dados || {}, cliente_email: email })
    } catch (err) {
      console.log('[HealthTracker] summary: erro inesperado:', err)
      return e.json(502, {
        error: (err && err.message) || 'Não foi possível obter os dados do Health Tracker agora.',
      })
    }
  },
  $apis.requireAuth(),
)

/* ------------------------------------------------------------------ */
/* Rota 2 — registro (passo 4): POST /backend/v1/healthtracker/record  */
/* Body: { cliente_id, collection, tipo, payload, professional_name }  */
/* ------------------------------------------------------------------ */
routerAdd(
  'POST',
  '/backend/v1/healthtracker/record',
  (e) => {
    const HT_BASE = 'https://clinica-soul-health-tracker-333e7.shrd01.internal.goskip.dev'
    const HT_TOKEN_TTL_MS = 4 * 60 * 1000
    const HT_TOKEN_CACHE = { token: '', expiraEm: 0 }

    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária.')

    const body = e.requestInfo().body || {}
    const clienteId = String(body.cliente_id || '')
    const collection = String(body.collection || '')
    const tipo = String(body.tipo || '')
    const payload = body.payload || {}
    const professionalName = String(body.professional_name || '')
    console.log(
      '[HealthTracker] record: chamada recebida — cliente=' +
        clienteId +
        ' collection=' +
        collection +
        ' tipo=' +
        tipo +
        ' role=' +
        role,
    )

    if (!clienteId || !collection) {
      return e.json(400, { error: 'cliente_id e collection são obrigatórios.' })
    }

    const role = auth.getString('role') || ''
    const authEmail = (auth.getString('email') || '').toLowerCase().trim()

    let cliente
    try {
      cliente = $app.findRecordById('saude_clientes', clienteId)
    } catch (_) {
      return e.json(404, { error: 'Cliente de saúde não encontrado.' })
    }

    // ----- Autorização (idêntica à rota de summary) -----
    const isAdm = role === 'adm' || role === 'admin'
    const isSecretaria = role === 'secretaria'
    const isProfissional = role === 'profissional' || role === 'professional'
    const isMaster = authEmail === 'gcdealmeida@gmail.com' || authEmail === 'guivemax@hotmail.com'
    if (role === 'cliente') {
      return e.forbiddenError('Área exclusiva da equipe clínica.')
    }
    if (!isAdm && !isSecretaria && !isMaster && !isProfissional) {
      return e.forbiddenError('Acesso negado.')
    }
    if (isProfissional && !isAdm && !isSecretaria) {
      const pacienteId = cliente.getString('paciente_id')
      if (!pacienteId) {
        return e.forbiddenError(
          'Este cliente não está designado a você — fale com a administração da clínica.',
        )
      }
      try {
        $app.findFirstRecordByFilter(
          'vinculos_pacientes',
          'profissional_id = {:pid} && paciente_id = {:pac} && status = "ativo"',
          { pid: auth.id, pac: pacienteId },
        )
      } catch (_) {
        return e.forbiddenError(
          'Este cliente não está designado a você — fale com a administração da clínica.',
        )
      }
    }

    // ----- E-mail do cliente no Health Tracker -----
    const email = (cliente.getString('email') || '').toLowerCase().trim()
    if (!email) {
      return e.json(400, {
        error: 'Este cliente não tem e-mail cadastrado — não é possível gravar no Health Tracker.',
      })
    }

    const nomeProf = professionalName || auth.getString('name') || ''

    // ----- Handshake de confiança (passos 1 e 2) -----
    const segredo =
      String($os.getenv('INSTITUTIONAL_TRUST_SECRET') || '').trim() ||
      String($os.getenv('NSTITUTIONAL_TRUST_SECRET') || '').trim()
    if (!segredo) {
      return e.json(503, {
        error:
          'Integração com o Health Tracker não configurada: variável INSTITUTIONAL_TRUST_SECRET ausente.',
      })
    }

    let token = ''
    if (HT_TOKEN_CACHE.token && Date.now() < HT_TOKEN_CACHE.expiraEm) {
      token = HT_TOKEN_CACHE.token
    } else {
      const ts = String(Date.now())
      let sig
      try {
        sig = $security.hs256(email + '|' + ts, segredo)
      } catch (errHmac) {
        console.log('healthtracker: falha ao gerar HMAC:', errHmac)
        return e.json(502, {
          error: 'Falha ao gerar a assinatura de confiança para o Health Tracker.',
        })
      }
      let respToken
      try {
        respToken = $http.send({
          url: HT_BASE + '/backend/v1/trust/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, ts: ts, sig: sig }),
        })
      } catch (errHttp) {
        console.log('healthtracker: falha de rede no handshake:', errHttp)
        return e.json(502, { error: 'Health Tracker indisponível (handshake).' })
      }
      const stToken = respToken.statusCode || respToken.status || 0
      let dadosToken = respToken.json
      if (typeof dadosToken === 'string') {
        try {
          dadosToken = JSON.parse(dadosToken)
        } catch (_) {
          dadosToken = null
        }
      }
      if (stToken < 200 || stToken >= 300) {
        const msg =
          dadosToken && dadosToken.error
            ? String(dadosToken.error)
            : 'Health Tracker recusou o handshake de confiança (HTTP ' + stToken + ').'
        return e.json(502, { error: msg })
      }
      token = String(
        (dadosToken && (dadosToken.token || dadosToken.session_token || dadosToken.access_token)) ||
          '',
      )
      if (!token) {
        return e.json(502, { error: 'Health Tracker não devolveu token de sessão no handshake.' })
      }
      HT_TOKEN_CACHE.token = token
      HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
    }

    // ----- Gravação do registro (passo 4), renovação única em 401/403 -----
    const chamarRecord = () => {
      const resp = $http.send({
        url: HT_BASE + '/backend/v1/trust/patients/' + encodeURIComponent(email) + '/records',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({
          collection: collection,
          professional_name: nomeProf,
          data: { tipo: tipo, payload: payload },
        }),
      })
      const st = resp.statusCode || resp.status || 0
      let dados = resp.json
      if (typeof dados === 'string') {
        try {
          dados = JSON.parse(dados)
        } catch (_) {
          dados = null
        }
      }
      return { status: st, dados: dados }
    }

    try {
      let r = chamarRecord()
      if (r.status === 401 || r.status === 403) {
        HT_TOKEN_CACHE.token = ''
        HT_TOKEN_CACHE.expiraEm = 0
        token = ''
        const ts2 = String(Date.now())
        const sig2 = $security.hs256(email + '|' + ts2, segredo)
        const respToken2 = $http.send({
          url: HT_BASE + '/backend/v1/trust/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, ts: ts2, sig: sig2 }),
        })
        const stToken2 = respToken2.statusCode || respToken2.status || 0
        let dadosToken2 = respToken2.json
        if (typeof dadosToken2 === 'string') {
          try {
            dadosToken2 = JSON.parse(dadosToken2)
          } catch (_) {
            dadosToken2 = null
          }
        }
        const token2 = String(
          (dadosToken2 &&
            (dadosToken2.token || dadosToken2.session_token || dadosToken2.access_token)) ||
            '',
        )
        if (token2 && stToken2 >= 200 && stToken2 < 300) {
          HT_TOKEN_CACHE.token = token2
          HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
          token = token2
          r = chamarRecord()
        }
      }

      if (r.status === 404) {
        console.log('[HealthTracker] record: cliente sem cadastro no Health Tracker — ' + email)
        return e.json(404, { error: 'Cliente sem cadastro no Health Tracker.' })
      }
      if (r.status < 200 || r.status >= 300) {
        const msg =
          r.dados && r.dados.error
            ? String(r.dados.error)
            : 'Health Tracker respondeu HTTP ' + r.status + '.'
        console.log('[HealthTracker] record: falha — HTTP ' + r.status + ': ' + msg)
        return e.json(502, { error: msg })
      }
      console.log('[HealthTracker] record: OK para ' + email)
      return e.json(200, { success: true, health_tracker: r.dados || {} })
    } catch (err) {
      console.log('[HealthTracker] record: erro inesperado:', err)
      return e.json(502, {
        error: (err && err.message) || 'Não foi possível gravar no Health Tracker agora.',
      })
    }
  },
  $apis.requireAuth(),
)
