migrate(
  (app) => {
    const adminCheck =
      "@request.auth.email = 'gcdealmeida@gmail.com' || @request.auth.email = 'guivemax@hotmail.com' || @request.auth.role = 'admin'"
    const approvedCheck = "@request.auth.id != '' && @request.auth.access_status = 'approved'"

    // Leitura: profissional aprovado vê os seus registros; admin vê todos
    const readRule = `${approvedCheck} && (${adminCheck} || profissional_id = @request.auth.id)`
    // Criação: qualquer profissional aprovado, desde que o registro seja dele
    const createRule = `${approvedCheck} && @request.body.profissional_id = @request.auth.id`
    // IMUTÁVEL: nenhuma atualização ou exclusão via API (nem para admin)
    const immutableRule = null

    const pacId = app.findCollectionByNameOrId('pacientes').id
    const usersId = '_pb_users_auth_'

    let col
    try {
      col = app.findCollectionByNameOrId('registros_atendimento')
      // Garante a regra de imutabilidade mesmo se a coleção já existir
      col.updateRule = immutableRule
      col.deleteRule = immutableRule
      app.save(col)
    } catch (_) {
      col = new Collection({
        name: 'registros_atendimento',
        type: 'base',
        listRule: readRule,
        viewRule: readRule,
        createRule: createRule,
        updateRule: immutableRule,
        deleteRule: immutableRule,
        fields: [
          {
            name: 'paciente_id',
            type: 'relation',
            required: true,
            collectionId: pacId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'profissional_id',
            type: 'relation',
            required: true,
            collectionId: usersId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          // Denormalizados para histórico, busca e exportação (o prontuário sobrevive a merge/exclusão)
          { name: 'paciente_nome', type: 'text' },
          { name: 'profissional_nome', type: 'text' },
          { name: 'profissional_especialidade', type: 'text' },
          { name: 'data_atendimento', type: 'date', required: true },
          { name: 'horario', type: 'text' },
          { name: 'area_servico', type: 'text' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Finalizada', 'Ausência', 'Desmarcada'],
            maxSelect: 1,
          },
          // Motivo / justificativa quando status = Desmarcada
          { name: 'motivo_desmarque', type: 'text' },
          // 'Completo' (EVA + Avaliação/Report + Conduta) ou 'Rápido' (Evolução e Descrição Geral)
          {
            name: 'modelo',
            type: 'select',
            required: true,
            values: ['Completo', 'Rápido'],
            maxSelect: 1,
          },
          // JSON array de EVAs: [{ queixa, valor, descricao }]
          { name: 'evaluacoes_dor', type: 'json', maxSize: 500000 },
          { name: 'avaliacao_report', type: 'text', maxSize: 20000 },
          { name: 'conduta_realizada', type: 'text', maxSize: 20000 },
          // Modelo Rápido: texto único
          { name: 'evolucao_descricao', type: 'text', maxSize: 20000 },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
        ],
        indexes: [
          'CREATE INDEX idx_regat_paciente ON registros_atendimento (paciente_id, data_atendimento DESC)',
          'CREATE INDEX idx_regat_profissional ON registros_atendimento (profissional_id, data_atendimento DESC)',
          'CREATE INDEX idx_regat_data ON registros_atendimento (data_atendimento DESC)',
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('registros_atendimento')
      app.delete(col)
    } catch (_) {}
  },
)
