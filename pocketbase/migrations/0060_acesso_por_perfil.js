/**
 * 0060 — Acesso por perfil (ADM / Secretária / Profissional)
 *
 * - Campo `role` no usuário. Valores: adm | secretaria | profissional + legados
 *   admin | professional (os hooks user_access_lifecycle / auth_access_enforcement /
 *   admin_access_manage continuam gravando os legados até a rodada de frontend).
 * - Usuários já existentes viram ADM — acesso total, como hoje.
 * - Novas coleções de vínculo:
 *     · vinculos_pacientes      — designação paciente ↔ profissional (feita por ADM/Secretária)
 *     · prontuarios_liberados   — liberação de prontuário (paciente) para um profissional
 *   Par único garantido por UNIQUE INDEX em SQL puro (profissional_id, paciente_id).
 * - Regras de API (list/view/create/update/delete) filtrando no BACKEND:
 *     ADM e Secretária: acesso total. Profissional: somente o dele.
 * - Coleções de usuário: gestão de usuários liberada para ADM/Secretária; o próprio
 *   usuário NÃO pode reescrever role/access_status de si mesmo (`:changed`).
 * - viewRule de programa_acompanhamento preserva o acesso anônimo por token (link público).
 *
 * Idempotente: todos os passos verificam estado anterior antes de aplicar.
 */
migrate(
  (app) => {
    const admSec =
      "@request.auth.role = 'adm' || @request.auth.role = 'admin' || @request.auth.role = 'secretaria' || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com'"
    const approved = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // --------------------------------------------------------------------
    // 1. Campo `role` no usuário
    // --------------------------------------------------------------------
    const usersCol = app.findCollectionByNameOrId('users')
    // Legados 'admin'/'professional' mantidos: os hooks do ciclo de acesso ainda os gravam.
    const ROLE_VALUES = ['admin', 'adm', 'secretaria', 'professional', 'profissional']
    // Substitui sempre o campo por um SelectField novo com os values explícitos
    // (mutar o campo existente lido do schema live perde os values na validação).
    if (usersCol.fields.getByName('role')) {
      usersCol.fields.removeByName('role')
    }
    usersCol.fields.add(
      new SelectField({
        name: 'role',
        values: ROLE_VALUES,
        maxSelect: 1,
      }),
    )
    app.save(usersCol)

    // Backfill: TODOS os usuários existentes viram ADM (mantém acesso total como hoje;
    // o ADM pode rebaixar perfis depois na Gestão de usuários).
    const todosUsuarios = app.findRecordsByFilter('users', "id != ''", '', 0, 0)
    for (let i = 0; i < todosUsuarios.length; i++) {
      const u = todosUsuarios[i]
      if (u.getString('role') !== 'adm') {
        u.set('role', 'adm')
        app.save(u)
      }
    }

    // Regras da coleção de usuários: ADM/Secretária gerenciam (listar/ver/editar);
    // usuário comum mantém acesso ao próprio perfil, mas NÃO pode alterar
    // role nem access_status de si mesmo. A regra de CREATE NÃO é alterada
    // (o signup público é controlado pelo hook user_access_lifecycle).
    usersCol.listRule = `(${admSec}) || id = @request.auth.id`
    usersCol.viewRule = `(${admSec}) || id = @request.auth.id`
    usersCol.updateRule = `(${admSec}) || (id = @request.auth.id && @request.body.role:changed = false && @request.body.access_status:changed = false)`
    usersCol.deleteRule = admSec
    app.save(usersCol)

    // --------------------------------------------------------------------
    // 2. Coleção vinculos_pacientes (designação paciente ↔ profissional)
    // --------------------------------------------------------------------
    const pacCol = app.findCollectionByNameOrId('pacientes')
    let vincCol
    try {
      vincCol = app.findCollectionByNameOrId('vinculos_pacientes')
    } catch (_) {
      vincCol = null
    }
    if (!vincCol) {
      vincCol = new Collection({
        name: 'vinculos_pacientes',
        type: 'base',
        listRule: `(${admSec}) || profissional_id = @request.auth.id`,
        viewRule: `(${admSec}) || profissional_id = @request.auth.id`,
        createRule: admSec,
        updateRule: admSec,
        deleteRule: admSec,
        fields: [
          {
            name: 'profissional_id',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'paciente_id',
            type: 'relation',
            required: true,
            collectionId: pacCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_vinculos_pacientes_unica ON vinculos_pacientes (profissional_id, paciente_id)',
        ],
      })
      app.save(vincCol)
    }

    // --------------------------------------------------------------------
    // 3. Coleção prontuarios_liberados (liberação de prontuário ao profissional)
    // --------------------------------------------------------------------
    let libCol
    try {
      libCol = app.findCollectionByNameOrId('prontuarios_liberados')
    } catch (_) {
      libCol = null
    }
    if (!libCol) {
      libCol = new Collection({
        name: 'prontuarios_liberados',
        type: 'base',
        listRule: `(${admSec}) || profissional_id = @request.auth.id`,
        viewRule: `(${admSec}) || profissional_id = @request.auth.id`,
        createRule: admSec,
        updateRule: admSec,
        deleteRule: admSec,
        fields: [
          {
            name: 'profissional_id',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'paciente_id',
            type: 'relation',
            required: true,
            collectionId: pacCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_prontuarios_liberados_unica ON prontuarios_liberados (profissional_id, paciente_id)',
        ],
      })
      app.save(libCol)
    }

    // --------------------------------------------------------------------
    // 4. Consultas — profissional só a agenda dele; ADM/Secretária tudo
    // --------------------------------------------------------------------
    const conCol = app.findCollectionByNameOrId('consultas')
    conCol.listRule = `${approved} && ((${admSec}) || user_id = @request.auth.id || user_id = '' || user_id = null)`
    conCol.viewRule = conCol.listRule
    conCol.createRule = `${approved} && ((${admSec}) || @request.body.user_id = @request.auth.id)`
    conCol.updateRule = `${approved} && ((${admSec}) || user_id = @request.auth.id || user_id = '' || user_id = null)`
    conCol.deleteRule = conCol.updateRule
    app.save(conCol)

    // --------------------------------------------------------------------
    // 5. Avaliações (prontuários) — profissional vê o que construiu
    //    ou o que foi LIBERADO para ele; ADM/Secretária tudo
    // --------------------------------------------------------------------
    const avalRead = `${approved} && ((${admSec}) || user_id = @request.auth.id || user_id = '' || user_id = null || (@collection.prontuarios_liberados.paciente_id ?= paciente_id && @collection.prontuarios_liberados.profissional_id ?= @request.auth.id))`
    const avalCreate = `${approved} && ((${admSec}) || @request.body.user_id = @request.auth.id)`
    const avalWrite = `${approved} && ((${admSec}) || user_id = @request.auth.id || user_id = '' || user_id = null)`
    const avalCols = [
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
    ]
    for (let i = 0; i < avalCols.length; i++) {
      const col = app.findCollectionByNameOrId(avalCols[i])
      col.listRule = avalRead
      col.viewRule = avalRead
      col.createRule = avalCreate
      col.updateRule = avalWrite
      col.deleteRule = avalWrite
      app.save(col)
    }

    // --------------------------------------------------------------------
    // 6. Evoluções — profissional vê as assinadas por ele (e legadas sem
    //    assinatura); ADM/Secretária tudo
    // --------------------------------------------------------------------
    try {
      const evoCol = app.findCollectionByNameOrId('evolucoes')
      evoCol.listRule = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id || assinado_por_user_id = '' || assinado_por_user_id = null)`
      evoCol.viewRule = evoCol.listRule
      evoCol.createRule = `${approved} && ((${admSec}) || @request.body.assinado_por_user_id = @request.auth.id || @request.body.assinado_por_user_id = '' || @request.body.assinado_por_user_id = null)`
      evoCol.updateRule = `${approved} && ((${admSec}) || assinado_por_user_id = @request.auth.id || assinado_por_user_id = '' || assinado_por_user_id = null)`
      evoCol.deleteRule = evoCol.updateRule
      app.save(evoCol)
    } catch (_) {}

    // --------------------------------------------------------------------
    // 7. Pacientes — profissional vê somente os designados a ele
    //    (via responsável direto ou vínculo); ADM/Secretária tudo
    // --------------------------------------------------------------------
    const pacRead = `${approved} && ((${admSec}) || profissional_responsavel_id = @request.auth.id || (@collection.vinculos_pacientes.paciente_id ?= id && @collection.vinculos_pacientes.profissional_id ?= @request.auth.id))`
    pacCol.listRule = pacRead
    pacCol.viewRule = pacRead
    pacCol.createRule = `${approved} || @request.body.status = 'Pré-cadastro'`
    pacCol.updateRule = approved
    pacCol.deleteRule = `${approved} && (${admSec})`
    app.save(pacCol)

    // --------------------------------------------------------------------
    // 8. Presenças — profissional vê/opera somente as dele (profissional_id)
    // --------------------------------------------------------------------
    try {
      const preCol = app.findCollectionByNameOrId('presencas')
      if (preCol.fields.getByName('profissional_id')) {
        const preRead = `${approved} && ((${admSec}) || profissional_id = @request.auth.id)`
        preCol.listRule = preRead
        preCol.viewRule = preRead
        preCol.createRule = `${approved} && ((${admSec}) || @request.body.profissional_id = @request.auth.id)`
        preCol.updateRule = preRead
        preCol.deleteRule = preRead
        app.save(preCol)
      }
    } catch (_) {}

    // --------------------------------------------------------------------
    // 9. Programas de acompanhamento — profissional só os que ele construiu
    //    (profissional_id) ou os de pacientes sem responsável designado.
    //    A viewRule preserva o acesso anônimo por token (link público do
    //    ProgramaVersaoCliente usa getProgramaByToken sem auth).
    // --------------------------------------------------------------------
    try {
      const progCol = app.findCollectionByNameOrId('programa_acompanhamento')
      if (progCol.fields.getByName('profissional_id')) {
        const progRead = `${approved} && ((${admSec}) || profissional_id = @request.auth.id || profissional_id = '' || profissional_id = null || paciente_id.profissional_responsavel_id = @request.auth.id)`
        progCol.listRule = progRead
        progCol.viewRule = `token_compartilhamento != '' || (${approved} && ((${admSec}) || profissional_id = @request.auth.id || profissional_id = '' || profissional_id = null || paciente_id.profissional_responsavel_id = @request.auth.id))`
        progCol.createRule = `${approved} && ((${admSec}) || @request.body.profissional_id = @request.auth.id || @request.body.profissional_id = '' || @request.body.profissional_id = null)`
        progCol.updateRule = progRead
        progCol.deleteRule = progRead
        app.save(progCol)
      }
    } catch (_) {}
  },
  (app) => {
    // Reverter: volta às regras amplas de aprovados; mantém coleções de vínculo.
    // users volta às regras anteriores (create público permanece intacto).
    const approvedRule = "@request.auth.id != '' && @request.auth.access_status = 'approved'"
    const cols = [
      'pacientes',
      'consultas',
      'evolucoes',
      'presencas',
      'programa_acompanhamento',
      'avaliacoes_fisioterapia',
      'avaliacoes_personal',
      'avaliacoes_nutricao',
      'avaliacoes_medico',
    ]
    for (let i = 0; i < cols.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(cols[i])
        col.listRule = approvedRule
        col.viewRule = approvedRule
        col.createRule = approvedRule
        col.updateRule = approvedRule
        col.deleteRule = approvedRule
        app.save(col)
      } catch (_) {}
    }
    try {
      const usersCol = app.findCollectionByNameOrId('users')
      const oldUserRule =
        "id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      usersCol.listRule = oldUserRule
      usersCol.viewRule = oldUserRule
      usersCol.updateRule = oldUserRule
      usersCol.deleteRule =
        "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
      app.save(usersCol)
    } catch (_) {}
  },
)
