migrate(
  (app) => {
    // 1. Obter coleções necessárias
    const fisioCol = app.findCollectionByNameOrId('avaliacoes_fisioterapia')
    const personalCol = app.findCollectionByNameOrId('avaliacoes_personal')
    const nutriCol = app.findCollectionByNameOrId('avaliacoes_nutricao')
    const medicoCol = app.findCollectionByNameOrId('avaliacoes_medico')
    const pacCol = app.findCollectionByNameOrId('pacientes')
    const consultasCol = app.findCollectionByNameOrId('consultas')
    const evolucoesCol = app.findCollectionByNameOrId('evolucoes')

    // 2. Adicionar relation field user_id -> users nas 4 coleções de avaliações
    const evalCollections = [fisioCol, personalCol, nutriCol, medicoCol]
    for (let i = 0; i < evalCollections.length; i++) {
      const col = evalCollections[i]
      if (!col.fields.getByName('user_id')) {
        col.fields.add(
          new RelationField({
            name: 'user_id',
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          }),
        )
      }
    }

    // 3. Adicionar profissional_responsavel_id em pacientes (opcional)
    if (!pacCol.fields.getByName('profissional_responsavel_id')) {
      pacCol.fields.add(
        new RelationField({
          name: 'profissional_responsavel_id',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // 4. Salvar adições de campos antes de configurar regras RLS
    for (let i = 0; i < evalCollections.length; i++) {
      app.save(evalCollections[i])
    }
    app.save(pacCol)

    // 5. Configurar regras RLS
    // Admin tem acesso irrestrito
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // Regras para avaliações:
    // Leitura: admin OU profissional dono (user_id = @request.auth.id) OU registros legados sem user_id definidos
    // Criação: aprovado e (admin OU @request.body.user_id = @request.auth.id)
    // Atualização / Deleção: admin OU user_id = @request.auth.id
    const evalReadRule = `${approvedCheck} && (${adminCheck} || user_id = '' || user_id = null || user_id = @request.auth.id)`
    const evalCreateRule = `${approvedCheck} && (${adminCheck} || @request.body.user_id = @request.auth.id)`
    const evalWriteRule = `${approvedCheck} && (${adminCheck} || user_id = @request.auth.id)`

    for (let i = 0; i < evalCollections.length; i++) {
      const col = evalCollections[i]
      col.listRule = evalReadRule
      col.viewRule = evalReadRule
      col.createRule = evalCreateRule
      col.updateRule = evalWriteRule
      col.deleteRule = evalWriteRule
      app.save(col)
    }

    // Regras para Consultas:
    // Profissional visualiza e gere apenas suas próprias consultas (user_id = @request.auth.id) ou consultas da clínica quando admin
    const consultaReadRule = `${approvedCheck} && (${adminCheck} || user_id = '' || user_id = null || user_id = @request.auth.id)`
    const consultaCreateRule = `${approvedCheck} && (${adminCheck} || @request.body.user_id = @request.auth.id)`
    const consultaWriteRule = `${approvedCheck} && (${adminCheck} || user_id = @request.auth.id)`

    consultasCol.listRule = consultaReadRule
    consultasCol.viewRule = consultaReadRule
    consultasCol.createRule = consultaCreateRule
    consultasCol.updateRule = consultaWriteRule
    consultasCol.deleteRule = consultaWriteRule
    app.save(consultasCol)

    // Regras para Evoluções:
    // Profissional vê e cria evoluções. Leitura ampla para continuidade clínica (ou se assinado por ele).
    // Atualização e exclusão respeitam o hook de documento fechado e pertencimento
    const evolucaoReadRule = `${approvedCheck}`
    const evolucaoCreateRule = `${approvedCheck} && (${adminCheck} || @request.body.assinado_por_user_id = @request.auth.id || @request.body.assinado_por_user_id = '' || @request.body.assinado_por_user_id = null)`
    const evolucaoWriteRule = `${approvedCheck} && (${adminCheck} || assinado_por_user_id = @request.auth.id || assinado_por_user_id = '' || assinado_por_user_id = null)`

    evolucoesCol.listRule = evolucaoReadRule
    evolucoesCol.viewRule = evolucaoReadRule
    evolucoesCol.createRule = evolucaoCreateRule
    evolucoesCol.updateRule = evolucaoWriteRule
    evolucoesCol.deleteRule = evolucaoWriteRule
    app.save(evolucoesCol)

    // Regras para Pacientes:
    // Todos os profissionais ativos leem os pacientes da clínica para permitir atendimentos multidisciplinares e novos registros
    // Profissionais podem criar novos pacientes (status Ativo ou Pré-cadastro)
    // Atualização liberada para acompanhamento clínico
    const pacReadRule = `${approvedCheck}`
    const pacCreateRule = `${approvedCheck} || @request.body.status = 'Pré-cadastro'`
    const pacUpdateRule = `${approvedCheck}`
    const pacDeleteRule = `${approvedCheck} && (${adminCheck})` // Apenas admin pode excluir pacientes

    pacCol.listRule = pacReadRule
    pacCol.viewRule = pacReadRule
    pacCol.createRule = pacCreateRule
    pacCol.updateRule = pacUpdateRule
    pacCol.deleteRule = pacDeleteRule
    app.save(pacCol)
  },
  (app) => {
    // Reverter regras básicas
    const approvedRule = "@request.auth.id != '' && @request.auth.access_status = 'approved'"
    const baseCols = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
      'consultas',
      'evolucoes',
      'pacientes',
    ]

    for (let i = 0; i < baseCols.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(baseCols[i])
        col.listRule = approvedRule
        col.viewRule = approvedRule
        col.createRule =
          baseCols[i] === 'pacientes'
            ? approvedRule + " || @request.body.status = 'Pré-cadastro'"
            : approvedRule
        col.updateRule = approvedRule
        col.deleteRule = approvedRule
        app.save(col)
      } catch (_) {}
    }
  },
)
