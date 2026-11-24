/**
 * Hook — Integração de confiança com o app Health Tracker da clínica
 * (outro projeto Skip).
 *
 * REGRAS DO DONO (contrato do Health Tracker — auditado item a item):
 *   (R1) O header de autenticação é "Authorization: <token>" — SEM a palavra
 *        "Bearer". Nenhum envio aqui usa prefixo.
 *   (R2) A assinatura é sempre sobre "email|ts" (barra vertical), com ts em
 *        MILISSEGUNDOs enviado como STRING (ex.: "1732345600000"). O HMAC é
 *        SHA-256 em HEXADECIMAL minúsculo ($security.hs256 → fmt.Sprintf("%x")
 *        na fonte Go do PocketBase). Tolerância do outro lado: 5 minutos — o
 *        token de sessão é renovado a cada 4 min e o ts é sempre fresco.
 *   (R3) Toda gravação cria REGISTRO NOVO — nunca PATCH/PUT/sobrescrita do que
 *        o cliente já lançou. A única chamada de gravação é POST .../records.
 *   (R4) Coleções graváveis (whitelist): health_metrics, medical_records,
 *        emotional_logs, diets, reminders, medications, profile_biomarkers e
 *        as de condições/alergias/vacinas/eventos/genética/profissionais/estilo
 *        de vida (conditions, allergies, vaccines, events, genetics,
 *        professionals, lifestyle). "exams" é SOMENTE LEITURA: tentativa de
 *        gravar nele (ou em qualquer coleção fora da lista) é RECUSADA aqui,
 *        com mensagem clara, SEM chamar o Health Tracker.
 *   (R5) Cada tela do profissional manda o E-MAIL do cliente na URL e o NOME
 *        do profissional no corpo (professional_name) — é o que identifica a
 *        origem como "via app institucional" no Health Tracker.
 *
 * API de confiança do outro projeto:
 *   (1) POST /backend/v1/trust/token  {email, ts, sig} → token de sessão;
 *   (2) GET  /backend/v1/trust/patients/{email}/summary → resumo do cliente;
 *   (3) POST /backend/v1/trust/patients/{email}/records
 *       {collection, professional_name, data} → cria registro novo.
 *
 * O SEGREDO NUNCA vai ao frontend: este hook assina, troca o token e repassa
 * os dados. O frontend chama apenas as rotas internas deste projeto:
 *   GET  /backend/v1/healthtracker/summary?cliente=<saude_clientes.id>
 *   POST /backend/v1/healthtracker/record  {cliente_id, collection, tipo, payload, professional_name}
 *
 * Segurança de acesso (não pode regredir): o profissional só acessa clientes
 * designados a ele em vinculos_pacientes (paciente_id do saude_clientes —
 * mesmo padrão da migration 0064); ADM/Secretária acessam todos.
 *
 * Segredo: lido primeiro do nome canônico INSTITUTIONAL_TRUST_SECRET e depois
 * de "NSTITUTIONAL_TRUST_SECRET" (nome como já chegou a ficar gravado no painel
 * deste projeto, sem o "I" inicial). Sem nenhum dos dois, a rota responde 503
 * com erro claro. Os logs registram qual NOME foi usado (nunca o valor).
 *
 * RASTREAMENTO: tudo com o prefixo "[HealthTracker]" no stream hooks — email,
 * ts enviado, tamanho da sig, status HTTP e corpo (truncado) das respostas do
 * trust/token e do summary/records. Assim, uma 401 futura diz nos logs se foi
 * recusa de ASSINATURA (mensagem "Assinatura inválida") ou de TS FORA DA
 * TOLERÂNCIA (mensagem de timestamp), além de qual segredo foi usado.
 *
 * IMPORTANTE (JSVM do PocketBase): callbacks de rota rodam num pool de VMs
 * separado — NADA do topo do arquivo (const/function) é visível dentro dos
 * callbacks. Por isso toda a lógica, constantes e helpers estão INLINE nos
 * callbacks, inclusive o cache de token (objeto criado dentro de cada
 * callback; se o pool não compartilhar estado entre requests, o efeito é
 * apenas refazer o handshake — nunca um erro).
 */

/* ------------------------------------------------------------------ */
/* Rota 1 — resumo (somente leitura)                                   */
/* GET /backend/v1/healthtracker/summary?cliente=<id>                  */
/* ------------------------------------------------------------------ */
routerAdd(
  'GET',
  '/backend/v1/healthtracker/summary',
  (e) => {
    const HT_BASE = 'https://clinica-soul-health-tracker-333e7.shrd01.internal.goskip.dev'
    const HT_TOKEN_TTL_MS = 4 * 60 * 1000 // renova antes da tolerância de 5 min (regra R2)
    const HT_TOKEN_CACHE = { token: '', expiraEm: 0 }
    const LOG_MAX = 300 // corpo truncado nas respostas registradas

    // Corpo (ou objeto) truncado para o log — nunca registra valores de segredo.
    const truncar = (v) => {
      let s = ''
      try {
        s = typeof v === 'string' ? v : JSON.stringify(v)
      } catch (_) {
        s = String(v)
      }
      if (!s) s = ''
      return s.length > LOG_MAX ? s.slice(0, LOG_MAX) + '…[truncado]' : s
    }

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

    // ----- E-mail do cliente no Health Tracker (regra R5: vai na URL) -----
    const email = (cliente.getString('email') || '').toLowerCase().trim()
    if (!email) {
      return e.json(400, {
        error:
          'Este cliente não tem e-mail cadastrado — não é possível buscar os dados do Health Tracker.',
      })
    }

    // ----- Handshake de confiança (regras R1 e R2) -----
    const nomeCanonico = 'INSTITUTIONAL_TRUST_SECRET'
    const nomeGravado = 'NSTITUTIONAL_TRUST_SECRET' // nome já visto no painel (sem o "I")
    const valorCanonico = String($os.getenv(nomeCanonico) || '').trim()
    const valorGravado = String($os.getenv(nomeGravado) || '').trim()
    const nomeUsado = valorCanonico ? nomeCanonico : nomeGravado
    const segredo = valorCanonico || valorGravado
    console.log(
      '[HealthTracker] summary: segredo lido de "' +
        nomeUsado +
        '" (presente=' +
        Boolean(segredo) +
        ')',
    )
    if (!segredo) {
      return e.json(503, {
        error:
          'Integração com o Health Tracker não configurada: variável INSTITUTIONAL_TRUST_SECRET ausente.',
      })
    }

    // Executa o handshake: sig = hex minúsculo de "email|ts" com ts STRING em ms.
    const fazerHandshake = () => {
      const ts = String(Date.now()) // regra R2: milissegundos como STRING
      let sig
      try {
        sig = String($security.hs256(email + '|' + ts, segredo))
      } catch (errHmac) {
        console.log('[HealthTracker] summary: falha ao gerar HMAC:', errHmac)
        return { erro: 'Falha ao gerar a assinatura de confiança para o Health Tracker.' }
      }
      console.log(
        '[HealthTracker] summary: trust/token — email=' +
          email +
          ' ts=' +
          ts +
          ' (string de ms) sig_len=' +
          sig.length +
          ' (esperado 64 hex minúsculo) signed="email|ts"',
      )
      let respToken
      try {
        respToken = $http.send({
          url: HT_BASE + '/backend/v1/trust/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, ts: ts, sig: sig }),
        })
      } catch (errHttp) {
        console.log('[HealthTracker] summary: falha de rede no handshake:', errHttp)
        return { erro: 'Health Tracker indisponível (handshake).' }
      }
      const st = respToken.statusCode || respToken.status || 0
      let dados = respToken.json
      if (typeof dados === 'string') {
        try {
          dados = JSON.parse(dados)
        } catch (_) {
          dados = null
        }
      }
      console.log(
        '[HealthTracker] summary: trust/token respondeu — status=' +
          st +
          ' corpo=' +
          truncar(dados),
      )
      const token = String(
        (dados && (dados.token || dados.session_token || dados.access_token)) || '',
      )
      if (st < 200 || st >= 300 || !token) {
        const msg =
          dados && dados.error
            ? String(dados.error)
            : 'Health Tracker recusou o handshake de confiança (HTTP ' + st + ').'
        console.log('[HealthTracker] summary: handshake RECUSADO — HTTP ' + st + ': ' + msg)
        return { erro: msg }
      }
      console.log('[HealthTracker] summary: handshake OK (token recebido).')
      return { token: token }
    }

    let token = ''
    if (HT_TOKEN_CACHE.token && Date.now() < HT_TOKEN_CACHE.expiraEm) {
      token = HT_TOKEN_CACHE.token
      console.log('[HealthTracker] summary: reusando token de sessão em cache.')
    } else {
      const hs = fazerHandshake()
      if (hs.erro) return e.json(502, { error: hs.erro })
      token = hs.token
      // Guarda um pouco menos que a tolerância de 5 min para nunca usar um
      // token cujo ts de emissão já saiu da janela.
      HT_TOKEN_CACHE.token = token
      HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
    }

    // ----- Chamada ao summary (somente leitura), com renovação única em 401/403 -----
    const chamarSummary = () => {
      const resp = $http.send({
        url: HT_BASE + '/backend/v1/trust/patients/' + encodeURIComponent(email) + '/summary',
        method: 'GET',
        // Regra R1: Authorization SEM a palavra "Bearer".
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

    const renovarToken = () => {
      const hs = fazerHandshake()
      if (hs.erro || !hs.token) return false
      HT_TOKEN_CACHE.token = hs.token
      HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
      token = hs.token
      return true
    }

    try {
      let r = chamarSummary()
      if (r.status === 401 || r.status === 403) {
        // Token possivelmente expirado: invalida o cache, refaz o handshake
        // UMA vez e tenta de novo.
        console.log(
          '[HealthTracker] summary: summary recusou (HTTP ' +
            r.status +
            ', corpo=' +
            truncar(r.dados) +
            ') — renovando handshake uma vez…',
        )
        HT_TOKEN_CACHE.token = ''
        HT_TOKEN_CACHE.expiraEm = 0
        token = ''
        if (renovarToken()) {
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
        console.log(
          '[HealthTracker] summary: falha — HTTP ' + r.status + ' corpo=' + truncar(r.dados),
        )
        return e.json(502, { error: msg })
      }
      console.log('[HealthTracker] summary: OK para ' + email + ' — corpo=' + truncar(r.dados, 200))
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
/* Rota 2 — registro (gravação)                                        */
/* POST /backend/v1/healthtracker/record                               */
/* Body: { cliente_id, collection, tipo, payload, professional_name }  */
/* ------------------------------------------------------------------ */
routerAdd(
  'POST',
  '/backend/v1/healthtracker/record',
  (e) => {
    const HT_BASE = 'https://clinica-soul-health-tracker-333e7.shrd01.internal.goskip.dev'
    const HT_TOKEN_TTL_MS = 4 * 60 * 1000
    const HT_TOKEN_CACHE = { token: '', expiraEm: 0 }
    const LOG_MAX = 300

    const truncar = (v) => {
      let s = ''
      try {
        s = typeof v === 'string' ? v : JSON.stringify(v)
      } catch (_) {
        s = String(v)
      }
      if (!s) s = ''
      return s.length > LOG_MAX ? s.slice(0, LOG_MAX) + '…[truncado]' : s
    }

    /* ----- Whitelist de coleções graváveis (regra R4 do dono) -----
     * health_metrics, medical_records, emotional_logs, diets, reminders,
     * medications, profile_biomarkers + condições/alergias/vacinas/eventos/
     * genética/profissionais/estilo de vida. "exams" é SOMENTE LEITURA. */
    const COLECOES_GRAVAVEIS = {
      health_metrics: true,
      medical_records: true,
      emotional_logs: true,
      diets: true,
      reminders: true,
      medications: true,
      profile_biomarkers: true,
      conditions: true,
      allergies: true,
      vaccines: true,
      events: true,
      genetics: true,
      professionals: true,
      lifestyle: true,
    }

    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária.')

    const role = auth.getString('role') || ''
    const authEmail = (auth.getString('email') || '').toLowerCase().trim()

    const body = e.requestInfo().body || {}
    const clienteId = String(body.cliente_id || '')
    const collection = String(body.collection || '')
      .toLowerCase()
      .trim()
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

    // ----- Whitelist (regra R4): recusa ANTES de qualquer chamada externa -----
    if (!COLECOES_GRAVAVEIS[collection]) {
      const msg =
        collection === 'exams'
          ? 'A coleção "exams" é somente leitura no Health Tracker — gravação recusada (regra da clínica: exames enviados pela clínica vão em medical_records).'
          : 'A coleção "' +
            collection +
            '" não é permitida para gravação no Health Tracker. Permitidas: health_metrics, medical_records, emotional_logs, diets, reminders, medications, profile_biomarkers, conditions, allergies, vaccines, events, genetics, professionals, lifestyle.'
      console.log('[HealthTracker] record: RECUSADO pela whitelist — collection=' + collection)
      return e.json(400, { error: msg })
    }
    // Gravação é sempre POST de registro novo (regra R3) — este hook nunca
    // faz PATCH/PUT nem apaga nada no Health Tracker.

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

    // ----- E-mail do cliente na URL (regra R5) + nome no corpo -----
    const email = (cliente.getString('email') || '').toLowerCase().trim()
    if (!email) {
      return e.json(400, {
        error: 'Este cliente não tem e-mail cadastrado — não é possível gravar no Health Tracker.',
      })
    }

    const nomeProf = professionalName || auth.getString('name') || ''
    if (!nomeProf) {
      return e.json(400, {
        error:
          'Nome do profissional ausente — o Health Tracker exige professional_name para identificar a origem do registro.',
      })
    }
    console.log(
      '[HealthTracker] record: origem — email_na_url=' +
        email +
        ' professional_name_no_corpo=' +
        nomeProf,
    )

    // ----- Handshake de confiança (regras R1 e R2) -----
    const nomeCanonico = 'INSTITUTIONAL_TRUST_SECRET'
    const nomeGravado = 'NSTITUTIONAL_TRUST_SECRET' // nome já visto no painel (sem o "I")
    const valorCanonico = String($os.getenv(nomeCanonico) || '').trim()
    const valorGravado = String($os.getenv(nomeGravado) || '').trim()
    const nomeUsado = valorCanonico ? nomeCanonico : nomeGravado
    const segredo = valorCanonico || valorGravado
    console.log(
      '[HealthTracker] record: segredo lido de "' +
        nomeUsado +
        '" (presente=' +
        Boolean(segredo) +
        ')',
    )
    if (!segredo) {
      return e.json(503, {
        error:
          'Integração com o Health Tracker não configurada: variável INSTITUTIONAL_TRUST_SECRET ausente.',
      })
    }

    const fazerHandshake = () => {
      const ts = String(Date.now()) // regra R2: milissegundos como STRING
      let sig
      try {
        sig = String($security.hs256(email + '|' + ts, segredo))
      } catch (errHmac) {
        console.log('[HealthTracker] record: falha ao gerar HMAC:', errHmac)
        return { erro: 'Falha ao gerar a assinatura de confiança para o Health Tracker.' }
      }
      console.log(
        '[HealthTracker] record: trust/token — email=' +
          email +
          ' ts=' +
          ts +
          ' (string de ms) sig_len=' +
          sig.length +
          ' (esperado 64 hex minúsculo) signed="email|ts"',
      )
      let respToken
      try {
        respToken = $http.send({
          url: HT_BASE + '/backend/v1/trust/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, ts: ts, sig: sig }),
        })
      } catch (errHttp) {
        console.log('[HealthTracker] record: falha de rede no handshake:', errHttp)
        return { erro: 'Health Tracker indisponível (handshake).' }
      }
      const st = respToken.statusCode || respToken.status || 0
      let dados = respToken.json
      if (typeof dados === 'string') {
        try {
          dados = JSON.parse(dados)
        } catch (_) {
          dados = null
        }
      }
      console.log(
        '[HealthTracker] record: trust/token respondeu — status=' + st + ' corpo=' + truncar(dados),
      )
      const token = String(
        (dados && (dados.token || dados.session_token || dados.access_token)) || '',
      )
      if (st < 200 || st >= 300 || !token) {
        const msg =
          dados && dados.error
            ? String(dados.error)
            : 'Health Tracker recusou o handshake de confiança (HTTP ' + st + ').'
        console.log('[HealthTracker] record: handshake RECUSADO — HTTP ' + st + ': ' + msg)
        return { erro: msg }
      }
      console.log('[HealthTracker] record: handshake OK (token recebido).')
      return { token: token }
    }

    let token = ''
    if (HT_TOKEN_CACHE.token && Date.now() < HT_TOKEN_CACHE.expiraEm) {
      token = HT_TOKEN_CACHE.token
      console.log('[HealthTracker] record: reusando token de sessão em cache.')
    } else {
      const hs = fazerHandshake()
      if (hs.erro) return e.json(502, { error: hs.erro })
      token = hs.token
      HT_TOKEN_CACHE.token = token
      HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
    }

    // ----- Gravação do registro (regras R1, R3 e R5) -----
    const chamarRecord = () => {
      const resp = $http.send({
        url: HT_BASE + '/backend/v1/trust/patients/' + encodeURIComponent(email) + '/records',
        method: 'POST', // sempre POST de registro novo — nunca PATCH/PUT (regra R3)
        // Regra R1: Authorization SEM a palavra "Bearer".
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({
          collection: collection,
          professional_name: nomeProf, // regra R5: nome no corpo
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

    const renovarToken = () => {
      const hs = fazerHandshake()
      if (hs.erro || !hs.token) return false
      HT_TOKEN_CACHE.token = hs.token
      HT_TOKEN_CACHE.expiraEm = Date.now() + HT_TOKEN_TTL_MS
      token = hs.token
      return true
    }

    try {
      let r = chamarRecord()
      if (r.status === 401 || r.status === 403) {
        console.log(
          '[HealthTracker] record: records recusou (HTTP ' +
            r.status +
            ', corpo=' +
            truncar(r.dados) +
            ') — renovando handshake uma vez…',
        )
        HT_TOKEN_CACHE.token = ''
        HT_TOKEN_CACHE.expiraEm = 0
        token = ''
        if (renovarToken()) {
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
        console.log(
          '[HealthTracker] record: falha — HTTP ' + r.status + ' corpo=' + truncar(r.dados),
        )
        return e.json(502, { error: msg })
      }
      console.log(
        '[HealthTracker] record: OK para ' +
          email +
          ' (collection=' +
          collection +
          ') — corpo=' +
          truncar(r.dados, 200),
      )
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
