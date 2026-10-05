migrate(
  (app) => {
    // 1. Criar coleção clinical_update_logs
    // Regras:
    // listRule / viewRule: só admin vê tudo; profissional vê apenas os próprios logs (user_id = @request.auth.id)
    // createRule / updateRule / deleteRule: null (escrita e mutações apenas pelo backend via hooks)
    let logsCol
    try {
      logsCol = app.findCollectionByNameOrId('clinical_update_logs')
    } catch (_) {
      logsCol = new Collection({
        name: 'clinical_update_logs',
        type: 'base',
        listRule:
          "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin' || user_id = @request.auth.id",
        viewRule:
          "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin' || user_id = @request.auth.id",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'user_id', type: 'text', required: true },
          { name: 'user_name', type: 'text' },
          { name: 'user_email', type: 'text', required: true },
          {
            name: 'acao',
            type: 'select',
            required: true,
            values: ['criar', 'editar', 'concluir', 'assinar', 'evolucao_corretiva', 'excluir'],
            maxSelect: 1,
          },
          {
            name: 'tipo_entidade',
            type: 'select',
            required: true,
            values: ['avaliacao', 'prontuario', 'evolucao'],
            maxSelect: 1,
          },
          {
            name: 'especialidade',
            type: 'select',
            values: ['Fisioterapia', 'Personal', 'Nutrição', 'Médico', 'Geral'],
            maxSelect: 1,
          },
          { name: 'entidade_id', type: 'text', required: true },
          { name: 'paciente_id', type: 'text' },
          { name: 'paciente_nome', type: 'text' },
          { name: 'detalhes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cul_user ON clinical_update_logs (user_id)',
          'CREATE INDEX idx_cul_entidade ON clinical_update_logs (tipo_entidade, entidade_id)',
          'CREATE INDEX idx_cul_paciente ON clinical_update_logs (paciente_id)',
          'CREATE INDEX idx_cul_created ON clinical_update_logs (created DESC)',
        ],
      })
      app.save(logsCol)
    }

    // 2. Criar coleção notifications
    // Regras:
    // listRule / viewRule: usuário dono vê suas notificações (@request.auth.id = user_id) ou admin mestre
    // updateRule: usuário dono pode marcar como lida (@request.auth.id = user_id || admin)
    // createRule: null (apenas backend/hooks criam notificações)
    // deleteRule: @request.auth.id = user_id || admin
    let notifCol
    try {
      notifCol = app.findCollectionByNameOrId('notifications')
    } catch (_) {
      notifCol = new Collection({
        name: 'notifications',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin')",
        viewRule:
          "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin')",
        createRule: null,
        updateRule:
          "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin')",
        deleteRule:
          "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin')",
        fields: [
          { name: 'user_id', type: 'text', required: true },
          { name: 'titulo', type: 'text', required: true },
          { name: 'descricao', type: 'text' },
          {
            name: 'tipo',
            type: 'select',
            values: ['clinical_update', 'access_request', 'system'],
            maxSelect: 1,
          },
          { name: 'lida', type: 'bool' },
          { name: 'link', type: 'text' },
          { name: 'metadata', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_notif_user ON notifications (user_id, lida)',
          'CREATE INDEX idx_notif_created ON notifications (created DESC)',
        ],
      })
      app.save(notifCol)
    }
  },
  (app) => {
    try {
      const logsCol = app.findCollectionByNameOrId('clinical_update_logs')
      app.delete(logsCol)
    } catch (_) {}
    try {
      const notifCol = app.findCollectionByNameOrId('notifications')
      app.delete(notifCol)
    } catch (_) {}
  },
)
