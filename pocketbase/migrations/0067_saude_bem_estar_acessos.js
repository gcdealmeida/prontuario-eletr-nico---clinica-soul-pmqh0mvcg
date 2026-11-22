/**
 * 0067 — Saúde & Bem-Estar: acessos, vínculo com paciente e desenvolvimento pessoal.
 *
 * Baseado na 0066. O que muda:
 * - saude_clientes ganha `paciente_id` (vínculo com o cadastro de pacientes — é por
 *   esse vínculo que o Profissional só vê os clientes de saúde designados a ele),
 *   `ativo` e `ultima_visita_clinica` (marca de "novo desde a última visita").
 * - Regras de leitura dos 4 collections de saúde passam a incluir o Profissional,
 *   limitado aos clientes com vínculo ativo em vinculos_pacientes (mesmo padrão da
 *   migration 0064). Escrita continua ADM/Secretária — Profissional é leitura.
 * - Nova coleção `saude_dev_pessoal`: metas/hábitos/desafios de desenvolvimento
 *   pessoal publicados pela clínica para o cliente acompanhar no app dele.
 *
 * Idempotente: campos só são adicionados se não existirem.
 */
migrate(
  (app) => {
    const staff =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && (@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com')"
    const prof =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && (@request.auth.role = 'profissional' || @request.auth.role = 'professional')"
    const cliente =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && @request.auth.role = 'cliente'"

    // Ramo de vínculo para saude_clientes (campo local paciente_id).
    const vincCli =
      '(@collection.vinculos_pacientes.paciente_id ?= paciente_id && @collection.vinculos_pacientes.profissional_id ?= @request.auth.id)'
    // Ramo de vínculo para registros/orientações/lembretes/dev (via cliente_id.paciente_id).
    const vincReg =
      '(@collection.vinculos_pacientes.paciente_id ?= cliente_id.paciente_id && @collection.vinculos_pacientes.profissional_id ?= @request.auth.id)'

    // ------------------------------------------------------------------
    // 1. Novos campos em saude_clientes
    // ------------------------------------------------------------------
    const clientesCol = app.findCollectionByNameOrId('saude_clientes')
    if (!clientesCol.fields.getByName('paciente_id')) {
      clientesCol.fields.add(
        new Field({
          type: 'relation',
          name: 'paciente_id',
          collectionId: app.findCollectionByNameOrId('pacientes').id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    if (!clientesCol.fields.getByName('ativo')) {
      clientesCol.fields.add(new Field({ type: 'bool', name: 'ativo' }))
    }
    if (!clientesCol.fields.getByName('ultima_visita_clinica')) {
      clientesCol.fields.add(new Field({ type: 'date', name: 'ultima_visita_clinica' }))
    }
    app.save(clientesCol)
    const clientesId = app.findCollectionByNameOrId('saude_clientes').id

    // ------------------------------------------------------------------
    // 2. Regras de leitura com ramo do Profissional (por vínculo)
    // ------------------------------------------------------------------
    const aplicar = (nome, list, view, create, update, del) => {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = list
      col.viewRule = view
      col.createRule = create
      col.updateRule = update
      col.deleteRule = del
      app.save(col)
    }

    const readClientes = `${staff} || (${prof} && ${vincCli}) || (${cliente} && user_id = @request.auth.id)`
    aplicar('saude_clientes', readClientes, readClientes, staff, `${staff} || ${prof}`, staff)

    const readRegistros = `${staff} || (${prof} && ${vincReg}) || (${cliente} && cliente_id.user_id = @request.auth.id)`
    aplicar('saude_registros', readRegistros, readRegistros, `${staff} || ${cliente}`, staff, staff)

    const readOrient =
      `${staff} || (${prof} && (cliente_id = '' || ${vincReg})) || ` +
      `(${cliente} && publicada = true && (cliente_id = '' || cliente_id.user_id = @request.auth.id))`
    aplicar('saude_orientacoes', readOrient, readOrient, staff, staff, staff)

    const readLemb = `${staff} || (${prof} && ${vincReg}) || (${cliente} && cliente_id.user_id = @request.auth.id)`
    aplicar('saude_lembretes', readLemb, readLemb, staff, staff, staff)

    // ------------------------------------------------------------------
    // 3. Nova coleção saude_dev_pessoal
    // ------------------------------------------------------------------
    try {
      app.findCollectionByNameOrId('saude_dev_pessoal')
    } catch (_) {
      const devCol = new Collection({
        name: 'saude_dev_pessoal',
        type: 'base',
        listRule: readLemb,
        viewRule: readLemb,
        createRule: staff,
        updateRule: staff,
        deleteRule: staff,
        fields: [
          {
            name: 'cliente_id',
            type: 'relation',
            required: true,
            collectionId: clientesId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'titulo', type: 'text', required: true },
          { name: 'descricao', type: 'text', maxSize: 20000 },
          {
            name: 'categoria',
            type: 'select',
            required: true,
            values: ['habito', 'meta', 'desafio'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['ativo', 'concluido'],
            maxSelect: 1,
          },
          { name: 'prazo', type: 'date' },
          { name: 'progresso', type: 'number', min: 0, max: 100 },
          {
            name: 'criado_por',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_saude_dev_cliente ON saude_dev_pessoal (cliente_id)'],
      })
      app.save(devCol)
    }
  },
  (app) => {
    // Reverte: remove saude_dev_pessoal e volta às regras da 0066 (sem ramo do Profissional).
    const staff =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && (@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.role = 'profissional' || @request.auth.role = 'professional' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com')"
    const cliente =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && @request.auth.role = 'cliente'"
    try {
      app.delete(app.findCollectionByNameOrId('saude_dev_pessoal'))
    } catch (_) {}
    const readClientes = `${staff} || (${cliente} && user_id = @request.auth.id)`
    const readRegistros = `${staff} || (${cliente} && cliente_id.user_id = @request.auth.id)`
    const readOrient =
      `${staff} || ` +
      `(${cliente} && publicada = true && (cliente_id = '' || cliente_id.user_id = @request.auth.id))`
    const regras = {
      saude_clientes: [readClientes, staff, staff, staff],
      saude_registros: [readRegistros, `${staff} || ${cliente}`, staff, staff],
      saude_orientacoes: [readOrient, staff, staff, staff],
      saude_lembretes: [readRegistros, staff, staff, staff],
    }
    for (const nome of Object.keys(regras)) {
      try {
        const col = app.findCollectionByNameOrId(nome)
        const r = regras[nome]
        col.listRule = r[0]
        col.viewRule = r[0]
        col.createRule = r[1]
        col.updateRule = r[2]
        col.deleteRule = r[3]
        app.save(col)
      } catch (_) {}
    }
  },
)
