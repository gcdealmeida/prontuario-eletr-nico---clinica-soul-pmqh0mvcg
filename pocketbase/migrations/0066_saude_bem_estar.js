/**
 * 0066 — Atividade "Saúde e Bem-Estar" (Clínica Soul + Cliente Soul).
 *
 * Coleções (PT-BR):
 * - saude_clientes: vínculo entre a conta de login do cliente (users, role 'cliente')
 *   e o cadastro do cliente de saúde (nome, e-mail, nascimento, observações).
 * - saude_registros: tudo o que o cliente registra (atividade física, sono, bebida,
 *   alimento, exame, sintoma). Uma só coleção: o painel da clínica lê a mesma linha.
 * - saude_orientacoes: orientações/dicas/desenvolvimento publicados pela clínica,
 *   para um cliente específico (cliente_id) ou para todos (cliente_id vazio).
 * - saude_lembretes: lembretes da clínica para o cliente.
 *
 * Perfis: ADM/Secretária/Profissional = equipe (staff). Cliente = role 'cliente'.
 * O cliente só lê o que é dele; só a equipe cria/edita cadastro, orientações e lembretes.
 * Criação de registro pelo cliente é validada no hook saude_registros_cliente.js
 * (a regra de API não consegue amarrar cliente_id ao próprio cadastro).
 */
migrate(
  (app) => {
    const staff =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && (@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.role = 'profissional' || @request.auth.role = 'professional' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com')"
    const cliente =
      "@request.auth.id != '' && @request.auth.access_status = 'approved' && @request.auth.role = 'cliente'"
    const usersId = '_pb_users_auth_'

    // 1. Novo perfil 'cliente' no campo role de users
    const usersCol = app.findCollectionByNameOrId('users')
    const roleField = usersCol.fields.getByName('role')
    if (roleField && roleField.values && !roleField.values.includes('cliente')) {
      roleField.values = [...roleField.values, 'cliente']
      app.save(usersCol)
    }

    // 2. saude_clientes
    const clientesCol = new Collection({
      name: 'saude_clientes',
      type: 'base',
      listRule: `${staff} || (${cliente} && user_id = @request.auth.id)`,
      viewRule: `${staff} || (${cliente} && user_id = @request.auth.id)`,
      createRule: staff,
      updateRule: staff,
      deleteRule: staff,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'data_nascimento', type: 'date' },
        { name: 'observacoes', type: 'text', maxSize: 20000 },
        {
          name: 'criado_por',
          type: 'relation',
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_saude_clientes_user ON saude_clientes (user_id)'],
    })
    app.save(clientesCol)
    const clientesId = app.findCollectionByNameOrId('saude_clientes').id

    // 3. saude_registros
    const registrosCol = new Collection({
      name: 'saude_registros',
      type: 'base',
      listRule: `${staff} || (${cliente} && cliente_id.user_id = @request.auth.id)`,
      viewRule: `${staff} || (${cliente} && cliente_id.user_id = @request.auth.id)`,
      // Cliente cria; a validação de posse do cadastro fica no hook.
      createRule: `${staff} || ${cliente}`,
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
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['atividade_fisica', 'sono', 'bebida', 'alimento', 'exame', 'sintoma'],
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'observacao', type: 'text', maxSize: 5000 },
        // Campos específicos do tipo (duração, qualidade, quantidade, resultado do exame...)
        { name: 'dados_json', type: 'json', maxSize: 100000 },
        {
          name: 'registrado_por',
          type: 'relation',
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_saude_registros_cliente ON saude_registros (cliente_id, data DESC)',
        'CREATE INDEX idx_saude_registros_tipo ON saude_registros (tipo)',
      ],
    })
    app.save(registrosCol)

    // 4. saude_orientacoes
    const orientacoesCol = new Collection({
      name: 'saude_orientacoes',
      type: 'base',
      listRule: `${staff} || (${cliente} && publicada = true && (cliente_id = '' || cliente_id.user_id = @request.auth.id))`,
      viewRule: `${staff} || (${cliente} && publicada = true && (cliente_id = '' || cliente_id.user_id = @request.auth.id))`,
      createRule: staff,
      updateRule: staff,
      deleteRule: staff,
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'texto', type: 'text', maxSize: 20000 },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['orientacao', 'dica', 'desenvolvimento_pessoal', 'exame'],
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        // Vazio = visível para todos os clientes de saúde
        {
          name: 'cliente_id',
          type: 'relation',
          collectionId: clientesId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'publicada', type: 'bool' },
        {
          name: 'publicada_por',
          type: 'relation',
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_saude_orientacoes_data ON saude_orientacoes (data DESC)'],
    })
    app.save(orientacoesCol)

    // 5. saude_lembretes
    const lembretesCol = new Collection({
      name: 'saude_lembretes',
      type: 'base',
      listRule: `${staff} || (${cliente} && cliente_id.user_id = @request.auth.id)`,
      viewRule: `${staff} || (${cliente} && cliente_id.user_id = @request.auth.id)`,
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
        { name: 'descricao', type: 'text', maxSize: 5000 },
        { name: 'data_hora', type: 'date', required: true },
        {
          name: 'repeticao',
          type: 'select',
          values: ['nenhuma', 'diaria', 'semanal', 'mensal'],
          maxSelect: 1,
        },
        {
          name: 'criado_por',
          type: 'relation',
          collectionId: usersId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_saude_lembretes_cliente ON saude_lembretes (cliente_id, data_hora)',
      ],
    })
    app.save(lembretesCol)
  },
  (app) => {
    for (const nome of [
      'saude_lembretes',
      'saude_orientacoes',
      'saude_registros',
      'saude_clientes',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
  },
)
